import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { GuestListManager } from "@/components/guest-list-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema, type Wedding, type Guest, type Event } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Trash2 } from "lucide-react";

const guestFormSchema = insertGuestSchema.extend({
  eventIds: z.array(z.string()).optional(),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

export default function Guests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: guests = [], isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      side: "bride",
      rsvpStatus: "pending",
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      return await apiRequest("POST", "/api/guests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest added",
        description: "Guest has been added to your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add guest",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GuestFormData> }) => {
      return await apiRequest("PATCH", `/api/guests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest updated",
        description: "Guest has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest deleted",
        description: "Guest has been removed from your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      });
    },
  });

  // Redirect to onboarding if no wedding exists
  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  // Update form when wedding is loaded
  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
    }
  }, [wedding?.id, form]);

  const handleAddGuest = () => {
    setEditingGuest(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      side: "bride" as const,
      rsvpStatus: "pending" as const,
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    });
    setSelectedEvents([]);
    setDialogOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    form.reset({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      side: (guest.side || "bride") as "bride" | "groom" | "mutual",
      rsvpStatus: (guest.rsvpStatus || "pending") as "confirmed" | "declined" | "pending",
      plusOne: guest.plusOne || false,
      eventIds: guest.eventIds || [],
      weddingId: guest.weddingId,
    });
    setSelectedEvents(guest.eventIds || []);
    setDialogOpen(true);
  };

  const handleSubmit = (data: GuestFormData) => {
    const guestData = {
      ...data,
      eventIds: selectedEvents,
    };

    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data: guestData });
    } else {
      createMutation.mutate(guestData);
    }
  };

  const handleDelete = () => {
    if (editingGuest) {
      deleteMutation.mutate(editingGuest.id);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  if (weddingsLoading || guestsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader wedding={wedding} />

      <main className="container mx-auto px-6 py-8">
        <GuestListManager
          guests={guests}
          onAddGuest={handleAddGuest}
          onEditGuest={handleEditGuest}
        />
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-guest">
              {editingGuest ? "Edit Guest" : "Add Guest"}
            </DialogTitle>
            <DialogDescription>
              {editingGuest
                ? "Update guest information and event assignments"
                : "Add a new guest to your wedding"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Guest name"
                  data-testid="input-guest-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="guest@example.com"
                  data-testid="input-guest-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(555) 123-4567"
                  data-testid="input-guest-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="side">
                  Side <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("side")}
                  onValueChange={(value) => form.setValue("side", value as "bride" | "groom" | "mutual")}
                >
                  <SelectTrigger id="side" data-testid="select-guest-side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rsvpStatus">
                  RSVP Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("rsvpStatus")}
                  onValueChange={(value) => form.setValue("rsvpStatus", value as "confirmed" | "declined" | "pending")}
                >
                  <SelectTrigger id="rsvpStatus" data-testid="select-guest-rsvp">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="plusOne"
                  checked={form.watch("plusOne") || false}
                  onCheckedChange={(checked) => form.setValue("plusOne", !!checked)}
                  data-testid="checkbox-guest-plus-one"
                />
                <Label htmlFor="plusOne" className="cursor-pointer">
                  Plus One
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Event Assignments</Label>
              <p className="text-sm text-muted-foreground">
                Select which events this guest will attend
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No events created yet. Add events to assign guests.
                  </p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        data-testid={`checkbox-event-${event.id}`}
                      />
                      <Label
                        htmlFor={`event-${event.id}`}
                        className="cursor-pointer flex-1"
                      >
                        {event.name}
                        {event.date && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({new Date(event.date).toLocaleDateString()})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-between">
              {editingGuest && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-guest"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-guest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-guest"
                >
                  {editingGuest ? "Update Guest" : "Add Guest"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
