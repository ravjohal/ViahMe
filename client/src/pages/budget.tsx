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
import { type BudgetBucket, type Wedding, type Event, type Contract, type Vendor, type Expense, type BudgetAllocation, type CeremonyBudgetCategoryItem } from "@shared/schema";

// Local type definitions for ceremony budgets (not in shared schema)
interface CeremonyLineItemBudget {
  id: string;
  eventId: string;
  lineItemCategory: string;
  budgetedAmount: string;
}
import { CEREMONY_MAPPINGS } from "@shared/ceremonies";
import { useAllCeremonyLineItems, getLineItemBucketLabel, useCreateCustomCeremonyItem, useCloneLibraryItem, useDeleteCeremonyItem, useWeddingCeremonyLineItemsMap, type CeremonyBudgetCategoryApiItem, type LibraryItem } from "@/hooks/use-ceremony-types";
import { LibraryItemPicker } from "@/components/budget/library-item-picker";
import { useBudgetCategories, useBudgetCategoryLookup } from "@/hooks/use-budget-bucket-categories";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, AlertTriangle,
  ChevronDown, ChevronRight, ArrowLeft, Copy, Share2, FileText, 
  Calendar, Clock, Building2, Users, Calculator, Loader2, BarChart3, HelpCircle,
  TrendingDown, TrendingUp, Sparkles, X
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { EditExpenseDialog, type ExpenseWithDetails } from "@/components/edit-expense-dialog";
import { CeremonyPlanningCard } from "@/components/ceremony-planning-card";

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
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithAllocations | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [showCeremonyBudgets, setShowCeremonyBudgets] = useState(false);
  const [expandedCeremonies, setExpandedCeremonies] = useState<Set<string>>(new Set());
  const [editingLineItems, setEditingLineItems] = useState<Record<string, Record<string, string>>>({});
  
  // Custom ceremony item form state (keyed by eventId for which ceremony the form is open)
  const [customItemFormOpen, setCustomItemFormOpen] = useState<string | null>(null);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemBucket, setCustomItemBucket] = useState("");
  const [customItemAmount, setCustomItemAmount] = useState("");
  const [customItemSourceId, setCustomItemSourceId] = useState<string | null>(null); // Track if imported from library
  const [customItemSourceName, setCustomItemSourceName] = useState<string | null>(null); // Display name of source item
  
  // Library picker state (keyed by eventId for which ceremony the picker is open)
  const [libraryPickerOpen, setLibraryPickerOpen] = useState<{ eventId: string; eventName: string } | null>(null);

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

  // Fetch ceremony line items INCLUDING wedding-specific custom items
  // Uses wedding-aware endpoint that returns system templates + custom items
  const { data: ceremonyBreakdownMap = {} } = useWeddingCeremonyLineItemsMap(wedding?.id);

  // Fetch budget categories from database (replaces hardcoded BUDGET_BUCKETS constant)
  const { data: budgetCategories = [], isLoading: categoriesLoading } = useBudgetCategories();
  const { getCategoryLabel, allCategoryIds } = useBudgetCategoryLookup();

  // Get ceremony type ID from event name
  const getCeremonyTypeId = (eventName: string): string | null => {
    const normalizedName = eventName.toLowerCase().trim();
    
    for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
      if (keywords.some(kw => normalizedName === kw)) {
        if (ceremonyBreakdownMap[ceremonyId]) {
          return ceremonyId;
        }
      }
    }
    
    for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
      if (keywords.some(kw => normalizedName.includes(kw))) {
        if (ceremonyBreakdownMap[ceremonyId]) {
          return ceremonyId;
        }
      }
    }
    
    if (normalizedName.includes('reception') && ceremonyBreakdownMap['reception']) {
      return 'reception';
    }
    
    return null;
  };

  // Get line items for an event based on ceremony type
  const getLineItemsForEvent = (eventId: string, eventName: string): CeremonyBudgetCategoryItem[] | null => {
    const ceremonyTypeId = getCeremonyTypeId(eventName);
    if (!ceremonyTypeId) return null;
    return ceremonyBreakdownMap[ceremonyTypeId] || null;
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
      queryClient.invalidateQueries({ queryKey: [`/api/budget/ceremony-analytics/${wedding?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
      // Clear editing state for this event after successful save
      setEditingLineItems(prev => {
        const next = { ...prev };
        delete next[variables.eventId];
        return next;
      });
      // Also clear ceremony total editing state since line items determine the total
      setEditingCeremonyTotals(prev => {
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

  // Mutation for bulk allocating budget to matrix cells
  const bulkAllocateMutation = useMutation({
    mutationFn: async ({ weddingId, ceremonyId, allocations }: {
      weddingId: string;
      ceremonyId: string;
      allocations: Array<{ categoryKey: string; amount: string }>;
    }) => {
      return apiRequest("POST", "/api/budget/allocate-bulk", { weddingId, ceremonyId, allocations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", wedding?.id] });
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
  const getEventLineItemTotal = (eventId: string, lineItems: CeremonyBudgetCategoryItem[]): number => {
    let total = 0;
    for (const item of lineItems) {
      const amount = getExistingLineItemBudget(eventId, item.category);
      total += parseFloat(amount) || 0;
    }
    return total;
  };

  // Helper to format unit display
  const formatUnitLabel = (unit?: string): string => {
    if (!unit) return '';
    switch (unit) {
      case 'per_person': return '/person';
      case 'per_hour': return '/hour';
      case 'fixed': return 'fixed';
      default: return '';
    }
  };

  // Calculate line item estimate from database values (respecting unit types)
  const calculateLineItemEstimateFromDb = (item: CeremonyBudgetCategoryItem, guestCount: number, useHigh: boolean): number => {
    const baseValue = useHigh ? item.highCost : item.lowCost;
    
    if (item.unit === 'per_person') {
      return baseValue * guestCount;
    } else if (item.unit === 'per_hour') {
      // Use hoursHigh for high estimate, hoursLow for low estimate
      const hours = useHigh ? (item.hoursHigh || item.hoursLow || 1) : (item.hoursLow || 1);
      return baseValue * hours;
    }
    // Fixed cost - return as is
    return baseValue;
  };

  // Calculate total ceremony estimate from database values
  const getCeremonyEstimateTotal = (eventId: string, eventName: string, useHigh: boolean): number => {
    const lineItems = getLineItemsForEvent(eventId, eventName);
    if (!lineItems) return 0;

    const event = events.find(e => e.id === eventId);
    const guestCount = event?.guestCount || 100;

    let total = 0;
    for (const item of lineItems) {
      const rawValue = calculateLineItemEstimateFromDb(item, guestCount, useHigh);
      total += Math.round(rawValue / 100) * 100;
    }
    return total;
  };

  // Set all line item budgets to estimates (low or high) using database values
  // Also updates the ceremony total to match the sum of line items
  const setEstimatesForEvent = (eventId: string, eventName: string, useHigh: boolean) => {
    const lineItems = getLineItemsForEvent(eventId, eventName);
    if (!lineItems) return;

    // Find the event to get guest count
    const event = events.find(e => e.id === eventId);
    const guestCount = event?.guestCount || 100; // Default to 100 if not set

    const newValues: Record<string, string> = {};
    let total = 0;
    for (const item of lineItems) {
      const rawValue = calculateLineItemEstimateFromDb(item, guestCount, useHigh);
      // Round to nearest 100
      const value = Math.round(rawValue / 100) * 100;
      newValues[item.category] = value.toString();
      total += value;
    }

    // Update line items
    setEditingLineItems(prev => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        ...newValues,
      },
    }));

    // Also update ceremony total to match sum of line items
    handleCeremonyTotalChange(eventId, total.toString());
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
      guestCount: number;
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

  // Get bucket label (now from database)
  const getBucketLabel = (bucket: string | null | undefined) => {
    if (!bucket) return "Other";
    return getCategoryLabel(bucket);
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

    // Assign expenses to events
    allExpenses.forEach((expense) => {
      // Check for multi-event allocations (embedded in expense object from API)
      const allocations = (expense as any).eventAllocations || [];
      
      if (allocations.length > 0) {
        // Multi-event expense
        allocations.forEach((allocation: { eventId?: string; allocatedAmount?: string | number }) => {
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
  }, [events, allExpenses, wedding, costSummary]);

  // Calculate totals
  const total = parseFloat(wedding?.totalBudget || "0");
  const totalSpent = useMemo(() => {
    return Object.values(expensesByEvent).reduce((sum, e) => sum + e.total, 0);
  }, [expensesByEvent]);
  const remainingBudget = total - totalSpent;
  const spentPercentage = total > 0 ? (totalSpent / total) * 100 : 0;

  // Calculate ceremony-level total (from ceremony analytics)
  const totalByCeremonies = ceremonyAnalytics?.overview?.totalCeremonyAllocated || 0;

  // Calculate category-level total from bucket allocations (expenseTotals.bucketTotals)
  const totalByCategories = useMemo(() => {
    if (!expenseTotals?.bucketTotals) return 0;
    return expenseTotals.bucketTotals.reduce((sum, bucket) => sum + bucket.allocated, 0);
  }, [expenseTotals?.bucketTotals]);

  // For display, use ceremony totals as the primary "planned" amount
  const totalAllocated = totalByCeremonies;
  const unallocatedBudget = total - totalAllocated;

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
          summary += `  - ${exp.expenseName || 'Expense'}: $${amount.toLocaleString()}\n`;
        });
      }
    });

    // Include unassigned expenses
    const unassigned = expensesByEvent["unassigned"];
    if (unassigned && unassigned.total > 0) {
      summary += `\nGeneral/Unassigned: $${unassigned.total.toLocaleString()}\n`;
      unassigned.expenses.forEach((exp) => {
        const amount = exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0");
        summary += `  - ${exp.expenseName || 'Expense'}: $${amount.toLocaleString()}\n`;
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
                <span>${exp.expenseName || 'Expense'}</span>
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
              <span>${exp.expenseName || 'Expense'}</span>
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
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/ceremony-analytics/${wedding?.id}`] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/ceremony-analytics/${wedding?.id}`] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", wedding?.id] });
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

  // Custom ceremony budget item creation and deletion
  const createCustomItemMutation = useCreateCustomCeremonyItem();
  const cloneLibraryItemMutation = useCloneLibraryItem();
  const deleteCustomItemMutation = useDeleteCeremonyItem();
  
  // State for tracking which custom item is pending deletion (includes context for the mutation)
  const [deletingCustomItem, setDeletingCustomItem] = useState<{
    itemId: string;
    itemName: string;
    ceremonyTypeId: string;
  } | null>(null);
  
  const resetCustomItemForm = () => {
    setCustomItemFormOpen(null);
    setCustomItemName("");
    setCustomItemBucket("");
    setCustomItemAmount("");
    setCustomItemSourceId(null);
    setCustomItemSourceName(null);
  };
  
  // Handle selecting a library item to prefill the custom form
  const handleLibraryItemSelect = (item: LibraryItem) => {
    // Prefill the form with the library item's data
    setCustomItemName(item.itemName);
    setCustomItemBucket(item.budgetBucketId || "");
    // Don't set amount - leave it blank to inherit the source's low/high range
    // User can optionally enter a custom amount to override
    setCustomItemAmount("");
    setCustomItemSourceId(item.id);
    setCustomItemSourceName(item.itemName);
    setLibraryPickerOpen(null);
    toast({ 
      title: "Imported", 
      description: `${item.itemName} loaded with $${item.lowCost.toLocaleString()}-$${item.highCost.toLocaleString()} estimate` 
    });
  };
  
  const handleCreateCustomItem = (eventId: string, eventName: string) => {
    const ceremonyTypeId = getCeremonyTypeId(eventName);
    if (!wedding?.id || !ceremonyTypeId) {
      toast({ title: "Error", description: "Missing wedding or ceremony information", variant: "destructive" });
      return;
    }
    if (!customItemName.trim()) {
      toast({ title: "Error", description: "Please enter an item name", variant: "destructive" });
      return;
    }
    if (!customItemBucket) {
      toast({ title: "Error", description: "Please select a budget category", variant: "destructive" });
      return;
    }
    // Amount is required for custom items, but optional for library imports (will inherit source range)
    const isLibraryImport = !!customItemSourceId;
    const hasAmount = customItemAmount && !isNaN(parseFloat(customItemAmount));
    if (!isLibraryImport && !hasAmount) {
      toast({ title: "Error", description: "Please enter a budget amount", variant: "destructive" });
      return;
    }
    
    // Use the custom item mutation - it handles both new items and items imported from library
    // The backend will track sourceCategoryId if provided
    // Build mutation payload - only include amount if user provided one
    const mutationPayload: Parameters<typeof createCustomItemMutation.mutate>[0] = {
      weddingId: wedding.id,
      ceremonyTypeId,
      itemName: customItemName.trim(),
      budgetBucketId: customItemBucket,
      sourceCategoryId: customItemSourceId || undefined,
    };
    // Only include amount when user explicitly provided one (not empty string)
    if (hasAmount) {
      mutationPayload.amount = customItemAmount;
    }
    
    createCustomItemMutation.mutate(mutationPayload, {
      onSuccess: () => {
        const message = customItemSourceId ? "Budget item added from library" : "Custom budget item added";
        toast({ title: "Success", description: message });
        resetCustomItemForm();
        // Invalidate the wedding-aware line items map to refresh custom items
        queryClient.invalidateQueries({ queryKey: ['/api/ceremony-types/all/line-items', wedding.id] });
      },
      onError: (error: any) => {
        const message = error?.message || (error instanceof Error ? error.message : "Failed to add item");
        if (message.includes("already exists")) {
          toast({ title: "Already Added", description: "This item is already in your ceremony budget", variant: "destructive" });
        } else {
          toast({ title: "Error", description: message, variant: "destructive" });
        }
      },
    });
  };

  // Handle deleting a custom ceremony budget item
  const handleDeleteCustomItem = () => {
    if (!deletingCustomItem || !wedding?.id) return;
    
    deleteCustomItemMutation.mutate({
      weddingId: wedding.id,
      ceremonyTypeId: deletingCustomItem.ceremonyTypeId,
      itemId: deletingCustomItem.itemId,
    }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: `${deletingCustomItem.itemName} removed from budget` });
        setDeletingCustomItem(null);
        // Invalidate the wedding-aware line items map to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/ceremony-types/all/line-items', wedding.id] });
      },
      onError: (error: any) => {
        const message = error?.message || (error instanceof Error ? error.message : "Failed to delete item");
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  };

  // Combined save function for ceremony total AND line items
  const saveCeremonyBudget = async (eventId: string, eventName: string) => {
    // Capture payloads synchronously before any async operations
    const totalAmount = editingCeremonyTotals[eventId];
    const eventLineItems = editingLineItems[eventId];
    const hasLineItems = eventLineItems && Object.keys(eventLineItems).length > 0;
    
    // Build line items payload synchronously
    let lineItemsPayload: Array<{ lineItemCategory: string; budgetedAmount: string }> | null = null;
    let ceremonyTypeId: string | null = null;
    if (hasLineItems && wedding?.id) {
      ceremonyTypeId = getCeremonyTypeId(eventName);
      if (ceremonyTypeId) {
        lineItemsPayload = Object.entries(eventLineItems)
          .map(([category, value]) => ({
            lineItemCategory: category,
            budgetedAmount: value || "0",
          }));
      }
    }
    
    // If line items are being saved, DON'T also save a separate ceremony total
    // The ceremony total will be derived from line items by the analytics endpoint
    // This prevents double-counting (ceremony total + line items sum)
    if (lineItemsPayload && lineItemsPayload.length > 0 && wedding?.id && ceremonyTypeId) {
      // Only save line items - the total is derived from them
      saveLineItemBudgetsMutation.mutate({
        weddingId: wedding.id,
        eventId,
        ceremonyTypeId,
        items: lineItemsPayload,
      });
    } else if (totalAmount !== undefined) {
      // Only save ceremony total if no line items are being saved
      // (e.g., user manually edited the total without using line items)
      updateCeremonyBudgetMutation.mutate({ ceremonyId: eventId, amount: totalAmount });
    }
  };

  // Check if ceremony has ANY unsaved changes (total or line items)
  const hasCeremonyBudgetChanges = (eventId: string, currentAllocated: number): boolean => {
    const hasTotalChanges = hasCeremonyTotalChanges(eventId, currentAllocated);
    const hasLineItemChanges = !!editingLineItems[eventId] && Object.keys(editingLineItems[eventId]).length > 0;
    return hasTotalChanges || hasLineItemChanges;
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
              size="sm"
              onClick={() => {
                setAddExpenseEventId(undefined);
                setAddExpenseDialogOpen(true);
              }}
              data-testid="button-add-expense-header"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
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
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Target Budget</p>
                <button 
                  onClick={() => setEditBudgetOpen(true)}
                  className="text-3xl font-bold font-mono hover:text-primary transition-colors"
                  data-testid="button-edit-total-budget"
                >
                  ${total.toLocaleString()}
                </button>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  By Ceremonies
                </p>
                <p className="text-2xl font-bold font-mono" data-testid="text-ceremonies-total">
                  ${totalByCeremonies.toLocaleString()}
                </p>
              </div>
              {totalByCategories > 0 && (
                <>
                  <div className="h-12 w-px bg-border hidden sm:block" />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      By Categories
                    </p>
                    <p className="text-2xl font-bold font-mono" data-testid="text-categories-total">
                      ${totalByCategories.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-spent">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {unallocatedBudget > 0 && (
                <Badge variant="outline" className="px-3 py-1.5 text-base font-mono bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300" data-testid="badge-unallocated">
                  ${unallocatedBudget.toLocaleString()} left to plan
                </Badge>
              )}
              {unallocatedBudget < 0 && (
                <Badge variant="destructive" className="px-3 py-1.5 text-base font-mono" data-testid="badge-over-allocated">
                  ${Math.abs(unallocatedBudget).toLocaleString()} over target
                </Badge>
              )}
              {totalByCategories > 0 && totalByCeremonies > 0 && Math.abs(totalByCategories - totalByCeremonies) > 100 && (
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-mono bg-orange-50 dark:bg-orange-900/20 border-orange-300 text-orange-700 dark:text-orange-300" data-testid="badge-allocation-mismatch">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {totalByCategories > totalByCeremonies 
                    ? `Categories $${(totalByCategories - totalByCeremonies).toLocaleString()} higher`
                    : `Ceremonies $${(totalByCeremonies - totalByCategories).toLocaleString()} higher`
                  }
                </Badge>
              )}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold font-mono ${remainingBudget < 0 ? "text-destructive" : "text-emerald-600"}`} data-testid="text-remaining">
                  {remainingBudget < 0 ? "-" : ""}${Math.abs(remainingBudget).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Progress value={Math.min(spentPercentage, 100)} className="h-3" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              {spentPercentage.toFixed(0)}% of budget spent
            </p>
            {totalByCeremonies > 0 && (
              <p className="text-sm text-muted-foreground">
                {((totalSpent / totalByCeremonies) * 100).toFixed(0)}% of ceremony budgets spent
              </p>
            )}
          </div>
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
                      {budgetCategories.length} categories • Track spending by type
                    </p>
                  </div>
                </div>
                <div className="text-right mr-2">
                  <p className="font-semibold text-lg">
                    ${(expenseTotals?.bucketTotals || []).reduce((sum, b) => sum + b.allocated, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total allocated</p>
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

        {/* Ceremony Planning Cards - Main Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Your Ceremonies</h2>
                <p className="text-sm text-muted-foreground">
                  Plan your budget ceremony by ceremony
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {sideFilter !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Showing: {sideFilter === 'bride' ? (wedding?.partner1Name || 'Bride') : sideFilter === 'groom' ? (wedding?.partner2Name || 'Groom') : 'Shared'}
                </Badge>
              )}
              <div className="text-right">
                <p className="font-semibold text-lg">
                  ${(ceremonyAnalytics?.overview?.totalCeremonyAllocated || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total ceremony budget</p>
              </div>
            </div>
          </div>
          {/* Ceremony Planning Cards */}
          <div className="space-y-4">
            {(ceremonyAnalytics?.ceremonyBreakdown || [])
              .filter(ceremony => sideFilter === 'all' || ceremony.side === sideFilter)
              .sort((a, b) => {
                if (!a.eventDate && !b.eventDate) return 0;
                if (!a.eventDate) return 1;
                if (!b.eventDate) return -1;
                return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
              })
              .map((ceremony) => {
                const percentSpent = ceremony.allocated > 0 ? ceremony.percentUsed : 0;
                const lineItems = getLineItemsForEvent(ceremony.eventId, ceremony.eventName);
                const isExpanded = expandedCeremonies.has(ceremony.eventId);
                const lineItemTotal = lineItems ? getEventLineItemTotal(ceremony.eventId, lineItems) : 0;
                const eventExpenses = expensesByEvent[ceremony.eventId]?.expenses || [];

                const sideColors = {
                  bride: 'border-l-pink-500',
                  groom: 'border-l-blue-500',
                  mutual: 'border-l-amber-500',
                };
                const sideBadgeColors = {
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
                  <Card 
                    key={ceremony.eventId}
                    className={`border-l-4 ${sideColors[ceremony.side]} overflow-hidden ${ceremony.isOverBudget ? 'border-destructive/50' : ''}`}
                    data-testid={`ceremony-card-${ceremony.eventId}`}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCeremonyExpansion(ceremony.eventId)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 text-left hover-elevate" data-testid={`toggle-ceremony-${ceremony.eventId}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-base">{ceremony.eventName}</h3>
                                <Badge variant="outline" className={`text-xs ${sideBadgeColors[ceremony.side]}`}>
                                  {sideLabels[ceremony.side]}
                                </Badge>
                                {ceremony.isOverBudget && (
                                  <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                                {ceremony.eventDate && (
                                  <>
                                    <Calendar className="w-3 h-3" />
                                    {new Date(ceremony.eventDate).toLocaleDateString()}
                                  </>
                                )}
                                {ceremony.guestCount > 0 && (
                                  <>
                                    {ceremony.eventDate && <span>•</span>}
                                    <Users className="w-3 h-3" />
                                    {ceremony.guestCount} guests
                                  </>
                                )}
                                {ceremony.expenseCount > 0 && (
                                  <span>• {ceremony.expenseCount} expense{ceremony.expenseCount > 1 ? 's' : ''}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-lg font-bold font-mono">
                                  ${ceremony.allocated.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${ceremony.spent.toLocaleString()} spent
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {ceremony.allocated > 0 && (
                            <div className="mt-3">
                              <Progress 
                                value={Math.min(percentSpent, 100)} 
                                className={`h-2 ${ceremony.isOverBudget ? '[&>div]:bg-destructive' : ''}`} 
                              />
                              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                <span>{percentSpent.toFixed(0)}% spent</span>
                                <span className={ceremony.remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                                  ${Math.abs(ceremony.remaining).toLocaleString()} {ceremony.remaining < 0 ? 'over' : 'left'}
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-4">
                          {/* Budget Controls */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">Ceremony Budget</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="w-28 h-9 text-right"
                                value={getCeremonyTotalValue(ceremony.eventId, ceremony.allocated)}
                                onChange={(e) => handleCeremonyTotalChange(ceremony.eventId, e.target.value)}
                                data-testid={`input-ceremony-total-${ceremony.eventId}`}
                              />
                              {hasCeremonyBudgetChanges(ceremony.eventId, ceremony.allocated) && (
                                <Button
                                  size="sm"
                                  className="h-9"
                                  onClick={() => saveCeremonyBudget(ceremony.eventId, ceremony.eventName)}
                                  disabled={updateCeremonyBudgetMutation.isPending || saveLineItemBudgetsMutation.isPending}
                                  data-testid={`button-save-ceremony-budget-${ceremony.eventId}`}
                                >
                                  {(updateCeremonyBudgetMutation.isPending || saveLineItemBudgetsMutation.isPending) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Line Items */}
                          {lineItems && lineItems.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-muted-foreground">Line Items</p>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setEstimatesForEvent(ceremony.eventId, ceremony.eventName, false)} className="h-7 text-xs">
                                    <TrendingDown className="w-3 h-3 mr-1" />Low
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEstimatesForEvent(ceremony.eventId, ceremony.eventName, true)} className="h-7 text-xs">
                                    <TrendingUp className="w-3 h-3 mr-1" />High
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2 bg-background rounded-lg p-3 border">
                                {lineItems.map((item, idx) => {
                                  const savedAmount = getExistingLineItemBudget(ceremony.eventId, item.category);
                                  const bucketLabel = getLineItemBucketLabel(item);
                                  return (
                                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`line-item-${ceremony.eventId}-${idx}`}>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium">{item.category}</p>
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">{bucketLabel}</Badge>
                                          {item.isCustom && (
                                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Custom</Badge>
                                          )}
                                          {!item.isCustom && item.unit && item.unit !== 'fixed' && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{formatUnitLabel(item.unit)}</Badge>
                                          )}
                                        </div>
                                        {item.lowCost === item.highCost ? (
                                          <p className="text-xs text-muted-foreground">Budget: ${item.lowCost.toLocaleString()}</p>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">Est: ${item.lowCost.toLocaleString()}{formatUnitLabel(item.unit) ? ` ${formatUnitLabel(item.unit)}` : ''} - ${item.highCost.toLocaleString()}{formatUnitLabel(item.unit) ? ` ${formatUnitLabel(item.unit)}` : ''}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-sm text-muted-foreground">$</span>
                                        <Input type="number" placeholder="0" className="w-24 h-8 text-right" value={savedAmount} onChange={(e) => handleLineItemChange(ceremony.eventId, item.category, e.target.value)} data-testid={`input-line-item-${ceremony.eventId}-${idx}`} />
                                        {item.isCustom && item.id && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                              const ceremonyTypeId = getCeremonyTypeId(ceremony.eventName);
                                              if (ceremonyTypeId) {
                                                setDeletingCustomItem({
                                                  itemId: item.id!,
                                                  itemName: item.category,
                                                  ceremonyTypeId,
                                                });
                                              }
                                            }}
                                            data-testid={`button-delete-custom-item-${ceremony.eventId}-${idx}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                <div>
                                  {lineItemTotal > 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Line Item Total</span>
                                      <span className="text-lg font-bold font-mono">${lineItemTotal.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                                {editingLineItems[ceremony.eventId] && Object.keys(editingLineItems[ceremony.eventId]).length > 0 && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => saveEventLineItems(ceremony.eventId, ceremony.eventName)} 
                                    disabled={saveLineItemBudgetsMutation.isPending} 
                                    data-testid={`button-save-line-items-${ceremony.eventId}`}
                                  >
                                    {saveLineItemBudgetsMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    Save Line Items
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Add Budget Item */}
                          {getCeremonyTypeId(ceremony.eventName) && budgetCategories.length > 0 && (
                            <div className="mb-4">
                              {customItemFormOpen !== ceremony.eventId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCustomItemFormOpen(ceremony.eventId)}
                                  className="w-full"
                                  data-testid={`button-add-budget-item-${ceremony.eventId}`}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Budget Item
                                </Button>
                              ) : (
                                <div className="bg-background rounded-lg p-4 border space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                      <Plus className="w-4 h-4 text-primary" />
                                      Add Budget Item
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={resetCustomItemForm}
                                      className="h-7 w-7"
                                      data-testid={`button-cancel-custom-item-${ceremony.eventId}`}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Import from Library button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLibraryPickerOpen({ eventId: ceremony.eventId, eventName: ceremony.eventName })}
                                    className="w-full"
                                    data-testid={`button-import-from-library-${ceremony.eventId}`}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Import from Library
                                  </Button>
                                  
                                  {/* Show imported item indicator */}
                                  {customItemSourceName && (
                                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md border border-primary/20">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">Imported</Badge>
                                        <span className="text-sm">{customItemSourceName}</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          setCustomItemSourceId(null);
                                          setCustomItemSourceName(null);
                                        }}
                                        data-testid={`button-clear-import-${ceremony.eventId}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor={`custom-item-name-${ceremony.eventId}`} className="text-xs">
                                        Item Name <span className="text-destructive">*</span>
                                      </Label>
                                      <Input
                                        id={`custom-item-name-${ceremony.eventId}`}
                                        placeholder="e.g., Henna Artist"
                                        value={customItemName}
                                        onChange={(e) => setCustomItemName(e.target.value)}
                                        data-testid={`input-custom-item-name-${ceremony.eventId}`}
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor={`custom-item-bucket-${ceremony.eventId}`} className="text-xs">
                                        Budget Category <span className="text-destructive">*</span>
                                      </Label>
                                      <Select value={customItemBucket} onValueChange={setCustomItemBucket}>
                                        <SelectTrigger 
                                          id={`custom-item-bucket-${ceremony.eventId}`}
                                          data-testid={`select-custom-item-bucket-${ceremony.eventId}`}
                                        >
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {budgetCategories.map((bucket) => (
                                            <SelectItem key={bucket.id} value={bucket.id}>
                                              {bucket.displayName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor={`custom-item-amount-${ceremony.eventId}`} className="text-xs">
                                        Budget Amount ($)
                                      </Label>
                                      <Input
                                        id={`custom-item-amount-${ceremony.eventId}`}
                                        type="number"
                                        placeholder="0"
                                        value={customItemAmount}
                                        onChange={(e) => setCustomItemAmount(e.target.value)}
                                        data-testid={`input-custom-item-amount-${ceremony.eventId}`}
                                      />
                                    </div>
                                  </div>
                                  
                                  <Button
                                    onClick={() => handleCreateCustomItem(ceremony.eventId, ceremony.eventName)}
                                    disabled={createCustomItemMutation.isPending}
                                    className="w-full"
                                    data-testid={`button-save-custom-item-${ceremony.eventId}`}
                                  >
                                    {createCustomItemMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    {customItemSourceId ? "Add from Library" : "Add Item"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expenses for this ceremony */}
                          {eventExpenses.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Expenses</p>
                              <div className="space-y-1 bg-background rounded-lg p-3 border">
                                {eventExpenses.map((expense, idx) => {
                                  const amount = parseFloat(expense.amount?.toString() || "0");
                                  const status = getPaymentStatus(expense);
                                  return (
                                    <div key={expense.id || idx} className="group flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`expense-item-${expense.id}`}>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm">{expense.expenseName}</span>
                                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="invisible group-hover:visible flex items-center gap-1">
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingExpense(expense)} data-testid={`button-edit-expense-${expense.id}`}>
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeletingExpenseId(expense.id)} data-testid={`button-delete-expense-${expense.id}`}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <span className="font-mono text-sm">${amount.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Add Expense Button */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="text-sm text-muted-foreground">
                              {ceremony.expenseCount} expense{ceremony.expenseCount !== 1 ? 's' : ''} recorded
                            </div>
                            <Button size="sm" onClick={() => { setAddExpenseEventId(ceremony.eventId); setAddExpenseDialogOpen(true); }} data-testid={`button-add-expense-${ceremony.eventId}`}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add Expense
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}

            {(!ceremonyAnalytics?.ceremonyBreakdown || ceremonyAnalytics.ceremonyBreakdown.length === 0) && (
              <Card className="p-8 text-center border-dashed">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-2">No ceremonies yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add events to your timeline to start planning budgets
                </p>
                <Button onClick={() => setLocation("/timeline")} variant="outline">
                  Go to Timeline
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Unassigned Expenses Card */}
        {expensesByEvent["unassigned"]?.expenses.length > 0 && (
          <Card className="border-l-4 border-l-gray-400 overflow-hidden mb-6" data-testid="card-unassigned-expenses">
            <Collapsible open={expandedEvents.has("unassigned")} onOpenChange={() => toggleEvent("unassigned")}>
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 text-left hover-elevate">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base text-muted-foreground">General / Unassigned</h3>
                        <Badge variant="outline" className="text-xs">
                          {expensesByEvent["unassigned"].expenses.length} items
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Expenses not linked to a specific ceremony</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-bold font-mono">${expensesByEvent["unassigned"].total.toLocaleString()}</span>
                      {expandedEvents.has("unassigned") ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t bg-muted/30 p-4">
                  <div className="space-y-1 bg-background rounded-lg p-3 border">
                    {expensesByEvent["unassigned"].expenses.map((expense, idx) => {
                      const amount = parseFloat(expense.amount?.toString() || "0");
                      const status = getPaymentStatus(expense);
                      return (
                        <div key={expense.id || idx} className="group flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{expense.expenseName}</span>
                            <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                            {expense.parentCategory && <Badge variant="outline" className="text-xs">{getBucketLabel(expense.parentCategory)}</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="invisible group-hover:visible flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingExpense(expense)}><Edit2 className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeletingExpenseId(expense.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                            <span className="font-mono text-sm">${amount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setAddExpenseEventId(undefined); setAddExpenseDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add General Expense
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

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
              <DialogTitle>Set {editingBucket ? getCategoryLabel(editingBucket) : ""} Budget</DialogTitle>
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
                This sets how much you plan to spend on {editingBucket ? getCategoryLabel(editingBucket).toLowerCase() : "this category"} across all your ceremonies.
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

        {/* Delete Custom Budget Item Confirmation Dialog */}
        <Dialog open={!!deletingCustomItem} onOpenChange={(open) => !open && setDeletingCustomItem(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove Budget Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove "{deletingCustomItem?.itemName}" from your ceremony budget? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDeletingCustomItem(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCustomItem}
                disabled={deleteCustomItemMutation.isPending}
                data-testid="button-confirm-delete-custom-item"
              >
                {deleteCustomItemMutation.isPending ? "Removing..." : "Remove"}
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

        {/* Library Item Picker Dialog */}
        <LibraryItemPicker
          open={!!libraryPickerOpen}
          onOpenChange={(open) => !open && setLibraryPickerOpen(null)}
          ceremonyName={libraryPickerOpen?.eventName || ""}
          onSelect={handleLibraryItemSelect}
        />
      </main>
    </div>
  );
}
