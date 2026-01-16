import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, X } from "lucide-react";
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

  const ritualContent = (
    <div className="space-y-3">
      {rituals.slice(0, 5).map((ritual) => (
        <div key={ritual.id} className="space-y-1.5 pb-3 border-b last:border-0 last:pb-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="font-medium text-sm">{ritual.name}</span>
            {ritual.nameInLanguage && (
              <span className="text-xs text-muted-foreground">
                ({ritual.nameInLanguage})
              </span>
            )}
          </div>
          {ritual.shortDescription && (
            <p className="text-sm text-muted-foreground">
              {ritual.shortDescription}
            </p>
          )}
          {ritual.culturalSignificance && (
            <p className="text-xs text-muted-foreground italic">
              {ritual.culturalSignificance}
            </p>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {ritual.estimatedDuration && (
              <Badge variant="outline" className="text-xs">
                {ritual.estimatedDuration}
              </Badge>
            )}
            {ritual.isEssential && (
              <Badge variant="secondary" className="text-xs">
                Essential
              </Badge>
            )}
            {ritual.timing && (
              <Badge variant="outline" className="text-xs">
                {ritual.timing}
              </Badge>
            )}
          </div>
        </div>
      ))}
      {rituals.length > 5 && (
        <p className="text-xs text-muted-foreground italic text-center">
          +{rituals.length - 5} more rituals
        </p>
      )}
    </div>
  );

  // Use Drawer on mobile for better UX
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent onClick={(e) => e.stopPropagation()}>
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Associated Rituals</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[60vh]">
            {ritualContent}
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
        className="w-80 max-w-[calc(100vw-2rem)] p-4"
        data-testid="ritual-info-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-foreground mb-3">
          Associated Rituals
        </div>
        <ScrollArea className="max-h-[300px]">
          {ritualContent}
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
