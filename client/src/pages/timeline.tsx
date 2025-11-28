import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Event, InsertEvent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, Users, Clock, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = [
  { value: "paath", label: "Paath", icon: "🙏" },
  { value: "mehndi", label: "Mehndi", icon: "🎨" },
  { value: "maiyan", label: "Maiyan", icon: "✨" },
  { value: "sangeet", label: "Sangeet", icon: "🎵" },
  { value: "anand_karaj", label: "Anand Karaj", icon: "🛕" },
  { value: "reception", label: "Reception", icon: "🎉" },
  { value: "custom", label: "Custom Event", icon: "📅" },
];

const EVENT_COLORS: Record<string, string> = {
  paath: "border-l-chart-4",
  mehndi: "border-l-chart-2",
  maiyan: "border-l-chart-3",
  sangeet: "border-l-chart-1",
  anand_karaj: "border-l-primary",
  reception: "border-l-chart-5",
  custom: "border-l-muted",
};

export default function TimelinePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  // Use the most recently created wedding (last in array)
  const wedding = weddings[weddings.length - 1];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
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

  const onSubmit = (data: InsertEvent) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
    // Note: Form reset and dialog close happen in onSuccess callbacks
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      weddingId: event.weddingId,
      name: event.name,
      type: event.type as InsertEvent['type'],
      date: event.date ? format(new Date(event.date), "yyyy-MM-dd") : "" as any,
      time: event.time || "",
      location: event.location || "",
      guestCount: event.guestCount || undefined,
      description: event.description || "",
      order: event.order,
      costPerHead: event.costPerHead?.toString() || "",
      venueCapacity: event.venueCapacity || undefined,
      budgetAllocation: event.budgetAllocation?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

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

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Event Timeline ✨
          </h1>
          <p className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Manage your complete celebration schedule 🎊
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
                          placeholder="Add event details..."
                          data-testid="input-event-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="costPerHead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Per Head (Optional)</FormLabel>
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
                        <FormLabel>Venue Capacity (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="number"
                            placeholder="e.g., 250"
                            data-testid="input-venue-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budgetAllocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="number"
                            step="0.01"
                            placeholder="e.g., 5000"
                            data-testid="input-budget-allocation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

      <div className="space-y-4">
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
          sortedEvents.map((event, index) => {
            const eventType = EVENT_TYPES.find((t) => t.value === event.type);

            return (
              <Card
                key={event.id}
                className={`p-6 border-l-4 ${EVENT_COLORS[event.type] || EVENT_COLORS.custom} hover-elevate transition-all bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50`}
                data-testid={`card-event-${event.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{eventType?.icon || "📅"}</span>
                      <div>
                        <h3 className="font-display text-2xl font-bold text-foreground">
                          {event.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Event {index + 1} of {sortedEvents.length}
                        </p>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {event.date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                        </div>
                      )}

                      {event.time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{event.time}</span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.guestCount && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{event.guestCount} guests</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(event)}
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                      data-testid={`button-delete-event-${event.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
