import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Event, InsertEvent, EventCostItem, BudgetCategory } from "@shared/schema";
import { EventDetailModal } from "@/components/event-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, Users, Clock, Pencil, Trash2, DollarSign, X, Tag, HelpCircle, ChevronDown, ChevronRight, Sun, Sunset, Moon, Sunrise, CheckCircle2, CircleDot } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { format, isAfter, isBefore, isToday, startOfDay, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const COST_PRESETS = [
  { name: "Catering", type: "per_head" as const, defaultCategory: "catering" },
  { name: "Venue Rental", type: "fixed" as const, defaultCategory: "venue" },
  { name: "Decorations", type: "fixed" as const, defaultCategory: "decoration" },
  { name: "DJ/Entertainment", type: "fixed" as const, defaultCategory: "entertainment" },
  { name: "Photography", type: "fixed" as const, defaultCategory: "photography" },
  { name: "Videography", type: "fixed" as const, defaultCategory: "photography" },
  { name: "Flowers", type: "fixed" as const, defaultCategory: "decoration" },
  { name: "Lighting", type: "fixed" as const, defaultCategory: "venue" },
  { name: "Valet", type: "fixed" as const, defaultCategory: "transportation" },
  { name: "Bartender", type: "fixed" as const, defaultCategory: "catering" },
];

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

const EVENT_TYPES = [
  { value: "paath", label: "Paath", icon: "🙏" },
  { value: "mehndi", label: "Mehndi", icon: "🎨" },
  { value: "maiyan", label: "Maiyan", icon: "✨" },
  { value: "sangeet", label: "Sangeet", icon: "🎵" },
  { value: "anand_karaj", label: "Anand Karaj", icon: "🛕" },
  { value: "reception", label: "Reception", icon: "🎉" },
  { value: "custom", label: "Custom Event", icon: "📅" },
];

const EVENT_COLORS: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
  paath: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-400", icon: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-orange-500" },
  mehndi: { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-400", icon: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
  maiyan: { bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-400", icon: "text-yellow-600 dark:text-yellow-400", gradient: "from-yellow-500 to-amber-500" },
  sangeet: { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-400", icon: "text-pink-600 dark:text-pink-400", gradient: "from-pink-500 to-rose-500" },
  anand_karaj: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-red-500" },
  reception: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-400", icon: "text-purple-600 dark:text-purple-400", gradient: "from-purple-500 to-indigo-500" },
  custom: { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-400", icon: "text-slate-600 dark:text-slate-400", gradient: "from-slate-500 to-gray-500" },
};

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

const getTimeOfDay = (timeStr: string | null | undefined): TimeOfDay => {
  if (!timeStr) return "afternoon";
  const lowerTime = timeStr.toLowerCase();
  
  const hourMatch = lowerTime.match(/(\d{1,2})/);
  if (!hourMatch) return "afternoon";
  
  let hour = parseInt(hourMatch[1], 10);
  const isPM = lowerTime.includes("pm");
  const isAM = lowerTime.includes("am");
  
  if (isPM && hour !== 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: typeof Sun; color: string }> = {
  morning: { label: "Morning", icon: Sunrise, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  afternoon: { label: "Afternoon", icon: Sun, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  evening: { label: "Evening", icon: Sunset, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300" },
  night: { label: "Night", icon: Moon, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
};

interface DayGroup {
  date: string;
  dateObj: Date;
  dayNumber: number;
  dayName: string;
  events: Event[];
}

export default function TimelinePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [costItemsOpen, setCostItemsOpen] = useState(false);
  const [newCostItem, setNewCostItem] = useState({ name: "", costType: "fixed" as "per_head" | "fixed", amount: "", categoryId: "" });
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: budgetCategories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: costItems = [], isLoading: costItemsLoading } = useQuery<EventCostItem[]>({
    queryKey: ["/api/events", editingEvent?.id, "cost-items"],
    enabled: !!editingEvent?.id,
  });

  const { data: viewingCostItems = [], isLoading: viewingCostItemsLoading } = useQuery<EventCostItem[]>({
    queryKey: ["/api/events", viewingEventId, "cost-items"],
    enabled: !!viewingEventId,
  });

  const createCostItemMutation = useMutation({
    mutationFn: async (data: { name: string; costType: string; amount: string; categoryId?: string }) => {
      return await apiRequest("POST", `/api/events/${editingEvent?.id}/cost-items`, {
        ...data,
        categoryId: data.categoryId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", editingEvent?.id, "cost-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cost-summary"] });
      setNewCostItem({ name: "", costType: "fixed", amount: "", categoryId: "" });
      toast({ title: "Cost item added", description: "The cost has been added to this event." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add cost item.", variant: "destructive" });
    },
  });

  const deleteCostItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/event-cost-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", editingEvent?.id, "cost-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "cost-summary"] });
      toast({ title: "Cost item removed", description: "The cost has been removed." });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      return await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      setDialogOpen(false);
      toast({
        title: "Event created",
        description: "Your event has been added to the timeline.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEvent> }) => {
      return await apiRequest("PATCH", `/api/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      setDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      toast({
        title: "Event deleted",
        description: "The event has been removed from your timeline.",
      });
    },
  });

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      weddingId: wedding?.id || "",
      name: "",
      type: "custom",
      order: events.length + 1,
    },
  });

  const toDateKey = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().slice(0, 10);
  };

  const dateKeyToLocalDate = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const onSubmit = (data: InsertEvent) => {
    const processedData = {
      ...data,
      venueCapacity: data.venueCapacity ? parseInt(data.venueCapacity as any, 10) : undefined,
      costPerHead: data.costPerHead ? data.costPerHead.toString() : undefined,
      guestCount: data.guestCount ? parseInt(data.guestCount as any, 10) : undefined,
    };
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      weddingId: event.weddingId,
      name: event.name,
      type: event.type as InsertEvent['type'],
      date: (toDateKey(event.date) || "") as any,
      time: event.time || "",
      location: event.location || "",
      guestCount: event.guestCount || undefined,
      description: event.description || "",
      order: event.order,
      costPerHead: event.costPerHead?.toString() || "",
      venueCapacity: event.venueCapacity || undefined,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const getViewingEvent = () => {
    return events.find((e) => e.id === viewingEventId);
  };

  const toggleDayCollapse = (dateKey: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  useEffect(() => {
    if (editingEvent) {
      setCostItemsOpen(true);
    }
  }, [editingEvent]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("eventId");
    if (eventId && events.length > 0 && !editingEvent) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        handleEdit(event);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [events]);

  const sortedEvents = [...events].sort((a, b) => {
    const aKey = toDateKey(a.date);
    const bKey = toDateKey(b.date);
    if (aKey && bKey) {
      const dateCompare = aKey.localeCompare(bKey);
      if (dateCompare !== 0) return dateCompare;
    }
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.order - b.order;
  });

  const dayGroups = useMemo((): DayGroup[] => {
    const groups: Map<string, Event[]> = new Map();
    const undatedEvents: Event[] = [];
    
    sortedEvents.forEach(event => {
      const dateKey = toDateKey(event.date);
      if (dateKey) {
        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)!.push(event);
      } else {
        undatedEvents.push(event);
      }
    });

    const sortedDates = Array.from(groups.keys()).sort();
    
    const result: DayGroup[] = sortedDates.map((dateKey, index) => {
      const dateObj = dateKeyToLocalDate(dateKey);
      const dayEvents = groups.get(dateKey)!;
      const primaryEvent = dayEvents.find(e => ["sangeet", "anand_karaj", "reception", "mehndi"].includes(e.type));
      
      return {
        date: dateKey,
        dateObj,
        dayNumber: index + 1,
        dayName: primaryEvent ? EVENT_TYPES.find(t => t.value === primaryEvent.type)?.label || "Events" : "Events",
        events: dayEvents,
      };
    });

    if (undatedEvents.length > 0) {
      result.push({
        date: "unscheduled",
        dateObj: new Date(),
        dayNumber: 0,
        dayName: "To Be Scheduled",
        events: undatedEvents,
      });
    }

    return result;
  }, [sortedEvents]);

  const getEventStatus = (event: Event): "completed" | "today" | "upcoming" => {
    const dateKey = toDateKey(event.date);
    if (!dateKey) return "upcoming";
    
    const eventDate = dateKeyToLocalDate(dateKey);
    const today = startOfDay(new Date());
    
    if (isBefore(eventDate, today)) return "completed";
    if (isToday(eventDate)) return "today";
    return "upcoming";
  };

  const getDaySummary = (dayEvents: Event[]) => {
    const totalGuests = dayEvents.reduce((sum, e) => sum + (e.guestCount || 0), 0);
    const venues = Array.from(new Set(dayEvents.filter(e => e.location).map(e => e.location)));
    const estimatedCost = dayEvents.reduce((sum, e) => {
      if (e.costPerHead && e.guestCount) {
        return sum + (parseFloat(e.costPerHead) * e.guestCount);
      }
      return sum;
    }, 0);
    
    return { totalGuests, venues, estimatedCost };
  };

  if (weddingsLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!wedding) {
    setLocation("/onboarding");
    return null;
  }

  const renderEventNode = (event: Event, isLast: boolean) => {
    const eventType = EVENT_TYPES.find((t) => t.value === event.type);
    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.custom;
    const timeOfDay = getTimeOfDay(event.time);
    const todConfig = TIME_OF_DAY_CONFIG[timeOfDay];
    const TimeIcon = todConfig.icon;
    const status = getEventStatus(event);

    return (
      <div key={event.id} className="relative flex gap-4" data-testid={`timeline-event-${event.id}`}>
        <div className="flex flex-col items-center">
          <div 
            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${colors.border} ${colors.bg} shadow-md transition-transform hover:scale-110`}
          >
            {status === "completed" ? (
              <CheckCircle2 className={`w-6 h-6 ${colors.icon}`} />
            ) : status === "today" ? (
              <CircleDot className={`w-6 h-6 ${colors.icon} animate-pulse`} />
            ) : (
              <span className="text-xl">{eventType?.icon || "📅"}</span>
            )}
          </div>
          {!isLast && (
            <div className="w-0.5 h-full min-h-[80px] bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/10" />
          )}
        </div>

        <Card 
          className={`flex-1 mb-4 cursor-pointer transition-all hover-elevate ${
            status === "completed" ? "opacity-70" : ""
          } ${status === "today" ? "ring-2 ring-orange-400 ring-offset-2" : ""}`}
          onClick={() => setViewingEventId(event.id)}
          data-testid={`card-event-${event.id}`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {event.name}
                  </h3>
                  <Badge className={`${todConfig.color} gap-1`}>
                    <TimeIcon className="w-3 h-3" />
                    {todConfig.label}
                  </Badge>
                  {status === "completed" && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </Badge>
                  )}
                  {status === "today" && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-1">
                      <CircleDot className="w-3 h-3" />
                      Today
                    </Badge>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {event.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{event.location}</span>
                    </div>
                  )}
                  {event.guestCount && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{event.guestCount} guests</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(event)}
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(event.id)}
                  data-testid={`button-delete-event-${event.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDaySection = (day: DayGroup) => {
    const isCollapsed = collapsedDays.has(day.date);
    const summary = getDaySummary(day.events);
    const isUnscheduled = day.date === "unscheduled";
    const dayStatus = isUnscheduled ? "upcoming" : getEventStatus(day.events[0]);
    
    return (
      <div key={day.date} className="mb-8" data-testid={`day-section-${day.date}`}>
        <Collapsible open={!isCollapsed} onOpenChange={() => toggleDayCollapse(day.date)}>
          <div className={`mb-4 rounded-xl p-4 ${
            isUnscheduled 
              ? "bg-muted/50 border border-dashed border-muted-foreground/30" 
              : dayStatus === "completed" 
                ? "bg-muted/30" 
                : dayStatus === "today"
                  ? "bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 border border-orange-200 dark:border-orange-800"
                  : "bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/10 dark:to-pink-900/10"
          }`}>
            <CollapsibleTrigger asChild>
              <button className="w-full text-left" data-testid={`button-toggle-day-${day.date}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isUnscheduled && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">
                            Day {day.dayNumber}
                          </Badge>
                        )}
                        <h2 className="text-xl font-bold text-foreground">
                          {day.dayName}
                        </h2>
                        {dayStatus === "today" && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white animate-pulse">
                            Today
                          </Badge>
                        )}
                        {dayStatus === "completed" && !isUnscheduled && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {!isUnscheduled && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {format(day.dateObj, "EEEE, MMMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {day.events.length} {day.events.length === 1 ? "event" : "events"}
                    </span>
                    {summary.totalGuests > 0 && (
                      <span className="flex items-center gap-1 hidden sm:flex">
                        <Users className="w-4 h-4" />
                        {summary.totalGuests} guests
                      </span>
                    )}
                    {summary.estimatedCost > 0 && (
                      <span className="flex items-center gap-1 hidden md:flex">
                        <DollarSign className="w-4 h-4" />
                        ${summary.estimatedCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>
            
            {!isCollapsed && summary.venues.length > 0 && (
              <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Venues:</span>
                  {summary.venues.slice(0, 3).map((venue, idx) => (
                    <Badge key={idx} variant="outline" className="font-normal">
                      {venue}
                    </Badge>
                  ))}
                  {summary.venues.length > 3 && (
                    <span className="text-xs">+{summary.venues.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="pl-2">
              {day.events.map((event, idx) => 
                renderEventNode(event, idx === day.events.length - 1)
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Your Wedding Journey
          </h1>
          <p className="text-muted-foreground">
            {dayGroups.filter(d => d.date !== "unscheduled").length} days of celebration with {events.length} events
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            form.reset({
              weddingId: wedding?.id || "",
              name: "",
              type: "custom",
              order: events.length + 1,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-add-event" 
              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Lady Sangeet"
                          data-testid="input-event-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={typeof field.value === 'string' ? field.value : ''}
                            type="date"
                            data-testid="input-event-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g., 6:00 PM"
                            data-testid="input-event-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g., Gurdwara Sahib San Jose"
                          data-testid="input-event-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Guest Count (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g., 200"
                          data-testid="input-guest-count"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g., Formal lunch at the temple, limited to 150 guests, traditional dress requested"
                          data-testid="input-event-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costPerHead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Cost Per Head (Optional)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              This multiplies by guest count. For example, $150 per guest x 200 guests = $30,000
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="number"
                            step="0.01"
                            placeholder="e.g., 150"
                            data-testid="input-cost-per-head"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venueCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Venue Capacity (Optional)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              The maximum number of guests the venue can hold. This helps identify if your guest list exceeds space limits.
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g., 250"
                            data-testid="input-venue-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {editingEvent && (
                  <Collapsible open={costItemsOpen} onOpenChange={setCostItemsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Event Cost Items
                          {costItems.length > 0 && (
                            <Badge variant="secondary">{costItems.length}</Badge>
                          )}
                        </span>
                        {costItemsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      {costItemsLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : (
                        <>
                          {costItems.length > 0 && (
                            <div className="space-y-2">
                              {costItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{item.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {item.costType === "per_head" ? "Per Head" : "Fixed"}
                                    </Badge>
                                    {item.categoryId && budgetCategories.find(c => c.id === item.categoryId) && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {CATEGORY_LABELS[budgetCategories.find(c => c.id === item.categoryId)?.category || ""] || budgetCategories.find(c => c.id === item.categoryId)?.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">${parseFloat(item.amount).toLocaleString()}</span>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteCostItemMutation.mutate(item.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="p-4 rounded-lg border border-dashed space-y-3">
                            <p className="text-sm text-muted-foreground font-medium">Add New Cost Item</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {COST_PRESETS.map((preset) => (
                                <Button
                                  key={preset.name}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const category = budgetCategories.find(c => c.category === preset.defaultCategory);
                                    setNewCostItem(prev => ({ 
                                      ...prev, 
                                      name: preset.name, 
                                      costType: preset.type,
                                      categoryId: category?.id || ""
                                    }));
                                  }}
                                >
                                  {preset.name}
                                </Button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Cost name"
                                value={newCostItem.name}
                                onChange={(e) => setNewCostItem(prev => ({ ...prev, name: e.target.value }))}
                              />
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={newCostItem.amount}
                                onChange={(e) => setNewCostItem(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Select
                                value={newCostItem.costType}
                                onValueChange={(v) => setNewCostItem(prev => ({ ...prev, costType: v as "per_head" | "fixed" }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Cost type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed Cost</SelectItem>
                                  <SelectItem value="per_head">Per Head</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={newCostItem.categoryId}
                                onValueChange={(v) => setNewCostItem(prev => ({ ...prev, categoryId: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Budget category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  {budgetCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {CATEGORY_LABELS[cat.category] || cat.category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              className="w-full"
                              variant="secondary"
                              disabled={!newCostItem.name || !newCostItem.amount || createCostItemMutation.isPending}
                              onClick={() => createCostItemMutation.mutate(newCostItem)}
                            >
                              {createCostItemMutation.isPending ? "Adding..." : "Add Cost Item"}
                            </Button>
                          </div>
                        </>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingEvent(null);
                      form.reset({
                        weddingId: wedding?.id || "",
                        name: "",
                        type: "custom",
                        order: events.length + 1,
                      });
                    }}
                    data-testid="button-cancel-event"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-event"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        {eventsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your celebration timeline
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-event" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Event
            </Button>
          </Card>
        ) : (
          <div>
            {dayGroups.map(day => renderDaySection(day))}
          </div>
        )}
      </div>

      <EventDetailModal
        open={!!viewingEventId}
        onOpenChange={(open) => {
          if (!open) setViewingEventId(null);
        }}
        event={getViewingEvent() || null}
        costItems={viewingCostItems}
        costItemsLoading={viewingCostItemsLoading}
        budgetCategories={budgetCategories}
        onEdit={(event) => {
          setViewingEventId(null);
          handleEdit(event);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
