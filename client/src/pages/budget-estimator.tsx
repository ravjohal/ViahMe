import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Calculator, 
  Users, 
  DollarSign, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Settings2, 
  Check,
  TrendingDown,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Building2,
  Loader2
} from "lucide-react";
import type { Wedding, Event, CeremonyTemplate } from "@shared/schema";
import { useCeremonyTemplatesByTradition, calculateCeremonyTotal, getCostBreakdownFromTemplate } from "@/hooks/use-ceremony-templates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type VenueClass,
  type VendorTier,
  VENUE_CLASS_MULTIPLIERS,
  VENDOR_TIER_MULTIPLIERS,
  GUEST_BRACKET_MULTIPLIERS,
  getGuestBracket,
  CITY_MULTIPLIERS,
  VENUE_CLASS_LABELS,
  VENDOR_TIER_LABELS,
} from "@shared/pricing";
import { CEREMONY_COST_BREAKDOWNS, calculateCeremonyTotalRange, type CostCategory } from "@shared/ceremonies";

const TRADITION_LABELS: Record<string, string> = {
  sikh: "Sikh",
  hindu: "Hindu",
  muslim: "Muslim",
  gujarati: "Gujarati",
  south_indian: "South Indian",
  christian: "Christian",
  jain: "Jain",
  parsi: "Parsi",
  mixed: "Mixed / Fusion",
  other: "Other",
};

const CITY_LABELS: Record<string, string> = {
  bay_area: "Bay Area",
  nyc: "New York City",
  la: "Los Angeles",
  chicago: "Chicago",
  seattle: "Seattle",
  other: "Other",
};

interface EventEstimate {
  id: string;
  name: string;
  originalGuests: number;
  currentGuests: number;
  minGuests: number;
  maxGuests: number;
  venueClass: VenueClass;
  vendorTier: VendorTier;
  costLow: number;
  costHigh: number;
  originalCostLow: number;
  originalCostHigh: number;
  hasCostBreakdown: boolean;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export default function BudgetEstimatorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings[0];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const [selectedTradition, setSelectedTradition] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [globalVenueClass, setGlobalVenueClass] = useState<VenueClass>("community_hall");
  const [globalVendorTier, setGlobalVendorTier] = useState<VendorTier>("standard");
  const [eventEstimates, setEventEstimates] = useState<EventEstimate[]>([]);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (wedding?.tradition && !selectedTradition) {
      setSelectedTradition(wedding.tradition);
    }
    if (wedding?.location && !selectedCity) {
      const location = wedding.location.toLowerCase();
      if (location.includes("bay area") || location.includes("san francisco")) {
        setSelectedCity("bay_area");
      } else if (location.includes("new york") || location.includes("nyc")) {
        setSelectedCity("nyc");
      } else if (location.includes("los angeles") || location.includes("la")) {
        setSelectedCity("la");
      } else if (location.includes("chicago")) {
        setSelectedCity("chicago");
      } else if (location.includes("seattle")) {
        setSelectedCity("seattle");
      } else {
        setSelectedCity("other");
      }
    }
  }, [wedding?.tradition, wedding?.location, selectedTradition, selectedCity]);

  const { data: traditionCeremonies = [], isLoading: ceremoniesLoading } = useCeremonyTemplatesByTradition(selectedTradition || "hindu");

  const ceremonyNameMap: Record<string, string> = useMemo(() => ({
    'roka': 'sikh_roka',
    'engagement': 'sikh_engagement',
    'chunni chadana': 'sikh_chunni_chadana',
    'chunni': 'sikh_chunni_chadana',
    'paath': 'sikh_paath',
    'akhand paath': 'sikh_paath',
    'sehaj paath': 'sikh_paath',
    'bakra party': 'sikh_bakra_party',
    'bakra': 'sikh_bakra_party',
    'mayian': 'sikh_mayian',
    'maiyan': 'sikh_mayian',
    'choora': 'sikh_mayian',
    'vatna': 'sikh_mayian',
    'anand karaj': 'sikh_anand_karaj',
    'day after visit': 'sikh_day_after',
    'day after': 'sikh_day_after',
    'haldi': 'hindu_haldi',
    'baraat': 'hindu_baraat',
    'wedding ceremony': 'hindu_wedding',
    'nikah': 'muslim_nikah',
    'walima': 'muslim_walima',
    'dholki': 'muslim_dholki',
    'pithi': 'gujarati_pithi',
    'garba': 'gujarati_garba',
    'grahshanti': 'gujarati_grahshanti',
    'vidhi mandap': 'south_indian_vidhi_mandap',
    'muhurtham': 'south_indian_muhurtham',
    'saree ceremony': 'south_indian_saree_ceremony',
    'mehndi': 'sikh_mehndi',
    'sangeet': 'sikh_sangeet',
    'reception': 'sikh_reception',
  }), []);

  const getCeremonyBreakdown = (eventName: string): { ceremonyId: string; breakdown: CostCategory[] } | null => {
    const normalizedName = eventName.toLowerCase().trim();
    
    for (const [keyword, ceremonyId] of Object.entries(ceremonyNameMap)) {
      if (normalizedName === keyword && CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
        return { ceremonyId, breakdown: CEREMONY_COST_BREAKDOWNS[ceremonyId] };
      }
    }
    
    for (const [keyword, ceremonyId] of Object.entries(ceremonyNameMap)) {
      if (normalizedName.includes(keyword) && CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
        return { ceremonyId, breakdown: CEREMONY_COST_BREAKDOWNS[ceremonyId] };
      }
    }
    
    if (normalizedName.includes('reception') && CEREMONY_COST_BREAKDOWNS['reception']) {
      return { ceremonyId: 'reception', breakdown: CEREMONY_COST_BREAKDOWNS['reception'] };
    }
    
    return null;
  };

  const calculateEventCost = (
    eventName: string,
    guests: number,
    venueClass: VenueClass,
    vendorTier: VendorTier
  ): { low: number; high: number } => {
    const cityMultiplier = CITY_MULTIPLIERS[selectedCity] || 1.0;
    const venueMultiplier = VENUE_CLASS_MULTIPLIERS[venueClass];
    const vendorMultiplier = VENDOR_TIER_MULTIPLIERS[vendorTier];
    const guestBracketMultiplier = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(guests)];
    const totalMultiplier = venueMultiplier * vendorMultiplier * cityMultiplier * guestBracketMultiplier;

    const breakdown = getCeremonyBreakdown(eventName);
    
    if (breakdown) {
      let totalLow = 0;
      let totalHigh = 0;
      
      for (const item of breakdown.breakdown) {
        if (item.unit === "per_person") {
          totalLow += Math.round(item.lowCost * guests * totalMultiplier);
          totalHigh += Math.round(item.highCost * guests * totalMultiplier);
        } else if (item.unit === "per_hour") {
          const hoursLow = item.hoursLow ?? 3;
          const hoursHigh = item.hoursHigh ?? 4;
          totalLow += Math.round(item.lowCost * hoursLow * totalMultiplier);
          totalHigh += Math.round(item.highCost * hoursHigh * totalMultiplier);
        } else {
          totalLow += Math.round(item.lowCost * totalMultiplier);
          totalHigh += Math.round(item.highCost * totalMultiplier);
        }
      }
      
      return { low: totalLow, high: totalHigh };
    }

    const baseLow = 50 * guests * totalMultiplier;
    const baseHigh = 100 * guests * totalMultiplier;
    return { low: Math.round(baseLow), high: Math.round(baseHigh) };
  };

  useEffect(() => {
    if (events.length > 0 && eventEstimates.length === 0) {
      const estimates: EventEstimate[] = events.map(event => {
        const originalGuests = event.guestCount || 100;
        const minGuests = Math.max(20, Math.floor(originalGuests * 0.3));
        const maxGuests = Math.max(minGuests + 50, originalGuests, Math.ceil(originalGuests * 1.5));
        const breakdown = getCeremonyBreakdown(event.name);
        const costs = calculateEventCost(event.name, originalGuests, globalVenueClass, globalVendorTier);
        
        return {
          id: event.id,
          name: event.name,
          originalGuests,
          currentGuests: originalGuests,
          minGuests,
          maxGuests,
          venueClass: globalVenueClass,
          vendorTier: globalVendorTier,
          costLow: costs.low,
          costHigh: costs.high,
          originalCostLow: costs.low,
          originalCostHigh: costs.high,
          hasCostBreakdown: !!breakdown,
        };
      });
      setEventEstimates(estimates);
    }
  }, [events, eventEstimates.length, globalVenueClass, globalVendorTier]);

  useEffect(() => {
    if (eventEstimates.length > 0) {
      setEventEstimates(prev => prev.map(est => {
        const costs = calculateEventCost(est.name, est.currentGuests, est.venueClass, est.vendorTier);
        const originalCosts = calculateEventCost(est.name, est.originalGuests, est.venueClass, est.vendorTier);
        return {
          ...est,
          costLow: costs.low,
          costHigh: costs.high,
          originalCostLow: originalCosts.low,
          originalCostHigh: originalCosts.high,
        };
      }));
    }
  }, [selectedCity, eventEstimates.length]);

  const updateEventGuestCount = (eventId: string, guests: number) => {
    setEventEstimates(prev => prev.map(est => {
      if (est.id === eventId) {
        const costs = calculateEventCost(est.name, guests, est.venueClass, est.vendorTier);
        return { ...est, currentGuests: guests, costLow: costs.low, costHigh: costs.high };
      }
      return est;
    }));
  };

  const updateEventVenueClass = (eventId: string, venueClass: VenueClass) => {
    setEventEstimates(prev => prev.map(est => {
      if (est.id === eventId) {
        const costs = calculateEventCost(est.name, est.currentGuests, venueClass, est.vendorTier);
        const originalCosts = calculateEventCost(est.name, est.originalGuests, venueClass, est.vendorTier);
        return { 
          ...est, 
          venueClass, 
          costLow: costs.low, 
          costHigh: costs.high,
          originalCostLow: originalCosts.low,
          originalCostHigh: originalCosts.high,
        };
      }
      return est;
    }));
  };

  const updateEventVendorTier = (eventId: string, vendorTier: VendorTier) => {
    setEventEstimates(prev => prev.map(est => {
      if (est.id === eventId) {
        const costs = calculateEventCost(est.name, est.currentGuests, est.venueClass, vendorTier);
        const originalCosts = calculateEventCost(est.name, est.originalGuests, est.venueClass, vendorTier);
        return { 
          ...est, 
          vendorTier, 
          costLow: costs.low, 
          costHigh: costs.high,
          originalCostLow: originalCosts.low,
          originalCostHigh: originalCosts.high,
        };
      }
      return est;
    }));
  };

  const applyGlobalSettings = () => {
    setEventEstimates(prev => prev.map(est => {
      const costs = calculateEventCost(est.name, est.currentGuests, globalVenueClass, globalVendorTier);
      const originalCosts = calculateEventCost(est.name, est.originalGuests, globalVenueClass, globalVendorTier);
      return {
        ...est,
        venueClass: globalVenueClass,
        vendorTier: globalVendorTier,
        costLow: costs.low,
        costHigh: costs.high,
        originalCostLow: originalCosts.low,
        originalCostHigh: originalCosts.high,
      };
    }));
    toast({ title: "Settings applied", description: "Venue and vendor settings applied to all events" });
  };

  const resetAll = () => {
    setEventEstimates(prev => prev.map(est => {
      const costs = calculateEventCost(est.name, est.originalGuests, est.venueClass, est.vendorTier);
      return {
        ...est,
        currentGuests: est.originalGuests,
        costLow: costs.low,
        costHigh: costs.high,
      };
    }));
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const totals = useMemo(() => {
    const currentLow = eventEstimates.reduce((sum, e) => sum + e.costLow, 0);
    const currentHigh = eventEstimates.reduce((sum, e) => sum + e.costHigh, 0);
    const originalLow = eventEstimates.reduce((sum, e) => sum + e.originalCostLow, 0);
    const originalHigh = eventEstimates.reduce((sum, e) => sum + e.originalCostHigh, 0);
    return { currentLow, currentHigh, originalLow, originalHigh };
  }, [eventEstimates]);

  const totalGuestsReduced = eventEstimates.reduce((sum, e) => sum + (e.originalGuests - e.currentGuests), 0);
  const hasChanges = eventEstimates.some(e => e.currentGuests !== e.originalGuests);
  const totalSavings = ((totals.originalLow + totals.originalHigh) / 2) - ((totals.currentLow + totals.currentHigh) / 2);

  const updateWeddingBudgetMutation = useMutation({
    mutationFn: async (budget: number) => {
      if (!wedding?.id) throw new Error("No wedding");
      return apiRequest("PATCH", `/api/weddings/${wedding.id}`, { totalBudget: budget.toString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      toast({ title: "Budget updated", description: "Your total budget has been set based on the estimate" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    },
  });

  const handleApplyBudget = () => {
    const averageBudget = Math.round((totals.currentLow + totals.currentHigh) / 2);
    updateWeddingBudgetMutation.mutate(averageBudget);
  };

  if (weddingsLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/budget")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Calculator className="w-6 h-6 text-emerald-600" />
              Budget Estimator
            </h1>
            <p className="text-sm text-muted-foreground">
              Estimate costs for your wedding and see how guest counts affect your budget
            </p>
          </div>
        </div>

        <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">How This Works</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                We show cost estimates for each of your ceremonies based on typical pricing. 
                Use the sliders to adjust guest counts and see how it affects your total budget — 
                great for having "the conversation" with family about the guest list!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Global Settings
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              data-testid="button-toggle-global-settings"
            >
              {showGlobalSettings ? "Hide" : "Show"} Settings
            </Button>
          </div>

          {showGlobalSettings && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tradition</Label>
                  <Select value={selectedTradition} onValueChange={setSelectedTradition}>
                    <SelectTrigger data-testid="select-tradition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRADITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    City
                  </Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger data-testid="select-city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Venue Type
                  </Label>
                  <Select value={globalVenueClass} onValueChange={(v) => setGlobalVenueClass(v as VenueClass)}>
                    <SelectTrigger data-testid="select-global-venue">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VENUE_CLASS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Vendor Tier</Label>
                  <Select value={globalVendorTier} onValueChange={(v) => setGlobalVendorTier(v as VendorTier)}>
                    <SelectTrigger data-testid="select-global-vendor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VENDOR_TIER_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={applyGlobalSettings} className="w-full" data-testid="button-apply-global">
                <Check className="w-4 h-4 mr-2" />
                Apply to All Events
              </Button>
            </div>
          )}
        </Card>

        {hasChanges && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-200 dark:bg-green-800">
                  <TrendingDown className="w-5 h-5 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    By reducing <span className="font-bold">{totalGuestsReduced}</span> guests total
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    You could save {formatCurrency(Math.round(totalSavings))}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAll}
                data-testid="button-reset-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Ceremonies ({eventEstimates.length})
            </h2>
            <Badge variant="secondary">
              {eventEstimates.reduce((sum, e) => sum + e.currentGuests, 0)} total guests
            </Badge>
          </div>

          {eventEstimates.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No events found. Add events to your wedding to see cost estimates.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation("/timeline")}
                data-testid="button-add-events"
              >
                Add Events
              </Button>
            </Card>
          ) : (
            eventEstimates.map((event) => {
              const isExpanded = expandedEvents.has(event.id);
              const guestsChanged = event.currentGuests !== event.originalGuests;
              const guestsReduced = event.originalGuests - event.currentGuests;
              const eventSavings = ((event.originalCostLow + event.originalCostHigh) / 2) - ((event.costLow + event.costHigh) / 2);

              return (
                <Card key={event.id} className="overflow-hidden" data-testid={`event-card-${event.id}`}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleEventExpanded(event.id)}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{event.name}</h4>
                          {!event.hasCostBreakdown && (
                            <Badge variant="outline" className="text-xs">Estimated</Badge>
                          )}
                          {guestsChanged && guestsReduced > 0 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200"
                            >
                              -{guestsReduced} guests
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(event.costLow)} - {formatCurrency(event.costHigh)}
                          </p>
                          {guestsChanged && eventSavings > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Save {formatCurrency(Math.round(eventSavings))}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Guest count</span>
                          <span className="font-bold text-lg">{event.currentGuests}</span>
                        </div>
                        <Slider
                          value={[event.currentGuests]}
                          onValueChange={(val) => updateEventGuestCount(event.id, val[0])}
                          min={event.minGuests}
                          max={event.maxGuests}
                          step={5}
                          className="w-full"
                          data-testid={`slider-guests-${event.id}`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{event.minGuests}</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            Original: {event.originalGuests}
                          </span>
                          <span>{event.maxGuests}</span>
                        </div>
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3"
                          data-testid={`button-expand-${event.id}`}
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          {isExpanded ? "Hide" : "Adjust"} venue & vendor settings
                          {isExpanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Venue Type</Label>
                            <Select 
                              value={event.venueClass} 
                              onValueChange={(v) => updateEventVenueClass(event.id, v as VenueClass)}
                            >
                              <SelectTrigger className="h-9" data-testid={`select-venue-${event.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(VENUE_CLASS_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Vendor Tier</Label>
                            <Select 
                              value={event.vendorTier} 
                              onValueChange={(v) => updateEventVendorTier(event.id, v as VendorTier)}
                            >
                              <SelectTrigger className="h-9" data-testid={`select-vendor-${event.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(VENDOR_TIER_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>

        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Total Budget</p>
              <p className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totals.currentLow)} - {formatCurrency(totals.currentHigh)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Average: {formatCurrency(Math.round((totals.currentLow + totals.currentHigh) / 2))}
              </p>
            </div>
            <Button 
              onClick={handleApplyBudget}
              disabled={updateWeddingBudgetMutation.isPending}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-apply-budget"
            >
              {updateWeddingBudgetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Set as My Budget
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will set your total wedding budget to the average estimated amount. You can always adjust it later.
          </p>
        </Card>
      </main>
    </div>
  );
}
