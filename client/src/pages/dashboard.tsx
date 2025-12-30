import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimelineView } from "@/components/timeline-view";
import { BudgetDashboard } from "@/components/budget-dashboard";
import { WelcomeTour } from "@/components/welcome-tour";
import { EventDetailModal } from "@/components/event-detail-modal";
import { CeremonyCostBreakdown } from "@/components/ceremony-cost-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, Users, Briefcase, FileText, Camera, CheckCircle2, ArrowRight, Sparkles, UserPlus, Heart, Clock, Bot, CheckSquare, Globe, Package, Music, Image, MessageSquare, Radio, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSION_CATEGORIES, type PermissionCategory } from "@shared/schema";
import type { Wedding, Event, BudgetCategory, Contract, Booking, EventCostItem, Guest, WeddingRole, Task } from "@shared/schema";

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

interface FeatureCard {
  permission: PermissionCategory;
  label: string;
  description: string;
  icon: any;
  path: string;
  color: string;
}

const COLLABORATOR_FEATURES: FeatureCard[] = [
  { permission: "guests", label: "Guest Management", description: "View and manage the guest list", icon: Users, path: "/guests", color: "pink" },
  { permission: "guest_suggestions", label: "Suggest Guests", description: "Suggest guests for the couple to approve", icon: UserPlus, path: "/guests", color: "rose" },
  { permission: "timeline", label: "Timeline & Events", description: "View and manage wedding events", icon: Clock, path: "/timeline", color: "orange" },
  { permission: "budget", label: "Budget & Payments", description: "View and track the wedding budget", icon: DollarSign, path: "/budget", color: "emerald" },
  { permission: "vendors", label: "Vendors", description: "Browse and manage vendor relationships", icon: Briefcase, path: "/vendors", color: "blue" },
  { permission: "tasks", label: "Tasks", description: "View and manage wedding tasks", icon: CheckSquare, path: "/tasks", color: "purple" },
  { permission: "contracts", label: "Contracts", description: "View and sign vendor contracts", icon: FileText, path: "/contracts", color: "indigo" },
  { permission: "website", label: "Wedding Website", description: "Manage the public wedding website", icon: Globe, path: "/website-builder", color: "cyan" },
  { permission: "photos", label: "Photos & Media", description: "Upload and manage photos", icon: Image, path: "/photo-gallery", color: "amber" },
  { permission: "documents", label: "Documents", description: "Access wedding documents", icon: FileText, path: "/documents", color: "gray" },
  { permission: "playlists", label: "Music & Playlists", description: "Manage music selections", icon: Music, path: "/playlists", color: "violet" },
  { permission: "messages", label: "Messages", description: "Communicate with vendors and team", icon: MessageSquare, path: "/messages", color: "sky" },
  { permission: "shopping", label: "Shopping List", description: "Track shopping and measurements", icon: Package, path: "/shopping", color: "fuchsia" },
  { permission: "invitations", label: "Invitations", description: "Manage wedding invitations", icon: ShoppingBag, path: "/invitations", color: "lime" },
  { permission: "concierge", label: "Guest Concierge", description: "Manage live updates and rituals", icon: Radio, path: "/ritual-control", color: "red" },
  { permission: "ai_planner", label: "AI Wedding Planner", description: "Get AI-powered planning assistance", icon: Bot, path: "/ai-planner", color: "gradient" },
];

function CollaboratorDashboard({ wedding, roleName }: { wedding: Wedding; roleName?: string }) {
  const [, setLocation] = useLocation();
  const { canView, canEdit, canManage, permissions } = usePermissions();
  const { user } = useAuth();

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      pink: { bg: "bg-pink-100 dark:bg-pink-900/30", icon: "text-pink-600", border: "border-pink-200 dark:border-pink-800" },
      rose: { bg: "bg-rose-100 dark:bg-rose-900/30", icon: "text-rose-600", border: "border-rose-200 dark:border-rose-800" },
      orange: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: "text-orange-600", border: "border-orange-200 dark:border-orange-800" },
      emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "text-emerald-600", border: "border-emerald-200 dark:border-emerald-800" },
      blue: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-600", border: "border-blue-200 dark:border-blue-800" },
      purple: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600", border: "border-purple-200 dark:border-purple-800" },
      indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/30", icon: "text-indigo-600", border: "border-indigo-200 dark:border-indigo-800" },
      cyan: { bg: "bg-cyan-100 dark:bg-cyan-900/30", icon: "text-cyan-600", border: "border-cyan-200 dark:border-cyan-800" },
      amber: { bg: "bg-amber-100 dark:bg-amber-900/30", icon: "text-amber-600", border: "border-amber-200 dark:border-amber-800" },
      gray: { bg: "bg-gray-100 dark:bg-gray-900/30", icon: "text-gray-600", border: "border-gray-200 dark:border-gray-800" },
      violet: { bg: "bg-violet-100 dark:bg-violet-900/30", icon: "text-violet-600", border: "border-violet-200 dark:border-violet-800" },
      sky: { bg: "bg-sky-100 dark:bg-sky-900/30", icon: "text-sky-600", border: "border-sky-200 dark:border-sky-800" },
      fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", icon: "text-fuchsia-600", border: "border-fuchsia-200 dark:border-fuchsia-800" },
      lime: { bg: "bg-lime-100 dark:bg-lime-900/30", icon: "text-lime-600", border: "border-lime-200 dark:border-lime-800" },
      red: { bg: "bg-red-100 dark:bg-red-900/30", icon: "text-red-600", border: "border-red-200 dark:border-red-800" },
      gradient: { bg: "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30", icon: "text-orange-600", border: "border-orange-200 dark:border-orange-800" },
    };
    return colors[color] || colors.gray;
  };

  const getPermissionLevel = (permission: PermissionCategory): string => {
    if (canManage(permission)) return "Full Access";
    if (canEdit(permission)) return "Can Edit";
    if (canView(permission)) return "View Only";
    return "No Access";
  };

  const accessibleFeatures = COLLABORATOR_FEATURES.filter(f => canView(f.permission));

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <Card className="p-8 mb-8 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30 border-orange-200 dark:border-orange-800" data-testid="collaborator-welcome-card">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }} data-testid="collaborator-welcome-title">
                  Welcome, {user?.email?.split('@')[0] || 'Guest'}!
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  You've been invited to help plan {wedding.partner1Name && wedding.partner2Name 
                    ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
                    : wedding.partner1Name || wedding.partner2Name || 'the couple'}'s wedding
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-sm" data-testid="badge-wedding-tradition">
                  {wedding.tradition.charAt(0).toUpperCase() + wedding.tradition.slice(1)} Wedding
                </Badge>
                {roleName && (
                  <Badge variant="outline" className="text-sm" data-testid="badge-collaborator-role">
                    {roleName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">What You Can Do</h2>
          <p className="text-muted-foreground mb-6">
            Based on your role, you have access to the following areas of wedding planning:
          </p>
          
          {accessibleFeatures.length === 0 ? (
            <Card className="p-8 text-center" data-testid="no-permissions-card">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Permissions Yet</h3>
                <p className="text-muted-foreground">
                  The couple hasn't assigned any specific permissions to your role yet. 
                  Please check back later or contact them for access.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessibleFeatures.map((feature) => {
                const colors = getColorClasses(feature.color);
                const Icon = feature.icon;
                const level = getPermissionLevel(feature.permission);
                
                return (
                  <Card 
                    key={feature.permission}
                    className={`p-5 hover-elevate cursor-pointer transition-all ${colors.border}`}
                    onClick={() => setLocation(feature.path)}
                    data-testid={`feature-card-${feature.permission}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <Badge 
                          variant={level === "Full Access" ? "default" : level === "Can Edit" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {level}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.label}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        Open
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="p-6 bg-muted/30" data-testid="collaborator-info-card">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Your Role{roleName ? `: ${roleName}` : ' in the Wedding'}</h3>
              <p className="text-sm text-muted-foreground">
                {roleName 
                  ? `You're helping make this wedding special as "${roleName}". The couple has given you specific permissions to assist with planning.`
                  : "As a team member, you're helping make this wedding special. The couple has given you specific permissions to assist with planning."
                }
                {' '}If you need access to additional features, please contact the couple directly.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { isOwner, isLoading: permissionsLoading, weddingId } = usePermissions();

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const { data: myRole } = useQuery<{ role: WeddingRole | null }>({
    queryKey: ["/api/weddings", wedding?.id, "my-role"],
    enabled: !!wedding?.id && !isOwner,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: budgetCategories = [], isLoading: budgetLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["/api/guests", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: costItems = [], isLoading: costItemsLoading } = useQuery<EventCostItem[]>({
    queryKey: ["/api/events", selectedEvent?.id, "cost-items"],
    enabled: !!selectedEvent?.id,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", wedding?.id],
    enabled: !!wedding?.id,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      setSelectedEvent(null);
      toast({
        title: "Event deleted",
        description: "The event has been removed from your wedding.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(id);
    }
  };

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  if (weddingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return <CollaboratorDashboard wedding={wedding} roleName={myRole?.role?.displayName} />;
  }

  // Calculate step completion status
  const totalBudget = parseFloat(wedding.totalBudget || "0");
  const hasBudget = totalBudget > 0;
  const hasCategories = budgetCategories.length > 0;
  const hasEvents = events.length > 0;
  const hasVendors = bookings.length > 0;
  const hasGuests = guests.length > 0;
  const budgetConfirmed = wedding.budgetConfirmed === true;
  const eventsConfirmed = wedding.eventsConfirmed === true;

  // Step definitions with completion status
  const steps = [
    {
      id: "budget",
      number: 1,
      title: "Review Your Budget",
      description: budgetConfirmed 
        ? "Budget categories confirmed" 
        : "We've allocated your budget across categories. Review and confirm.",
      completed: hasBudget && hasCategories && budgetConfirmed,
      inProgress: hasBudget && hasCategories && !budgetConfirmed,
      path: "/budget",
      color: "emerald",
    },
    {
      id: "events",
      number: 2,
      title: "Review Your Events",
      description: eventsConfirmed
        ? "Event timeline confirmed"
        : "We've created events based on your tradition. Review and confirm.",
      completed: hasEvents && eventsConfirmed,
      inProgress: hasEvents && !eventsConfirmed,
      path: "/timeline",
      color: "orange",
    },
    {
      id: "vendors",
      number: 3,
      title: "Find Vendors",
      description: "Browse and book culturally-specialized service providers",
      completed: hasVendors,
      inProgress: false,
      path: "/vendors",
      color: "blue",
    },
    {
      id: "guests",
      number: 4,
      title: "Invite Guests",
      description: "Add your guest list and manage RSVPs",
      completed: hasGuests,
      inProgress: false,
      path: "/guests",
      color: "pink",
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  // Find next step to do
  const nextStep = steps.find(s => !s.completed);

  // Color classes for each step
  const getStepColors = (step: typeof steps[0], isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string; circle: string }> = {
      emerald: {
        active: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600",
        inactive: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800",
        circle: "bg-emerald-600",
      },
      orange: {
        active: "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-orange-400 dark:border-orange-600",
        inactive: "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-orange-200 dark:border-orange-800",
        circle: "bg-orange-600",
      },
      blue: {
        active: "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-blue-400 dark:border-blue-600",
        inactive: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800",
        circle: "bg-blue-600",
      },
      pink: {
        active: "bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border-pink-400 dark:border-pink-600",
        inactive: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800",
        circle: "bg-pink-600",
      },
    };
    return colors[step.color] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Welcome to Your Wedding Dashboard
          </h1>
          <p className="text-muted-foreground">
            Plan your beautiful {wedding.tradition} celebration step by step
          </p>
        </div>

        {/* Consolidated Onboarding Widget */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20 border-orange-200 dark:border-orange-800" data-testid="onboarding-widget">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {completedSteps === steps.length 
                      ? "All Set!" 
                      : nextStep?.title || "Getting Started"}
                  </h2>
                  <p className="text-muted-foreground">
                    {completedSteps === steps.length 
                      ? "You've completed all the basics!" 
                      : nextStep?.description || `${completedSteps} of ${steps.length} steps completed`}
                  </p>
                </div>
              </div>
              {nextStep && (
                <Button
                  size="lg"
                  onClick={() => setLocation(nextStep.path)}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  data-testid="button-next-step"
                >
                  Let's Go
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {steps.map((step) => {
                const isActive = step === nextStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => setLocation(step.path)}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all hover-elevate ${
                      step.completed 
                        ? "bg-emerald-100 dark:bg-emerald-900/30" 
                        : isActive 
                          ? "bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-400" 
                          : "bg-muted/50"
                    }`}
                    data-testid={`step-button-${step.id}`}
                  >
                    {step.completed ? (
                      <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className={`${getStepColors(step, isActive).circle} text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                        {step.number}
                      </div>
                    )}
                    <span className={`text-sm font-medium truncate ${step.completed ? 'text-muted-foreground' : ''}`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completedSteps} of {steps.length} completed</span>
              <span className="font-semibold text-orange-600">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </Card>

        {/* Quick Stats Grid - Moved higher for better visibility */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">At a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card 
              className="p-4 hover-elevate cursor-pointer border-orange-200 dark:border-orange-800" 
              onClick={() => setLocation("/timeline")}
              data-testid="stat-card-events"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Events</p>
                  <p className="font-mono text-xl font-bold" data-testid="stat-events-count">
                    {events.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 hover-elevate cursor-pointer border-emerald-200 dark:border-emerald-800" 
              onClick={() => setLocation("/budget")}
              data-testid="stat-card-budget"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-mono text-lg font-bold">
                    ${totalBudget > 0 ? (totalBudget / 1000).toFixed(0) + 'k' : '0'}
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 hover-elevate cursor-pointer border-blue-200 dark:border-blue-800" 
              onClick={() => setLocation("/vendors")}
              data-testid="stat-card-vendors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                  <p className="font-mono text-xl font-bold" data-testid="stat-vendors-count">
                    {bookings.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 hover-elevate cursor-pointer border-pink-200 dark:border-pink-800" 
              onClick={() => setLocation("/guests")}
              data-testid="stat-card-guests"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guests</p>
                  <p className="font-mono text-xl font-bold" data-testid="stat-guests-count">
                    {guests.length || wedding.guestCountEstimate || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 hover-elevate cursor-pointer border-purple-200 dark:border-purple-800" 
              onClick={() => setLocation("/contracts")}
              data-testid="stat-card-contracts"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                  <p className="font-mono text-xl font-bold" data-testid="stat-contracts-count">
                    {contracts.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 hover-elevate cursor-pointer border-amber-200 dark:border-amber-800" 
              onClick={() => setLocation("/collaborators")}
              data-testid="stat-card-team"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-mono text-xl font-bold">
                    Manage
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Ceremony Cost Breakdown */}
        {events.length > 0 && (
          <div className="mb-8">
            <CeremonyCostBreakdown events={events} />
          </div>
        )}

        {/* Timeline Preview */}
        {hasEvents && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              <Button variant="ghost" onClick={() => setLocation("/timeline")}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {eventsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-32 w-full" />
              </Card>
            ) : (
              <TimelineView events={events.slice(0, 3)} onEditEvent={setSelectedEvent} />
            )}
          </div>
        )}

        {/* Budget Preview */}
        {hasBudget && hasCategories && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Budget Overview</h2>
              <Button variant="ghost" onClick={() => setLocation("/budget")}>
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {budgetLoading ? (
              <Card className="p-6">
                <Skeleton className="h-32 w-full" />
              </Card>
            ) : (
              <BudgetDashboard
                categories={budgetCategories}
                totalBudget={wedding.totalBudget || "0"}
              />
            )}
          </div>
        )}

        {/* Helpful Links */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20 border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-semibold mb-4">More to Explore</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => setLocation("/photo-gallery")}
            >
              <Camera className="w-5 h-5 mr-3 text-amber-600" />
              <div className="text-left">
                <p className="font-medium">Photo Gallery</p>
                <p className="text-xs text-muted-foreground">Inspiration & event photos</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => setLocation("/cultural-info")}
            >
              <Sparkles className="w-5 h-5 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Cultural Guide</p>
                <p className="text-xs text-muted-foreground">Traditions & ceremonies</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => setLocation("/shopping")}
            >
              <Briefcase className="w-5 h-5 mr-3 text-pink-600" />
              <div className="text-left">
                <p className="font-medium">Shopping Tracker</p>
                <p className="text-xs text-muted-foreground">Attire & accessories</p>
              </div>
            </Button>
          </div>
        </Card>
      </main>

      <WelcomeTour weddingTradition={wedding.tradition} />

      <EventDetailModal
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
        costItems={costItems}
        costItemsLoading={costItemsLoading}
        budgetCategories={budgetCategories}
        onEdit={() => {
          setLocation(`/timeline?eventId=${selectedEvent?.id}`);
          setSelectedEvent(null);
        }}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
