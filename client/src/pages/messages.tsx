import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMessageSocket } from "@/hooks/use-message-socket";
import { VendorHeader } from "@/components/vendor-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { useLocation, useSearch } from "wouter";
import type { Message, Wedding, Vendor, QuickReplyTemplate, ConversationStatus } from "@shared/schema";
import {
  MessageCircle,
  Send,
  User,
  ChevronRight,
  ChevronDown,
  PartyPopper,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Archive,
  AlertTriangle,
  Heart,
  Bell,
  Sparkles,
  Inbox,
  Mail,
  Zap,
  ArrowLeft,
} from "lucide-react";

const COLORS = [
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

interface ConversationItem {
  conversationId: string;
  weddingId: string;
  vendorId: string;
  displayName: string;
  category?: string;
  eventName?: string;
  eventId?: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
  totalMessages?: number;
  bookingId?: string;
  bookingStatus?: string;
  weddingDate?: string;
  city?: string;
  tradition?: string;
}

interface ConversationGroup {
  groupId: string;
  displayName: string;
  category?: string;
  events: ConversationItem[];
  totalUnread: number;
  weddingDate?: string;
  city?: string;
  tradition?: string;
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

export default function MessagesPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const isVendor = user?.role === "vendor";
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ConversationItem | null>(null);
  const [messageText, setMessageText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [initialConversationHandled, setInitialConversationHandled] = useState(false);
  const hasAutoSelectedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasScrolledToUnreadRef = useRef<string | null>(null);
  
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderFormData, setReminderFormData] = useState({
    weddingId: "",
    reminderDate: "",
    note: "",
  });
  
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);

  useMessageSocket(selectedConversation);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !isVendor,
  });

  const wedding = weddings?.[0];
  const weddingId = wedding?.id;

  const { data: currentVendor, isLoading: vendorsLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
    enabled: isVendor && !!user,
  });

  const vendorId = currentVendor?.id;

  const { data: coupleConversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations/wedding", weddingId],
    enabled: !isVendor && !!weddingId,
  });

  const { data: vendorLeads = [], isLoading: leadsLoading } = useQuery<any[]>({
    queryKey: ["/api/lead-inbox", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/lead-inbox/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: isVendor && !!vendorId,
    refetchInterval: 30000,
  });

  const { data: templates = [] } = useQuery<QuickReplyTemplate[]>({
    queryKey: ["/api/quick-reply-templates/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/quick-reply-templates/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
    enabled: isVendor && !!vendorId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/messages/${encodeURIComponent(selectedConversation)}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  const { data: conversationStatus } = useQuery<ConversationStatus | { status: 'open' }>({
    queryKey: ["/api/conversations", selectedConversation, "status"],
    queryFn: async () => {
      if (!selectedConversation) return { status: 'open' as const };
      const response = await fetch(`/api/conversations/${encodeURIComponent(selectedConversation)}/status`);
      if (!response.ok) {
        if (response.status === 404) return { status: 'open' as const };
        throw new Error("Failed to fetch status");
      }
      return response.json();
    },
    enabled: !!selectedConversation,
    retry: 1,
  });

  const isConversationClosed = conversationStatus?.status === 'closed';

  const conversationItems: ConversationItem[] = isVendor
    ? vendorLeads.map((lead: any) => ({
        conversationId: lead.conversationId,
        weddingId: lead.weddingId,
        vendorId: lead.vendorId,
        displayName: lead.coupleName,
        eventName: lead.eventName,
        eventId: lead.eventId,
        unreadCount: lead.unreadCount || 0,
        lastMessage: lead.lastMessage,
        totalMessages: lead.totalMessages,
        bookingId: lead.bookingId,
        bookingStatus: lead.bookingStatus,
        weddingDate: lead.weddingDate,
        city: lead.city,
        tradition: lead.tradition,
      }))
    : coupleConversations.map((convo: any) => ({
        conversationId: convo.conversationId,
        weddingId: convo.weddingId,
        vendorId: convo.vendorId,
        displayName: convo.vendorName,
        category: convo.vendorCategory,
        eventName: convo.eventName,
        eventId: convo.eventId,
        unreadCount: convo.unreadCount || 0,
        lastMessage: convo.lastMessage,
        totalMessages: convo.totalMessages,
        bookingId: convo.bookingId,
        bookingStatus: convo.bookingStatus,
      }));

  const groupConversations = (items: ConversationItem[]): ConversationGroup[] => {
    const groupMap = new Map<string, ConversationGroup>();
    
    items.forEach(item => {
      const groupId = isVendor ? item.weddingId : item.vendorId;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          displayName: item.displayName,
          category: item.category,
          events: [],
          totalUnread: 0,
          weddingDate: item.weddingDate,
          city: item.city,
          tradition: item.tradition,
        });
      }
      const group = groupMap.get(groupId)!;
      group.events.push(item);
      group.totalUnread += item.unreadCount;
    });
    
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.totalUnread > 0 && b.totalUnread === 0) return -1;
      if (a.totalUnread === 0 && b.totalUnread > 0) return 1;
      return b.totalUnread - a.totalUnread;
    });
  };

  const groups = groupConversations(conversationItems);

  const groupsKey = groups.map(g => 
    `${g.groupId}:${g.events.map(e => `${e.conversationId}:${e.unreadCount}`).join('|')}`
  ).join(',');

  useEffect(() => {
    if (groups.length > 0) {
      const groupsWithMultipleUnread = groups.filter(g => g.events.length > 1 && g.totalUnread > 0);
      if (groupsWithMultipleUnread.length > 0) {
        setExpandedGroups(prev => {
          const newSet = new Set(prev);
          groupsWithMultipleUnread.forEach(g => newSet.add(g.groupId));
          return newSet;
        });
      }
      
      if (!hasAutoSelectedRef.current && !initialConversationHandled) {
        const params = new URLSearchParams(searchString);
        const conversationParam = params.get("conversation");
        
        if (!conversationParam) {
          hasAutoSelectedRef.current = true;
          const targetGroup = groups.find(g => g.totalUnread > 0) || groups[0];
          const unreadEvent = targetGroup.events.find(e => e.unreadCount > 0) || targetGroup.events[0];
          setSelectedConversation(unreadEvent.conversationId);
          setSelectedItem(unreadEvent);
          setInitialConversationHandled(true);
        }
      }
    }
  }, [groupsKey, searchString, initialConversationHandled]);

  useEffect(() => {
    if (!messages.length || !selectedConversation) return;
    
    const otherPartyType = isVendor ? 'couple' : 'vendor';
    const unreadMessages = messages.filter(m => !m.isRead && m.senderType === otherPartyType);
    
    unreadMessages.forEach(async (message) => {
      try {
        await apiRequest("PATCH", `/api/messages/${message.id}/read`);
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    });
    
    if (unreadMessages.length > 0) {
      setTimeout(() => {
        if (isVendor) {
          queryClient.invalidateQueries({ queryKey: ["/api/lead-inbox", vendorId] });
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations/wedding", weddingId] });
        }
      }, 500);
    }
  }, [messages, selectedConversation, isVendor, vendorId, weddingId]);

  useEffect(() => {
    if (!messages.length || !selectedConversation || messagesLoading) return;
    if (hasScrolledToUnreadRef.current === selectedConversation) return;
    
    const otherPartyType = isVendor ? 'couple' : 'vendor';
    const firstUnreadMessage = messages.find(m => !m.isRead && m.senderType === otherPartyType);
    
    if (firstUnreadMessage) {
      setTimeout(() => {
        const el = document.querySelector(`[data-unread-id="${firstUnreadMessage.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    
    hasScrolledToUnreadRef.current = selectedConversation;
  }, [messages, selectedConversation, messagesLoading, isVendor]);

  useEffect(() => {
    if (initialConversationHandled) return;
    
    const params = new URLSearchParams(searchString);
    const conversationParam = params.get("conversation");
    
    if (conversationParam) {
      if (conversationItems.length === 0) return;
      
      let matchingItem = conversationItems.find(item => item.conversationId === conversationParam);
      
      if (!matchingItem && conversationParam.includes("-event-")) {
        const baseId = conversationParam.split("-event-")[0];
        matchingItem = conversationItems.find(item => item.conversationId.startsWith(baseId));
      }
      
      if (matchingItem) {
        setSelectedConversation(matchingItem.conversationId);
        setSelectedItem(matchingItem);
        setExpandedGroups(prev => {
          const newSet = new Set(prev);
          const groupId = isVendor ? matchingItem!.weddingId : matchingItem!.vendorId;
          newSet.add(groupId);
          return newSet;
        });
        hasAutoSelectedRef.current = true;
      } else if (conversationItems.length > 0) {
        const targetGroup = groups.find(g => g.totalUnread > 0) || groups[0];
        if (targetGroup) {
          const unreadEvent = targetGroup.events.find(e => e.unreadCount > 0) || targetGroup.events[0];
          setSelectedConversation(unreadEvent.conversationId);
          setSelectedItem(unreadEvent);
        }
        hasAutoSelectedRef.current = true;
      }
      setInitialConversationHandled(true);
    }
  }, [conversationItems, searchString, initialConversationHandled, isVendor, groups]);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleGroupClick = (group: ConversationGroup) => {
    if (group.events.length === 1) {
      setSelectedConversation(group.events[0].conversationId);
      setSelectedItem(group.events[0]);
    } else {
      toggleGroupExpanded(group.groupId);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedItem) throw new Error("No conversation selected");
      
      const response = await apiRequest("POST", "/api/messages", {
        weddingId: selectedItem.weddingId,
        vendorId: selectedItem.vendorId,
        eventId: selectedItem.eventId,
        senderId: isVendor ? selectedItem.vendorId : selectedItem.weddingId,
        senderType: isVendor ? "vendor" : "couple",
        content,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      if (isVendor) {
        toast({ title: "Message sent successfully!" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      if (isVendor) {
        queryClient.invalidateQueries({ queryKey: ["/api/lead-inbox", vendorId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations/wedding", weddingId] });
      }
      setMessageText("");
    },
    onError: (error: any) => {
      if (error?.message?.includes("closed")) {
        toast({
          title: "Conversation closed",
          description: "This inquiry has been closed and no new messages can be sent.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to send message", variant: "destructive" });
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

  const incrementTemplateUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/quick-reply-templates/${id}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: { vendorId: string; weddingId: string; reminderDate: string; note?: string }) => {
      return apiRequest("POST", "/api/follow-up-reminders", data);
    },
    onSuccess: () => {
      toast({ title: "Reminder set successfully!" });
      setReminderDialogOpen(false);
      setReminderFormData({ weddingId: "", reminderDate: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to set reminder", variant: "destructive" });
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

  const handleUseTemplate = (template: QuickReplyTemplate) => {
    setMessageText(template.content);
    incrementTemplateUsageMutation.mutate(template.id);
    toast({ title: `"${template.name}" template applied` });
  };

  const handleSetReminder = (item: ConversationItem) => {
    setReminderFormData({
      weddingId: item.weddingId,
      reminderDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      note: `Follow up with ${item.displayName}`,
    });
    setReminderDialogOpen(true);
  };

  const handleSaveReminder = () => {
    if (!vendorId || !reminderFormData.weddingId || !reminderFormData.reminderDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    createReminderMutation.mutate({
      vendorId,
      weddingId: reminderFormData.weddingId,
      reminderDate: reminderFormData.reminderDate,
      note: reminderFormData.note || undefined,
    });
  };

  const handleGetAiSuggestions = async () => {
    if (!selectedItem || !currentVendor) {
      toast({ title: "Please select a conversation first", variant: "destructive" });
      return;
    }
    
    const coupleMessage = selectedItem.lastMessage?.senderType === "couple" 
      ? selectedItem.lastMessage.content 
      : "Hello, I'm interested in your services for my wedding.";
    
    setAiSuggestionsLoading(true);
    setAiSuggestions([]);
    
    try {
      const response = await apiRequest("POST", "/api/ai/vendor-reply-suggestions", {
        vendorName: currentVendor.name,
        vendorCategory: currentVendor.categories?.[0] || 'vendor',
        coupleName: selectedItem.displayName,
        coupleMessage,
        weddingDate: selectedItem.weddingDate,
        tradition: selectedItem.tradition,
      });
      
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      toast({ title: "Failed to get AI suggestions", variant: "destructive" });
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const handleUseAiSuggestion = (suggestion: string) => {
    setMessageText(suggestion);
    setAiSuggestions([]);
    toast({ title: "AI suggestion applied to your reply" });
  };

  const totalUnread = conversationItems.reduce((sum, item) => sum + item.unreadCount, 0);

  const isLoading = authLoading || (isVendor ? vendorsLoading || leadsLoading : weddingsLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[calc(100vh-8rem)] p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }


  if (!isVendor && !wedding) {
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

  const content = (
    <div className={isVendor ? "max-w-7xl mx-auto p-4 md:p-6 space-y-6" : "h-[calc(100vh-8rem)] p-3 md:p-6"}>
      <div className={isVendor ? "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" : "mb-4 md:mb-6"}>
        <div>
          <h1 className={`font-bold flex items-center gap-2 ${isVendor ? "text-2xl md:text-3xl" : "text-2xl md:text-3xl font-playfair"}`}>
            {isVendor && <Inbox className="h-7 w-7 text-primary" />}
            Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isVendor 
              ? "Manage inquiries and respond to couples" 
              : "Communicate with your vendors about your wedding details"}
          </p>
        </div>
        
        {isVendor && totalUnread > 0 && (
          <Badge variant="default" className="text-sm px-3 py-1" data-testid="badge-unread-count">
            <Mail className="h-4 w-4 mr-1" />
            {totalUnread} unread
          </Badge>
        )}
      </div>

      <Card className={`flex overflow-hidden ${isVendor ? "h-[calc(100vh-220px)] min-h-[400px] md:min-h-[500px]" : "h-[calc(100%-80px)] md:h-[calc(100%-100px)]"}`}>
        {/* Conversation list - hidden on mobile when conversation selected */}
        <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold">{isVendor ? "Couples" : "Vendors"}</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {groups.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isVendor 
                    ? (currentVendor 
                        ? "Couples will appear here when they reach out" 
                        : "Complete your vendor profile to receive inquiries")
                    : "Request a booking from a vendor to start a conversation"}
                </p>
                {isVendor && !currentVendor && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setLocation("/vendor-dashboard")}
                    data-testid="button-setup-profile"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set Up Profile
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {groups.map((group, groupIdx) => {
                  const color = COLORS[groupIdx % COLORS.length];
                  return (
                    <div 
                      key={group.groupId} 
                      className={`rounded-lg border overflow-hidden ${color.bg} ${color.border}`}
                    >
                      <button
                        onClick={() => handleGroupClick(group)}
                        className={`w-full p-4 text-left hover-elevate ${
                          group.events.length === 1 && selectedConversation === group.events[0].conversationId 
                            ? "ring-2 ring-primary ring-inset" 
                            : ""
                        }`}
                        data-testid={`conversation-group-${group.groupId}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color.icon}`}>
                            {isVendor ? <Heart className="w-5 h-5 text-foreground/70" /> : <User className="w-5 h-5 text-foreground/70" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold truncate">{group.displayName}</p>
                              {group.totalUnread > 0 && (
                                <Badge variant="default" className="text-xs">{group.totalUnread} new</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {group.category && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {group.category.replace(/_/g, " ")}
                                </Badge>
                              )}
                              {group.events.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  {group.events.length} events
                                </span>
                              )}
                              {group.events.length === 1 && getBookingStatusBadge(group.events[0].bookingStatus)}
                            </div>
                          </div>
                          {group.events.length > 1 ? (
                            expandedGroups.has(group.groupId) ? (
                              <ChevronDown className={`w-5 h-5 shrink-0 ${group.totalUnread > 0 ? "text-primary" : "text-muted-foreground"}`} />
                            ) : (
                              <ChevronRight className={`w-5 h-5 shrink-0 ${group.totalUnread > 0 ? "text-primary" : "text-muted-foreground"}`} />
                            )
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </button>
                      {group.events.length > 1 && expandedGroups.has(group.groupId) && (
                        <div className="border-t border-inherit">
                          {group.events.map((event, eventIdx) => {
                            const eventColor = EVENT_COLORS[eventIdx % EVENT_COLORS.length];
                            return (
                              <button
                                key={event.conversationId}
                                onClick={() => {
                                  setSelectedConversation(event.conversationId);
                                  setSelectedItem(event);
                                }}
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
                                      {event.unreadCount > 0 && (
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

        {/* Message area - hidden on mobile when no conversation selected */}
        <div className={`flex-1 flex flex-col min-h-0 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation && selectedItem ? (
            <>
              <div className="p-4 border-b shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => {
                        setSelectedConversation(null);
                        setSelectedItem(null);
                      }}
                      data-testid="button-back-to-conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {isVendor ? <Heart className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedItem.displayName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedItem.category && (
                          <p className="text-sm text-muted-foreground">
                            {selectedItem.category.replace(/_/g, " ")}
                          </p>
                        )}
                        {selectedItem.eventName && (
                          <Badge variant="outline" className="text-xs">
                            {selectedItem.eventName}
                          </Badge>
                        )}
                        {getBookingStatusBadge(selectedItem.bookingStatus)}
                        {isConversationClosed && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="w-3 h-3 mr-1" />
                            Closed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isVendor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetReminder(selectedItem)}
                        data-testid="button-set-reminder"
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Set Reminder
                      </Button>
                    )}
                    {!isVendor && !isConversationClosed && (
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
                              This will close your conversation with {selectedItem.displayName}. 
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
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Closing...
                                </>
                              ) : (
                                "Close Inquiry"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isFromMe = isVendor 
                        ? message.senderType === 'vendor' 
                        : message.senderType === 'couple';
                      const otherPartyType = isVendor ? 'couple' : 'vendor';
                      const isUnread = !message.isRead && message.senderType === otherPartyType;
                      
                      return (
                        <div
                          key={message.id}
                          data-unread-id={isUnread ? message.id : undefined}
                          className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isFromMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            } ${isUnread ? "ring-2 ring-primary/50" : ""}`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {message.createdAt && format(new Date(message.createdAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {isVendor && templates.length > 0 && !isConversationClosed && (
                <div className="px-4 py-2 border-t bg-muted/30">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Quick replies:</span>
                    {templates.slice(0, 4).map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="text-xs whitespace-nowrap"
                        data-testid={`button-template-${template.id}`}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {isVendor && aiSuggestions.length > 0 && (
                <div className="px-4 py-2 border-t bg-primary/5">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Suggestions:
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div 
                        key={idx}
                        className="p-2 bg-background rounded border text-sm cursor-pointer hover-elevate"
                        onClick={() => handleUseAiSuggestion(suggestion)}
                        data-testid={`ai-suggestion-${idx}`}
                      >
                        {suggestion.length > 150 ? suggestion.slice(0, 150) + "..." : suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t shrink-0">
                {isConversationClosed ? (
                  <div className="text-center text-muted-foreground text-sm py-2">
                    <Archive className="w-5 h-5 mx-auto mb-1" />
                    This conversation has been closed
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none"
                      rows={2}
                      data-testid="input-message"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      {isVendor && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleGetAiSuggestions}
                          disabled={aiSuggestionsLoading}
                          title="Get AI suggestions"
                          data-testid="button-ai-suggestions"
                        >
                          {aiSuggestionsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a {isVendor ? "couple" : "vendor"} from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {isVendor && (
        <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Set Follow-up Reminder
              </DialogTitle>
              <DialogDescription>
                Get notified to follow up with this couple.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reminderDate">Reminder Date</Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={reminderFormData.reminderDate}
                  onChange={(e) => setReminderFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                  data-testid="input-reminder-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderNote">Note (optional)</Label>
                <Textarea
                  id="reminderNote"
                  placeholder="Add a note for your reminder..."
                  value={reminderFormData.note}
                  onChange={(e) => setReminderFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="resize-none"
                  data-testid="input-reminder-note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveReminder} 
                disabled={createReminderMutation.isPending}
                data-testid="button-save-reminder"
              >
                {createReminderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Set Reminder"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  if (isVendor) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <main>{content}</main>
      </div>
    );
  }

  return content;
}
