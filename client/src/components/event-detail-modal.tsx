import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, DollarSign, Tag, CheckCircle2, Plus, Save, Video, Heart } from "lucide-react";
import { SideBadge, SIDE_COLORS } from "@/components/side-filter";
import { format } from "date-fns";
import type { Event, BudgetCategory, EventCostItem, Task, InsertTask } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  // Sikh ceremonies
  paath: { icon: "🙏", label: "Paath" },
  maiyan: { icon: "✨", label: "Maiyan" },
  chunni_chadana: { icon: "🧣", label: "Chunni Chadana" },
  jaggo: { icon: "🪔", label: "Jaggo" },
  chooda: { icon: "💍", label: "Chooda" },
  bakra_party: { icon: "🎊", label: "Bakra Party" },
  anand_karaj: { icon: "🛕", label: "Anand Karaj" },
  // Hindu ceremonies
  haldi: { icon: "💛", label: "Haldi" },
  mehndi: { icon: "🎨", label: "Mehndi" },
  sangeet: { icon: "🎵", label: "Sangeet" },
  baraat: { icon: "🐎", label: "Baraat" },
  milni: { icon: "🤝", label: "Milni" },
  pheras: { icon: "🔥", label: "Pheras" },
  vidaai: { icon: "👋", label: "Vidaai" },
  // Muslim ceremonies
  nikah: { icon: "💒", label: "Nikah" },
  walima: { icon: "🍽️", label: "Walima" },
  // General
  reception: { icon: "🎉", label: "Reception" },
  cocktail: { icon: "🍸", label: "Cocktail Party" },
  rehearsal_dinner: { icon: "🍷", label: "Rehearsal Dinner" },
  bridal_shower: { icon: "🎁", label: "Bridal Shower" },
  bachelor_party: { icon: "🥳", label: "Bachelor/Bachelorette" },
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
  weddingId?: string;
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
  weddingId,
  costItems = [],
  costItemsLoading = false,
  budgetCategories = [],
  tasks = [],
  tasksLoading = false,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  const { toast } = useToast();
  
  // Event form state
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventGuestCount, setEventGuestCount] = useState("");
  const [eventCostPerHead, setEventCostPerHead] = useState("");
  const [eventVenueCapacity, setEventVenueCapacity] = useState("");
  const [eventType, setEventType] = useState("custom");
  const [eventLivestreamUrl, setEventLivestreamUrl] = useState("");
  const [eventSide, setEventSide] = useState<"bride" | "groom" | "mutual">("mutual");
  
  // Task form state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setEventName(event.name || "");
      setEventDescription(event.description || "");
      // Handle date - could be Date object or string from API
      if (event.date) {
        try {
          const dateObj = new Date(event.date as unknown as string | Date);
          setEventDate(format(dateObj, "yyyy-MM-dd"));
        } catch {
          setEventDate("");
        }
      } else {
        setEventDate("");
      }
      setEventTime(event.time || "");
      setEventLocation(event.location || "");
      setEventGuestCount(event.guestCount?.toString() || "");
      setEventCostPerHead(event.costPerHead || "");
      setEventVenueCapacity(event.venueCapacity?.toString() || "");
      setEventType(event.type || "custom");
      setEventLivestreamUrl(event.livestreamUrl || "");
      setEventSide((event.side as "bride" | "groom" | "mutual") || "mutual");
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: Partial<Event>) => {
      return await apiRequest("PATCH", `/api/events/${event!.id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/events", weddingId] });
      toast({
        title: "Event updated",
        description: "Your changes have been saved.",
      });
      // Close modal after a brief delay to allow toast to display
      setTimeout(() => {
        onOpenChange(false);
      }, 800);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", weddingId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", weddingId] });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setShowNewTaskForm(false);
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !weddingId) return;

    createTaskMutation.mutate({
      weddingId,
      eventId: event!.id,
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: (newTaskPriority as "high" | "medium" | "low") || "medium",
      dueDate: newTaskDueDate || undefined,
    } as InsertTask);
  };

  const handleSaveEvent = () => {
    if (!event) return;

    updateEventMutation.mutate({
      name: eventName,
      description: eventDescription || undefined,
      date: eventDate || null,
      time: eventTime || undefined,
      location: eventLocation || undefined,
      guestCount: eventGuestCount ? parseInt(eventGuestCount) : undefined,
      costPerHead: eventCostPerHead || undefined,
      venueCapacity: eventVenueCapacity ? parseInt(eventVenueCapacity) : undefined,
      type: eventType,
      livestreamUrl: eventLivestreamUrl || undefined,
      side: eventSide,
    } as Partial<Event>);
  };

  if (!event) return null;

  const currentEventType = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES] || EVENT_TYPES.custom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentEventType?.icon || "📅"}</span>
            <DialogTitle className="text-lg font-semibold">Edit Event</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Event Name
            </Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
              className="text-base"
              data-testid="input-event-name"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Event Type
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_TYPES).map(([key, { icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEventType(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    eventType === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-event-type-${key}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Family Side
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "mutual", label: "Both Sides" },
                { value: "bride", label: "Bride's Side" },
                { value: "groom", label: "Groom's Side" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEventSide(option.value as "bride" | "groom" | "mutual")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    eventSide === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-side-${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description (Optional)
            </Label>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Event description"
              className="resize-none"
              rows={2}
              data-testid="input-event-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-base"
                data-testid="input-event-date"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="text-base"
                data-testid="input-event-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </Label>
            <Input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Venue name or address"
              className="text-base"
              data-testid="input-event-location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Users className="w-3 h-3" /> Expected Guests
              </Label>
              <Input
                type="number"
                value={eventGuestCount}
                onChange={(e) => setEventGuestCount(e.target.value)}
                placeholder="Number of guests"
                className="text-base"
                data-testid="input-event-guest-count"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Venue Capacity
              </Label>
              <Input
                type="number"
                value={eventVenueCapacity}
                onChange={(e) => setEventVenueCapacity(e.target.value)}
                placeholder="Max capacity"
                className="text-base"
                data-testid="input-event-venue-capacity"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cost Per Head
            </Label>
            <Input
              type="number"
              step="0.01"
              value={eventCostPerHead}
              onChange={(e) => setEventCostPerHead(e.target.value)}
              placeholder="Cost per guest"
              className="text-base"
              data-testid="input-event-cost-per-head"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Video className="w-3 h-3" /> YouTube Livestream
            </Label>
            <Input
              type="url"
              value={eventLivestreamUrl}
              onChange={(e) => setEventLivestreamUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="text-base"
              data-testid="input-event-livestream"
            />
            <p className="text-xs text-muted-foreground">
              Add a YouTube link for guests who can't attend in person
            </p>
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
              ) : tasks.length === 0 && !showNewTaskForm ? (
                <div className="text-center text-muted-foreground py-4">No tasks for this event</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover-elevate transition-all cursor-pointer" onClick={() => updateTaskMutation.mutate({ id: task.id, completed: !task.completed })} data-testid={`task-item-modal-${task.id}`}>
                      <Checkbox
                        checked={task.completed || false}
                        onCheckedChange={() => updateTaskMutation.mutate({ id: task.id, completed: !task.completed })}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-task-modal-${task.id}`}
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

              {/* Add New Task Form */}
              <div className="border-t pt-4 mt-4">
                {!showNewTaskForm ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNewTaskForm(true)}
                    className="w-full"
                    data-testid="button-add-task-for-event"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      data-testid="input-new-task-title"
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="resize-none"
                      data-testid="input-new-task-description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                        <SelectTrigger data-testid="select-new-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        data-testid="input-new-task-due-date"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                        className="flex-1"
                        data-testid="button-create-task"
                      >
                        {createTaskMutation.isPending ? "Saving..." : "Create"}
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewTaskForm(false)}
                        data-testid="button-cancel-new-task"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>

        <div className="px-6 py-4 border-t bg-muted/30 flex justify-between gap-2">
          {onDelete && (
            <Button 
              variant="destructive"
              size="sm"
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
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-event-modal"
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSaveEvent}
              disabled={updateEventMutation.isPending || !eventName.trim()}
              data-testid="button-save-event"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
