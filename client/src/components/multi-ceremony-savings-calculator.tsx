import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Users, 
  TrendingDown, 
  Sparkles,
  RotateCcw,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Utensils,
  ExternalLink,
  Loader2,
  Settings2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";
import type { Event, CeremonyTemplate, CeremonyTemplateCostItem } from "@shared/schema";
import { useCeremonyTemplates, getCostBreakdownFromTemplate, calculateCeremonyTotal, buildCeremonyBreakdownMap, calculateCeremonyTotalFromBreakdown } from "@/hooks/use-ceremony-templates";
import { CEREMONY_MAPPINGS } from "@shared/ceremonies";
import { PricingAdjuster } from "@/components/pricing-adjuster";
import {
  type VenueClass,
  type VendorTier,
  VENUE_CLASS_MULTIPLIERS,
  VENDOR_TIER_MULTIPLIERS,
  GUEST_BRACKET_MULTIPLIERS,
  getGuestBracket,
} from "@shared/pricing";

interface MultiCeremonySavingsCalculatorProps {
  events: Event[];
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function getTopCostDrivers(template: CeremonyTemplate, guestCount: number): { category: string; savings: number }[] {
  const breakdown = getCostBreakdownFromTemplate(template);
  if (!breakdown.length) return [];
  
  const perPersonItems = breakdown
    .filter(item => item.unit === "per_person")
    .map(item => ({
      category: item.category,
      savings: ((item.lowCost + item.highCost) / 2) * guestCount
    }))
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 2);
  
  return perPersonItems;
}

function getCeremonyIdFromEvent(event: Event, templateMap: Map<string, CeremonyTemplate>): { ceremonyId: string } | null {
  const eventType = event.type?.toLowerCase() || "";
  const eventName = event.name?.toLowerCase() || "";
  
  if ((event as any).ceremonyId && templateMap.has((event as any).ceremonyId)) {
    return { ceremonyId: (event as any).ceremonyId };
  }
  
  for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
    if (keywords.some(kw => eventName.includes(kw) || eventType.includes(kw))) {
      if (templateMap.has(ceremonyId)) {
        return { ceremonyId };
      }
    }
  }
  
  if (templateMap.has(eventType)) {
    return { ceremonyId: eventType };
  }
  
  return null;
}

interface EventGuestState {
  eventId: number;
  eventName: string;
  ceremonyId: string;
  originalGuests: number;
  currentGuests: number;
  minGuests: number;
  maxGuests: number;
}

export function MultiCeremonySavingsCalculator({ events, className = "" }: MultiCeremonySavingsCalculatorProps) {
  const { data: templates, isLoading } = useCeremonyTemplates();
  const [venueClass, setVenueClass] = useState<VenueClass>("community_hall");
  const [vendorTier, setVendorTier] = useState<VendorTier>("standard");
  const [showPricingSettings, setShowPricingSettings] = useState(false);
  
  const pricingMultiplier = useMemo(() => {
    return VENUE_CLASS_MULTIPLIERS[venueClass] * VENDOR_TIER_MULTIPLIERS[vendorTier];
  }, [venueClass, vendorTier]);
  
  const templateMap = useMemo(() => {
    const map = new Map<string, CeremonyTemplate>();
    if (templates) {
      for (const t of templates) {
        map.set(t.ceremonyId, t);
      }
    }
    return map;
  }, [templates]);
  
  const eventsWithCosts = useMemo(() => {
    return events.filter(event => {
      const result = getCeremonyIdFromEvent(event, templateMap);
      return result !== null;
    }).map(event => {
      const result = getCeremonyIdFromEvent(event, templateMap)!;
      const { ceremonyId } = result;
      const template = templateMap.get(ceremonyId);
      const originalGuests = event.guestCount || template?.defaultGuests || 100;
      
      const minGuests = Math.max(20, Math.floor(originalGuests * 0.3));
      const maxGuests = Math.max(minGuests + 50, originalGuests, Math.ceil(originalGuests * 1.5));
      return {
        eventId: event.id,
        eventName: event.name,
        ceremonyId,
        originalGuests,
        currentGuests: originalGuests,
        minGuests,
        maxGuests,
      };
    });
  }, [events, templateMap]);

  const [guestStates, setGuestStates] = useState<EventGuestState[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (eventsWithCosts.length > 0 && guestStates.length === 0) {
      setGuestStates(eventsWithCosts);
    } else if (eventsWithCosts.length > 0) {
      setGuestStates(prev => {
        const existingIds = new Set(prev.map(s => s.eventId));
        const newEvents = eventsWithCosts.filter(e => !existingIds.has(e.eventId));
        if (newEvents.length > 0) {
          return [...prev, ...newEvents];
        }
        return prev;
      });
    }
  }, [eventsWithCosts]);

  const originalTotal = useMemo(() => {
    return guestStates.reduce((sum, state) => {
      const guestBracketMultiplier = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(state.originalGuests)];
      const totalMultiplier = pricingMultiplier * guestBracketMultiplier;
      const template = templateMap.get(state.ceremonyId);
      if (!template) return sum;
      const range = calculateCeremonyTotal(template, state.originalGuests);
      return sum + ((range.low + range.high) / 2) * totalMultiplier;
    }, 0);
  }, [guestStates, templateMap, pricingMultiplier]);

  const currentTotal = useMemo(() => {
    return guestStates.reduce((sum, state) => {
      const guestBracketMultiplier = GUEST_BRACKET_MULTIPLIERS[getGuestBracket(state.currentGuests)];
      const totalMultiplier = pricingMultiplier * guestBracketMultiplier;
      const template = templateMap.get(state.ceremonyId);
      if (!template) return sum;
      const range = calculateCeremonyTotal(template, state.currentGuests);
      return sum + ((range.low + range.high) / 2) * totalMultiplier;
    }, 0);
  }, [guestStates, templateMap, pricingMultiplier]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (eventsWithCosts.length === 0 || guestStates.length === 0) {
    return null;
  }

  const updateGuestCount = (eventId: number, newCount: number) => {
    setGuestStates(prev => prev.map(state => 
      state.eventId === eventId ? { ...state, currentGuests: newCount } : state
    ));
  };

  const resetAll = () => {
    setGuestStates(eventsWithCosts);
  };

  const totalSavings = originalTotal - currentTotal;
  const totalGuestsReduced = guestStates.reduce((sum, state) => 
    sum + (state.originalGuests - state.currentGuests), 0
  );

  const hasChanges = guestStates.some(state => state.currentGuests !== state.originalGuests);

  return (
    <Card className={`overflow-hidden ${className}`} data-testid="multi-ceremony-savings-calculator">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              Multi-Ceremony Guest Savings Calculator
              <Badge variant="outline" className="text-xs">Interactive</Badge>
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Adjust guest counts for each ceremony to see how it impacts your total budget. 
              Perfect for having "the conversation" with family.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPricingSettings(!showPricingSettings)}
              className="gap-1"
              data-testid="button-pricing-settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Refine
            </Button>
            {hasChanges && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAll}
                data-testid="button-reset-guests"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {showPricingSettings && (
          <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-blue-200 dark:border-blue-800">
            <div className="mb-2">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Refine pricing based on your venue and vendor choices</p>
            </div>
            <PricingAdjuster
              venueClass={venueClass}
              vendorTier={vendorTier}
              onVenueClassChange={setVenueClass}
              onVendorTierChange={setVendorTier}
              compact
            />
            {pricingMultiplier !== 1 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  {pricingMultiplier < 1 
                    ? `${Math.round((1 - pricingMultiplier) * 100)}% savings applied`
                    : `${Math.round((pricingMultiplier - 1) * 100)}% premium applied`
                  }
                </Badge>
              </div>
            )}
          </div>
        )}

        {hasChanges && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800">
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
                    You could save {formatCurrencyFull(Math.round(totalSavings))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-700 dark:text-green-300">New estimated total</p>
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {formatCurrencyFull(Math.round(currentTotal))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 h-auto justify-between rounded-none border-b"
            data-testid="button-expand-ceremonies"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{eventsWithCosts.length} Ceremonies</span>
              <Badge variant="secondary" className="text-xs">
                {guestStates.reduce((sum, s) => sum + s.currentGuests, 0)} total guests
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isExpanded ? "Hide" : "Adjust"} guest counts
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-6">
            {guestStates.map((state) => {
              const template = templateMap.get(state.ceremonyId);
              if (!template) return null;
              
              const range = calculateCeremonyTotal(template, state.currentGuests);
              const originalRange = calculateCeremonyTotal(template, state.originalGuests);
              const avgCurrent = (range.low + range.high) / 2;
              const avgOriginal = (originalRange.low + originalRange.high) / 2;
              const eventSavings = avgOriginal - avgCurrent;
              const guestsChanged = state.currentGuests !== state.originalGuests;
              const guestsReduced = state.originalGuests - state.currentGuests;
              const costDrivers = getTopCostDrivers(template, guestsReduced > 0 ? guestsReduced : 10);

              return (
                <div 
                  key={state.eventId} 
                  className="p-4 rounded-lg bg-muted/30 border"
                  data-testid={`ceremony-slider-${state.eventId}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{state.eventName}</h4>
                      {guestsChanged && (
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                        >
                          -{guestsReduced} guests
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(range.low)} - {formatCurrency(range.high)}
                      </p>
                      {guestsChanged && eventSavings > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Save {formatCurrencyFull(Math.round(eventSavings))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Guest count</span>
                      <span className="font-bold text-lg">{state.currentGuests}</span>
                    </div>
                    <Slider
                      value={[state.currentGuests]}
                      onValueChange={(val) => updateGuestCount(state.eventId, val[0])}
                      min={state.minGuests}
                      max={state.maxGuests}
                      step={5}
                      className="w-full"
                      data-testid={`slider-guests-${state.eventId}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{state.minGuests}</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Original: {state.originalGuests}
                      </span>
                      <span>{state.maxGuests}</span>
                    </div>
                  </div>

                  {costDrivers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Utensils className="w-3 h-3" />
                        <span>Top savings drivers (per-guest costs):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {costDrivers.map((driver, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs font-normal"
                          >
                            {driver.category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="p-4 bg-muted/20 border-t">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Original estimated total:</span>
            <span className="font-semibold">{formatCurrencyFull(Math.round(originalTotal))}</span>
          </div>
          {hasChanges ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                New total: <span className="font-bold">{formatCurrencyFull(Math.round(currentTotal))}</span>
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Tip: Try reducing 25-50 guests per ceremony to see potential savings
            </p>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Savings come mainly from per-guest costs (catering, favors). Fixed costs stay the same.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline" data-testid="link-full-breakdown">
            See full cost breakdown
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
