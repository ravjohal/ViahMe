import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, type Wedding, type Event, type Contract, type Vendor, type Expense, type BudgetAllocation, type CeremonyBudget, type CeremonyLineItemBudget } from "@shared/schema";
import { CEREMONY_COST_BREAKDOWNS, type CostCategory } from "@shared/ceremonies";
import { calculateLineItemEstimate, DEFAULT_PRICING_CONTEXT, type PricingContext, CITY_MULTIPLIERS } from "@shared/pricing";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronRight, ArrowLeft, Copy, Share2, FileText, 
  Calendar, Clock, Building2, Users, Calculator, Sparkles, Loader2, BarChart3, HelpCircle,
  TrendingDown, TrendingUp
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { EditExpenseDialog, type ExpenseWithDetails } from "@/components/edit-expense-dialog";
import { BudgetMatrix } from "@/components/budget-matrix";

// Use shared expense type from the edit dialog component
type ExpenseWithAllocations = ExpenseWithDetails;

// Budget allocation form schema (simplified for Single Ledger Model)
const allocationFormSchema = z.object({
  bucket: z.string(),
  allocatedAmount: z.string().transform((val) => val),
});

type AllocationFormData = z.infer<typeof allocationFormSchema>;

interface AIBudgetEstimate {
  lowEstimate: number;
  highEstimate: number;
  averageEstimate: number;
  notes: string;
  hasEstimate: boolean;
}

type ContributorFilter = "all" | "bride" | "groom";
type SideFilter = "all" | "bride" | "groom" | "mutual";

export default function Budget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<BudgetBucket | null>(null);
  const [editingBucketAmount, setEditingBucketAmount] = useState("");
  // Inline ceremony total budget editing (keyed by eventId)
  const [editingCeremonyTotals, setEditingCeremonyTotals] = useState<Record<string, string>>({});
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [aiEstimate, setAiEstimate] = useState<AIBudgetEstimate | null>(null);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addExpenseEventId, setAddExpenseEventId] = useState<string | undefined>(undefined);
  const [aiEstimateLoading, setAiEstimateLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [contributorFilter, setContributorFilter] = useState<ContributorFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithAllocations | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [showCeremonyBudgets, setShowCeremonyBudgets] = useState(false);
  const [expandedCeremonies, setExpandedCeremonies] = useState<Set<string>>(new Set());
  const [editingLineItems, setEditingLineItems] = useState<Record<string, Record<string, string>>>({});

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: allocations = [], isLoading: allocationsLoading } = useQuery<BudgetAllocation[]>({
    queryKey: ["/api/budget/allocations", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: expenseTotals } = useQuery<{
    bucketTotals: Array<{ bucket: string; label: string; allocated: number; spent: number; remaining: number }>;
    totalSpent: number;
    totalAllocated: number;
    totalRemaining: number;
  }>({
    queryKey: ["/api/expenses", wedding?.id, "totals"],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: allExpenses = [] } = useQuery<ExpenseWithAllocations[]>({
    queryKey: ["/api/expenses", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: costSummary } = useQuery<{
    categories: Record<string, { fixed: number; perHead: number; total: number; items: any[] }>;
    grandTotal: number;
  }>({
    queryKey: ["/api/weddings", wedding?.id, "cost-summary"],
    enabled: !!wedding?.id,
  });

  // Line item budgets for ceremonies
  const { data: lineItemBudgets = [] } = useQuery<CeremonyLineItemBudget[]>({
    queryKey: ["/api/budget/line-items", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Ceremony keyword mappings - maps ceremony IDs to keywords for matching events
  const CEREMONY_MAPPINGS: Record<string, string[]> = {
    // Sikh ceremonies
    sikh_roka: ["roka", "sikh roka"],
    sikh_engagement: ["engagement", "sikh engagement", "kurmai"],
    sikh_chunni_chadana: ["chunni", "chunni chadana"],
    sikh_paath: ["paath", "akhand paath", "sehaj paath"],
    sikh_mehndi: ["mehndi", "henna", "sikh mehndi"],
    sikh_bakra_party: ["bakra", "bakra party"],
    sikh_mayian: ["maiyan", "mayian", "sikh maiyan", "choora", "vatna"],
    sikh_sangeet: ["sangeet", "lady sangeet", "sikh sangeet"],
    sikh_anand_karaj: ["anand karaj", "anand_karaj", "sikh wedding"],
    sikh_reception: ["sikh reception"],
    sikh_day_after: ["day after", "day after visit"],
    // Hindu ceremonies
    hindu_mehndi: ["hindu mehndi"],
    hindu_sangeet: ["hindu sangeet"],
    hindu_haldi: ["haldi", "hindu haldi"],
    hindu_baraat: ["baraat", "hindu baraat"],
    hindu_wedding: ["hindu wedding", "wedding ceremony"],
    // General
    reception: ["reception"],
    // Muslim ceremonies
    muslim_nikah: ["nikah", "muslim nikah", "muslim wedding"],
    muslim_walima: ["walima", "muslim walima"],
    muslim_dholki: ["dholki", "muslim dholki"],
    // Gujarati ceremonies
    gujarati_pithi: ["pithi", "gujarati pithi"],
    gujarati_garba: ["garba", "gujarati garba"],
    gujarati_wedding: ["gujarati wedding"],
    // South Indian
    south_indian_muhurtham: ["muhurtham", "south indian muhurtham", "south indian wedding"],
    // General events
    general_wedding: ["general wedding", "western wedding", "christian wedding", "civil ceremony"],
    rehearsal_dinner: ["rehearsal dinner", "rehearsal"],
    cocktail_hour: ["cocktail hour", "cocktail", "cocktails"],
  };

  // Get ceremony type ID from event name
  const getCeremonyTypeId = (eventName: string): string | null => {
    const normalizedName = eventName.toLowerCase().trim();
    
    for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
      if (keywords.some(kw => normalizedName === kw)) {
        if (CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
          return ceremonyId;
        }
      }
    }
    
    for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
      if (keywords.some(kw => normalizedName.includes(kw))) {
        if (CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
          return ceremonyId;
        }
      }
    }
    
    if (normalizedName.includes('reception') && CEREMONY_COST_BREAKDOWNS['reception']) {
      return 'reception';
    }
    
    return null;
  };

  // Get line items for an event based on ceremony type
  const getLineItemsForEvent = (eventId: string, eventName: string): CostCategory[] | null => {
    const ceremonyTypeId = getCeremonyTypeId(eventName);
    if (!ceremonyTypeId) return null;
    return CEREMONY_COST_BREAKDOWNS[ceremonyTypeId] || null;
  };

  // Toggle ceremony expansion
  const toggleCeremonyExpansion = (eventId: string) => {
    setExpandedCeremonies(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Mutation for saving line item budgets
  const saveLineItemBudgetsMutation = useMutation({
    mutationFn: async ({ weddingId, eventId, ceremonyTypeId, items }: {
      weddingId: string;
      eventId: string;
      ceremonyTypeId: string;
      items: Array<{ lineItemCategory: string; budgetedAmount: string }>;
    }) => {
      return apiRequest("POST", "/api/budget/line-items/bulk", { weddingId, eventId, ceremonyTypeId, items });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/line-items", wedding?.id] });
      // Clear editing state for this event after successful save
      setEditingLineItems(prev => {
        const next = { ...prev };
        delete next[variables.eventId];
        return next;
      });
      toast({ title: "Line item budgets saved" });
    },
    onError: () => {
      toast({ title: "Failed to save line item budgets", variant: "destructive" });
    },
  });

  // Handle line item budget change
  const handleLineItemChange = (eventId: string, category: string, value: string) => {
    setEditingLineItems(prev => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        [category]: value,
      },
    }));
  };

  // Save line item budgets for an event (includes zeros to clear existing budgets)
  const saveEventLineItems = (eventId: string, eventName: string) => {
    const ceremonyTypeId = getCeremonyTypeId(eventName);
    if (!wedding?.id || !ceremonyTypeId) return;
    
    const eventLineItems = editingLineItems[eventId] || {};
    // Include all edited items (including zeros/empty to allow clearing)
    const items = Object.entries(eventLineItems)
      .map(([category, value]) => ({
        lineItemCategory: category,
        budgetedAmount: value || "0",
      }));

    if (items.length > 0) {
      saveLineItemBudgetsMutation.mutate({
        weddingId: wedding.id,
        eventId,
        ceremonyTypeId,
        items,
      });
    }
  };

  // Get existing budget for a line item
  const getExistingLineItemBudget = (eventId: string, category: string): string => {
    // Check local edits first
    if (editingLineItems[eventId]?.[category] !== undefined) {
      return editingLineItems[eventId][category];
    }
    // Then check saved budgets
    const saved = lineItemBudgets.find(
      b => b.eventId === eventId && b.lineItemCategory === category
    );
    return saved?.budgetedAmount || "";
  };

  // Calculate total line item budget for an event
  const getEventLineItemTotal = (eventId: string, lineItems: CostCategory[]): number => {
    let total = 0;
    for (const item of lineItems) {
      const amount = getExistingLineItemBudget(eventId, item.category);
      total += parseFloat(amount) || 0;
    }
    return total;
  };

  // Map wedding city display name to pricing key
  const getCityKey = (cityName?: string): string => {
    if (!cityName) return 'other';
    const normalized = cityName.toLowerCase();
    if (normalized.includes('bay area') || normalized.includes('san francisco')) return 'bay_area';
    if (normalized.includes('new york') || normalized.includes('nyc')) return 'nyc';
    if (normalized.includes('los angeles') || normalized.includes('la')) return 'la';
    if (normalized.includes('chicago')) return 'chicago';
    if (normalized.includes('seattle')) return 'seattle';
    return 'other';
  };

  // Set all line item budgets to estimates (low or high) using shared pricing logic
  const setEstimatesForEvent = (eventId: string, eventName: string, useHigh: boolean) => {
    const lineItems = getLineItemsForEvent(eventId, eventName);
    if (!lineItems) return;

    // Find the event to get guest count
    const event = events.find(e => e.id === eventId);
    const guestCount = event?.guestCount || 100; // Default to 100 if not set (same as budget estimator)

    // Build pricing context using wedding city and defaults
    const pricingContext: PricingContext = {
      ...DEFAULT_PRICING_CONTEXT,
      guestCount,
      city: getCityKey(wedding?.city),
    };

    const newValues: Record<string, string> = {};
    for (const item of lineItems) {
      const estimates = calculateLineItemEstimate(item, guestCount, pricingContext);
      const value = useHigh ? estimates.high : estimates.low;
      newValues[item.category] = value.toString();
    }

    setEditingLineItems(prev => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        ...newValues,
      },
    }));
  };

  // Ceremony Budgets (Budget Matrix)
  interface CeremonyAnalyticsResponse {
    overview: {
      totalBudget: number;
      totalCeremonyAllocated: number;
      unallocatedBudget: number;
      percentAllocated: number;
      isOverAllocated: boolean;
    };
    ceremonyBreakdown: Array<{
      eventId: string;
      eventName: string;
      eventDate: string | null;
      eventType: string | null;
      side: 'bride' | 'groom' | 'mutual';
      allocated: number;
      spent: number;
      remaining: number;
      percentUsed: number;
      isOverBudget: boolean;
      hasNoBudget: boolean;
      expenseCount: number;
    }>;
    sideAnalytics: {
      bride: { allocated: number; spent: number; eventCount: number };
      groom: { allocated: number; spent: number; eventCount: number };
      mutual: { allocated: number; spent: number; eventCount: number };
    };
    summary: {
      totalEvents: number;
      eventsWithBudget: number;
      eventsOverBudget: number;
    };
  }

  const { data: ceremonyAnalytics } = useQuery<CeremonyAnalyticsResponse>({
    queryKey: [`/api/budget/ceremony-analytics/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  // Get vendor name by ID
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || "Vendor";
  };

  // Get bucket label
  const getBucketLabel = (bucket: string | null | undefined) => {
    if (!bucket) return "Other";
    return BUDGET_BUCKET_LABELS[bucket as BudgetBucket] || bucket;
  };

  // Extract upcoming payments from contracts
  interface PaymentMilestone {
    name: string;
    amount: number | string;
    dueDate: string;
    status: string;
  }

  interface UpcomingPayment {
    vendorId: string;
    vendorName: string;
    contractId: string;
    milestoneName: string;
    amount: number;
    dueDate: Date;
    status: string;
    daysUntilDue: number;
    isCash?: boolean;
  }

  const upcomingPayments: UpcomingPayment[] = useMemo(() => {
    return contracts
      .flatMap((contract) => {
        let milestones: PaymentMilestone[] = [];
        if (contract.paymentMilestones) {
          if (typeof contract.paymentMilestones === "string") {
            try {
              milestones = JSON.parse(contract.paymentMilestones);
            } catch {
              milestones = [];
            }
          } else if (Array.isArray(contract.paymentMilestones)) {
            milestones = contract.paymentMilestones as PaymentMilestone[];
          }
        }

        return milestones
          .filter((m) => m && m.status !== "paid" && m.dueDate)
          .map((milestone): UpcomingPayment | null => {
            const dueDate = new Date(milestone.dueDate);
            if (isNaN(dueDate.getTime())) return null;
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const amount = parseFloat(String(milestone.amount));
            return {
              vendorId: contract.vendorId,
              vendorName: getVendorName(contract.vendorId),
              contractId: contract.id,
              milestoneName: milestone.name || "Payment",
              amount: isNaN(amount) ? 0 : amount,
              dueDate,
              status: milestone.status || "pending",
              daysUntilDue,
              isCash: milestone.name?.toLowerCase().includes("cash"),
            };
          })
          .filter((p): p is UpcomingPayment => p !== null);
      })
      .filter((p): p is UpcomingPayment => p !== null && p.daysUntilDue >= -30)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 10);
  }, [contracts, vendors]);

  // Compute expenses grouped by event with contributor filtering
  const expensesByEvent = useMemo(() => {
    const eventMap: Record<string, { 
      event: Event | null; 
      expenses: Array<ExpenseWithAllocations & { allocatedAmount?: number; paymentStatus?: string }>;
      total: number;
      estimatedTotal?: number;
    }> = {};

    // Initialize with all events
    events.forEach((event) => {
      eventMap[event.id] = {
        event,
        expenses: [],
        total: 0,
        estimatedTotal: costSummary?.categories?.[event.id]?.total || 0,
      };
    });

    // Add "Unassigned" category for expenses without events
    eventMap["unassigned"] = {
      event: null,
      expenses: [],
      total: 0,
    };

    // Filter expenses by contributor
    // Uses paidById to match team member IDs, or falls back to name matching
    const filteredExpenses = allExpenses.filter((expense) => {
      if (contributorFilter === "all") return true;
      
      const paidByName = expense.paidByName?.toLowerCase() || "";
      const paidById = expense.paidById?.toLowerCase() || "";
      
      // Check common patterns for bride's side
      if (contributorFilter === "bride") {
        const bridePatterns = ["bride", "wife", "partner1", wedding?.partner1Name?.toLowerCase() || ""].filter(Boolean);
        return bridePatterns.some(pattern => 
          paidByName.includes(pattern) || paidById.includes(pattern)
        );
      }
      
      // Check common patterns for groom's side
      if (contributorFilter === "groom") {
        const groomPatterns = ["groom", "husband", "partner2", wedding?.partner2Name?.toLowerCase() || ""].filter(Boolean);
        return groomPatterns.some(pattern => 
          paidByName.includes(pattern) || paidById.includes(pattern)
        );
      }
      
      return true;
    });

    // Assign expenses to events
    filteredExpenses.forEach((expense) => {
      // Check for multi-event allocations (embedded in expense object from API)
      const allocations = expense.eventAllocations || [];
      
      if (allocations.length > 0) {
        // Multi-event expense
        allocations.forEach((allocation) => {
          const eventId = allocation.eventId || "unassigned";
          if (!eventMap[eventId]) {
            eventMap[eventId] = { event: null, expenses: [], total: 0 };
          }
          const allocatedAmount = parseFloat(allocation.allocatedAmount?.toString() || "0");
          eventMap[eventId].expenses.push({
            ...expense,
            allocatedAmount,
          });
          eventMap[eventId].total += allocatedAmount;
        });
      } else if ((expense as any).ceremonyId || expense.eventId) {
        // Single event/ceremony expense
        const eventId = (expense as any).ceremonyId || expense.eventId;
        if (!eventMap[eventId]) {
          eventMap[eventId] = { event: null, expenses: [], total: 0 };
        }
        const amount = parseFloat(expense.amount?.toString() || "0");
        eventMap[eventId].expenses.push(expense);
        eventMap[eventId].total += amount;
      } else {
        // Unassigned expense
        const amount = parseFloat(expense.amount?.toString() || "0");
        eventMap["unassigned"].expenses.push(expense);
        eventMap["unassigned"].total += amount;
      }
    });

    return eventMap;
  }, [events, allExpenses, contributorFilter, wedding, costSummary]);

  // Calculate totals
  const total = parseFloat(wedding?.totalBudget || "0");
  const totalSpent = useMemo(() => {
    return Object.values(expensesByEvent).reduce((sum, e) => sum + e.total, 0);
  }, [expensesByEvent]);
  const remainingBudget = total - totalSpent;
  const spentPercentage = total > 0 ? (totalSpent / total) * 100 : 0;

  // Calculate totals by event side
  const spentBySide = useMemo(() => {
    const sideTotals = { bride: 0, groom: 0, mutual: 0 };
    
    Object.entries(expensesByEvent).forEach(([eventId, data]) => {
      if (eventId === "unassigned") {
        sideTotals.mutual += data.total;
      } else if (data.event) {
        // Treat undefined/null side as "mutual" for backward compatibility
        const side = (data.event.side as "bride" | "groom" | "mutual") || "mutual";
        sideTotals[side] += data.total;
      }
    });
    
    return sideTotals;
  }, [expensesByEvent]);

  // Count events by side for display
  const eventCountsBySide = useMemo(() => {
    return {
      bride: events.filter(e => e.side === "bride").length,
      groom: events.filter(e => e.side === "groom").length,
      mutual: events.filter(e => !e.side || e.side === "mutual").length,
    };
  }, [events]);

  // Toggle event expansion
  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Generate budget summary for sharing
  const generateBudgetSummary = () => {
    const weddingName = wedding?.partner1Name && wedding?.partner2Name 
      ? `${wedding.partner1Name} & ${wedding.partner2Name}'s Wedding` 
      : "Wedding";
    const weddingDate = wedding?.weddingDate 
      ? new Date(wedding.weddingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "";

    let summary = `${weddingName} Budget Summary\n`;
    if (weddingDate) summary += `Date: ${weddingDate}\n`;
    summary += `${"─".repeat(30)}\n\n`;
    
    summary += `TOTAL BUDGET: $${total.toLocaleString()}\n`;
    summary += `SPENT SO FAR: $${totalSpent.toLocaleString()} (${spentPercentage.toFixed(0)}%)\n`;
    summary += `REMAINING: $${remainingBudget.toLocaleString()}\n\n`;
    
    summary += `BREAKDOWN BY EVENT:\n`;
    summary += `${"─".repeat(30)}\n`;
    
    events.forEach((event) => {
      const eventData = expensesByEvent[event.id];
      if (eventData && eventData.total > 0) {
        summary += `\n${event.name}: $${eventData.total.toLocaleString()}\n`;
        eventData.expenses.forEach((exp) => {
          const amount = exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0");
          summary += `  - ${exp.description}: $${amount.toLocaleString()}\n`;
        });
      }
    });

    // Include unassigned expenses
    const unassigned = expensesByEvent["unassigned"];
    if (unassigned && unassigned.total > 0) {
      summary += `\nGeneral/Unassigned: $${unassigned.total.toLocaleString()}\n`;
      unassigned.expenses.forEach((exp) => {
        const amount = exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0");
        summary += `  - ${exp.description}: $${amount.toLocaleString()}\n`;
      });
    }

    if (upcomingPayments.length > 0) {
      summary += `\nUPCOMING PAYMENTS:\n`;
      summary += `${"─".repeat(30)}\n`;
      upcomingPayments.slice(0, 5).forEach((payment) => {
        const dateStr = payment.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        summary += `${dateStr}: $${payment.amount.toLocaleString()} - ${payment.vendorName}\n`;
      });
    }

    summary += `\n─ Generated via Viah.me`;
    return summary;
  };

  const handleCopyBudget = async () => {
    const summary = generateBudgetSummary();
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: "Copied to clipboard", description: "Budget summary ready to paste" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleWhatsAppShare = () => {
    const summary = generateBudgetSummary();
    window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups", variant: "destructive" });
      return;
    }

    const weddingName = wedding?.partner1Name && wedding?.partner2Name 
      ? `${wedding.partner1Name} & ${wedding.partner2Name}'s Wedding` 
      : "Wedding";

    let eventsHtml = "";
    events.forEach((event) => {
      const eventData = expensesByEvent[event.id];
      if (eventData && eventData.expenses.length > 0) {
        eventsHtml += `
          <div style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px;">
              <span>${event.name}</span>
              <span>$${eventData.total.toLocaleString()}</span>
            </div>
            ${eventData.expenses.map(exp => `
              <div style="display: flex; justify-content: space-between; padding-left: 16px; font-size: 14px; color: #666;">
                <span>${exp.description}</span>
                <span>$${(exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0")).toLocaleString()}</span>
              </div>
            `).join("")}
          </div>
        `;
      }
    });

    // Add unassigned expenses
    const unassigned = expensesByEvent["unassigned"];
    if (unassigned && unassigned.expenses.length > 0) {
      eventsHtml += `
        <div style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px; color: #666;">
            <span>General / Unassigned</span>
            <span>$${unassigned.total.toLocaleString()}</span>
          </div>
          ${unassigned.expenses.map(exp => `
            <div style="display: flex; justify-content: space-between; padding-left: 16px; font-size: 14px; color: #666;">
              <span>${exp.description}</span>
              <span>$${(exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0")).toLocaleString()}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${weddingName} - Budget</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #059669; }
          .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <h1>${weddingName}</h1>
        <div class="summary">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div><strong>Total Budget</strong><br/>$${total.toLocaleString()}</div>
            <div><strong>Spent</strong><br/>$${totalSpent.toLocaleString()}</div>
            <div><strong>Remaining</strong><br/>$${remainingBudget.toLocaleString()}</div>
          </div>
        </div>
        <h2>Breakdown by Event</h2>
        ${eventsHtml}
        <div class="footer">Generated via Viah.me</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      bucket: "venue",
      allocatedAmount: "0",
    },
  });

  const updateWeddingBudgetMutation = useMutation({
    mutationFn: async (totalBudget: string) => {
      if (!wedding?.id) throw new Error("Wedding ID not found");
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}`, { totalBudget });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      setEditBudgetOpen(false);
      toast({ title: "Budget updated", description: "Your total wedding budget has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    },
  });

  const updateEventBudgetMutation = useMutation({
    mutationFn: async ({ eventId, budget }: { eventId: string; budget: number }) => {
      return await apiRequest("PATCH", `/api/events/${eventId}`, { allocatedBudget: budget.toString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      toast({ title: "Ceremony budget set", description: "Budget allocation has been saved for this ceremony" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to set ceremony budget", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id, "totals"] });
      setDeletingExpenseId(null);
      toast({ title: "Expense deleted", description: "The expense has been removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id, "totals"] });
      setEditingExpense(null);
      toast({ title: "Expense updated", description: "The expense has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
    },
  });

  const updateCategoryBudgetMutation = useMutation({
    mutationFn: async ({ bucket, amount }: { bucket: BudgetBucket; amount: string }) => {
      if (!wedding?.id) throw new Error("Wedding ID not found");
      return await apiRequest("POST", `/api/budget/allocations`, {
        weddingId: wedding.id,
        bucket,
        allocatedAmount: amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id, "totals"] });
      setEditingBucket(null);
      setEditingBucketAmount("");
      toast({ title: "Category budget updated", description: "Budget allocation has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category budget", variant: "destructive" });
    },
  });

  const updateCeremonyBudgetMutation = useMutation({
    mutationFn: async ({ ceremonyId, amount }: { ceremonyId: string; amount: string }) => {
      if (!wedding?.id) throw new Error("Wedding ID not found");
      return await apiRequest("POST", `/api/budget/ceremony-budgets`, {
        weddingId: wedding.id,
        ceremonyId,
        allocatedAmount: amount,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/budget/ceremony-analytics/${wedding?.id}`] });
      // Clear inline editing state for this ceremony
      setEditingCeremonyTotals(prev => {
        const next = { ...prev };
        delete next[variables.ceremonyId];
        return next;
      });
      toast({ title: "Ceremony budget updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ceremony budget", variant: "destructive" });
    },
  });

  // Helper functions for inline ceremony total editing
  const getCeremonyTotalValue = (eventId: string, currentAllocated: number): string => {
    if (editingCeremonyTotals[eventId] !== undefined) {
      return editingCeremonyTotals[eventId];
    }
    return currentAllocated > 0 ? currentAllocated.toString() : "";
  };

  const handleCeremonyTotalChange = (eventId: string, value: string) => {
    setEditingCeremonyTotals(prev => ({
      ...prev,
      [eventId]: value,
    }));
  };

  const saveCeremonyTotal = (eventId: string) => {
    const amount = editingCeremonyTotals[eventId];
    if (amount !== undefined) {
      updateCeremonyBudgetMutation.mutate({ ceremonyId: eventId, amount });
    }
  };

  const hasCeremonyTotalChanges = (eventId: string, currentAllocated: number): boolean => {
    const editedValue = editingCeremonyTotals[eventId];
    if (editedValue === undefined) return false;
    return editedValue !== (currentAllocated > 0 ? currentAllocated.toString() : "");
  };

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  useEffect(() => {
    if (wedding?.id) {
      if (wedding.totalBudget) {
        setNewTotalBudget(wedding.totalBudget.toString());
      }
    }
  }, [wedding?.id, wedding?.totalBudget]);

  // Set initial amount when opening category budget editor
  useEffect(() => {
    if (editingBucket && expenseTotals?.bucketTotals) {
      const bucketData = expenseTotals.bucketTotals.find(b => b.bucket === editingBucket);
      setEditingBucketAmount(bucketData?.allocated?.toString() || "0");
    }
  }, [editingBucket, expenseTotals?.bucketTotals]);

  const handleSaveBudget = () => {
    if (!newTotalBudget || parseFloat(newTotalBudget) <= 0) {
      toast({ title: "Please enter a budget", variant: "destructive" });
      return;
    }
    updateWeddingBudgetMutation.mutate(newTotalBudget);
  };

  // Get expense payment status with remaining amount
  const getPaymentStatus = (expense: Expense): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; remaining: number } => {
    const status = (expense as any).paymentStatus || "partial";
    const totalAmount = Number(expense.amount) || 0;
    const amountPaid = Number((expense as any).amountPaid) || 0;
    const remaining = totalAmount - amountPaid;
    
    if (status === "paid" || remaining <= 0) {
      return { label: "FULLY PAID", variant: "default", remaining: 0 };
    }
    return { label: "PARTIAL", variant: "outline", remaining };
  };

  if (weddingsLoading || allocationsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold" data-testid="text-budget-title">Budget Planner</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/budget-estimator")}
              data-testid="button-budget-estimator"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Estimator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/financial-dashboard")}
              data-testid="button-financial-dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-share-budget">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyBudget} data-testid="button-copy-budget">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsAppShare} data-testid="button-whatsapp-budget">
                  <SiWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                  Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPDF} data-testid="button-pdf-budget">
                  <FileText className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Budget Summary Card */}
        <Card className="p-6 mb-6" data-testid="card-budget-summary">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <button 
                  onClick={() => setEditBudgetOpen(true)}
                  className="text-3xl font-bold font-mono hover:text-primary transition-colors"
                  data-testid="button-edit-total-budget"
                >
                  ${total.toLocaleString()}
                </button>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-spent">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold font-mono ${remainingBudget < 0 ? "text-destructive" : "text-emerald-600"}`} data-testid="text-remaining">
                ${remainingBudget.toLocaleString()}
              </p>
            </div>
          </div>
          <Progress value={Math.min(spentPercentage, 100)} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {spentPercentage.toFixed(0)}% of budget spent
          </p>
        </Card>

        {/* Side-Based Budget & Spending Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card 
            className={`p-4 border-l-4 border-l-pink-500 cursor-pointer transition-all hover-elevate ${sideFilter === 'bride' ? 'ring-2 ring-pink-500' : ''}`}
            onClick={() => setSideFilter(sideFilter === 'bride' ? 'all' : 'bride')}
            data-testid="card-bride-spending"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-pink-600" />
                </div>
                <span className="font-medium text-pink-700 dark:text-pink-300">
                  {wedding?.partner1Name || "Bride"}'s Side
                </span>
              </div>
              {sideFilter === 'bride' && (
                <Badge variant="secondary" className="text-xs">Filtered</Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Budget:</span>
                <span className="font-mono font-semibold text-pink-700 dark:text-pink-300">
                  ${(ceremonyAnalytics?.sideAnalytics?.bride?.allocated || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Spent:</span>
                <span className="font-mono font-bold">
                  ${(ceremonyAnalytics?.sideAnalytics?.bride?.spent || spentBySide.bride).toLocaleString()}
                </span>
              </div>
              {(ceremonyAnalytics?.sideAnalytics?.bride?.allocated || 0) > 0 && (
                <Progress 
                  value={Math.min(((ceremonyAnalytics?.sideAnalytics?.bride?.spent || 0) / (ceremonyAnalytics?.sideAnalytics?.bride?.allocated || 1)) * 100, 100)} 
                  className="h-1.5 mt-2" 
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ceremonyAnalytics?.sideAnalytics?.bride?.eventCount || eventCountsBySide.bride} ceremonies
            </p>
          </Card>

          <Card 
            className={`p-4 border-l-4 border-l-amber-500 cursor-pointer transition-all hover-elevate ${sideFilter === 'mutual' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => setSideFilter(sideFilter === 'mutual' ? 'all' : 'mutual')}
            data-testid="card-mutual-spending"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-medium text-amber-700 dark:text-amber-300">Shared</span>
              </div>
              {sideFilter === 'mutual' && (
                <Badge variant="secondary" className="text-xs">Filtered</Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Budget:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                  ${(ceremonyAnalytics?.sideAnalytics?.mutual?.allocated || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Spent:</span>
                <span className="font-mono font-bold">
                  ${(ceremonyAnalytics?.sideAnalytics?.mutual?.spent || spentBySide.mutual).toLocaleString()}
                </span>
              </div>
              {(ceremonyAnalytics?.sideAnalytics?.mutual?.allocated || 0) > 0 && (
                <Progress 
                  value={Math.min(((ceremonyAnalytics?.sideAnalytics?.mutual?.spent || 0) / (ceremonyAnalytics?.sideAnalytics?.mutual?.allocated || 1)) * 100, 100)} 
                  className="h-1.5 mt-2" 
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ceremonyAnalytics?.sideAnalytics?.mutual?.eventCount || eventCountsBySide.mutual} ceremonies
            </p>
          </Card>

          <Card 
            className={`p-4 border-l-4 border-l-blue-500 cursor-pointer transition-all hover-elevate ${sideFilter === 'groom' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSideFilter(sideFilter === 'groom' ? 'all' : 'groom')}
            data-testid="card-groom-spending"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {wedding?.partner2Name || "Groom"}'s Side
                </span>
              </div>
              {sideFilter === 'groom' && (
                <Badge variant="secondary" className="text-xs">Filtered</Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Budget:</span>
                <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                  ${(ceremonyAnalytics?.sideAnalytics?.groom?.allocated || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Spent:</span>
                <span className="font-mono font-bold">
                  ${(ceremonyAnalytics?.sideAnalytics?.groom?.spent || spentBySide.groom).toLocaleString()}
                </span>
              </div>
              {(ceremonyAnalytics?.sideAnalytics?.groom?.allocated || 0) > 0 && (
                <Progress 
                  value={Math.min(((ceremonyAnalytics?.sideAnalytics?.groom?.spent || 0) / (ceremonyAnalytics?.sideAnalytics?.groom?.allocated || 1)) * 100, 100)} 
                  className="h-1.5 mt-2" 
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ceremonyAnalytics?.sideAnalytics?.groom?.eventCount || eventCountsBySide.groom} ceremonies
            </p>
          </Card>
        </div>

        {/* Clear Side Filter */}
        {sideFilter !== 'all' && (
          <div className="mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSideFilter('all')}
              className="text-xs"
              data-testid="button-clear-side-filter"
            >
              Clear side filter
            </Button>
          </div>
        )}

        {/* Contributor Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Contributors:</span>
          <div className="flex gap-2">
            <Button
              variant={contributorFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setContributorFilter("all")}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              variant={contributorFilter === "bride" ? "default" : "outline"}
              size="sm"
              onClick={() => setContributorFilter("bride")}
              className={contributorFilter === "bride" ? "bg-rose-500 hover:bg-rose-600" : ""}
              data-testid="filter-bride"
            >
              {wedding.partner1Name || "Bride"}'s Family
            </Button>
            <Button
              variant={contributorFilter === "groom" ? "default" : "outline"}
              size="sm"
              onClick={() => setContributorFilter("groom")}
              className={contributorFilter === "groom" ? "bg-amber-500 hover:bg-amber-600" : ""}
              data-testid="filter-groom"
            >
              {wedding.partner2Name || "Groom"}'s Family
            </Button>
          </div>
        </div>

        {/* Budget Matrix Explainer */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Two Ways to Track Your Budget</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You can set budgets <strong>by category</strong> (like Venue, Catering, Photography) OR <strong>by ceremony</strong> (like Sangeet, Mehndi, Reception). 
                Use whichever feels more natural to you — or both! They draw from the same total budget.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Tip: Click the pencil icon next to any category or ceremony to set its budget.
              </p>
            </div>
          </div>
        </Card>

        {/* Budget Categories Breakdown */}
        <Card className="p-4 mb-6">
          <Collapsible open={showCategories} onOpenChange={setShowCategories}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full" data-testid="toggle-categories">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Budget by Category</h3>
                    <p className="text-sm text-muted-foreground">
                      {BUDGET_BUCKETS.length} categories • Track spending by type
                    </p>
                  </div>
                </div>
                {showCategories ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <p className="text-xs text-muted-foreground mb-3 px-1">
                Set how much you want to spend on each type of expense across all your ceremonies.
              </p>
              <div className="space-y-3">
                {(expenseTotals?.bucketTotals || []).map((bucketTotal) => {
                  const percentSpent = bucketTotal.allocated > 0 ? (bucketTotal.spent / bucketTotal.allocated) * 100 : 0;

                  return (
                    <div 
                      key={bucketTotal.bucket} 
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`category-${bucketTotal.bucket}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{bucketTotal.label}</p>
                          <p className="text-sm text-muted-foreground">
                            ${bucketTotal.spent.toLocaleString()} of ${bucketTotal.allocated.toLocaleString()} spent
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBucket(bucketTotal.bucket as BudgetBucket)}
                          data-testid={`button-edit-category-${bucketTotal.bucket}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Progress value={Math.min(percentSpent, 100)} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{percentSpent.toFixed(0)}% spent</span>
                        <span className={bucketTotal.remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                          ${bucketTotal.remaining.toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Budget by Ceremony (Budget Matrix) */}
        <Card className="p-4 mb-6">
          <Collapsible open={showCeremonyBudgets} onOpenChange={setShowCeremonyBudgets}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full" data-testid="toggle-ceremony-budgets">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Budget by Ceremony</h3>
                    <p className="text-sm text-muted-foreground">
                      {ceremonyAnalytics?.summary.eventsWithBudget || 0} of {events.length} events • Track spending by event
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ceremonyAnalytics?.overview.isOverAllocated && (
                    <Badge variant="destructive" className="text-xs">
                      Over-allocated
                    </Badge>
                  )}
                  {showCeremonyBudgets ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <p className="text-xs text-muted-foreground mb-3 px-1">
                Set a budget for each ceremony or event. Great for tracking costs when different families host different events.
              </p>
              {/* Allocation Overview */}
              {ceremonyAnalytics && (
                <div className="p-4 rounded-lg bg-muted/50 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Allocated to Ceremonies</p>
                      <p className="text-xl font-bold font-mono">
                        ${ceremonyAnalytics.overview.totalCeremonyAllocated.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unallocated</p>
                      <p className={`text-xl font-bold font-mono ${ceremonyAnalytics.overview.unallocatedBudget < 0 ? 'text-destructive' : ''}`}>
                        ${ceremonyAnalytics.overview.unallocatedBudget.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {ceremonyAnalytics.overview.percentAllocated.toFixed(0)}% of budget allocated
                      </p>
                      {ceremonyAnalytics.summary.eventsOverBudget > 0 && (
                        <p className="text-xs text-destructive">
                          {ceremonyAnalytics.summary.eventsOverBudget} event(s) over budget
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Ceremony Breakdown */}
              <div className="space-y-3">
                {(ceremonyAnalytics?.ceremonyBreakdown || [])
                  .filter(ceremony => sideFilter === 'all' || ceremony.side === sideFilter)
                  .map((ceremony) => {
                  const percentSpent = ceremony.allocated > 0 ? ceremony.percentUsed : 0;
                  const lineItems = getLineItemsForEvent(ceremony.eventId, ceremony.eventName);
                  const isExpanded = expandedCeremonies.has(ceremony.eventId);
                  const lineItemTotal = lineItems ? getEventLineItemTotal(ceremony.eventId, lineItems) : 0;
                  const hasUnsavedChanges = !!editingLineItems[ceremony.eventId] && Object.keys(editingLineItems[ceremony.eventId]).length > 0;

                  // Side badge styling
                  const sideColors = {
                    bride: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
                    groom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                    mutual: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                  };
                  const sideLabels = {
                    bride: wedding?.partner1Name || "Bride",
                    groom: wedding?.partner2Name || "Groom",
                    mutual: "Shared",
                  };

                  return (
                    <div 
                      key={ceremony.eventId} 
                      className={`rounded-lg border bg-card ${ceremony.isOverBudget ? 'border-destructive/50' : ''}`}
                      data-testid={`ceremony-budget-${ceremony.eventId}`}
                    >
                      {/* Ceremony Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => toggleCeremonyExpansion(ceremony.eventId)}
                                className="p-1 -ml-1 hover:bg-muted/50 rounded"
                                data-testid={`button-expand-ceremony-${ceremony.eventId}`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                              <p className="font-medium truncate">{ceremony.eventName}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs shrink-0 ${sideColors[ceremony.side]}`}
                                data-testid={`badge-side-${ceremony.eventId}`}
                              >
                                {sideLabels[ceremony.side]}
                              </Badge>
                              {ceremony.isOverBudget && (
                                <Badge variant="destructive" className="text-xs shrink-0">Over Budget</Badge>
                              )}
                              {ceremony.hasNoBudget && ceremony.spent > 0 && (
                                <Badge variant="outline" className="text-xs shrink-0">No Budget Set</Badge>
                              )}
                              {lineItems && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {lineItems.length} line items
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ${ceremony.spent.toLocaleString()} spent
                              {ceremony.expenseCount > 0 && ` • ${ceremony.expenseCount} expense${ceremony.expenseCount > 1 ? 's' : ''}`}
                              {lineItemTotal > 0 && ` • $${lineItemTotal.toLocaleString()} in line items`}
                            </p>
                          </div>
                          {/* Inline Total Budget Input */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">Budget:</span>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0"
                                className="w-24 h-8 pl-6 text-right text-sm"
                                value={getCeremonyTotalValue(ceremony.eventId, ceremony.allocated)}
                                onChange={(e) => handleCeremonyTotalChange(ceremony.eventId, e.target.value)}
                                data-testid={`input-ceremony-total-${ceremony.eventId}`}
                              />
                            </div>
                            {hasCeremonyTotalChanges(ceremony.eventId, ceremony.allocated) && (
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => saveCeremonyTotal(ceremony.eventId)}
                                disabled={updateCeremonyBudgetMutation.isPending}
                                data-testid={`button-save-ceremony-total-${ceremony.eventId}`}
                              >
                                {updateCeremonyBudgetMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        {ceremony.allocated > 0 && (
                          <>
                            <Progress 
                              value={Math.min(percentSpent, 100)} 
                              className={`h-2 ${ceremony.isOverBudget ? '[&>div]:bg-destructive' : ''}`} 
                            />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{percentSpent.toFixed(0)}% spent</span>
                              <span className={ceremony.remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                                ${ceremony.remaining.toLocaleString()} remaining
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Expandable Line Items */}
                      {lineItems && isExpanded && (
                        <div className="border-t bg-muted/30 p-4">
                          <div className="flex flex-col gap-2 mb-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Budget per Category</p>
                              {hasUnsavedChanges && (
                                <Button
                                  size="sm"
                                  onClick={() => saveEventLineItems(ceremony.eventId, ceremony.eventName)}
                                  disabled={saveLineItemBudgetsMutation.isPending}
                                  data-testid={`button-save-line-items-${ceremony.eventId}`}
                                >
                                  {saveLineItemBudgetsMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : null}
                                  Save
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Pull from estimates:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEstimatesForEvent(ceremony.eventId, ceremony.eventName, false)}
                                className="h-7 text-xs"
                                data-testid={`button-set-low-estimate-${ceremony.eventId}`}
                              >
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Low Estimate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEstimatesForEvent(ceremony.eventId, ceremony.eventName, true)}
                                className="h-7 text-xs"
                                data-testid={`button-set-high-estimate-${ceremony.eventId}`}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                High Estimate
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {lineItems.map((item, idx) => {
                              const savedAmount = getExistingLineItemBudget(ceremony.eventId, item.category);
                              const hasValue = savedAmount && parseFloat(savedAmount) > 0;
                              
                              return (
                                <div 
                                  key={idx} 
                                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                                  data-testid={`line-item-${ceremony.eventId}-${idx}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.category}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Est: ${item.lowCost.toLocaleString()} - ${item.highCost.toLocaleString()}
                                      {item.unit === "per_person" && " per person"}
                                      {item.unit === "per_hour" && " per hour"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm text-muted-foreground">$</span>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className={`w-24 h-8 text-right ${hasValue ? 'border-primary/50' : ''}`}
                                      value={savedAmount}
                                      onChange={(e) => handleLineItemChange(ceremony.eventId, item.category, e.target.value)}
                                      data-testid={`input-line-item-${ceremony.eventId}-${idx}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {lineItemTotal > 0 && (
                            <div className="flex justify-between items-center mt-4 pt-3 border-t">
                              <span className="text-sm font-medium">Line Item Total</span>
                              <span className="text-lg font-bold font-mono">
                                ${lineItemTotal.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!ceremonyAnalytics?.ceremonyBreakdown || ceremonyAnalytics.ceremonyBreakdown.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events found. Add events to start budgeting per ceremony.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Budget Matrix (Ceremony x Category Grid) */}
        {wedding?.id && (
          <div className="mb-6">
            <BudgetMatrix weddingId={wedding.id} />
          </div>
        )}

        {/* Breakdown by Event */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Breakdown by Event
            {sideFilter !== 'all' && (
              <Badge variant="outline" className="text-xs ml-2">
                Filtered by {sideFilter === 'bride' ? (wedding?.partner1Name || 'Bride') : sideFilter === 'groom' ? (wedding?.partner2Name || 'Groom') : 'Shared'}
              </Badge>
            )}
          </h2>

          <div className="space-y-3">
            {events
              .filter(event => sideFilter === 'all' || (event.side || 'mutual') === sideFilter)
              .map((event) => {
              const eventData = expensesByEvent[event.id];
              const isExpanded = expandedEvents.has(event.id);
              const eventTotal = eventData?.total || 0;
              const eventSide = (event.side || 'mutual') as 'bride' | 'groom' | 'mutual';

              // Side badge styling
              const sideColors = {
                bride: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
                groom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                mutual: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
              };
              const sideLabels = {
                bride: wedding?.partner1Name || "Bride",
                groom: wedding?.partner2Name || "Groom",
                mutual: "Shared",
              };

              return (
                <Collapsible 
                  key={event.id} 
                  open={isExpanded} 
                  onOpenChange={() => toggleEvent(event.id)}
                >
                  <Card className="overflow-hidden" data-testid={`card-event-${event.id}`}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover-elevate">
                        <div className="flex items-center gap-3 flex-wrap">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium">{event.name}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${sideColors[eventSide]}`}
                          >
                            {sideLabels[eventSide]}
                          </Badge>
                          {eventData?.expenses.length ? (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {eventData.expenses.length} items
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-semibold">
                            ${eventTotal.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-3 bg-muted/30">
                        {eventData?.expenses.length ? (
                          <div className="space-y-4">
                            {/* Group expenses by category (bucket) */}
                            {(() => {
                              const byCategory: Record<string, typeof eventData.expenses> = {};
                              eventData.expenses.forEach((exp) => {
                                const cat = exp.parentCategory || "other";
                                if (!byCategory[cat]) byCategory[cat] = [];
                                byCategory[cat].push(exp);
                              });
                              return Object.entries(byCategory).map(([bucket, catExpenses]) => {
                                const categoryTotal = catExpenses.reduce((sum, exp) => {
                                  return sum + parseFloat(exp.amount?.toString() || "0");
                                }, 0);
                                return (
                                  <div key={bucket} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b pb-1">
                                      <span>{getBucketLabel(bucket)}</span>
                                      <span className="font-mono">${categoryTotal.toLocaleString()}</span>
                                    </div>
                                    {catExpenses.map((expense, idx) => {
                                      const amount = parseFloat(expense.amount?.toString() || "0");
                                      const status = getPaymentStatus(expense);
                                      const isPartial = status.remaining > 0;
                                      return (
                                        <div 
                                          key={expense.id || idx}
                                          className={`group flex items-center justify-between py-1 text-sm pl-4 ${isPartial ? "bg-orange-50/50 dark:bg-orange-950/20 rounded -mx-2 px-2" : ""}`}
                                          data-testid={`expense-item-${expense.id}`}
                                        >
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span>{expense.expenseName}</span>
                                            <Badge 
                                              variant={status.variant} 
                                              className={`text-xs ${isPartial ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : ""}`}
                                            >
                                              {status.label}
                                            </Badge>
                                            {isPartial && (
                                              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                (${status.remaining.toLocaleString()} owed)
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="invisible group-hover:visible flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setEditingExpense(expense)}
                                                data-testid={`button-edit-expense-${expense.id}`}
                                              >
                                                <Edit2 className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={() => setDeletingExpenseId(expense.id)}
                                                data-testid={`button-delete-expense-${expense.id}`}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <span className="font-mono text-muted-foreground">
                                              ${amount.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            No expenses recorded for this event yet.
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => {
                            setAddExpenseEventId(event.id);
                            setAddExpenseDialogOpen(true);
                          }}
                          data-testid={`button-add-expense-${event.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Expense
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {/* Unassigned Expenses */}
            {expensesByEvent["unassigned"]?.expenses.length > 0 && (
              <Collapsible 
                open={expandedEvents.has("unassigned")} 
                onOpenChange={() => toggleEvent("unassigned")}
              >
                <Card className="overflow-hidden border-dashed" data-testid="card-event-unassigned">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover-elevate">
                      <div className="flex items-center gap-3">
                        {expandedEvents.has("unassigned") ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-medium text-muted-foreground">General / Unassigned</span>
                        <Badge variant="outline" className="text-xs">
                          {expensesByEvent["unassigned"].expenses.length} items
                        </Badge>
                      </div>
                      <span className="font-mono font-semibold">
                        ${expensesByEvent["unassigned"].total.toLocaleString()}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-4 py-3 bg-muted/30">
                      <div className="space-y-4">
                        {/* Group unassigned expenses by category (bucket) */}
                        {(() => {
                          const unassignedExpenses = expensesByEvent["unassigned"].expenses;
                          const byCategory: Record<string, typeof unassignedExpenses> = {};
                          unassignedExpenses.forEach((exp) => {
                            const cat = exp.parentCategory || "other";
                            if (!byCategory[cat]) byCategory[cat] = [];
                            byCategory[cat].push(exp);
                          });
                          return Object.entries(byCategory).map(([bucket, catExpenses]) => {
                            const categoryTotal = catExpenses.reduce((sum, exp) => {
                              return sum + parseFloat(exp.amount?.toString() || "0");
                            }, 0);
                            return (
                              <div key={bucket} className="space-y-1">
                                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b pb-1">
                                  <span>{getBucketLabel(bucket)}</span>
                                  <span className="font-mono">${categoryTotal.toLocaleString()}</span>
                                </div>
                                {catExpenses.map((expense, idx) => {
                                  const amount = parseFloat(expense.amount?.toString() || "0");
                                  const status = getPaymentStatus(expense);
                                  const isPartial = status.remaining > 0;
                                  return (
                                    <div 
                                      key={expense.id || idx}
                                      className={`group flex items-center justify-between py-1 text-sm pl-4 ${isPartial ? "bg-orange-50/50 dark:bg-orange-950/20 rounded -mx-2 px-2" : ""}`}
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span>{expense.expenseName}</span>
                                        <Badge 
                                          variant={status.variant} 
                                          className={`text-xs ${isPartial ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : ""}`}
                                        >
                                          {status.label}
                                        </Badge>
                                        {isPartial && (
                                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                            (${status.remaining.toLocaleString()} owed)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="invisible group-hover:visible flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setEditingExpense(expense)}
                                            data-testid={`button-edit-expense-unassigned-${expense.id}`}
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            onClick={() => setDeletingExpenseId(expense.id)}
                                            data-testid={`button-delete-expense-unassigned-${expense.id}`}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <span className="font-mono text-muted-foreground">
                                          ${amount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {events.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-2">No events created yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create events in your timeline to track expenses by ceremony
                </p>
                <Button onClick={() => setLocation("/timeline")} variant="outline">
                  Go to Timeline
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <Card className="p-6" data-testid="card-upcoming-payments">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Payments
            </h2>
            <div className="space-y-3">
              {upcomingPayments.map((payment, idx) => {
                const isOverdue = payment.daysUntilDue < 0;
                const isUrgent = payment.daysUntilDue >= 0 && payment.daysUntilDue <= 7;
                return (
                  <div 
                    key={`${payment.contractId}-${idx}`}
                    className="flex items-center justify-between py-2"
                    data-testid={`payment-item-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isOverdue ? "bg-destructive" : isUrgent ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <div>
                        <p className="font-medium">
                          {payment.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {payment.vendorName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.milestoneName}
                          {payment.isCash && <Badge variant="outline" className="ml-2 text-xs">CASH</Badge>}
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono font-semibold ${isOverdue ? "text-destructive" : ""}`}>
                      ${payment.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Edit Total Budget Dialog */}
        <Dialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Total Budget</DialogTitle>
              <DialogDescription>
                Set your overall wedding budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="total-budget">Total Budget</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="total-budget"
                    type="number"
                    value={newTotalBudget}
                    onChange={(e) => setNewTotalBudget(e.target.value)}
                    className="pl-8"
                    placeholder="100000"
                    data-testid="input-total-budget"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditBudgetOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveBudget}
                  disabled={updateWeddingBudgetMutation.isPending}
                  data-testid="button-save-budget"
                >
                  {updateWeddingBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Budget Dialog */}
        <Dialog open={!!editingBucket} onOpenChange={(open) => !open && setEditingBucket(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set {editingBucket ? BUDGET_BUCKET_LABELS[editingBucket] : ""} Budget</DialogTitle>
              <DialogDescription>
                How much do you want to allocate to this category?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category-budget">Budget Amount</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="category-budget"
                    type="number"
                    value={editingBucketAmount}
                    onChange={(e) => setEditingBucketAmount(e.target.value)}
                    className="pl-8"
                    placeholder="10000"
                    data-testid="input-category-budget"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This sets how much you plan to spend on {editingBucket ? BUDGET_BUCKET_LABELS[editingBucket].toLowerCase() : "this category"} across all your ceremonies.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingBucket(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (editingBucket) {
                      updateCategoryBudgetMutation.mutate({ bucket: editingBucket, amount: editingBucketAmount });
                    }
                  }}
                  disabled={updateCategoryBudgetMutation.isPending}
                  data-testid="button-save-category-budget"
                >
                  {updateCategoryBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Add Expense Dialog */}
        {wedding?.id && (
          <AddExpenseDialog
            open={addExpenseDialogOpen}
            onOpenChange={setAddExpenseDialogOpen}
            weddingId={wedding.id}
            events={events}
            defaultEventId={addExpenseEventId}
            weddingTradition={wedding.tradition}
          />
        )}


        {/* Delete Expense Confirmation Dialog */}
        <Dialog open={!!deletingExpenseId} onOpenChange={(open) => !open && setDeletingExpenseId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDeletingExpenseId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletingExpenseId && deleteExpenseMutation.mutate(deletingExpenseId)}
                disabled={deleteExpenseMutation.isPending}
                data-testid="button-confirm-delete-expense"
              >
                {deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <EditExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          events={events}
          onSave={(data) => {
            if (editingExpense) {
              updateExpenseMutation.mutate({ id: editingExpense.id, data });
            }
          }}
          isPending={updateExpenseMutation.isPending}
        />
      </main>
    </div>
  );
}
