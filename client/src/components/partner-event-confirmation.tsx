import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Plus, Check, ArrowRight, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";
import { SideBadge, SIDE_COLORS } from "@/components/side-filter";

interface PartnerEventConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  partnerSide: "bride" | "groom";
  separateEvents: Event[];
  onComplete: () => void;
}

const SIDE_LABELS = {
  bride: "Bride's Side",
  groom: "Groom's Side",
};

export function PartnerEventConfirmation({
  open,
  onOpenChange,
  weddingId,
  partnerSide,
  separateEvents,
  onComplete,
}: PartnerEventConfirmationProps) {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<Record<string, "create" | "shared" | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      return await apiRequest("POST", "/api/events", eventData);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      return await apiRequest("PATCH", `/api/events/${id}`, data);
    },
  });

  const handleDecision = (eventId: string, decision: "create" | "shared") => {
    setDecisions(prev => ({
      ...prev,
      [eventId]: prev[eventId] === decision ? null : decision,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const event of separateEvents) {
        const decision = decisions[event.id];
        if (!decision) continue;

        if (decision === "create") {
          await createEventMutation.mutateAsync({
            weddingId,
            name: `${event.name} (${SIDE_LABELS[partnerSide]})`,
            type: event.type,
            description: event.description || undefined,
            order: event.order + 0.5,
            guestCount: event.guestCount || undefined,
            side: partnerSide,
          } as Partial<Event>);
        } else if (decision === "shared") {
          await updateEventMutation.mutateAsync({
            id: event.id,
            data: { side: "mutual" },
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/events", weddingId] });
      
      toast({
        title: "Events Updated",
        description: "Your event preferences have been saved.",
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allDecided = separateEvents.every(e => decisions[e.id] !== undefined && decisions[e.id] !== null);
  const decidedCount = Object.values(decisions).filter(d => d !== null).length;
  const otherSide = partnerSide === "bride" ? "groom" : "bride";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Welcome to the Wedding Planning!
          </DialogTitle>
          <DialogDescription className="text-base">
            Your partner has already added some events. Some ceremonies are traditionally done separately by each family. 
            Please let us know how you'd like to handle these:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <Heart className="w-4 h-4 text-primary" />
            <span>You are joining as <strong className={SIDE_COLORS[partnerSide].text}>{SIDE_LABELS[partnerSide]}</strong></span>
          </div>

          {separateEvents.length === 0 ? (
            <Card className="p-6 text-center">
              <Check className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
              <h3 className="font-semibold text-lg mb-2">All Set!</h3>
              <p className="text-muted-foreground">
                There are no events that need your confirmation. You're ready to start planning!
              </p>
              <Button onClick={() => onOpenChange(false)} className="mt-4">
                Get Started
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {separateEvents.map((event) => {
                  const decision = decisions[event.id];
                  const colors = SIDE_COLORS[event.side as keyof typeof SIDE_COLORS] || SIDE_COLORS.mutual;
                  
                  return (
                    <Card 
                      key={event.id} 
                      className={`p-4 transition-all ${decision ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      data-testid={`partner-event-card-${event.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{event.name}</h3>
                            <SideBadge side={event.side as "bride" | "groom" | "mutual"} />
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Currently assigned to {event.side === "bride" ? "Bride's" : event.side === "groom" ? "Groom's" : "Both"} side
                          </p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant={decision === "create" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDecision(event.id, "create")}
                            className={decision === "create" ? `${SIDE_COLORS[partnerSide].bg} ${SIDE_COLORS[partnerSide].text} ${SIDE_COLORS[partnerSide].border} border-2` : ""}
                            data-testid={`button-create-${event.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create Our {SIDE_LABELS[partnerSide].split("'s")[0]}'s Version
                          </Button>
                          <Button
                            variant={decision === "shared" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDecision(event.id, "shared")}
                            className={decision === "shared" ? "bg-amber-100 text-amber-700 border-amber-400 border-2" : ""}
                            data-testid={`button-shared-${event.id}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Make Shared
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-4 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  {decidedCount} of {separateEvents.length} events decided
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-skip-confirmation"
                  >
                    Decide Later
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || decidedCount === 0}
                    data-testid="button-confirm-events"
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        Confirm Decisions
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
