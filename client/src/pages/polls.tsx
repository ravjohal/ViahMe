import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Poll, PollOption, PollVote, Event } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Vote,
  Plus,
  BarChart3,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Users,
  CheckCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  closed: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  single: "Single Choice",
  multiple: "Multiple Choice",
  text: "Open-ended",
};

const TYPE_COLORS: Record<string, string> = {
  single: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  multiple: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  text: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const createPollFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["single", "multiple", "text"]),
  eventId: z.string().optional(),
  isAnonymous: z.boolean(),
  showResultsToGuests: z.boolean(),
});

const editPollFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["single", "multiple", "text"]),
  isAnonymous: z.boolean(),
  showResultsToGuests: z.boolean(),
});

type CreatePollForm = z.infer<typeof createPollFormSchema>;
type EditPollForm = z.infer<typeof editPollFormSchema>;

interface PollResults {
  poll: Poll;
  options: (PollOption & { voteCount: number })[];
  textResponses: { textResponse: string | null; guestId: string | null; createdAt: string }[];
  totalVotes: number;
  uniqueVoters: number;
}

export default function PollsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [viewingResultsPollId, setViewingResultsPollId] = useState<string | null>(null);
  const [deletePollId, setDeletePollId] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: polls = [], isLoading: pollsLoading } = useQuery<Poll[]>({
    queryKey: ["/api/polls/wedding", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: pollResults } = useQuery<PollResults>({
    queryKey: ["/api/poll-votes/poll", viewingResultsPollId, "results"],
    enabled: !!viewingResultsPollId,
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: CreatePollForm & { options: string[] }) => {
      return apiRequest("POST", "/api/polls", {
        weddingId: wedding.id,
        title: data.title,
        description: data.description || null,
        type: data.type,
        eventId: data.eventId === "all" ? null : data.eventId || null,
        isAnonymous: data.isAnonymous,
        showResultsToGuests: data.showResultsToGuests,
        options: data.type !== "text" ? data.options.filter(o => o.trim()) : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls/wedding", wedding?.id] });
      setCreateDialogOpen(false);
      setOptions(["", ""]);
      createForm.reset();
      toast({ title: "Poll created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create poll", variant: "destructive" });
    },
  });

  const updatePollMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Poll> }) => {
      return apiRequest("PATCH", `/api/polls/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls/wedding", wedding?.id] });
      if (viewingResultsPollId) {
        queryClient.invalidateQueries({ queryKey: ["/api/poll-votes/poll", viewingResultsPollId, "results"] });
      }
      setEditingPoll(null);
      toast({ title: "Poll updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update poll", variant: "destructive" });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/polls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls/wedding", wedding?.id] });
      setDeletePollId(null);
      toast({ title: "Poll deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete poll", variant: "destructive" });
    },
  });

  const createForm = useForm<CreatePollForm>({
    resolver: zodResolver(createPollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "single",
      eventId: "all",
      isAnonymous: false,
      showResultsToGuests: false,
    },
  });

  const editForm = useForm<EditPollForm>({
    resolver: zodResolver(editPollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "single",
      isAnonymous: false,
      showResultsToGuests: false,
    },
  });

  const watchType = createForm.watch("type");

  if (weddingsLoading || pollsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!wedding) {
    setLocation("/");
    return null;
  }

  const handleCreatePoll = (data: CreatePollForm) => {
    if (data.type !== "text") {
      const validOptions = options.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({ title: "At least 2 options are required", variant: "destructive" });
        return;
      }
    }
    createPollMutation.mutate({ ...data, options });
  };

  const handleEditPoll = (data: EditPollForm) => {
    if (!editingPoll) return;
    updatePollMutation.mutate({
      id: editingPoll.id,
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        isAnonymous: data.isAnonymous,
        showResultsToGuests: data.showResultsToGuests,
      } as Partial<Poll>,
    });
  };

  const handleToggleOpen = (poll: Poll) => {
    updatePollMutation.mutate({
      id: poll.id,
      data: { isOpen: !poll.isOpen } as Partial<Poll>,
    });
  };

  const openEditDialog = (poll: Poll) => {
    editForm.reset({
      title: poll.title,
      description: poll.description || "",
      type: poll.type as "single" | "multiple" | "text",
      isAnonymous: poll.isAnonymous,
      showResultsToGuests: poll.showResultsToGuests,
    });
    setEditingPoll(poll);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Vote className="h-6 w-6 text-primary" />
            Guest Polls
          </h1>
          <p className="text-muted-foreground">
            Collect preferences and opinions from your guests
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            createForm.reset();
            setOptions(["", ""]);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-poll">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
              <DialogDescription>
                Set up a new poll to collect guest preferences
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreatePoll)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="What should we serve for dinner?" {...field} data-testid="input-poll-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add more details about this poll..." {...field} value={field.value || ""} data-testid="input-poll-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-poll-type">
                            <SelectValue placeholder="Select poll type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single Choice</SelectItem>
                          <SelectItem value="multiple">Multiple Choice</SelectItem>
                          <SelectItem value="text">Open-ended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "all"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-poll-event">
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Events (Wedding-wide)</SelectItem>
                          {events.map((event) => (
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

                {watchType !== "text" && (
                  <div className="space-y-3">
                    <FormLabel>Options</FormLabel>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          data-testid={`input-poll-option-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          disabled={options.length <= 2}
                          data-testid={`button-remove-option-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      data-testid="button-add-option"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}

                <FormField
                  control={createForm.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Anonymous Voting</FormLabel>
                        <FormDescription className="text-sm">
                          Hide voter identities
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-anonymous" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="showResultsToGuests"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Results to Guests</FormLabel>
                        <FormDescription className="text-sm">
                          Let guests see live results
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-results" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createPollMutation.isPending} data-testid="button-submit-poll">
                    {createPollMutation.isPending ? "Creating..." : "Create Poll"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Polls Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first poll to start collecting guest preferences!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-poll">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Poll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => {
            const event = events.find((e) => e.id === poll.eventId);
            return (
              <Card key={poll.id} data-testid={`card-poll-${poll.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{poll.title}</CardTitle>
                    <Badge className={STATUS_COLORS[poll.isOpen ? "open" : "closed"]}>
                      {poll.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={TYPE_COLORS[poll.type]} data-testid={`badge-type-${poll.id}`}>
                      {TYPE_LABELS[poll.type] || poll.type}
                    </Badge>
                    <Badge variant="outline" data-testid={`badge-event-${poll.id}`}>
                      {event ? event.name : "All Events"}
                    </Badge>
                  </div>
                  {poll.description && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {poll.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {poll.isAnonymous && (
                      <Badge variant="secondary" className="gap-1" data-testid={`badge-anonymous-${poll.id}`}>
                        <EyeOff className="h-3 w-3" />
                        Anonymous
                      </Badge>
                    )}
                    {poll.showResultsToGuests && (
                      <Badge variant="secondary" className="gap-1" data-testid={`badge-results-visible-${poll.id}`}>
                        <Eye className="h-3 w-3" />
                        Results Visible
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingResultsPollId(poll.id)}
                        data-testid={`button-view-results-${poll.id}`}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Results
                      </Button>
                      {poll.isOpen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(poll)}
                          data-testid={`button-edit-${poll.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleOpen(poll)}
                        data-testid={`button-toggle-open-${poll.id}`}
                      >
                        {poll.isOpen ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePollId(poll.id)}
                        data-testid={`button-delete-${poll.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewingResultsPollId} onOpenChange={(open) => { if (!open) setViewingResultsPollId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Poll Results</DialogTitle>
            <DialogDescription>
              {pollResults?.poll?.title}
            </DialogDescription>
          </DialogHeader>
          {pollResults ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {pollResults.totalVotes} total vote{pollResults.totalVotes !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {pollResults.uniqueVoters} unique voter{pollResults.uniqueVoters !== 1 ? "s" : ""}
                </span>
              </div>

              {pollResults.poll.type !== "text" && pollResults.options.length > 0 && (
                <div className="space-y-3">
                  {(() => {
                    const maxVotes = Math.max(...pollResults.options.map(o => o.voteCount), 1);
                    const totalVotes = pollResults.totalVotes || 1;
                    return pollResults.options
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((option) => {
                        const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                        const barWidth = maxVotes > 0 ? (option.voteCount / maxVotes) * 100 : 0;
                        const isWinner = option.voteCount === maxVotes && option.voteCount > 0;
                        return (
                          <div key={option.id} className="space-y-1" data-testid={`result-option-${option.id}`}>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className={`font-medium ${isWinner ? "text-primary" : ""}`}>
                                {option.label}
                              </span>
                              <span className="text-muted-foreground">
                                {option.voteCount} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isWinner ? "bg-primary" : "bg-primary/50"}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              )}

              {pollResults.poll.type === "text" && (
                <div className="space-y-2">
                  {pollResults.textResponses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No responses yet</p>
                  ) : (
                    pollResults.textResponses.map((response, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 text-sm" data-testid={`text-response-${index}`}>
                        <MessageSquare className="h-3 w-3 inline-block mr-2 text-muted-foreground" />
                        {response.textResponse}
                      </div>
                    ))
                  )}
                </div>
              )}

              {pollResults.poll.isOpen && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePollMutation.mutate({
                        id: pollResults.poll.id,
                        data: { isOpen: false } as Partial<Poll>,
                      });
                    }}
                    disabled={updatePollMutation.isPending}
                    data-testid="button-close-poll-results"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Close Poll
                  </Button>
                </DialogFooter>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPoll} onOpenChange={(open) => { if (!open) setEditingPoll(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Poll</DialogTitle>
            <DialogDescription>
              Update poll settings
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditPoll)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-poll-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-poll-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-poll-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single Choice</SelectItem>
                        <SelectItem value="multiple">Multiple Choice</SelectItem>
                        <SelectItem value="text">Open-ended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Anonymous Voting</FormLabel>
                      <FormDescription className="text-sm">
                        Hide voter identities
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-edit-anonymous" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="showResultsToGuests"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Show Results to Guests</FormLabel>
                      <FormDescription className="text-sm">
                        Let guests see live results
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-edit-show-results" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updatePollMutation.isPending} data-testid="button-submit-edit-poll">
                  {updatePollMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePollId} onOpenChange={(open) => { if (!open) setDeletePollId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be undone and all votes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePollId) deletePollMutation.mutate(deletePollId);
              }}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
