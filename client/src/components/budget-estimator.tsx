import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Calculator, Plus, Minus, DollarSign, Users, Info } from "lucide-react";
import { getCeremoniesForTradition, type CeremonyDefinition } from "@shared/ceremonies";
import type { Wedding, Event } from "@shared/schema";

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

export function BudgetEstimator({ wedding, events = [], onUpdateBudget }: BudgetEstimatorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<string>(wedding?.tradition || "hindu");
  const [customEvents, setCustomEvents] = useState<EventEstimate[]>([]);
  const [useWeddingEvents, setUseWeddingEvents] = useState(true);

  const traditionCeremonies = useMemo(() => {
    return getCeremoniesForTradition(selectedTradition);
  }, [selectedTradition]);

  const weddingEventEstimates: EventEstimate[] = useMemo(() => {
    if (!useWeddingEvents || events.length === 0) return [];
    
    return events.map(event => {
      const ceremony = traditionCeremonies.find(c => 
        c.name.toLowerCase() === event.name.toLowerCase() ||
        c.id.includes(event.name.toLowerCase().replace(/\s+/g, '_'))
      );
      
      const costLow = ceremony?.costPerGuestLow || 50;
      const costHigh = ceremony?.costPerGuestHigh || 100;
      const guestCount = event.guestCount || ceremony?.defaultGuests || 150;
      
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
  }, [events, useWeddingEvents, traditionCeremonies]);

  const allEstimates = useMemo(() => {
    return [...weddingEventEstimates, ...customEvents];
  }, [weddingEventEstimates, customEvents]);

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

  const addCeremony = (ceremony: CeremonyDefinition) => {
    const newEvent: EventEstimate = {
      id: `custom-${Date.now()}`,
      name: ceremony.name,
      guests: ceremony.defaultGuests,
      costPerGuestLow: ceremony.costPerGuestLow,
      costPerGuestHigh: ceremony.costPerGuestHigh,
      totalLow: ceremony.costPerGuestLow * ceremony.defaultGuests,
      totalHigh: ceremony.costPerGuestHigh * ceremony.defaultGuests,
    };
    setCustomEvents([...customEvents, newEvent]);
  };

  const updateGuestCount = (eventId: string, guests: number) => {
    setCustomEvents(customEvents.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          guests,
          totalLow: e.costPerGuestLow * guests,
          totalHigh: e.costPerGuestHigh * guests,
        };
      }
      return e;
    }));
  };

  const removeEvent = (eventId: string) => {
    setCustomEvents(customEvents.filter(e => e.id !== eventId));
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
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
            {events.length > 0 && (
              <div className="flex items-center gap-2 pt-6">
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
          </div>

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

            {allEstimates.length > 0 ? (
              <div className="space-y-2">
                {allEstimates.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-white/60 dark:bg-white/10 rounded-lg border border-emerald-100 dark:border-emerald-800"
                  >
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
                    <div className="text-right">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 block">
                        ${event.costPerGuestLow}-${event.costPerGuestHigh}/guest
                      </span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                        ${event.totalLow.toLocaleString()} - ${event.totalHigh.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

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
                        ${ceremony.costPerGuestLow}-${ceremony.costPerGuestHigh}/guest
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
