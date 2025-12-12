import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow, isBefore, isToday, parseISO } from "date-fns";
import { Link, useLocation, useSearch } from "wouter";
import type { Vendor, QuickReplyTemplate, FollowUpReminder, InsertQuickReplyTemplate, InsertFollowUpReminder } from "@shared/schema";
import {
  Inbox,
  Mail,
  MailOpen,
  MessageSquare,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Send,
  Bell,
  BellOff,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Heart,
  MapPin,
  FileText,
  Zap,
  Copy,
  Settings,
} from "lucide-react";

interface Lead {
  conversationId: string;
  weddingId: string;
  vendorId: string;
  coupleName: string;
  weddingDate?: string;
  city?: string;
  tradition?: string;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
  firstInquiryDate?: string;
  totalMessages: number;
}

interface EnrichedReminder extends Omit<FollowUpReminder, 'reminderDate'> {
  coupleName: string;
  reminderDate: Date | string;
}

export default function LeadInbox() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [initialConversationHandled, setInitialConversationHandled] = useState(false);
  
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState<Partial<InsertQuickReplyTemplate>>({
    name: "",
    content: "",
    category: "general",
  });
  
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderFormData, setReminderFormData] = useState<{
    weddingId: string;
    reminderDate: string;
    note: string;
  }>({
    weddingId: "",
    reminderDate: "",
    note: "",
  });
  
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });
  
  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;
  
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/lead-inbox", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/lead-inbox/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: !!vendorId,
    refetchInterval: 30000,
  });
  
  const { data: templates = [], isLoading: templatesLoading } = useQuery<QuickReplyTemplate[]>({
    queryKey: ["/api/quick-reply-templates/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/quick-reply-templates/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
    enabled: !!vendorId,
  });
  
  const { data: pendingReminders = [], isLoading: remindersLoading } = useQuery<EnrichedReminder[]>({
    queryKey: ["/api/follow-up-reminders/vendor", vendorId, "pending"],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/follow-up-reminders/vendor/${vendorId}/pending`);
      if (!response.ok) throw new Error("Failed to fetch reminders");
      return response.json();
    },
    enabled: !!vendorId,
  });
  
  // Handle conversation pre-selection from URL query parameter (e.g., from booking cards)
  useEffect(() => {
    if (initialConversationHandled || leads.length === 0) return;
    
    const params = new URLSearchParams(searchString);
    const conversationParam = params.get("conversation");
    
    if (conversationParam) {
      // Try to find the lead by exact match or by base conversation ID (without event part)
      let matchingLead = leads.find(lead => lead.conversationId === conversationParam);
      
      // If no exact match, try to match by weddingId-vendorId prefix (for event-specific conversations)
      if (!matchingLead && conversationParam.includes("-event-")) {
        const baseConversationId = conversationParam.split("-event-")[0];
        matchingLead = leads.find(lead => lead.conversationId.startsWith(baseConversationId));
      }
      
      if (matchingLead) {
        setSelectedLead(matchingLead);
        setActiveTab("inbox");
      }
      setInitialConversationHandled(true);
    }
  }, [leads, searchString, initialConversationHandled]);
  
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return apiRequest("POST", "/api/messages", {
        conversationId: data.conversationId,
        senderType: "vendor",
        content: data.content,
      });
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully!" });
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/lead-inbox", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertQuickReplyTemplate) => {
      return apiRequest("POST", "/api/quick-reply-templates", data);
    },
    onSuccess: () => {
      toast({ title: "Template saved successfully!" });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to save template", variant: "destructive" });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertQuickReplyTemplate> }) => {
      return apiRequest("PATCH", `/api/quick-reply-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Template updated successfully!" });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/quick-reply-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
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
      resetReminderForm();
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to set reminder", variant: "destructive" });
    },
  });
  
  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/follow-up-reminders/${id}`, { status: "completed" });
    },
    onSuccess: () => {
      toast({ title: "Reminder completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to complete reminder", variant: "destructive" });
    },
  });
  
  const dismissReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/follow-up-reminders/${id}`, { status: "dismissed" });
    },
    onSuccess: () => {
      toast({ title: "Reminder dismissed" });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to dismiss reminder", variant: "destructive" });
    },
  });
  
  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateFormData({ name: "", content: "", category: "general" });
  };
  
  const resetReminderForm = () => {
    setReminderFormData({ weddingId: "", reminderDate: "", note: "" });
  };
  
  const handleEditTemplate = (template: QuickReplyTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      content: template.content,
      category: template.category,
    });
    setTemplateDialogOpen(true);
  };
  
  const handleSaveTemplate = () => {
    if (!vendorId || !templateFormData.name || !templateFormData.content) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: templateFormData,
      });
    } else {
      createTemplateMutation.mutate({
        ...templateFormData,
        vendorId,
      } as InsertQuickReplyTemplate);
    }
  };
  
  const handleUseTemplate = (template: QuickReplyTemplate) => {
    setReplyContent(template.content);
    incrementTemplateUsageMutation.mutate(template.id);
    toast({ title: `"${template.name}" template applied to your message` });
  };
  
  const handleSetReminder = (lead: Lead) => {
    setReminderFormData({
      weddingId: lead.weddingId,
      reminderDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      note: `Follow up with ${lead.coupleName}`,
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
  
  const handleSendReply = () => {
    if (!selectedLead || !replyContent.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }
    
    sendMessageMutation.mutate({
      conversationId: selectedLead.conversationId,
      content: replyContent,
    });
  };
  
  const unreadLeads = leads.filter(l => l.unreadCount > 0);
  const readLeads = leads.filter(l => l.unreadCount === 0);
  const totalUnread = unreadLeads.reduce((sum, l) => sum + l.unreadCount, 0);
  
  const overdueReminders = pendingReminders.filter(r => 
    isBefore(parseISO(r.reminderDate.toString()), new Date()) && !isToday(parseISO(r.reminderDate.toString()))
  );
  const todayReminders = pendingReminders.filter(r => 
    isToday(parseISO(r.reminderDate.toString()))
  );
  const upcomingReminders = pendingReminders.filter(r => 
    !isBefore(parseISO(r.reminderDate.toString()), new Date()) && !isToday(parseISO(r.reminderDate.toString()))
  );
  
  if (authLoading || vendorsLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please log in as a vendor to access the Lead Inbox.</p>
            <Button className="mt-4" onClick={() => setLocation("/vendor-login")}>
              Go to Vendor Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!currentVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-4">Complete your vendor profile to access the Lead Inbox.</p>
            <Button onClick={() => setLocation("/vendor-dashboard")}>
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <VendorHeader />
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Inbox className="h-7 w-7 text-primary" />
              Lead Inbox
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage inquiries and respond to couples
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {totalUnread > 0 && (
              <Badge variant="default" className="text-sm px-3 py-1" data-testid="badge-unread-count">
                <Mail className="h-4 w-4 mr-1" />
                {totalUnread} unread
              </Badge>
            )}
            {(overdueReminders.length > 0 || todayReminders.length > 0) && (
              <Badge variant="destructive" className="text-sm px-3 py-1" data-testid="badge-reminder-count">
                <Bell className="h-4 w-4 mr-1" />
                {overdueReminders.length + todayReminders.length} due
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="inbox" className="flex items-center gap-2" data-testid="tab-inbox">
              <MessageSquare className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
              <Zap className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2" data-testid="tab-reminders">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        New Inquiries
                      </span>
                      {unreadLeads.length > 0 && (
                        <Badge variant="default">{unreadLeads.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {leadsLoading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                    ) : unreadLeads.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <MailOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No new inquiries</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                          {unreadLeads.map((lead) => (
                            <button
                              key={lead.conversationId}
                              onClick={() => setSelectedLead(lead)}
                              className={`w-full p-4 text-left hover-elevate transition-colors ${
                                selectedLead?.conversationId === lead.conversationId ? "bg-accent" : ""
                              }`}
                              data-testid={`lead-item-${lead.conversationId}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-primary shrink-0" />
                                    <span className="font-medium truncate">{lead.coupleName}</span>
                                    <Badge variant="default" className="text-xs">{lead.unreadCount}</Badge>
                                  </div>
                                  {lead.lastMessage && (
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                      {lead.lastMessage.content}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    {lead.city && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {lead.city}
                                      </span>
                                    )}
                                    {lead.tradition && (
                                      <Badge variant="outline" className="text-xs">{lead.tradition}</Badge>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                {readLeads.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MailOpen className="h-5 w-5" />
                        Previous Conversations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="divide-y">
                          {readLeads.map((lead) => (
                            <button
                              key={lead.conversationId}
                              onClick={() => setSelectedLead(lead)}
                              className={`w-full p-4 text-left hover-elevate transition-colors ${
                                selectedLead?.conversationId === lead.conversationId ? "bg-accent" : ""
                              }`}
                              data-testid={`lead-item-read-${lead.conversationId}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                    {lead.coupleName}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {lead.totalMessages} messages
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="lg:col-span-2">
                {selectedLead ? (
                  <Card className="h-full">
                    <CardHeader className="border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-primary" />
                            {selectedLead.coupleName}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 mt-2">
                            {selectedLead.weddingDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(selectedLead.weddingDate), "MMMM d, yyyy")}
                              </span>
                            )}
                            {selectedLead.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {selectedLead.city}
                              </span>
                            )}
                            {selectedLead.tradition && (
                              <Badge variant="outline">{selectedLead.tradition}</Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetReminder(selectedLead)}
                            data-testid="button-set-reminder"
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Set Reminder
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/messages?conversation=${selectedLead.conversationId}`)}
                            data-testid="button-view-full"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Full Thread
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {selectedLead.lastMessage && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={selectedLead.lastMessage.senderType === "vendor" ? "secondary" : "default"} className="text-xs">
                              {selectedLead.lastMessage.senderType === "vendor" ? "You" : "Couple"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(selectedLead.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{selectedLead.lastMessage.content}</p>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Quick Reply</Label>
                        {templates.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {templates.slice(0, 4).map((template) => (
                              <Button
                                key={template.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleUseTemplate(template)}
                                data-testid={`button-use-template-${template.id}`}
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                {template.name}
                              </Button>
                            ))}
                            {templates.length > 4 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab("templates")}
                              >
                                +{templates.length - 4} more
                              </Button>
                            )}
                          </div>
                        )}
                        
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[120px] resize-none"
                          data-testid="textarea-reply"
                        />
                        
                        <div className="flex justify-end mt-3">
                          <Button
                            onClick={handleSendReply}
                            disabled={!replyContent.trim() || sendMessageMutation.isPending}
                            data-testid="button-send-reply"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendMessageMutation.isPending ? "Sending..." : "Send Reply"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-[400px]">
                    <CardContent className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">Select a conversation</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on an inquiry from the list to view details and reply
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Quick Reply Templates</h2>
                <p className="text-sm text-muted-foreground">
                  Save time with pre-written responses you can use again and again
                </p>
              </div>
              <Button 
                onClick={() => {
                  resetTemplateForm();
                  setTemplateDialogOpen(true);
                }}
                data-testid="button-create-template"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No templates yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first template to speed up your replies
                  </p>
                  <Button 
                    onClick={() => {
                      resetTemplateForm();
                      setTemplateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover-elevate" data-testid={`template-card-${template.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Used {template.usageCount} times
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setReplyContent(template.content);
                              setActiveTab("inbox");
                              toast({ title: "Template copied to your reply" });
                            }}
                            data-testid={`button-copy-template-${template.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTemplate(template)}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reminders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Follow-Up Reminders</h2>
                <p className="text-sm text-muted-foreground">
                  Never forget to follow up with potential clients
                </p>
              </div>
            </div>
            
            {remindersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : pendingReminders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No pending reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Set reminders from the inbox to stay on top of follow-ups
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {overdueReminders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Overdue ({overdueReminders.length})
                    </h3>
                    <div className="space-y-3">
                      {overdueReminders.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          variant="overdue"
                          onComplete={() => completeReminderMutation.mutate(reminder.id)}
                          onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {todayReminders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Due Today ({todayReminders.length})
                    </h3>
                    <div className="space-y-3">
                      {todayReminders.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          variant="today"
                          onComplete={() => completeReminderMutation.mutate(reminder.id)}
                          onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {upcomingReminders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming ({upcomingReminders.length})
                    </h3>
                    <div className="space-y-3">
                      {upcomingReminders.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          variant="upcoming"
                          onComplete={() => completeReminderMutation.mutate(reminder.id)}
                          onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? "Update your quick reply template"
                : "Create a reusable message template for faster responses"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Initial Response, Pricing Info"
                value={templateFormData.name || ""}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-template-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <select
                id="template-category"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={templateFormData.category || "general"}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, category: e.target.value }))}
                data-testid="select-template-category"
              >
                <option value="general">General</option>
                <option value="pricing">Pricing</option>
                <option value="availability">Availability</option>
                <option value="follow-up">Follow Up</option>
                <option value="thank-you">Thank You</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-content">Message Content</Label>
              <Textarea
                id="template-content"
                placeholder="Write your template message here..."
                value={templateFormData.content || ""}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[150px]"
                data-testid="textarea-template-content"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) 
                ? "Saving..." 
                : editingTemplate ? "Update Template" : "Create Template"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Follow-Up Reminder</DialogTitle>
            <DialogDescription>
              Schedule a reminder to follow up with this couple
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Reminder Date</Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderFormData.reminderDate || ""}
                onChange={(e) => setReminderFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                data-testid="input-reminder-date"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminder-note">Notes (optional)</Label>
              <Textarea
                id="reminder-note"
                placeholder="Add any notes for yourself..."
                value={reminderFormData.note || ""}
                onChange={(e) => setReminderFormData(prev => ({ ...prev, note: e.target.value }))}
                className="min-h-[80px]"
                data-testid="textarea-reminder-note"
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
              {createReminderMutation.isPending ? "Setting..." : "Set Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReminderCard({
  reminder,
  variant,
  onComplete,
  onDismiss,
}: {
  reminder: EnrichedReminder;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const bgClass = variant === "overdue" 
    ? "border-destructive/50 bg-destructive/5" 
    : variant === "today"
      ? "border-primary/50 bg-primary/5"
      : "";
  
  return (
    <Card className={bgClass} data-testid={`reminder-card-${reminder.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-medium">{reminder.coupleName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {variant === "overdue" ? "Was due " : variant === "today" ? "Due " : "Due "}
              {formatDistanceToNow(parseISO(reminder.reminderDate.toString()), { addSuffix: true })}
            </p>
            {reminder.note && (
              <p className="text-sm mt-2 italic">{reminder.note}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onComplete}
              title="Mark as completed"
              data-testid={`button-complete-reminder-${reminder.id}`}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              title="Dismiss"
              data-testid={`button-dismiss-reminder-${reminder.id}`}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
