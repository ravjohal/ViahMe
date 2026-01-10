import { useQuery } from "@tanstack/react-query";
import type { WeddingTradition, WeddingSubTradition } from "@shared/schema";

export function useTraditions(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false;
  const queryKey = includeInactive 
    ? ["/api/traditions", "includeInactive=true"]
    : ["/api/traditions"];
  
  return useQuery<WeddingTradition[]>({
    queryKey,
    queryFn: async () => {
      const url = includeInactive 
        ? "/api/traditions?includeInactive=true"
        : "/api/traditions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch traditions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubTraditions(traditionId?: string) {
  return useQuery<WeddingSubTradition[]>({
    queryKey: ["/api/traditions", traditionId, "sub-traditions"],
    queryFn: async () => {
      if (!traditionId) return [];
      const res = await fetch(`/api/traditions/${traditionId}/sub-traditions`);
      if (!res.ok) throw new Error("Failed to fetch sub-traditions");
      return res.json();
    },
    enabled: !!traditionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllSubTraditions(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false;
  
  return useQuery<WeddingSubTradition[]>({
    queryKey: ["/api/traditions/sub-traditions/all", includeInactive],
    queryFn: async () => {
      const url = includeInactive 
        ? "/api/traditions/sub-traditions/all?includeInactive=true"
        : "/api/traditions/sub-traditions/all";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch all sub-traditions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTraditionLookup() {
  const { data: traditions = [] } = useTraditions();
  const { data: allSubTraditions = [] } = useAllSubTraditions();
  
  const traditionById = new Map<string, WeddingTradition>();
  traditions.forEach(t => traditionById.set(t.id, t));
  
  const subTraditionById = new Map<string, WeddingSubTradition>();
  allSubTraditions.forEach(st => subTraditionById.set(st.id, st));
  
  const subTraditionsByTradition = new Map<string, WeddingSubTradition[]>();
  allSubTraditions.forEach(st => {
    const existing = subTraditionsByTradition.get(st.traditionId) || [];
    existing.push(st);
    subTraditionsByTradition.set(st.traditionId, existing);
  });
  
  const getTraditionLabel = (id: string): string => {
    return traditionById.get(id)?.displayName || id;
  };
  
  const getSubTraditionLabel = (id: string): string => {
    return subTraditionById.get(id)?.displayName || id;
  };
  
  const getSubTraditionsForTradition = (traditionId: string): WeddingSubTradition[] => {
    return subTraditionsByTradition.get(traditionId) || [];
  };
  
  const allTraditionIds = traditions.map(t => t.id);
  
  return {
    traditions,
    allSubTraditions,
    traditionById,
    subTraditionById,
    getTraditionLabel,
    getSubTraditionLabel,
    getSubTraditionsForTradition,
    allTraditionIds,
  };
}
