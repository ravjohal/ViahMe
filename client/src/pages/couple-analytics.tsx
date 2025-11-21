import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, CheckSquare, Calendar, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function CoupleAnalytics() {
  const { user } = useAuth();

  // Fetch wedding
  const { data: weddings } = useQuery({
    queryKey: ['/api/weddings'],
  });

  const wedding = weddings?.[0];
  const weddingId = wedding?.id;

  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/analytics/wedding', weddingId, 'summary'],
    enabled: !!weddingId,
  });

  // Fetch budget breakdown
  const { data: budgetBreakdown, isLoading: budgetLoading } = useQuery({
    queryKey: ['/api/analytics/wedding', weddingId, 'budget-breakdown'],
    enabled: !!weddingId,
  });

  // Fetch spending trends
  const { data: spendingTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/wedding', weddingId, 'spending-trends'],
    enabled: !!weddingId,
  });

  if (!wedding) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No wedding found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const budgetUtilizationPercent = summary?.budgetUtilization ? parseFloat(summary.budgetUtilization) : 0;
  const taskCompletionPercent = summary?.taskCompletionRate ? parseFloat(summary.taskCompletionRate) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wedding Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your planning progress and budget</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-couple-analytics-overview">Overview</TabsTrigger>
          <TabsTrigger value="budget" data-testid="tab-couple-analytics-budget">Budget</TabsTrigger>
          <TabsTrigger value="planning" data-testid="tab-couple-analytics-planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-total-budget">
                      ${(summary?.totalBudget ? parseFloat(summary.totalBudget) : 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(summary?.totalSpent ? parseFloat(summary.totalSpent) : 0).toLocaleString()} spent
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendors Booked</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-vendors-booked">
                      {summary?.confirmedVendors || 0}/{summary?.totalVendors || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confirmed bookings
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guest RSVPs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-guest-rsvps">
                      {summary?.confirmedGuests || 0}/{summary?.totalGuests || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confirmed attending
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Complete</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-tasks-complete">
                      {summary?.completedTasks || 0}/{summary?.totalTasks || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {taskCompletionPercent.toFixed(0)}% complete
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Budget Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Budget Utilization
              </CardTitle>
              <CardDescription>How much of your budget has been allocated</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent: ${(summary?.totalSpent ? parseFloat(summary.totalSpent) : 0).toLocaleString()}</span>
                    <span>Remaining: ${(summary?.remainingBudget ? parseFloat(summary.remainingBudget) : 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all"
                      style={{ width: `${Math.min(budgetUtilizationPercent, 100)}%` }}
                      data-testid="budget-utilization-bar"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center" data-testid="budget-utilization-text">
                    {budgetUtilizationPercent.toFixed(1)}% of budget used
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          {/* Budget Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Budget Breakdown by Category
              </CardTitle>
              <CardDescription>Your budget allocation across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : budgetBreakdown && budgetBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={budgetBreakdown.map(b => ({
                        ...b,
                        allocated: b.allocated ? parseFloat(b.allocated) : 0
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.category}: $${(entry.allocated || 0).toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="allocated"
                    >
                      {budgetBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  No budget categories created yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Category Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs. Spent by Category</CardTitle>
              <CardDescription>Compare allocated vs. actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : budgetBreakdown && budgetBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={budgetBreakdown.map(b => ({
                    category: b.category,
                    allocated: b.allocated ? parseFloat(b.allocated) : 0,
                    spent: b.spent ? parseFloat(b.spent) : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="allocated" fill="hsl(var(--primary))" name="Allocated ($)" />
                    <Bar dataKey="spent" fill="hsl(var(--chart-2))" name="Spent ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  No budget data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          {/* Events Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Planned
              </CardTitle>
              <CardDescription>Total events in your wedding timeline</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="text-4xl font-bold text-primary" data-testid="metric-total-events">
                  {summary?.totalEvents || 0}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spending Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Spending Timeline
              </CardTitle>
              <CardDescription>When you confirmed vendor bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : spendingTrends && spendingTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={spendingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Amount ($)"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  No spending data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
