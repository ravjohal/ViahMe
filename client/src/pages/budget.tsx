import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetCategorySchema, type Wedding, type BudgetCategory, type Event } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, TrendingUp, HelpCircle, PiggyBank, FolderPlus, PieChart, BarChart3, Check, X, Users, Calculator, Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MultiCeremonySavingsCalculator } from "@/components/multi-ceremony-savings-calculator";

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

const BUDGET_TO_VENDOR_CATEGORIES: Record<string, string[]> = {
  catering: ['caterer', 'halal_caterer', 'mobile_food'],
  venue: ['banquet_hall', 'gurdwara', 'temple', 'tent_service'],
  entertainment: ['dj', 'dhol_player', 'baraat_band', 'garba_instructor', 'dandiya_equipment', 'nadaswaram_player'],
  photography: ['photographer', 'videographer'],
  decoration: ['decorator', 'florist', 'mandap_decorator', 'nikah_decorator', 'rangoli_artist', 'kolam_artist', 'garland_maker', 'haldi_supplies', 'pooja_items'],
  attire: ['makeup_artist', 'turban_tier', 'mehndi_artist', 'silk_saree_rental'],
  transportation: ['limo_service', 'horse_rental'],
};

interface AIBudgetEstimate {
  lowEstimate: number;
  highEstimate: number;
  averageEstimate: number;
  notes: string;
  hasEstimate: boolean;
}

export default function Budget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("budget");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState("");
  const [aiEstimate, setAiEstimate] = useState<AIBudgetEstimate | null>(null);
  const [aiEstimateLoading, setAiEstimateLoading] = useState(false);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: costSummary } = useQuery<{
    categories: Record<string, { fixed: number; perHead: number; total: number; items: any[] }>;
    grandTotal: number;
    grandTotalFixed: number;
    grandTotalPerHead: number;
    eventCount: number;
    itemCount: number;
  }>({
    queryKey: ["/api/weddings", wedding?.id, "cost-summary"],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "catering",
      allocatedAmount: "0",
      spentAmount: "0",
      weddingId: wedding?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return await apiRequest("POST", "/api/budget-categories", {
        ...data,
        allocatedAmount: data.allocatedAmount,
        spentAmount: data.spentAmount || "0",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Category added",
        description: "Your category is ready to track expenses",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add budget category",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetFormData> }) => {
      const payload = {
        ...data,
        allocatedAmount: data.allocatedAmount,
        spentAmount: data.spentAmount,
      };
      return await apiRequest("PATCH", `/api/budget-categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Category updated",
        description: "Your changes have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update budget category",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/budget-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Category deleted",
        description: "Budget category has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete budget category",
        variant: "destructive",
      });
    },
  });

  const quickUpdateSpentMutation = useMutation({
    mutationFn: async ({ id, spentAmount }: { id: string; spentAmount: string }) => {
      return await apiRequest("PATCH", `/api/budget-categories/${id}`, { spentAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setQuickEditId(null);
      setQuickEditValue("");
      toast({
        title: "Spent amount updated",
        description: "Your actual spending has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update spent amount",
        variant: "destructive",
      });
    },
  });

  const updateWeddingBudgetMutation = useMutation({
    mutationFn: async (totalBudget: string) => {
      if (!wedding?.id) {
        throw new Error("Wedding ID not found");
      }
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}`, {
        totalBudget,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<Wedding[]>(["/api/weddings"], (oldData) => {
        if (!oldData || !wedding?.id) return oldData;
        return oldData.map(w => 
          w.id === wedding.id 
            ? { ...w, totalBudget: newTotalBudget }
            : w
        );
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      toast({
        title: "Budget updated",
        description: "Your total wedding budget has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  const confirmBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!wedding?.id) {
        throw new Error("Wedding ID not found");
      }
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}`, {
        budgetConfirmed: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      toast({
        title: "Budget confirmed",
        description: "Your budget categories have been confirmed. You can still make changes anytime.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm budget",
        variant: "destructive",
      });
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

  const fetchAIEstimate = async (categoryName: string) => {
    if (!wedding?.location || !categoryName) return;
    
    setAiEstimateLoading(true);
    setAiEstimate(null);
    
    try {
      const data = await apiRequest("POST", "/api/budget-categories/estimate", {
        category: categoryName,
        city: wedding.location,
        tradition: wedding.tradition || undefined,
        guestCount: wedding.guestCountEstimate || undefined,
      });
      setAiEstimate(data as AIBudgetEstimate);
    } catch (error) {
      console.error("Failed to fetch AI estimate:", error);
      setAiEstimate({ lowEstimate: 0, highEstimate: 0, averageEstimate: 0, notes: "", hasEstimate: false });
    } finally {
      setAiEstimateLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setUseCustomCategory(true);
    setCustomCategoryInput("");
    setAiEstimate(null);
    form.reset({
      category: "",
      allocatedAmount: "0",
      spentAmount: "0",
      weddingId: wedding?.id || "",
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setUseCustomCategory(false);
    setCustomCategoryInput("");
    setAiEstimate(null);
    form.reset({
      category: category.category as any,
      allocatedAmount: category.allocatedAmount.toString(),
      spentAmount: category.spentAmount?.toString() || "0",
      weddingId: category.weddingId,
    });
    setDialogOpen(true);
    fetchAIEstimate(category.category);
  };

  const handleSubmit = (data: BudgetFormData) => {
    const finalData = {
      ...data,
      category: useCustomCategory ? customCategoryInput : data.category,
    };

    if (useCustomCategory && !customCategoryInput.trim()) {
      toast({
        title: "Invalid Category",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    const currentAllocated = categories
      .filter(cat => editingCategory ? cat.id !== editingCategory.id : true)
      .reduce((sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()), 0);
    
    const newAllocation = parseFloat(finalData.allocatedAmount);
    const totalAfterChange = currentAllocated + newAllocation;
    const totalBudget = parseFloat(wedding?.totalBudget || "0");
    
    if (totalAfterChange > totalBudget) {
      const excess = totalAfterChange - totalBudget;
      toast({
        title: "Budget Exceeded",
        description: `This would exceed your budget by $${excess.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleDelete = () => {
    if (editingCategory) {
      deleteMutation.mutate(editingCategory.id);
    }
  };

  const handleSaveBudget = () => {
    if (!newTotalBudget || parseFloat(newTotalBudget) <= 0) {
      toast({
        title: "Please enter a budget",
        description: "Enter your total wedding budget to continue",
        variant: "destructive",
      });
      return;
    }
    updateWeddingBudgetMutation.mutate(newTotalBudget);
  };

  const total = parseFloat(wedding?.totalBudget || "0");
  
  const getEventCostForCategory = (categoryId: string): number => {
    if (!costSummary?.categories) return 0;
    return costSummary.categories[categoryId]?.total || 0;
  };
  
  const totalEventCosts = costSummary?.grandTotal || 0;
  const totalManualSpent = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.spentAmount?.toString() || "0"),
    0
  );
  const totalSpent = totalManualSpent + totalEventCosts;
  
  const totalAllocated = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()),
    0
  );
  
  const remainingBudget = total - totalSpent;
  const unallocated = Math.max(0, total - totalAllocated);

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
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Wedding Budget
              </h1>
              <p className="text-muted-foreground">
                Plan and track your wedding finances step by step
              </p>
            </div>
          </div>

          {/* One-time confirmation banner */}
          {!wedding.budgetConfirmed && categories.length > 0 && (
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-300 dark:border-emerald-700">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Review Your Budget Categories</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      We've allocated your ${parseFloat(wedding.totalBudget || "0").toLocaleString()} budget across {categories.length} categories based on typical wedding spending. Review and confirm when ready.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => confirmBudgetMutation.mutate()}
                  disabled={confirmBudgetMutation.isPending}
                  className="bg-emerald-600 text-white shrink-0"
                  data-testid="button-confirm-budget"
                >
                  {confirmBudgetMutation.isPending ? "Confirming..." : "Confirm Budget"}
                </Button>
              </div>
            </Card>
          )}

          {/* Getting Started Guide - Clickable Steps (same design as Team section) */}
          <div className="grid md:grid-cols-4 gap-4 cursor-pointer">
            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "budget" ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600" : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"}`}
              onClick={() => setActiveTab("budget")}
              data-testid="step-card-1"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <span className="font-semibold">Set Budget</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Enter your total wedding budget amount.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "categories" ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600" : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"}`}
              onClick={() => setActiveTab("categories")}
              data-testid="step-card-2"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <span className="font-semibold">Create Categories</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Add categories like Catering, Venue, Photography, etc.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "allocate" ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600" : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"}`}
              onClick={() => setActiveTab("allocate")}
              data-testid="step-card-3"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                  <span className="font-semibold">Divide Budget</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Assign amounts to each category from your total budget.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "track" ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600" : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"}`}
              onClick={() => setActiveTab("track")}
              data-testid="step-card-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                  <span className="font-semibold">Track Spending</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Monitor actual spending vs. planned amounts.
                </p>
              </div>
            </Card>
          </div>

          {/* Multi-Ceremony Guest Savings Calculator */}
          {events.length > 0 && (
            <MultiCeremonySavingsCalculator events={events} />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab 1: Set Budget */}
            <TabsContent value="budget" className="mt-6">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <PiggyBank className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Set Your Total Budget</h2>
                    <p className="text-muted-foreground">What's your overall wedding budget?</p>
                  </div>
                </div>

                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="totalBudget" className="text-base">Total Wedding Budget</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="totalBudget"
                        type="number"
                        step="1"
                        min="0"
                        value={newTotalBudget}
                        onChange={(e) => setNewTotalBudget(e.target.value)}
                        placeholder="e.g., 100000"
                        className="pl-12 text-xl h-14 font-mono"
                        data-testid="input-total-budget"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Typical South Asian weddings range from $50,000 to $200,000+
                    </p>
                  </div>

                  {/* Hidden Costs Warning */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Don't Forget Hidden Costs!</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Set aside <span className="font-bold">15%</span> of your budget for hidden costs like service charges (often 22%), taxes, tips, and last-minute additions.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                          A $50,000 wedding may actually cost ~$57,500 after these fees
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveBudget}
                    disabled={updateWeddingBudgetMutation.isPending || !newTotalBudget || parseFloat(newTotalBudget) <= 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    data-testid="button-save-budget"
                  >
                    {updateWeddingBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                  </Button>

                  {total > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-900 dark:text-emerald-100">Current Budget: ${total.toLocaleString()}</p>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">You can update this anytime</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Tab 2: Create Categories */}
            <TabsContent value="categories" className="mt-6">
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <FolderPlus className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Create Spending Categories</h2>
                      <p className="text-muted-foreground">What will you be spending money on?</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    data-testid="button-add-category"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                    <FolderPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-2">No categories yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Add categories like Catering, Venue, Photography, etc.</p>
                    <Button onClick={handleAddCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Category
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                        onClick={() => handleEditCategory(cat)}
                        data-testid={`card-category-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium text-lg">
                            {CATEGORY_LABELS[cat.category] || cat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground">
                            ${parseFloat(cat.allocatedAmount.toString()).toLocaleString()}
                          </span>
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Tab 3: Divide Budget */}
            <TabsContent value="allocate" className="mt-6">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Divide Your Budget</h2>
                    <p className="text-muted-foreground">How much to set aside for each category?</p>
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
                      <p className="text-3xl font-bold font-mono">${total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Already Assigned</p>
                      <p className="text-3xl font-bold font-mono">${totalAllocated.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Still to Assign</p>
                      <p className={`text-3xl font-bold font-mono ${unallocated === 0 ? 'text-emerald-600' : ''}`}>
                        ${unallocated.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Progress value={total > 0 ? (totalAllocated / total) * 100 : 0} className="h-3 mt-4" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {total > 0 ? `${((totalAllocated / total) * 100).toFixed(0)}%` : '0%'} of budget assigned
                  </p>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <p className="font-medium text-amber-900 dark:text-amber-100">No categories to assign budget to</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">Create categories first, then come back here to assign amounts</p>
                    <Button variant="outline" onClick={() => setActiveTab("categories")}>
                      Go to Create Categories
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => {
                      const allocated = parseFloat(cat.allocatedAmount.toString());
                      const percentage = total > 0 ? (allocated / total) * 100 : 0;
                      
                      return (
                        <div
                          key={cat.id}
                          className="p-4 rounded-lg border hover-elevate cursor-pointer"
                          onClick={() => handleEditCategory(cat)}
                          data-testid={`card-allocate-${cat.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-lg">
                              {CATEGORY_LABELS[cat.category] || cat.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-lg">
                                ${allocated.toLocaleString()}
                              </span>
                              <Badge variant="secondary">{percentage.toFixed(0)}%</Badge>
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {unallocated === 0 && categories.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 mt-6 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">All budget assigned!</p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">You've divided your entire budget across categories</p>
                    </div>
                  </div>
                )}

                {unallocated > 0 && categories.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mt-6 flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        ${unallocated.toLocaleString()} not yet assigned
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Click on any category above to adjust its budget
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Tab 4: Track Spending */}
            <TabsContent value="track" className="mt-6">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Track Your Spending</h2>
                    <p className="text-muted-foreground">Monitor actual expenses vs. planned amounts</p>
                  </div>
                </div>

                {/* Spending Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-3xl font-mono font-bold mb-2" data-testid="text-total-spent">
                      ${totalSpent.toLocaleString()}
                    </p>
                    <Progress value={total > 0 ? (totalSpent / total) * 100 : 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {total > 0 ? `${((totalSpent / total) * 100).toFixed(0)}%` : '0%'} of total budget
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Remaining</p>
                    <p className={`text-3xl font-mono font-bold mb-2 ${remainingBudget < 0 ? 'text-destructive' : ''}`} data-testid="text-remaining-budget">
                      ${remainingBudget.toLocaleString()}
                    </p>
                    {remainingBudget < 0 && (
                      <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                    )}
                  </div>

                  {totalEventCosts > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">From Events</p>
                      <p className="text-3xl font-mono font-bold mb-2">
                        ${totalEventCosts.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Linked to timeline</p>
                    </div>
                  )}
                </div>

                {/* Spending by Category */}
                {categories.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-2">No categories to track yet</p>
                    <p className="text-sm text-muted-foreground">Create categories and assign budget first</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Spending by Category
                    </h3>
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const allocated = parseFloat(category.allocatedAmount.toString());
                        const manualSpent = parseFloat(category.spentAmount?.toString() || "0");
                        const eventCost = getEventCostForCategory(category.id);
                        const totalCategorySpent = manualSpent + eventCost;
                        const percentage = allocated > 0 ? (totalCategorySpent / allocated) * 100 : 0;
                        const isOverBudget = totalCategorySpent > allocated;
                        const isQuickEditing = quickEditId === category.id;

                        return (
                          <div
                            key={category.id}
                            className="p-5 rounded-lg border transition-all"
                            data-testid={`category-spending-${category.id}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="font-semibold text-lg">
                                  {CATEGORY_LABELS[category.category] || category.category}
                                </span>
                                {isOverBudget && (
                                  <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditCategory(category)}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit All
                              </Button>
                            </div>

                            {/* Prominent Spent Amount Section */}
                            <div className="bg-muted/50 rounded-lg p-4 mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Actual Spent</p>
                                  {isQuickEditing ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={quickEditValue}
                                          onChange={(e) => setQuickEditValue(e.target.value)}
                                          className="w-32 pl-7 h-9"
                                          autoFocus
                                          data-testid={`input-quick-spent-${category.id}`}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              quickUpdateSpentMutation.mutate({ id: category.id, spentAmount: quickEditValue });
                                            } else if (e.key === 'Escape') {
                                              setQuickEditId(null);
                                              setQuickEditValue("");
                                            }
                                          }}
                                        />
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-emerald-600"
                                        onClick={() => quickUpdateSpentMutation.mutate({ id: category.id, spentAmount: quickEditValue })}
                                        disabled={quickUpdateSpentMutation.isPending}
                                        data-testid={`button-save-quick-spent-${category.id}`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-muted-foreground"
                                        onClick={() => {
                                          setQuickEditId(null);
                                          setQuickEditValue("");
                                        }}
                                        data-testid={`button-cancel-quick-spent-${category.id}`}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className={`text-2xl font-bold font-mono ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                                      ${totalCategorySpent.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Budget</p>
                                  <p className="text-lg font-mono text-muted-foreground">
                                    ${allocated.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {!isQuickEditing && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-3 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickEditId(category.id);
                                    setQuickEditValue(manualSpent.toString());
                                  }}
                                  data-testid={`button-update-spent-${category.id}`}
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Update Spent Amount
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <Progress
                                value={Math.min(percentage, 100)}
                                className={`flex-1 h-3 ${isOverBudget ? 'bg-destructive/20' : ''}`}
                              />
                              <span className={`font-mono text-sm font-semibold min-w-[50px] text-right ${isOverBudget ? 'text-destructive' : ''}`}>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            {eventCost > 0 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Includes ${eventCost.toLocaleString()} from linked event costs
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-category">
              {editingCategory ? "Edit Category" : "Add Budget Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update your budget for this category"
                : "What's this spending for?"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category Name</Label>
              {useCustomCategory ? (
                <Input
                  placeholder="e.g., Wedding Gifts, Travel, Hair & Makeup"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  data-testid="input-custom-category"
                />
              ) : editingCategory ? (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{CATEGORY_LABELS[editingCategory.category] || editingCategory.category}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedAmount" className="flex items-center gap-2">
                How much to set aside?
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    This is your planned budget for this category. It's separate from what you actually spend.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="allocatedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("allocatedAmount")}
                  placeholder="e.g., 15000"
                  className="pl-9"
                  data-testid="input-allocated-amount"
                />
              </div>
            </div>

            {editingCategory && (
              <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 p-4" data-testid="ai-estimate-section">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">AI Cost Estimate</span>
                  <Badge variant="secondary" className="text-xs">for {wedding?.location || "your area"}</Badge>
                </div>
                
                {aiEstimateLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="ai-estimate-loading">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating estimate...</span>
                  </div>
                ) : aiEstimate?.hasEstimate ? (
                  <div className="space-y-2" data-testid="ai-estimate-result">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <p className="text-xs text-muted-foreground">Low</p>
                        <p className="font-mono font-semibold text-sm">${aiEstimate.lowEstimate.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2 ring-2 ring-purple-300 dark:ring-purple-700">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300">${aiEstimate.averageEstimate.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <p className="text-xs text-muted-foreground">High</p>
                        <p className="font-mono font-semibold text-sm">${aiEstimate.highEstimate.toLocaleString()}</p>
                      </div>
                    </div>
                    {aiEstimate.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic" data-testid="ai-estimate-notes">
                        {aiEstimate.notes}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => form.setValue("allocatedAmount", aiEstimate.averageEstimate.toString())}
                      data-testid="button-use-ai-estimate"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Use average estimate
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground" data-testid="ai-estimate-unavailable">
                    AI estimate not available for this category
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              {editingCategory && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-category"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-category"
              >
                {editingCategory ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
