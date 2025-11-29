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
import { DollarSign, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, TrendingUp, HelpCircle, ArrowRight, ArrowLeft, Check, Eye } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

// Wizard step type
type WizardStep = "budget" | "categories" | "allocate" | "done" | "overview";

// Step indicator for wizard
function WizardStepIndicator({ 
  currentStep, 
  steps 
}: { 
  currentStep: WizardStep;
  steps: { id: WizardStep; label: string; completed: boolean }[];
}) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step.completed
                  ? "bg-emerald-500 text-white"
                  : index === currentIndex
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.completed ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${
              index === currentIndex ? "text-primary" : "text-muted-foreground"
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-1 mx-2 rounded ${step.completed ? "bg-emerald-500" : "bg-muted"}`} />
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
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  
  // Wizard state - determines which step/screen to show
  const [wizardStep, setWizardStep] = useState<WizardStep>("budget");
  const [showOverview, setShowOverview] = useState(false);

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

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
      // Initialize budget input
      if (wedding.totalBudget) {
        setNewTotalBudget(wedding.totalBudget.toString());
      }
    }
  }, [wedding?.id, wedding?.totalBudget, form]);

  // Auto-detect which step user should be on based on their progress
  useEffect(() => {
    if (!wedding) return;
    
    const total = parseFloat(wedding.totalBudget || "0");
    const totalAllocated = categories.reduce(
      (sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()),
      0
    );
    const unallocated = Math.max(0, total - totalAllocated);
    
    // If they've completed setup, show overview
    if (total > 0 && categories.length > 0 && unallocated === 0) {
      setShowOverview(true);
      setWizardStep("done");
    } else if (total > 0 && categories.length > 0) {
      // They have budget and categories but haven't fully allocated
      setWizardStep("allocate");
    } else if (total > 0) {
      // They have budget but no categories
      setWizardStep("categories");
    } else {
      // No budget set yet
      setWizardStep("budget");
    }
  }, [wedding, categories]);

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

  // Wizard steps definition
  const wizardSteps = [
    { id: "budget" as WizardStep, label: "Budget", completed: total > 0 },
    { id: "categories" as WizardStep, label: "Categories", completed: categories.length > 0 },
    { id: "allocate" as WizardStep, label: "Allocate", completed: categories.length > 0 && unallocated === 0 },
    { id: "done" as WizardStep, label: "Done", completed: total > 0 && categories.length > 0 && unallocated === 0 },
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

  // If user wants to see full overview (or has completed setup)
  if (showOverview) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Wedding Budget
                </h1>
                <p className="text-muted-foreground">
                  Your complete budget overview
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowOverview(false);
                  setWizardStep("budget");
                }}
                data-testid="button-edit-setup"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Setup
              </Button>
            </div>

            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
                <p className="text-4xl font-bold font-mono" data-testid="text-total-budget">
                  ${total.toLocaleString()}
                </p>
              </Card>
              
              <Card className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Spent So Far</p>
                <p className="text-4xl font-bold font-mono" data-testid="text-total-spent">
                  ${totalSpent.toLocaleString()}
                </p>
                <Progress value={total > 0 ? (totalSpent / total) * 100 : 0} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {total > 0 ? `${((totalSpent / total) * 100).toFixed(0)}%` : '0%'} used
                </p>
              </Card>
              
              <Card className={`p-6 ${remainingBudget < 0 ? 'border-destructive' : ''}`}>
                <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
                <p className={`text-4xl font-bold font-mono ${remainingBudget < 0 ? 'text-destructive' : ''}`} data-testid="text-remaining-budget">
                  ${remainingBudget.toLocaleString()}
                </p>
                {remainingBudget < 0 && (
                  <Badge variant="destructive" className="mt-2">Over Budget</Badge>
                )}
              </Card>
            </div>

            {/* Categories Breakdown */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Spending by Category</h2>
                <Button onClick={handleAddCategory} data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">No categories yet</p>
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Category
                  </Button>
                </div>
              ) : (
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
                        className="p-4 rounded-lg border hover-elevate cursor-pointer transition-all"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`category-spending-${category.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium text-lg">
                              {CATEGORY_LABELS[category.category] || category.category}
                            </span>
                            {isOverBudget && (
                              <Badge variant="destructive" className="text-xs">Over</Badge>
                            )}
                          </div>
                          <span className="font-mono">
                            <span className="font-semibold">${totalCategorySpent.toLocaleString()}</span>
                            <span className="text-muted-foreground"> / ${allocated.toLocaleString()}</span>
                          </span>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Unallocated Warning */}
            {unallocated > 0 && (
              <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Budget Not Fully Assigned</h3>
                    <p className="text-blue-800 dark:text-blue-200">
                      You still have <span className="font-bold font-mono">${unallocated.toLocaleString()}</span> to assign to categories
                    </p>
                    <Button 
                      className="mt-3" 
                      variant="outline"
                      onClick={() => {
                        setShowOverview(false);
                        setWizardStep("allocate");
                      }}
                    >
                      Assign Remaining Budget
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>

        {/* Category Dialog */}
        <CategoryDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingCategory={editingCategory}
          form={form}
          useCustomCategory={useCustomCategory}
          customCategoryInput={customCategoryInput}
          setCustomCategoryInput={setCustomCategoryInput}
          handleSubmit={handleSubmit}
          handleDelete={handleDelete}
          createMutation={createMutation}
          updateMutation={updateMutation}
          deleteMutation={deleteMutation}
        />
      </div>
    );
  }

  // WIZARD MODE - One thing per screen
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Wedding Budget
            </h1>
            <p className="text-muted-foreground">
              Let's set up your budget step by step
            </p>
          </div>

          <WizardStepIndicator currentStep={wizardStep} steps={wizardSteps} />

          {/* STEP 1: SET YOUR TOTAL BUDGET */}
          {wizardStep === "budget" && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">What's your total wedding budget?</h2>
                <p className="text-muted-foreground">
                  This is the overall amount you're planning to spend on your wedding
                </p>
              </div>

              <div className="max-w-sm mx-auto space-y-6">
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={newTotalBudget}
                    onChange={(e) => setNewTotalBudget(e.target.value)}
                    placeholder="e.g., 100000"
                    className="pl-12 text-2xl h-14 font-mono"
                    data-testid="input-total-budget"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  For example: A typical South Asian wedding ranges from $50,000 to $200,000+
                </p>

                <Button 
                  onClick={() => {
                    handleSaveBudget();
                    if (parseFloat(newTotalBudget) > 0) {
                      setWizardStep("categories");
                    }
                  }}
                  disabled={updateWeddingBudgetMutation.isPending || !newTotalBudget || parseFloat(newTotalBudget) <= 0}
                  className="w-full h-12 text-lg"
                  data-testid="button-next-step"
                >
                  {updateWeddingBudgetMutation.isPending ? "Saving..." : "Continue"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {total > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowOverview(true)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Budget Overview
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* STEP 2: CREATE CATEGORIES */}
          {wizardStep === "categories" && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Create your spending categories</h2>
                <p className="text-muted-foreground">
                  What will you be spending money on? Add categories like Catering, Venue, Photography, etc.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {categories.length > 0 ? (
                  <>
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                        onClick={() => handleEditCategory(cat)}
                        data-testid={`card-category-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium">
                            {CATEGORY_LABELS[cat.category] || cat.category}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          ${parseFloat(cat.allocatedAmount.toString()).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground mb-2">No categories yet</p>
                    <p className="text-sm text-muted-foreground">Click below to add your first category</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddCategory}
                variant="outline"
                className="w-full mb-6"
                data-testid="button-add-category"
              >
                <Plus className="w-4 h-4 mr-2" />
                {categories.length === 0 ? "Add Your First Category" : "Add Another Category"}
              </Button>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setWizardStep("budget")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setWizardStep("allocate")}
                  disabled={categories.length === 0}
                  className="flex-1"
                  data-testid="button-next-step"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 3: ALLOCATE BUDGET */}
          {wizardStep === "allocate" && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Divide your budget</h2>
                <p className="text-muted-foreground">
                  How much do you want to set aside for each category?
                </p>
              </div>

              {/* Budget Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total Budget</span>
                  <span className="font-mono font-bold">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Already Assigned</span>
                  <span className="font-mono">${totalAllocated.toLocaleString()}</span>
                </div>
                <Progress value={total > 0 ? (totalAllocated / total) * 100 : 0} className="h-2 mb-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Still to Assign</span>
                  <span className={`font-mono font-semibold ${unallocated === 0 ? 'text-emerald-600' : 'text-primary'}`}>
                    ${unallocated.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Categories to allocate */}
              <div className="space-y-3 mb-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => handleEditCategory(cat)}
                    data-testid={`card-category-${cat.id}`}
                  >
                    <span className="font-medium">
                      {CATEGORY_LABELS[cat.category] || cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">
                        ${parseFloat(cat.allocatedAmount.toString()).toLocaleString()}
                      </span>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {unallocated === 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">All budget assigned!</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">You've divided your entire budget across categories</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setWizardStep("categories")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    setWizardStep("done");
                  }}
                  className="flex-1"
                  data-testid="button-next-step"
                >
                  {unallocated === 0 ? "Finish Setup" : "Continue Anyway"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 4: DONE */}
          {wizardStep === "done" && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Your budget is ready!</h2>
                <p className="text-muted-foreground">
                  You've set up your wedding budget. Now you can track your spending.
                </p>
              </div>

              {/* Quick Summary */}
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold font-mono">${total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{categories.length}</p>
                  </div>
                </div>
              </div>

              {unallocated > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Heads up!</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      You still have ${unallocated.toLocaleString()} not assigned to any category
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setShowOverview(true)}
                className="w-full h-12 text-lg"
                data-testid="button-view-budget"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Full Budget
              </Button>

              <Button 
                variant="outline"
                onClick={() => setWizardStep("budget")}
                className="w-full mt-3"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Make Changes
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Category Dialog */}
      <CategoryDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCategory={editingCategory}
        form={form}
        useCustomCategory={useCustomCategory}
        customCategoryInput={customCategoryInput}
        setCustomCategoryInput={setCustomCategoryInput}
        handleSubmit={handleSubmit}
        handleDelete={handleDelete}
        createMutation={createMutation}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}

// Extracted Category Dialog component
function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  form,
  useCustomCategory,
  customCategoryInput,
  setCustomCategoryInput,
  handleSubmit,
  handleDelete,
  createMutation,
  updateMutation,
  deleteMutation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: BudgetCategory | null;
  form: any;
  useCustomCategory: boolean;
  customCategoryInput: string;
  setCustomCategoryInput: (val: string) => void;
  handleSubmit: (data: BudgetFormData) => void;
  handleDelete: () => void;
  createMutation: any;
  updateMutation: any;
  deleteMutation: any;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onOpenChange(false)}
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
  );
}
