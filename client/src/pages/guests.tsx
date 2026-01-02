import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GuestListManager } from "@/components/guest-list-manager";
import { GuestImportDialog } from "@/components/guest-import-dialog";
import { CollectorLinksManager } from "@/components/collector-links-manager";
import { DuplicatesManager } from "@/components/duplicates-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema, insertHouseholdSchema, type Wedding, type Guest, type Event, type Household, type GuestSuggestion, type CutListItem, type EventCostItem, type GuestCollectorSubmission } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Trash2,
  Upload,
  Users,
  User,
  Link as LinkIcon,
  MailCheck,
  Mail,
  MessageCircle,
  Phone,
  Copy,
  Send,
  BarChart3,
  Download,
  QrCode,
  ListFilter,
  Scissors,
  MoreVertical,
  ClipboardList,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  RotateCcw,
  Inbox,
  Target,
  CheckSquare,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Circle,
  Star,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  HelpCircle,
  Pencil,
  Share2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SideFilterToggle, EventFilterPills, SummaryHeader } from "@/components/household-card";
import { SiWhatsapp } from "react-icons/si";
import QRCode from "qrcode";

// Helper function to safely parse members which may be array or JSON string
const parseMembers = (household: any): any[] => {
  const raw = household?.members;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

const guestFormSchema = insertGuestSchema.extend({
  eventIds: z.array(z.string()).optional(),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

const householdFormSchema = insertHouseholdSchema.extend({
  maxCount: z.number().min(1, "Max count must be at least 1"),
  addressStreet: z.string().optional().or(z.literal("")),
  addressCity: z.string().optional().or(z.literal("")),
  addressState: z.string().optional().or(z.literal("")),
  addressPostalCode: z.string().optional().or(z.literal("")),
  addressCountry: z.string().optional().or(z.literal("")),
});

type HouseholdFormData = z.infer<typeof householdFormSchema>;

type CutListItemWithHousehold = CutListItem & {
  household: Household;
};

type BudgetCapacity = {
  maxGuests: number;
  currentCount: number;
  costPerHead: number;
  totalBudget: number;
  remainingBudget: number;
};

type GuestPlanningSnapshot = {
  confirmedHouseholds: Household[];
  pendingSuggestions: Array<GuestSuggestion & { suggestedByName?: string }>;
  cutList: CutListItemWithHousehold[];
  summary: {
    confirmedSeats: number;
    pendingSeats: number;
    cutSeats: number;
    totalPotentialSeats: number;
    priorityBreakdown: {
      must_invite: { confirmed: number; pending: number };
      should_invite: { confirmed: number; pending: number };
      nice_to_have: { confirmed: number; pending: number };
    };
  };
  events: Array<{
    id: string;
    name: string;
    type: string;
    date: string | null;
    costPerHead: number | null;
    venueCapacity: number | null;
    budgetAllocation: number | null;
    confirmedInvited: number;
    potentialTotal: number;
    confirmedCost: number;
    potentialCost: number;
    capacityUsed: number;
    capacityRemaining: number | null;
    isOverCapacity: boolean;
    isOverBudget: boolean;
  }>;
  budget: {
    weddingTotalBudget: number;
    guestBudget: number;
    defaultCostPerHead: number;
    confirmedSpend: number;
    potentialSpend: number;
    remainingBudget: number;
    potentialOverage: number;
    isOverBudget: boolean;
  };
};

function exportToCSV(households: Household[], guests: Guest[]) {
  const headers = ['Household Name', 'Affiliation', 'Relationship Tier', 'Max Seats', 'Guest Count', 'Guest Names', 'Contact Email'];
  
  const rows = households.map(household => {
    const householdGuests = guests.filter(g => g.householdId === household.id);
    const guestNames = householdGuests.map(g => g.name).join('; ');
    const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
    
    return [
      household.name,
      household.affiliation === 'bride' ? "Bride's Side" : household.affiliation === 'groom' ? "Groom's Side" : "Mutual",
      household.relationshipTier === 'immediate_family' ? 'Immediate Family' :
        household.relationshipTier === 'extended_family' ? 'Extended Family' :
        household.relationshipTier === 'parents_friend' ? "Parent's Friends" : 'Friends',
      household.maxCount || 0,
      householdGuests.length,
      guestNames || 'No guests added',
      mainContact?.email || 'Not provided'
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `guest-allocations-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function EventCostBreakdown({ eventId, guestCount }: { eventId: string; guestCount: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: costItems = [], isLoading } = useQuery<EventCostItem[]>({
    queryKey: ["/api/events", eventId, "cost-items"],
    enabled: isOpen,
  });

  if (costItems.length === 0 && !isLoading && !isOpen) {
    return null;
  }

  const calculateTotalCost = () => {
    return costItems.reduce((total, item) => {
      const amount = parseFloat(item.amount);
      if (item.costType === "per_head") {
        return total + (amount * guestCount);
      }
      return total + amount;
    }, 0);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3 pt-3 border-t">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full" data-testid={`button-expand-costs-${eventId}`}>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        <span>{isOpen ? "Hide" : "View"} Cost Breakdown</span>
        {!isOpen && costItems.length > 0 && (
          <Badge variant="secondary" className="ml-auto">{costItems.length} items</Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading costs...</p>
        ) : costItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No detailed costs added yet. Edit this event to add cost breakdown.
          </p>
        ) : (
          <div className="space-y-2">
            {costItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm" data-testid={`cost-item-${item.id}`}>
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.costType === "per_head" ? "Per Guest" : "Fixed"}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    ${item.costType === "per_head" 
                      ? (parseFloat(item.amount) * guestCount).toLocaleString()
                      : parseFloat(item.amount).toLocaleString()
                    }
                  </span>
                  {item.costType === "per_head" && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (${parseFloat(item.amount).toLocaleString()} x {guestCount})
                    </span>
                  )}
                </div>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between font-semibold text-sm">
              <span>Total from breakdown:</span>
              <span className="text-primary">${calculateTotalCost().toLocaleString()}</span>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Guests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Top-level tab state
  const [mainTab, setMainTab] = useState("guest-planning");
  const [planningTab, setPlanningTab] = useState("add");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "approved" | "maybe" | "declined">("pending");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [collectorLinksDialogOpen, setCollectorLinksDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Household state
  const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [householdTokens, setHouseholdTokens] = useState<Map<string, string>>(new Map());

  // Bulk invitation state
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [selectedHouseholds, setSelectedHouseholds] = useState<string[]>([]);
  const [selectedInviteEvents, setSelectedInviteEvents] = useState<string[]>([]);
  const [personalMessage, setPersonalMessage] = useState("");

  // Allocation view filters
  const [affiliationFilter, setAffiliationFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // QR code state
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedHouseholdForQR, setSelectedHouseholdForQR] = useState<Household | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  // Guest Planning state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GuestSuggestion | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Event quick-edit state for Optimize tab
  const [eventEditDialogOpen, setEventEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEventCostPerHead, setEditEventCostPerHead] = useState("");
  const [editEventCapacity, setEditEventCapacity] = useState("");

  // Mobile-first filters for household view
  const [sideFilter, setSideFilter] = useState<'all' | 'bride' | 'groom'>('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string | null>(null);

  // WhatsApp template blast state
  const [whatsappBlastDialogOpen, setWhatsappBlastDialogOpen] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState("Hi {name}! This is a friendly reminder about our wedding. We're still waiting for your RSVP. Please let us know if you can make it!");
  const [whatsappTargetEvent, setWhatsappTargetEvent] = useState<string>("");

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: guests = [], isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: [`/api/events/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  const { data: households = [], isLoading: householdsLoading } = useQuery<Household[]>({
    queryKey: ["/api/households", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Guest Planning queries
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<GuestSuggestion[]>({
    queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"],
    enabled: !!wedding?.id,
  });

  const { data: suggestionsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"],
    enabled: !!wedding?.id,
  });

  // Collector submissions - families added via collector links
  const { data: collectorSubmissions = [], isLoading: collectorLoading } = useQuery<GuestCollectorSubmission[]>({
    queryKey: ["/api/weddings", wedding?.id, "collector-submissions"],
    enabled: !!wedding?.id,
  });

  const { data: budgetData } = useQuery<{ settings: any; capacity: BudgetCapacity }>({
    queryKey: ["/api/weddings", wedding?.id, "guest-budget"],
    enabled: !!wedding?.id,
  });

  const { data: cutList = [], isLoading: cutListLoading } = useQuery<CutListItemWithHousehold[]>({
    queryKey: ["/api/weddings", wedding?.id, "cut-list"],
    enabled: !!wedding?.id,
  });

  // Guest Planning Snapshot - comprehensive view for the new 3-phase workflow
  const { data: planningSnapshot, isLoading: snapshotLoading, isError: snapshotError, refetch: refetchSnapshot } = useQuery<GuestPlanningSnapshot>({
    queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"],
    enabled: !!wedding?.id,
  });

  // Fetch magic links for households with active links on page load
  useEffect(() => {
    if (!households || households.length === 0) return;

    const fetchMagicLinks = async () => {
      const newTokens = new Map(householdTokens);
      
      for (const household of households) {
        if (householdTokens.has(household.id)) continue;
        if (!household.magicLinkTokenHash || !household.magicLinkExpires) continue;
        if (new Date(household.magicLinkExpires) < new Date()) continue;

        try {
          const response = await fetch(`/api/households/${household.id}/magic-link`);
          if (response.ok) {
            const data = await response.json();
            newTokens.set(household.id, data.token);
          }
        } catch (error) {
          console.error(`Failed to fetch magic link for household ${household.id}:`, error);
        }
      }

      if (newTokens.size > householdTokens.size) {
        setHouseholdTokens(newTokens);
      }
    };

    fetchMagicLinks();
  }, [households]); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      side: "bride",
      rsvpStatus: "pending",
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    },
  });

  const householdForm = useForm<HouseholdFormData>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: {
      name: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressPostalCode: "",
      addressCountry: "",
      maxCount: 1,
      affiliation: "bride",
      relationshipTier: "friend",
      priorityTier: "should_invite",
      weddingId: wedding?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      return await apiRequest("POST", "/api/guests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest added",
        description: "Guest has been added to your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add guest",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GuestFormData> }) => {
      return await apiRequest("PATCH", `/api/guests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest updated",
        description: "Guest has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest deleted",
        description: "Guest has been removed from your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      });
    },
  });

  // Household mutations
  const createHouseholdMutation = useMutation({
    mutationFn: async (data: HouseholdFormData) => {
      return await apiRequest("POST", "/api/households", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      householdForm.reset();
      toast({
        title: "Household created",
        description: "Household has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create household",
        variant: "destructive",
      });
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HouseholdFormData> }) => {
      return await apiRequest("PATCH", `/api/households/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      setEditingHousehold(null);
      householdForm.reset();
      toast({
        title: "Household updated",
        description: "Household has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update household",
        variant: "destructive",
      });
    },
  });

  const deleteHouseholdMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/households/${id}`);
    },
    onSuccess: (_, householdId) => {
      setHouseholdTokens(prev => {
        const newMap = new Map(prev);
        newMap.delete(householdId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      setEditingHousehold(null);
      householdForm.reset();
      toast({
        title: "Household deleted",
        description: "Household has been removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete household",
        variant: "destructive",
      });
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async (householdId: string) => {
      const response = await apiRequest("POST", `/api/households/${householdId}/generate-token`, {});
      const result = await response.json();
      return { householdId, token: result.token };
    },
    onSuccess: (data) => {
      setHouseholdTokens(prev => new Map(prev).set(data.householdId, data.token));
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      
      const magicLink = `${window.location.origin}/rsvp/${data.token}`;
      navigator.clipboard.writeText(magicLink).then(() => {
        toast({
          title: "Magic link generated & copied",
          description: "Invitation link has been copied to clipboard",
        });
      }).catch(() => {
        toast({
          title: "Magic link generated",
          description: "Invitation link has been generated successfully",
        });
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate magic link",
        variant: "destructive",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (householdId: string) => {
      return await apiRequest("POST", `/api/households/${householdId}/revoke-token`, {});
    },
    onSuccess: (_, householdId) => {
      setHouseholdTokens(prev => {
        const newMap = new Map(prev);
        newMap.delete(householdId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      toast({
        title: "Link revoked",
        description: "Invitation link has been revoked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke invitation link",
        variant: "destructive",
      });
    },
  });

  const sendBulkInvitationsMutation = useMutation({
    mutationFn: async (data: {
      householdIds: string[];
      weddingId: string;
      eventIds: string[];
      personalMessage?: string;
    }) => {
      const response = await apiRequest("POST", "/api/households/send-invitations", data);
      return await response.json();
    },
    onSuccess: (result) => {
      setBulkInviteDialogOpen(false);
      setSelectedHouseholds([]);
      setSelectedInviteEvents([]);
      setPersonalMessage("");
      
      toast({
        title: "Invitations sent",
        description: `Successfully sent ${result.success} invitation(s)${result.errors?.length ? `, ${result.errors.length} failed` : ""}`,
      });

      if (result.errors && result.errors.length > 0) {
        console.error("Bulk invitation errors:", result.errors);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations",
        variant: "destructive",
      });
    },
  });

  // Guest Planning mutations
  const approveSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/guest-suggestions/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Approved", description: "Guest suggestion has been approved and added to your list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve suggestion", variant: "destructive" });
    },
  });

  const rejectSuggestionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/guest-suggestions/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      setRejectDialogOpen(false);
      setSelectedSuggestion(null);
      setRejectReason("");
      toast({ title: "Rejected", description: "Guest suggestion has been declined." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject suggestion", variant: "destructive" });
    },
  });

  // Collector submission mutations
  const approveCollectorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/collector-submissions/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "collector-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Approved", description: "Family has been added to your guest list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve submission", variant: "destructive" });
    },
  });

  const declineCollectorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/collector-submissions/${id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "collector-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Declined", description: "Family submission has been declined." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to decline submission", variant: "destructive" });
    },
  });

  const maybeCollectorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/collector-submissions/${id}/maybe`);
    },
    onSuccess: async () => {
      // Force fresh data fetch by invalidating AND refetching
      await queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "collector-submissions"] });
      await queryClient.refetchQueries({ queryKey: ["/api/weddings", wedding?.id, "collector-submissions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Moved to Maybe", description: "Family submission has been moved to your maybe list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update submission", variant: "destructive" });
    },
  });

  const restoreFromCutListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/cut-list/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Restored", description: "Household has been restored to your guest list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore household", variant: "destructive" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { maxGuestBudget: string; defaultCostPerHead: string }) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/guest-budget`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      toast({ title: "Budget updated", description: "Guest budget settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    },
  });

  // Event quick-edit mutation for cost per head and venue capacity
  const updateEventMutation = useMutation({
    mutationFn: async (data: { eventId: string; costPerHead?: string; venueCapacity?: number | null }) => {
      return await apiRequest("PATCH", `/api/events/${data.eventId}`, {
        costPerHead: data.costPerHead,
        venueCapacity: data.venueCapacity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${wedding?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-planning-snapshot"] });
      setEventEditDialogOpen(false);
      setEditingEvent(null);
      toast({ title: "Event updated", description: "Cost and capacity settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
    },
  });

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditEventCostPerHead(event.costPerHead || "");
    setEditEventCapacity(event.venueCapacity?.toString() || "");
    setEventEditDialogOpen(true);
  };

  const handleSaveEventEdit = () => {
    if (!editingEvent) return;
    updateEventMutation.mutate({
      eventId: editingEvent.id,
      costPerHead: editEventCostPerHead || undefined,
      venueCapacity: editEventCapacity ? parseInt(editEventCapacity) : null,
    });
  };

  const handleGenerateQRCode = async (household: Household) => {
    const token = householdTokens.get(household.id);
    if (!token) {
      toast({
        title: "No invitation link",
        description: "Please generate an invitation link first",
        variant: "destructive",
      });
      return;
    }

    try {
      const rsvpUrl = `${window.location.origin}/rsvp?token=${token}`;
      const qrDataURL = await QRCode.toDataURL(rsvpUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      
      setSelectedHouseholdForQR(household);
      setQrCodeDataURL(qrDataURL);
      setQrCodeDialogOpen(true);
    } catch (error) {
      console.error('QR code generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeDataURL || !selectedHouseholdForQR) return;

    const link = document.createElement('a');
    link.download = `qr-code-${selectedHouseholdForQR.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataURL;
    link.click();

    toast({
      title: "QR Code downloaded",
      description: `QR code for ${selectedHouseholdForQR.name} has been downloaded`,
    });
  };

  const handleBulkImport = async (guests: any[]) => {
    try {
      const guestsWithWeddingId = guests.map(guest => ({
        ...guest,
        weddingId: wedding?.id || "",
      }));

      const response = await apiRequest("POST", "/api/guests/bulk", {
        guests: guestsWithWeddingId,
      });
      
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      
      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.success} guest${result.success > 1 ? 's' : ''}${result.failed > 0 ? `. ${result.failed} failed to import.` : ''}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No guests were imported. Please check your file format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while importing guests. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
    }
  }, [wedding?.id, form]);

  const handleAddGuest = () => {
    setEditingGuest(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      side: "bride" as const,
      rsvpStatus: "pending" as const,
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    });
    setSelectedEvents([]);
    setDialogOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    form.reset({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      side: (guest.side || "bride") as "bride" | "groom" | "mutual",
      rsvpStatus: (guest.rsvpStatus || "pending") as "confirmed" | "declined" | "pending",
      plusOne: guest.plusOne || false,
      eventIds: guest.eventIds || [],
      weddingId: guest.weddingId,
    });
    setSelectedEvents(guest.eventIds || []);
    setDialogOpen(true);
  };

  const handleSubmit = (data: GuestFormData) => {
    const guestData = {
      ...data,
      eventIds: selectedEvents,
    };

    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data: guestData });
    } else {
      createMutation.mutate(guestData);
    }
  };

  const handleDelete = () => {
    if (editingGuest) {
      deleteMutation.mutate(editingGuest.id);
    }
  };

  const handleAddHousehold = () => {
    setEditingHousehold(null);
    householdForm.reset({
      name: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressPostalCode: "",
      addressCountry: "",
      maxCount: 1,
      affiliation: "bride",
      relationshipTier: "friend",
      priorityTier: "should_invite",
      weddingId: wedding?.id || "",
    });
    setHouseholdDialogOpen(true);
  };

  const handleEditHousehold = (household: Household) => {
    setEditingHousehold(household);
    householdForm.reset({
      name: household.name,
      addressStreet: household.addressStreet || "",
      addressCity: household.addressCity || "",
      addressState: household.addressState || "",
      addressPostalCode: household.addressPostalCode || "",
      addressCountry: household.addressCountry || "",
      maxCount: household.maxCount || 1,
      affiliation: household.affiliation as "bride" | "groom" | "mutual",
      relationshipTier: household.relationshipTier || "friend",
      priorityTier: (household.priorityTier as "must_invite" | "should_invite" | "nice_to_have") || "should_invite",
      weddingId: household.weddingId,
    });
    setHouseholdDialogOpen(true);
  };

  const handleHouseholdSubmit = (data: HouseholdFormData) => {
    if (editingHousehold) {
      updateHouseholdMutation.mutate({ id: editingHousehold.id, data });
    } else {
      createHouseholdMutation.mutate(data);
    }
  };

  const handleDeleteHousehold = () => {
    if (editingHousehold) {
      deleteHouseholdMutation.mutate(editingHousehold.id);
    }
  };

  const handleGenerateToken = (householdId: string) => {
    generateTokenMutation.mutate(householdId);
  };

  const handleRevokeToken = (householdId: string) => {
    revokeTokenMutation.mutate(householdId);
  };

  const handleCopyMagicLink = (household: Household) => {
    const token = householdTokens.get(household.id);
    if (!token) {
      toast({
        title: "No link available",
        description: "Generate a magic link first",
        variant: "destructive",
      });
      return;
    }

    const magicLink = `${window.location.origin}/rsvp/${token}`;
    navigator.clipboard.writeText(magicLink).then(() => {
      toast({
        title: "Link copied",
        description: `Invitation link for ${household.name} copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    });
  };

  const handleOpenBulkInvite = () => {
    setSelectedHouseholds([]);
    setSelectedInviteEvents([]);
    setPersonalMessage("");
    setBulkInviteDialogOpen(true);
  };

  const handleToggleHousehold = (householdId: string) => {
    setSelectedHouseholds(prev =>
      prev.includes(householdId)
        ? prev.filter(id => id !== householdId)
        : [...prev, householdId]
    );
  };

  const handleToggleInviteEvent = (eventId: string) => {
    setSelectedInviteEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSendBulkInvitations = () => {
    if (selectedHouseholds.length === 0) {
      toast({
        title: "No households selected",
        description: "Please select at least one household to send invitations",
        variant: "destructive",
      });
      return;
    }

    if (selectedInviteEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event for the invitation",
        variant: "destructive",
      });
      return;
    }

    const householdsWithoutEmail = selectedHouseholds.filter(id => {
      const household = households.find(h => h.id === id);
      const householdGuests = guests.filter(g => g.householdId === id);
      const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
      return !mainContact?.email;
    });

    if (householdsWithoutEmail.length > 0) {
      toast({
        title: "Missing contact emails",
        description: `${householdsWithoutEmail.length} selected household(s) don't have contact emails. Please add them first or deselect these households.`,
        variant: "destructive",
      });
      return;
    }

    sendBulkInvitationsMutation.mutate({
      householdIds: selectedHouseholds,
      weddingId: wedding?.id || "",
      eventIds: selectedInviteEvents,
      personalMessage: personalMessage || undefined,
    });
  };

  if (weddingsLoading || guestsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  // Guest Planning calculations
  const pendingCollectorSubmissions = collectorSubmissions.filter(s => s.status === "pending");
  const approvedCollectorSubmissions = collectorSubmissions.filter(s => s.status === "approved");
  const maybeCollectorSubmissions = collectorSubmissions.filter(s => s.status === "maybe");
  const declinedCollectorSubmissions = collectorSubmissions.filter(s => s.status === "declined");
  const totalPendingReviews = pendingCollectorSubmissions.length;
  
  // Filtered submissions based on filter state
  const filteredCollectorSubmissions = submissionFilter === "all" 
    ? collectorSubmissions 
    : collectorSubmissions.filter(s => s.status === submissionFilter);

  const priorityBreakdown = {
    must_invite: households.filter(h => h.priorityTier === "must_invite"),
    should_invite: households.filter(h => h.priorityTier === "should_invite"),
    nice_to_have: households.filter(h => h.priorityTier === "nice_to_have"),
    unassigned: households.filter(h => !h.priorityTier),
  };

  // Workflow step progress
  const hasGuests = guests.length > 0;
  const allSuggestionsReviewed = hasGuests && pendingCollectorSubmissions.length === 0;
  const hasBudgetSet = budgetData?.settings?.maxGuestBudget && Number(budgetData.settings.maxGuestBudget) > 0;

  // New 3-phase workflow based on user's mental model
  const hasEventsOverCapacity = planningSnapshot?.events.some(e => e.isOverCapacity) || false;
  const hasOverBudget = (planningSnapshot?.budget.potentialOverage || 0) > 0;
  const needsCuts = hasEventsOverCapacity || hasOverBudget;

  const workflowSteps = [
    {
      id: "add",
      label: "Add Families",
      description: "Import or add manually",
      icon: UserPlus,
      isComplete: hasGuests,
      count: guests.length,
    },
    {
      id: "review",
      label: "Review Family Adds",
      description: "Approve suggestions",
      icon: Inbox,
      isComplete: hasGuests && allSuggestionsReviewed,
      count: totalPendingReviews,
    },
    {
      id: "optimize",
      label: "Budget Check",
      description: "Costs & capacity",
      icon: Target,
      isComplete: hasGuests && hasBudgetSet && !needsCuts,
      count: needsCuts ? 1 : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Top-level tabs: Guest List and Guest Planning */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="grid grid-cols-2 w-auto">
              <TabsTrigger value="guest-planning" data-testid="tab-guest-planning" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Plan & Review</span>
                <span className="sm:hidden">Plan</span>
                {totalPendingReviews > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {totalPendingReviews}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="guest-list" data-testid="tab-guest-list" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">View Guest List</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
            </TabsList>
            
            <Link href="/communication-hub">
              <Button className="min-h-[48px] gap-2" data-testid="button-send-invites">
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send Invites & Track RSVPs</span>
                <span className="sm:hidden">Send Invites</span>
              </Button>
            </Link>
          </div>

          {/* Guest List Tab - Current functionality */}
          <TabsContent value="guest-list" className="space-y-6">
            {/* Guest Allocation Summary */}
            {(() => {
              const brideHouseholds = households.filter(h => h.affiliation === 'bride');
              const groomHouseholds = households.filter(h => h.affiliation === 'groom');
              const mutualHouseholds = households.filter(h => h.affiliation === 'mutual');

              const brideGuests = guests.filter(g => g.side === 'bride');
              const groomGuests = guests.filter(g => g.side === 'groom');
              const mutualGuests = guests.filter(g => g.side === 'mutual');
              const unassignedGuests = guests.filter(g => !g.householdId);

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <Card data-testid="card-total-allocation">
                    <CardHeader className="pb-3">
                      <CardDescription>Total Guests</CardDescription>
                      <CardTitle className="text-3xl">{guests.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {households.length} households
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-bride-allocation" className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardDescription>Bride's Side</CardDescription>
                      <CardTitle className="text-3xl">{brideGuests.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {brideHouseholds.length} households
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-groom-allocation" className="border-l-4 border-l-accent">
                    <CardHeader className="pb-3">
                      <CardDescription>Groom's Side</CardDescription>
                      <CardTitle className="text-3xl">{groomGuests.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {groomHouseholds.length} households
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-mutual-allocation" className="border-l-4 border-l-muted">
                    <CardHeader className="pb-3">
                      <CardDescription>Mutual</CardDescription>
                      <CardTitle className="text-3xl">{mutualGuests.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {mutualHouseholds.length} households
                      </p>
                    </CardContent>
                  </Card>

                  {unassignedGuests.length > 0 && (
                    <Card data-testid="card-unassigned-allocation" className="border-l-4 border-l-destructive">
                      <CardHeader className="pb-3">
                        <CardDescription>Unassigned</CardDescription>
                        <CardTitle className="text-3xl">{unassignedGuests.length}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          No household
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}

            <Tabs defaultValue="households" className="space-y-6">
              <TabsList>
                <TabsTrigger value="households" data-testid="tab-households">
                  <Users className="w-4 h-4 mr-2" />
                  Households
                </TabsTrigger>
                <TabsTrigger value="guests" data-testid="tab-guests">
                  Individual Guests
                </TabsTrigger>
                <TabsTrigger value="duplicates" data-testid="tab-duplicates">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Duplicates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guests" className="space-y-4">
                <GuestListManager
                  guests={guests}
                  households={households}
                  onAddGuest={handleAddGuest}
                  onImportGuests={() => setImportDialogOpen(true)}
                  onEditGuest={handleEditGuest}
                />
              </TabsContent>

              <TabsContent value="households" className="space-y-4">
                {/* Mobile-First Summary Header */}
                <SummaryHeader
                  totalHouseholds={households.length}
                  totalGuests={guests.length}
                  rsvpPending={guests.filter(g => g.rsvpStatus === 'pending').length}
                  rsvpConfirmed={guests.filter(g => g.rsvpStatus === 'confirmed').length}
                  onSendReminders={() => setWhatsappBlastDialogOpen(true)}
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Household Management</h2>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                      Group families together and manage invitation links
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={handleOpenBulkInvite} variant="default" className="min-h-[44px]" data-testid="button-bulk-invite">
                      <Send className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Send Invitations</span>
                      <span className="sm:hidden">Invite</span>
                    </Button>
                    <Button onClick={handleAddHousehold} variant="outline" className="min-h-[44px]" data-testid="button-add-household">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Add Household</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>

                {/* Side Filter Toggle - Bride's vs Groom's */}
                <SideFilterToggle
                  selected={sideFilter}
                  onSelect={setSideFilter}
                  counts={{
                    bride: households.filter(h => h.affiliation === 'bride').length,
                    groom: households.filter(h => h.affiliation === 'groom').length,
                    mutual: households.filter(h => h.affiliation === 'mutual').length,
                  }}
                />

                {/* Event Filter Pills with Capacity Meters */}
                {events.length > 0 && (
                  <EventFilterPills
                    events={events}
                    selectedEventId={selectedEventFilter}
                    onSelectEvent={setSelectedEventFilter}
                    householdCounts={new Map(events.map(e => {
                      const guestsForEvent = guests.filter(g => g.eventIds?.includes(e.id));
                      return [e.id, guestsForEvent.length];
                    }))}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {households
                    .filter(household => {
                      if (sideFilter !== 'all' && household.affiliation !== sideFilter) return false;
                      if (selectedEventFilter) {
                        const householdGuests = guests.filter(g => g.householdId === household.id);
                        const hasGuestInEvent = householdGuests.some(g => g.eventIds?.includes(selectedEventFilter));
                        if (!hasGuestInEvent) return false;
                      }
                      return true;
                    })
                    .map((household) => {
                    const householdGuests = guests.filter(g => g.householdId === household.id);
                    const hasActiveLink = household.magicLinkTokenHash && household.magicLinkExpires && new Date(household.magicLinkExpires) > new Date();

                    return (
                      <Card key={household.id} className="hover-elevate" data-testid={`card-household-${household.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{household.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {householdGuests.length} {householdGuests.length === 1 ? 'seat' : 'seats'}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-household-menu-${household.id}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditHousehold(household)}
                                  data-testid={`menu-edit-household-${household.id}`}
                                >
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" data-testid={`badge-affiliation-${household.id}`}>
                              {household.affiliation === 'bride' ? "Bride's Side" : household.affiliation === 'groom' ? "Groom's Side" : "Mutual"}
                            </Badge>
                            <Badge variant="secondary" data-testid={`badge-tier-${household.id}`}>
                              {household.relationshipTier?.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                            {hasActiveLink && (
                              <Badge variant="default" data-testid={`badge-link-active-${household.id}`}>
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Link Active
                              </Badge>
                            )}
                          </div>

                          {/* Main Point of Contact */}
                          {(() => {
                            const mainContactGuest = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                            const contactPhone = mainContactGuest?.phone;
                            const contactEmail = mainContactGuest?.email;
                            return (contactEmail || contactPhone || householdGuests.length > 0) && (
                              <div className="text-sm border rounded-md p-2 bg-muted/30 space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {mainContactGuest?.name || household.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">Main Contact</Badge>
                                </div>
                                {(contactPhone || contactEmail) && (
                                  <div className="text-xs text-muted-foreground space-y-1 pl-6">
                                    {contactPhone && (
                                      <div className="flex items-center gap-1.5" data-testid={`text-phone-${household.id}`}>
                                        <Phone className="w-3 h-3" />
                                        <span>{contactPhone}</span>
                                      </div>
                                    )}
                                    {contactEmail && (
                                      <div className="flex items-center gap-1.5" data-testid={`text-email-${household.id}`}>
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate">{contactEmail}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {contactPhone && (
                                  <div className="flex flex-wrap gap-1 pl-6">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => window.open(`https://wa.me/${contactPhone.replace(/\D/g, '')}`, '_blank')}
                                      data-testid={`button-whatsapp-${household.id}`}
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      WhatsApp
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => window.open(`sms:${contactPhone}`, '_blank')}
                                      data-testid={`button-sms-${household.id}`}
                                    >
                                      <Phone className="w-3 h-3" />
                                      SMS
                                    </Button>
                                    {contactEmail && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => window.open(`mailto:${contactEmail}`, '_blank')}
                                        data-testid={`button-email-${household.id}`}
                                      >
                                        <Mail className="w-3 h-3" />
                                        Email
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {householdGuests.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <div className="font-medium mb-1">Members ({householdGuests.length}):</div>
                              <ul className="space-y-0.5">
                                {householdGuests.map((guest, idx) => (
                                  <li key={guest.id} className="flex items-center gap-1">
                                    {guest.name}
                                    {idx === (household.headOfHouseIndex || 0) && (
                                      <span className="text-xs text-primary">(Contact)</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {hasActiveLink ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyMagicLink(household)}
                                  className="flex-1"
                                  data-testid={`button-copy-link-${household.id}`}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateQRCode(household)}
                                  data-testid={`button-qr-code-${household.id}`}
                                >
                                  <QrCode className="w-3 h-3 mr-1" />
                                  QR Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeToken(household.id)}
                                  data-testid={`button-revoke-link-${household.id}`}
                                >
                                  Revoke
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateToken(household.id)}
                                className="flex-1"
                                data-testid={`button-generate-link-${household.id}`}
                              >
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Generate RSVP Link
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {households.length === 0 && (
                    <Card className="col-span-full border-dashed">
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No Households Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create households to group families and manage invitations together.
                        </p>
                        <Button onClick={handleAddHousehold} data-testid="button-add-first-household">
                          <Users className="w-4 h-4 mr-2" />
                          Add Your First Household
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="duplicates" className="space-y-6">
                <DuplicatesManager weddingId={wedding?.id || ""} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Guest Planning Tab - Simplified unified experience */}
          <TabsContent value="guest-planning" className="space-y-6">

            {/* Planning Tabs - Simplified with clear action labels */}
            <Tabs value={planningTab} onValueChange={setPlanningTab}>
              <TabsList className="w-full sm:w-auto grid grid-cols-2 h-auto">
                <TabsTrigger value="add" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-add-families">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Families</span>
                  <span className="sm:hidden text-xs">Add</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-review-families">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden sm:inline">Review Family Adds</span>
                  <span className="sm:hidden text-xs">Review</span>
                  {pendingCollectorSubmissions.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                      {pendingCollectorSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Phase 1: Add Families - Import or add manually */}
              <TabsContent value="add" className="space-y-6">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-orange-50/50 to-pink-50/50 dark:from-orange-950/10 dark:to-pink-950/10">
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                        <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">Add Your Families</h2>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                        Import a spreadsheet or add families one by one. Don't worry about being perfect - you can adjust later!
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                      <Card className="hover-elevate cursor-pointer" onClick={() => setImportDialogOpen(true)} data-testid="card-import-guests">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="inline-flex p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3 sm:mb-4">
                            <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg mb-2">Import from Spreadsheet</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Upload a CSV or Excel file
                          </p>
                          <Button className="w-full min-h-[48px]" data-testid="button-import-spreadsheet">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Families
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover-elevate cursor-pointer" onClick={() => setHouseholdDialogOpen(true)} data-testid="card-add-manual">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="inline-flex p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-3 sm:mb-4">
                            <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg mb-2">Add Family Manually</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Add one household at a time
                          </p>
                          <Button variant="outline" className="w-full min-h-[48px]" data-testid="button-add-manual">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Family
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover-elevate cursor-pointer" onClick={() => setCollectorLinksDialogOpen(true)} data-testid="card-collector-links">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="inline-flex p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3 sm:mb-4">
                            <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg mb-2">Share with Family</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Let parents/relatives add guests
                          </p>
                          <Button variant="outline" className="w-full min-h-[48px]" data-testid="button-collector-links">
                            <Share2 className="w-4 h-4 mr-2" />
                            Create Links
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {hasGuests && (
                      <div className="mt-6 sm:mt-8 text-center">
                        <Badge variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-2 gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {households.length} {households.length === 1 ? 'family' : 'families'} ({guests.length} guests)
                        </Badge>
                        {totalPendingReviews > 0 && (
                          <div className="mt-4">
                            <Button 
                              variant="default"
                              className="min-h-[48px]"
                              onClick={() => setPlanningTab("review")}
                              data-testid="button-continue-planning"
                            >
                              Review Family Adds
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Tips */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Excel or CSV works great</p>
                        <p className="text-muted-foreground">Include Household Name, Name, Email, Phone columns</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Group by household later</p>
                        <p className="text-muted-foreground">You can organize families after importing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Nothing is final yet</p>
                        <p className="text-muted-foreground">This is your sandbox to plan freely</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Phase 2: Review - Review family suggestions */}
              <TabsContent value="review" className="space-y-6">
                <Card className={`border-2 ${pendingCollectorSubmissions.length === 0 ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${pendingCollectorSubmissions.length === 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                        {pendingCollectorSubmissions.length === 0 ? (
                          <Sparkles className="h-5 w-5 text-green-600" />
                        ) : (
                          <Inbox className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        {pendingCollectorSubmissions.length === 0 ? (
                          <>
                            <p className="font-semibold text-green-700 dark:text-green-400">All Caught Up!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              No pending family submissions to review. When family members add guests via collector links, they'll appear here.
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-3 gap-2"
                              onClick={() => setMainTab("guest-list")}
                              data-testid="button-see-full-picture"
                            >
                              See the Full Picture
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">Review Family Submissions</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              You have {pendingCollectorSubmissions.length} pending submission{pendingCollectorSubmissions.length !== 1 ? 's' : ''} to review from family members via collector links. Approve to add to your guest list, mark as Maybe for later, or decline.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Collector Link Submissions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                        Family Submissions
                        {pendingCollectorSubmissions.length > 0 && (
                          <Badge variant="destructive">{pendingCollectorSubmissions.length} pending</Badge>
                        )}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Guests added by family members via collector links
                      </p>
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={submissionFilter === "all" ? "default" : "outline"}
                      onClick={() => setSubmissionFilter("all")}
                      data-testid="filter-all"
                    >
                      All ({collectorSubmissions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={submissionFilter === "pending" ? "default" : "outline"}
                      onClick={() => setSubmissionFilter("pending")}
                      data-testid="filter-pending"
                    >
                      Pending ({pendingCollectorSubmissions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={submissionFilter === "approved" ? "default" : "outline"}
                      onClick={() => setSubmissionFilter("approved")}
                      data-testid="filter-approved"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approved ({approvedCollectorSubmissions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={submissionFilter === "maybe" ? "default" : "outline"}
                      onClick={() => setSubmissionFilter("maybe")}
                      data-testid="filter-maybe"
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Maybe ({maybeCollectorSubmissions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={submissionFilter === "declined" ? "default" : "outline"}
                      onClick={() => setSubmissionFilter("declined")}
                      data-testid="filter-declined"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Declined ({declinedCollectorSubmissions.length})
                    </Button>
                  </div>

                  {collectorLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                  ) : filteredCollectorSubmissions.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        {submissionFilter === "pending" ? (
                          <>
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                            <p className="font-medium mb-1">No Pending Family Submissions</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              When family members add guests via collector links, they'll appear here for your review.
                            </p>
                            <Button 
                              onClick={() => setMainTab("guest-list")}
                              className="gap-2"
                              data-testid="button-view-guest-list"
                            >
                              <Users className="h-4 w-4" />
                              View Guest List
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <p className="font-medium mb-1">No {submissionFilter === "all" ? "" : submissionFilter} submissions</p>
                            <p className="text-sm text-muted-foreground">
                              {submissionFilter === "approved" && "Approved families will appear in your guest list."}
                              {submissionFilter === "maybe" && "Families you're undecided about will appear here."}
                              {submissionFilter === "declined" && "Declined families will appear here."}
                              {submissionFilter === "all" && "No family submissions yet."}
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredCollectorSubmissions.map(submission => (
                        <Card key={submission.id} data-testid={`card-collector-${submission.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  {submission.householdName || submission.guestName}
                                  {submission.status === "approved" && (
                                    <Badge variant="default" className="text-xs">Approved</Badge>
                                  )}
                                  {submission.status === "maybe" && (
                                    <Badge variant="secondary" className="text-xs">Maybe</Badge>
                                  )}
                                  {submission.status === "declined" && (
                                    <Badge variant="destructive" className="text-xs">Declined</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {submission.guestCount || submission.guestNames?.length || 1} {(submission.guestCount || submission.guestNames?.length || 1) === 1 ? "guest" : "guests"}
                                  </Badge>
                                  {submission.relationshipTier && (
                                    <Badge variant="outline" className="text-xs">
                                      {submission.relationshipTier.replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                  {submission.submitterName && (
                                    <Badge variant="outline" className="text-xs">
                                      added by {submission.submitterName}
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {/* Show different actions based on current status */}
                                {submission.status !== "approved" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => approveCollectorMutation.mutate(submission.id)}
                                    disabled={approveCollectorMutation.isPending}
                                    data-testid={`button-approve-collector-${submission.id}`}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {submission.status !== "maybe" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => maybeCollectorMutation.mutate(submission.id)}
                                    disabled={maybeCollectorMutation.isPending}
                                    data-testid={`button-maybe-collector-${submission.id}`}
                                  >
                                    <HelpCircle className="h-4 w-4 mr-1" />
                                    Maybe
                                  </Button>
                                )}
                                {submission.status !== "declined" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => declineCollectorMutation.mutate(submission.id)}
                                    disabled={declineCollectorMutation.isPending}
                                    data-testid={`button-decline-collector-${submission.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2 space-y-1">
                            {submission.guestNames && submission.guestNames.length > 0 && (
                              <p className="text-sm"><strong>Guests:</strong> {submission.guestNames.join(", ")}</p>
                            )}
                            {(submission.mainContactName || submission.guestEmail || submission.guestPhone) && (
                              <div className="text-sm space-y-0.5">
                                {submission.mainContactName && (
                                  <p><strong>Main Contact:</strong> {submission.mainContactName}</p>
                                )}
                                {submission.guestEmail && (
                                  <p><strong>Email:</strong> {submission.guestEmail}</p>
                                )}
                                {submission.guestPhone && (
                                  <p><strong>Phone:</strong> {submission.guestPhone}</p>
                                )}
                              </div>
                            )}
                            {(submission.contactStreet || submission.contactCity || submission.contactState) && (
                              <p className="text-sm">
                                <strong>Address:</strong>{" "}
                                {[
                                  submission.contactStreet,
                                  submission.contactCity,
                                  submission.contactState,
                                  submission.contactPostalCode,
                                  submission.contactCountry
                                ].filter(Boolean).join(", ")}
                              </p>
                            )}
                            {submission.desiDietaryType && submission.desiDietaryType !== "none" && (
                              <p className="text-sm"><strong>Dietary:</strong> {submission.desiDietaryType.replace(/_/g, ' ')}</p>
                            )}
                            {submission.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{submission.notes}</p>
                            )}
                            {submission.submitterRelation && (
                              <p className="text-xs text-muted-foreground mt-1">Relationship: {submission.submitterRelation}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Phase 2: Optimize - See the big picture and make adjustments */}
              <TabsContent value="optimize" className="space-y-6">
                {/* Friendly Intro Explainer */}
                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">How This Works</p>
                        <div className="text-sm text-muted-foreground mt-1 space-y-2">
                          <p>
                            <strong>Cost Per Head</strong> = How much each guest costs at an event (food, drinks, etc.)
                          </p>
                          <p>
                            <strong>Venue Capacity</strong> = Maximum number of people your venue can hold
                          </p>
                          <p>
                            We use these to show you if you're over budget or over capacity. Click the "Edit" button on any event to adjust these numbers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {snapshotLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : snapshotError || !planningSnapshot ? (
                  <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-6 text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
                      <h3 className="font-semibold text-lg">Unable to Load Planning Data</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        We couldn't fetch your guest planning snapshot. This might be a temporary issue.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => refetchSnapshot()}
                      >
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Status Banner */}
                    <Card className={`border-2 ${!needsCuts ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${!needsCuts ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                            {!needsCuts ? (
                              <Sparkles className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            {!needsCuts ? (
                              <>
                                <p className="font-semibold text-green-700 dark:text-green-400">Looking Good!</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  All your guests (including pending suggestions) fit within your budget and venue capacities.
                                </p>
                                <Button 
                                  size="sm" 
                                  className="mt-3 gap-2"
                                  onClick={() => setMainTab("guest-list")}
                                >
                                  View Final Guest List
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-amber-700 dark:text-amber-400">Decisions Needed</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {hasOverBudget && `Over budget by $${planningSnapshot?.budget.potentialOverage?.toLocaleString()}. `}
                                  {hasEventsOverCapacity && `Some events exceed venue capacity. `}
                                  Review the details below to optimize your guest list.
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* The Whole Picture Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-blue-600" data-testid="text-confirmed-seats">
                            {planningSnapshot?.summary.confirmedSeats || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Confirmed Guests</p>
                          <p className="text-xs text-muted-foreground mt-1">Your current list</p>
                        </CardContent>
                      </Card>

                      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-orange-600" data-testid="text-pending-seats">
                            +{planningSnapshot?.summary.pendingSeats || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Pending Suggestions</p>
                          <p className="text-xs text-muted-foreground mt-1">From family members</p>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-purple-600" data-testid="text-total-potential">
                            {planningSnapshot?.summary.totalPotentialSeats || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Potential</p>
                          <p className="text-xs text-muted-foreground mt-1">If all approved</p>
                        </CardContent>
                      </Card>

                      <Card className={`${!needsCuts ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}`}>
                        <CardContent className="p-4 text-center">
                          <p className={`text-3xl font-bold ${!needsCuts ? "text-green-600" : "text-red-600"}`} data-testid="text-budget-status">
                            ${planningSnapshot?.budget.potentialSpend?.toLocaleString() || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Projected Cost</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Guest Budget: ${planningSnapshot?.budget.guestBudget?.toLocaleString() || 0}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Budget Settings */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Budget Settings
                        </CardTitle>
                        <CardDescription>Set your guest budget and default cost per head</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="totalBudget">Total Guest Budget</Label>
                            <Input
                              id="totalBudget"
                              type="number"
                              placeholder="e.g., 50000"
                              defaultValue={budgetData?.settings?.maxGuestBudget || ""}
                              onBlur={(e) => {
                                updateBudgetMutation.mutate({
                                  maxGuestBudget: e.target.value,
                                  defaultCostPerHead: budgetData?.settings?.defaultCostPerHead || "150",
                                });
                              }}
                              data-testid="input-total-budget"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="costPerHead">Default Cost Per Head</Label>
                            <Input
                              id="costPerHead"
                              type="number"
                              placeholder="e.g., 150"
                              defaultValue={budgetData?.settings?.defaultCostPerHead || "150"}
                              onBlur={(e) => {
                                updateBudgetMutation.mutate({
                                  maxGuestBudget: budgetData?.settings?.maxGuestBudget || "0",
                                  defaultCostPerHead: e.target.value,
                                });
                              }}
                              data-testid="input-cost-per-head"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Per-Event Cost & Capacity Breakdown */}
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        Per-Event Cost & Capacity
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        See how your guest list impacts each event. This shows the cost and capacity for ALL potential guests (confirmed + pending suggestions).
                      </p>

                      {planningSnapshot?.events && planningSnapshot.events.length > 0 ? (
                        <div className="space-y-3">
                          {planningSnapshot.events.map(event => (
                            <Card 
                              key={event.id} 
                              className={`${event.isOverCapacity || event.isOverBudget ? "border-red-300 bg-red-50/30 dark:bg-red-950/20" : ""}`}
                              data-testid={`card-event-${event.id}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-semibold">{event.name}</h3>
                                      {event.isOverCapacity && (
                                        <Badge variant="destructive" className="text-xs">
                                          Over Capacity
                                        </Badge>
                                      )}
                                      {event.isOverBudget && (
                                        <Badge variant="destructive" className="text-xs">
                                          Over Budget
                                        </Badge>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs gap-1"
                                        onClick={() => {
                                          const fullEvent = events.find(e => e.id === event.id);
                                          if (fullEvent) handleEditEvent(fullEvent);
                                        }}
                                        data-testid={`button-edit-event-${event.id}`}
                                      >
                                        <Pencil className="h-3 w-3" />
                                        Edit
                                      </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {event.date ? new Date(event.date).toLocaleDateString() : "Date TBD"}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <p className="text-lg font-bold">{event.potentialTotal}</p>
                                      <p className="text-xs text-muted-foreground">Potential Guests</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold">
                                        ${event.costPerHead?.toLocaleString() || planningSnapshot?.budget?.defaultCostPerHead || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Per Head</p>
                                    </div>
                                    <div>
                                      <p className={`text-lg font-bold ${event.isOverCapacity || event.isOverBudget ? "text-red-600" : ""}`}>
                                        ${event.potentialCost?.toLocaleString() || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Total Cost</p>
                                      {event.budgetAllocation && (
                                        <p className="text-xs text-muted-foreground">
                                          of ${event.budgetAllocation.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="w-full mt-2">
                                    {event.venueCapacity ? (
                                      <>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                          <span>Capacity: {event.potentialTotal} / {event.venueCapacity}</span>
                                          {event.isOverCapacity && (
                                            <span className="text-red-600 font-medium">
                                              {Math.abs(event.capacityRemaining || 0)} over
                                            </span>
                                          )}
                                        </div>
                                        <Progress
                                          value={Math.min((event.potentialTotal / event.venueCapacity) * 100, 100)}
                                          className={`h-2 ${event.isOverCapacity ? "[&>div]:bg-red-500" : ""}`}
                                        />
                                      </>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">
                                        No venue capacity set for this event. Edit the event to add one.
                                      </p>
                                    )}
                                  </div>

                                  <EventCostBreakdown eventId={event.id} guestCount={event.potentialTotal} />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                            <p className="font-medium">No Events Yet</p>
                            <p className="text-sm text-muted-foreground">
                              Add events to your wedding timeline to see per-event cost breakdowns.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Household List with Quick Cut Actions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            Households to Consider
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Review households and move to "Maybe Later" if needed
                          </p>
                        </div>
                      </div>

                      {planningSnapshot?.confirmedHouseholds && planningSnapshot.confirmedHouseholds.length > 0 ? (
                        <div className="space-y-2">
                          {planningSnapshot.confirmedHouseholds
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(household => (
                              <Card key={household.id} className="hover-elevate" data-testid={`card-household-assess-${household.id}`}>
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium truncate text-base">{household.name}</p>
                                        <Badge 
                                          variant={household.affiliation === 'bride' ? 'default' : household.affiliation === 'groom' ? 'secondary' : 'outline'}
                                          className="text-base"
                                        >
                                          {household.affiliation === 'bride' ? "Bride's" : household.affiliation === 'groom' ? "Groom's" : "Mutual"}
                                        </Badge>
                                      </div>
                                      <p className="text-base text-muted-foreground">
                                        {household.maxCount} guests
                                        {household.relationshipTier && ` • ${household.relationshipTier.replace('_', ' ')}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-medium">
                                        ${(household.maxCount * (planningSnapshot?.budget?.defaultCostPerHead || 150)).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <p className="font-medium mb-1">No Households Yet</p>
                            <p className="text-sm text-muted-foreground">
                              Add households in the Guest List tab to see them here.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Maybe Later Section - Parked Guests */}
                    {cutList.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-amber-600" />
                            Maybe Later
                            <Badge variant="secondary" className="ml-auto">{cutList.length} parked</Badge>
                          </CardTitle>
                          <CardDescription>
                            These guests won't receive invitations - restore them anytime
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {cutList.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg border" data-testid={`card-cut-${item.id}`}>
                              <div>
                                <p className="font-medium">{item.household?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{item.household?.maxCount || 0} guests</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => restoreFromCutListMutation.mutate(item.id)}
                                disabled={restoreFromCutListMutation.isPending}
                                data-testid={`button-restore-${item.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button 
                        size="lg"
                        onClick={() => setMainTab("guest-list")}
                        className="gap-2"
                        data-testid="button-view-guest-list"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        View Final Guest List
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Guest Import Dialog */}
      <GuestImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        weddingId={wedding.id}
        events={events}
        onImport={handleBulkImport}
      />

      {/* Collector Links Dialog */}
      <Dialog open={collectorLinksDialogOpen} onOpenChange={setCollectorLinksDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share with Family Members
            </DialogTitle>
            <DialogDescription>
              Create shareable links for parents, aunties, and uncles to add guest names. They don't need an account - just share the link!
            </DialogDescription>
          </DialogHeader>
          <CollectorLinksManager 
            weddingId={wedding.id} 
            onNavigateToReview={() => {
              setCollectorLinksDialogOpen(false);
              setMainTab("guest-planning");
              setPlanningTab("review");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Guest Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-guest">
              {editingGuest ? "Edit Guest" : "Add Guest"}
            </DialogTitle>
            <DialogDescription>
              {editingGuest
                ? "Update guest information and event assignments"
                : "Add a new guest to your wedding"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Guest name"
                data-testid="input-guest-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="email@example.com"
                  data-testid="input-guest-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-guest-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <Select
                  value={form.watch("side")}
                  onValueChange={(value) => form.setValue("side", value as "bride" | "groom" | "mutual")}
                >
                  <SelectTrigger id="side" data-testid="select-guest-side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpStatus">RSVP Status</Label>
                <Select
                  value={form.watch("rsvpStatus")}
                  onValueChange={(value) => form.setValue("rsvpStatus", value as "confirmed" | "declined" | "pending")}
                >
                  <SelectTrigger id="rsvpStatus" data-testid="select-guest-rsvp">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="plusOne"
                checked={form.watch("plusOne") ?? false}
                onCheckedChange={(checked) => form.setValue("plusOne", checked as boolean)}
                data-testid="checkbox-plus-one"
              />
              <Label htmlFor="plusOne" className="cursor-pointer">
                Bringing a plus one
              </Label>
            </div>

            {events.length > 0 && (
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                          }
                        }}
                        data-testid={`checkbox-event-${event.id}`}
                      />
                      <Label htmlFor={`event-${event.id}`} className="cursor-pointer flex-1">
                        {event.name}
                        {event.date && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({new Date(event.date).toLocaleDateString()})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {editingGuest && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-guest"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className={`flex gap-2 ${editingGuest ? "" : "ml-auto"}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-guest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-guest"
                >
                  {editingGuest ? "Update Guest" : "Add Guest"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Household Form Dialog */}
      <Dialog open={householdDialogOpen} onOpenChange={setHouseholdDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-household">
              {editingHousehold ? "Edit Household" : "Add Household"}
            </DialogTitle>
            <DialogDescription>
              {editingHousehold
                ? "Update household information and allocation"
                : "Create a new household group for your wedding"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={householdForm.handleSubmit(handleHouseholdSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="household-name">
                Household Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="household-name"
                {...householdForm.register("name")}
                placeholder="e.g., The Patel Family"
                data-testid="input-household-name"
              />
              {householdForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Contact details (email, phone) are managed on individual guests. The Main Point of Contact's email will be used for household communications.
            </p>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                {...householdForm.register("addressStreet")}
                placeholder="Street Address"
                data-testid="input-household-address-street"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  {...householdForm.register("addressCity")}
                  placeholder="City"
                  data-testid="input-household-address-city"
                />
                <Input
                  {...householdForm.register("addressState")}
                  placeholder="State/Province"
                  data-testid="input-household-address-state"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  {...householdForm.register("addressPostalCode")}
                  placeholder="Postal Code"
                  data-testid="input-household-address-postal-code"
                />
                <Input
                  {...householdForm.register("addressCountry")}
                  placeholder="Country"
                  data-testid="input-household-address-country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-maxCount">
                Max Seats <span className="text-destructive">*</span>
              </Label>
              <Input
                id="household-maxCount"
                type="number"
                min="1"
                {...householdForm.register("maxCount", { valueAsNumber: true })}
                placeholder="e.g., 4"
                data-testid="input-household-max-count"
              />
              {householdForm.formState.errors.maxCount && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.maxCount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Total number of people in this household
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-affiliation">
                Affiliation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={householdForm.watch("affiliation")}
                onValueChange={(value) => householdForm.setValue("affiliation", value as "bride" | "groom" | "mutual")}
              >
                <SelectTrigger id="household-affiliation" data-testid="select-household-affiliation">
                  <SelectValue placeholder="Select affiliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                  <SelectItem value="mutual">Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-tier">
                Relationship Tier <span className="text-destructive">*</span>
              </Label>
              <Select
                value={householdForm.watch("relationshipTier")}
                onValueChange={(value) => householdForm.setValue("relationshipTier", value)}
              >
                <SelectTrigger id="household-tier" data-testid="select-household-tier">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate_family">Immediate Family</SelectItem>
                  <SelectItem value="extended_family">Extended Family</SelectItem>
                  <SelectItem value="friend">Friends</SelectItem>
                  <SelectItem value="parents_friend">Parent's Friends</SelectItem>
                  <SelectItem value="coworker">Co-workers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              {editingHousehold && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteHousehold}
                  disabled={deleteHouseholdMutation.isPending}
                  data-testid="button-delete-household"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className={`flex gap-2 ${editingHousehold ? "" : "ml-auto"}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHouseholdDialogOpen(false)}
                  data-testid="button-cancel-household"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createHouseholdMutation.isPending || updateHouseholdMutation.isPending}
                  data-testid="button-save-household"
                >
                  {editingHousehold ? "Update Household" : "Add Household"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Invitation Dialog */}
      <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-bulk-invite">Send Bulk Invitations</DialogTitle>
            <DialogDescription>
              Select households and events to send invitation emails with magic RSVP links
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Households</Label>
              <p className="text-sm text-muted-foreground">
                Choose which families should receive invitations
              </p>
              <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                {households.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No households available. Create households first.
                  </p>
                ) : (
                  households.map((household) => {
                    const householdGuests = guests.filter(g => g.householdId === household.id);
                    const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                    const missingEmail = !mainContact?.email;
                    
                    return (
                      <div
                        key={household.id}
                        className={`flex items-start space-x-3 p-2 rounded ${!missingEmail ? 'hover-elevate' : 'opacity-60'}`}
                        data-testid={`checkbox-household-${household.id}`}
                      >
                        <Checkbox
                          id={`household-${household.id}`}
                          checked={selectedHouseholds.includes(household.id)}
                          onCheckedChange={() => {
                            if (!missingEmail) {
                              handleToggleHousehold(household.id);
                            }
                          }}
                          disabled={missingEmail}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`household-${household.id}`}
                            className={`text-sm font-medium ${!missingEmail ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          >
                            {household.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {householdGuests.length} {householdGuests.length === 1 ? 'seat' : 'seats'}
                            {missingEmail && (
                              <span className="text-destructive ml-2">(No email)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Events</Label>
              <p className="text-sm text-muted-foreground">
                Choose which events to include in the invitation
              </p>
              <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events available. Create events first.
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-3 p-2 rounded hover-elevate"
                    >
                      <Checkbox
                        id={`invite-event-${event.id}`}
                        checked={selectedInviteEvents.includes(event.id)}
                        onCheckedChange={() => handleToggleInviteEvent(event.id)}
                      />
                      <label
                        htmlFor={`invite-event-${event.id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {event.name}
                        {event.date && (
                          <span className="text-muted-foreground ml-2">
                            ({new Date(event.date).toLocaleDateString()})
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
              <Textarea
                id="personalMessage"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal note to include in the invitation email..."
                className="min-h-[100px]"
                data-testid="textarea-personal-message"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedHouseholds.length === 0 || selectedInviteEvents.length === 0 ? (
                  <span>Select households and events to continue</span>
                ) : (
                  <span>
                    Ready to send {selectedHouseholds.length} invitation{selectedHouseholds.length !== 1 ? 's' : ''} for {selectedInviteEvents.length} event{selectedInviteEvents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkInviteDialogOpen(false)}
                  data-testid="button-cancel-bulk-invite"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkInvitations}
                  disabled={sendBulkInvitationsMutation.isPending || selectedHouseholds.length === 0 || selectedInviteEvents.length === 0}
                  data-testid="button-send-bulk-invitations"
                >
                  {sendBulkInvitationsMutation.isPending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-qr-code">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedHouseholdForQR?.name}</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the RSVP portal. You can download and print it on physical invitation cards.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeDataURL && (
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeDataURL} 
                  alt="QR Code for RSVP"
                  className="w-64 h-64"
                  data-testid="img-qr-code"
                />
              </div>
            )}
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setQrCodeDialogOpen(false)}
                className="flex-1"
                data-testid="button-close-qr-dialog"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadQRCode}
                className="flex-1"
                data-testid="button-download-qr-code"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Suggestion Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-reject-suggestion">
          <DialogHeader>
            <DialogTitle>Decline Suggestion</DialogTitle>
            <DialogDescription>
              Decline the suggestion for "{selectedSuggestion?.householdName}". This won't add them to your guest list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason (optional)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Budget constraints, not enough room..."
                className="min-h-[80px]"
                data-testid="textarea-reject-reason"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedSuggestion(null);
                  setRejectReason("");
                }}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedSuggestion) {
                    rejectSuggestionMutation.mutate({
                      id: selectedSuggestion.id,
                      reason: rejectReason,
                    });
                  }
                }}
                disabled={rejectSuggestionMutation.isPending}
                data-testid="button-confirm-reject"
              >
                {rejectSuggestionMutation.isPending ? "Declining..." : "Decline Suggestion"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Quick Edit Dialog */}
      <Dialog open={eventEditDialogOpen} onOpenChange={setEventEditDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-edit-event">
          <DialogHeader>
            <DialogTitle>Edit Event Settings</DialogTitle>
            <DialogDescription>
              Update the cost and capacity for "{editingEvent?.name}". These help you see if you're over budget or over capacity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eventCostPerHead">Cost Per Head ($)</Label>
              <p className="text-xs text-muted-foreground">How much does each guest cost at this event? (food, drinks, etc.)</p>
              <Input
                id="eventCostPerHead"
                type="number"
                value={editEventCostPerHead}
                onChange={(e) => setEditEventCostPerHead(e.target.value)}
                placeholder="e.g., 150"
                data-testid="input-event-cost-per-head"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventCapacity">Venue Capacity</Label>
              <p className="text-xs text-muted-foreground">What's the maximum number of people your venue can hold?</p>
              <Input
                id="eventCapacity"
                type="number"
                value={editEventCapacity}
                onChange={(e) => setEditEventCapacity(e.target.value)}
                placeholder="e.g., 200"
                data-testid="input-event-capacity"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEventEditDialogOpen(false);
                  setEditingEvent(null);
                }}
                data-testid="button-cancel-event-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEventEdit}
                disabled={updateEventMutation.isPending}
                data-testid="button-save-event-edit"
              >
                {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Template Blast Dialog */}
      <Dialog open={whatsappBlastDialogOpen} onOpenChange={setWhatsappBlastDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-whatsapp-blast">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Send WhatsApp Reminders
            </DialogTitle>
            <DialogDescription>
              Send personalized RSVP reminders to families. The message will open WhatsApp with pre-filled text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Template</Label>
              <p className="text-xs text-muted-foreground">Use {"{name}"} to personalize with the household name</p>
              <Textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                placeholder="Hi {name}! This is a reminder about our wedding..."
                className="min-h-[120px]"
                data-testid="textarea-whatsapp-template"
              />
            </div>

            {events.length > 0 && (
              <div className="space-y-2">
                <Label>Target Event (optional)</Label>
                <Select value={whatsappTargetEvent} onValueChange={setWhatsappTargetEvent}>
                  <SelectTrigger data-testid="select-whatsapp-event">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Households with phone numbers:</p>
              <div className="flex flex-wrap gap-2">
                {households
                  .filter(h => {
                    const householdGuests = guests.filter(g => g.householdId === h.id);
                    const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                    return mainContact?.phone || parseMembers(h).some((m: any) => m.phone);
                  })
                  .slice(0, 5)
                  .map(h => (
                    <Badge key={h.id} variant="outline" className="text-xs">
                      {h.name}
                    </Badge>
                  ))}
                {households.filter(h => {
                  const householdGuests = guests.filter(g => g.householdId === h.id);
                  const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                  return mainContact?.phone || parseMembers(h).some((m: any) => m.phone);
                }).length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{households.filter(h => {
                      const householdGuests = guests.filter(g => g.householdId === h.id);
                      const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                      return mainContact?.phone || parseMembers(h).some((m: any) => m.phone);
                    }).length - 5} more
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {households.filter(h => {
                  const householdGuests = guests.filter(g => g.householdId === h.id);
                  const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                  return mainContact?.phone || parseMembers(h).some((m: any) => m.phone);
                }).length} of {households.length} households have phone numbers
              </p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setWhatsappBlastDialogOpen(false)}
                data-testid="button-cancel-whatsapp"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const eligibleHouseholds = households.filter(h => {
                    const householdGuests = guests.filter(g => g.householdId === h.id);
                    const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                    const phone = mainContact?.phone || parseMembers(h).find((m: any) => m.phone)?.phone;
                    return !!phone;
                  });
                  
                  if (eligibleHouseholds.length === 0) {
                    toast({
                      title: "No phone numbers",
                      description: "None of your households have phone numbers. Add phone numbers to send WhatsApp reminders.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const firstHousehold = eligibleHouseholds[0];
                  const householdGuests = guests.filter(g => g.householdId === firstHousehold.id);
                  const mainContact = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
                  const phone = mainContact?.phone || parseMembers(firstHousehold).find((m: any) => m.phone)?.phone;
                  const cleanPhone = phone.replace(/\D/g, '');
                  const personalizedMessage = whatsappTemplate.replace(/{name}/g, firstHousehold.name);
                  const encodedMessage = encodeURIComponent(personalizedMessage);
                  
                  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
                  
                  toast({
                    title: "WhatsApp opened",
                    description: `Sending reminder to ${firstHousehold.name}. Repeat for other households.`,
                  });
                  setWhatsappBlastDialogOpen(false);
                }}
                className="gap-2"
                data-testid="button-send-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
