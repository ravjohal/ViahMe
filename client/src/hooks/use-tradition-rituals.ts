import { useQuery } from "@tanstack/react-query";
import type { TraditionRitual, WeddingTradition } from "@shared/schema";

export function useTraditionRituals() {
  return useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals"],
  });
}

export function useTraditionRitualsByTradition(traditionSlug: string | undefined) {
  return useQuery<TraditionRitual[]>({
    queryKey: ["/api/tradition-rituals/tradition", traditionSlug],
    enabled: !!traditionSlug,
  });
}

export function useWeddingTraditions() {
  return useQuery<WeddingTradition[]>({
    queryKey: ["/api/wedding-traditions"],
  });
}

export function groupRitualsByTiming(rituals: TraditionRitual[]) {
  const groups: { [key: string]: TraditionRitual[] } = {
    "pre-wedding": [],
    "wedding-day": [],
    "post-wedding": [],
  };

  for (const ritual of rituals) {
    const days = ritual.daysBeforeWedding ?? 0;
    if (days < -1) {
      groups["pre-wedding"].push(ritual);
    } else if (days > 1) {
      groups["post-wedding"].push(ritual);
    } else {
      groups["wedding-day"].push(ritual);
    }
  }

  Object.values(groups).forEach(group => 
    group.sort((a, b) => (b.daysBeforeWedding ?? 0) - (a.daysBeforeWedding ?? 0))
  );

  return groups;
}

export const TIMING_LABELS: Record<string, string> = {
  "pre-wedding": "Pre-Wedding",
  "wedding-day": "Wedding Day",
  "post-wedding": "Post-Wedding",
};
