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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, User, ChevronRight, ChevronDown, PartyPopper, Clock, CheckCircle, XCircle, Loader2, Archive, AlertTriangle } from "lucide-react";
import type { Message, Wedding, ConversationStatus } from "@shared/schema";

const VENDOR_COLORS = [
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", icon: "bg-rose-100 dark:bg-rose-900/50" },
  { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", icon: "bg-sky-100 dark:bg-sky-900/50" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/50" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/50" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/50" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", icon: "bg-cyan-100 dark:bg-cyan-900/50" },
];

const EVENT_COLORS = [
  "bg-orange-50 dark:bg-orange-950/20",
  "bg-teal-50 dark:bg-teal-950/20",
  "bg-pink-50 dark:bg-pink-950/20",
  "bg-indigo-50 dark:bg-indigo-950/20",
  "bg-lime-50 dark:bg-lime-950/20",
];

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
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const hasAutoSelectedRef = useRef(false);

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

  const { data: conversationStatus } = useQuery<ConversationStatus | { status: 'open' }>({
    queryKey: ["/api/conversations", selectedConversation, "status"],
    enabled: !!selectedConversation,
  });

  const isConversationClosed = conversationStatus?.status === 'closed';

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
        eventId: conversation.eventId,
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
    onError: (error: any) => {
      if (error?.message?.includes("closed")) {
        toast({
          title: "Conversation closed",
          description: "This inquiry has been closed and no new messages can be sent.",
          variant: "destructive",
        });
      }
    },
  });

  const closeInquiryMutation = useMutation({
    mutationFn: async ({ reason }: { reason?: string }) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      const response = await apiRequest("PATCH", `/api/conversations/${encodeURIComponent(selectedConversation)}/close`, {
        reason,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry closed",
        description: "The vendor has been notified that you've closed this inquiry.",
      });
      setCloseDialogOpen(false);
      setCloseReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/wedding", weddingId] });
    },
    onError: () => {
      toast({
        title: "Failed to close inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation && !isConversationClosed) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const handleCloseInquiry = () => {
    closeInquiryMutation.mutate({ reason: closeReason || undefined });
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
                {vendorGroups.map((group, vendorIdx) => {
                  const vendorColor = VENDOR_COLORS[vendorIdx % VENDOR_COLORS.length];
                  return (
                  <div 
                    key={group.vendorId} 
                    className={`rounded-lg border overflow-hidden ${vendorColor.bg} ${vendorColor.border}`}
                  >
                    <button
                      onClick={() => handleVendorClick(group)}
                      className={`w-full p-4 text-left hover-elevate ${
                        group.events.length === 1 && selectedConversation === group.events[0].conversationId 
                          ? "ring-2 ring-primary ring-inset" 
                          : ""
                      }`}
                      data-testid={`vendor-group-${group.vendorId}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${vendorColor.icon}`}>
                          <User className="w-5 h-5 text-foreground/70" />
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
                      <div className="border-t border-inherit">
                        {group.events.map((event, eventIdx) => {
                          const eventColor = EVENT_COLORS[eventIdx % EVENT_COLORS.length];
                          return (
                          <button
                            key={event.conversationId}
                            onClick={() => setSelectedConversation(event.conversationId)}
                            className={`w-full pl-6 pr-4 py-3 text-left hover-elevate ${eventColor} ${
                              eventIdx !== group.events.length - 1 ? "border-b border-muted/30" : ""
                            } ${
                              selectedConversation === event.conversationId ? "ring-2 ring-primary ring-inset" : ""
                            }`}
                            data-testid={`event-conversation-${event.conversationId}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-background/50 flex items-center justify-center shrink-0">
                                <PartyPopper className="w-3 h-3 text-foreground/60" />
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
                        );
                        })}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-3">
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
                        {isConversationClosed && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="w-3 h-3 mr-1" />
                            Closed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isConversationClosed && (
                    <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-close-inquiry">
                          <Archive className="w-4 h-4 mr-2" />
                          Close Inquiry
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Close this inquiry?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will close your conversation with {selectedConvo?.vendorName}. 
                            The vendor will be notified and you won't be able to send more messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <label className="text-sm font-medium mb-2 block">
                            Reason (optional)
                          </label>
                          <Textarea
                            placeholder="Let the vendor know why you're closing this inquiry..."
                            value={closeReason}
                            onChange={(e) => setCloseReason(e.target.value)}
                            className="resize-none"
                            rows={3}
                            data-testid="input-close-reason"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-close">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCloseInquiry}
                            disabled={closeInquiryMutation.isPending}
                            data-testid="button-confirm-close"
                          >
                            {closeInquiryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Archive className="w-4 h-4 mr-2" />
                            )}
                            Close Inquiry
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {isConversationClosed && (
                <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-2">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    This inquiry has been closed. You can no longer send messages.
                  </span>
                </div>
              )}

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
                {isConversationClosed ? (
                  <div className="flex items-center justify-center py-2 text-muted-foreground">
                    <Archive className="w-4 h-4 mr-2" />
                    <span className="text-sm">Messaging is disabled for closed inquiries</span>
                  </div>
                ) : (
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
                )}
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
