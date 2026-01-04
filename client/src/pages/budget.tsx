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
import { insertBudgetCategorySchema, type Wedding, type BudgetCategory, type Event, type Contract, type Vendor, type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronRight, ArrowLeft, Copy, Share2, FileText, 
  Calendar, Clock, Building2, Users, Calculator, Sparkles, Loader2, BarChart3
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MultiCeremonySavingsCalculator } from "@/components/multi-ceremony-savings-calculator";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { EditExpenseDialog, type ExpenseWithDetails } from "@/components/edit-expense-dialog";
import { BudgetEstimator } from "@/components/budget-estimator";

// Use shared expense type from the edit dialog component
type ExpenseWithAllocations = ExpenseWithDetails;

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
  const [showCategories, setShowCategories] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithAllocations | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

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

  const createCategoryMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return await apiRequest("POST", "/api/budget-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      form.reset();
      setUseCustomCategory(false);
      setCustomCategoryInput("");
      toast({ title: "Category created", description: "Budget category has been added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<BudgetFormData> }) => {
      return await apiRequest("PATCH", `/api/budget-categories/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({ title: "Category updated", description: "Budget category has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/budget-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      toast({ title: "Category deleted", description: "Budget category has been removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setEditingExpense(null);
      toast({ title: "Expense updated", description: "The expense has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
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

  const handleOpenCategoryDialog = (category?: BudgetCategory) => {
    if (category) {
      setEditingCategory(category);
      form.setValue("category", category.category);
      form.setValue("allocatedAmount", category.allocatedAmount?.toString() || "0");
      form.setValue("spentAmount", category.spentAmount?.toString() || "0");
      form.setValue("weddingId", wedding?.id || "");
      if (!Object.keys(CATEGORY_LABELS).includes(category.category)) {
        setUseCustomCategory(true);
        setCustomCategoryInput(category.category);
      }
    } else {
      setEditingCategory(null);
      form.reset({
        category: "catering",
        allocatedAmount: "0",
        spentAmount: "0",
        weddingId: wedding?.id || "",
      });
      setUseCustomCategory(false);
      setCustomCategoryInput("");
    }
    setDialogOpen(true);
  };

  const handleCategorySubmit = (data: BudgetFormData) => {
    const finalCategory = useCustomCategory && customCategoryInput ? customCategoryInput : data.category;
    const submitData = { ...data, category: finalCategory };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, updates: submitData });
    } else {
      createCategoryMutation.mutate(submitData);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this budget category?")) {
      deleteCategoryMutation.mutate(id);
    }
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
          <div className="flex items-center gap-2 flex-wrap">
            <BudgetEstimator 
              wedding={wedding} 
              events={events}
              onUpdateBudget={(budget) => {
                setNewTotalBudget(budget.toString());
                updateWeddingBudgetMutation.mutate(budget.toString());
              }}
              onUpdateEventBudget={(eventId, budget) => {
                updateEventBudgetMutation.mutate({ eventId, budget });
              }}
            />
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

        {/* Side-Based Spending Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-pink-500" data-testid="card-bride-spending">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-pink-600" />
              </div>
              <span className="font-medium text-pink-700 dark:text-pink-300">
                {wedding?.partner1Name || "Bride"}'s Side
              </span>
            </div>
            <p className="text-2xl font-bold font-mono">${spentBySide.bride.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {eventCountsBySide.bride} events
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500" data-testid="card-mutual-spending">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-amber-700 dark:text-amber-300">Shared Expenses</span>
            </div>
            <p className="text-2xl font-bold font-mono">${spentBySide.mutual.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {eventCountsBySide.mutual} events
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500" data-testid="card-groom-spending">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {wedding?.partner2Name || "Groom"}'s Side
              </span>
            </div>
            <p className="text-2xl font-bold font-mono">${spentBySide.groom.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {eventCountsBySide.groom} events
            </p>
          </Card>
        </div>

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

        {/* Budget Categories Management */}
        <Card className="p-4 mb-6">
          <Collapsible open={showCategories} onOpenChange={setShowCategories}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full" data-testid="toggle-categories">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Manage Budget Categories</h3>
                    <p className="text-sm text-muted-foreground">
                      {categories.length} categories configured
                    </p>
                  </div>
                </div>
                {showCategories ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-3">
                {categories.map((cat) => {
                  const allocated = Number(cat.allocatedAmount) || 0;
                  const spent = Number(cat.spentAmount) || 0;
                  const remaining = allocated - spent;
                  const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
                  const categoryLabel = CATEGORY_LABELS[cat.category] || cat.category;

                  return (
                    <div 
                      key={cat.id} 
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`category-${cat.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{categoryLabel}</p>
                          <p className="text-sm text-muted-foreground">
                            ${spent.toLocaleString()} of ${allocated.toLocaleString()} spent
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenCategoryDialog(cat)}
                            data-testid={`button-edit-category-${cat.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(cat.id)}
                            data-testid={`button-delete-category-${cat.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={Math.min(percentSpent, 100)} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{percentSpent.toFixed(0)}% spent</span>
                        <span className={remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                          ${remaining.toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  );
                })}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOpenCategoryDialog()}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget Category
                </Button>
              </div>
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
                                      const isPartial = status.remaining > 0;
                                      return (
                                        <div 
                                          key={expense.id || idx}
                                          className={`group flex items-center justify-between py-1 text-sm pl-4 ${isPartial ? "bg-orange-50/50 dark:bg-orange-950/20 rounded -mx-2 px-2" : ""}`}
                                          data-testid={`expense-item-${expense.id}`}
                                        >
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span>{expense.description}</span>
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
                                  const isPartial = status.remaining > 0;
                                  return (
                                    <div 
                                      key={expense.id || idx}
                                      className={`group flex items-center justify-between py-1 text-sm pl-4 ${isPartial ? "bg-orange-50/50 dark:bg-orange-950/20 rounded -mx-2 px-2" : ""}`}
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span>{expense.description}</span>
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

        {/* Add/Edit Budget Category Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setUseCustomCategory(false);
            setCustomCategoryInput("");
            form.reset();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Budget Category" : "Add Budget Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Update the allocated budget for this category" 
                  : "Create a new budget category to track your spending"
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCategorySubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      {!useCustomCategory ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!!editingCategory}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input
                            placeholder="Enter custom category name"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            data-testid="input-custom-category"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingCategory && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-category"
                      checked={useCustomCategory}
                      onCheckedChange={(checked) => setUseCustomCategory(checked === true)}
                      data-testid="checkbox-custom-category"
                    />
                    <label
                      htmlFor="custom-category"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Use custom category name
                    </label>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="allocatedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocated Budget</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="10000"
                            className="pl-8"
                            {...field}
                            data-testid="input-allocated-amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {aiEstimate?.hasEstimate && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                    <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                      <Sparkles className="w-4 h-4" />
                      AI Budget Estimate
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-300">
                      ${aiEstimate.lowEstimate.toLocaleString()} - ${aiEstimate.highEstimate.toLocaleString()}
                    </p>
                    {aiEstimate.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{aiEstimate.notes}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) 
                      ? "Saving..." 
                      : editingCategory ? "Update Category" : "Add Category"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
          categories={categories}
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
