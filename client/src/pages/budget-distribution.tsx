import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBudgetCategories } from "@/hooks/use-budget-bucket-categories";
import type { Wedding, Event, BudgetAllocation, BudgetBucket } from "@shared/schema";
import { 
  ArrowLeft, Check, Save, ChevronLeft, ChevronRight,
  DollarSign, Sparkles, Calendar, Layers, ChevronDown, ChevronUp, Plus, X
} from "lucide-react";

interface CeremonyLineItem {
  id: string;
  ceremonyTypeId?: string;
  name?: string;
  category?: string;
  budgetBucketCategoryId?: string;
  budgetBucketId?: string;
  lowEstimate?: string;
  highEstimate?: string;
  lowCost?: number;
  highCost?: number;
}

interface SavedLineItemBudget {
  id: string;
  eventId: string;
  lineItemCategory: string;
  budgetedAmount: string;
}

type EstimateMode = "low" | "high" | "custom";

interface CustomLineItem {
  id: string;
  name: string;
  amount: string;
}

export default function BudgetDistribution() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showLineItems, setShowLineItems] = useState(false);
  const [customItems, setCustomItems] = useState<Record<string, CustomLineItem[]>>({});
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  
  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: allocations = [] } = useQuery<BudgetAllocation[]>({
    queryKey: ["/api/budget/allocations", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: budgetBuckets = [] } = useBudgetCategories();

  const { data: allLineItems = {} } = useQuery<Record<string, CeremonyLineItem[]>>({
    queryKey: ["/api/ceremony-types/all/line-items"],
    enabled: !!wedding?.id,
  });

  const { data: savedLineItemBudgets = [] } = useQuery<SavedLineItemBudget[]>({
    queryKey: ["/api/budget/line-items", wedding?.id],
    enabled: !!wedding?.id,
  });

  const isCeremonyMode = wedding?.budgetTrackingMode === "ceremony";
  const totalBudget = parseFloat(wedding?.totalBudget || "0");

  const [ceremonyBudgets, setCeremonyBudgets] = useState<Record<string, string>>({});
  const [ceremonyLineItemBudgets, setCeremonyLineItemBudgets] = useState<Record<string, Record<string, string>>>({});
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [estimateModes, setEstimateModes] = useState<Record<string, EstimateMode>>({});

  useEffect(() => {
    if (wedding?.budgetDistributionStep !== undefined && wedding.budgetDistributionStep !== null) {
      const savedStep = wedding.budgetDistributionStep;
      if (savedStep >= 0) {
        setCurrentStep(savedStep);
      }
    }
  }, [wedding?.budgetDistributionStep]);

  useEffect(() => {
    if (events.length > 0 && allocations.length >= 0 && Object.keys(ceremonyBudgets).length === 0) {
      const initial: Record<string, string> = {};
      // Get ceremony-level allocations (ceremonyId set, no lineItemLabel)
      const ceremonyAllocations = allocations.filter(a => a.ceremonyId && !a.lineItemLabel);
      events.forEach(e => {
        // Find allocation for this ceremony
        const allocation = ceremonyAllocations.find(a => a.ceremonyId === e.id);
        initial[e.id] = allocation?.allocatedAmount || "0";
      });
      setCeremonyBudgets(initial);
    }
  }, [events, allocations]);

  useEffect(() => {
    if (budgetBuckets.length > 0 && Object.keys(categoryBudgets).length === 0) {
      const initial: Record<string, string> = {};
      budgetBuckets.forEach(b => {
        const allocation = allocations.find(a => a.bucketCategoryId === b.id);
        initial[b.id] = allocation?.allocatedAmount || "0";
      });
      setCategoryBudgets(initial);
    }
  }, [budgetBuckets, allocations]);

  useEffect(() => {
    if (events.length > 0 && savedLineItemBudgets.length > 0 && Object.keys(allLineItems).length > 0) {
      const lineItemsByEvent: Record<string, Record<string, string>> = {};
      const customItemsByEvent: Record<string, CustomLineItem[]> = {};
      
      events.forEach(event => {
        const eventLineItems = savedLineItemBudgets.filter(li => li.eventId === event.id);
        if (eventLineItems.length > 0) {
          const lineItemMap: Record<string, string> = {};
          const customItemsList: CustomLineItem[] = [];
          
          // Get known template categories for this event's ceremony type
          const templateItems = event.ceremonyTypeId && allLineItems[event.ceremonyTypeId] 
            ? allLineItems[event.ceremonyTypeId] 
            : [];
          const templateCategories = new Set(templateItems.map(item => item.category || item.name || item.id));
          
          eventLineItems.forEach(saved => {
            // Check if this is a template item or a custom item
            if (templateCategories.has(saved.lineItemCategory)) {
              lineItemMap[saved.lineItemCategory] = saved.budgetedAmount;
            } else {
              // This is a custom item - add to custom items list
              customItemsList.push({
                id: `custom-${saved.id}`,
                name: saved.lineItemCategory,
                amount: saved.budgetedAmount,
              });
            }
          });
          
          if (Object.keys(lineItemMap).length > 0) {
            lineItemsByEvent[event.id] = lineItemMap;
          }
          
          if (customItemsList.length > 0) {
            customItemsByEvent[event.id] = customItemsList;
          }
        }
      });
      
      if (Object.keys(lineItemsByEvent).length > 0) {
        setCeremonyLineItemBudgets(prev => {
          if (Object.keys(prev).length === 0) {
            return lineItemsByEvent;
          }
          return prev;
        });
      }
      
      if (Object.keys(customItemsByEvent).length > 0) {
        setCustomItems(prev => {
          if (Object.keys(prev).length === 0) {
            return customItemsByEvent;
          }
          return prev;
        });
      }
    }
  }, [events, savedLineItemBudgets, allLineItems]);

  const steps = useMemo(() => {
    if (isCeremonyMode) {
      return events.map(e => ({
        id: e.id,
        type: "ceremony" as const,
        name: e.name,
        ceremonyTypeId: e.ceremonyTypeId,
        date: e.date,
      }));
    } else {
      return budgetBuckets.map(b => ({
        id: b.id,
        type: "category" as const,
        name: b.displayName || b.slug,
        slug: b.slug,
        iconName: b.iconName,
        description: b.description,
      }));
    }
  }, [isCeremonyMode, events, budgetBuckets]);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const totalPlanned = useMemo(() => {
    if (isCeremonyMode) {
      return Object.values(ceremonyBudgets).reduce((sum, val) => sum + parseFloat(val || "0"), 0);
    } else {
      return Object.values(categoryBudgets).reduce((sum, val) => sum + parseFloat(val || "0"), 0);
    }
  }, [isCeremonyMode, ceremonyBudgets, categoryBudgets]);

  const remaining = totalBudget - totalPlanned;
  const progressPercent = totalBudget > 0 ? Math.min((totalPlanned / totalBudget) * 100, 100) : 0;

  const getCeremonyAccentColor = (ceremonyTypeId: string | null | undefined, name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("mehndi") || lowerName.includes("mehendi")) {
      return "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800";
    }
    if (lowerName.includes("anand karaj") || lowerName.includes("ceremony") || lowerName.includes("wedding")) {
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
    }
    if (lowerName.includes("sangeet") || lowerName.includes("music")) {
      return "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800";
    }
    if (lowerName.includes("maiyan") || lowerName.includes("haldi")) {
      return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800";
    }
    return "bg-card border";
  };

  const updateCeremonyBudgetMutation = useMutation({
    mutationFn: async ({ eventId, budget }: { eventId: string; budget: string }) => {
      if (!wedding?.id) throw new Error("No wedding");
      // Save to budget_allocations table via ceremony-budgets endpoint
      // This syncs with the main budget page which reads from budget_allocations
      return await apiRequest("POST", `/api/budget/ceremony-budgets`, {
        weddingId: wedding.id,
        ceremonyId: eventId,
        allocatedAmount: budget,
      });
    },
    onSuccess: () => {
      // Invalidate all budget-related queries to ensure the budget page reflects changes
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/ceremony-budgets", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/ceremony-analytics", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-bucket-categories", wedding?.id] });
    },
  });

  const updateCategoryBudgetMutation = useMutation({
    mutationFn: async ({ bucketCategoryId, amount }: { bucketCategoryId: string; amount: string }) => {
      if (!wedding?.id) throw new Error("No wedding");
      return await apiRequest("POST", `/api/budget/allocations/${wedding.id}`, {
        bucketCategoryId,
        allocatedAmount: amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", wedding?.id] });
    },
  });

  const saveWizardProgressMutation = useMutation({
    mutationFn: async (step: number) => {
      if (!wedding?.id) throw new Error("No wedding");
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}`, { budgetDistributionStep: step });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
    },
  });

  const confirmBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!wedding?.id) throw new Error("No wedding");
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}`, { 
        budgetConfirmed: true,
        budgetDistributionStep: null 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      toast({ title: "Budget confirmed!", description: "Your budget allocations have been saved." });
      setLocation("/budget");
    },
  });

  const saveLineItemsMutation = useMutation({
    mutationFn: async ({ eventId, ceremonyTypeId, items }: { 
      eventId: string; 
      ceremonyTypeId: string; 
      items: Array<{ lineItemCategory: string; budgetedAmount: string }>;
    }) => {
      if (!wedding?.id) throw new Error("No wedding");
      return await apiRequest("POST", "/api/budget/line-items/bulk", {
        weddingId: wedding.id,
        eventId,
        ceremonyTypeId,
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/line-items", wedding?.id] });
    },
  });

  const saveCurrentStep = async () => {
    if (!currentStepData) return;
    
    if (isCeremonyMode) {
      const budget = ceremonyBudgets[currentStepData.id] || "0";
      await updateCeremonyBudgetMutation.mutateAsync({ eventId: currentStepData.id, budget });
      
      const stepData = currentStepData as { id: string; type: "ceremony"; ceremonyTypeId?: string | null };
      if (stepData.ceremonyTypeId) {
        const lineItemBudgetsForStep = ceremonyLineItemBudgets[currentStepData.id] || {};
        const templateItems = allLineItems[stepData.ceremonyTypeId] || [];
        const stepCustomItems = customItems[currentStepData.id] || [];
        
        const items: Array<{ lineItemCategory: string; budgetedAmount: string }> = [];
        
        templateItems.forEach(item => {
          const category = getItemCategory(item);
          const value = lineItemBudgetsForStep[category];
          if (value !== undefined) {
            items.push({
              lineItemCategory: category,
              budgetedAmount: value || "0",
            });
          }
        });
        
        stepCustomItems.forEach(item => {
          items.push({
            lineItemCategory: item.name,
            budgetedAmount: item.amount || "0",
          });
        });
        
        if (items.length > 0) {
          await saveLineItemsMutation.mutateAsync({
            eventId: currentStepData.id,
            ceremonyTypeId: stepData.ceremonyTypeId,
            items,
          });
        }
      }
    } else {
      const budget = categoryBudgets[currentStepData.id] || "0";
      await updateCategoryBudgetMutation.mutateAsync({ bucketCategoryId: currentStepData.id, amount: budget });
    }
  };

  const handleNext = async () => {
    await saveCurrentStep();
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setDirection(1);
      setCurrentStep(nextStep);
      setShowLineItems(false);
      setNewItemName("");
      setNewItemAmount("");
      await saveWizardProgressMutation.mutateAsync(nextStep);
    }
  };

  const handlePrev = async () => {
    if (currentStep > 0) {
      await saveCurrentStep();
      const prevStep = currentStep - 1;
      setDirection(-1);
      setCurrentStep(prevStep);
      setShowLineItems(false);
      setNewItemName("");
      setNewItemAmount("");
      await saveWizardProgressMutation.mutateAsync(prevStep);
    }
  };

  const handleSaveAndFinish = async () => {
    await saveCurrentStep();
    await saveWizardProgressMutation.mutateAsync(currentStep);
    toast({ title: "Progress saved", description: "You can continue anytime from the Budget page." });
    setLocation("/budget");
  };

  const handleComplete = async () => {
    await saveCurrentStep();
    await confirmBudgetMutation.mutateAsync();
  };

  const getItemLowCost = (item: CeremonyLineItem): number => {
    if (item.lowCost !== undefined) return item.lowCost;
    if (item.lowEstimate) return parseFloat(item.lowEstimate);
    return 0;
  };

  const getItemHighCost = (item: CeremonyLineItem): number => {
    if (item.highCost !== undefined) return item.highCost;
    if (item.highEstimate) return parseFloat(item.highEstimate);
    return 0;
  };

  const getItemCategory = (item: CeremonyLineItem): string => {
    return item.category || item.name || item.id;
  };

  const applyEstimate = (stepId: string, mode: EstimateMode, ceremonyTypeId?: string | null) => {
    if (!ceremonyTypeId || !allLineItems[ceremonyTypeId]) return;
    
    const lineItems = allLineItems[ceremonyTypeId];
    let total = 0;
    const lineItemBudgets: Record<string, string> = {};
    
    lineItems.forEach(item => {
      const amount = mode === "low" 
        ? getItemLowCost(item)
        : getItemHighCost(item);
      total += amount;
      lineItemBudgets[getItemCategory(item)] = amount.toString();
    });
    
    setEstimateModes(prev => ({ ...prev, [stepId]: mode }));
    setCeremonyBudgets(prev => ({ ...prev, [stepId]: total.toString() }));
    setCeremonyLineItemBudgets(prev => ({ ...prev, [stepId]: lineItemBudgets }));
  };

  const updateLineItemBudget = (stepId: string, category: string, value: string, ceremonyTypeId?: string | null) => {
    setCeremonyLineItemBudgets(prev => ({
      ...prev,
      [stepId]: { ...(prev[stepId] || {}), [category]: value }
    }));
    setEstimateModes(prev => ({ ...prev, [stepId]: "custom" }));
    
    if (ceremonyTypeId && allLineItems[ceremonyTypeId]) {
      const lineItems = allLineItems[ceremonyTypeId];
      const currentBudgets = { ...(ceremonyLineItemBudgets[stepId] || {}), [category]: value };
      const templateTotal = lineItems.reduce((sum, item) => {
        return sum + parseFloat(currentBudgets[getItemCategory(item)] || "0");
      }, 0);
      const customTotal = (customItems[stepId] || []).reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
      setCeremonyBudgets(prev => ({ ...prev, [stepId]: (templateTotal + customTotal).toString() }));
    }
  };

  // Recalculate ceremony totals whenever customItems or line item budgets change
  useEffect(() => {
    // Find all ceremony step IDs that need recalculation
    const ceremonyStepIds = new Set<string>();
    
    // Add all ceremonies with custom items
    Object.keys(customItems).forEach(stepId => ceremonyStepIds.add(stepId));
    
    // Add all ceremonies with line item budgets
    Object.keys(ceremonyLineItemBudgets).forEach(stepId => ceremonyStepIds.add(stepId));
    
    // Recalculate totals for all identified ceremonies
    ceremonyStepIds.forEach(stepId => {
      const step = steps.find(s => s.id === stepId);
      if (step && step.type === "ceremony") {
        const ceremonyTypeId = (step as any).ceremonyTypeId;
        const lineItems = ceremonyTypeId && allLineItems[ceremonyTypeId] ? allLineItems[ceremonyTypeId] : [];
        const currentBudgets = ceremonyLineItemBudgets[stepId] || {};
        const templateTotal = lineItems.reduce((sum, item) => {
          return sum + parseFloat(currentBudgets[getItemCategory(item)] || "0");
        }, 0);
        const customTotal = (customItems[stepId] || []).reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
        const newTotal = (templateTotal + customTotal).toString();
        
        setCeremonyBudgets(prev => {
          if (prev[stepId] !== newTotal) {
            return { ...prev, [stepId]: newTotal };
          }
          return prev;
        });
      }
    });
  }, [customItems, ceremonyLineItemBudgets, allLineItems, steps]);

  const addCustomItem = (stepId: string, ceremonyTypeId?: string | null) => {
    if (!newItemName.trim()) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }
    const newItem: CustomLineItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      amount: newItemAmount || "0",
    };
    setCustomItems(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), newItem],
    }));
    setNewItemName("");
    setNewItemAmount("");
    setEstimateModes(prev => ({ ...prev, [stepId]: "custom" }));
  };

  const removeCustomItem = (stepId: string, itemId: string, ceremonyTypeId?: string | null) => {
    setCustomItems(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).filter(item => item.id !== itemId),
    }));
  };

  const updateCustomItemAmount = (stepId: string, itemId: string, value: string, ceremonyTypeId?: string | null) => {
    setCustomItems(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).map(item => 
        item.id === itemId ? { ...item, amount: value } : item
      ),
    }));
    setEstimateModes(prev => ({ ...prev, [stepId]: "custom" }));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (weddingsLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please complete onboarding first.</p>
            <Link href="/onboarding">
              <Button>Start Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              {isCeremonyMode 
                ? "No ceremonies found. Add events first." 
                : "No budget categories found."}
            </p>
            <Link href={isCeremonyMode ? "/timeline" : "/budget"}>
              <Button>{isCeremonyMode ? "Add Events" : "Go to Budget"}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLineItems = currentStepData?.type === "ceremony" && currentStepData.ceremonyTypeId 
    ? allLineItems[currentStepData.ceremonyTypeId] || []
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/budget")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-semibold" data-testid="heading-wizard-title">
                Distribute Your Budget
              </h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps} • {isCeremonyMode ? "By Ceremony" : "By Category"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveAndFinish}
              data-testid="button-save-finish-later"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Save & Finish Later</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Allocated</span>
              <span className="font-medium">{progressPercent.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" data-testid="progress-budget" />
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-32 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {currentStepData?.type === "ceremony" ? (
              <Card 
                className={`${getCeremonyAccentColor(currentStepData.ceremonyTypeId, currentStepData.name)} transition-colors`}
                data-testid={`card-ceremony-${currentStepData.id}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <Badge variant="secondary">Ceremony</Badge>
                  </div>
                  <CardTitle className="font-display text-2xl md:text-3xl mt-2">
                    {currentStepData.name}
                  </CardTitle>
                  {currentStepData.date && (
                    <CardDescription>
                      {new Date(currentStepData.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="ceremony-budget" className="text-base font-medium">
                      Total budget for this ceremony
                    </Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="ceremony-budget"
                        type="number"
                        min="0"
                        value={ceremonyBudgets[currentStepData.id] || ""}
                        onChange={(e) => {
                          setCeremonyBudgets(prev => ({ ...prev, [currentStepData.id]: e.target.value }));
                          setEstimateModes(prev => ({ ...prev, [currentStepData.id]: "custom" }));
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="pl-10 text-lg h-12"
                        placeholder="0"
                        data-testid="input-ceremony-budget"
                      />
                    </div>
                  </div>

                  {currentLineItems.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Quick Estimate from Template
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={estimateModes[currentStepData.id] === "low" ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyEstimate(currentStepData.id, "low", currentStepData.ceremonyTypeId)}
                          data-testid="button-low-estimate"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Low Estimate
                        </Button>
                        <Button
                          variant={estimateModes[currentStepData.id] === "high" ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyEstimate(currentStepData.id, "high", currentStepData.ceremonyTypeId)}
                          data-testid="button-high-estimate"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          High Estimate
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentLineItems.length > 0 && (
                    <Collapsible open={showLineItems} onOpenChange={setShowLineItems}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between" data-testid="button-toggle-line-items">
                          <span>Calculate by Category ({currentLineItems.length + (customItems[currentStepData.id]?.length || 0)} items)</span>
                          {showLineItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-4">
                        <p className="text-xs text-muted-foreground italic">
                          Use these estimates to help calculate your total. The ceremony total above will be saved.
                        </p>
                        {currentLineItems.map(item => {
                          const category = getItemCategory(item);
                          return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={`line-item-${item.id}`} className="text-sm truncate block">
                                {item.name || item.category || "Item"}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Est: ${getItemLowCost(item).toLocaleString()} - ${getItemHighCost(item).toLocaleString()}
                              </p>
                            </div>
                            <div className="relative w-32">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id={`line-item-${item.id}`}
                                type="number"
                                min="0"
                                value={ceremonyLineItemBudgets[currentStepData.id]?.[category] || ""}
                                onChange={(e) => updateLineItemBudget(currentStepData.id, category, e.target.value, currentStepData.ceremonyTypeId)}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                className="pl-7 h-9"
                                placeholder="0"
                                data-testid={`input-line-item-${item.id}`}
                              />
                            </div>
                          </div>
                          );
                        })}

                        {(customItems[currentStepData.id] || []).length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Your Custom Items</p>
                            {(customItems[currentStepData.id] || []).map(item => (
                              <div key={item.id} className="flex items-center gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <Label className="text-sm truncate block">{item.name}</Label>
                                  <p className="text-xs text-muted-foreground">Custom item</p>
                                </div>
                                <div className="relative w-32">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.amount}
                                    onChange={(e) => updateCustomItemAmount(currentStepData.id, item.id, e.target.value, currentStepData.ceremonyTypeId)}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    className="pl-7 h-9"
                                    placeholder="0"
                                    data-testid={`input-custom-item-${item.id}`}
                                  />
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeCustomItem(currentStepData.id, item.id, currentStepData.ceremonyTypeId)}
                                  data-testid={`button-remove-custom-${item.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Add Custom Item</p>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Item name"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="flex-1 h-9"
                              data-testid="input-new-item-name"
                            />
                            <div className="relative w-24">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={newItemAmount}
                                onChange={(e) => setNewItemAmount(e.target.value)}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                className="pl-7 h-9"
                                data-testid="input-new-item-amount"
                              />
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => addCustomItem(currentStepData.id, currentStepData.ceremonyTypeId)}
                              data-testid="button-add-custom-item"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {currentLineItems.length === 0 && (
                    <div className="space-y-3 border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        No template items available for this ceremony. Add your own budget items below.
                      </p>
                      
                      {(customItems[currentStepData.id] || []).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Your Custom Items</p>
                          {(customItems[currentStepData.id] || []).map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <Label className="text-sm truncate block">{item.name}</Label>
                              </div>
                              <div className="relative w-32">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.amount}
                                  onChange={(e) => updateCustomItemAmount(currentStepData.id, item.id, e.target.value, currentStepData.ceremonyTypeId)}
                                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                  className="pl-7 h-9"
                                  placeholder="0"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removeCustomItem(currentStepData.id, item.id, currentStepData.ceremonyTypeId)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Item name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="flex-1 h-9"
                          data-testid="input-new-item-name-no-template"
                        />
                        <div className="relative w-24">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={newItemAmount}
                            onChange={(e) => setNewItemAmount(e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="pl-7 h-9"
                            data-testid="input-new-item-amount-no-template"
                          />
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => addCustomItem(currentStepData.id, currentStepData.ceremonyTypeId)}
                          data-testid="button-add-custom-item-no-template"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card data-testid={`card-category-${currentStepData?.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <Badge variant="secondary">Category</Badge>
                  </div>
                  <CardTitle className="font-display text-2xl md:text-3xl mt-2">
                    {currentStepData?.name}
                  </CardTitle>
                  {currentStepData && 'description' in currentStepData && currentStepData.description && (
                    <CardDescription>{currentStepData.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="category-budget" className="text-base font-medium">
                      How much would you like to allocate to {currentStepData?.name}?
                    </Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="category-budget"
                        type="number"
                        min="0"
                        value={categoryBudgets[currentStepData?.id || ""] || ""}
                        onChange={(e) => {
                          if (currentStepData) {
                            setCategoryBudgets(prev => ({ ...prev, [currentStepData.id]: e.target.value }));
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="pl-10 text-lg h-12"
                        placeholder="0"
                        data-testid="input-category-budget"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            data-testid="button-prev-step"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep === totalSteps - 1 ? (
            <Button 
              onClick={handleComplete}
              disabled={confirmBudgetMutation.isPending}
              data-testid="button-complete-wizard"
            >
              <Check className="w-4 h-4 mr-2" />
              {confirmBudgetMutation.isPending ? "Saving..." : "Confirm Budget"}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={updateCeremonyBudgetMutation.isPending || updateCategoryBudgetMutation.isPending}
              data-testid="button-next-step"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-20">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</p>
              <p className="text-lg font-mono font-semibold text-foreground" data-testid="text-total-budget">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Planned</p>
              <p className="text-lg font-mono font-semibold text-primary" data-testid="text-planned">
                ${totalPlanned.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
              <p className={`text-lg font-mono font-semibold ${remaining < 0 ? 'text-red-500' : 'text-muted-foreground'}`} data-testid="text-remaining">
                ${remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
