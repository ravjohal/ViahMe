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
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Event } from "@shared/schema";
import { CEREMONY_COST_BREAKDOWNS, CEREMONY_CATALOG, calculateCeremonyTotalRange } from "@shared/ceremonies";

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

function getCeremonyIdFromEvent(event: Event): string | null {
  if ((event as any).ceremonyId && CEREMONY_COST_BREAKDOWNS[(event as any).ceremonyId]) {
    return (event as any).ceremonyId;
  }
  
  const eventType = event.type?.toLowerCase() || "";
  const eventName = event.name?.toLowerCase() || "";
  
  const mappings: Record<string, string[]> = {
    hindu_mehndi: ["mehndi", "henna"],
    hindu_sangeet: ["sangeet", "lady sangeet"],
    hindu_haldi: ["haldi", "maiyan"],
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
  const eventsWithCosts = useMemo(() => {
    return events.filter(event => {
      const ceremonyId = getCeremonyIdFromEvent(event);
      return ceremonyId && CEREMONY_COST_BREAKDOWNS[ceremonyId];
    }).map(event => {
      const ceremonyId = getCeremonyIdFromEvent(event)!;
      const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
      const originalGuests = event.guestCount || ceremony?.defaultGuests || 100;
      return {
        eventId: event.id,
        eventName: event.name,
        ceremonyId,
        originalGuests,
        currentGuests: originalGuests,
        minGuests: Math.max(20, Math.floor(originalGuests * 0.3)),
        maxGuests: Math.min(500, Math.ceil(originalGuests * 1.5)),
      };
    });
  }, [events]);

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
      const range = calculateCeremonyTotalRange(state.ceremonyId, state.originalGuests);
      return sum + (range.low + range.high) / 2;
    }, 0);
  }, [guestStates]);

  const currentTotal = useMemo(() => {
    return guestStates.reduce((sum, state) => {
      const range = calculateCeremonyTotalRange(state.ceremonyId, state.currentGuests);
      return sum + (range.low + range.high) / 2;
    }, 0);
  }, [guestStates]);

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
          {hasChanges && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetAll}
              className="shrink-0"
              data-testid="button-reset-guests"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

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
              const range = calculateCeremonyTotalRange(state.ceremonyId, state.currentGuests);
              const originalRange = calculateCeremonyTotalRange(state.ceremonyId, state.originalGuests);
              const avgCurrent = (range.low + range.high) / 2;
              const avgOriginal = (originalRange.low + originalRange.high) / 2;
              const eventSavings = avgOriginal - avgCurrent;
              const guestsChanged = state.currentGuests !== state.originalGuests;

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
                          -{state.originalGuests - state.currentGuests} guests
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
      </div>
    </Card>
  );
}
