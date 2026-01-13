import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Wedding, Event, BudgetScenario, BudgetForecast } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Plus,
  Trash2,
  Save,
  Copy,
  AlertTriangle,
  Calculator,
  LineChart,
  PiggyBank,
  Target,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";
import { format } from "date-fns";

interface ScenarioFormData {
  name: string;
  description: string;
  guestCount: number;
  guestCountChange: number;
  venueMultiplier: number;
  cateringMultiplier: number;
  overallMultiplier: number;
}

export default function ScenarioPlanner() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("scenarios");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: "",
    description: "",
    guestCount: 200,
    guestCountChange: 0,
    venueMultiplier: 1.0,
    cateringMultiplier: 1.0,
    overallMultiplier: 1.0,
  });

  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<BudgetScenario[]>({
    queryKey: ["/api/budget/scenarios", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery<BudgetForecast>({
    queryKey: ["/api/budget/forecast", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: expenseTotals } = useQuery<{
    totalSpent: number;
    totalAllocated: number;
  }>({
    queryKey: ["/api/expenses", wedding?.id, "totals"],
    enabled: !!wedding?.id,
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      return apiRequest("POST", "/api/budget/scenarios", {
        weddingId: wedding?.id,
        name: data.name,
        description: data.description,
        guestCount: data.guestCount,
        guestCountChange: data.guestCountChange,
        venueMultiplier: data.venueMultiplier.toString(),
        cateringMultiplier: data.cateringMultiplier.toString(),
        overallMultiplier: data.overallMultiplier.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/scenarios", wedding?.id] });
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        guestCount: 200,
        guestCountChange: 0,
        venueMultiplier: 1.0,
        cateringMultiplier: 1.0,
        overallMultiplier: 1.0,
      });
      toast({ title: "Scenario created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create scenario", variant: "destructive" });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/budget/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/scenarios", wedding?.id] });
      toast({ title: "Scenario deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete scenario", variant: "destructive" });
    },
  });

  const totalBudget = wedding?.totalBudget ? parseFloat(wedding.totalBudget) : 0;
  const baseGuestCount = wedding?.guestCount || 200;

  const calculateScenarioImpact = useMemo(() => {
    return (scenario: ScenarioFormData) => {
      const perPersonCost = totalBudget > 0 && baseGuestCount > 0 
        ? (totalBudget * 0.6) / baseGuestCount 
        : 150;
      
      const guestImpact = scenario.guestCountChange * perPersonCost;
      const venueImpact = totalBudget * 0.25 * (scenario.venueMultiplier - 1);
      const cateringImpact = totalBudget * 0.35 * (scenario.cateringMultiplier - 1);
      const overallImpact = totalBudget * (scenario.overallMultiplier - 1);
      
      const totalImpact = guestImpact + venueImpact + cateringImpact + overallImpact;
      const newTotal = totalBudget + totalImpact;
      
      return {
        guestImpact,
        venueImpact,
        cateringImpact,
        overallImpact,
        totalImpact,
        newTotal,
        percentChange: totalBudget > 0 ? (totalImpact / totalBudget) * 100 : 0,
      };
    };
  }, [totalBudget, baseGuestCount]);

  const liveImpact = calculateScenarioImpact(formData);

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Alert data-testid="alert-no-wedding">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Wedding Found</AlertTitle>
            <AlertDescription>
              Complete the onboarding process to create your wedding and access scenario planning.
            </AlertDescription>
          </Alert>
          <Link href="/" data-testid="link-onboarding">
            <Button className="mt-4">Start Onboarding</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <Link href="/budget" data-testid="link-back-budget">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground" data-testid="heading-page-title">
                Budget Scenario Planner
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore what-if scenarios and forecast your wedding expenses
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-scenario">
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="scenarios" data-testid="tab-scenarios">
              <Calculator className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="forecast" data-testid="tab-forecast">
              <LineChart className="h-4 w-4 mr-2" />
              Financial Forecast
            </TabsTrigger>
            <TabsTrigger value="cashflow" data-testid="tab-cashflow">
              <PiggyBank className="h-4 w-4 mr-2" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-current-budget">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-guest-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Guest Count</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{baseGuestCount}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-events">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events Planned</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-scenarios-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Scenarios</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scenarios.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-testid="card-scenario-builder">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Interactive Scenario Builder
                  </CardTitle>
                  <CardDescription>
                    Adjust the sliders to see how changes affect your budget in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Guest Count Adjustment</Label>
                        <span className="text-sm font-medium">
                          {formData.guestCountChange > 0 ? "+" : ""}{formData.guestCountChange} guests
                        </span>
                      </div>
                      <Slider
                        value={[formData.guestCountChange]}
                        onValueChange={([v]) => setFormData(prev => ({ ...prev, guestCountChange: v }))}
                        min={-100}
                        max={100}
                        step={10}
                        data-testid="slider-guest-count"
                      />
                      <p className="text-xs text-muted-foreground">
                        New total: {baseGuestCount + formData.guestCountChange} guests
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Venue Tier</Label>
                        <span className="text-sm font-medium">
                          {formData.venueMultiplier === 1 ? "Standard" : 
                           formData.venueMultiplier < 1 ? `${((1 - formData.venueMultiplier) * 100).toFixed(0)}% savings` :
                           `${((formData.venueMultiplier - 1) * 100).toFixed(0)}% premium`}
                        </span>
                      </div>
                      <Slider
                        value={[formData.venueMultiplier]}
                        onValueChange={([v]) => setFormData(prev => ({ ...prev, venueMultiplier: v }))}
                        min={0.7}
                        max={1.5}
                        step={0.1}
                        data-testid="slider-venue"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Catering Level</Label>
                        <span className="text-sm font-medium">
                          {formData.cateringMultiplier === 1 ? "Standard" : 
                           formData.cateringMultiplier < 1 ? `${((1 - formData.cateringMultiplier) * 100).toFixed(0)}% savings` :
                           `${((formData.cateringMultiplier - 1) * 100).toFixed(0)}% premium`}
                        </span>
                      </div>
                      <Slider
                        value={[formData.cateringMultiplier]}
                        onValueChange={([v]) => setFormData(prev => ({ ...prev, cateringMultiplier: v }))}
                        min={0.7}
                        max={1.5}
                        step={0.1}
                        data-testid="slider-catering"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Overall Budget Adjustment</Label>
                        <span className="text-sm font-medium">
                          {formData.overallMultiplier === 1 ? "No change" : 
                           formData.overallMultiplier < 1 ? `${((1 - formData.overallMultiplier) * 100).toFixed(0)}% reduction` :
                           `${((formData.overallMultiplier - 1) * 100).toFixed(0)}% increase`}
                        </span>
                      </div>
                      <Slider
                        value={[formData.overallMultiplier]}
                        onValueChange={([v]) => setFormData(prev => ({ ...prev, overallMultiplier: v }))}
                        min={0.8}
                        max={1.3}
                        step={0.05}
                        data-testid="slider-overall"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-impact-preview">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Impact Preview
                  </CardTitle>
                  <CardDescription>
                    See how your adjustments affect the total budget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Projected New Budget</p>
                    <p className="text-4xl font-bold" data-testid="text-projected-budget">
                      ${Math.round(liveImpact.newTotal).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {liveImpact.totalImpact !== 0 && (
                        <Badge 
                          variant={liveImpact.totalImpact > 0 ? "destructive" : "default"}
                          data-testid="badge-impact"
                        >
                          {liveImpact.totalImpact > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {liveImpact.totalImpact > 0 ? "+" : ""}
                          ${Math.abs(Math.round(liveImpact.totalImpact)).toLocaleString()}
                          ({liveImpact.percentChange > 0 ? "+" : ""}{liveImpact.percentChange.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Guest Impact</span>
                      <span className={`text-sm font-medium ${liveImpact.guestImpact > 0 ? "text-red-600" : liveImpact.guestImpact < 0 ? "text-green-600" : ""}`}>
                        {liveImpact.guestImpact > 0 ? "+" : ""}${Math.round(liveImpact.guestImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Venue Impact</span>
                      <span className={`text-sm font-medium ${liveImpact.venueImpact > 0 ? "text-red-600" : liveImpact.venueImpact < 0 ? "text-green-600" : ""}`}>
                        {liveImpact.venueImpact > 0 ? "+" : ""}${Math.round(liveImpact.venueImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Catering Impact</span>
                      <span className={`text-sm font-medium ${liveImpact.cateringImpact > 0 ? "text-red-600" : liveImpact.cateringImpact < 0 ? "text-green-600" : ""}`}>
                        {liveImpact.cateringImpact > 0 ? "+" : ""}${Math.round(liveImpact.cateringImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Overall Adjustment</span>
                      <span className={`text-sm font-medium ${liveImpact.overallImpact > 0 ? "text-red-600" : liveImpact.overallImpact < 0 ? "text-green-600" : ""}`}>
                        {liveImpact.overallImpact > 0 ? "+" : ""}${Math.round(liveImpact.overallImpact).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={liveImpact.totalImpact === 0}
                    data-testid="button-save-scenario"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Scenario
                  </Button>
                </CardContent>
              </Card>
            </div>

            {scenarios.length > 0 && (
              <Card data-testid="card-saved-scenarios">
                <CardHeader>
                  <CardTitle>Saved Scenarios</CardTitle>
                  <CardDescription>Compare your saved what-if scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarios.map((scenario) => {
                      const impact = calculateScenarioImpact({
                        name: scenario.name,
                        description: scenario.description || "",
                        guestCount: scenario.guestCount,
                        guestCountChange: scenario.guestCountChange || 0,
                        venueMultiplier: parseFloat(scenario.venueMultiplier || "1"),
                        cateringMultiplier: parseFloat(scenario.cateringMultiplier || "1"),
                        overallMultiplier: parseFloat(scenario.overallMultiplier || "1"),
                      });

                      return (
                        <div 
                          key={scenario.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                          data-testid={`scenario-${scenario.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{scenario.name}</h4>
                              {scenario.isBaseline && (
                                <Badge variant="secondary">Baseline</Badge>
                              )}
                            </div>
                            {scenario.description && (
                              <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{scenario.guestCount} guests</span>
                              <span>${Math.round(impact.newTotal).toLocaleString()} total</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={impact.totalImpact > 0 ? "destructive" : impact.totalImpact < 0 ? "default" : "secondary"}>
                              {impact.totalImpact > 0 ? "+" : ""}{impact.percentChange.toFixed(1)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                              data-testid={`button-delete-scenario-${scenario.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            {forecastLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-96" />
              </div>
            ) : forecast ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card data-testid="card-committed">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Committed</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${forecast.cashFlowSummary.totalCommitted.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-paid">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${forecast.cashFlowSummary.totalPaid.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-remaining-forecast">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Still to Pay</CardTitle>
                      <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        ${forecast.cashFlowSummary.totalRemaining.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card data-testid="card-spending-projection">
                  <CardHeader>
                    <CardTitle>Spending Projection</CardTitle>
                    <CardDescription>
                      Projected cumulative spending over the next {forecast.cashFlowSummary.monthsUntilWedding} months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecast.monthlyProjections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(value) => format(new Date(value + "-01"), "MMM")}
                          />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                            labelFormatter={(label) => format(new Date(label + "-01"), "MMMM yyyy")}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="projectedSpent" 
                            name="Projected Spending"
                            stroke="#f97316" 
                            fill="#f97316" 
                            fillOpacity={0.3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="budgetRemaining" 
                            name="Remaining Budget"
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-monthly-spend">
                  <CardHeader>
                    <CardTitle>Monthly Spending Rate</CardTitle>
                    <CardDescription>
                      Average: ${forecast.cashFlowSummary.averageMonthlySpend.toLocaleString()}/month • 
                      Recommended: ${forecast.cashFlowSummary.projectedMonthlySpend.toLocaleString()}/month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecast.monthlyProjections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(value) => format(new Date(value + "-01"), "MMM")}
                          />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                            labelFormatter={(label) => format(new Date(label + "-01"), "MMMM yyyy")}
                          />
                          <Bar dataKey="upcomingPayments" name="Upcoming Payments" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No forecast data</AlertTitle>
                <AlertDescription>
                  Add expenses with payment due dates to see your financial forecast.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-6">
            {forecast && forecast.paymentSchedule.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card data-testid="card-cashflow-summary">
                    <CardHeader>
                      <CardTitle>Cash Flow Summary</CardTitle>
                      <CardDescription>
                        {forecast.cashFlowSummary.monthsUntilWedding} months until wedding
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>Avg Monthly Spend</span>
                        <span className="font-medium">${forecast.cashFlowSummary.averageMonthlySpend.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>Recommended Monthly</span>
                        <span className="font-medium">${forecast.cashFlowSummary.projectedMonthlySpend.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <span>Balance Due</span>
                        <span className="font-medium text-orange-600">${forecast.cashFlowSummary.totalRemaining.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-payment-schedule">
                    <CardHeader>
                      <CardTitle>Upcoming Payments</CardTitle>
                      <CardDescription>Scheduled payments based on due dates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {forecast.paymentSchedule.slice(0, 10).map((payment, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-3 border rounded-lg"
                              data-testid={`payment-${idx}`}
                            >
                              <div>
                                <p className="font-medium text-sm">{payment.vendor}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.date), "MMM d, yyyy")}
                                </p>
                              </div>
                              <span className="font-medium">${payment.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          {forecast.paymentSchedule.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No upcoming payments scheduled
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No payment schedule</AlertTitle>
                <AlertDescription>
                  Add payment due dates to your expenses to see your cash flow projection.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-scenario">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save this scenario for future comparison
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bigger Guest List"
                data-testid="input-scenario-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description (optional)</Label>
              <Input
                id="scenario-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this scenario"
                data-testid="input-scenario-description"
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Scenario Summary</p>
              <div className="text-sm space-y-1">
                <p>Guests: {baseGuestCount + formData.guestCountChange}</p>
                <p>Projected Total: ${Math.round(liveImpact.newTotal).toLocaleString()}</p>
                <p>Impact: {liveImpact.totalImpact > 0 ? "+" : ""}${Math.round(liveImpact.totalImpact).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={() => createScenarioMutation.mutate({
                  ...formData,
                  guestCount: baseGuestCount + formData.guestCountChange,
                })}
                disabled={!formData.name || createScenarioMutation.isPending}
                data-testid="button-save"
              >
                {createScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
