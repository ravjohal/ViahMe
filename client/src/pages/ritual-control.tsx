import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Smartphone,
  FastForward,
  SkipForward,
  Timer,
  Volume2,
  Coffee,
  CheckSquare,
  ListChecks
} from "lucide-react";
import QRCode from 'qrcode';
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
import { Checkbox } from "@/components/ui/checkbox";
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
  { value: "upcoming", label: "Upcoming", color: "bg-muted text-muted-foreground" },
  { value: "active", label: "In Progress", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "delayed", label: "Delayed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "skipped", label: "Skipped", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
] as const;

const BROADCAST_TEMPLATES = [
  { category: "Timing", templates: [
    { label: "Starting Soon", message: "The ceremony will begin in 5 minutes. Please find your seats." },
    { label: "Brief Delay", message: "We're running a few minutes behind schedule. Thank you for your patience!" },
    { label: "15 Min Break", message: "We're taking a 15-minute break. Feel free to stretch and refresh!" },
    { label: "Resuming", message: "The ceremony is about to resume. Please return to your seats." },
  ]},
  { category: "Ceremony", templates: [
    { label: "Please Stand", message: "Please rise for the next sacred ritual." },
    { label: "Please Sit", message: "You may now be seated. Thank you!" },
    { label: "Silence", message: "Please silence all phones and maintain quiet during this sacred moment." },
    { label: "Photos OK", message: "Photos and videos are now welcome!" },
  ]},
  { category: "Logistics", templates: [
    { label: "Meal Time", message: "Dinner is now being served. Please proceed to the dining area." },
    { label: "Bar Open", message: "The bar is now open! Enjoy responsibly." },
    { label: "Move Venues", message: "Please make your way to the next venue. Transportation is available at the entrance." },
    { label: "Thank You", message: "Thank you all for being here to celebrate with us! We love you!" },
  ]},
] as const;

const DAY_OF_CHECKLIST = [
  { id: "test_live", label: "Test your live connection", description: "Go live briefly to ensure everything works", priority: "high" },
  { id: "share_qr", label: "Share QR codes with guests", description: "Print or display QR codes at the venue", priority: "high" },
  { id: "assign_helper", label: "Assign a ceremony helper", description: "Designate someone to manage updates if you're busy", priority: "high" },
  { id: "review_stages", label: "Review ceremony stages", description: "Confirm all stages and timings are correct", priority: "medium" },
  { id: "prepare_templates", label: "Review broadcast templates", description: "Familiarize yourself with quick message options", priority: "medium" },
  { id: "check_gaps", label: "Check gap recommendations", description: "Ensure nearby activity suggestions are accurate", priority: "medium" },
  { id: "phone_charged", label: "Phone fully charged", description: "Keep your device charged for the ceremony", priority: "high" },
  { id: "wifi_backup", label: "Have wifi/data backup", description: "Ensure you have reliable internet access", priority: "medium" },
  { id: "notify_vendors", label: "Brief key vendors", description: "Let photographer/DJ know about live updates", priority: "low" },
  { id: "final_countdown", label: "Send 'starting soon' message", description: "30 minutes before ceremony begins", priority: "high" },
] as const;

type StageStatus = typeof STAGE_STATUSES[number]['value'];

export default function RitualControlPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ritual-control-checklist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [editingStage, setEditingStage] = useState<RitualStage | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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
      status: "active",
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

  const guestLiveFeedUrl = wedding?.id 
    ? `${window.location.origin}/guest-live-feed/${wedding.id}`
    : '';

  useEffect(() => {
    if (qrDialogOpen && guestLiveFeedUrl) {
      QRCode.toDataURL(guestLiveFeedUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [qrDialogOpen, guestLiveFeedUrl]);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = 'guest-live-feed-qr.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestLiveFeedUrl);
      toast({
        title: "Link copied!",
        description: "Share this with your guests.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setCompletedChecklist(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('ritual-control-checklist', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const checklistProgress = Math.round((completedChecklist.size / DAY_OF_CHECKLIST.length) * 100);

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
      status: "active",
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
                  {isLive && (liveStatus as any)?.viewerCount > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium" data-testid="text-viewer-count">
                        {(liveStatus as any).viewerCount} {(liveStatus as any).viewerCount === 1 ? 'viewer' : 'viewers'} watching
                      </span>
                    </div>
                  )}
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Broadcast Message</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Quick templates - click to use:</p>
                      <div className="space-y-3">
                        {BROADCAST_TEMPLATES.map((category) => (
                          <div key={category.category}>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">{category.category}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {category.templates.map((template) => (
                                <Button
                                  key={template.label}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  data-testid={`template-${template.label.toLowerCase().replace(/\s+/g, '-')}`}
                                  onClick={() => broadcastForm.setValue('message', template.message)}
                                >
                                  {template.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
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
                                  className="min-h-[100px]"
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
                  </div>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Guest Live Feed QR</h3>
                  <p className="text-sm text-muted-foreground">
                    Share with your guests
                  </p>
                </div>
              </div>
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-show-qr">
                    <QrCode className="w-4 h-4 mr-1" />
                    Show QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Guest Live Feed QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4 py-4">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Guest Live Feed QR Code" 
                        className="w-64 h-64 rounded-lg border p-2 bg-white"
                        data-testid="img-qr-code"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                        <span className="text-muted-foreground">Generating...</span>
                      </div>
                    )}
                    <div className="w-full space-y-2">
                      <p className="text-sm text-center text-muted-foreground">
                        Guests can scan this to view live updates on their phones
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <code className="text-xs flex-1 truncate" data-testid="text-live-feed-url">
                          {guestLiveFeedUrl}
                        </code>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={handleCopyLink}
                          data-testid="button-copy-link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleDownloadQR}
                        data-testid="button-download-qr"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download QR
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(guestLiveFeedUrl, '_blank')}
                        data-testid="button-open-live-feed"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <FamilyMemberControls weddingId={wedding?.id} />

      <Card className="mb-6 md:hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Mobile Quick Actions
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
            >
              {mobileControlsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {mobileControlsOpen && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Large buttons optimized for quick taps on wedding day
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant={isLive ? "destructive" : "default"}
                onClick={() => isLive ? goOfflineMutation.mutate() : goLiveMutation.mutate()}
                disabled={goLiveMutation.isPending || goOfflineMutation.isPending}
                data-testid="mobile-toggle-live"
              >
                {isLive ? <WifiOff className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                <span className="text-xs">{isLive ? 'Go Offline' : 'Go Live'}</span>
              </Button>
              
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant="outline"
                onClick={() => setBroadcastDialogOpen(true)}
                disabled={!isLive}
                data-testid="mobile-broadcast"
              >
                <Volume2 className="w-6 h-6" />
                <span className="text-xs">Broadcast</span>
              </Button>
              
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant="outline"
                onClick={() => {
                  broadcastForm.setValue('message', 'We\'re taking a short break. Back soon!');
                  setBroadcastDialogOpen(true);
                }}
                disabled={!isLive}
                data-testid="mobile-break"
              >
                <Coffee className="w-6 h-6" />
                <span className="text-xs">Announce Break</span>
              </Button>
              
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant="outline"
                onClick={() => {
                  broadcastForm.setValue('message', 'We\'re running a few minutes behind. Thank you for your patience!');
                  setBroadcastDialogOpen(true);
                }}
                disabled={!isLive}
                data-testid="mobile-delay"
              >
                <Timer className="w-6 h-6" />
                <span className="text-xs">Announce Delay</span>
              </Button>
              
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant="outline"
                onClick={() => {
                  broadcastForm.setValue('message', 'The ceremony is about to resume. Please return to your seats.');
                  setBroadcastDialogOpen(true);
                }}
                disabled={!isLive}
                data-testid="mobile-resume"
              >
                <FastForward className="w-6 h-6" />
                <span className="text-xs">Resume</span>
              </Button>
              
              <Button
                size="lg"
                className="h-20 flex flex-col gap-1"
                variant="outline"
                onClick={() => setQrDialogOpen(true)}
                data-testid="mobile-qr"
              >
                <QrCode className="w-6 h-6" />
                <span className="text-xs">Show QR</span>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
                <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Day-Of Checklist</CardTitle>
                <CardDescription>
                  {completedChecklist.size} of {DAY_OF_CHECKLIST.length} tasks completed
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={checklistProgress === 100 ? "default" : "outline"} className={checklistProgress === 100 ? "bg-green-500" : ""}>
                {checklistProgress}%
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChecklistOpen(!checklistOpen)}
              >
                {checklistOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        {checklistOpen && (
          <CardContent className="pt-2">
            <Progress value={checklistProgress} className="h-2 mb-4" />
            <div className="space-y-3">
              {DAY_OF_CHECKLIST.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    completedChecklist.has(item.id) 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'hover-elevate'
                  }`}
                  data-testid={`checklist-item-${item.id}`}
                >
                  <Checkbox
                    id={item.id}
                    checked={completedChecklist.has(item.id)}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    data-testid={`checkbox-${item.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={item.id}
                      className={`font-medium cursor-pointer ${completedChecklist.has(item.id) ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.label}
                    </label>
                    <p className={`text-sm ${completedChecklist.has(item.id) ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                      {item.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs shrink-0 ${
                      item.priority === 'high' ? 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400' :
                      item.priority === 'medium' ? 'border-yellow-300 text-yellow-600 dark:border-yellow-800 dark:text-yellow-400' :
                      'border-muted'
                    }`}
                  >
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
            {checklistProgress === 100 && (
              <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-center">
                All set! You're ready for your special day!
              </div>
            )}
          </CardContent>
        )}
      </Card>

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

      <VisualTimeline 
        events={events}
        isLive={isLive}
      />

      <SmartDelayCalculator events={events} />

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
                        value={field.value ?? ""}
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
                        value={field.value ?? ""}
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

interface FamilyMemberControlsProps {
  weddingId?: string;
}

function FamilyMemberControls({ weddingId }: FamilyMemberControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ["/api/weddings", weddingId, "roles"],
    enabled: !!weddingId,
  });

  const { data: collaborators = [] } = useQuery<any[]>({
    queryKey: ["/api/weddings", weddingId, "collaborators"],
    enabled: !!weddingId,
  });

  const activeHelpers = collaborators.filter((c: any) => c.status === 'accepted');
  const pendingInvites = collaborators.filter((c: any) => c.status === 'pending');

  const inviteForm = useForm({
    defaultValues: {
      email: '',
      roleId: '',
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; roleId: string }) => {
      return await apiRequest("POST", `/api/weddings/${weddingId}/invite-collaborator`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      setInviteDialogOpen(false);
      inviteForm.reset();
      toast({
        title: "Invite sent!",
        description: "Your family member will receive an email invitation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      return await apiRequest("POST", `/api/weddings/${weddingId}/revoke-collaborator`, { collaboratorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      toast({
        title: "Access revoked",
        description: "The collaborator's access has been removed.",
      });
    },
  });

  if (!weddingId) return null;

  const familyRole = roles.find((r: any) => r.name === 'family_member');

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900">
              <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Family Day-Of Helpers</CardTitle>
              <CardDescription>
                {activeHelpers.length} helper{activeHelpers.length !== 1 ? 's' : ''} with access
                {pendingInvites.length > 0 && ` (${pendingInvites.length} pending)`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-invite-helper">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Helper
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Family Helper</DialogTitle>
                </DialogHeader>
                <form onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
                  <div>
                    <FormLabel>Email Address</FormLabel>
                    <Input 
                      type="email"
                      placeholder="family.member@email.com"
                      data-testid="input-helper-email"
                      {...inviteForm.register('email', { required: true })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      They'll receive an email invitation to help manage your wedding day.
                    </p>
                  </div>
                  {roles.length > 0 && (
                    <div>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        value={inviteForm.watch('roleId') || familyRole?.id || roles[0]?.id}
                        onValueChange={(value) => inviteForm.setValue('roleId', value)}
                      >
                        <SelectTrigger data-testid="select-helper-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.displayName}
                              {role.description && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  - {role.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviteMutation.isPending} data-testid="button-send-invite">
                      Send Invite
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-2">
          {activeHelpers.length === 0 && pendingInvites.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-2">
                No helpers added yet
              </p>
              <p className="text-xs text-muted-foreground">
                Invite trusted family members to help manage broadcasts and stage updates on your wedding day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeHelpers.map((helper: any) => (
                <div key={helper.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{helper.email}</p>
                      <p className="text-xs text-muted-foreground">Active - {helper.roleName || 'Helper'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => revokeMutation.mutate(helper.id)}
                    data-testid={`button-revoke-${helper.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {pendingInvites.map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50/50 dark:bg-yellow-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">Pending invitation</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => revokeMutation.mutate(invite.id)}
                    data-testid={`button-cancel-invite-${invite.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium mb-1">What can helpers do?</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Send broadcast messages to guests</li>
              <li>Update ceremony stage statuses</li>
              <li>View guest live feed and viewer count</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface VisualTimelineProps {
  events: Event[];
  isLive: boolean;
}

function VisualTimeline({ events, isLive }: VisualTimelineProps) {
  const allStagesQueries = events.map((event) => ({
    event,
    query: useQuery<{ stage: RitualStage; latestUpdate: RitualStageUpdate | null }[]>({
      queryKey: ["/api/events", event.id, "stages"],
    }),
  }));

  const allStages = allStagesQueries.flatMap(({ event, query }) =>
    (query.data || []).map((s) => ({ ...s, eventName: event.name, eventId: event.id }))
  ).sort((a, b) => a.stage.displayOrder - b.stage.displayOrder);

  if (allStages.length === 0) {
    return null;
  }

  const completedCount = allStages.filter(s => s.latestUpdate?.status === 'completed').length;
  const activeStage = allStages.find(s => s.latestUpdate?.status === 'active');
  const overallProgress = allStages.length > 0 ? (completedCount / allStages.length) * 100 : 0;

  const getStageColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-yellow-500 animate-pulse';
      case 'delayed':
        return 'bg-red-500';
      case 'skipped':
        return 'bg-gray-400';
      default:
        return 'bg-muted';
    }
  };

  const getStageRing = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'ring-2 ring-green-500 ring-offset-2';
      case 'active':
        return 'ring-2 ring-yellow-500 ring-offset-2 shadow-lg';
      case 'delayed':
        return 'ring-2 ring-red-500 ring-offset-2';
      default:
        return '';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ceremony Progress
            </CardTitle>
            <CardDescription>
              {completedCount} of {allStages.length} stages completed
              {activeStage && (
                <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                  | Currently: {activeStage.stage.displayName}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant={isLive ? "default" : "outline"} className={isLive ? "bg-green-500" : ""}>
            {isLive ? "LIVE" : "OFFLINE"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {Math.round(overallProgress)}% complete
          </p>
        </div>
        
        <div className="relative" data-testid="visual-timeline">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
          
          <div className="flex justify-between items-start overflow-x-auto pb-2" style={{ minWidth: Math.max(allStages.length * 80, 300) }}>
            {allStages.map((stageData, index) => {
              const status = stageData.latestUpdate?.status;
              return (
                <div 
                  key={stageData.stage.id} 
                  className="flex flex-col items-center relative min-w-[70px]"
                  data-testid={`timeline-stage-${stageData.stage.id}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${getStageColor(status)} ${getStageRing(status)}`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : status === 'active' ? (
                      <Play className="w-4 h-4 text-white" />
                    ) : status === 'delayed' ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center max-w-[70px]">
                    <p className={`text-xs font-medium truncate ${status === 'active' ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                      {stageData.stage.displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {stageData.eventName}
                    </p>
                    {stageData.stage.plannedDuration && (
                      <p className="text-[10px] text-muted-foreground">
                        {stageData.stage.plannedDuration} min
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SmartDelayCalculatorProps {
  events: Event[];
  baseTime?: Date;
}

function SmartDelayCalculator({ events, baseTime }: SmartDelayCalculatorProps) {
  const allStagesQueries = events.map((event) => ({
    event,
    query: useQuery<{ stage: RitualStage; latestUpdate: RitualStageUpdate | null }[]>({
      queryKey: ["/api/events", event.id, "stages"],
    }),
  }));

  const allStages = allStagesQueries.flatMap(({ event, query }) =>
    (query.data || []).map((s) => ({ ...s, eventName: event.name, eventId: event.id }))
  ).sort((a, b) => a.stage.displayOrder - b.stage.displayOrder);

  if (allStages.length === 0) {
    return null;
  }

  const totalDelay = allStages.reduce((acc, s) => acc + (s.latestUpdate?.delayMinutes || 0), 0);
  
  const now = baseTime || new Date();
  const currentActiveIndex = allStages.findIndex(s => s.latestUpdate?.status === 'active');
  const currentIndex = currentActiveIndex >= 0 ? currentActiveIndex : 0;
  
  let projectedTime = now;
  const stageProjections = allStages.map((stageData, index) => {
    const isCompleted = stageData.latestUpdate?.status === 'completed';
    const isActive = stageData.latestUpdate?.status === 'active';
    const delay = stageData.latestUpdate?.delayMinutes || 0;
    const duration = stageData.stage.plannedDuration || 15;
    
    const projectedStart = new Date(projectedTime);
    
    if (!isCompleted) {
      projectedTime = new Date(projectedTime.getTime() + (duration + delay) * 60 * 1000);
    }
    
    const projectedEnd = new Date(projectedTime);
    
    return {
      ...stageData,
      projectedStart,
      projectedEnd,
      delay,
      isCompleted,
      isActive,
      isPending: !isCompleted && !isActive && index > currentIndex,
    };
  });

  const remainingStages = stageProjections.filter(s => !s.isCompleted);
  const hasDelays = totalDelay > 0;
  const lastStage = stageProjections[stageProjections.length - 1];
  const originalEndTime = new Date(now.getTime() + allStages.reduce((acc, s) => acc + (s.stage.plannedDuration || 15), 0) * 60 * 1000);

  if (totalDelay === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-600" />
              Smart Delay Calculator
            </CardTitle>
            <CardDescription>
              Showing projected times based on current delays
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
            +{totalDelay} min total delay
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Remaining Stages
            </h4>
            {remainingStages.slice(0, 5).map((stage, index) => (
              <div 
                key={stage.stage.id}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  stage.isActive 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' 
                    : 'bg-background'
                }`}
                data-testid={`delay-projection-${stage.stage.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {stage.isActive && <Play className="w-3 h-3 text-yellow-600 shrink-0" />}
                  <span className="text-sm truncate">{stage.stage.displayName}</span>
                  {stage.delay > 0 && (
                    <Badge variant="outline" className="text-xs border-red-300 text-red-600 shrink-0">
                      +{stage.delay}m
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right shrink-0 ml-2">
                  <div>~{format(stage.projectedEnd, "h:mm a")}</div>
                </div>
              </div>
            ))}
            {remainingStages.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{remainingStages.length - 5} more stages
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-medium text-sm mb-3">Impact Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total delay accumulated:</span>
                  <span className="font-medium text-amber-600">+{totalDelay} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stages remaining:</span>
                  <span className="font-medium">{remainingStages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected finish:</span>
                  <span className="font-medium">{format(lastStage.projectedEnd, "h:mm a")}</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>Tip:</strong> Consider skipping optional stages or shortening remaining durations to get back on schedule.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DurationTrackerProps {
  stageId: string;
  plannedDuration: number;
  status?: string;
}

function DurationTracker({ stageId, plannedDuration, status }: DurationTrackerProps) {
  const { data: history = [] } = useQuery<RitualStageUpdate[]>({
    queryKey: ["/api/stages", stageId, "updates"],
  });

  const startedAt = history.find(u => u.status === 'active')?.createdAt;
  const completedAt = history.find(u => u.status === 'completed')?.createdAt;
  
  let actualMinutes: number | null = null;
  let runningMinutes: number | null = null;
  
  if (startedAt && completedAt) {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    actualMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  } else if (startedAt && status === 'active') {
    const start = new Date(startedAt);
    runningMinutes = Math.round((Date.now() - start.getTime()) / (1000 * 60));
  }

  const getVariance = () => {
    if (actualMinutes === null) return null;
    const diff = actualMinutes - plannedDuration;
    if (diff > 0) return { label: `+${diff}m over`, color: 'text-amber-600' };
    if (diff < 0) return { label: `${Math.abs(diff)}m under`, color: 'text-green-600' };
    return { label: 'on time', color: 'text-green-600' };
  };

  const variance = getVariance();

  if (status === 'active' && runningMinutes !== null) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`duration-tracker-${stageId}`}>
        <Timer className="w-3 h-3" />
        <span className="font-medium text-yellow-600">{runningMinutes}m</span>
        <span>/ {plannedDuration}m planned</span>
        {runningMinutes > plannedDuration && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-400 text-amber-600">
            running over
          </Badge>
        )}
      </div>
    );
  }

  if (status === 'completed' && actualMinutes !== null) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`duration-tracker-${stageId}`}>
        <Clock className="w-3 h-3" />
        <span>Actual: {actualMinutes}m</span>
        <span className="text-muted-foreground/60">/ {plannedDuration}m planned</span>
        {variance && (
          <span className={`font-medium ${variance.color}`}>({variance.label})</span>
        )}
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      Duration: ~{plannedDuration} min
    </p>
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
                          latestUpdate?.status === 'active' ? 'bg-yellow-100 dark:bg-yellow-900' :
                          latestUpdate?.status === 'delayed' ? 'bg-red-100 dark:bg-red-900' :
                          'bg-muted'
                        }`}>
                          {latestUpdate?.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : latestUpdate?.status === 'active' ? (
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
                            <DurationTracker 
                              stageId={stage.id}
                              plannedDuration={stage.plannedDuration}
                              status={latestUpdate?.status}
                            />
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
