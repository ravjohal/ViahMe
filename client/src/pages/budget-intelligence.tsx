import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { BudgetAnalyticsResponse } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function BudgetIntelligence() {
  // Fetch wedding data
  const { data: weddings } = useQuery({
    queryKey: ["/api/weddings"],
  });
  const wedding = Array.isArray(weddings) && weddings.length > 0 ? weddings[weddings.length - 1] : undefined;

  // Fetch budget analytics
  const { data: analytics, isLoading } = useQuery<BudgetAnalyticsResponse>({
    queryKey: ["/api/budget-analytics", wedding?.id],
    enabled: !!wedding?.id,
  });

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Alert data-testid="alert-no-wedding">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Wedding Found</AlertTitle>
            <AlertDescription>
              Complete the onboarding process to create your wedding and access budget intelligence.
            </AlertDescription>
          </Alert>
          <Link href="/" data-testid="link-onboarding">
            <Button className="mt-4">Start Onboarding</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Alert data-testid="alert-no-analytics">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Budget Analytics Unavailable</AlertTitle>
            <AlertDescription>
              Unable to load budget analytics data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const totalBudget = analytics.wedding.totalBudget ? parseFloat(analytics.wedding.totalBudget) : 0;
  const totalAllocated = analytics.currentBudget.reduce(
    (sum: number, bc: any) => sum + parseFloat(bc.allocated),
    0
  );
  const totalSpent = analytics.currentBudget.reduce(
    (sum: number, bc: any) => sum + parseFloat(bc.spent),
    0
  );

  const CHART_COLORS = [
    "hsl(28, 88%, 53%)",
    "hsl(32, 85%, 60%)",
    "hsl(24, 90%, 48%)",
    "hsl(36, 82%, 55%)",
    "hsl(20, 93%, 45%)",
    "hsl(40, 80%, 58%)",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <Link href="/budget" data-testid="link-back-budget">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="heading-page-title">
                Budget Intelligence
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Smart recommendations based on {analytics.wedding.tradition} weddings in{" "}
                {analytics.wedding.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-budget">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-budget">
                ${totalBudget.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-allocated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Allocated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-allocated">
                ${totalAllocated.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((totalAllocated / totalBudget) * 100).toFixed(0)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-spent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-spent">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((totalSpent / totalBudget) * 100).toFixed(0)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-remaining">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-remaining">
                ${(totalBudget - totalSpent).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(((totalBudget - totalSpent) / totalBudget) * 100).toFixed(0)}% remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Smart Recommendations */}
        <Card data-testid="card-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              Personalized insights based on {analytics.benchmarks.length} benchmark categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.recommendations.map((rec: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg border bg-card/50"
                data-testid={`recommendation-${idx}`}
              >
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget vs Benchmarks Comparison */}
        <Card data-testid="card-benchmark-comparison">
          <CardHeader>
            <CardTitle>Your Budget vs {analytics.wedding.city} Benchmarks</CardTitle>
            <CardDescription>
              Compare your allocations to typical {analytics.wedding.tradition} wedding spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={analytics.benchmarks.map((b: any) => {
                  const currentCategory = analytics.currentBudget.find(
                    (cb: any) => cb.category === b.category
                  );
                  return {
                    category: b.category,
                    average: parseFloat(b.averageSpend),
                    min: parseFloat(b.minSpend),
                    max: parseFloat(b.maxSpend),
                    yourBudget: currentCategory ? parseFloat(currentCategory.allocated) : 0,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="average" fill={CHART_COLORS[0]} name="City Average" />
                <Bar dataKey="yourBudget" fill={CHART_COLORS[3]} name="Your Budget" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor Cost Comparison */}
        <Card data-testid="card-vendor-comparison">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendor Marketplace Analysis
            </CardTitle>
            <CardDescription>
              Price range distribution across vendor categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.vendorComparison.slice(0, 8).map((vc: any) => (
                <div key={vc.category} className="space-y-2" data-testid={`vendor-category-${vc.category}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{vc.category.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">
                        {vc.vendorCount} vendors · Avg rating: {vc.averageRating}★
                      </p>
                    </div>
                    <Badge variant="outline" data-testid={`badge-vendor-count-${vc.category}`}>
                      {vc.vendorCount} available
                    </Badge>
                  </div>
                  <div className="flex gap-1 h-2">
                    {["$", "$$", "$$$", "$$$$"].map((range) => {
                      const count = vc.priceRangeDistribution[range] || 0;
                      const percentage = (count / vc.vendorCount) * 100;
                      return (
                        <div
                          key={range}
                          className="bg-primary/20 rounded-full"
                          style={{ width: `${percentage}%` }}
                          title={`${range}: ${count} vendors (${percentage.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>$ ({vc.priceRangeDistribution["$"]})</span>
                    <span>$$ ({vc.priceRangeDistribution["$$"]})</span>
                    <span>$$$ ({vc.priceRangeDistribution["$$$"]})</span>
                    <span>$$$$ ({vc.priceRangeDistribution["$$$$"]})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* City Comparison */}
        <Card data-testid="card-city-insights">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {analytics.wedding.city} Wedding Insights
            </CardTitle>
            <CardDescription>
              Based on {analytics.benchmarks[0]?.sampleSize || 0}+ {analytics.wedding.tradition} weddings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Most Popular Category</p>
                  <p className="text-2xl font-bold mt-1">Catering</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average: $
                    {parseFloat(
                      analytics.benchmarks.find((b: any) => b.category === "Catering")?.averageSpend || "0"
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Recommended Budget %</p>
                  <p className="text-2xl font-bold mt-1">
                    {analytics.benchmarks.find((b: any) => b.category === "Catering")?.percentageOfBudget || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">For catering services</p>
                </div>
              </div>
              <Link href="/vendors" data-testid="link-browse-vendors">
                <Button className="w-full">Browse Vendors in {analytics.wedding.city}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
