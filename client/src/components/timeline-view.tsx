import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Plus } from "lucide-react";
import type { Event } from "@shared/schema";
import { format } from "date-fns";
import { SideBadge } from "@/components/side-filter";

interface TimelineViewProps {
  events: Event[];
  onAddEvent?: () => void;
  onEditEvent?: (event: Event) => void;
}

const EVENT_COLORS: Record<string, string> = {
  paath: "border-l-chart-4",
  mehndi: "border-l-chart-2",
  maiyan: "border-l-chart-3",
  sangeet: "border-l-chart-1",
  anand_karaj: "border-l-primary",
  reception: "border-l-chart-5",
  custom: "border-l-muted",
};

const EVENT_ICONS: Record<string, string> = {
  paath: "🙏",
  mehndi: "🎨",
  maiyan: "✨",
  sangeet: "🎵",
  anand_karaj: "🛕",
  reception: "🎉",
  custom: "📅",
};

const EVENT_LABELS: Record<string, string> = {
  paath: "Paath",
  mehndi: "Mehndi",
  maiyan: "Maiyan",
  sangeet: "Sangeet",
  anand_karaj: "Anand Karaj",
  reception: "Reception",
  custom: "Custom Event",
};

export function TimelineView({ events, onAddEvent, onEditEvent }: TimelineViewProps) {
  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Event Timeline
          </h2>
          <p className="text-muted-foreground mt-1">
            Your complete celebration schedule
          </p>
        </div>
        {onAddEvent && (
          <Button onClick={onAddEvent} data-testid="button-add-event">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your celebration timeline
            </p>
            {onAddEvent && (
              <Button onClick={onAddEvent} data-testid="button-add-first-event">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Event
              </Button>
            )}
          </Card>
        ) : (
          sortedEvents.map((event, index) => (
            <Card
              key={event.id}
              className={`p-6 border-l-4 ${EVENT_COLORS[event.type] || EVENT_COLORS.custom} hover-elevate transition-all cursor-pointer`}
              onClick={() => onEditEvent?.(event)}
              data-testid={`card-event-${event.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" data-testid={`icon-event-${event.type}`}>
                      {EVENT_ICONS[event.type] || EVENT_ICONS.custom}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">
                          {EVENT_LABELS[event.type] || "Custom"}
                        </Badge>
                        {event.side && (
                          <SideBadge side={event.side as "bride" | "groom" | "mutual"} />
                        )}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {event.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {event.date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(event.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}

                    {event.time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{event.time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium truncate">{event.location}</span>
                      </div>
                    )}

                    {event.guestCount && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{event.guestCount} guests</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
