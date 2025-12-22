import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { VendorHeader } from "@/components/vendor-header";
import {
  Users,
  Flame,
  Thermometer,
  Snowflake,
  Target,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MessageSquare,
  Clock,
  TrendingUp,
  ChevronRight,
  Plus,
  Send,
  Edit,
  Activity,
  Filter,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  History,
} from "lucide-react";
import type { VendorLead, LeadActivityLog, Vendor } from "@shared/schema";

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'won' | 'lost' | 'nurturing';
type LeadPriority = 'hot' | 'warm' | 'medium' | 'cold';

interface LeadAnalytics {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byPriority: Record<LeadPriority, number>;
  conversionRate: string | number;
  avgScore: number;
  needsFollowUp: number;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
  nurturing: 'Nurturing',
};

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string; icon: typeof Flame }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Flame },
  warm: { label: 'Warm', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Thermometer },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Target },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Snowflake },
};

export default function VendorLeads() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<VendorLead | null>(null);
  const [leadActivity, setLeadActivity] = useState<LeadActivityLog[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newLeadForm, setNewLeadForm] = useState({
    coupleName: '',
    coupleEmail: '',
    couplePhone: '',
    eventDate: '',
    estimatedBudget: '',
    guestCount: '',
    notes: '',
  });

  const [emailForm, setEmailForm] = useState({
    subject: '',
    body: '',
  });

  const [noteForm, setNoteForm] = useState('');

  const { data: currentVendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
    enabled: !!user && user.role === "vendor",
  });

  const vendorId = currentVendor?.id;

  const { data: leads = [], isLoading: leadsLoading } = useQuery<VendorLead[]>({
    queryKey: ["/api/vendor-leads", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/vendor-leads/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: !!vendorId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<LeadAnalytics>({
    queryKey: ["/api/vendor-leads", vendorId, "analytics"],
    queryFn: async () => {
      if (!vendorId) return null;
      const response = await fetch(`/api/vendor-leads/${vendorId}/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!vendorId,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof newLeadForm) => {
      return apiRequest(`/api/vendor-leads/${vendorId}`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
          eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-leads", vendorId] });
      setAddLeadOpen(false);
      setNewLeadForm({
        coupleName: '',
        coupleEmail: '',
        couplePhone: '',
        eventDate: '',
        estimatedBudget: '',
        guestCount: '',
        notes: '',
      });
      toast({ title: "Lead created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create lead", description: error.message, variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<VendorLead> }) => {
      return apiRequest(`/api/vendor-leads/${vendorId}/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-leads", vendorId] });
      toast({ title: "Lead updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update lead", description: error.message, variant: "destructive" });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, description }: { leadId: string; description: string }) => {
      return apiRequest(`/api/vendor-leads/${vendorId}/${leadId}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'note_added',
          description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-leads", vendorId] });
      setNoteDialogOpen(false);
      setNoteForm('');
      toast({ title: "Note added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add note", description: error.message, variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ leadId, subject, body }: { leadId: string; subject: string; body: string }) => {
      return apiRequest(`/api/vendor-leads/${vendorId}/${leadId}/send-email`, {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-leads", vendorId] });
      setEmailDialogOpen(false);
      setEmailForm({ subject: '', body: '' });
      toast({ title: "Email sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
    },
  });

  const openLeadDetails = async (lead: VendorLead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
    
    try {
      const response = await fetch(`/api/vendor-leads/${vendorId}/${lead.id}`);
      if (response.ok) {
        const data = await response.json();
        setLeadActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Failed to fetch lead details:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (filterPriority !== 'all' && lead.priority !== filterPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.coupleName?.toLowerCase().includes(query) ||
        lead.coupleEmail?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getPriorityIcon = (priority: LeadPriority) => {
    const config = PRIORITY_CONFIG[priority];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Please log in as a vendor to access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Lead Management
            </h1>
            <p className="text-muted-foreground">Track, qualify, and nurture your leads</p>
          </div>
          <Button onClick={() => setAddLeadOpen(true)} data-testid="button-add-lead">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold" data-testid="stat-total-leads">{analytics?.total || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold text-red-600" data-testid="stat-hot-leads">{analytics?.byPriority.hot || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Follow-Up Due</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold text-orange-600" data-testid="stat-followup-due">{analytics?.needsFollowUp || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Won</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold text-green-600" data-testid="stat-won-leads">{analytics?.byStatus.won || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <TrendingUp className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold" data-testid="stat-conversion-rate">{analytics?.conversionRate || 0}%</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                {analyticsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold" data-testid="stat-avg-score">{analytics?.avgScore || 0}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-leads"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {leadsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leads Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding leads manually or they'll appear here when couples inquire about your services.
            </p>
            <Button onClick={() => setAddLeadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Lead
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => openLeadDetails(lead)}
                data-testid={`card-lead-${lead.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold" data-testid={`text-lead-name-${lead.id}`}>{lead.coupleName || 'Unknown'}</h3>
                      <Badge className={PRIORITY_CONFIG[lead.priority as LeadPriority]?.color || PRIORITY_CONFIG.medium.color}>
                        {getPriorityIcon(lead.priority as LeadPriority)}
                        <span className="ml-1">{PRIORITY_CONFIG[lead.priority as LeadPriority]?.label || 'Medium'}</span>
                      </Badge>
                      <Badge variant="outline">{STATUS_LABELS[lead.status as LeadStatus] || lead.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {lead.coupleEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {lead.coupleEmail}
                        </span>
                      )}
                      {lead.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(lead.eventDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {lead.estimatedBudget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {lead.estimatedBudget}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <span className="font-bold">{lead.overallScore || 0}</span>
                    </div>
                    <Progress value={lead.overallScore || 0} className="w-20 h-2" />
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedLead.coupleName || 'Unknown Lead'}
                  <Badge className={PRIORITY_CONFIG[selectedLead.priority as LeadPriority]?.color || PRIORITY_CONFIG.medium.color}>
                    {PRIORITY_CONFIG[selectedLead.priority as LeadPriority]?.label || 'Medium'}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Lead details and activity history
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setEmailDialogOpen(true)}
                    disabled={!selectedLead.coupleEmail}
                    data-testid="button-send-email"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNoteDialogOpen(true)}
                    data-testid="button-add-note"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Add Note
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <Select
                      value={selectedLead.status}
                      onValueChange={(value) => {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          updates: { status: value as LeadStatus },
                        });
                        setSelectedLead({ ...selectedLead, status: value as LeadStatus });
                      }}
                    >
                      <SelectTrigger data-testid="select-lead-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.coupleEmail && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <p className="text-sm">{selectedLead.coupleEmail}</p>
                      </div>
                    )}
                    {selectedLead.couplePhone && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Phone</Label>
                        <p className="text-sm">{selectedLead.couplePhone}</p>
                      </div>
                    )}
                    {selectedLead.eventDate && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Event Date</Label>
                        <p className="text-sm">{format(new Date(selectedLead.eventDate), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                    {selectedLead.estimatedBudget && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Budget</Label>
                        <p className="text-sm">{selectedLead.estimatedBudget}</p>
                      </div>
                    )}
                    {selectedLead.guestCount && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Guest Count</Label>
                        <p className="text-sm">{selectedLead.guestCount}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Lead Score</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Urgency</p>
                        <p className="text-lg font-bold">{selectedLead.urgencyScore || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Budget Fit</p>
                        <p className="text-lg font-bold">{selectedLead.budgetFitScore || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-lg font-bold">{selectedLead.engagementScore || 0}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Overall Score</span>
                        <span className="font-bold">{selectedLead.overallScore || 0}/100</span>
                      </div>
                      <Progress value={selectedLead.overallScore || 0} />
                    </div>
                  </div>

                  {selectedLead.notes && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <p className="text-sm whitespace-pre-wrap">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <History className="w-4 h-4" />
                    Activity History
                  </h4>
                  {leadActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3 pr-4">
                        {leadActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                            data-testid={`activity-${activity.id}`}
                          >
                            <Activity className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-add-lead">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Manually add a lead to track and nurture
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="couple-name">Couple Name *</Label>
              <Input
                id="couple-name"
                value={newLeadForm.coupleName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, coupleName: e.target.value })}
                placeholder="e.g., Sarah & John"
                data-testid="input-lead-couple-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="couple-email">Email</Label>
                <Input
                  id="couple-email"
                  type="email"
                  value={newLeadForm.coupleEmail}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, coupleEmail: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="input-lead-email"
                />
              </div>
              <div>
                <Label htmlFor="couple-phone">Phone</Label>
                <Input
                  id="couple-phone"
                  type="tel"
                  value={newLeadForm.couplePhone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, couplePhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  data-testid="input-lead-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Event Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={newLeadForm.eventDate}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, eventDate: e.target.value })}
                  data-testid="input-lead-event-date"
                />
              </div>
              <div>
                <Label htmlFor="guest-count">Guest Count</Label>
                <Input
                  id="guest-count"
                  type="number"
                  min="0"
                  value={newLeadForm.guestCount}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, guestCount: e.target.value })}
                  placeholder="e.g., 200"
                  data-testid="input-lead-guest-count"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated-budget">Estimated Budget</Label>
              <Input
                id="estimated-budget"
                value={newLeadForm.estimatedBudget}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                placeholder="e.g., $10,000 - $15,000"
                data-testid="input-lead-budget"
              />
            </div>

            <div>
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                value={newLeadForm.notes}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                placeholder="Any additional notes about this lead..."
                rows={3}
                data-testid="input-lead-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLeadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createLeadMutation.mutate(newLeadForm)}
              disabled={!newLeadForm.coupleName || createLeadMutation.isPending}
              data-testid="button-save-lead"
            >
              {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent data-testid="dialog-send-email">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedLead?.coupleName}</DialogTitle>
            <DialogDescription>
              Send a personalized email to nurture this lead
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-subject">Subject *</Label>
              <Input
                id="email-subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="e.g., Following up on your inquiry"
                data-testid="input-email-subject"
              />
            </div>

            <div>
              <Label htmlFor="email-body">Message *</Label>
              <Textarea
                id="email-body"
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                placeholder="Write your email message..."
                rows={6}
                data-testid="input-email-body"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedLead && sendEmailMutation.mutate({
                leadId: selectedLead.id,
                subject: emailForm.subject,
                body: emailForm.body,
              })}
              disabled={!emailForm.subject || !emailForm.body || sendEmailMutation.isPending}
              data-testid="button-confirm-send-email"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent data-testid="dialog-add-note">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to track interactions with this lead
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={noteForm}
              onChange={(e) => setNoteForm(e.target.value)}
              placeholder="e.g., Had a call, discussed pricing options..."
              rows={4}
              data-testid="input-note-content"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedLead && addActivityMutation.mutate({
                leadId: selectedLead.id,
                description: noteForm,
              })}
              disabled={!noteForm || addActivityMutation.isPending}
              data-testid="button-save-note"
            >
              {addActivityMutation.isPending ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
