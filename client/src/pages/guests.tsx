import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GuestListManager } from "@/components/guest-list-manager";
import { GuestImportDialog } from "@/components/guest-import-dialog";
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
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema, insertHouseholdSchema, type Wedding, type Guest, type Event, type Household, type GuestSuggestion, type CutListItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Trash2,
  Upload,
  Users,
  Link as LinkIcon,
  MailCheck,
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
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import QRCode from "qrcode";

const guestFormSchema = insertGuestSchema.extend({
  eventIds: z.array(z.string()).optional(),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

const householdFormSchema = insertHouseholdSchema.extend({
  maxCount: z.number().min(1, "Max count must be at least 1"),
  contactEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
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
    confirmedInvited: number;
    potentialTotal: number;
    confirmedCost: number;
    potentialCost: number;
    capacityUsed: number;
    capacityRemaining: number | null;
    isOverCapacity: boolean;
  }>;
  budget: {
    totalBudget: number;
    defaultCostPerHead: number;
    confirmedSpend: number;
    potentialSpend: number;
    remainingBudget: number;
    potentialOverage: number;
  };
};

function exportToCSV(households: Household[], guests: Guest[]) {
  const headers = ['Household Name', 'Affiliation', 'Relationship Tier', 'Max Seats', 'Guest Count', 'Guest Names', 'Contact Email'];
  
  const rows = households.map(household => {
    const householdGuests = guests.filter(g => g.householdId === household.id);
    const guestNames = householdGuests.map(g => g.name).join('; ');
    
    return [
      household.name,
      household.affiliation === 'bride' ? "Bride's Side" : household.affiliation === 'groom' ? "Groom's Side" : "Mutual",
      household.relationshipTier === 'immediate_family' ? 'Immediate Family' :
        household.relationshipTier === 'extended_family' ? 'Extended Family' :
        household.relationshipTier === 'parents_friend' ? "Parent's Friends" : 'Friends',
      household.maxCount || 0,
      householdGuests.length,
      guestNames || 'No guests added',
      household.contactEmail || 'Not provided'
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

export default function Guests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Top-level tab state
  const [mainTab, setMainTab] = useState("guest-list");
  const [planningTab, setPlanningTab] = useState("review");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  // Cut list state
  const [cutListDialogOpen, setCutListDialogOpen] = useState(false);
  const [householdToCut, setHouseholdToCut] = useState<Household | null>(null);
  const [cutReason, setCutReason] = useState("");

  // Guest Planning state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GuestSuggestion | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
      contactEmail: "",
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

  const addToCutListMutation = useMutation({
    mutationFn: async (data: { householdId: string; cutReason?: string }) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/cut-list`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      setCutListDialogOpen(false);
      setHouseholdToCut(null);
      setCutReason("");
      toast({
        title: "Moved to Maybe Later",
        description: "Household has been parked. You can restore it anytime from Guest Planning.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move household to cut list",
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

  const restoreFromCutListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/cut-list/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
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

  const handleMoveToCutList = (household: Household) => {
    setHouseholdToCut(household);
    setCutReason("");
    setCutListDialogOpen(true);
  };

  const confirmMoveToCutList = () => {
    if (!householdToCut) return;
    addToCutListMutation.mutate({
      householdId: householdToCut.id,
      cutReason: cutReason || undefined,
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
      contactEmail: "",
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
      contactEmail: household.contactEmail || "",
      maxCount: household.maxCount || 1,
      affiliation: household.affiliation as "bride" | "groom" | "mutual",
      relationshipTier: household.relationshipTier || "friend",
      priorityTier: (household.priorityTier as "must_invite" | "should_invite" | "nice_to_have") || "should_invite",
      weddingId: household.weddingId,
    });
    setHouseholdDialogOpen(true);
  };

  const handleHouseholdSubmit = (data: HouseholdFormData) => {
    const householdData = {
      ...data,
      contactEmail: data.contactEmail || undefined,
    };

    if (editingHousehold) {
      updateHouseholdMutation.mutate({ id: editingHousehold.id, data: householdData });
    } else {
      createHouseholdMutation.mutate(householdData);
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
      return !household?.contactEmail;
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
  const pendingSuggestions = suggestions.filter(s => s.status === "pending");
  const reviewedSuggestions = suggestions.filter(s => s.status !== "pending");

  const priorityBreakdown = {
    must_invite: households.filter(h => h.priorityTier === "must_invite"),
    should_invite: households.filter(h => h.priorityTier === "should_invite"),
    nice_to_have: households.filter(h => h.priorityTier === "nice_to_have"),
    unassigned: households.filter(h => !h.priorityTier),
  };

  // Workflow step progress
  const hasSuggestions = pendingSuggestions.length === 0;
  const hasBudgetSet = budgetData?.settings?.maxGuestBudget && Number(budgetData.settings.maxGuestBudget) > 0;
  const isWithinCapacity = budgetData?.capacity && budgetData.capacity.currentCount <= budgetData.capacity.maxGuests;

  // New 3-phase workflow based on user's mental model
  const hasEventsOverCapacity = planningSnapshot?.events.some(e => e.isOverCapacity) || false;
  const hasOverBudget = (planningSnapshot?.budget.potentialOverage || 0) > 0;
  const needsCuts = hasEventsOverCapacity || hasOverBudget;

  const workflowSteps = [
    {
      id: "review",
      label: "Review",
      description: "Family suggestions",
      icon: Inbox,
      isComplete: hasSuggestions, // All suggestions reviewed
      count: pendingSuggestions.length,
    },
    {
      id: "assess",
      label: "Assess Impact",
      description: "See the whole picture",
      icon: Target,
      isComplete: hasBudgetSet && !needsCuts,
      count: needsCuts ? 1 : 0, // Show alert if over capacity/budget
    },
    {
      id: "decide",
      label: "Decide & Cut",
      description: "Finalize list",
      icon: Scissors,
      isComplete: !needsCuts && cutList.length >= 0, // Complete when within limits
      count: cutList.length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Top-level tabs: Guest List and Guest Planning */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="grid grid-cols-2 w-auto">
              <TabsTrigger value="guest-list" data-testid="tab-guest-list" className="gap-2">
                <Users className="w-4 h-4" />
                Guest List
              </TabsTrigger>
              <TabsTrigger value="guest-planning" data-testid="tab-guest-planning" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Guest Planning
                {pendingSuggestions.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {pendingSuggestions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Guest List Tab - Current functionality */}
          <TabsContent value="guest-list" className="space-y-6">
            <Tabs defaultValue="guests" className="space-y-6">
              <TabsList>
                <TabsTrigger value="guests" data-testid="tab-guests">
                  Individual Guests
                </TabsTrigger>
                <TabsTrigger value="households" data-testid="tab-households">
                  <Users className="w-4 h-4 mr-2" />
                  Households
                </TabsTrigger>
                <TabsTrigger value="allocation" data-testid="tab-allocation">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Allocation View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guests" className="space-y-4">
                <GuestListManager
                  guests={guests}
                  onAddGuest={handleAddGuest}
                  onImportGuests={() => setImportDialogOpen(true)}
                  onEditGuest={handleEditGuest}
                />
              </TabsContent>

              <TabsContent value="households" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Household Management</h2>
                    <p className="text-muted-foreground mt-1">
                      Group families together and manage invitation links
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={handleOpenBulkInvite} variant="default" data-testid="button-bulk-invite">
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitations
                    </Button>
                    <Button onClick={handleAddHousehold} variant="outline" data-testid="button-add-household">
                      <Users className="w-4 h-4 mr-2" />
                      Add Household
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {households.map((household) => {
                    const householdGuests = guests.filter(g => g.householdId === household.id);
                    const hasActiveLink = household.magicLinkTokenHash && household.magicLinkExpires && new Date(household.magicLinkExpires) > new Date();

                    return (
                      <Card key={household.id} className="hover-elevate" data-testid={`card-household-${household.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{household.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {household.maxCount} {household.maxCount === 1 ? 'seat' : 'seats'} • {householdGuests.length} {householdGuests.length === 1 ? 'guest' : 'guests'}
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleMoveToCutList(household)}
                                  className="text-destructive"
                                  data-testid={`menu-cut-household-${household.id}`}
                                >
                                  <Scissors className="w-4 h-4 mr-2" />
                                  Move to Maybe Later
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

                          {householdGuests.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <div className="font-medium mb-1">Members:</div>
                              <ul className="space-y-0.5">
                                {householdGuests.map((guest) => (
                                  <li key={guest.id}>{guest.name}</li>
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
                                Generate Link
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

              <TabsContent value="allocation" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Guest Allocation</h2>
                    <p className="text-muted-foreground mt-1">
                      Overview of guest distribution by side and relationship tier
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-affiliation-filter">
                        <SelectValue placeholder="Filter by side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sides</SelectItem>
                        <SelectItem value="bride">Bride's Side</SelectItem>
                        <SelectItem value="groom">Groom's Side</SelectItem>
                        <SelectItem value="mutual">Mutual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                        <SelectValue placeholder="Filter by tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="immediate_family">Immediate Family</SelectItem>
                        <SelectItem value="extended_family">Extended Family</SelectItem>
                        <SelectItem value="friend">Friends</SelectItem>
                        <SelectItem value="parents_friend">Parent's Friends</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(households, guests)}
                      data-testid="button-export-csv"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {(() => {
                  const householdById = new Map(households.map(h => [h.id, h]));
                  const filteredHouseholds = households.filter(h => {
                    const matchesAffiliation = affiliationFilter === 'all' || h.affiliation === affiliationFilter;
                    const matchesTier = tierFilter === 'all' || h.relationshipTier === tierFilter;
                    return matchesAffiliation && matchesTier;
                  });

                  const filteredGuests = guests.filter(g => {
                    if (!g.householdId) return false;
                    const household = householdById.get(g.householdId);
                    if (!household) return false;
                    const matchesAffiliation = affiliationFilter === 'all' || household.affiliation === affiliationFilter;
                    const matchesTier = tierFilter === 'all' || household.relationshipTier === tierFilter;
                    return matchesAffiliation && matchesTier;
                  });

                  const brideHouseholds = filteredHouseholds.filter(h => h.affiliation === 'bride');
                  const groomHouseholds = filteredHouseholds.filter(h => h.affiliation === 'groom');
                  const mutualHouseholds = filteredHouseholds.filter(h => h.affiliation === 'mutual');

                  const brideSeats = brideHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);
                  const groomSeats = groomHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);
                  const mutualSeats = mutualHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);
                  const totalSeats = brideSeats + groomSeats + mutualSeats;
                  const totalGuests = filteredGuests.length;

                  const brideGuests = filteredGuests.filter(g => {
                    if (!g.householdId) return false;
                    const household = householdById.get(g.householdId);
                    return household?.affiliation === 'bride';
                  });
                  const groomGuests = filteredGuests.filter(g => {
                    if (!g.householdId) return false;
                    const household = householdById.get(g.householdId);
                    return household?.affiliation === 'groom';
                  });
                  const mutualGuests = filteredGuests.filter(g => {
                    if (!g.householdId) return false;
                    const household = householdById.get(g.householdId);
                    return household?.affiliation === 'mutual';
                  });

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card data-testid="card-total-allocation">
                          <CardHeader className="pb-3">
                            <CardDescription>Total Allocation</CardDescription>
                            <CardTitle className="text-3xl">{totalSeats}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {filteredHouseholds.length} households • {totalGuests} guests added
                            </p>
                          </CardContent>
                        </Card>

                        <Card data-testid="card-bride-allocation" className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <CardDescription>Bride's Side</CardDescription>
                            <CardTitle className="text-3xl">{brideSeats}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {brideHouseholds.length} households • {brideGuests.length} guests
                            </p>
                          </CardContent>
                        </Card>

                        <Card data-testid="card-groom-allocation" className="border-l-4 border-l-accent">
                          <CardHeader className="pb-3">
                            <CardDescription>Groom's Side</CardDescription>
                            <CardTitle className="text-3xl">{groomSeats}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {groomHouseholds.length} households • {groomGuests.length} guests
                            </p>
                          </CardContent>
                        </Card>

                        <Card data-testid="card-mutual-allocation" className="border-l-4 border-l-muted">
                          <CardHeader className="pb-3">
                            <CardDescription>Mutual</CardDescription>
                            <CardTitle className="text-3xl">{mutualSeats}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {mutualHouseholds.length} households • {mutualGuests.length} guests
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {filteredHouseholds.length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="p-8 text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="font-semibold mb-2">No Allocation Data</h3>
                            <p className="text-muted-foreground">
                              Create households to see guest allocation breakdowns by bride/groom side
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Guest Planning Tab - New integrated functionality */}
          <TabsContent value="guest-planning" className="space-y-6">
            {/* Workflow Overview */}
            <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Guest Planning Workflow</span>
                  </div>
                  {workflowSteps.every(s => s.isComplete) && (
                    <Badge className="bg-green-500 text-white gap-1">
                      <Sparkles className="h-3 w-3" />
                      All done!
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {workflowSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setPlanningTab(step.id)}
                      className={`relative flex flex-col items-center p-4 rounded-xl transition-all ${
                        planningTab === step.id 
                          ? "bg-white dark:bg-gray-800 shadow-lg ring-2 ring-orange-400" 
                          : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                      }`}
                      data-testid={`workflow-step-${step.id}`}
                    >
                      <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-background border-2 border-orange-300 flex items-center justify-center text-xs font-bold text-orange-600">
                        {index + 1}
                      </div>
                      
                      <div className="mb-2">
                        {step.isComplete ? (
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        ) : (
                          <step.icon className="h-8 w-8 text-orange-500" />
                        )}
                      </div>
                      
                      <span className="text-sm font-semibold">{step.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{step.description}</span>
                      
                      {step.count > 0 && !step.isComplete && (
                        <Badge variant="destructive" className="mt-2 text-xs">
                          {step.count} to do
                        </Badge>
                      )}
                      {step.isComplete && (
                        <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-300">
                          Complete
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Planning Tabs Content - 3-phase workflow */}
            <Tabs value={planningTab} onValueChange={setPlanningTab}>
              <TabsList className="hidden">
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="assess">Assess Impact</TabsTrigger>
                <TabsTrigger value="decide">Decide & Cut</TabsTrigger>
              </TabsList>

              {/* Phase 1: Review - Review family suggestions */}
              <TabsContent value="review" className="space-y-6">
                <Card className={`border-2 ${hasSuggestions ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${hasSuggestions ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                        {hasSuggestions ? (
                          <Sparkles className="h-5 w-5 text-green-600" />
                        ) : (
                          <Inbox className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        {hasSuggestions ? (
                          <>
                            <p className="font-semibold text-green-700 dark:text-green-400">All Caught Up!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              No pending suggestions from your team. When team members with "Suggest Guests" permission add suggestions, they'll appear here.
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-3 gap-2"
                              onClick={() => setPlanningTab("assess")}
                            >
                              See the Full Picture
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">Review Team Suggestions</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your team members have submitted {pendingSuggestions.length} guest suggestion{pendingSuggestions.length !== 1 ? 's' : ''} for you to review. Approve to add to your guest list or decline.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-muted-foreground" />
                        Pending Suggestions
                        {pendingSuggestions.length > 0 && (
                          <Badge variant="destructive">{pendingSuggestions.length}</Badge>
                        )}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Guest suggestions from team members with permission
                      </p>
                    </div>
                  </div>

                  {suggestionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                  ) : pendingSuggestions.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                        <p className="font-medium mb-1">No Pending Suggestions</p>
                        <p className="text-sm text-muted-foreground">
                          When team members with "Suggest Guests" permission submit suggestions, they'll appear here for your review.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {pendingSuggestions.map(suggestion => (
                        <Card key={suggestion.id} data-testid={`card-suggestion-${suggestion.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">{suggestion.householdName}</CardTitle>
                                <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {suggestion.affiliation === "bride" ? "Bride's Side" : suggestion.affiliation === "groom" ? "Groom's Side" : "Mutual"}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {suggestion.maxCount} {suggestion.maxCount === 1 ? "guest" : "guests"}
                                  </Badge>
                                  {suggestion.suggestedByName && (
                                    <Badge variant="outline" className="text-xs">
                                      by {suggestion.suggestedByName}
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveSuggestionMutation.mutate(suggestion.id)}
                                  disabled={approveSuggestionMutation.isPending}
                                  data-testid={`button-approve-${suggestion.id}`}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedSuggestion(suggestion);
                                    setRejectDialogOpen(true);
                                  }}
                                  data-testid={`button-reject-${suggestion.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            {suggestion.guestNames && (
                              <p className="text-sm"><strong>Guests:</strong> {suggestion.guestNames}</p>
                            )}
                            {suggestion.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{suggestion.notes}</p>
                            )}
                            {suggestion.contactEmail && (
                              <p className="text-xs text-muted-foreground mt-1">Contact: {suggestion.contactEmail}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {reviewedSuggestions.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Previously Reviewed</h3>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {reviewedSuggestions.map(suggestion => (
                            <div key={suggestion.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{suggestion.householdName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {suggestion.maxCount} guests
                                  {suggestion.suggestedByName && ` • by ${suggestion.suggestedByName}`}
                                </p>
                              </div>
                              <Badge variant={suggestion.status === "approved" ? "default" : "destructive"}>
                                {suggestion.status === "approved" ? "Approved" : "Declined"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Phase 2: Assess Impact - See the WHOLE picture before cutting */}
              <TabsContent value="assess" className="space-y-6">
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
                                  onClick={() => setPlanningTab("decide")}
                                >
                                  Review & Finalize
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-amber-700 dark:text-amber-400">Decisions Needed</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {hasOverBudget && `Over budget by $${planningSnapshot?.budget.potentialOverage?.toLocaleString()}. `}
                                  {hasEventsOverCapacity && `Some events exceed venue capacity. `}
                                  Review the details below and proceed to cut guests if needed.
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="mt-3 gap-2"
                                  onClick={() => setPlanningTab("decide")}
                                >
                                  Start Cutting
                                  <Scissors className="h-3 w-3" />
                                </Button>
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
                            Budget: ${planningSnapshot?.budget.totalBudget?.toLocaleString() || 0}
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
                              className={`${event.isOverCapacity ? "border-red-300 bg-red-50/30 dark:bg-red-950/20" : ""}`}
                              data-testid={`card-event-${event.id}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{event.name}</h3>
                                      {event.isOverCapacity && (
                                        <Badge variant="destructive" className="text-xs">
                                          Over Capacity
                                        </Badge>
                                      )}
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
                                      <p className={`text-lg font-bold ${event.isOverCapacity ? "text-red-600" : ""}`}>
                                        ${event.potentialCost?.toLocaleString() || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Total Cost</p>
                                    </div>
                                  </div>

                                  {event.venueCapacity && (
                                    <div className="w-full mt-2">
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
                                    </div>
                                  )}
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

                    {/* Priority Breakdown */}
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-muted-foreground" />
                        Priority Breakdown
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Combined view of confirmed guests and pending suggestions by priority tier.
                      </p>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-green-500/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Star className="h-4 w-4 text-green-500" />
                              Must Invite
                            </CardTitle>
                            <CardDescription className="text-xs">Cannot be cut</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold">
                                {(planningSnapshot?.summary.priorityBreakdown.must_invite.confirmed || 0) + 
                                 (planningSnapshot?.summary.priorityBreakdown.must_invite.pending || 0)}
                              </p>
                              <span className="text-sm text-muted-foreground">guests</span>
                            </div>
                            <div className="mt-2 text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confirmed:</span>
                                <span>{planningSnapshot?.summary.priorityBreakdown.must_invite.confirmed || 0}</span>
                              </div>
                              <div className="flex justify-between text-orange-600">
                                <span>Pending:</span>
                                <span>+{planningSnapshot?.summary.priorityBreakdown.must_invite.pending || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-yellow-500/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-yellow-500" />
                              Should Invite
                            </CardTitle>
                            <CardDescription className="text-xs">High priority</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold">
                                {(planningSnapshot?.summary.priorityBreakdown.should_invite.confirmed || 0) + 
                                 (planningSnapshot?.summary.priorityBreakdown.should_invite.pending || 0)}
                              </p>
                              <span className="text-sm text-muted-foreground">guests</span>
                            </div>
                            <div className="mt-2 text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confirmed:</span>
                                <span>{planningSnapshot?.summary.priorityBreakdown.should_invite.confirmed || 0}</span>
                              </div>
                              <div className="flex justify-between text-orange-600">
                                <span>Pending:</span>
                                <span>+{planningSnapshot?.summary.priorityBreakdown.should_invite.pending || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-orange-500/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-500" />
                              Nice to Have
                            </CardTitle>
                            <CardDescription className="text-xs">First to consider for cuts</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold">
                                {(planningSnapshot?.summary.priorityBreakdown.nice_to_have.confirmed || 0) + 
                                 (planningSnapshot?.summary.priorityBreakdown.nice_to_have.pending || 0)}
                              </p>
                              <span className="text-sm text-muted-foreground">guests</span>
                            </div>
                            <div className="mt-2 text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confirmed:</span>
                                <span>{planningSnapshot?.summary.priorityBreakdown.nice_to_have.confirmed || 0}</span>
                              </div>
                              <div className="flex justify-between text-orange-600">
                                <span>Pending:</span>
                                <span>+{planningSnapshot?.summary.priorityBreakdown.nice_to_have.pending || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button 
                        size="lg"
                        onClick={() => setPlanningTab("decide")}
                        className="gap-2"
                      >
                        {needsCuts ? (
                          <>
                            <Scissors className="h-4 w-4" />
                            Start Cutting Guests
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Review & Finalize
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Phase 3: Decide & Cut - Make final decisions */}
              <TabsContent value="decide" className="space-y-6">
                <Card className={`border-2 ${cutList.length === 0 ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${cutList.length === 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                        {cutList.length === 0 ? (
                          <Sparkles className="h-5 w-5 text-green-600" />
                        ) : (
                          <Scissors className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        {cutList.length === 0 ? (
                          <>
                            <p className="font-semibold text-green-700 dark:text-green-400">Ready to Go!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your guest list is finalized. No households have been parked in "Maybe Later".
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
                            <p className="font-semibold">Maybe Later</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              You have {cutList.length} household{cutList.length !== 1 ? 's' : ''} parked. These won't receive invitations unless you restore them.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-muted-foreground" />
                        Maybe Later
                        {cutList.length > 0 && (
                          <Badge variant="secondary">{cutList.length} parked</Badge>
                        )}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Guests you might not invite - restore them anytime
                      </p>
                    </div>
                  </div>

                  {cutListLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : cutList.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        <Scissors className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium mb-1">No Guests Parked</p>
                        <p className="text-sm text-muted-foreground">
                          When you need to trim your list, move households here from the Guest List tab.
                          You can always restore them later.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {cutList.map(item => (
                        <Card key={item.id} data-testid={`card-cut-${item.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium">{item.household?.name || "Unknown"}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{item.household?.maxCount || 0} guests</span>
                                  {item.cutReason && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        {item.cutReason === "budget" ? "Budget" : 
                                         item.cutReason === "space" ? "Space" : 
                                         item.cutReason === "priority" ? "Priority" : "Other"}
                                      </Badge>
                                    </>
                                  )}
                                </div>
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Guest Import Dialog */}
      <GuestImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleBulkImport}
      />

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
                checked={form.watch("plusOne")}
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

          <form onSubmit={householdForm.handleSubmit(handleHouseholdSubmit)} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="household-contactEmail">
                Contact Email
              </Label>
              <Input
                id="household-contactEmail"
                type="email"
                {...householdForm.register("contactEmail")}
                placeholder="e.g., patel@example.com"
                data-testid="input-household-contact-email"
              />
              {householdForm.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.contactEmail.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Email address for sending invitations
              </p>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-priority">
                Priority Tier <span className="text-destructive">*</span>
              </Label>
              <Select
                value={householdForm.watch("priorityTier")}
                onValueChange={(value) => householdForm.setValue("priorityTier", value as "must_invite" | "should_invite" | "nice_to_have")}
              >
                <SelectTrigger id="household-priority" data-testid="select-household-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="must_invite">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-500" />
                      Must Invite
                    </div>
                  </SelectItem>
                  <SelectItem value="should_invite">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      Should Invite
                    </div>
                  </SelectItem>
                  <SelectItem value="nice_to_have">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      Nice to Have
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for budget planning - "Nice to Have" guests are considered first for cuts
              </p>
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
                    const missingEmail = !household.contactEmail;
                    
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
                            {household.maxCount} seats • {householdGuests.length} guests
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

      {/* Cut List Confirmation Dialog */}
      <Dialog open={cutListDialogOpen} onOpenChange={setCutListDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-cut-list">
          <DialogHeader>
            <DialogTitle>Move to Maybe Later</DialogTitle>
            <DialogDescription>
              Move "{householdToCut?.name}" to the Maybe Later list. This won't delete them permanently - you can restore the household anytime from Guest Planning.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cutReason">Reason (optional)</Label>
              <Select
                value={cutReason}
                onValueChange={(value) => setCutReason(value)}
              >
                <SelectTrigger data-testid="select-cut-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget constraints</SelectItem>
                  <SelectItem value="space">Venue capacity</SelectItem>
                  <SelectItem value="priority">Lower priority</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setCutListDialogOpen(false)}
                data-testid="button-cancel-cut"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmMoveToCutList}
                disabled={addToCutListMutation.isPending}
                data-testid="button-confirm-cut"
              >
                {addToCutListMutation.isPending ? "Moving..." : "Move to Maybe Later"}
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
    </div>
  );
}
