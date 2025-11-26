import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  ListChecks,
  Calendar,
  Users,
  DollarSign,
  Store,
  Globe,
  PartyPopper,
  Sparkles,
  X
} from "lucide-react";
import type { Wedding, Event, Contract, Guest } from "@shared/schema";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  link: string;
  icon: typeof Calendar;
}

export function FloatingChecklist() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  // Don't show on auth pages, vendor pages, or public pages
  const hideOnPages = [
    "/", 
    "/onboarding", 
    "/login", 
    "/vendor-login", 
    "/vendor-register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/vendor-dashboard",
    "/vendor-analytics",
    "/cultural-info",
    "/checkout",
    "/order-confirmation"
  ];

  const shouldHide = hideOnPages.includes(location) || 
                     location.startsWith("/wedding/") ||
                     location.startsWith("/rsvp/") ||
                     location.startsWith("/live/") ||
                     !user ||
                     user.role === "vendor";

  // Fetch wedding data
  const { data: weddings = [] } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !shouldHide,
  });

  const wedding = weddings[0];

  // Fetch events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch guests/households
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["/api/guests", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch contracts (vendors booked for this wedding)
  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Remember minimized state
  useEffect(() => {
    const saved = localStorage.getItem("checklist-minimized");
    if (saved === "true") {
      setIsMinimized(true);
    }
  }, []);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem("checklist-minimized", String(newState));
    if (newState) setIsOpen(false);
  };

  if (shouldHide || !wedding) {
    return null;
  }

  // Define checklist items based on actual data
  const checklistItems: ChecklistItem[] = [
    {
      id: "date",
      label: "Set your wedding date",
      description: "Pick the big day!",
      done: !!wedding.weddingDate,
      link: "/settings",
      icon: Calendar,
    },
    {
      id: "events",
      label: "Add your events",
      description: "Mehndi, Sangeet, Ceremony...",
      done: events.length > 0,
      link: "/timeline",
      icon: PartyPopper,
    },
    {
      id: "budget",
      label: "Set your budget",
      description: "Plan your spending",
      done: !!wedding.totalBudget && Number(wedding.totalBudget) > 0,
      link: "/budget",
      icon: DollarSign,
    },
    {
      id: "guests",
      label: "Start your guest list",
      description: "Who's coming to celebrate?",
      done: guests.length > 0,
      link: "/guest-management",
      icon: Users,
    },
    {
      id: "vendors",
      label: "Book your vendors",
      description: "Caterers, photographers...",
      done: contracts.length > 0,
      link: "/vendors",
      icon: Store,
    },
    {
      id: "website",
      label: "Create your website",
      description: "Share details with guests",
      done: false, // Can be enhanced with actual website data
      link: "/website-builder",
      icon: Globe,
    },
  ];

  const completedCount = checklistItems.filter(item => item.done).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);
  const allDone = completedCount === checklistItems.length;

  // Minimized bubble view
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50" data-tour="floating-checklist">
        <Button
          onClick={toggleMinimize}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 relative"
          data-testid="button-checklist-expand"
        >
          <ListChecks className="h-6 w-6 text-white" />
          {completedCount < checklistItems.length && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {checklistItems.length - completedCount}
            </span>
          )}
          {allDone && (
            <span className="absolute -top-1 -right-1">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]" data-tour="floating-checklist">
      <Card className="shadow-xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
        {/* Header */}
        <div 
          className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-checklist-toggle"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Wedding Checklist</h3>
              <p className="text-white/80 text-xs">
                {allDone ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> All done! You're amazing!
                  </span>
                ) : (
                  `${completedCount} of ${checklistItems.length} complete`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              data-testid="button-checklist-minimize"
            >
              <X className="h-4 w-4" />
            </Button>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-white" />
            ) : (
              <ChevronUp className="h-5 w-5 text-white" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Progress 
              value={progressPercent} 
              className="h-2 flex-1"
            />
            <span className="text-xs font-bold text-orange-600 min-w-[3rem] text-right">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Checklist items */}
        {isOpen && (
          <div className="max-h-80 overflow-y-auto">
            {checklistItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.link}
                  className={`
                    flex items-center gap-3 p-3 border-b border-border/50 last:border-b-0
                    transition-colors hover-elevate cursor-pointer
                    ${item.done ? "bg-green-50/50" : "hover:bg-orange-50/50"}
                  `}
                  data-testid={`checklist-item-${item.id}`}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${item.done 
                      ? "bg-green-100 text-green-600" 
                      : "bg-orange-100 text-orange-600"
                    }
                  `}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium
                      ${item.done ? "text-green-700 line-through" : "text-foreground"}
                    `}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-orange-300 shrink-0" />
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* Celebration message when all done */}
        {allDone && isOpen && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-medium">
                You've completed all the basics! Your wedding planning is off to a great start.
              </p>
            </div>
          </div>
        )}

        {/* Next step suggestion when not all done */}
        {!allDone && isOpen && (
          <div className="p-3 bg-orange-50/50 border-t border-orange-100">
            {(() => {
              const nextItem = checklistItems.find(item => !item.done);
              if (!nextItem) return null;
              return (
                <a
                  href={nextItem.link}
                  className="flex items-center gap-2 text-orange-700 hover:text-orange-800 transition-colors"
                  data-testid="link-checklist-next-action"
                >
                  <span className="text-xs font-medium">Next:</span>
                  <span className="text-xs">{nextItem.label}</span>
                  <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                </a>
              );
            })()}
          </div>
        )}
      </Card>
    </div>
  );
}
