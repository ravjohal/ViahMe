import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  Wedding,
  GuestSource,
  GuestSuggestion,
  GuestListScenario,
  CutListItem,
  Household,
} from "@shared/schema";
import {
  Users,
  UserPlus,
  ListFilter,
  Layers,
  DollarSign,
  Scissors,
  UserCog,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RotateCcw,
  Copy,
  Play,
  AlertTriangle,
  TrendingUp,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  HelpCircle,
  Inbox,
  Target,
  CheckSquare,
  Lightbulb,
  Sparkles,
  Heart,
  CircleDot,
  Circle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type GuestSuggestionWithSource = GuestSuggestion & {
  source?: GuestSource;
};

type ScenarioWithStats = GuestListScenario & {
  householdCount: number;
  guestCount: number;
  remainingBudget?: number;
};

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

type SourceStat = {
  sourceId: string;
  count: number;
  seats: number;
  source?: GuestSource;
};

const suggestionFormSchema = z.object({
  householdName: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  maxCount: z.coerce.number().min(1, "At least 1 guest required"),
  affiliation: z.enum(["bride", "groom", "mutual"]),
  relationshipTier: z.enum(["immediate_family", "extended_family", "friend", "parents_friend"]),
  priorityTier: z.string().optional(),
  sourceId: z.string().optional(),
  guestNames: z.string().optional(),
  notes: z.string().optional(),
});

type SuggestionFormData = z.infer<typeof suggestionFormSchema>;

const scenarioFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  budgetLimit: z.string().optional(),
  costPerHead: z.string().optional(),
  copyCurrentHouseholds: z.boolean().optional(),
});

type ScenarioFormData = z.infer<typeof scenarioFormSchema>;

const sourceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  label: z.string().min(1, "Label is required"),
  side: z.enum(["bride", "groom", "mutual"]),
  quotaLimit: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
});

type SourceFormData = z.infer<typeof sourceFormSchema>;

export default function GuestManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("suggestions");
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GuestSuggestionWithSource | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [bulkCutTier, setBulkCutTier] = useState<string>("");

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["/api/households", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<GuestSuggestionWithSource[]>({
    queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"],
    enabled: !!wedding?.id,
  });

  const { data: suggestionsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"],
    enabled: !!wedding?.id,
  });

  const { data: sources = [] } = useQuery<GuestSource[]>({
    queryKey: ["/api/weddings", wedding?.id, "guest-sources"],
    enabled: !!wedding?.id,
  });

  const { data: sourceStats = [] } = useQuery<SourceStat[]>({
    queryKey: ["/api/weddings", wedding?.id, "guest-sources", "stats"],
    enabled: !!wedding?.id,
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<ScenarioWithStats[]>({
    queryKey: ["/api/weddings", wedding?.id, "scenarios"],
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

  const suggestionForm = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      householdName: "",
      contactEmail: "",
      maxCount: 1,
      affiliation: "bride",
      relationshipTier: "friend",
      priorityTier: "should_invite",
      guestNames: "",
      notes: "",
    },
  });

  const scenarioForm = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: "",
      description: "",
      budgetLimit: "",
      costPerHead: "150",
      copyCurrentHouseholds: true,
    },
  });

  const sourceForm = useForm<SourceFormData>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: {
      name: "",
      label: "",
      side: "bride",
    },
  });

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: SuggestionFormData) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/guest-suggestions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"] });
      setSuggestionDialogOpen(false);
      suggestionForm.reset();
      toast({ title: "Suggestion submitted", description: "Your guest suggestion is pending review." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit suggestion", variant: "destructive" });
    },
  });

  const approveSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/guest-suggestions/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-suggestions", "count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      toast({ title: "Approved", description: "Guest suggestion has been approved and added." });
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
      setRejectDialogOpen(false);
      setSelectedSuggestion(null);
      setRejectReason("");
      toast({ title: "Rejected", description: "Guest suggestion has been rejected." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject suggestion", variant: "destructive" });
    },
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/scenarios`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "scenarios"] });
      setScenarioDialogOpen(false);
      scenarioForm.reset();
      toast({ title: "Scenario created", description: "New what-if scenario has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create scenario", variant: "destructive" });
    },
  });

  const duplicateScenarioMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("POST", `/api/scenarios/${id}/duplicate`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "scenarios"] });
      toast({ title: "Duplicated", description: "Scenario has been duplicated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to duplicate scenario", variant: "destructive" });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "scenarios"] });
      toast({ title: "Deleted", description: "Scenario has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete scenario", variant: "destructive" });
    },
  });

  const setActiveScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/scenarios/${id}/set-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "scenarios"] });
      toast({ title: "Updated", description: "Active scenario has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to set active scenario", variant: "destructive" });
    },
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: SourceFormData) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/guest-sources`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-sources"] });
      setSourceDialogOpen(false);
      sourceForm.reset();
      toast({ title: "Source added", description: "Guest source has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create source", variant: "destructive" });
    },
  });

  const restoreFromCutListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/cut-list/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      toast({ title: "Restored", description: "Household has been restored to the guest list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore household", variant: "destructive" });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/cut-list/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      toast({ title: "Deleted", description: "Household has been permanently deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete household", variant: "destructive" });
    },
  });

  const bulkCutMutation = useMutation({
    mutationFn: async ({ priorityTier, reason }: { priorityTier: string; reason?: string }) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/cut-list/bulk-by-priority`, { priorityTier, reason });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cut-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      toast({ title: "Bulk cut complete", description: `${data.count} households moved to cut list.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to perform bulk cut", variant: "destructive" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { maxGuestBudget: string; defaultCostPerHead: string }) => {
      return await apiRequest("POST", `/api/weddings/${wedding?.id}/guest-budget`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "guest-budget"] });
      toast({ title: "Budget updated", description: "Guest budget settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    },
  });

  if (weddingsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please create a wedding first to manage guests.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingSuggestions = suggestions.filter(s => s.status === "pending");
  const reviewedSuggestions = suggestions.filter(s => s.status !== "pending");

  const priorityBreakdown = {
    must_invite: households.filter(h => h.priorityTier === "must_invite"),
    should_invite: households.filter(h => h.priorityTier === "should_invite"),
    nice_to_have: households.filter(h => h.priorityTier === "nice_to_have"),
    unassigned: households.filter(h => !h.priorityTier),
  };

  // Detailed checklist items for each step
  const collectChecklist = [
    { id: "add-source", label: "Add at least one guest source", done: sources.length > 0, action: () => setSourceDialogOpen(true) },
    { id: "review-suggestions", label: "Review pending suggestions", done: pendingSuggestions.length === 0, count: pendingSuggestions.length },
  ];

  const organizeChecklist = [
    { id: "assign-priority", label: "Assign priority to all households", done: households.length === 0 || priorityBreakdown.unassigned.length === 0, count: priorityBreakdown.unassigned.length },
    { id: "create-scenario", label: "Create a What-If list to compare options", done: scenarios.length > 0, action: () => setScenarioDialogOpen(true) },
  ];

  const finalizeChecklist = [
    { id: "set-budget", label: "Set your guest budget", done: budgetData?.settings?.maxGuestBudget && Number(budgetData.settings.maxGuestBudget) > 0 },
    { id: "review-capacity", label: "Check if you're within capacity", done: budgetData?.capacity && budgetData.capacity.currentCount <= budgetData.capacity.maxGuests },
  ];

  const collectProgress = collectChecklist.filter(c => c.done).length / collectChecklist.length * 100;
  const organizeProgress = organizeChecklist.filter(c => c.done).length / organizeChecklist.length * 100;
  const finalizeProgress = finalizeChecklist.filter(c => c.done).length / finalizeChecklist.length * 100;

  // Workflow step status - matches the 3 consolidated tabs
  const workflowSteps = [
    {
      id: "collect",
      label: "Collect",
      description: "Gather guest names",
      icon: Inbox,
      isComplete: collectProgress === 100,
      progress: collectProgress,
      count: pendingSuggestions.length,
      tab: "suggestions",
      checklist: collectChecklist,
    },
    {
      id: "organize",
      label: "Organize",
      description: "Priority & compare",
      icon: Target,
      isComplete: organizeProgress === 100,
      progress: organizeProgress,
      count: priorityBreakdown.unassigned.length,
      tab: "priority",
      checklist: organizeChecklist,
    },
    {
      id: "finalize",
      label: "Finalize",
      description: "Budget & decisions",
      icon: CheckSquare,
      isComplete: finalizeProgress === 100,
      progress: finalizeProgress,
      count: cutList.length,
      tab: "budget",
      checklist: finalizeChecklist,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Guest Planning</h1>
          <p className="text-sm text-muted-foreground">Plan and organize your perfect guest list</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {suggestionsCount && suggestionsCount.count > 0 && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-pending-suggestions">
              <Clock className="h-3 w-3" />
              {suggestionsCount.count} to review
            </Badge>
          )}
          <Link href="/guests">
            <Button variant="outline" size="sm" data-testid="button-back-to-guests">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Guest List</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Overview - Step by Step Guide */}
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Your Planning Journey</span>
            </div>
            {workflowSteps.every(s => s.isComplete) && (
              <Badge className="bg-green-500 text-white gap-1">
                <Sparkles className="h-3 w-3" />
                All done!
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {workflowSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.tab)}
                className={`relative flex flex-col items-center p-2 sm:p-4 rounded-xl transition-all ${
                  activeTab === step.tab 
                    ? "bg-white dark:bg-gray-800 shadow-lg ring-2 ring-orange-400" 
                    : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                }`}
                data-testid={`workflow-step-${step.id}`}
              >
                {/* Step Number */}
                <div className="absolute -top-1 -left-1 sm:top-1 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-background border-2 border-orange-300 flex items-center justify-center text-[10px] sm:text-xs font-bold text-orange-600">
                  {index + 1}
                </div>
                
                {/* Progress Ring */}
                <div className="relative mb-2">
                  <svg className="w-10 h-10 sm:w-14 sm:h-14 -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted/30"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${step.progress * 2.83} 283`}
                      className={step.isComplete ? "text-green-500" : "text-orange-500"}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {step.isComplete ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                    ) : (
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    )}
                  </div>
                </div>
                
                <span className="text-xs sm:text-sm font-semibold">{step.label}</span>
                <span className="text-[9px] sm:text-xs text-muted-foreground text-center leading-tight">{step.description}</span>
                
                {/* Task count badge */}
                {step.count > 0 && !step.isComplete && (
                  <Badge variant="destructive" className="mt-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1.5">
                    {step.count} to do
                  </Badge>
                )}
                {step.isComplete && (
                  <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1.5 text-green-600 border-green-300">
                    Complete
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Active step checklist preview */}
          {activeTab && (
            <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-800">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {workflowSteps.find(s => s.tab === activeTab)?.isComplete 
                  ? "Great job! This step is complete." 
                  : "What you need to do:"}
              </p>
              <div className="space-y-1.5">
                {workflowSteps.find(s => s.tab === activeTab)?.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs sm:text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={item.done ? "text-muted-foreground line-through" : ""}>
                      {item.label}
                    </span>
                    {!item.done && "count" in item && (item as any).count > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {(item as any).count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs - Using workflow stepper as navigation, hiding redundant TabsList */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="suggestions" className="space-y-4 sm:space-y-6">
          {/* Step Guidance Card */}
          <Card className={`border-2 ${collectProgress === 100 ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20"}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${collectProgress === 100 ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                  {collectProgress === 100 ? (
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  ) : (
                    <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {collectProgress === 100 ? (
                    <>
                      <p className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400">Step 1 Complete!</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        You've collected your guest suggestions. Ready to organize them by priority?
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3 gap-2"
                        onClick={() => setActiveTab("priority")}
                      >
                        Continue to Organize
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm sm:text-base">Step 1: Collect Guest Names</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Start by setting up who will submit guests (parents, siblings, etc.), then review their suggestions.
                        <span className="hidden sm:inline"> Don't worry about being perfect - you can always adjust later!</span>
                      </p>
                      {!sources.length && (
                        <div className="mt-3 p-2 rounded-lg bg-background/80 border">
                          <p className="text-xs font-medium flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-orange-500" />
                            <span>Start here:</span>
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="mt-2 gap-2"
                            onClick={() => setSourceDialogOpen(true)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Your First Guest Source
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Sources Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">Who's Submitting Guests?</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Track who added which guests (e.g., "Mom's list" or "Groom's college friends")</p>
              </div>
              <Button onClick={() => setSourceDialogOpen(true)} size="sm" variant="outline" className="self-start sm:self-auto" data-testid="button-add-source">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Source</span>
              </Button>
            </div>

            {sources.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <UserCog className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium mb-1">No sources yet</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add sources like "Bride's Mom" or "Groom's Dad" to track who submitted each guest
                  </p>
                  <Button onClick={() => setSourceDialogOpen(true)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Source
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {sources.map(source => {
                  const stat = sourceStats.find(s => s.sourceId === source.id);
                  const isOverLimit = source.quotaLimit && stat && stat.seats > source.quotaLimit;
                  return (
                    <Card key={source.id} className={isOverLimit ? "border-destructive" : ""} data-testid={`card-source-${source.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{source.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {source.side === "bride" ? "Bride" : source.side === "groom" ? "Groom" : "Both"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{stat?.seats || 0} guests</span>
                          {source.quotaLimit && (
                            <span className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                              / {source.quotaLimit} limit
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Guest Suggestions Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span>Suggestions</span>
                  {pendingSuggestions.length > 0 && (
                    <Badge variant="destructive" className="text-xs">{pendingSuggestions.length} to review</Badge>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Approve or reject suggested guests</p>
              </div>
              <Button onClick={() => setSuggestionDialogOpen(true)} size="sm" className="self-start sm:self-auto" data-testid="button-suggest-guest">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Suggest Guest</span>
              </Button>
            </div>

          {suggestionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-muted-foreground">No pending suggestions! All caught up.</p>
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
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.affiliation === "bride" ? "Bride's Side" : suggestion.affiliation === "groom" ? "Groom's Side" : "Mutual"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.maxCount} {suggestion.maxCount === 1 ? "guest" : "guests"}
                          </Badge>
                          {suggestion.source && (
                            <Badge variant="outline" className="text-xs">
                              via {suggestion.source.label}
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
                          Reject
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
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {reviewedSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{suggestion.householdName}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.maxCount} guests</p>
                      </div>
                      <Badge variant={suggestion.status === "approved" ? "default" : "destructive"}>
                        {suggestion.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4 sm:space-y-6">
          {/* Step Guidance Card */}
          <Card className={`border-2 ${finalizeProgress === 100 ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${finalizeProgress === 100 ? "bg-green-100 dark:bg-green-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                  {finalizeProgress === 100 ? (
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  ) : (
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {finalizeProgress === 100 ? (
                    <>
                      <p className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        You're All Set!
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Your guest list is planned and within budget. You can always come back to make adjustments.
                      </p>
                      <Link href="/guests">
                        <Button size="sm" className="mt-3 gap-2">
                          View Final Guest List
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm sm:text-base">Step 3: Finalize Your Guest List</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {!budgetData?.settings?.maxGuestBudget || Number(budgetData.settings.maxGuestBudget) === 0
                          ? "Set your total guest budget and cost per person to see how many guests you can actually afford."
                          : budgetData?.capacity && budgetData.capacity.currentCount > budgetData.capacity.maxGuests
                            ? `You're ${budgetData.capacity.currentCount - budgetData.capacity.maxGuests} guests over capacity. Use "Maybe Later" below to park some guests for now.`
                            : "Great! You're within budget. Review your list and make any final adjustments."}
                      </p>
                      {(!budgetData?.settings?.maxGuestBudget || Number(budgetData.settings.maxGuestBudget) === 0) && (
                        <div className="mt-3 p-2 rounded-lg bg-background/80 border">
                          <p className="text-xs font-medium flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-emerald-500" />
                            <span>Start by entering your budget below</span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Calculator Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  Budget Calculator
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">How many guests can you afford?</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">Total amount allocated for guest-related expenses</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerHead">Cost Per Head</Label>
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
                  <p className="text-xs text-muted-foreground">Average cost for catering, favors, etc. per guest</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capacity Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetData?.capacity ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Guests</span>
                        <span className="font-medium">{budgetData.capacity.currentCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Max Capacity</span>
                        <span className="font-medium">{budgetData.capacity.maxGuests || "Set budget"}</span>
                      </div>
                      {budgetData.capacity.maxGuests > 0 && (
                        <Progress
                          value={(budgetData.capacity.currentCount / budgetData.capacity.maxGuests) * 100}
                          className="h-2"
                          data-testid="progress-capacity"
                        />
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-remaining-budget">
                          ${budgetData.capacity.remainingBudget.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining Budget</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-spots-left">
                          {budgetData.capacity.maxGuests > 0
                            ? Math.max(0, budgetData.capacity.maxGuests - budgetData.capacity.currentCount)
                            : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">Spots Available</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center">Set your budget to see capacity</p>
                )}
              </CardContent>
            </Card>
          </div>
          </div>

          <Separator />

          {/* Maybe Later Section (formerly Cut List) */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                  <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span>Maybe Later</span>
                  {cutList.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{cutList.length} parked</Badge>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Guests you might not invite - restore them anytime</p>
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
                  <p className="font-medium mb-1">No guests parked yet</p>
                  <p className="text-sm text-muted-foreground">
                    When you need to trim your list, move guests here instead of deleting them.
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

        <TabsContent value="priority" className="space-y-4 sm:space-y-6">
          {/* Step Guidance Card */}
          <Card className={`border-2 ${organizeProgress === 100 ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20"}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${organizeProgress === 100 ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                  {organizeProgress === 100 ? (
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  ) : (
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {organizeProgress === 100 ? (
                    <>
                      <p className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400">Step 2 Complete!</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Your guests are organized by priority. Now let's finalize your budget and capacity.
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3 gap-2"
                        onClick={() => setActiveTab("budget")}
                      >
                        Continue to Finalize
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm sm:text-base">Step 2: Organize Your Guest List</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {priorityBreakdown.unassigned.length > 0 
                          ? `You have ${priorityBreakdown.unassigned.length} household${priorityBreakdown.unassigned.length > 1 ? 's' : ''} without priority. Assign each one to help with tough decisions later.`
                          : "Great start! Now create a What-If List to compare different guest list scenarios."}
                        <span className="hidden sm:inline"> This is totally normal - weddings involve tricky family politics!</span>
                      </p>
                      {priorityBreakdown.unassigned.length > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-background/80 border">
                          <p className="text-xs font-medium flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-blue-500" />
                            <span>Next: Scroll down to assign priorities to unassigned households</span>
                          </p>
                        </div>
                      )}
                      {priorityBreakdown.unassigned.length === 0 && scenarios.length === 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-background/80 border">
                          <p className="text-xs font-medium flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-blue-500" />
                            <span>Next:</span>
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="mt-2 gap-2"
                            onClick={() => setScenarioDialogOpen(true)}
                          >
                            <Plus className="h-3 w-3" />
                            Create Your First What-If List
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Tiers Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <ListFilter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  Guest Priority
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Who's most important? Assign priority to help with tough decisions.</p>
              </div>
            </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-500" />
                  Must Invite
                </CardTitle>
                <CardDescription className="text-xs">Cannot be cut under any circumstances</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-must-invite-count">{priorityBreakdown.must_invite.length}</p>
                <p className="text-sm text-muted-foreground">
                  {priorityBreakdown.must_invite.reduce((sum, h) => sum + h.maxCount, 0)} guests
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  Should Invite
                </CardTitle>
                <CardDescription className="text-xs">High priority but can be adjusted</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-should-invite-count">{priorityBreakdown.should_invite.length}</p>
                <p className="text-sm text-muted-foreground">
                  {priorityBreakdown.should_invite.reduce((sum, h) => sum + h.maxCount, 0)} guests
                </p>
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
                <p className="text-3xl font-bold" data-testid="text-nice-to-have-count">{priorityBreakdown.nice_to_have.length}</p>
                <p className="text-sm text-muted-foreground">
                  {priorityBreakdown.nice_to_have.reduce((sum, h) => sum + h.maxCount, 0)} guests
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Unassigned
                </CardTitle>
                <CardDescription className="text-xs">Needs priority assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-unassigned-count">{priorityBreakdown.unassigned.length}</p>
                <p className="text-sm text-muted-foreground">
                  {priorityBreakdown.unassigned.reduce((sum, h) => sum + h.maxCount, 0)} guests
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk Cut by Priority</CardTitle>
              <CardDescription>Quickly cut all households in a priority tier</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 items-end flex-wrap">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Select Priority Tier</Label>
                <Select value={bulkCutTier} onValueChange={setBulkCutTier} data-testid="select-bulk-cut-tier">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose tier to cut..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nice_to_have">Nice to Have ({priorityBreakdown.nice_to_have.length})</SelectItem>
                    <SelectItem value="should_invite">Should Invite ({priorityBreakdown.should_invite.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="destructive"
                disabled={!bulkCutTier || bulkCutMutation.isPending}
                onClick={() => bulkCutMutation.mutate({ priorityTier: bulkCutTier, reason: "Bulk cut to reduce list" })}
                data-testid="button-bulk-cut"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Cut All in Tier
              </Button>
            </CardContent>
          </Card>
          </div>

          <Separator />

          {/* What-If Lists Section (formerly Scenarios) */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  What-If Lists
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Create different versions of your guest list to compare options</p>
              </div>
              <Button onClick={() => setScenarioDialogOpen(true)} size="sm" className="self-start sm:self-auto" data-testid="button-create-scenario">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New List</span>
              </Button>
            </div>

            {scenariosLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : scenarios.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium mb-1">No what-if lists yet</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create different versions of your guest list to see how changes affect your count and budget
                  </p>
                  <Button onClick={() => setScenarioDialogOpen(true)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First List
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scenarios.map(scenario => (
                  <Card key={scenario.id} className={scenario.isActive ? "border-primary ring-1 ring-primary" : ""} data-testid={`card-scenario-${scenario.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {scenario.name}
                            {scenario.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                          </CardTitle>
                          {scenario.description && (
                            <CardDescription className="text-xs">{scenario.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Households:</span>
                        <span className="font-medium">{scenario.householdCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Guests:</span>
                        <span className="font-medium">{scenario.guestCount}</span>
                      </div>
                      {scenario.budgetLimit && scenario.costPerHead && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget Left:</span>
                          <span className={`font-medium ${scenario.remainingBudget && scenario.remainingBudget < 0 ? "text-destructive" : "text-green-600"}`}>
                            ${scenario.remainingBudget?.toLocaleString() || 0}
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="gap-2 pt-2 flex-wrap">
                      {!scenario.isActive && (
                        <Button
                          size="sm"
                          onClick={() => setActiveScenarioMutation.mutate(scenario.id)}
                          disabled={setActiveScenarioMutation.isPending}
                          data-testid={`button-activate-${scenario.id}`}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Use This
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => duplicateScenarioMutation.mutate({ id: scenario.id, name: `${scenario.name} (copy)` })}
                        disabled={duplicateScenarioMutation.isPending}
                        data-testid={`button-duplicate-${scenario.id}`}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                        disabled={deleteScenarioMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${scenario.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={suggestionDialogOpen} onOpenChange={setSuggestionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest a Guest</DialogTitle>
            <DialogDescription>Submit a guest suggestion for approval</DialogDescription>
          </DialogHeader>
          <form onSubmit={suggestionForm.handleSubmit((data) => createSuggestionMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name *</Label>
              <Input id="householdName" {...suggestionForm.register("householdName")} placeholder="e.g., The Sharma Family" data-testid="input-household-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestNames">Guest Names</Label>
              <Textarea id="guestNames" {...suggestionForm.register("guestNames")} placeholder="e.g., Raj Sharma, Priya Sharma, Aarav Sharma" data-testid="input-guest-names" />
              <p className="text-xs text-muted-foreground">Separate names with commas</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxCount">Max Guests *</Label>
                <Input id="maxCount" type="number" min={1} {...suggestionForm.register("maxCount")} data-testid="input-max-count" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliation">Side *</Label>
                <Select value={suggestionForm.watch("affiliation")} onValueChange={(v: any) => suggestionForm.setValue("affiliation", v)} data-testid="select-affiliation">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipTier">Relationship</Label>
                <Select value={suggestionForm.watch("relationshipTier")} onValueChange={(v: any) => suggestionForm.setValue("relationshipTier", v)} data-testid="select-relationship">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate_family">Immediate Family</SelectItem>
                    <SelectItem value="extended_family">Extended Family</SelectItem>
                    <SelectItem value="friend">Friends</SelectItem>
                    <SelectItem value="parents_friend">Parent's Friends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorityTier">Priority</Label>
                <Select value={suggestionForm.watch("priorityTier") || ""} onValueChange={(v) => suggestionForm.setValue("priorityTier", v)} data-testid="select-priority">
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="must_invite">Must Invite</SelectItem>
                    <SelectItem value="should_invite">Should Invite</SelectItem>
                    <SelectItem value="nice_to_have">Nice to Have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sources.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="sourceId">Submitted By</Label>
                <Select value={suggestionForm.watch("sourceId") || ""} onValueChange={(v) => suggestionForm.setValue("sourceId", v)} data-testid="select-source">
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {sources.map(source => (
                      <SelectItem key={source.id} value={source.id}>{source.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...suggestionForm.register("notes")} placeholder="Any additional context..." data-testid="input-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSuggestionDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createSuggestionMutation.isPending} data-testid="button-submit-suggestion">
                {createSuggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Scenario</DialogTitle>
            <DialogDescription>Create a what-if scenario to explore options</DialogDescription>
          </DialogHeader>
          <form onSubmit={scenarioForm.handleSubmit((data) => createScenarioMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scenarioName">Scenario Name *</Label>
              <Input id="scenarioName" {...scenarioForm.register("name")} placeholder="e.g., Budget Option A" data-testid="input-scenario-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenarioDescription">Description</Label>
              <Textarea id="scenarioDescription" {...scenarioForm.register("description")} placeholder="What makes this scenario different?" data-testid="input-scenario-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioBudget">Budget Limit</Label>
                <Input id="scenarioBudget" type="number" {...scenarioForm.register("budgetLimit")} placeholder="50000" data-testid="input-scenario-budget" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenarioCost">Cost/Head</Label>
                <Input id="scenarioCost" type="number" {...scenarioForm.register("costPerHead")} placeholder="150" data-testid="input-scenario-cost" />
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox 
                id="copyHouseholds" 
                checked={scenarioForm.watch("copyCurrentHouseholds")}
                onCheckedChange={(checked: boolean) => scenarioForm.setValue("copyCurrentHouseholds", checked)}
                data-testid="checkbox-copy-households"
              />
              <div className="space-y-1">
                <Label htmlFor="copyHouseholds" className="font-medium cursor-pointer">
                  Copy current guest list
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include all existing households in this scenario
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScenarioDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createScenarioMutation.isPending} data-testid="button-create-scenario-submit">
                {createScenarioMutation.isPending ? "Creating..." : "Create Scenario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Guest Source</DialogTitle>
            <DialogDescription>Track who submitted guests for fair allocation</DialogDescription>
          </DialogHeader>
          <form onSubmit={sourceForm.handleSubmit((data) => createSourceMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name *</Label>
              <Input id="sourceName" {...sourceForm.register("name")} placeholder="e.g., mom, dad, grandpa" data-testid="input-source-name" />
              <p className="text-xs text-muted-foreground">Short identifier for this source</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceLabel">Display Label *</Label>
              <Input id="sourceLabel" {...sourceForm.register("label")} placeholder="e.g., Bride's Mom" data-testid="input-source-label" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceSide">Side *</Label>
              <Select value={sourceForm.watch("side")} onValueChange={(v: any) => sourceForm.setValue("side", v)} data-testid="select-source-side">
                <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                  <SelectItem value="mutual">Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceLimit">Guest Limit (optional)</Label>
              <Input id="sourceLimit" type="number" {...sourceForm.register("quotaLimit")} placeholder="e.g., 50" data-testid="input-source-limit" />
              <p className="text-xs text-muted-foreground">Maximum guests this source can add</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSourceDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createSourceMutation.isPending} data-testid="button-create-source-submit">
                {createSourceMutation.isPending ? "Adding..." : "Add Source"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Suggestion</DialogTitle>
            <DialogDescription>
              Rejecting: {selectedSuggestion?.householdName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason (optional)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Let them know why this was rejected..."
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSuggestion) {
                  rejectSuggestionMutation.mutate({ id: selectedSuggestion.id, reason: rejectReason });
                }
              }}
              disabled={rejectSuggestionMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectSuggestionMutation.isPending ? "Rejecting..." : "Reject Suggestion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
