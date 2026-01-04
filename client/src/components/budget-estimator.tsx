import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lightbulb, Calculator, Plus, Minus, DollarSign, Users, Info, Loader2, MapPin, ChevronDown, ChevronUp, Settings2, Check } from "lucide-react";
import type { Wedding, Event, CeremonyTemplate } from "@shared/schema";
import { useCeremonyTemplatesByTradition } from "@/hooks/use-ceremony-templates";
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
import { CEREMONY_COST_BREAKDOWNS, CEREMONY_CATALOG, type CostCategory } from "@shared/ceremonies";

interface EventEstimate {
  id: string;
  name: string;
  guests: number;
  costPerGuestLow: number;
  costPerGuestHigh: number;
  totalLow: number;
  totalHigh: number;
  isFromWedding?: boolean;
}

interface CeremonyPricingOverride {
  venueClass?: VenueClass;
  vendorTier?: VendorTier;
}

interface CustomEventBase {
  id: string;
  name: string;
  guests: number;
  baseCostPerGuestLow: number;
  baseCostPerGuestHigh: number;
  pricingOverride?: CeremonyPricingOverride;
}

interface BudgetEstimatorProps {
  wedding?: Wedding;
  events?: Event[];
  onUpdateBudget?: (budget: number) => void;
}

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

export function BudgetEstimator({ wedding, events = [], onUpdateBudget }: BudgetEstimatorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<string>(wedding?.tradition || "hindu");
  const [customEventsBase, setCustomEventsBase] = useState<CustomEventBase[]>([]);
  const [useWeddingEvents, setUseWeddingEvents] = useState(true);
  const [venueClass, setVenueClass] = useState<VenueClass>("community_hall");
  const [vendorTier, setVendorTier] = useState<VendorTier>("standard");
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const location = wedding?.location?.toLowerCase() || "";
    if (location.includes("bay area") || location.includes("san francisco")) return "bay_area";
    if (location.includes("new york") || location.includes("nyc")) return "nyc";
    if (location.includes("los angeles") || location.includes("la")) return "la";
    if (location.includes("chicago")) return "chicago";
    if (location.includes("seattle")) return "seattle";
    return "other";
  });
  const [weddingEventOverrides, setWeddingEventOverrides] = useState<Record<string, CeremonyPricingOverride>>({});
  const [collapsedCeremonyIds, setCollapsedCeremonyIds] = useState<Set<string>>(new Set());

  const { data: traditionCeremonies = [], isLoading } = useCeremonyTemplatesByTradition(selectedTradition);
  
  const getEffectiveMultiplier = (eventId: string, isCustom: boolean) => {
    const override = isCustom 
      ? customEventsBase.find(e => e.id === eventId)?.pricingOverride 
      : weddingEventOverrides[eventId];
    
    const effectiveVenue = override?.venueClass ?? venueClass;
    const effectiveVendor = override?.vendorTier ?? vendorTier;
    const cityMultiplier = CITY_MULTIPLIERS[selectedCity] || 1.0;
    
    return VENUE_CLASS_MULTIPLIERS[effectiveVenue] * VENDOR_TIER_MULTIPLIERS[effectiveVendor] * cityMultiplier;
  };

  const getCeremonyBreakdown = (eventName: string): { ceremonyId: string; breakdown: CostCategory[] } | null => {
    const normalizedName = eventName.toLowerCase().trim();
    
    const ceremonyNameMap: Record<string, string> = {
      'anand karaj': 'sikh_anand_karaj',
      'maiyan': 'sikh_maiyan',
      'mehndi': 'hindu_mehndi',
      'sangeet': 'hindu_sangeet',
      'haldi': 'hindu_haldi',
      'baraat': 'hindu_baraat',
      'wedding ceremony': 'hindu_wedding',
      'wedding': 'hindu_wedding',
      'reception': 'reception',
      'reception dinner': 'reception',
      'nikah': 'muslim_nikah',
      'walima': 'muslim_walima',
      'dholki': 'muslim_dholki',
      'pithi': 'gujarati_pithi',
      'garba': 'gujarati_garba',
      'grahshanti': 'gujarati_grahshanti',
      'vidhi mandap': 'south_indian_vidhi_mandap',
      'muhurtham': 'south_indian_muhurtham',
      'saree ceremony': 'south_indian_saree_ceremony',
    };
    
    for (const [keyword, ceremonyId] of Object.entries(ceremonyNameMap)) {
      if (normalizedName.includes(keyword) && CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
        return { ceremonyId, breakdown: CEREMONY_COST_BREAKDOWNS[ceremonyId] };
      }
    }
    
    const ceremony = CEREMONY_CATALOG.find(c => 
      c.name.toLowerCase() === normalizedName ||
      normalizedName.includes(c.name.toLowerCase())
    );
    
    if (ceremony && CEREMONY_COST_BREAKDOWNS[ceremony.id]) {
      return { ceremonyId: ceremony.id, breakdown: CEREMONY_COST_BREAKDOWNS[ceremony.id] };
    }
    
    return null;
  };

  const calculateBreakdownCost = (item: CostCategory, guests: number, multiplier: number, guestBracketMultiplier: number): { low: number; high: number } => {
    let low = 0;
    let high = 0;
    const totalMultiplier = multiplier * guestBracketMultiplier;
    
    if (item.unit === "per_person") {
      low = Math.round(item.lowCost * guests * totalMultiplier);
      high = Math.round(item.highCost * guests * totalMultiplier);
    } else if (item.unit === "per_hour") {
      const hoursLow = item.hoursLow ?? 3;
      const hoursHigh = item.hoursHigh ?? 4;
      low = Math.round(item.lowCost * hoursLow * totalMultiplier);
      high = Math.round(item.highCost * hoursHigh * totalMultiplier);
    } else {
      low = Math.round(item.lowCost * totalMultiplier);
      high = Math.round(item.highCost * totalMultiplier);
    }
    
    return { low, high };
  };

  const calculateBreakdownTotal = (breakdown: CostCategory[], guests: number, multiplier: number, guestBracketMultiplier: number): { low: number; high: number } => {
    let totalLow = 0;
    let totalHigh = 0;
    
    for (const item of breakdown) {
      const costs = calculateBreakdownCost(item, guests, multiplier, guestBracketMultiplier);
      totalLow += costs.low;
      totalHigh += costs.high;
    }
    
    return { low: totalLow, high: totalHigh };
  };

  const weddingEventEstimates: EventEstimate[] = useMemo(() => {
    if (!useWeddingEvents || events.length === 0) return [];
    
    return events.map(event => {
      const ceremony = traditionCeremonies.find(c => 
        c.name.toLowerCase() === event.name.toLowerCase() ||
        c.ceremonyId.includes(event.name.toLowerCase().replace(/\s+/g, '_'))
      );
      
      const guestCount = event.guestCount || ceremony?.defaultGuests || 150;
      const guestBracketMultiplier = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(guestCount)];
      const eventMultiplier = getEffectiveMultiplier(event.id, false);
      
      const breakdownData = getCeremonyBreakdown(event.name);
      
      if (breakdownData) {
        const breakdownTotals = calculateBreakdownTotal(breakdownData.breakdown, guestCount, eventMultiplier, guestBracketMultiplier);
        return {
          id: event.id,
          name: event.name,
          guests: guestCount,
          costPerGuestLow: Math.round(breakdownTotals.low / guestCount),
          costPerGuestHigh: Math.round(breakdownTotals.high / guestCount),
          totalLow: breakdownTotals.low,
          totalHigh: breakdownTotals.high,
          isFromWedding: true,
        };
      }
      
      const baseCostLow = ceremony ? parseFloat(ceremony.costPerGuestLow) : 50;
      const baseCostHigh = ceremony ? parseFloat(ceremony.costPerGuestHigh) : 100;
      const costLow = Math.round(baseCostLow * eventMultiplier * guestBracketMultiplier);
      const costHigh = Math.round(baseCostHigh * eventMultiplier * guestBracketMultiplier);
      
      return {
        id: event.id,
        name: event.name,
        guests: guestCount,
        costPerGuestLow: costLow,
        costPerGuestHigh: costHigh,
        totalLow: costLow * guestCount,
        totalHigh: costHigh * guestCount,
        isFromWedding: true,
      };
    });
  }, [events, useWeddingEvents, traditionCeremonies, venueClass, vendorTier, selectedCity, weddingEventOverrides]);

  const customEventEstimates: EventEstimate[] = useMemo(() => {
    return customEventsBase.map(ce => {
      const guestBracketMultiplier = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(ce.guests)];
      const eventMultiplier = getEffectiveMultiplier(ce.id, true);
      
      const breakdownData = getCeremonyBreakdown(ce.name);
      
      if (breakdownData) {
        const breakdownTotals = calculateBreakdownTotal(breakdownData.breakdown, ce.guests, eventMultiplier, guestBracketMultiplier);
        return {
          id: ce.id,
          name: ce.name,
          guests: ce.guests,
          costPerGuestLow: Math.round(breakdownTotals.low / ce.guests),
          costPerGuestHigh: Math.round(breakdownTotals.high / ce.guests),
          totalLow: breakdownTotals.low,
          totalHigh: breakdownTotals.high,
        };
      }
      
      const costLow = Math.round(ce.baseCostPerGuestLow * eventMultiplier * guestBracketMultiplier);
      const costHigh = Math.round(ce.baseCostPerGuestHigh * eventMultiplier * guestBracketMultiplier);
      return {
        id: ce.id,
        name: ce.name,
        guests: ce.guests,
        costPerGuestLow: costLow,
        costPerGuestHigh: costHigh,
        totalLow: costLow * ce.guests,
        totalHigh: costHigh * ce.guests,
      };
    });
  }, [customEventsBase, venueClass, vendorTier, selectedCity]);

  const allEstimates = useMemo(() => {
    return [...weddingEventEstimates, ...customEventEstimates];
  }, [weddingEventEstimates, customEventEstimates]);

  const totals = useMemo(() => {
    return allEstimates.reduce(
      (acc, event) => ({
        low: acc.low + event.totalLow,
        high: acc.high + event.totalHigh,
      }),
      { low: 0, high: 0 }
    );
  }, [allEstimates]);

  const unchosenCeremonies = useMemo(() => {
    const chosenNames = new Set(allEstimates.map(e => e.name.toLowerCase()));
    return traditionCeremonies.filter(c => !chosenNames.has(c.name.toLowerCase()));
  }, [traditionCeremonies, allEstimates]);

  const addCeremony = (ceremony: CeremonyTemplate) => {
    const newEvent: CustomEventBase = {
      id: `custom-${Date.now()}`,
      name: ceremony.name,
      guests: ceremony.defaultGuests,
      baseCostPerGuestLow: parseFloat(ceremony.costPerGuestLow),
      baseCostPerGuestHigh: parseFloat(ceremony.costPerGuestHigh),
    };
    setCustomEventsBase([...customEventsBase, newEvent]);
  };

  const updateGuestCount = (eventId: string, guests: number) => {
    setCustomEventsBase(customEventsBase.map(e => 
      e.id === eventId ? { ...e, guests } : e
    ));
  };

  const removeEvent = (eventId: string) => {
    setCustomEventsBase(customEventsBase.filter(e => e.id !== eventId));
  };

  const updateWeddingEventPricing = (eventId: string, override: CeremonyPricingOverride) => {
    setWeddingEventOverrides(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], ...override }
    }));
  };

  const updateCustomEventPricing = (eventId: string, override: CeremonyPricingOverride) => {
    setCustomEventsBase(customEventsBase.map(e => 
      e.id === eventId ? { ...e, pricingOverride: { ...e.pricingOverride, ...override } } : e
    ));
  };

  const clearEventOverride = (eventId: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomEventsBase(customEventsBase.map(e => 
        e.id === eventId ? { ...e, pricingOverride: undefined } : e
      ));
    } else {
      setWeddingEventOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[eventId];
        return newOverrides;
      });
    }
  };

  const getEventOverride = (eventId: string, isCustom: boolean): CeremonyPricingOverride | undefined => {
    if (isCustom) {
      return customEventsBase.find(e => e.id === eventId)?.pricingOverride;
    }
    return weddingEventOverrides[eventId];
  };

  const handleApplySingleCeremonyBudget = (event: EventEstimate) => {
    if (onUpdateBudget) {
      onUpdateBudget(event.totalLow);
      setOpen(false);
    }
  };

  const handleApplyBudget = () => {
    if (onUpdateBudget && totals.low > 0) {
      onUpdateBudget(totals.low);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-budget-estimator">
          <Calculator className="w-4 h-4" />
          Budget Estimator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            Budget Estimator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-wedding-events"
                checked={useWeddingEvents}
                onChange={(e) => setUseWeddingEvents(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="use-wedding-events" className="text-sm cursor-pointer">
                Use my wedding events
              </Label>
            </div>
          )}

          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  Estimated Costs by Event
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Based on typical costs for {TRADITION_LABELS[selectedTradition] || selectedTradition} weddings
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : allEstimates.length > 0 ? (
              <div className="space-y-2">
                {allEstimates.map((event) => {
                  const isCustom = !event.isFromWedding;
                  const override = getEventOverride(event.id, isCustom);
                  const hasOverride = override?.venueClass || override?.vendorTier;
                  const isExpanded = !collapsedCeremonyIds.has(event.id);
                  
                  const toggleExpanded = (open: boolean) => {
                    setCollapsedCeremonyIds(prev => {
                      const next = new Set(prev);
                      if (open) {
                        next.delete(event.id);
                      } else {
                        next.add(event.id);
                      }
                      return next;
                    });
                  };
                  
                  return (
                    <Collapsible
                      key={event.id}
                      open={isExpanded}
                      onOpenChange={toggleExpanded}
                    >
                      <div className="bg-white/60 dark:bg-white/10 rounded-lg border border-emerald-100 dark:border-emerald-800 overflow-hidden">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-emerald-900 dark:text-emerald-100">
                                {event.name}
                              </span>
                              {event.isFromWedding && (
                                <Badge variant="secondary" className="text-xs">
                                  Your Event
                                </Badge>
                              )}
                              {hasOverride && (
                                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-300">
                                  Custom Pricing
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="w-3 h-3 text-emerald-600" />
                              {event.isFromWedding ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  {event.guests} guests
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={event.guests}
                                    onChange={(e) => updateGuestCount(event.id, parseInt(e.target.value) || 0)}
                                    className="w-20 h-6 text-xs px-2"
                                    data-testid={`input-guests-${event.id}`}
                                  />
                                  <span className="text-xs text-emerald-600">guests</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEvent(event.id)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    data-testid={`button-remove-${event.id}`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 block">
                                ${event.costPerGuestLow}-${event.costPerGuestHigh}/guest
                              </span>
                              <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                                ${event.totalLow.toLocaleString()} - ${event.totalHigh.toLocaleString()}
                              </span>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-expand-${event.id}`}>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-2 border-t border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                            {(() => {
                              const breakdownData = getCeremonyBreakdown(event.name);
                              const eventMultiplier = getEffectiveMultiplier(event.id, isCustom);
                              const guestBracketMult = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(event.guests)];
                              
                              if (breakdownData) {
                                return (
                                  <div className="space-y-3">
                                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                                      Cost Breakdown ({event.guests} guests)
                                    </div>
                                    <div className="space-y-1.5">
                                      {breakdownData.breakdown.map((item, idx) => {
                                        const costs = calculateBreakdownCost(item, event.guests, eventMultiplier, guestBracketMult);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex-1">
                                              <span className="text-emerald-800 dark:text-emerald-200">{item.category}</span>
                                              {item.notes && (
                                                <span className="text-emerald-600/70 dark:text-emerald-400/70 ml-1 text-[10px]">
                                                  ({item.unit === 'per_person' ? 'per guest' : item.unit === 'per_hour' ? `${item.hoursLow}-${item.hoursHigh}hrs` : 'fixed'})
                                                </span>
                                              )}
                                            </div>
                                            <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                              ${costs.low.toLocaleString()} - ${costs.high.toLocaleString()}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="border-t border-emerald-200 dark:border-emerald-700 pt-2 mt-2">
                                      <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-emerald-800 dark:text-emerald-200">Total</span>
                                        <span className="text-emerald-700 dark:text-emerald-300">
                                          ${event.totalLow.toLocaleString()} - ${event.totalHigh.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                                  Detailed breakdown not available for this ceremony type.
                                </div>
                              );
                            })()}
                            
                            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                                  Adjust Pricing
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs mb-1 block">Venue Type</Label>
                                  <Select 
                                    value={override?.venueClass ?? venueClass} 
                                    onValueChange={(v) => {
                                      if (isCustom) {
                                        updateCustomEventPricing(event.id, { venueClass: v as VenueClass });
                                      } else {
                                        updateWeddingEventPricing(event.id, { venueClass: v as VenueClass });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs" data-testid={`select-venue-${event.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(VENUE_CLASS_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value} className="text-xs">
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs mb-1 block">Vendor Tier</Label>
                                  <Select 
                                    value={override?.vendorTier ?? vendorTier} 
                                    onValueChange={(v) => {
                                      if (isCustom) {
                                        updateCustomEventPricing(event.id, { vendorTier: v as VendorTier });
                                      } else {
                                        updateWeddingEventPricing(event.id, { vendorTier: v as VendorTier });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs" data-testid={`select-vendor-${event.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(VENDOR_TIER_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value} className="text-xs">
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2">
                                {hasOverride && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => clearEventOverride(event.id, isCustom)}
                                    data-testid={`button-reset-${event.id}`}
                                  >
                                    Reset to Default
                                  </Button>
                                )}
                                {onUpdateBudget && (
                                  <Button
                                    size="sm"
                                    className="text-xs h-7 ml-auto"
                                    onClick={() => handleApplySingleCeremonyBudget(event)}
                                    data-testid={`button-apply-single-${event.id}`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Apply ${event.totalLow.toLocaleString()} as Budget
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}

                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                      Estimated Total:
                    </span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      ${totals.low.toLocaleString()} - ${totals.high.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Add 10-15% buffer for unexpected costs
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-700 dark:text-emerald-300 italic text-center py-4">
                Add events below to see cost estimates
              </p>
            )}
          </Card>

          {unchosenCeremonies.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Other ceremonies to consider:
              </h5>
              <div className="grid gap-2">
                {unchosenCeremonies.slice(0, 6).map((ceremony) => (
                  <div
                    key={ceremony.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">{ceremony.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (~{ceremony.defaultGuests} guests typical)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        ${parseFloat(ceremony.costPerGuestLow)}-${parseFloat(ceremony.costPerGuestHigh)}/guest
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCeremony(ceremony)}
                        className="h-7"
                        data-testid={`button-add-${ceremony.id}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onUpdateBudget && totals.low > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={handleApplyBudget} data-testid="button-apply-budget">
                Apply ${totals.low.toLocaleString()} as Budget
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
