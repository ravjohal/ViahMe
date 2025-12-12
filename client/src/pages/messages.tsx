import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User, ChevronRight, ChevronDown, PartyPopper } from "lucide-react";
import type { Message } from "@shared/schema";

const DEMO_WEDDING_ID = "demo-wedding-1";

interface ConversationWithMetadata {
  conversationId: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  eventName?: string;
  eventId?: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    senderType: string;
    createdAt: string;
  };
  totalMessages?: number;
}

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  events: ConversationWithMetadata[];
  totalUnread: number;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const hasAutoSelectedRef = useRef(false);

  const { data: conversations = [] } = useQuery<ConversationWithMetadata[]>({
    queryKey: ["/api/conversations/wedding", DEMO_WEDDING_ID],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  const groupConversationsByVendor = (convos: ConversationWithMetadata[]): VendorGroup[] => {
    const groupMap = new Map<string, VendorGroup>();
    
    convos.forEach(convo => {
      if (!groupMap.has(convo.vendorId)) {
        groupMap.set(convo.vendorId, {
          vendorId: convo.vendorId,
          vendorName: convo.vendorName,
          vendorCategory: convo.vendorCategory,
          events: [],
          totalUnread: 0,
        });
      }
      const group = groupMap.get(convo.vendorId)!;
      group.events.push(convo);
      group.totalUnread += convo.unreadCount || 0;
    });
    
    return Array.from(groupMap.values()).sort((a, b) => b.totalUnread - a.totalUnread);
  };

  const vendorGroups = groupConversationsByVendor(conversations);

  const vendorGroupsKey = vendorGroups.map(g => 
    `${g.vendorId}:${g.events.map(e => `${e.conversationId}:${e.unreadCount || 0}`).join('|')}`
  ).join(',');
  
  useEffect(() => {
    if (vendorGroups.length > 0) {
      const vendorsWithMultipleUnread = vendorGroups
        .filter(g => g.events.length > 1 && g.totalUnread > 0);
      
      if (vendorsWithMultipleUnread.length > 0) {
        const idsToExpand = vendorsWithMultipleUnread.map(g => g.vendorId);
        setExpandedVendors(prev => {
          const newSet = new Set(prev);
          idsToExpand.forEach(id => newSet.add(id));
          return newSet;
        });
      }
      
      if (!hasAutoSelectedRef.current) {
        hasAutoSelectedRef.current = true;
        const targetGroup = vendorGroups[0];
        const unreadEvent = targetGroup.events.find(e => (e.unreadCount || 0) > 0) || targetGroup.events[0];
        setSelectedConversation(unreadEvent.conversationId);
      }
    }
  }, [vendorGroupsKey]);

  const toggleVendorExpanded = (vendorId: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const handleVendorClick = (group: VendorGroup) => {
    if (group.events.length === 1) {
      setSelectedConversation(group.events[0].conversationId);
    } else {
      toggleVendorExpanded(group.vendorId);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) return;
      
      const conversation = conversations.find(c => c.conversationId === selectedConversation);
      if (!conversation) throw new Error("Conversation not found");
      
      const response = await apiRequest("POST", "/api/messages", {
        weddingId: conversation.weddingId,
        vendorId: conversation.vendorId,
        senderId: conversation.weddingId,
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

  const selectedConvo = conversations.find(c => c.conversationId === selectedConversation);

  return (
    <div className="h-[calc(100vh-8rem)] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-playfair font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your vendors about your wedding details
        </p>
      </div>

      <Card className="h-[calc(100%-100px)] flex overflow-hidden">
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Vendors</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {vendorGroups.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Message vendors to start planning
                </p>
              </div>
            ) : (
              <div className="p-2">
                {vendorGroups.map((group) => (
                  <div key={group.vendorId} className="mb-1">
                    <button
                      onClick={() => handleVendorClick(group)}
                      className={`w-full p-3 rounded-lg text-left hover-elevate ${
                        group.events.length === 1 && selectedConversation === group.events[0].conversationId ? "bg-muted" : ""
                      }`}
                      data-testid={`vendor-group-${group.vendorId}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{group.vendorName}</p>
                            {group.totalUnread > 0 && (
                              <Badge variant="default" className="text-xs">{group.totalUnread}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {group.vendorCategory.replace(/_/g, " ")}
                            </p>
                            {group.events.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {group.events.length} events
                              </Badge>
                            )}
                          </div>
                        </div>
                        {group.events.length > 1 ? (
                          expandedVendors.has(group.vendorId) ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          )
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>
                    {group.events.length > 1 && expandedVendors.has(group.vendorId) && (
                      <div className="ml-4 pl-4 border-l border-muted">
                        {group.events.map((event) => (
                          <button
                            key={event.conversationId}
                            onClick={() => setSelectedConversation(event.conversationId)}
                            className={`w-full p-2 rounded-lg text-left hover-elevate mb-1 ${
                              selectedConversation === event.conversationId ? "bg-muted" : ""
                            }`}
                            data-testid={`event-conversation-${event.conversationId}`}
                          >
                            <div className="flex items-center gap-2">
                              <PartyPopper className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {event.eventName || "General Inquiry"}
                              </span>
                              {(event.unreadCount || 0) > 0 && (
                                <Badge variant="default" className="text-xs">{event.unreadCount}</Badge>
                              )}
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-auto" />
                            </div>
                            {event.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate mt-1 pl-6">
                                {event.lastMessage.content}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConvo?.vendorName || "Vendor"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {selectedConvo?.vendorCategory.replace(/_/g, " ") || ""}
                      </p>
                      {selectedConvo?.eventName && (
                        <Badge variant="outline" className="text-xs">
                          {selectedConvo.eventName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
