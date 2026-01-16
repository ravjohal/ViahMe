import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, X, Clock, Users, Camera, Music, ShoppingBag, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TraditionRitual } from "@shared/schema";

interface RitualInfoTooltipProps {
  ceremonyTypeId: string;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  "data-testid"?: string;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${mins ? ` ${mins} min` : ''}`;
  }
  return `${minutes} minutes`;
}

function RitualDetailCard({ ritual }: { ritual: TraditionRitual }) {
  const timingCategory = (ritual.daysBeforeWedding ?? 0) < -1 
    ? "Pre-Wedding" 
    : (ritual.daysBeforeWedding ?? 0) > 1 
      ? "Post-Wedding" 
      : "Wedding Day";

  return (
    <div className="space-y-4 pb-4 border-b last:border-0 last:pb-0">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={timingCategory === "Wedding Day" ? "default" : "secondary"}>
            {timingCategory}
          </Badge>
          <span className="font-semibold text-base">{ritual.name}</span>
          {ritual.nameInLanguage && (
            <span className="text-sm text-muted-foreground">
              ({ritual.nameInLanguage})
            </span>
          )}
          {ritual.isRequired && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>
        {ritual.pronunciation && (
          <p className="text-sm text-muted-foreground italic">
            Pronounced: {ritual.pronunciation}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div>
          <p className="font-medium text-sm text-primary mb-1">What it is</p>
          <p className="text-sm">{ritual.shortDescription}</p>
        </div>

        {ritual.fullDescription && (
          <div>
            <p className="font-medium text-sm text-primary mb-1">Full Description</p>
            <p className="text-sm text-muted-foreground">{ritual.fullDescription}</p>
          </div>
        )}

        {ritual.culturalSignificance && (
          <div>
            <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Cultural Significance
            </p>
            <p className="text-sm text-muted-foreground">{ritual.culturalSignificance}</p>
          </div>
        )}

        {ritual.spiritualMeaning && (
          <div>
            <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> Spiritual Meaning
            </p>
            <p className="text-sm text-muted-foreground">{ritual.spiritualMeaning}</p>
          </div>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 gap-3">
          {ritual.typicalTiming && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">When</p>
                <p className="text-sm text-muted-foreground">{ritual.typicalTiming}</p>
              </div>
            </div>
          )}

          {ritual.durationMinutes && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">{formatDuration(ritual.durationMinutes)}</p>
              </div>
            </div>
          )}

          {ritual.whoParticipates && (
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Who Participates</p>
                <p className="text-sm text-muted-foreground">{ritual.whoParticipates}</p>
              </div>
            </div>
          )}
        </div>

        {ritual.whatToExpect && (
          <div>
            <p className="font-medium text-sm text-primary mb-1">What to Expect</p>
            <p className="text-sm text-muted-foreground">{ritual.whatToExpect}</p>
          </div>
        )}

        {ritual.itemsNeeded && ritual.itemsNeeded.length > 0 && (
          <div>
            <p className="font-medium text-sm text-primary mb-2 flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" /> Items Needed
            </p>
            <div className="flex flex-wrap gap-2">
              {ritual.itemsNeeded.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
              ))}
            </div>
          </div>
        )}

        {ritual.photoOpportunities && (
          <div>
            <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
              <Camera className="w-4 h-4" /> Photo Opportunities
            </p>
            <p className="text-sm text-muted-foreground">{ritual.photoOpportunities}</p>
          </div>
        )}

        {ritual.musicSuggestions && (
          <div>
            <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
              <Music className="w-4 h-4" /> Music Suggestions
            </p>
            <p className="text-sm text-muted-foreground">{ritual.musicSuggestions}</p>
          </div>
        )}

        {ritual.modernVariations && (
          <div>
            <p className="font-medium text-sm text-primary mb-1">Modern Variations</p>
            <p className="text-sm text-muted-foreground">{ritual.modernVariations}</p>
          </div>
        )}

        {ritual.commonMisconceptions && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
            <p className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Common Misconceptions
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{ritual.commonMisconceptions}</p>
          </div>
        )}

        {ritual.couplesNote && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <p className="font-medium text-sm text-primary mb-1">Note for Couples</p>
            <p className="text-sm">{ritual.couplesNote}</p>
          </div>
        )}

        {ritual.historicalOrigin && (
          <div>
            <p className="font-medium text-sm text-muted-foreground mb-1">Historical Origin</p>
            <p className="text-sm text-muted-foreground">{ritual.historicalOrigin}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function RitualInfoTooltip({ 
  ceremonyTypeId, 
  children,
  side = "bottom",
  "data-testid": testId,
}: RitualInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { data: rituals = [], isLoading } = useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/ceremony-type", ceremonyTypeId],
    enabled: !!ceremonyTypeId,
  });

  if (isLoading || !rituals.length) {
    return children ? <>{children}</> : null;
  }

  const triggerButton = children || (
    <Button 
      type="button" 
      size="icon"
      variant="ghost"
      className="h-8 w-8 shrink-0"
      data-testid={testId || "ritual-info-trigger"}
      onClick={(e) => e.stopPropagation()}
    >
      <Info className="w-4 h-4" />
    </Button>
  );

  // Use Drawer on mobile for better UX
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent onClick={(e) => e.stopPropagation()}>
          <DrawerHeader className="flex items-center justify-between border-b pb-3">
            <DrawerTitle>Associated Rituals</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <ScrollArea className="px-4 py-4 max-h-[70vh]">
            <div className="space-y-6">
              {rituals.map((ritual) => (
                <RitualDetailCard key={ritual.id} ritual={ritual} />
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Use Popover on desktop
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent 
        side={side}
        align="center"
        avoidCollisions
        collisionPadding={12}
        className="w-96 max-w-[calc(100vw-2rem)] p-4"
        data-testid="ritual-info-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-foreground mb-3">
          Associated Rituals
        </div>
        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-6">
            {rituals.map((ritual) => (
              <RitualDetailCard key={ritual.id} ritual={ritual} />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function useRitualsByCeremonyType(ceremonyTypeId: string | undefined) {
  return useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/ceremony-type", ceremonyTypeId],
    enabled: !!ceremonyTypeId,
  });
}
