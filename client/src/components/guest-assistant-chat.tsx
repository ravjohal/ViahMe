import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GuestAssistantContext {
  coupleName?: string;
  weddingDate?: string;
  submitterName?: string;
  currentStep?: string;
}

interface GuestAssistantChatProps {
  context?: GuestAssistantContext;
}

const QUICK_PROMPTS = [
  "I don't have their address",
  "Should I add children?",
  "What if I forget someone?",
  "I only know their nickname",
];

export function GuestAssistantChat({ context }: GuestAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/ai/guest-assistant", {
        message: userMessage,
        conversationHistory: chatHistory,
        context,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: () => {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble understanding. Could you try asking again?" },
      ]);
    },
  });

  const handleSend = (text?: string) => {
    const messageToSend = text || message.trim();
    if (!messageToSend || chatMutation.isPending) return;

    setChatHistory((prev) => [...prev, { role: "user", content: messageToSend }]);
    setMessage("");
    setShowQuickPrompts(false);
    chatMutation.mutate(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating chat button - mobile optimized with 48px touch target */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:h-12 md:w-auto md:rounded-full md:px-4"
          data-testid="button-guest-assistant-open"
        >
          <HelpCircle className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Need Help?</span>
        </Button>
      )}

      {/* Chat modal - full screen on mobile, floating card on desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-4 md:h-[500px] md:w-[380px]">
          {/* Mobile backdrop */}
          <div className="absolute inset-0 bg-background md:hidden" />

          <Card className="relative flex h-full flex-col overflow-hidden md:shadow-xl">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">ViahMe Assistant</CardTitle>
                  <p className="text-xs text-muted-foreground">Here to help!</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10"
                data-testid="button-guest-assistant-close"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            {/* Messages area */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-3 p-4">
                  {/* Welcome message */}
                  {chatHistory.length === 0 && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        Hi! I'm here to help you add guests. Ask me anything about what information is needed or how the form works.
                      </p>
                    </div>
                  )}

                  {/* Quick prompts */}
                  {showQuickPrompts && chatHistory.length === 0 && (
                    <div className="flex flex-col gap-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <Button
                          key={prompt}
                          variant="outline"
                          className="min-h-[48px] w-full justify-start whitespace-normal px-4 py-3 text-left text-base"
                          onClick={() => handleSend(prompt)}
                          disabled={chatMutation.isPending}
                          data-testid={`button-quick-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Chat messages */}
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                        data-testid={`text-chat-message-${index}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-muted px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input area - larger for mobile accessibility */}
            <div className="border-t p-3 pb-safe">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question..."
                  className="min-h-[48px] flex-1 text-base"
                  disabled={chatMutation.isPending}
                  data-testid="input-guest-assistant-message"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!message.trim() || chatMutation.isPending}
                  size="icon"
                  className="h-12 w-12"
                  data-testid="button-guest-assistant-send"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
