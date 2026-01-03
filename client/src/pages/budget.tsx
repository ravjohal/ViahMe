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
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetCategorySchema, type Wedding, type BudgetCategory, type Event, type Contract, type Vendor, type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronRight, ArrowLeft, Copy, Share2, FileText, 
  Calendar, Clock, Building2, Users, Calculator, Sparkles, Loader2
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MultiCeremonySavingsCalculator } from "@/components/multi-ceremony-savings-calculator";
import { AddExpenseDialog } from "@/components/add-expense-dialog";

// Extended expense type that includes event allocations from API
interface ExpenseWithAllocations extends Expense {
  eventAllocations?: Array<{
    id: string;
    expenseId: string;
    eventId: string;
    allocatedAmount: string | number;
    allocatedPercent?: string | number | null;
  }>;
}

const budgetFormSchema = insertBudgetCategorySchema.extend({
  allocatedAmount: z.string().transform((val) => val),
  spentAmount: z.string().optional().transform((val) => val || "0"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  catering: "Catering & Food",
  venue: "Venue & Rentals",
  entertainment: "Entertainment",
  photography: "Photography & Video",
  decoration: "Decoration & Flowers",
  attire: "Attire & Beauty",
  transportation: "Transportation",
  other: "Other Expenses",
};

interface AIBudgetEstimate {
  lowEstimate: number;
  highEstimate: number;
  averageEstimate: number;
  notes: string;
  hasEstimate: boolean;
}

type ContributorFilter = "all" | "bride" | "groom";

export default function Budget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<AIBudgetEstimate | null>(null);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addExpenseEventId, setAddExpenseEventId] = useState<string | undefined>(undefined);
  const [aiEstimateLoading, setAiEstimateLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [contributorFilter, setContributorFilter] = useState<ContributorFilter>("all");
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [showSavingsCalculator, setShowSavingsCalculator] = useState(false);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
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

  // Get vendor name by ID
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || "Vendor";
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "Other";
    const category = categories.find(c => c.id === categoryId);
    return category?.category || CATEGORY_LABELS[categoryId] || categoryId;
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
      } else if (expense.eventId) {
        // Single event expense
        const eventId = expense.eventId;
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

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "catering",
      allocatedAmount: "0",
      spentAmount: "0",
      weddingId: wedding?.id || "",
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

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
      if (wedding.totalBudget) {
        setNewTotalBudget(wedding.totalBudget.toString());
      }
    }
  }, [wedding?.id, wedding?.totalBudget, form]);

  const handleSaveBudget = () => {
    if (!newTotalBudget || parseFloat(newTotalBudget) <= 0) {
      toast({ title: "Please enter a budget", variant: "destructive" });
      return;
    }
    updateWeddingBudgetMutation.mutate(newTotalBudget);
  };

  // Get expense payment status
  const getPaymentStatus = (expense: Expense): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    // This would ideally come from linked contracts or a status field
    // For now, derive from notes or a status field if available
    const notes = expense.notes?.toLowerCase() || "";
    if (notes.includes("paid")) return { label: "PAID", variant: "default" };
    if (notes.includes("deposit")) return { label: "DEPOSIT REQ", variant: "outline" };
    return { label: "PENDING", variant: "secondary" };
  };

  if (weddingsLoading || categoriesLoading) {
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

        {/* Guest Savings Calculator Toggle */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <Collapsible open={showSavingsCalculator} onOpenChange={setShowSavingsCalculator}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full" data-testid="toggle-savings-calculator">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Guest Savings Calculator</h3>
                    <p className="text-sm text-muted-foreground">See how trimming guest counts can save money</p>
                  </div>
                </div>
                {showSavingsCalculator ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <MultiCeremonySavingsCalculator events={events} />
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Breakdown by Event */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Breakdown by Event
          </h2>

          <div className="space-y-3">
            {events.map((event) => {
              const eventData = expensesByEvent[event.id];
              const isExpanded = expandedEvents.has(event.id);
              const eventTotal = eventData?.total || 0;

              return (
                <Collapsible 
                  key={event.id} 
                  open={isExpanded} 
                  onOpenChange={() => toggleEvent(event.id)}
                >
                  <Card className="overflow-hidden" data-testid={`card-event-${event.id}`}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover-elevate">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">{event.name}</span>
                          {eventData?.expenses.length ? (
                            <Badge variant="secondary" className="text-xs">
                              {eventData.expenses.length} items
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
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
                            {/* Group expenses by category */}
                            {(() => {
                              const byCategory: Record<string, typeof eventData.expenses> = {};
                              eventData.expenses.forEach((exp) => {
                                const cat = exp.categoryId || "Other";
                                if (!byCategory[cat]) byCategory[cat] = [];
                                byCategory[cat].push(exp);
                              });
                              return Object.entries(byCategory).map(([categoryId, catExpenses]) => {
                                const categoryTotal = catExpenses.reduce((sum, exp) => {
                                  return sum + (exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0"));
                                }, 0);
                                return (
                                  <div key={categoryId} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b pb-1">
                                      <span>{getCategoryName(categoryId)}</span>
                                      <span className="font-mono">${categoryTotal.toLocaleString()}</span>
                                    </div>
                                    {catExpenses.map((expense, idx) => {
                                      const amount = expense.allocatedAmount || parseFloat(expense.amount?.toString() || "0");
                                      const status = getPaymentStatus(expense);
                                      return (
                                        <div 
                                          key={expense.id || idx}
                                          className="flex items-center justify-between py-1 text-sm pl-4"
                                          data-testid={`expense-item-${expense.id}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{expense.description}</span>
                                            <Badge variant={status.variant} className="text-xs">
                                              {status.label}
                                            </Badge>
                                          </div>
                                          <span className="font-mono text-muted-foreground">
                                            ${amount.toLocaleString()}
                                          </span>
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
                        {/* Group unassigned expenses by category */}
                        {(() => {
                          const unassignedExpenses = expensesByEvent["unassigned"].expenses;
                          const byCategory: Record<string, typeof unassignedExpenses> = {};
                          unassignedExpenses.forEach((exp) => {
                            const cat = exp.categoryId || "Other";
                            if (!byCategory[cat]) byCategory[cat] = [];
                            byCategory[cat].push(exp);
                          });
                          return Object.entries(byCategory).map(([categoryId, catExpenses]) => {
                            const categoryTotal = catExpenses.reduce((sum, exp) => {
                              return sum + (exp.allocatedAmount || parseFloat(exp.amount?.toString() || "0"));
                            }, 0);
                            return (
                              <div key={categoryId} className="space-y-1">
                                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b pb-1">
                                  <span>{getCategoryName(categoryId)}</span>
                                  <span className="font-mono">${categoryTotal.toLocaleString()}</span>
                                </div>
                                {catExpenses.map((expense, idx) => {
                                  const amount = expense.allocatedAmount || parseFloat(expense.amount?.toString() || "0");
                                  const status = getPaymentStatus(expense);
                                  return (
                                    <div 
                                      key={expense.id || idx}
                                      className="flex items-center justify-between py-1 text-sm pl-4"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{expense.description}</span>
                                        <Badge variant={status.variant} className="text-xs">
                                          {status.label}
                                        </Badge>
                                      </div>
                                      <span className="font-mono text-muted-foreground">
                                        ${amount.toLocaleString()}
                                      </span>
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

        {/* Add Expense Dialog */}
        {wedding?.id && (
          <AddExpenseDialog
            open={addExpenseDialogOpen}
            onOpenChange={setAddExpenseDialogOpen}
            weddingId={wedding.id}
            events={events}
            defaultEventId={addExpenseEventId}
          />
        )}
      </main>
    </div>
  );
}
