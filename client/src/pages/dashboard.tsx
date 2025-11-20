import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimelineView } from "@/components/timeline-view";
import { BudgetDashboard } from "@/components/budget-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, Briefcase, FileText, Camera, CalendarClock } from "lucide-react";
import { useLocation } from "wouter";
import type { Wedding, Event, BudgetCategory, Contract, Vendor } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: budgetCategories = [], isLoading: budgetLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Redirect to onboarding if no wedding exists
  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  if (weddingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
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
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Your Wedding Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage every aspect of your {wedding.tradition} celebration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/timeline")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-1/10">
                <Calendar className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-events-count">
                  {events.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/vendors")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-2/10">
                <Briefcase className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-vendors-count">
                  {vendors.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/budget")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <DollarSign className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-mono text-xl font-bold">
                  ${parseFloat(wedding.totalBudget || "0").toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/contracts")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <FileText className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contracts</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-contracts-count">
                  {contracts.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/guests")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-5/10">
                <Users className="w-6 h-6 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-guests-count">
                  {wedding.guestCountEstimate || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/photo-gallery")} data-testid="nav-photo-gallery">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Photo Gallery</p>
                <p className="text-xs text-muted-foreground">Inspiration & Events</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer" onClick={() => setLocation("/vendor-availability")} data-testid="nav-vendor-availability">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <CalendarClock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor Availability</p>
                <p className="text-xs text-muted-foreground">Book vendors instantly</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="timeline" data-testid="tab-timeline">
              <Calendar className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            {eventsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-64 w-full" />
              </Card>
            ) : (
              <TimelineView events={events} />
            )}
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            {budgetLoading ? (
              <Card className="p-6">
                <Skeleton className="h-64 w-full" />
              </Card>
            ) : (
              <BudgetDashboard
                categories={budgetCategories}
                totalBudget={wedding.totalBudget || "0"}
              />
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8 p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Ready to Find Vendors?
              </h3>
              <p className="text-muted-foreground">
                Browse our curated directory of culturally-specialized service providers
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/vendors")}
              data-testid="button-browse-vendors"
              className="shrink-0"
            >
              Browse Vendors
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
