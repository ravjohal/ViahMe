import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, DollarSign, Users, Clock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Event } from "@shared/schema";
import { CEREMONY_COST_BREAKDOWNS, CEREMONY_CATALOG, calculateCeremonyTotalRange, type CostCategory } from "@shared/ceremonies";

interface CeremonyCostBreakdownProps {
  events: Event[];
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
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

function CostCategoryRow({ item, guestCount }: { item: CostCategory; guestCount: number }) {
  let displayLow: number;
  let displayHigh: number;
  let unitLabel: string;
  
  if (item.unit === "per_person") {
    displayLow = item.lowCost * guestCount;
    displayHigh = item.highCost * guestCount;
    unitLabel = `@ ${formatCurrencyFull(item.lowCost)}-${formatCurrencyFull(item.highCost)}/person`;
  } else if (item.unit === "per_hour") {
    const hoursLow = item.hoursLow ?? 3;
    const hoursHigh = item.hoursHigh ?? 4;
    displayLow = item.lowCost * hoursLow;
    displayHigh = item.highCost * hoursHigh;
    unitLabel = `@ ${formatCurrencyFull(item.lowCost)}-${formatCurrencyFull(item.highCost)}/hr (${hoursLow}-${hoursHigh}hrs)`;
  } else {
    displayLow = item.lowCost;
    displayHigh = item.highCost;
    unitLabel = "fixed";
  }
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border/50 last:border-0 gap-1 sm:gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{item.category}</span>
        {item.notes && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="text-xs">{item.notes}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2 justify-between sm:justify-end">
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {unitLabel}
        </Badge>
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
          {formatCurrency(displayLow)} - {formatCurrency(displayHigh)}
        </span>
      </div>
    </div>
  );
}

function EventCostCard({ event }: { event: Event }) {
  const [isOpen, setIsOpen] = useState(false);
  const ceremonyId = getCeremonyIdFromEvent(event);
  const breakdown = ceremonyId ? CEREMONY_COST_BREAKDOWNS[ceremonyId] : null;
  const ceremony = ceremonyId ? CEREMONY_CATALOG.find(c => c.id === ceremonyId) : null;
  const guestCount = event.guestCount || ceremony?.defaultGuests || 100;
  
  if (!breakdown) {
    return null;
  }
  
  const totalRange = calculateCeremonyTotalRange(ceremonyId!, guestCount);
  
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`cost-card-${event.id}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 h-auto justify-between rounded-none"
            data-testid={`button-expand-${event.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-base">{event.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="w-3.5 h-3.5" />
                  <span>{guestCount} guests</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalRange.low)} - {formatCurrency(totalRange.high)}
                </p>
                <p className="text-xs text-muted-foreground">estimated total</p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                Cost Breakdown
              </Badge>
              <span className="text-xs text-muted-foreground">
                Based on {guestCount} guests in mid-to-high cost areas
              </span>
            </div>
            <div className="space-y-0">
              {breakdown.map((item, index) => (
                <CostCategoryRow key={index} item={item} guestCount={guestCount} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="font-medium">Total Estimated Range</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {formatCurrencyFull(totalRange.low)} - {formatCurrencyFull(totalRange.high)}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function CeremonyCostBreakdown({ events, className = "" }: CeremonyCostBreakdownProps) {
  const eventsWithBreakdowns = events.filter(event => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    return ceremonyId && CEREMONY_COST_BREAKDOWNS[ceremonyId];
  });
  
  if (eventsWithBreakdowns.length === 0) {
    return null;
  }
  
  const totalLow = eventsWithBreakdowns.reduce((sum, event) => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    if (!ceremonyId) return sum;
    const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
    const guestCount = event.guestCount || ceremony?.defaultGuests || 100;
    const range = calculateCeremonyTotalRange(ceremonyId, guestCount);
    return sum + range.low;
  }, 0);
  
  const totalHigh = eventsWithBreakdowns.reduce((sum, event) => {
    const ceremonyId = getCeremonyIdFromEvent(event);
    if (!ceremonyId) return sum;
    const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
    const guestCount = event.guestCount || ceremony?.defaultGuests || 100;
    const range = calculateCeremonyTotalRange(ceremonyId, guestCount);
    return sum + range.high;
  }, 0);
  
  return (
    <div className={className} data-testid="ceremony-cost-breakdown-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            Ceremony Cost Estimates
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                <p className="text-xs font-medium mb-1">Why the range?</p>
                <p className="text-xs text-muted-foreground">
                  Costs vary based on vendor tier (budget vs. luxury), guest count, venue location, and customization level. The low end assumes standard vendors; the high end reflects premium services in major metros like Bay Area or NYC.
                </p>
              </TooltipContent>
            </Tooltip>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Expand each event to see detailed vendor category breakdowns
          </p>
        </div>
        <div className="text-right bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 px-4 py-2 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Estimated Budget</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalLow)} - {formatCurrency(totalHigh)}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {eventsWithBreakdowns.map(event => (
          <EventCostCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
