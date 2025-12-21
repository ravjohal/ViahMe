import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Task, Event, WeddingRoleAssignment } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckCircle2, Circle, AlertCircle, Trash2, Filter, Bell, BellOff, Mail, MessageSquare, User, Send, Sparkles, Lightbulb, X, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/progress-ring";
import { Switch } from "@/components/ui/switch";
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
import { insertTaskSchema, type InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_COLORS = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

const PRIORITY_LABELS = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

interface Collaborator {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  roleId: string;
  roleName?: string;
  status: string;
}

interface AiRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestedDueDate?: string;
  reason: string;
}

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiRecommendationsOpen, setAiRecommendationsOpen] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  
  // Load dismissed recommendations from localStorage for persistence across sessions
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedAiRecommendations');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  // Use the most recently created wedding (last in array)
  const wedding = weddings[weddings.length - 1];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch team members (collaborators) for assignment
  const { data: collaborators = [] } = useQuery<Collaborator[]>({
    queryKey: ["/api/weddings", wedding?.id, "collaborators"],
    enabled: !!wedding?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", wedding?.id] });
      setDialogOpen(false);
      toast({
        title: "Task created",
        description: "Your task has been added to the checklist.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTask> }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", wedding?.id] });
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", wedding?.id] });
      toast({
        title: "Task deleted",
        description: "The task has been removed from your checklist.",
      });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { reminderEnabled?: boolean; reminderDaysBefore?: number; reminderMethod?: string } }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}/reminder`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/tasks", wedding?.id],
        refetchType: 'all'
      });
      const status = data?.reminderEnabled ? "enabled" : "disabled";
      toast({
        title: "Reminder updated",
        description: `Task reminder has been ${status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reminder settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send on-demand reminder to assigned team member
  const sendReminderMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/send-reminder`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Reminder sent" : "Could not send reminder",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate AI task recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async (weddingId: string) => {
      const response = await apiRequest("POST", `/api/tasks/${weddingId}/ai-recommendations`, {});
      return response.json();
    },
    onSuccess: (data: AiRecommendation[]) => {
      setAiRecommendations(data);
      setAiRecommendationsOpen(true);
      toast({
        title: "Smart recommendations generated",
        description: `Found ${data.length} personalized tasks for your wedding.`,
      });
    },
    onError: () => {
      toast({
        title: "Could not generate recommendations",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Adopt an AI recommendation as a task
  const adoptRecommendationMutation = useMutation({
    mutationFn: async ({ weddingId, recommendation }: { weddingId: string; recommendation: AiRecommendation }) => {
      const response = await apiRequest("POST", `/api/tasks/${weddingId}/adopt-recommendation`, recommendation);
      return response.json();
    },
    onSuccess: (_, { recommendation }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", wedding?.id] });
      // Mark as dismissed so it won't appear in recommendations again
      setDismissedRecommendations(prev => {
        const newSet = new Set([...prev, recommendation.title]);
        try {
          localStorage.setItem('dismissedAiRecommendations', JSON.stringify([...newSet]));
        } catch {
          // Silently fail if localStorage is unavailable
        }
        return newSet;
      });
      toast({
        title: "Task added to your checklist",
        description: recommendation.title,
      });
    },
    onError: () => {
      toast({
        title: "Failed to add task",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Dismiss a recommendation (persists to localStorage)
  const handleDismissRecommendation = (title: string) => {
    setDismissedRecommendations(prev => {
      const newSet = new Set([...prev, title]);
      try {
        localStorage.setItem('dismissedAiRecommendations', JSON.stringify([...newSet]));
      } catch {
        // Silently fail if localStorage is unavailable
      }
      return newSet;
    });
    toast({
      title: "Recommendation dismissed",
      description: "This suggestion won't appear again.",
    });
  };

  // Visible AI recommendations (exclude dismissed ones)
  const visibleRecommendations = aiRecommendations.filter(
    rec => !dismissedRecommendations.has(rec.title)
  );

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      weddingId: wedding?.id || "",
      title: "",
      description: "",
      priority: "medium",
      completed: false,
    },
  });

  const onSubmit = (data: InsertTask) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
      setEditingTask(null);
    } else {
      createMutation.mutate(data);
    }
    form.reset({
      weddingId: wedding?.id || "",
      title: "",
      description: "",
      priority: "medium",
      completed: false,
    });
  };

  const toggleComplete = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      data: { completed: !task.completed },
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      weddingId: task.weddingId,
      title: task.title,
      description: task.description || "",
      eventId: task.eventId || undefined,
      priority: (task.priority as "high" | "medium" | "low") || "medium",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      category: task.category || undefined,
      completed: task.completed || false,
      assignedToId: task.assignedToId || undefined,
      assignedToName: task.assignedToName || undefined,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesCompleted = 
      filterCompleted === "all" ||
      (filterCompleted === "completed" && task.completed) ||
      (filterCompleted === "pending" && !task.completed);
    const matchesEvent = 
      filterEvent === "all" ||
      (filterEvent === "no-event" && !task.eventId) ||
      task.eventId === filterEvent;
    const matchesAssignee =
      filterAssignee === "all" ||
      (filterAssignee === "unassigned" && !task.assignedToId) ||
      (filterAssignee === "assigned" && !!task.assignedToId) ||
      task.assignedToId === filterAssignee;
    return matchesPriority && matchesCompleted && matchesEvent && matchesAssignee;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    highPriority: tasks.filter((t) => t.priority === "high" && !t.completed).length,
    overdue: tasks.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length,
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
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Wedding Checklist
        </h1>
        <p className="text-muted-foreground text-lg">
          Stay organized with your wedding planning tasks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6 lg:col-span-1 flex items-center justify-center">
          <ProgressRing 
            progress={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
            size={100} 
            strokeWidth={8}
          />
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-chart-1/10">
              <CheckCircle2 className="w-6 h-6 text-chart-1" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-mono text-2xl font-bold" data-testid="stat-completed">
                {stats.completed}/{stats.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="font-mono text-2xl font-bold text-red-600" data-testid="stat-high-priority">
                {stats.highPriority}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="font-mono text-2xl font-bold text-yellow-600" data-testid="stat-overdue">
                {stats.overdue}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Circle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-mono text-2xl font-bold text-blue-600">
                {stats.total - stats.completed}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40" data-testid="filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filterCompleted} onValueChange={setFilterCompleted}>
          <SelectTrigger className="w-40" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-48" data-testid="filter-event">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="no-event">No Specific Event</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {collaborators.length > 0 && (
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-48" data-testid="filter-assignee">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              {collaborators.filter(c => c.status === 'active').map((collab) => (
                <SelectItem key={collab.userId} value={collab.userId}>
                  {collab.userName || collab.userEmail || "Team Member"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTask(null);
              form.reset({
                weddingId: wedding?.id || "",
                title: "",
                description: "",
                priority: "medium",
                completed: false,
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-task">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Book makeup artist"
                            data-testid="input-task-title"
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
                            placeholder="Add any additional details..."
                            data-testid="input-task-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              type="date"
                              data-testid="input-due-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="eventId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Event (Optional)</FormLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-event">
                                <SelectValue placeholder="Select event" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No specific event</SelectItem>
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

                    <FormField
                      control={form.control}
                      name="assignedToId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To (Optional)</FormLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => {
                              field.onChange(value === "none" ? undefined : value);
                              // Also set the name for display
                              if (value && value !== "none") {
                                const collab = collaborators.find(c => c.userId === value);
                                form.setValue("assignedToName", collab?.userName || collab?.userEmail || "Team Member");
                              } else {
                                form.setValue("assignedToName", undefined);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-assignee">
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {collaborators.filter(c => c.status === 'active').map((collab) => (
                                <SelectItem key={collab.userId} value={collab.userId}>
                                  {collab.userName || collab.userEmail || "Team Member"}
                                  {collab.roleName && <span className="text-muted-foreground ml-1">({collab.roleName})</span>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        setEditingTask(null);
                        form.reset({
                          weddingId: wedding?.id || "",
                          title: "",
                          description: "",
                          priority: "medium",
                          completed: false,
                        });
                      }}
                      data-testid="button-cancel-task"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-task"
                    >
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Smart Recommendations Section */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <Collapsible open={aiRecommendationsOpen} onOpenChange={setAiRecommendationsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Smart Recommendations
                    {visibleRecommendations.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {visibleRecommendations.length} suggestions
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI-powered task suggestions personalized for your {wedding?.tradition || ''} wedding
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => wedding?.id && generateRecommendationsMutation.mutate(wedding.id)}
                  disabled={generateRecommendationsMutation.isPending || !wedding?.id}
                  data-testid="button-generate-recommendations"
                >
                  {generateRecommendationsMutation.isPending ? (
                    <>
                      <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {aiRecommendations.length > 0 ? 'Refresh' : 'Get Suggestions'}
                    </>
                  )}
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-toggle-recommendations">
                    {aiRecommendationsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {generateRecommendationsMutation.isPending ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : visibleRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    {aiRecommendations.length > 0 
                      ? "You've reviewed all suggestions!" 
                      : "Click 'Get Suggestions' to receive personalized task recommendations"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Our AI considers your tradition, timeline, budget, and existing tasks
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleRecommendations.map((rec, index) => (
                    <div
                      key={`${rec.title}-${index}`}
                      className="p-4 rounded-lg border bg-card hover-elevate transition-all"
                      data-testid={`ai-recommendation-${index}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm leading-snug">{rec.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleDismissRecommendation(rec.title)}
                          data-testid={`button-dismiss-recommendation-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {rec.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className={PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium}
                        >
                          {PRIORITY_LABELS[rec.priority] || "Medium"}
                        </Badge>
                        {rec.category && (
                          <Badge variant="secondary" className="text-xs">
                            {rec.category}
                          </Badge>
                        )}
                        {rec.suggestedDueDate && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(rec.suggestedDueDate), "MMM d")}
                          </Badge>
                        )}
                      </div>
                      {rec.reason && (
                        <p className="text-xs text-primary/80 mb-3 italic">
                          <Lightbulb className="w-3 h-3 inline mr-1" />
                          {rec.reason}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={adoptRecommendationMutation.isPending}
                        onClick={() => wedding?.id && adoptRecommendationMutation.mutate({
                          weddingId: wedding.id,
                          recommendation: rec
                        })}
                        data-testid={`button-adopt-recommendation-${index}`}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add to Checklist
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="p-6">
        {tasksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground mb-4">
              {tasks.length === 0
                ? "Start building your wedding checklist"
                : "No tasks match the selected filters"}
            </p>
            {tasks.length === 0 && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-task">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
              const relatedEvent = task.eventId ? events.find((e) => e.id === task.eventId) : null;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-all hover-elevate ${
                    task.completed ? "bg-muted/30 opacity-60" : "bg-card"
                  }`}
                  data-testid={`task-item-${task.id}`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.completed || false}
                      onCheckedChange={() => toggleComplete(task)}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3
                            className={`font-semibold text-lg ${
                              task.completed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                            data-testid={`text-task-title-${task.id}`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(task)}
                            data-testid={`button-edit-task-${task.id}`}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(task as any).isAiRecommended && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium}
                        >
                          {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS] || "Medium"}
                        </Badge>

                        {task.dueDate && (
                          <Badge variant="outline" className={isOverdue ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" : ""}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </Badge>
                        )}

                        {relatedEvent && (
                          <Badge variant="outline">
                            {relatedEvent.name}
                          </Badge>
                        )}

                        {task.assignedToName && (
                          <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                            <User className="w-3 h-3 mr-1" />
                            {task.assignedToName}
                          </Badge>
                        )}

                        {task.assignedToId && !task.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            disabled={sendReminderMutation.isPending}
                            onClick={() => sendReminderMutation.mutate(task.id)}
                            data-testid={`button-send-reminder-${task.id}`}
                          >
                            {sendReminderMutation.isPending ? (
                              <span className="animate-pulse">Sending...</span>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Send Reminder
                              </>
                            )}
                          </Button>
                        )}

                        {task.dueDate && !task.completed && (
                          <div className="flex items-center gap-2 ml-auto">
                            <Button
                              size="sm"
                              variant={task.reminderEnabled ? "default" : "outline"}
                              className="h-7 gap-1 text-xs"
                              disabled={reminderMutation.isPending}
                              onClick={() => reminderMutation.mutate({
                                id: task.id,
                                data: { reminderEnabled: !task.reminderEnabled }
                              })}
                              data-testid={`button-toggle-reminder-${task.id}`}
                            >
                              {reminderMutation.isPending ? (
                                <span className="animate-pulse">...</span>
                              ) : task.reminderEnabled ? (
                                <>
                                  <Bell className="w-3 h-3" />
                                  {task.reminderDaysBefore || 1}d before
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-3 h-3" />
                                  No reminder
                                </>
                              )}
                            </Button>
                            {task.reminderEnabled && (
                              <Select
                                value={task.reminderMethod || "email"}
                                disabled={reminderMutation.isPending}
                                onValueChange={(value) => reminderMutation.mutate({
                                  id: task.id,
                                  data: { reminderMethod: value }
                                })}
                              >
                                <SelectTrigger className="h-7 w-24 text-xs" data-testid={`select-reminder-method-${task.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      Email
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sms">
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      SMS
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
