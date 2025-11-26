import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Heart, 
  Calendar, 
  DollarSign, 
  Users, 
  Briefcase, 
  Globe,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  PartyPopper,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: any;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='events-card']",
    title: "Plan Your Events",
    description: "South Asian weddings have multiple ceremonies. Add your Mehndi, Sangeet, Wedding day, and Reception here. We'll help you manage each one!",
    icon: Calendar,
    position: "bottom",
  },
  {
    target: "[data-tour='vendors-card']",
    title: "Find Perfect Vendors",
    description: "Discover culturally-specialized vendors for your celebration - from caterers who know your cuisine to photographers who capture every ritual.",
    icon: Briefcase,
    position: "bottom",
  },
  {
    target: "[data-tour='budget-card']",
    title: "Track Your Budget",
    description: "Get smart budget recommendations based on your tradition and location. We'll help you allocate funds wisely across all your events.",
    icon: DollarSign,
    position: "bottom",
  },
  {
    target: "[data-tour='guests-card']",
    title: "Manage Guest Lists",
    description: "Handle complex guest lists with ease! Track RSVPs across multiple events, manage households, and send beautiful invitations.",
    icon: Users,
    position: "bottom",
  },
  {
    target: "[data-tour='floating-checklist']",
    title: "Your Planning Checklist",
    description: "This handy checklist tracks your progress across all major milestones. It's always here to guide you on what to do next!",
    icon: CheckCircle2,
    position: "left",
  },
];

const WELCOME_MILESTONES = [
  { icon: Calendar, label: "Set your wedding date", color: "text-orange-500" },
  { icon: Sparkles, label: "Add your ceremonies & events", color: "text-pink-500" },
  { icon: DollarSign, label: "Plan your budget", color: "text-emerald-500" },
  { icon: Users, label: "Build your guest list", color: "text-blue-500" },
  { icon: Briefcase, label: "Book amazing vendors", color: "text-purple-500" },
  { icon: Globe, label: "Create your wedding website", color: "text-cyan-500" },
];

interface WelcomeTourProps {
  weddingTradition?: string;
}

export function WelcomeTour({ weddingTradition = "wedding" }: WelcomeTourProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("viah_tour_completed");
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const findAndUpdateTarget = useCallback(() => {
    if (!showTour) {
      setIsReady(false);
      return;
    }
    
    const step = TOUR_STEPS[currentStep];
    if (!step) {
      setIsReady(false);
      return;
    }

    const target = document.querySelector(step.target);
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        setIsReady(true);
      } else {
        setTargetRect(null);
        setIsReady(false);
      }
    } else {
      setTargetRect(null);
      setIsReady(false);
    }
  }, [showTour, currentStep]);

  useEffect(() => {
    if (!showTour) return;

    const checkForTarget = () => {
      findAndUpdateTarget();
    };

    checkForTarget();
    const interval = setInterval(checkForTarget, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 3000);

    window.addEventListener("resize", findAndUpdateTarget);
    window.addEventListener("scroll", findAndUpdateTarget);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("resize", findAndUpdateTarget);
      window.removeEventListener("scroll", findAndUpdateTarget);
    };
  }, [showTour, currentStep, findAndUpdateTarget]);

  const startTour = () => {
    setShowWelcome(false);
    setCurrentStep(0);
    setIsReady(false);
    setTimeout(() => {
      setShowTour(true);
    }, 300);
  };

  const skipTour = () => {
    setShowWelcome(false);
    localStorage.setItem("viah_tour_completed", "true");
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsReady(false);
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsReady(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setShowTour(false);
    setIsReady(false);
    localStorage.setItem("viah_tour_completed", "true");
  };

  const getTooltipPosition = () => {
    if (!targetRect) return { top: 100, left: 100 };
    
    const step = TOUR_STEPS[currentStep];
    const padding = 16;
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const tooltipHeight = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "bottom":
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        if (top + tooltipHeight > viewportHeight - padding) {
          top = targetRect.top - tooltipHeight - padding;
        }
        break;
      case "top":
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        if (top < padding) {
          top = targetRect.bottom + padding;
        }
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        if (left < padding) {
          left = targetRect.right + padding;
        }
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        if (left + tooltipWidth > viewportWidth - padding) {
          left = targetRect.left - tooltipWidth - padding;
        }
        break;
    }

    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

    return { top, left, width: tooltipWidth };
  };

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step?.icon;
  const tooltipPos = getTooltipPosition();

  return (
    <>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-lg overflow-hidden" data-testid="dialog-welcome">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20" />
          <div className="relative">
            <DialogHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <PartyPopper className="absolute -top-2 -right-2 w-8 h-8 text-orange-500 animate-bounce" />
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Welcome to Viah.me!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Congratulations on your upcoming {weddingTradition} celebration! We're honored to help you plan every beautiful moment.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                Here's what you can accomplish with Viah.me:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WELCOME_MILESTONES.map((milestone, index) => {
                  const Icon = milestone.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border"
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", milestone.color)} />
                      <span className="text-xs font-medium">{milestone.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={skipTour}
                className="sm:flex-1"
                data-testid="button-skip-tour"
              >
                I'll explore on my own
              </Button>
              <Button
                onClick={startTour}
                className="sm:flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                data-testid="button-start-tour"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Take a Quick Tour
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {showTour && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          
          {targetRect && isReady && (
            <div
              className="fixed z-[9999] rounded-lg ring-4 ring-orange-500 ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              }}
            />
          )}

          {isReady && (
            <div
              className="fixed z-[10000] bg-background rounded-xl shadow-2xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden transition-all duration-300"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: tooltipPos.width || 320,
              }}
              data-testid="tour-tooltip"
            >
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {StepIcon && <StepIcon className="w-5 h-5 text-white" />}
                  <span className="text-white font-semibold text-sm">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={completeTour}
                  data-testid="button-close-tour"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="px-4 pb-4 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="gap-1"
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentStep 
                          ? "bg-orange-500" 
                          : index < currentStep 
                            ? "bg-orange-300" 
                            : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={nextStep}
                  className="gap-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  data-testid="button-tour-next"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {!isReady && (
            <div 
              className="fixed z-[10000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-2xl border-2 border-orange-200 dark:border-orange-800 p-6 text-center"
              style={{ width: Math.min(320, window.innerWidth - 32) }}
            >
              <div className="animate-pulse mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Loading tour step...</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={completeTour}
                data-testid="button-skip-loading"
              >
                Skip Tour
              </Button>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}

export function resetTour() {
  localStorage.removeItem("viah_tour_completed");
}
