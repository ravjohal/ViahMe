import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User } from "lucide-react";
import type { Message } from "@shared/schema";

// Demo wedding ID - In production, this would come from auth context
const DEMO_WEDDING_ID = "demo-wedding-1";

// Conversation metadata from API
interface ConversationWithMetadata {
  conversationId: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch conversations with vendor metadata for the wedding
  const { data: conversations = [] } = useQuery<ConversationWithMetadata[]>({
    queryKey: ["/api/conversations/wedding", DEMO_WEDDING_ID],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) return;
      
      const conversation = conversations.find(c => c.conversationId === selectedConversation);
      if (!conversation) throw new Error("Conversation not found");
      
      const response = await apiRequest("POST", "/api/messages", {
        // conversationId is generated server-side from weddingId + vendorId
        weddingId: conversation.weddingId,
        vendorId: conversation.vendorId,
        senderId: conversation.weddingId, // Demo: couple sends from weddingId
        senderType: "couple",
        content,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      setMessageText("");
    },
  });

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      sendMessageMutation.mutate(messageText);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-playfair font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your vendors about your wedding details
        </p>
      </div>

      <Card className="h-[calc(100%-100px)] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Message vendors to start planning
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => {
                  return (
                    <button
                      key={conversation.conversationId}
                      onClick={() => setSelectedConversation(conversation.conversationId)}
                      className={`w-full p-3 rounded-lg text-left hover-elevate mb-2 ${
                        selectedConversation === conversation.conversationId ? "bg-muted" : ""
                      }`}
                      data-testid={`conversation-${conversation.conversationId}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {conversation.vendorName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.vendorCategory.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {conversations.find(c => c.conversationId === selectedConversation)?.vendorName || "Vendor"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {conversations.find(c => c.conversationId === selectedConversation)?.vendorCategory.replace(/_/g, " ") || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCouple = message.senderType === "couple";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCouple ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isCouple
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isCouple ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <Separator />
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a vendor to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
