import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMessageSocket } from "@/hooks/use-message-socket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User, ChevronRight, ChevronDown, PartyPopper, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Message, Wedding } from "@shared/schema";

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
  bookingId?: string;
  bookingStatus?: string;
}

function getBookingStatusBadge(status?: string) {
  if (!status) return null;
  
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Request Sent
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    case 'declined':
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="text-xs">
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
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

  // Real-time message updates via WebSocket
  useMessageSocket(selectedConversation);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];
  const weddingId = wedding?.id;

  const { data: conversations = [] } = useQuery<ConversationWithMetadata[]>({
    queryKey: ["/api/conversations/wedding", weddingId],
    enabled: !!weddingId,
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
        eventId: conversation.eventId, // Include eventId for proper conversation grouping
        senderId: conversation.weddingId,
        senderType: "couple",
        content,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/wedding", weddingId] });
      setMessageText("");
    },
  });

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const selectedConvo = conversations.find(c => c.conversationId === selectedConversation);

  if (weddingsLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="h-[calc(100vh-8rem)] p-6 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Wedding Found</h3>
          <p className="text-muted-foreground text-sm">
            Please create a wedding first to start messaging vendors.
          </p>
        </div>
      </div>
    );
  }

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
                  Request a booking from a vendor to start a conversation
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {vendorGroups.map((group) => (
                  <div 
                    key={group.vendorId} 
                    className={`rounded-lg border overflow-hidden ${
                      group.totalUnread > 0 
                        ? "border-primary/20 bg-gradient-to-r from-primary/5 to-transparent" 
                        : "bg-card"
                    }`}
                  >
                    <button
                      onClick={() => handleVendorClick(group)}
                      className={`w-full p-4 text-left hover-elevate ${
                        group.events.length === 1 && selectedConversation === group.events[0].conversationId 
                          ? group.totalUnread > 0 ? "bg-primary/10" : "bg-accent" 
                          : ""
                      }`}
                      data-testid={`vendor-group-${group.vendorId}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          group.totalUnread > 0 ? "bg-primary/15" : "bg-muted"
                        }`}>
                          <User className={`w-5 h-5 ${group.totalUnread > 0 ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">{group.vendorName}</p>
                            {group.totalUnread > 0 && (
                              <Badge variant="default" className="text-xs">{group.totalUnread} new</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {group.vendorCategory.replace(/_/g, " ")}
                            </Badge>
                            {group.events.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {group.events.length} events
                              </span>
                            )}
                            {group.events.length === 1 && getBookingStatusBadge(group.events[0].bookingStatus)}
                          </div>
                        </div>
                        {group.events.length > 1 ? (
                          expandedVendors.has(group.vendorId) ? (
                            <ChevronDown className={`w-5 h-5 shrink-0 ${group.totalUnread > 0 ? "text-primary" : "text-muted-foreground"}`} />
                          ) : (
                            <ChevronRight className={`w-5 h-5 shrink-0 ${group.totalUnread > 0 ? "text-primary" : "text-muted-foreground"}`} />
                          )
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>
                    {group.events.length > 1 && expandedVendors.has(group.vendorId) && (
                      <div className={`border-t ${group.totalUnread > 0 ? "border-primary/10 bg-muted/30" : "border-muted bg-muted/20"}`}>
                        {group.events.map((event, idx) => (
                          <button
                            key={event.conversationId}
                            onClick={() => setSelectedConversation(event.conversationId)}
                            className={`w-full pl-6 pr-4 py-3 text-left hover-elevate ${
                              idx !== group.events.length - 1 ? "border-b border-muted/50" : ""
                            } ${
                              selectedConversation === event.conversationId ? "bg-accent" : ""
                            }`}
                            data-testid={`event-conversation-${event.conversationId}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center shrink-0">
                                <PartyPopper className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {event.eventName || "General Inquiry"}
                                  </span>
                                  {(event.unreadCount || 0) > 0 && (
                                    <Badge variant="default" className="text-xs">{event.unreadCount}</Badge>
                                  )}
                                  {getBookingStatusBadge(event.bookingStatus)}
                                </div>
                                {event.lastMessage && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {event.lastMessage.content}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {selectedConvo?.vendorCategory.replace(/_/g, " ") || ""}
                      </p>
                      {selectedConvo?.eventName && (
                        <Badge variant="outline" className="text-xs">
                          {selectedConvo.eventName}
                        </Badge>
                      )}
                      {getBookingStatusBadge(selectedConvo?.bookingStatus)}
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
                                ? "bg-amber-500 dark:bg-amber-600 text-white"
                                : "bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${
                                isCouple ? "text-white/90" : "text-rose-700 dark:text-rose-300"
                              }`}>
                                {isCouple ? "You" : "Vendor"}
                              </span>
                              <span className={`text-xs ${
                                isCouple ? "text-white/70" : "text-rose-600/70 dark:text-rose-400/70"
                              }`}>
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
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
