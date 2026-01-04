import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CeremonyCostBreakdown } from "@/components/ceremony-cost-breakdown";
import { ArrowLeft, DollarSign, Sparkles, Calendar, Users, AlertCircle } from "lucide-react";
import { CEREMONY_COST_BREAKDOWNS, CEREMONY_CATALOG, calculateCeremonyTotalRange } from "@shared/ceremonies";
import type { Wedding, Event, BudgetCategory } from "@shared/schema";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function getCeremonyIdFromEvent(event: Event): string | null {
  if ((event as any).ceremonyId && CEREMONY_COST_BREAKDOWNS[(event as any).ceremonyId]) {
    return (event as any).ceremonyId;
  }
  
  const eventType = event.type?.toLowerCase() || "";
  const eventName = event.name?.toLowerCase() || "";
  
  const mappings: Record<string, string[]> = {
    hindu_mehndi: ["mehndi", "henna"],
    hindu_sangeet: ["sangeet", "lady sangeet"],
    hindu_haldi: ["haldi"],
    sikh_maiyan: ["maiyan"],
    hindu_baraat: ["baraat"],
    hindu_wedding: ["hindu wedding", "wedding ceremony"],
    reception: ["reception"],
    sikh_anand_karaj: ["anand karaj", "anand_karaj"],
    muslim_nikah: ["nikah"],
    muslim_walima: ["walima"],
    muslim_dholki: ["dholki"],
    gujarati_pithi: ["pithi"],
    gujarati_garba: ["garba"],
    gujarati_wedding: ["gujarati wedding"],
    south_indian_muhurtham: ["muhurtham"],
    general_wedding: ["general wedding", "western wedding"],
    rehearsal_dinner: ["rehearsal dinner", "rehearsal"],
    cocktail_hour: ["cocktail hour", "cocktail"],
  };
  
  for (const [ceremonyId, keywords] of Object.entries(mappings)) {
    if (keywords.some(kw => eventName.includes(kw) || eventType.includes(kw))) {
      return ceremonyId;
    }
  }
  
  if (CEREMONY_COST_BREAKDOWNS[eventType]) {
    return eventType;
  }
  
  return null;
}

export default function CostBreakdown() {
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

  const isLoading = weddingsLoading || eventsLoading || budgetLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Wedding Found</h2>
          <p className="text-muted-foreground mb-4">Please complete your onboarding first.</p>
          <Button onClick={() => setLocation("/onboarding")}>
            Get Started
          </Button>
        </Card>
      </div>
    );
  }

  const eventsWithBreakdowns = events.filter(event => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    return ceremonyId && CEREMONY_COST_BREAKDOWNS[ceremonyId];
  });

  const estimateTotalLow = eventsWithBreakdowns.reduce((sum, event) => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    if (!ceremonyId) return sum;
    const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
    const guestCount = event.guestCount || ceremony?.defaultGuests || 100;
    const range = calculateCeremonyTotalRange(ceremonyId, guestCount);
    return sum + range.low;
  }, 0);

  const estimateTotalHigh = eventsWithBreakdowns.reduce((sum, event) => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    if (!ceremonyId) return sum;
    const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
    const guestCount = event.guestCount || ceremony?.defaultGuests || 100;
    const range = calculateCeremonyTotalRange(ceremonyId, guestCount);
    return sum + range.high;
  }, 0);

  const totalGuests = events.reduce((sum, e) => sum + (e.guestCount || 0), 0) || wedding.guestCountEstimate || 0;
  const totalBudget = wedding.totalBudget ? parseFloat(wedding.totalBudget.toString()) : 0;
  const allocatedTotal = budgetCategories.reduce((sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()), 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cost Breakdown</h1>
          <p className="text-sm text-muted-foreground">Detailed estimates by event and category</p>
        </div>
      </div>

      <Card className="p-4 md:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Summary</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 mx-auto mb-1 text-pink-600" />
            <p className="text-2xl font-bold">{totalGuests}</p>
            <p className="text-xs text-muted-foreground">Total Guests</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{formatCurrency(allocatedTotal)}</p>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </div>
        </div>

        {eventsWithBreakdowns.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Total Range</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(estimateTotalLow)} - {formatCurrency(estimateTotalHigh)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {eventsWithBreakdowns.length} events with estimates
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {eventsWithBreakdowns.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Event-by-Event Breakdown</h2>
          </div>
          <CeremonyCostBreakdown events={events} />
        </div>
      ) : (
        <Card className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Cost Estimates Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Add events to your timeline to see detailed cost breakdowns. We have estimates for common South Asian wedding ceremonies.
          </p>
          <Button onClick={() => setLocation("/timeline")} data-testid="button-go-to-timeline">
            Go to Timeline
          </Button>
        </Card>
      )}

      {budgetCategories.length > 0 && (
        <Card className="p-4 md:p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Budget Categories</h2>
          <div className="space-y-3">
            {budgetCategories.map((category) => {
              const allocated = parseFloat(category.allocatedAmount.toString());
              const spent = parseFloat(category.spentAmount?.toString() || "0");
              const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
              
              return (
                <div key={category.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{category.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[150px]">
                        <div 
                          className={`h-full rounded-full ${percentage > 100 ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(allocated)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(spent)} spent
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
