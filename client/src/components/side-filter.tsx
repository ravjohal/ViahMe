import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Heart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type SideViewMode = "all" | "bride" | "groom";

interface SideFilterProps {
  value: SideViewMode;
  onChange: (value: SideViewMode) => void;
  brideName?: string;
  groomName?: string;
  counts?: {
    all: number;
    bride: number;
    groom: number;
  };
}

const SIDE_COLORS = {
  bride: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-400",
    badge: "bg-pink-500",
  },
  groom: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-400",
    badge: "bg-blue-500",
  },
  mutual: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-400",
    badge: "bg-amber-500",
  },
} as const;

export function SideFilter({ value, onChange, brideName, groomName, counts }: SideFilterProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(v) => v && onChange(v as SideViewMode)}
      className="border rounded-lg p-1 bg-muted/30"
    >
      <ToggleGroupItem 
        value="all" 
        className="gap-2 px-3 data-[state=on]:bg-background"
        data-testid="filter-side-all"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">All</span>
        {counts && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {counts.all}
          </Badge>
        )}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="bride" 
        className={`gap-2 px-3 data-[state=on]:${SIDE_COLORS.bride.bg}`}
        data-testid="filter-side-bride"
      >
        <Heart className="w-4 h-4 text-pink-500" />
        <span className="hidden sm:inline">{brideName || "Bride's Side"}</span>
        {counts && (
          <Badge className={`ml-1 h-5 px-1.5 text-xs ${SIDE_COLORS.bride.badge} text-white`}>
            {counts.bride}
          </Badge>
        )}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="groom" 
        className={`gap-2 px-3 data-[state=on]:${SIDE_COLORS.groom.bg}`}
        data-testid="filter-side-groom"
      >
        <Heart className="w-4 h-4 text-blue-500" />
        <span className="hidden sm:inline">{groomName || "Groom's Side"}</span>
        {counts && (
          <Badge className={`ml-1 h-5 px-1.5 text-xs ${SIDE_COLORS.groom.badge} text-white`}>
            {counts.groom}
          </Badge>
        )}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function SideBadge({ side }: { side: "bride" | "groom" | "mutual" }) {
  const colors = SIDE_COLORS[side];
  const label = side === "bride" ? "Bride" : side === "groom" ? "Groom" : "Both";
  
  return (
    <Badge 
      variant="outline" 
      className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}
      data-testid={`badge-side-${side}`}
    >
      {label}
    </Badge>
  );
}

export function VisibilityBadge({ visibility }: { visibility: "private" | "shared" }) {
  if (visibility === "shared") return null;
  
  return (
    <Badge 
      variant="outline" 
      className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 text-xs"
      data-testid="badge-private"
    >
      Private
    </Badge>
  );
}

export { SIDE_COLORS };
