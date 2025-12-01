import { useState, useEffect } from "react";
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
  Timer,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Share2,
  Eye,
  PartyPopper,
  Heart,
  Circle,
  Phone
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
  DialogDescription,
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

const STAGE_STATUSES = [
  { value: "upcoming", label: "Coming Up", color: "bg-muted text-muted-foreground" },
  { value: "active", label: "Happening Now", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "completed", label: "Done", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "delayed", label: "Running Late", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "skipped", label: "Skipped", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
] as const;

const QUICK_MESSAGES = [
  { 
    category: "Timing Updates", 
    icon: Clock,
    messages: [
      { label: "Starting Soon", text: "We're about to begin! Please find your seats.", emoji: "chair" },
      { label: "Quick Break", text: "Taking a short break. Feel free to stretch and refresh!", emoji: "coffee" },
      { label: "Running a Bit Late", text: "We're running a few minutes behind. Thank you for your patience!", emoji: "clock" },
      { label: "Resuming Now", text: "We're ready to continue. Please return to your seats.", emoji: "arrow" },
    ]
  },
  { 
    category: "Guest Guidance", 
    icon: Users,
    messages: [
      { label: "Please Stand", text: "Please rise for this special moment.", emoji: "up" },
      { label: "Please Be Seated", text: "You may now be seated. Thank you!", emoji: "down" },
      { label: "Photos Welcome", text: "Feel free to take photos and videos!", emoji: "camera" },
      { label: "Quiet Please", text: "Please silence phones for this sacred moment.", emoji: "quiet" },
    ]
  },
  { 
    category: "Celebrations", 
    icon: PartyPopper,
    messages: [
      { label: "Dinner Time", text: "Dinner is ready! Please head to the dining area.", emoji: "food" },
      { label: "Dance Floor Open", text: "Time to dance! The dance floor is now open.", emoji: "dance" },
      { label: "Thank You", text: "Thank you for celebrating with us! We love you all!", emoji: "heart" },
    ]
  },
];

const PREP_CHECKLIST = [
  { id: "share_link", label: "Share the guest link", description: "Send the QR code or link to your guests so they can follow along", priority: "high" },
  { id: "add_helpers", label: "Add family helpers", description: "Invite trusted family members who can send updates if you're busy", priority: "high" },
  { id: "test_connection", label: "Test it out", description: "Go live briefly to make sure everything works", priority: "high" },
  { id: "add_ceremony_parts", label: "Add your ceremony parts", description: "List the main moments guests should know about", priority: "medium" },
  { id: "phone_charged", label: "Charge your phone", description: "Keep your device ready for the big day", priority: "medium" },
];

type StageStatus = typeof STAGE_STATUSES[number]['value'];

export default function RitualControlPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [quickMessageDialogOpen, setQuickMessageDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding-day-checklist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
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

  const goLiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/weddings/${wedding.id}/go-live`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      toast({
        title: "You're live!",
        description: "Guests can now see your updates.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't go live",
        description: error.message || "Please try again",
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
        title: "You're offline",
        description: "Guests won't see new updates until you go live again.",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest("PATCH", `/api/weddings/${wedding.id}/live-status`, {
        lastBroadcastMessage: data.message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "live-status"] });
      setQuickMessageDialogOpen(false);
      toast({
        title: "Message sent!",
        description: "All your guests will see this message.",
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
        title: "Added!",
        description: "Your ceremony part has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Couldn't add ceremony part",
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
        title: "Updated!",
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
        title: "Removed",
        description: "The ceremony part has been removed.",
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
        title: "Updated!",
        description: "Your guests will see this update.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Couldn't post update",
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
    link.download = 'wedding-guest-link-qr.png';
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
        title: "Couldn't copy",
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
        localStorage.setItem('wedding-day-checklist', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const checklistProgress = Math.round((completedChecklist.size / PREP_CHECKLIST.length) * 100);

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

  const steps = [
    { number: 1, title: "Get Ready", description: "Prepare for the big day", icon: CheckSquare },
    { number: 2, title: "Go Live", description: "Start sharing updates", icon: Radio },
    { number: 3, title: "Keep Guests Updated", description: "Send messages & track progress", icon: MessageCircle },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Wedding Day Live Updates
        </h1>
        <p className="text-muted-foreground text-lg">
          Keep your guests in the loop on your special day
        </p>
      </div>

      {/* Live Status Banner */}
      {isLive && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500 animate-pulse">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">You're Live!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Guests can see your updates
                    {(liveStatus as any)?.viewerCount > 0 && (
                      <span className="ml-2">
                        · {(liveStatus as any).viewerCount} watching
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goOfflineMutation.mutate()}
                disabled={goOfflineMutation.isPending}
                className="border-green-600 text-green-700 hover:bg-green-100"
                data-testid="button-go-offline"
              >
                <Pause className="w-4 h-4 mr-1" />
                Stop Updates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`flex flex-col items-center transition-all ${
                  currentStep === step.number
                    ? 'scale-105'
                    : 'opacity-60 hover:opacity-80'
                }`}
                data-testid={`step-${step.number}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep === step.number
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-sm font-medium ${currentStep === step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-12 md:w-24 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Get Ready */}
        {currentStep === 1 && (
          <div className="space-y-6" data-testid="step-1-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Share with Your Guests
                </CardTitle>
                <CardDescription>
                  Give your guests a way to follow along on your wedding day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1" data-testid="button-show-qr">
                        <QrCode className="w-4 h-4 mr-2" />
                        Show QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Guest QR Code</DialogTitle>
                        <DialogDescription>
                          Guests can scan this to see live updates on their phones
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        {qrCodeDataUrl && (
                          <img 
                            src={qrCodeDataUrl} 
                            alt="QR Code for guests" 
                            className="w-64 h-64 border rounded-lg"
                            data-testid="img-qr-code"
                          />
                        )}
                        <p className="text-sm text-muted-foreground text-center">
                          Print this or display it at your venue
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleDownloadQR} data-testid="button-download-qr">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="flex-1" onClick={handleCopyLink} data-testid="button-copy-link">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => window.open(guestLiveFeedUrl, '_blank')}
                    data-testid="button-preview-guest-view"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Include the QR code in your wedding program, or display it on a screen at the venue entrance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Preparation Checklist
                </CardTitle>
                <CardDescription>
                  {completedChecklist.size} of {PREP_CHECKLIST.length} items done
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={checklistProgress} className="h-2 mb-4" />
                <div className="space-y-3">
                  {PREP_CHECKLIST.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover-elevate cursor-pointer ${
                        completedChecklist.has(item.id)
                          ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : ''
                      }`}
                      onClick={() => toggleChecklistItem(item.id)}
                      data-testid={`checklist-item-${item.id}`}
                    >
                      <Checkbox 
                        checked={completedChecklist.has(item.id)} 
                        className="mt-0.5"
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${completedChecklist.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      {item.priority === 'high' && !completedChecklist.has(item.id) && (
                        <Badge variant="outline" className="text-xs shrink-0">Important</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <FamilyHelpersSection weddingId={wedding?.id} />

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} size="lg" data-testid="button-next-step-2">
                Next: Go Live
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Go Live */}
        {currentStep === 2 && (
          <div className="space-y-6" data-testid="step-2-content">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  isLive 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-muted'
                }`}>
                  {isLive ? (
                    <Radio className="w-12 h-12 text-green-600 animate-pulse" />
                  ) : (
                    <WifiOff className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                
                <h2 className="text-2xl font-bold mb-2">
                  {isLive ? "You're Live!" : "Ready to Go Live?"}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {isLive 
                    ? "Your guests can now see updates. Head to the next step to start sending messages!"
                    : "When you're ready to start your ceremony, tap the button below. Your guests will see all updates you send."
                  }
                </p>

                <Button
                  size="lg"
                  variant={isLive ? "outline" : "default"}
                  className={`text-lg px-8 py-6 h-auto ${!isLive ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' : ''}`}
                  onClick={() => isLive ? goOfflineMutation.mutate() : goLiveMutation.mutate()}
                  disabled={goLiveMutation.isPending || goOfflineMutation.isPending}
                  data-testid="button-toggle-live-main"
                >
                  {isLive ? (
                    <>
                      <Pause className="w-6 h-6 mr-2" />
                      Stop Live Updates
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 mr-2" />
                      Start Live Updates
                    </>
                  )}
                </Button>

                {isLive && (liveStatus as any)?.viewerCount > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                    <Users className="w-4 h-4" />
                    <span>{(liveStatus as any).viewerCount} guests watching</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} size="lg" data-testid="button-next-step-3">
                Next: Send Updates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Keep Guests Updated */}
        {currentStep === 3 && (
          <div className="space-y-6" data-testid="step-3-content">
            {/* Quick Message Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Send a Quick Message
                </CardTitle>
                <CardDescription>
                  Tap any message below to send it to all your guests instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isLive && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> You need to go live first before guests can see your messages.
                      <Button 
                        variant="link" 
                        className="px-1 h-auto text-amber-800 dark:text-amber-200 underline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Go back to Step 2
                      </Button>
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {QUICK_MESSAGES.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center gap-2 mb-3">
                        <category.icon className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm text-muted-foreground">{category.category}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {category.messages.map((msg) => (
                          <Button
                            key={msg.label}
                            variant="outline"
                            className="h-auto py-3 px-4 justify-start text-left hover-elevate"
                            disabled={!isLive || sendMessageMutation.isPending}
                            onClick={() => sendMessageMutation.mutate({ message: msg.text })}
                            data-testid={`quick-message-${msg.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <div>
                              <p className="font-medium text-sm">{msg.label}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{msg.text}</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Dialog open={quickMessageDialogOpen} onOpenChange={setQuickMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={!isLive} data-testid="button-custom-message">
                        <Pencil className="w-4 h-4 mr-2" />
                        Write Your Own Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send a Custom Message</DialogTitle>
                        <DialogDescription>
                          Write a message that all your guests will see
                        </DialogDescription>
                      </DialogHeader>
                      <CustomMessageForm 
                        onSend={(message) => {
                          sendMessageMutation.mutate({ message });
                        }}
                        isPending={sendMessageMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Ceremony Progress Section */}
            <CeremonyProgressSection 
              events={events}
              isLive={isLive}
              onAddPart={handleAddStage}
              onEditPart={handleEditStage}
              onDeletePart={(id) => {
                if (confirm("Remove this ceremony part?")) {
                  deleteStageMutation.mutate(id);
                }
              }}
              onUpdateStatus={handlePostUpdate}
              getStatusBadge={getStatusBadge}
              expandedEvents={expandedEvents}
              toggleEventExpanded={toggleEventExpanded}
            />

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={(open) => {
        setStageDialogOpen(open);
        if (!open) {
          setEditingStage(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStage ? "Edit Ceremony Part" : "Add Ceremony Part"}</DialogTitle>
            <DialogDescription>
              {editingStage 
                ? "Update the details for this part of the ceremony"
                : "Add a new part to your ceremony that guests can follow along with"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...stageForm}>
            <form onSubmit={stageForm.handleSubmit(onStageSubmit)} className="space-y-4">
              <FormField
                control={stageForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is this part called?</FormLabel>
                    <FormControl>
                      <Input data-testid="input-display-name" placeholder="e.g., Welcome & Prayers, First Dance, Cake Cutting" {...field} />
                    </FormControl>
                    <FormDescription>This is what your guests will see</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="stageKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short name (for your reference)</FormLabel>
                    <FormControl>
                      <Input data-testid="input-stage-name" placeholder="e.g., welcome, dance, cake" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-stage-description"
                        placeholder="What happens during this part?"
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
                      <FormLabel>How long? (minutes)</FormLabel>
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
                    <FormLabel>Instructions for guests (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-guest-instructions"
                        placeholder="e.g., Please remain seated, Feel free to take photos"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
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
                  {editingStage ? "Save Changes" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Let your guests know what's happening with this part of the ceremony
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's happening?</FormLabel>
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
                    <FormLabel>Add a note (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-update-message"
                        placeholder="e.g., We're starting the ceremony now!"
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
                    <FormLabel>Running late? How many minutes?</FormLabel>
                    <FormControl>
                      <Input data-testid="input-delay" type="number" {...field} />
                    </FormControl>
                    <FormDescription>Leave as 0 if on schedule</FormDescription>
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
                  Update
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomMessageForm({ onSend, isPending }: { onSend: (message: string) => void; isPending: boolean }) {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[100px]"
        data-testid="input-custom-message"
      />
      <div className="flex justify-end gap-2">
        <Button 
          onClick={() => {
            if (message.trim()) {
              onSend(message);
              setMessage("");
            }
          }}
          disabled={!message.trim() || isPending}
          data-testid="button-send-custom-message"
        >
          <Send className="w-4 h-4 mr-2" />
          Send to All Guests
        </Button>
      </div>
    </div>
  );
}

interface FamilyHelpersSectionProps {
  weddingId?: string;
}

function FamilyHelpersSection({ weddingId }: FamilyHelpersSectionProps) {
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
        description: "They'll receive an email with instructions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't send invite",
        description: error.message || "Please try again",
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
        title: "Access removed",
        description: "They can no longer send updates.",
      });
    },
  });

  if (!weddingId) return null;

  const familyRole = roles.find((r: any) => r.name === 'family_member');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900">
              <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Family Helpers</CardTitle>
              <CardDescription>
                People who can send updates on your behalf
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
                  <DialogTitle>Invite a Family Helper</DialogTitle>
                  <DialogDescription>
                    They'll be able to send updates to your guests if you're busy during the ceremony
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
                  <div>
                    <FormLabel>Their Email Address</FormLabel>
                    <Input 
                      type="email"
                      placeholder="email@example.com"
                      data-testid="input-helper-email"
                      {...inviteForm.register('email', { required: true })}
                    />
                  </div>
                  {roles.length > 0 && (
                    <div>
                      <FormLabel>What can they do?</FormLabel>
                      <Select 
                        value={inviteForm.watch('roleId') || familyRole?.id || roles[0]?.id}
                        onValueChange={(value) => inviteForm.setValue('roleId', value)}
                      >
                        <SelectTrigger data-testid="select-helper-role">
                          <SelectValue placeholder="Select permissions" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.displayName}
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
                Invite trusted family members who can send updates during your wedding if you're busy.
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
                      <p className="text-xs text-muted-foreground">Can send updates</p>
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
                      <p className="text-xs text-muted-foreground">Waiting for them to accept</p>
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
        </CardContent>
      )}
    </Card>
  );
}

interface CeremonyProgressSectionProps {
  events: Event[];
  isLive: boolean;
  onAddPart: (eventId: string) => void;
  onEditPart: (stage: RitualStage) => void;
  onDeletePart: (id: string) => void;
  onUpdateStatus: (stageId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  expandedEvents: Set<string>;
  toggleEventExpanded: (eventId: string) => void;
}

function CeremonyProgressSection({
  events,
  isLive,
  onAddPart,
  onEditPart,
  onDeletePart,
  onUpdateStatus,
  getStatusBadge,
  expandedEvents,
  toggleEventExpanded,
}: CeremonyProgressSectionProps) {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Track Your Ceremony
        </CardTitle>
        <CardDescription>
          Mark each part of your ceremony as it happens so guests can follow along
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              First, add your wedding events in the Timeline section
            </p>
            <Button onClick={() => setLocation("/timeline")} data-testid="button-go-to-timeline">
              Go to Timeline
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <EventCeremonyCard 
                key={event.id} 
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEventExpanded(event.id)}
                onAddPart={() => onAddPart(event.id)}
                onEditPart={onEditPart}
                onDeletePart={onDeletePart}
                onUpdateStatus={onUpdateStatus}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EventCeremonyCardProps {
  event: Event;
  isExpanded: boolean;
  onToggle: () => void;
  onAddPart: () => void;
  onEditPart: (stage: RitualStage) => void;
  onDeletePart: (id: string) => void;
  onUpdateStatus: (stageId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function EventCeremonyCard({ 
  event, 
  isExpanded, 
  onToggle, 
  onAddPart, 
  onEditPart, 
  onDeletePart, 
  onUpdateStatus, 
  getStatusBadge 
}: EventCeremonyCardProps) {
  const { data: stagesData = [], isLoading } = useQuery<{ stage: RitualStage; latestUpdate: RitualStageUpdate | null }[]>({
    queryKey: ["/api/events", event.id, "stages"],
    enabled: isExpanded,
  });

  const completedStages = stagesData.filter(s => s.latestUpdate?.status === 'completed').length;
  const totalStages = stagesData.length;
  const progressPercent = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <div className="border rounded-lg">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover-elevate"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">{event.name}</h4>
            {event.type && (
              <Badge variant="outline" className="text-xs">{event.type}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
            {event.date && (
              <span>{format(new Date(event.date), "MMM d")}</span>
            )}
            {event.time && <span>{event.time}</span>}
            {totalStages > 0 && (
              <span className="flex items-center gap-1">
                <Circle className="w-2 h-2 fill-current" />
                {completedStages}/{totalStages} done
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAddPart();
            }}
            data-testid={`button-add-part-${event.id}`}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Part
          </Button>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-4">
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : stagesData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ceremony parts added yet for this event
            </p>
          ) : (
            <>
              <div className="mb-4">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {Math.round(progressPercent)}% complete
                </p>
              </div>

              <div className="space-y-2">
                {stagesData.sort((a, b) => a.stage.displayOrder - b.stage.displayOrder).map(({ stage, latestUpdate }) => (
                  <div 
                    key={stage.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      latestUpdate?.status === 'completed' 
                        ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                        : latestUpdate?.status === 'active'
                        ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-full shrink-0 ${
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
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{stage.displayName}</span>
                          {getStatusBadge(latestUpdate?.status || 'upcoming')}
                          {latestUpdate?.delayMinutes && latestUpdate.delayMinutes > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              +{latestUpdate.delayMinutes} min late
                            </Badge>
                          )}
                        </div>
                        {stage.plannedDuration && (
                          <p className="text-xs text-muted-foreground">
                            ~{stage.plannedDuration} minutes
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={latestUpdate?.status === 'active' ? 'default' : 'outline'}
                        onClick={() => onUpdateStatus(stage.id)}
                        data-testid={`button-update-${stage.id}`}
                      >
                        Update
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onEditPart(stage)}
                        data-testid={`button-edit-${stage.id}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onDeletePart(stage.id)}
                        data-testid={`button-delete-${stage.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
