import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, X, Loader2, Calendar, Users, DollarSign, Utensils, Music, Camera, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Wedding } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: Calendar, prompt: "Help with timeline" },
  { icon: Users, prompt: "Guest list tips" },
  { icon: DollarSign, prompt: "Budget advice" },
];

export function CouplePlannerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  // Load chat history from server
  const { data: chatHistoryData } = useQuery<{ history: Array<{ role: 'user' | 'assistant'; content: string }> }>({
    queryKey: [`/api/ai/chat/history/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  // Reset historyLoaded when wedding changes
  useEffect(() => {
    setHistoryLoaded(false);
  }, [wedding?.id]);

  // Initialize messages from history when loaded
  useEffect(() => {
    if (chatHistoryData?.history && !historyLoaded && wedding?.id) {
      setMessages(chatHistoryData.history.map(m => ({
        role: m.role,
        content: m.content,
      })));
      setHistoryLoaded(true);
    }
  }, [chatHistoryData, historyLoaded, wedding?.id]);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(async (message: string, currentHistory: ChatMessage[]) => {
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();
    
    // Add empty assistant message that we'll update with streamed content
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    
    try {
      const response = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message,
          conversationHistory: currentHistory.map(m => ({
            role: m.role,
            content: m.content,
          })),
          weddingContext: wedding ? {
            tradition: wedding.tradition,
            city: wedding.location,
            partner1Name: wedding.partner1Name,
            partner2Name: wedding.partner2Name,
            weddingDate: wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : undefined,
            budget: wedding.totalBudget ? parseFloat(wedding.totalBudget) : undefined,
            guestCount: wedding.guestCountEstimate,
          } : undefined,
          weddingId: wedding?.id,
          persistHistory: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullContent += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullContent };
                  return updated;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore parse errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: "assistant", 
          content: "I'm sorry, I couldn't process your question. Please try again." 
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [wedding]);

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!wedding?.id) return;
      await apiRequest("DELETE", `/api/ai/chat/history/${wedding.id}`);
    },
    onSuccess: () => {
      setMessages([]);
      setHistoryLoaded(false);
      queryClient.invalidateQueries({ queryKey: [`/api/ai/chat/history/${wedding?.id}`] });
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    streamChat(text, updatedHistory);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chatbotContent = !isOpen ? (
    <div 
      className="fixed z-[9999]"
      style={{
        bottom: '96px',
        right: '16px',
      }}
    >
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full h-12 px-4 shadow-xl bg-gradient-to-br from-primary to-primary/80 animate-pulse hover:animate-none hover:scale-105 transition-transform gap-2"
        data-testid="button-open-ai-planner"
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-medium">AI Planner</span>
      </Button>
    </div>
  ) : (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
        onClick={() => setIsOpen(false)}
      />
      
      <div 
        className="fixed z-[9999] bg-background flex flex-col
          inset-0 md:inset-auto
          md:bottom-6 md:right-6 
          md:w-[420px] md:max-w-[calc(100vw-48px)] 
          md:h-[550px] md:max-h-[80vh]
          md:rounded-lg md:shadow-xl md:border"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="flex items-center justify-between gap-2 py-3 px-4 border-b shrink-0 bg-gradient-to-r from-primary/10 to-transparent min-h-[56px]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Viah AI Planner</p>
              <p className="text-xs text-muted-foreground">Your wedding planning assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                title="Clear chat history"
                data-testid="button-clear-ai-chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-ai-planner"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center py-6 px-2">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg mb-1">Hi{wedding?.partner1Name ? `, ${wedding.partner1Name}` : ""}!</p>
              <p className="text-sm text-muted-foreground mb-6">
                I'm your AI wedding planner. Ask me anything about planning your {wedding?.tradition || "South Asian"} wedding!
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick topics</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((item) => (
                    <Button
                      key={item.prompt}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => sendMessage(item.prompt)}
                      data-testid={`button-quick-prompt-${item.prompt.slice(0, 10)}`}
                    >
                      <item.icon className="h-3 w-3" />
                      {item.prompt}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-2 text-left">
                {[
                  { icon: Utensils, text: "Catering tips for multi-day events" },
                  { icon: Music, text: "Sangeet and entertainment ideas" },
                  { icon: Camera, text: "Finding culturally-aware vendors" },
                  { icon: Calendar, text: "Multi-ceremony timeline planning" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => sendMessage(suggestion.text)}
                    className="p-3 rounded-lg border text-xs text-muted-foreground hover-elevate text-left flex items-start gap-2 transition-colors"
                    data-testid={`button-suggestion-${suggestion.text.slice(0, 15)}`}
                  >
                    <suggestion.icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary/70" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`chat-message-${i}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>table]:w-full [&>table]:text-xs [&>table]:border-collapse [&>table]:my-2 [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-border [&>table>thead>tr>th]:bg-muted [&>table>thead>tr>th]:px-2 [&>table>thead>tr>th]:py-1 [&>table>thead>tr>th]:text-left [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-border [&>table>tbody>tr>td]:px-2 [&>table>tbody>tr>td]:py-1 [&>table]:overflow-x-auto [&>table]:block [&>table]:max-w-full">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div 
          className="p-3 border-t flex gap-2 shrink-0 bg-background"
          style={{
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your wedding..."
            disabled={isStreaming}
            className="flex-1 h-11 text-base"
            data-testid="input-ai-planner-message"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-11 w-11 shrink-0"
            data-testid="button-send-ai-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(chatbotContent, document.body);
}
