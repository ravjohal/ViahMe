import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimelineView } from "@/components/timeline-view";
import { BudgetDashboard } from "@/components/budget-dashboard";
import { WelcomeTour } from "@/components/welcome-tour";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, DollarSign, Users, Briefcase, FileText, Camera, Clock, MapPin, Tag } from "lucide-react";
import { useLocation } from "wouter";
import type { Wedding, Event, BudgetCategory, Contract, Vendor, EventCostItem } from "@shared/schema";
import { format } from "date-fns";

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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  // Get the most recent wedding (sorted by createdAt descending)
  const wedding = weddings?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

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

  // Fetch cost items for the selected event
  const { data: costItems = [], isLoading: costItemsLoading } = useQuery<EventCostItem[]>({
    queryKey: ["/api/events", selectedEvent?.id, "cost-items"],
    enabled: !!selectedEvent?.id,
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
          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 dark:border-orange-800" 
            onClick={() => setLocation("/timeline")}
            data-tour="events-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Events</p>
                <p className="font-mono text-2xl font-bold text-orange-700 dark:text-orange-300" data-testid="stat-events-count">
                  {events.length}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-800" 
            onClick={() => setLocation("/vendors")}
            data-tour="vendors-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Vendors</p>
                <p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="stat-vendors-count">
                  {vendors.length}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800" 
            onClick={() => setLocation("/budget")}
            data-tour="budget-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Budget</p>
                <p className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  ${parseFloat(wedding.totalBudget || "0").toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 dark:border-purple-800" 
            onClick={() => setLocation("/contracts")}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Contracts</p>
                <p className="font-mono text-2xl font-bold text-purple-700 dark:text-purple-300" data-testid="stat-contracts-count">
                  {contracts.length}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 dark:border-pink-800" 
            onClick={() => setLocation("/guests")}
            data-tour="guests-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">Guests</p>
                <p className="font-mono text-2xl font-bold text-pink-700 dark:text-pink-300" data-testid="stat-guests-count">
                  {wedding.guestCountEstimate || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover-elevate transition-all cursor-pointer border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800" 
            onClick={() => setLocation("/photo-gallery")} 
            data-testid="nav-photo-gallery"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Photo Gallery</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Inspiration & Events</p>
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
              <TimelineView events={events} onEditEvent={setSelectedEvent} />
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

        <Card className="mt-8 p-8 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30 border-2 border-orange-300 dark:border-orange-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Ready to Find Vendors?
              </h3>
              <p className="text-lg font-semibold text-orange-700 dark:text-orange-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Browse our curated directory of culturally-specialized service providers
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

      <WelcomeTour weddingTradition={wedding.tradition} />

      <Dialog open={!!selectedEvent} onOpenChange={(open) => {
        if (!open) setSelectedEvent(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {selectedEvent.description && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Description</h3>
                    <p className="text-foreground">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.date && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Date</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{format(new Date(selectedEvent.date), "MMMM dd, yyyy")}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.time && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Time</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedEvent.time}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Location</h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.guestCount && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Guests</h3>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedEvent.guestCount} guests</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.costPerHead && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Cost Per Head</h3>
                      <span className="text-foreground font-semibold">${parseFloat(selectedEvent.costPerHead).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedEvent.venueCapacity && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Venue Capacity</h3>
                      <span className="text-foreground">{selectedEvent.venueCapacity} people</span>
                    </div>
                  )}
                </div>

                <Collapsible defaultOpen className="border rounded-lg p-4 space-y-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="font-medium">Cost Breakdown</span>
                        {costItems.length > 0 && (
                          <Badge variant="secondary" className="ml-2">{costItems.length} items</Badge>
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {costItemsLoading ? (
                      <div className="text-center text-muted-foreground py-2">Loading costs...</div>
                    ) : costItems.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">No costs added yet</div>
                    ) : (
                      <div className="space-y-2">
                        {costItems.map((item) => {
                          const linkedCategory = budgetCategories.find(c => c.id === item.categoryId);
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{item.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.costType === "per_head" ? "Per Guest" : "Fixed"}
                                </Badge>
                                {linkedCategory && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {CATEGORY_LABELS[linkedCategory.category] || linkedCategory.category}
                                  </Badge>
                                )}
                              </div>
                              <span className="font-semibold text-primary">${parseFloat(item.amount).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
