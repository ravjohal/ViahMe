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
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetCategorySchema, type Wedding, type BudgetCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

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
  other: ['sword_rental', 'pandit', 'astrologer', 'qazi', 'imam', 'quran_reciter'],
};

interface StepIndicatorProps {
  steps: { label: string; completed: boolean }[];
}

function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step.completed
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground border border-input"
              }`}
            >
              {step.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 ${step.completed ? "bg-emerald-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Budget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editBudgetDialogOpen, setEditBudgetDialogOpen] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);

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
        title: "Budget category added",
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
      setEditBudgetDialogOpen(false);
      setNewTotalBudget("");
      toast({
        title: "Budget updated",
        description: "Your total wedding budget has been updated",
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

  const handleAddCategory = () => {
    setEditingCategory(null);
    setUseCustomCategory(true);
    setCustomCategoryInput("");
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
    form.reset({
      category: category.category as any,
      allocatedAmount: category.allocatedAmount.toString(),
      spentAmount: category.spentAmount?.toString() || "0",
      weddingId: category.weddingId,
    });
    setDialogOpen(true);
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

  const handleEditBudget = () => {
    setNewTotalBudget(wedding?.totalBudget?.toString() || "0");
    setEditBudgetDialogOpen(true);
  };

  const handleUpdateBudget = () => {
    if (!newTotalBudget || parseFloat(newTotalBudget) < 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
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
  const budgetPercentage = total > 0 ? (totalSpent / total) * 100 : 0;

  // Step indicators
  const steps = [
    { label: "Set Budget", completed: total > 0 },
    { label: "Create Categories", completed: categories.length > 0 },
    { label: "Allocate Amounts", completed: totalAllocated > 0 },
    { label: "Track Spending", completed: totalSpent > 0 },
  ];

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
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Wedding Budget
            </h1>
            <p className="text-muted-foreground">
              Plan your wedding finances step by step
            </p>
          </div>

          <StepIndicator steps={steps} />

          {/* STEP 1: SET YOUR TOTAL BUDGET */}
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Step 1: Set Your Total Budget</h2>
                <p className="text-sm text-muted-foreground">
                  What's your overall wedding budget?
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditBudget}
                data-testid="button-edit-budget"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Total Budget</p>
              <p className="text-5xl font-bold font-mono" data-testid="text-total-budget">
                ${total.toLocaleString()}
              </p>
            </div>
          </Card>

          {/* STEP 2 & 3: CREATE CATEGORIES AND ALLOCATE BUDGET */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 2 */}
            <Card className="p-6 border-l-4 border-l-teal-500">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-1">Step 2: Create Categories</h2>
                <p className="text-sm text-muted-foreground">
                  Break down your budget by expense type
                </p>
              </div>
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">No categories yet</p>
                  <Button
                    onClick={handleAddCategory}
                    data-testid="button-add-category"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer transition-all"
                      onClick={() => handleEditCategory(cat)}
                      data-testid={`card-category-${cat.id}`}
                    >
                      <span className="font-medium">
                        {CATEGORY_LABELS[cat.category] || cat.category}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        ${parseFloat(cat.allocatedAmount.toString()).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={handleAddCategory}
                    className="w-full mt-2"
                    data-testid="button-add-another-category"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </Button>
                </div>
              )}
            </Card>

            {/* Step 3 */}
            <Card className="p-6 border-l-4 border-l-cyan-500">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-1">Step 3: Allocation Overview</h2>
                <p className="text-sm text-muted-foreground">
                  How your budget is divided
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Budget</span>
                    <span className="font-mono font-semibold">${total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className={`font-mono font-semibold ${totalAllocated > total ? 'text-destructive' : 'text-foreground'}`}>
                      ${totalAllocated.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={total > 0 ? (totalAllocated / total) * 100 : 0} className="h-2 mb-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Allocated</span>
                    <span className={totalAllocated > total ? 'text-destructive font-semibold' : ''}>
                      {total > 0 ? `${((totalAllocated / total) * 100).toFixed(0)}%` : '0%'}
                      {totalAllocated > total && ' ⚠️'}
                    </span>
                  </div>
                </div>

                {unallocated > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Unallocated Budget
                        </p>
                        <p className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100">
                          ${unallocated.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* STEP 4: TRACK SPENDING */}
          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-1">Step 4: Track Your Spending</h2>
              <p className="text-sm text-muted-foreground">
                Monitor actual expenses against your allocation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Total Spent */}
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

              {/* Remaining */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Remaining</p>
                <p className={`text-3xl font-mono font-bold mb-2 ${remainingBudget < 0 ? 'text-destructive' : 'text-foreground'}`} data-testid="text-remaining-budget">
                  ${remainingBudget.toLocaleString()}
                </p>
                {remainingBudget < 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Over Budget
                  </Badge>
                )}
              </div>

              {/* From Events */}
              {totalEventCosts > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">From Events</p>
                  <p className="text-3xl font-mono font-bold mb-2">
                    ${totalEventCosts.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Linked to timeline
                  </p>
                </div>
              )}
            </div>

            {/* Spending by Category */}
            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Spending by Category
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const allocated = parseFloat(category.allocatedAmount.toString());
                    const manualSpent = parseFloat(category.spentAmount?.toString() || "0");
                    const eventCost = getEventCostForCategory(category.id);
                    const totalCategorySpent = manualSpent + eventCost;
                    const percentage = allocated > 0 ? (totalCategorySpent / allocated) * 100 : 0;
                    const isOverBudget = totalCategorySpent > allocated;

                    return (
                      <div
                        key={category.id}
                        className="p-3 rounded-lg border hover-elevate cursor-pointer transition-all"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`category-spending-${category.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium">
                              {CATEGORY_LABELS[category.category] || category.category}
                            </span>
                            {isOverBudget && (
                              <Badge variant="destructive" className="text-xs">
                                Over
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-sm">
                            <span className="font-semibold">${totalCategorySpent.toLocaleString()}</span>
                            <span className="text-muted-foreground"> / ${allocated.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(percentage, 100)}
                            className={`flex-1 h-2 ${isOverBudget ? 'bg-destructive/20' : ''}`}
                          />
                          <span className={`font-mono text-sm font-semibold min-w-[40px] text-right ${isOverBudget ? 'text-destructive' : ''}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        {eventCost > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {totalEventCosts > 0 ? `$${eventCost.toLocaleString()} from events` : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
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
                ? "Update your allocation"
                : "Add a new spending category"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {useCustomCategory ? (
                <Input
                  placeholder="Enter category name"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  data-testid="input-custom-category"
                />
              ) : editingCategory ? (
                <div className="p-2 bg-muted rounded">
                  <p className="text-sm font-medium">{CATEGORY_LABELS[editingCategory.category] || editingCategory.category}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedAmount">
                How much to allocate?
              </Label>
              <Input
                id="allocatedAmount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("allocatedAmount")}
                placeholder="0.00"
                data-testid="input-allocated-amount"
              />
            </div>

            <div className="flex gap-2 justify-end">
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

      {/* Edit Total Budget Dialog */}
      <Dialog open={editBudgetDialogOpen} onOpenChange={setEditBudgetDialogOpen}>
        <DialogContent data-testid="dialog-edit-budget">
          <DialogHeader>
            <DialogTitle>Set Your Total Budget</DialogTitle>
            <DialogDescription>
              What's your overall wedding budget?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalBudget">Total Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="totalBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTotalBudget}
                  onChange={(e) => setNewTotalBudget(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-total-budget"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditBudgetDialogOpen(false)}
                data-testid="button-cancel-budget-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBudget}
                disabled={updateWeddingBudgetMutation.isPending}
                data-testid="button-save-budget"
              >
                {updateWeddingBudgetMutation.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
