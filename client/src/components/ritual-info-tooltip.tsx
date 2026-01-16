import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
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
  side = "right",
  "data-testid": testId,
}: RitualInfoTooltipProps) {
  const { data: rituals = [], isLoading } = useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/ceremony-type", ceremonyTypeId],
    enabled: !!ceremonyTypeId,
  });

  if (isLoading || !rituals.length) {
    return children ? <>{children}</> : null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
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
        )}
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="max-w-sm p-4 space-y-3"
        data-testid="ritual-info-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-foreground mb-2">
          Associated Rituals
        </div>
        <div className="space-y-2">
          {rituals.slice(0, 5).map((ritual) => (
            <div key={ritual.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{ritual.name}</span>
                {ritual.nameInLanguage && (
                  <span className="text-xs text-muted-foreground">
                    ({ritual.nameInLanguage})
                  </span>
                )}
              </div>
              {ritual.shortDescription && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {ritual.shortDescription}
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
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
              </div>
            </div>
          ))}
          {rituals.length > 5 && (
            <p className="text-xs text-muted-foreground italic">
              +{rituals.length - 5} more rituals
            </p>
          )}
        </div>
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
