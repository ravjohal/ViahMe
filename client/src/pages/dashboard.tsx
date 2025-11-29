import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimelineView } from "@/components/timeline-view";
import { BudgetDashboard } from "@/components/budget-dashboard";
import { WelcomeTour } from "@/components/welcome-tour";
import { EventDetailModal } from "@/components/event-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, Users, Briefcase, FileText, Camera, CheckCircle2, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Wedding, Event, BudgetCategory, Contract, Vendor, EventCostItem, Guest } from "@shared/schema";

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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: budgetCategories = [], isLoading: budgetLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
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

  // Calculate step completion status
  const totalBudget = parseFloat(wedding.totalBudget || "0");
  const hasBudget = totalBudget > 0;
  const hasCategories = budgetCategories.length > 0;
  const hasEvents = events.length > 0;
  const hasVendors = vendors.length > 0;
  const hasGuests = guests.length > 0;

  // Step definitions with completion status
  const steps = [
    {
      id: "budget",
      number: 1,
      title: "Set Your Budget",
      description: "Decide how much you want to spend on your wedding",
      completed: hasBudget && hasCategories,
      inProgress: hasBudget && !hasCategories,
      path: "/budget",
      color: "emerald",
    },
    {
      id: "events",
      number: 2,
      title: "Plan Your Events",
      description: "Add ceremonies and celebrations to your timeline",
      completed: hasEvents,
      inProgress: false,
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

        {/* Progress Overview */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20 border-orange-200 dark:border-orange-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Getting Started</h2>
                <p className="text-muted-foreground">
                  {completedSteps === steps.length 
                    ? "You've completed all the basics!" 
                    : `${completedSteps} of ${steps.length} steps completed`}
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </div>
        </Card>

        {/* Step-by-Step Guide - Same design as Team/Budget */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Planning Roadmap</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step) => {
              const colors = getStepColors(step, step === nextStep);
              const isNextStep = step === nextStep;
              
              return (
                <Card 
                  key={step.id}
                  className={`p-6 transition-all hover-elevate cursor-pointer ${
                    step.completed 
                      ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-800/40 border-gray-300 dark:border-gray-700"
                      : isNextStep 
                        ? colors.active 
                        : colors.inactive
                  }`}
                  onClick={() => setLocation(step.path)}
                  data-testid={`step-card-${step.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      {step.completed ? (
                        <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className={`${colors.circle} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm`}>
                          {step.number}
                        </div>
                      )}
                      <span className={`font-semibold ${step.completed ? 'text-muted-foreground' : ''}`}>
                        {step.title}
                      </span>
                    </div>
                    <p className={`text-sm ml-10 ${step.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {step.description}
                    </p>
                    {step.completed && (
                      <Badge variant="secondary" className="ml-10 mt-2">Done</Badge>
                    )}
                    {isNextStep && !step.completed && (
                      <div className="ml-10 mt-2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                          Start Here
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Next Step Call-to-Action */}
        {nextStep && (
          <Card className="p-6 mb-8 border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${getStepColors(nextStep, true).circle} flex items-center justify-center text-white font-bold text-lg`}>
                  {nextStep.number}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your next step</p>
                  <h3 className="text-xl font-semibold">{nextStep.title}</h3>
                  <p className="text-muted-foreground">{nextStep.description}</p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setLocation(nextStep.path)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                data-testid="button-next-step"
              >
                Let's Go
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats Grid */}
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
                    {vendors.length}
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
