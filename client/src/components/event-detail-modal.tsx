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
import { Calendar, Clock, MapPin, Users, DollarSign, Tag, CheckCircle2, Plus, Save } from "lucide-react";
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
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: Partial<Event>) => {
      return await apiRequest("PATCH", `/api/events/${event!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", weddingId] });
      toast({
        title: "Event updated",
        description: "Your changes have been saved.",
      });
      onOpenChange(false);
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
    } as Partial<Event>);
  };

  if (!event) return null;

  const currentEventType = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES] || EVENT_TYPES.custom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span>{currentEventType?.icon || "📅"}</span>
            Edit Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editable Event Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="event-name" className="text-sm font-medium text-muted-foreground">Event Name</Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  className="mt-1"
                  data-testid="input-event-name"
                />
              </div>

              <div>
                <Label htmlFor="event-type" className="text-sm font-medium text-muted-foreground">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="mt-1" data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, { icon, label }]) => (
                      <SelectItem key={key} value={key}>
                        {icon} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event-description" className="text-sm font-medium text-muted-foreground">Description</Label>
                <Textarea
                  id="event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Event description (optional)"
                  className="mt-1 resize-none"
                  rows={2}
                  data-testid="input-event-description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-event-date"
                />
              </div>

              <div>
                <Label htmlFor="event-time" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time
                </Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="mt-1"
                  data-testid="input-event-time"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="event-location" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </Label>
                <Input
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Venue name or address"
                  className="mt-1"
                  data-testid="input-event-location"
                />
              </div>

              <div>
                <Label htmlFor="event-guest-count" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Expected Guests
                </Label>
                <Input
                  id="event-guest-count"
                  type="number"
                  value={eventGuestCount}
                  onChange={(e) => setEventGuestCount(e.target.value)}
                  placeholder="Number of guests"
                  className="mt-1"
                  data-testid="input-event-guest-count"
                />
              </div>

              <div>
                <Label htmlFor="event-venue-capacity" className="text-sm font-medium text-muted-foreground">Venue Capacity</Label>
                <Input
                  id="event-venue-capacity"
                  type="number"
                  value={eventVenueCapacity}
                  onChange={(e) => setEventVenueCapacity(e.target.value)}
                  placeholder="Max capacity"
                  className="mt-1"
                  data-testid="input-event-venue-capacity"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="event-cost-per-head" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Cost Per Head
                </Label>
                <Input
                  id="event-cost-per-head"
                  type="number"
                  step="0.01"
                  value={eventCostPerHead}
                  onChange={(e) => setEventCostPerHead(e.target.value)}
                  placeholder="Cost per guest"
                  className="mt-1"
                  data-testid="input-event-cost-per-head"
                />
              </div>
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

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
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
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-close-event-modal"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEvent}
                disabled={updateEventMutation.isPending || !eventName.trim()}
                data-testid="button-save-event"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
