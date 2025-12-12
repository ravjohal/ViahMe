import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Send, User, Sparkles, Calendar, Users, DollarSign, MapPin, Lightbulb, RefreshCw, Loader2, Wand2, Heart, PartyPopper, Music, Camera, Utensils, Flower2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Wedding } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_TOPICS = [
  { icon: Calendar, label: "Timeline Planning", prompt: "Help me create a timeline for my wedding events" },
  { icon: Users, label: "Guest Management", prompt: "How should I organize my guest list for multiple events?" },
  { icon: DollarSign, label: "Budget Tips", prompt: "What's a realistic budget breakdown for a South Asian wedding?" },
  { icon: PartyPopper, label: "Sangeet Ideas", prompt: "What are some modern sangeet ideas that blend tradition?" },
  { icon: Camera, label: "Vendor Selection", prompt: "How do I find photographers experienced with South Asian weddings?" },
  { icon: Utensils, label: "Catering", prompt: "What should I consider when choosing caterers for multi-day events?" },
  { icon: Flower2, label: "Decorations", prompt: "What are popular decoration themes for South Asian weddings?" },
  { icon: Music, label: "Entertainment", prompt: "How do I balance traditional and modern music at my wedding?" },
];

export default function AiPlanner() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, currentHistory }: { message: string; currentHistory: ChatMessage[] }) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
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
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === "user") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    },
  });

  const handleSend = () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputMessage("");
    chatMutation.mutate({ message: userMessage.content, currentHistory: updatedHistory });
  };

  const handleSuggestedTopic = (prompt: string) => {
    const userMessage: ChatMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    chatMutation.mutate({ message: prompt, currentHistory: updatedHistory });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "Starting a fresh conversation",
    });
  };


  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Viah AI Planner
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Your expert South Asian wedding planning assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wedding && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mr-4">
              {wedding.tradition && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" />
                  {wedding.tradition}
                </span>
              )}
              {wedding.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {wedding.location}
                </span>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearChat}
              data-testid="button-clear-chat"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <Wand2 className="w-10 h-10 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Viah AI Planner</h2>
                <p className="text-muted-foreground mb-8 max-w-lg">
                  I'm your dedicated wedding planning assistant, specialized in South Asian weddings. 
                  Ask me anything about ceremonies, vendors, budgets, or cultural traditions!
                </p>

                <div className="w-full max-w-2xl">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Suggested Topics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {SUGGESTED_TOPICS.map((topic, idx) => (
                      <Card 
                        key={idx}
                        className="cursor-pointer hover-elevate transition-all"
                        onClick={() => handleSuggestedTopic(topic.prompt)}
                        data-testid={`card-topic-${idx}`}
                      >
                        <CardContent className="p-3 flex flex-col items-center text-center">
                          <topic.icon className="w-6 h-6 text-indigo-500 mb-2" />
                          <span className="text-xs font-medium">{topic.label}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}-${idx}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-2 [&>ol]:my-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h4]:text-sm">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <p className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-orange-500 text-white">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex gap-3 justify-start" data-testid="message-loading">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your wedding planning..."
                disabled={chatMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                data-testid="button-send-message"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Viah AI provides suggestions based on South Asian wedding traditions. 
              Always verify important details with your vendors and family.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
