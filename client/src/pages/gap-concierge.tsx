import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { GapWindow, GapRecommendation, Event } from "@shared/schema";
import { insertGapWindowSchema, insertGapRecommendationSchema } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, MapPin, Car, Coffee, Utensils, Camera, ShoppingBag, Pencil, Trash2, Power, PowerOff, ChevronDown, ChevronUp, ExternalLink, Wine, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const gapFormSchema = insertGapWindowSchema.omit({ 
  weddingId: true 
}).extend({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  shuttleSchedule: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GapFormValues = z.infer<typeof gapFormSchema>;

const recFormSchema = insertGapRecommendationSchema.omit({ 
  gapWindowId: true,
  googlePlaceId: true,
}).extend({
  estimatedTravelTime: z.coerce.number().optional(),
  order: z.coerce.number().min(0).default(0),
});

type RecFormValues = z.infer<typeof recFormSchema>;

const RECOMMENDATION_TYPES = [
  { value: "restaurant", label: "Restaurant", icon: Utensils },
  { value: "coffee_shop", label: "Coffee Shop", icon: Coffee },
  { value: "bar", label: "Bar", icon: Wine },
  { value: "lounge", label: "Lounge", icon: Sparkles },
  { value: "attraction", label: "Attraction", icon: Camera },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "other", label: "Other", icon: MapPin },
] as const;

const PRICE_LEVELS = [
  { value: "$", label: "Budget ($)" },
  { value: "$$", label: "Moderate ($$)" },
  { value: "$$$", label: "Upscale ($$$)" },
  { value: "$$$$", label: "Luxury ($$$$)" },
] as const;

type RecommendationType = typeof RECOMMENDATION_TYPES[number]['value'];

function formatTime(timeStr: string | Date | null): string {
  if (!timeStr) return "";
  if (typeof timeStr === "string") {
    try {
      const parsed = parseISO(timeStr);
      return format(parsed, "h:mm a");
    } catch {
      return timeStr;
    }
  }
  return format(timeStr, "h:mm a");
}

function getRecommendationIcon(type: string) {
  const found = RECOMMENDATION_TYPES.find(t => t.value === type);
  return found ? found.icon : MapPin;
}


export default function GapConciergePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gapDialogOpen, setGapDialogOpen] = useState(false);
  const [recDialogOpen, setRecDialogOpen] = useState(false);
  const [editingGap, setEditingGap] = useState<GapWindow | null>(null);
  const [editingRec, setEditingRec] = useState<GapRecommendation | null>(null);
  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: gapWindows = [], isLoading: gapsLoading } = useQuery<{ gap: GapWindow; recommendations: GapRecommendation[] }[]>({
    queryKey: ["/api/weddings", wedding?.id, "gaps"],
    enabled: !!wedding?.id,
  });

  const createGapMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/weddings/${wedding.id}/gaps`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      setGapDialogOpen(false);
      toast({
        title: "Gap window created",
        description: "Guests will be notified about this downtime period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create gap window",
        variant: "destructive",
      });
    },
  });

  const updateGapMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/gaps/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      setGapDialogOpen(false);
      setEditingGap(null);
      toast({
        title: "Gap window updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deleteGapMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/gaps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      toast({
        title: "Gap window deleted",
        description: "The gap window has been removed.",
      });
    },
  });

  const toggleGapActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/gaps/${id}/activate`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      toast({
        title: "Status updated",
        description: "Gap visibility has been updated for guests.",
      });
    },
  });

  const createRecMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/gaps/${data.gapWindowId}/recommendations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      setRecDialogOpen(false);
      toast({
        title: "Recommendation added",
        description: "Guests will see this suggestion during the gap.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add recommendation",
        variant: "destructive",
      });
    },
  });

  const updateRecMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/recommendations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      setRecDialogOpen(false);
      setEditingRec(null);
      toast({
        title: "Recommendation updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deleteRecMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/recommendations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "gaps"] });
      toast({
        title: "Recommendation removed",
        description: "The recommendation has been deleted.",
      });
    },
  });

  const gapForm = useForm<GapFormValues>({
    resolver: zodResolver(gapFormSchema),
    defaultValues: {
      label: "",
      beforeEventId: "",
      afterEventId: "",
      startTime: "",
      endTime: "",
      shuttleSchedule: "",
      specialInstructions: "",
      isActive: true,
    },
  });

  const recForm = useForm<RecFormValues>({
    resolver: zodResolver(recFormSchema),
    defaultValues: {
      name: "",
      type: "restaurant",
      description: "",
      address: "",
      mapUrl: "",
      estimatedTravelTime: undefined,
      priceLevel: "$$",
      photoUrl: "",
      order: 0,
    },
  });

  const onGapSubmit = (data: GapFormValues) => {
    const payload = {
      weddingId: wedding.id,
      label: data.label,
      beforeEventId: data.beforeEventId && data.beforeEventId !== "__none__" ? data.beforeEventId : undefined,
      afterEventId: data.afterEventId && data.afterEventId !== "__none__" ? data.afterEventId : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      shuttleSchedule: data.shuttleSchedule || undefined,
      specialInstructions: data.specialInstructions || undefined,
      isActive: data.isActive ?? true,
    };
    if (editingGap) {
      updateGapMutation.mutate({ id: editingGap.id, data: payload });
    } else {
      createGapMutation.mutate(payload);
    }
    gapForm.reset();
  };

  const onRecSubmit = (data: RecFormValues) => {
    const payload = {
      gapWindowId: selectedGapId!,
      name: data.name,
      type: data.type,
      description: data.description || undefined,
      address: data.address || undefined,
      mapUrl: data.mapUrl || undefined,
      estimatedTravelTime: data.estimatedTravelTime,
      priceLevel: data.priceLevel || undefined,
      photoUrl: data.photoUrl || undefined,
      order: data.order,
    };
    if (editingRec) {
      updateRecMutation.mutate({ id: editingRec.id, data: payload });
    } else {
      createRecMutation.mutate(payload);
    }
    recForm.reset();
  };

  const handleEditGap = (gap: GapWindow) => {
    setEditingGap(gap);
    gapForm.reset({
      label: gap.label,
      beforeEventId: gap.beforeEventId || "",
      afterEventId: gap.afterEventId || "",
      startTime: gap.startTime ? format(new Date(gap.startTime), "yyyy-MM-dd'T'HH:mm") : "",
      endTime: gap.endTime ? format(new Date(gap.endTime), "yyyy-MM-dd'T'HH:mm") : "",
      shuttleSchedule: typeof gap.shuttleSchedule === 'string' ? gap.shuttleSchedule : "",
      specialInstructions: gap.specialInstructions || "",
      isActive: gap.isActive,
    });
    setGapDialogOpen(true);
  };

  const handleEditRec = (rec: GapRecommendation, gapId: string) => {
    setEditingRec(rec);
    setSelectedGapId(gapId);
    recForm.reset({
      name: rec.name,
      type: rec.type as RecommendationType,
      description: rec.description || "",
      address: rec.address || "",
      mapUrl: rec.mapUrl || "",
      estimatedTravelTime: rec.estimatedTravelTime?.toString() || "",
      priceLevel: rec.priceLevel || "$$",
      photoUrl: rec.photoUrl || "",
      order: rec.order,
    });
    setRecDialogOpen(true);
  };

  const handleAddRecommendation = (gapId: string) => {
    setSelectedGapId(gapId);
    setEditingRec(null);
    recForm.reset({
      name: "",
      type: "restaurant",
      description: "",
      address: "",
      mapUrl: "",
      estimatedTravelTime: "",
      priceLevel: "$$",
      photoUrl: "",
      order: 0,
    });
    setRecDialogOpen(true);
  };

  const toggleGapExpanded = (gapId: string) => {
    setExpandedGaps(prev => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  };

  const getEventName = (eventId: string | null) => {
    if (!eventId) return "Not specified";
    const event = events.find(e => e.id === eventId);
    return event?.name || "Unknown event";
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

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Gap Concierge
        </h1>
        <p className="text-muted-foreground">
          Help your guests make the most of downtime between events with personalized recommendations
        </p>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Why Gap Management Matters</h3>
              <p className="text-sm text-muted-foreground">
                South Asian weddings often have 3-4 hour gaps between ceremonies. Instead of letting guests wonder what to do, 
                provide curated recommendations for nearby restaurants, cafés, and attractions. You can also include shuttle schedules 
                and special instructions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{gapWindows.length}</span> gap windows configured
        </div>
        <Dialog open={gapDialogOpen} onOpenChange={(open) => {
          setGapDialogOpen(open);
          if (!open) {
            setEditingGap(null);
            gapForm.reset({
              label: "",
              beforeEventId: "",
              afterEventId: "",
              startTime: "",
              endTime: "",
              shuttleSchedule: "",
              specialInstructions: "",
              isActive: true,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-gap" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Gap Window
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGap ? "Edit Gap Window" : "Create Gap Window"}</DialogTitle>
            </DialogHeader>
            <Form {...gapForm}>
              <form onSubmit={gapForm.handleSubmit(onGapSubmit)} className="space-y-4">
                <FormField
                  control={gapForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gap Label</FormLabel>
                      <FormControl>
                        <Input data-testid="input-gap-label" placeholder="e.g., Break between Mehndi and Sangeet" {...field} />
                      </FormControl>
                      <FormDescription>A friendly name guests will see</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={gapForm.control}
                    name="afterEventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>After Event</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-after-event">
                              <SelectValue placeholder="Select event" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {events.map(event => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gapForm.control}
                    name="beforeEventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Before Event</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-before-event">
                              <SelectValue placeholder="Select event" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {events.map(event => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={gapForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input data-testid="input-gap-start" type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gapForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input data-testid="input-gap-end" type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={gapForm.control}
                  name="shuttleSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shuttle Schedule (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="input-shuttle-schedule"
                          placeholder="e.g., Shuttles depart from hotel lobby at 2:00 PM, 2:30 PM, and 3:00 PM"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={gapForm.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="input-special-instructions"
                          placeholder="e.g., Please wear comfortable shoes for the next event"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={gapForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          When active, guests can see this gap window in their portal
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          data-testid="switch-gap-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGapDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-save-gap"
                    disabled={createGapMutation.isPending || updateGapMutation.isPending}
                  >
                    {editingGap ? "Save Changes" : "Create Gap Window"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {gapsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : gapWindows.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">No gap windows configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add gap windows to help guests during downtime between events
              </p>
              <Button data-testid="button-add-first-gap" onClick={() => setGapDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Gap Window
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {gapWindows.map(({ gap, recommendations }) => (
            <Card key={gap.id} className={`${!gap.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <CardTitle className="text-lg">{gap.label}</CardTitle>
                      <Badge variant={gap.isActive ? "default" : "secondary"}>
                        {gap.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(gap.startTime)} - {formatTime(gap.endTime)}
                      </span>
                      {gap.afterEventId && (
                        <span>After: {getEventName(gap.afterEventId)}</span>
                      )}
                      {gap.beforeEventId && (
                        <span>Before: {getEventName(gap.beforeEventId)}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-toggle-gap-${gap.id}`}
                      onClick={() => toggleGapActiveMutation.mutate({ id: gap.id, isActive: !gap.isActive })}
                    >
                      {gap.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-edit-gap-${gap.id}`}
                      onClick={() => handleEditGap(gap)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-delete-gap-${gap.id}`}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this gap window?")) {
                          deleteGapMutation.mutate(gap.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleGapExpanded(gap.id)}
                    >
                      {expandedGaps.has(gap.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedGaps.has(gap.id) && (
                <CardContent className="pt-4 border-t">
                  {gap.shuttleSchedule != null && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">Shuttle Schedule</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeof gap.shuttleSchedule === 'string' 
                          ? (gap.shuttleSchedule as string)
                          : JSON.stringify(gap.shuttleSchedule as object)}
                      </p>
                    </div>
                  )}

                  {gap.specialInstructions && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-sm">Special Instructions</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{gap.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-medium">Recommendations ({recommendations.length})</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-add-rec-${gap.id}`}
                      onClick={() => handleAddRecommendation(gap.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recommendations yet. Add restaurants, cafés, or attractions for your guests.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {recommendations.map(rec => {
                        const Icon = getRecommendationIcon(rec.type);
                        return (
                          <Card key={rec.id} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-medium text-sm truncate">{rec.name}</h5>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                                    {rec.priceLevel && <span>{rec.priceLevel}</span>}
                                    {rec.estimatedTravelTime && <span>{rec.estimatedTravelTime} min</span>}
                                  </div>
                                  {rec.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                                  )}
                                  {rec.mapUrl && (
                                    <a 
                                      href={rec.mapUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                                    >
                                      View on map <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  data-testid={`button-edit-rec-${rec.id}`}
                                  onClick={() => handleEditRec(rec, gap.id)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  data-testid={`button-delete-rec-${rec.id}`}
                                  onClick={() => {
                                    if (confirm("Delete this recommendation?")) {
                                      deleteRecMutation.mutate(rec.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={recDialogOpen} onOpenChange={(open) => {
        setRecDialogOpen(open);
        if (!open) {
          setEditingRec(null);
          setSelectedGapId(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRec ? "Edit Recommendation" : "Add Recommendation"}</DialogTitle>
          </DialogHeader>
          <Form {...recForm}>
            <form onSubmit={recForm.handleSubmit(onRecSubmit)} className="space-y-4">
              <FormField
                control={recForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-rec-name" placeholder="e.g., The Chai House" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={recForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rec-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RECOMMENDATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={recForm.control}
                  name="priceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rec-price">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRICE_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={recForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-rec-description"
                        placeholder="Brief description of this place"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={recForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-rec-address"
                        placeholder="123 Main St, City, State"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={recForm.control}
                name="mapUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps URL</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-rec-map"
                        placeholder="https://maps.google.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={recForm.control}
                name="estimatedTravelTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-rec-travel"
                        type="number"
                        placeholder="e.g., 5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Walking or driving time from venue</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={recForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-rec-photo"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRecDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-save-rec"
                  disabled={createRecMutation.isPending || updateRecMutation.isPending}
                >
                  {editingRec ? "Save Changes" : "Add Recommendation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
