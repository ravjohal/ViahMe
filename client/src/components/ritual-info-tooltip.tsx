import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { TraditionRitual } from "@shared/schema";

interface RitualInfoTooltipProps {
  ceremonyTypeId: string;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function RitualInfoTooltip({ 
  ceremonyTypeId, 
  children,
  side = "right",
}: RitualInfoTooltipProps) {
  const { data: rituals = [], isLoading } = useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/ceremony-type", ceremonyTypeId],
    enabled: !!ceremonyTypeId,
  });

  if (isLoading || !rituals.length) {
    return children ? <>{children}</> : null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || (
          <Button 
            type="button" 
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            data-testid="ritual-info-trigger"
          >
            <Info className="w-4 h-4" />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className="max-w-sm p-4 space-y-3"
        data-testid="ritual-info-content"
      >
        <div className="text-sm font-medium text-foreground mb-2">
          Associated Rituals
        </div>
        <div className="space-y-2">
          {rituals.slice(0, 5).map((ritual) => (
            <div key={ritual.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{ritual.name}</span>
                {ritual.hindiName && (
                  <span className="text-xs text-muted-foreground">
                    ({ritual.hindiName})
                  </span>
                )}
              </div>
              {ritual.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {ritual.description}
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
                {ritual.duration && (
                  <Badge variant="outline" className="text-xs">
                    {ritual.duration}
                  </Badge>
                )}
                {ritual.significance && (
                  <Badge variant="secondary" className="text-xs">
                    {ritual.significance}
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
      </TooltipContent>
    </Tooltip>
  );
}

export function useRitualsByCeremonyType(ceremonyTypeId: string | undefined) {
  return useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/ceremony-type", ceremonyTypeId],
    enabled: !!ceremonyTypeId,
  });
}
