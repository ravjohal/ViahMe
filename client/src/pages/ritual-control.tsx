import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { RitualStage, RitualStageUpdate, Event, LiveWeddingStatus } from "@shared/schema";
import { insertRitualStageSchema, insertRitualStageUpdateSchema } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Pencil, 
  Trash2, 
  Radio, 
  WifiOff,
  ChevronDown,
  ChevronUp,
  Send,
  Users,
  Sparkles
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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

const stageFormSchema = insertRitualStageSchema.extend({
  eventId: z.string().min(1, "Event is required"),
  stageKey: z.string().min(1, "Stage key is required"),
  displayName: z.string().min(1, "Display name is required"),
  plannedDuration: z.coerce.number().min(1).default(15),
  displayOrder: z.coerce.number().min(0).default(0),
  notifyOnStart: z.boolean().default(true),
});

type StageFormValues = z.infer<typeof stageFormSchema>;

const updateFormSchema = insertRitualStageUpdateSchema.omit({ 
  ritualStageId: true, 
  updatedBy: true 
}).extend({
  message: z.string().optional(),
  delayMinutes: z.coerce.number().min(0).default(0),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;

const broadcastFormSchema = z.object({
  message: z.string().min(1, "Message is required").max(500, "Message too long"),
});

type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;

const STAGE_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-muted text-muted-foreground" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "delayed", label: "Delayed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
] as const;

type StageStatus = typeof STAGE_STATUSES[number]['value'];

export default function RitualControlPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<RitualStage | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: liveStatus } = useQuery<LiveWeddingStatus | null>({
    queryKey: ["/api/weddings", wedding?.id, "live-status"],
    enabled: !!wedding?.id,
  });

  const fetchStagesForEvent = async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}/stages`);
    if (!response.ok) return [];
    return response.json();
  };

  const goLiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/weddings/${wedding.id}/go-live`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      toast({
        title: "You're now live!",
        description: "Guests can see real-time updates on their devices.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to go live",
        variant: "destructive",
      });
    },
  });

  const goOfflineMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/weddings/${wedding.id}/go-offline`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      toast({
        title: "Broadcast ended",
        description: "You're now offline. Guests won't receive updates.",
      });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}/live-status`, {
        lastBroadcastMessage: data.message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      setBroadcastDialogOpen(false);
      toast({
        title: "Message broadcast",
        description: "All guests will see your message.",
      });
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/events/${data.eventId}/stages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setStageDialogOpen(false);
      toast({
        title: "Stage created",
        description: "The ceremony stage has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stage",
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/stages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setStageDialogOpen(false);
      setEditingStage(null);
      toast({
        title: "Stage updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Stage deleted",
        description: "The ceremony stage has been removed.",
      });
    },
  });

  const postUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/stages/${data.ritualStageId}/updates`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      setUpdateDialogOpen(false);
      toast({
        title: "Update posted",
        description: "Guests will see this update in their live feed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post update",
        variant: "destructive",
      });
    },
  });

  const stageForm = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      eventId: "",
      stageKey: "",
      displayName: "",
      description: "",
      plannedDuration: 15,
      displayOrder: 0,
      guestInstructions: "",
      notifyOnStart: true,
    },
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      status: "in_progress",
      message: "",
      delayMinutes: 0,
    },
  });

  const broadcastForm = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      message: "",
    },
  });

  const onStageSubmit = (data: StageFormValues) => {
    const payload = {
      eventId: data.eventId,
      stageKey: data.stageKey,
      displayName: data.displayName,
      description: data.description || undefined,
      plannedDuration: data.plannedDuration,
      displayOrder: data.displayOrder,
      guestInstructions: data.guestInstructions || undefined,
      notifyOnStart: data.notifyOnStart ?? true,
    };
    if (editingStage) {
      updateStageMutation.mutate({ id: editingStage.id, data: payload });
    } else {
      createStageMutation.mutate(payload);
    }
    stageForm.reset();
  };

  const onUpdateSubmit = (data: UpdateFormValues) => {
    if (!selectedStageId) return;
    const payload = {
      ritualStageId: selectedStageId,
      status: data.status,
      message: data.message || undefined,
      delayMinutes: data.delayMinutes,
    };
    postUpdateMutation.mutate(payload);
    updateForm.reset();
  };

  const onBroadcastSubmit = (data: BroadcastFormValues) => {
    broadcastMutation.mutate({ message: data.message });
    broadcastForm.reset();
  };

  const handleAddStage = (eventId: string) => {
    setSelectedEventId(eventId);
    setEditingStage(null);
    stageForm.reset({
      eventId: eventId,
      stageKey: "",
      displayName: "",
      description: "",
      plannedDuration: 15,
      displayOrder: 0,
      guestInstructions: "",
      notifyOnStart: true,
    });
    setStageDialogOpen(true);
  };

  const handleEditStage = (stage: RitualStage) => {
    setEditingStage(stage);
    stageForm.reset({
      eventId: stage.eventId,
      stageKey: stage.stageKey,
      displayName: stage.displayName,
      description: stage.description || "",
      plannedDuration: stage.plannedDuration || 15,
      displayOrder: stage.displayOrder,
      guestInstructions: stage.guestInstructions || "",
      notifyOnStart: stage.notifyOnStart ?? true,
    });
    setStageDialogOpen(true);
  };

  const handlePostUpdate = (stageId: string) => {
    setSelectedStageId(stageId);
    updateForm.reset({
      status: "in_progress",
      message: "",
      delayMinutes: 0,
    });
    setUpdateDialogOpen(true);
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STAGE_STATUSES.find(s => s.value === status) || STAGE_STATUSES[0];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
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

  const isLive = liveStatus?.isLive === true;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Ritual Control Panel
        </h1>
        <p className="text-muted-foreground">
          Manage ceremony stages and broadcast live updates to your guests
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className={`${isLive ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLive ? (
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 animate-pulse">
                    <Radio className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-muted">
                    <WifiOff className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{isLive ? "You're Live!" : "Currently Offline"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isLive ? "Guests can see updates" : "Guests won't see updates"}
                  </p>
                </div>
              </div>
              <Button
                variant={isLive ? "destructive" : "default"}
                size="sm"
                data-testid="button-toggle-live"
                onClick={() => isLive ? goOfflineMutation.mutate() : goLiveMutation.mutate()}
                disabled={goLiveMutation.isPending || goOfflineMutation.isPending}
              >
                {isLive ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Go Offline
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Go Live
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Send className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Broadcast</h3>
                  <p className="text-sm text-muted-foreground">
                    Send a message to all guests
                  </p>
                </div>
              </div>
              <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-broadcast" disabled={!isLive}>
                    <Send className="w-4 h-4 mr-1" />
                    Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Broadcast Message</DialogTitle>
                  </DialogHeader>
                  <Form {...broadcastForm}>
                    <form onSubmit={broadcastForm.handleSubmit(onBroadcastSubmit)} className="space-y-4">
                      <FormField
                        control={broadcastForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="input-broadcast-message"
                                placeholder="e.g., The ceremony is starting in 5 minutes!"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>This message will appear at the top of guest screens</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-send-broadcast" disabled={broadcastMutation.isPending}>
                          <Send className="w-4 h-4 mr-1" />
                          Send to Guests
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Guest Experience</h3>
                <p className="text-sm text-muted-foreground">
                  {events.length} events configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {liveStatus?.lastBroadcastMessage && (
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">Last Broadcast</h4>
                <p className="text-foreground">{liveStatus.lastBroadcastMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Ceremony Stages by Event
        </h2>

        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">No events yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create events in your Timeline first, then add ceremony stages here
                </p>
                <Button onClick={() => setLocation("/timeline")}>
                  Go to Timeline
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <EventStagesCard 
                key={event.id} 
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEventExpanded(event.id)}
                onAddStage={() => handleAddStage(event.id)}
                onEditStage={handleEditStage}
                onDeleteStage={(id) => {
                  if (confirm("Delete this stage?")) {
                    deleteStageMutation.mutate(id);
                  }
                }}
                onPostUpdate={handlePostUpdate}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={stageDialogOpen} onOpenChange={(open) => {
        setStageDialogOpen(open);
        if (!open) {
          setEditingStage(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStage ? "Edit Stage" : "Add Ceremony Stage"}</DialogTitle>
          </DialogHeader>
          <Form {...stageForm}>
            <form onSubmit={stageForm.handleSubmit(onStageSubmit)} className="space-y-4">
              <FormField
                control={stageForm.control}
                name="stageKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage Name (Internal)</FormLabel>
                    <FormControl>
                      <Input data-testid="input-stage-name" placeholder="e.g., pheras" {...field} />
                    </FormControl>
                    <FormDescription>Used internally for tracking</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-display-name" placeholder="e.g., Pheras (Sacred Vows)" {...field} />
                    </FormControl>
                    <FormDescription>What guests will see</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-stage-description"
                        placeholder="Brief description of what happens during this stage"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stageForm.control}
                  name="plannedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-duration" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stageForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-order" 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stageForm.control}
                name="guestInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-guest-instructions"
                        placeholder="e.g., Please remain seated during this sacred ritual"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Instructions guests will see during this stage</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setStageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-save-stage"
                  disabled={createStageMutation.isPending || updateStageMutation.isPending}
                >
                  {editingStage ? "Save Changes" : "Add Stage"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Stage Update</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGE_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-update-message"
                        placeholder="e.g., The Pheras are beginning! Please find your seats."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="delayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay (minutes)</FormLabel>
                    <FormControl>
                      <Input data-testid="input-delay" type="number" {...field} />
                    </FormControl>
                    <FormDescription>If the stage is delayed, enter minutes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-post-update"
                  disabled={postUpdateMutation.isPending}
                >
                  Post Update
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventStagesCardProps {
  event: Event;
  isExpanded: boolean;
  onToggle: () => void;
  onAddStage: () => void;
  onEditStage: (stage: RitualStage) => void;
  onDeleteStage: (id: string) => void;
  onPostUpdate: (stageId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function EventStagesCard({ event, isExpanded, onToggle, onAddStage, onEditStage, onDeleteStage, onPostUpdate, getStatusBadge }: EventStagesCardProps) {
  const { data: stagesData = [], isLoading } = useQuery<{ stage: RitualStage; latestUpdate: RitualStageUpdate | null }[]>({
    queryKey: ["/api/events", event.id, "stages"],
    enabled: isExpanded,
  });

  const completedStages = stagesData.filter(s => s.latestUpdate?.status === 'completed').length;
  const totalStages = stagesData.length;
  const progressPercent = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CardTitle className="text-lg">{event.name}</CardTitle>
              {event.type && (
                <Badge variant="outline">{event.type}</Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4 flex-wrap">
              {event.date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(event.date), "MMM d, yyyy")}
                </span>
              )}
              {event.time && <span>{event.time}</span>}
              {event.location && <span>{event.location}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              data-testid={`button-add-stage-${event.id}`}
              onClick={onAddStage}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Stage
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggle}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 border-t">
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : stagesData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ceremony stages configured for this event.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{completedStages}/{totalStages} completed</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="space-y-3">
                {stagesData.sort((a, b) => a.stage.displayOrder - b.stage.displayOrder).map(({ stage, latestUpdate }) => (
                  <Card key={stage.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          latestUpdate?.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                          latestUpdate?.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900' :
                          latestUpdate?.status === 'delayed' ? 'bg-red-100 dark:bg-red-900' :
                          'bg-muted'
                        }`}>
                          {latestUpdate?.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : latestUpdate?.status === 'in_progress' ? (
                            <Play className="w-4 h-4 text-yellow-600" />
                          ) : latestUpdate?.status === 'delayed' ? (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-sm">{stage.displayName}</h5>
                            {getStatusBadge(latestUpdate?.status || 'pending')}
                            {latestUpdate?.delayMinutes && latestUpdate.delayMinutes > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                +{latestUpdate.delayMinutes} min
                              </Badge>
                            )}
                          </div>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                          )}
                          {stage.plannedDuration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: ~{stage.plannedDuration} min
                            </p>
                          )}
                          {latestUpdate?.message && (
                            <p className="text-xs mt-1 italic">"{latestUpdate.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-update-stage-${stage.id}`}
                          onClick={() => onPostUpdate(stage.id)}
                        >
                          Update
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          data-testid={`button-edit-stage-${stage.id}`}
                          onClick={() => onEditStage(stage)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          data-testid={`button-delete-stage-${stage.id}`}
                          onClick={() => onDeleteStage(stage.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
