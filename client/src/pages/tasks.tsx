import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Task, Event, WeddingRoleAssignment, TaskComment } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckCircle2, Circle, AlertCircle, Trash2, Filter, Bell, BellOff, Mail, MessageSquare, User, Send, Sparkles, Lightbulb, X, ChevronDown, ChevronUp, Wand2, MessageCircle, List, Clock, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
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

// Timeline periods for grouping tasks by days before the wedding date
// daysMin/daysMax represent how many days BEFORE the wedding the task should be due
const TIMELINE_PERIODS = [
  { key: "overdue", label: "Overdue", daysMin: null, daysMax: null },
  { key: "after_wedding", label: "After Wedding", daysMin: null, daysMax: null },
  { key: "day_of", label: "Day Of Wedding", daysMin: 0, daysMax: 0 },
  { key: "day_before", label: "Day Before Wedding", daysMin: 1, daysMax: 1 },
  { key: "one_week", label: "1 Week Before", daysMin: 2, daysMax: 7 },
  { key: "two_weeks", label: "2 Weeks Before", daysMin: 8, daysMax: 14 },
  { key: "one_month", label: "1 Month Before", daysMin: 15, daysMax: 31 },
  { key: "two_months", label: "2 Months Before", daysMin: 32, daysMax: 61 },
  { key: "three_months", label: "3 Months Before", daysMin: 62, daysMax: 92 },
  { key: "four_months", label: "4 Months Before", daysMin: 93, daysMax: 122 },
  { key: "six_months", label: "6 Months Before", daysMin: 123, daysMax: 184 },
  { key: "eight_months", label: "8 Months Before", daysMin: 185, daysMax: 245 },
  { key: "ten_months", label: "10 Months Before", daysMin: 246, daysMax: 306 },
  { key: "twelve_plus", label: "12+ Months Before", daysMin: 307, daysMax: Infinity },
  { key: "no_date", label: "No Due Date", daysMin: null, daysMax: null },
];

function getTimelinePeriod(task: Task, weddingDate: Date | null): string {
  if (!task.dueDate) return "no_date";
  if (!weddingDate) return "no_date";
  
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  // Calculate days until due date from today (for overdue check)
  const daysFromNow = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if overdue (due date has passed and task not completed)
  if (daysFromNow < 0 && !task.completed) return "overdue";
  
  // Calculate days before wedding (how many days before the wedding is this task due)
  const weddingDateCopy = new Date(weddingDate);
  weddingDateCopy.setHours(0, 0, 0, 0);
  const daysBeforeWedding = Math.floor((weddingDateCopy.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // If the task is due after the wedding (negative daysBeforeWedding)
  if (daysBeforeWedding < 0) return "after_wedding";
  
  // Find matching period based on days before wedding
  for (const period of TIMELINE_PERIODS) {
    if (period.daysMin === null || period.daysMax === null) continue;
    if (period.key === "overdue" || period.key === "after_wedding") continue; // Already handled
    
    if (daysBeforeWedding >= period.daysMin && daysBeforeWedding <= period.daysMax) {
      return period.key;
    }
  }
  
  // Default to 12+ months if very far before wedding
  if (daysBeforeWedding > 306) return "twelve_plus";
  
  return "no_date";
}

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
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "timeline">("timeline");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiRecommendationsOpen, setAiRecommendationsOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<{ [taskId: string]: string }>({});
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(TIMELINE_PERIODS.map(p => p.key)));
  
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
    mutationFn: async ({ id, data }: { id: string; data: { reminderEnabled?: boolean; reminderDate?: string; reminderDaysBefore?: number; reminderMethod?: string } }) => {
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

  // Task Comments - mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/comments`, {
        taskId,
        weddingId: wedding?.id,
        userId: user?.id || 'anonymous',
        userName: user?.email || 'Family Member',
        content,
      });
      return response.json();
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setNewComment(prev => ({ ...prev, [taskId]: '' }));
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleComments = (taskId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

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

  // Group tasks by timeline period for timeline view
  const timelineGroupedTasks = useMemo(() => {
    const weddingDate = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
    const grouped: { [key: string]: Task[] } = {};
    
    TIMELINE_PERIODS.forEach(period => {
      grouped[period.key] = [];
    });
    
    filteredTasks.forEach(task => {
      const periodKey = getTimelinePeriod(task, weddingDate);
      if (grouped[periodKey]) {
        grouped[periodKey].push(task);
      } else {
        grouped["no_date"].push(task);
      }
    });
    
    return grouped;
  }, [filteredTasks, wedding?.weddingDate]);

  const togglePeriodExpanded = (periodKey: string) => {
    setExpandedPeriods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(periodKey)) {
        newSet.delete(periodKey);
      } else {
        newSet.add(periodKey);
      }
      return newSet;
    });
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

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            data-testid="button-view-timeline"
          >
            <Clock className="w-4 h-4 mr-1" />
            Timeline
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>
        </div>

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
        ) : viewMode === "timeline" ? (
          <div className="space-y-4">
            {TIMELINE_PERIODS.map((period) => {
              const periodTasks = timelineGroupedTasks[period.key] || [];
              if (periodTasks.length === 0) return null;
              
              const completedCount = periodTasks.filter(t => t.completed).length;
              const isExpanded = expandedPeriods.has(period.key);
              
              return (
                <Collapsible key={period.key} open={isExpanded} onOpenChange={() => togglePeriodExpanded(period.key)}>
                  <CollapsibleTrigger asChild>
                    <div 
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover-elevate ${
                        period.key === "overdue" ? "bg-red-500/5 border-red-500/20" : "bg-muted/30"
                      }`}
                      data-testid={`timeline-period-${period.key}`}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <h3 className={`font-semibold ${period.key === "overdue" ? "text-red-600" : "text-foreground"}`}>
                            {period.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {completedCount} of {periodTasks.length} completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${period.key === "overdue" ? "bg-red-500" : "bg-primary"}`}
                            style={{ width: `${periodTasks.length > 0 ? (completedCount / periodTasks.length) * 100 : 0}%` }}
                          />
                        </div>
                        <Badge variant="secondary">
                          {periodTasks.length}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pl-8 mt-2">
                      {periodTasks.map((task) => {
                        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
                        const relatedEvent = task.eventId ? events.find((e) => e.id === task.eventId) : null;

                        return (
                          <div
                            key={task.id}
                            className={`p-3 rounded-lg border transition-all hover-elevate ${
                              task.completed ? "bg-muted/30 opacity-60" : "bg-card"
                            }`}
                            data-testid={`task-item-${task.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={task.completed || false}
                                onCheckedChange={() => toggleComplete(task)}
                                className="mt-0.5"
                                data-testid={`checkbox-task-${task.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4
                                    className={`font-medium ${
                                      task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}
                                    data-testid={`text-task-title-${task.id}`}
                                  >
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {(task as any).linkTo && !task.completed && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => setLocation((task as any).linkTo)}
                                        data-testid={`button-go-task-${task.id}`}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Go
                                      </Button>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleEdit(task)}
                                      data-testid={`button-edit-task-${task.id}`}
                                    >
                                      <Calendar className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleDelete(task.id)}
                                      data-testid={`button-delete-task-${task.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium}`}
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.dueDate && (
                                    <Badge variant="outline" className={`text-xs ${isOverdue ? "bg-red-500/10 text-red-700 dark:text-red-400" : ""}`}>
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {format(new Date(task.dueDate), "MMM d")}
                                    </Badge>
                                  )}
                                  {relatedEvent && (
                                    <Badge variant="outline" className="text-xs">
                                      {relatedEvent.name}
                                    </Badge>
                                  )}
                                  {task.assignedToName && (
                                    <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2">
                                      <User className="w-3 h-3 mr-1" />
                                      {task.assignedToName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
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
                          {(task as any).linkTo && !task.completed && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => setLocation((task as any).linkTo)}
                              data-testid={`button-go-task-${task.id}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Go
                            </Button>
                          )}
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

                        {!task.completed && (
                          <div className="flex items-center gap-2 ml-auto">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={task.reminderEnabled ? "default" : "outline"}
                                  className="h-7 gap-1 text-xs"
                                  data-testid={`button-set-reminder-${task.id}`}
                                >
                                  {task.reminderEnabled && task.reminderDate ? (
                                    <>
                                      <Bell className="w-3 h-3" />
                                      {format(new Date(task.reminderDate), "MMM d")}
                                    </>
                                  ) : (
                                    <>
                                      <Bell className="w-3 h-3" />
                                      Set Reminder
                                    </>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <div className="p-3 border-b">
                                  <h4 className="font-medium text-sm">Set Reminder Date</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.dueDate
                                      ? `Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`
                                      : relatedEvent?.date 
                                        ? `Event: ${format(new Date(relatedEvent.date), "MMM d, yyyy")}`
                                        : wedding?.weddingDate
                                          ? `Wedding: ${format(new Date(wedding.weddingDate), "MMM d, yyyy")}`
                                          : "No date set"
                                    }
                                  </p>
                                </div>
                                <CalendarPicker
                                  mode="single"
                                  selected={task.reminderDate ? new Date(task.reminderDate) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      reminderMutation.mutate({
                                        id: task.id,
                                        data: { 
                                          reminderEnabled: true, 
                                          reminderDate: date.toISOString() 
                                        }
                                      });
                                    }
                                  }}
                                  defaultMonth={
                                    task.reminderDate 
                                      ? new Date(task.reminderDate)
                                      : task.dueDate
                                        ? new Date(new Date(task.dueDate).getTime() - 86400000)
                                        : relatedEvent?.date 
                                          ? new Date(new Date(relatedEvent.date).getTime() - 86400000)
                                          : wedding?.weddingDate
                                            ? new Date(new Date(wedding.weddingDate).getTime() - 86400000)
                                            : new Date()
                                  }
                                  initialFocus
                                />
                                <div className="p-3 border-t space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    <span>Reminder via Email</span>
                                  </div>
                                  {task.reminderEnabled && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs text-muted-foreground"
                                      onClick={() => reminderMutation.mutate({
                                        id: task.id,
                                        data: { reminderEnabled: false, reminderDate: undefined }
                                      })}
                                      data-testid={`button-clear-reminder-${task.id}`}
                                    >
                                      <BellOff className="w-3 h-3 mr-1" />
                                      Clear Reminder
                                    </Button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      {/* Family Collaboration Comments */}
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-muted-foreground"
                          onClick={() => toggleComments(task.id)}
                          data-testid={`button-toggle-comments-${task.id}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {expandedComments.has(task.id) ? 'Hide Comments' : 'Family Discussion'}
                        </Button>
                        
                        {expandedComments.has(task.id) && (
                          <TaskCommentsSection 
                            taskId={task.id} 
                            weddingId={wedding?.id || ''}
                            user={user}
                            newComment={newComment[task.id] || ''}
                            setNewComment={(val) => setNewComment(prev => ({ ...prev, [task.id]: val }))}
                            onSubmit={() => {
                              if (newComment[task.id]?.trim()) {
                                addCommentMutation.mutate({ taskId: task.id, content: newComment[task.id] });
                              }
                            }}
                            isPending={addCommentMutation.isPending}
                          />
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

      {/* AI Smart Suggestions - Secondary section at bottom */}
      <Collapsible open={aiRecommendationsOpen} onOpenChange={setAiRecommendationsOpen} className="mt-6">
        <div className="flex items-center justify-between px-1 mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="button-toggle-recommendations">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Generate Ideas for Tasks</span>
              {visibleRecommendations.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {visibleRecommendations.length}
                </Badge>
              )}
              {aiRecommendationsOpen ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Card className="border-dashed">
            <CardContent className="p-4">
              {generateRecommendationsMutation.isPending ? (
                <div className="flex gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 flex-1" />
                  ))}
                </div>
              ) : visibleRecommendations.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {aiRecommendations.length > 0 
                      ? "You've reviewed all suggestions!" 
                      : "Get personalized task ideas based on your wedding details"
                    }
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => wedding?.id && generateRecommendationsMutation.mutate(wedding.id)}
                    disabled={generateRecommendationsMutation.isPending || !wedding?.id}
                    data-testid="button-generate-recommendations"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {aiRecommendations.length > 0 ? 'Generate More Ideas' : 'Generate AI Ideas'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {visibleRecommendations.slice(0, 4).map((rec, index) => (
                      <div
                        key={`${rec.title}-${index}`}
                        className="flex-shrink-0 w-64 p-3 rounded-lg border bg-card"
                        data-testid={`ai-recommendation-${index}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-medium text-xs leading-snug line-clamp-2">{rec.title}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            onClick={() => handleDismissRecommendation(rec.title)}
                            data-testid={`button-dismiss-recommendation-${index}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium}`}
                          >
                            {rec.priority}
                          </Badge>
                          {rec.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {rec.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs"
                          disabled={adoptRecommendationMutation.isPending}
                          onClick={() => wedding?.id && adoptRecommendationMutation.mutate({
                            weddingId: wedding.id,
                            recommendation: rec
                          })}
                          data-testid={`button-adopt-recommendation-${index}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => wedding?.id && generateRecommendationsMutation.mutate(wedding.id)}
                      disabled={generateRecommendationsMutation.isPending || !wedding?.id}
                      data-testid="button-refresh-recommendations"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      Generate More Ideas
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Task Comments Section Component
function TaskCommentsSection({ 
  taskId, 
  weddingId, 
  user, 
  newComment, 
  setNewComment, 
  onSubmit, 
  isPending 
}: { 
  taskId: string;
  weddingId: string;
  user: any;
  newComment: string;
  setNewComment: (val: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { data: comments = [], isLoading } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
  });

  return (
    <div className="mt-3 space-y-3" data-testid={`task-comments-section-${taskId}`}>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No comments yet. Family members can discuss this task here.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
              data-testid={`comment-${comment.id}`}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {comment.userName?.charAt(0)?.toUpperCase() || 'F'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{comment.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment for your family..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          data-testid={`input-comment-${taskId}`}
        />
        <Button
          size="sm"
          disabled={isPending || !newComment.trim()}
          onClick={onSubmit}
          data-testid={`button-submit-comment-${taskId}`}
        >
          {isPending ? '...' : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
