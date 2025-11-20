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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Your Wedding Dashboard
          </h1>
          <p className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Manage every aspect of your {wedding.tradition} celebration 🎊
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50" onClick={() => setLocation("/timeline")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-600">Events</p>
                <p className="font-mono text-2xl font-bold text-orange-700" data-testid="stat-events-count">
                  {events.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" onClick={() => setLocation("/vendors")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">Vendors</p>
                <p className="font-mono text-2xl font-bold text-blue-700" data-testid="stat-vendors-count">
                  {vendors.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50" onClick={() => setLocation("/budget")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600">Budget</p>
                <p className="font-mono text-xl font-bold text-emerald-700">
                  ${parseFloat(wedding.totalBudget || "0").toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50" onClick={() => setLocation("/contracts")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-600">Contracts</p>
                <p className="font-mono text-2xl font-bold text-purple-700" data-testid="stat-contracts-count">
                  {contracts.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50" onClick={() => setLocation("/guests")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pink-600">Guests</p>
                <p className="font-mono text-2xl font-bold text-pink-700" data-testid="stat-guests-count">
                  {wedding.guestCountEstimate || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" onClick={() => setLocation("/photo-gallery")} data-testid="nav-photo-gallery">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-600">Photo Gallery</p>
                <p className="text-xs text-amber-700">Inspiration & Events</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate transition-all cursor-pointer border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50" onClick={() => setLocation("/vendor-availability")} data-testid="nav-vendor-availability">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                <CalendarClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-600">Vendor Availability</p>
                <p className="text-xs text-violet-700">Book vendors instantly</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid bg-gradient-to-r from-orange-100 via-pink-100 to-purple-100 p-1 h-12">
            <TabsTrigger value="timeline" data-testid="tab-timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <Calendar className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
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

        <Card className="mt-8 p-8 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 border-2 border-orange-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Ready to Find Vendors?
              </h3>
              <p className="text-lg font-semibold text-orange-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Browse our curated directory of culturally-specialized service providers 🎊
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/vendors")}
              data-testid="button-browse-vendors"
              className="shrink-0 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
            >
              Browse Vendors
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
