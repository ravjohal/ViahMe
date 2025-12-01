import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Clock, MapPin, Users, DollarSign, Tag, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { Event, BudgetCategory, EventCostItem, Task } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

const EVENT_TYPES: Record<string, { icon: string; label: string }> = {
  paath: { icon: "🙏", label: "Paath" },
  mehndi: { icon: "🎨", label: "Mehndi" },
  maiyan: { icon: "✨", label: "Maiyan" },
  sangeet: { icon: "🎵", label: "Sangeet" },
  anand_karaj: { icon: "🛕", label: "Anand Karaj" },
  reception: { icon: "🎉", label: "Reception" },
  custom: { icon: "📅", label: "Custom Event" },
};

const PRIORITY_COLORS = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  costItems?: EventCostItem[];
  costItemsLoading?: boolean;
  budgetCategories?: BudgetCategory[];
  tasks?: Task[];
  tasksLoading?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}

export function EventDetailModal({
  open,
  onOpenChange,
  event,
  costItems = [],
  costItemsLoading = false,
  budgetCategories = [],
  tasks = [],
  tasksLoading = false,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  if (!event) return null;

  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
    },
    onSuccess: () => {
      // Tasks query will auto-refetch
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span>{eventType?.icon || "📅"}</span>
            {event.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            {event.description && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Description</h3>
                <p className="text-foreground">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {event.date && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Date</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{format(new Date(event.date), "MMMM dd, yyyy")}</span>
                  </div>
                </div>
              )}

              {event.time && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Time</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{event.time}</span>
                  </div>
                </div>
              )}

              {event.location && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Location</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{event.location}</span>
                  </div>
                </div>
              )}

              {event.guestCount && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Guests</h3>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{event.guestCount} guests</span>
                  </div>
                </div>
              )}

              {event.costPerHead && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Cost Per Head</h3>
                  <span className="text-foreground font-semibold">${parseFloat(event.costPerHead).toLocaleString()}</span>
                </div>
              )}

              {event.venueCapacity && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Venue Capacity</h3>
                  <span className="text-foreground">{event.venueCapacity} people</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          {(costItems.length > 0 || costItemsLoading) && (
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
          )}

          {/* Event Tasks */}
          {(tasks.length > 0 || tasksLoading) && (
            <Collapsible defaultOpen className="border rounded-lg p-4 space-y-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium">Tasks To Do</span>
                    {tasks.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{tasks.filter(t => !t.completed).length}/{tasks.length}</Badge>
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {tasksLoading ? (
                  <div className="text-center text-muted-foreground py-2">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No tasks for this event</div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover-elevate transition-all cursor-pointer" onClick={() => updateTaskMutation.mutate({ id: task.id, completed: !task.completed })}>
                        <Checkbox
                          checked={task.completed || false}
                          onCheckedChange={() => updateTaskMutation.mutate({ id: task.id, completed: !task.completed })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium}`}>
                              {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS] || "Medium"}
                            </Badge>
                            {task.dueDate && (
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(task.dueDate), "MMM d")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-close-event-modal"
            >
              Close
            </Button>
            {onEdit && (
              <Button 
                onClick={() => {
                  onEdit(event);
                  onOpenChange(false);
                }}
                data-testid="button-edit-event-from-modal"
              >
                Edit Event
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this event?")) {
                    onDelete(event.id);
                    onOpenChange(false);
                  }
                }}
                data-testid="button-delete-event-from-modal"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
