import { useQuery } from "@tanstack/react-query";
import type { CeremonyType, RegionalPricing, CeremonyBudgetCategoryItem, CeremonyBudgetCategory } from "@shared/schema";

type CeremonyTypeItem = CeremonyBudgetCategory;

export function useCeremonyTypes() {
  return useQuery<CeremonyType[]>({
    queryKey: ['/api/ceremony-types'],
    queryFn: async () => {
      const response = await fetch('/api/ceremony-types');
      if (!response.ok) throw new Error('Failed to fetch ceremony types');
      return response.json();
    },
  });
}

export function useCeremonyTypesByTradition(tradition: string) {
  return useQuery<CeremonyType[]>({
    queryKey: ['/api/ceremony-types', 'tradition', tradition],
    queryFn: async () => {
      const response = await fetch(`/api/ceremony-types/tradition/${tradition}`);
      if (!response.ok) throw new Error('Failed to fetch ceremony types');
      return response.json();
    },
    enabled: !!tradition,
  });
}

export function useCeremonyType(ceremonyId: string) {
  return useQuery<CeremonyType>({
    queryKey: ['/api/ceremony-types', ceremonyId],
    queryFn: async () => {
      const response = await fetch(`/api/ceremony-types/${ceremonyId}`);
      if (!response.ok) throw new Error('Failed to fetch ceremony type');
      return response.json();
    },
    enabled: !!ceremonyId,
  });
}

export function useRegionalPricing() {
  return useQuery<RegionalPricing[]>({
    queryKey: ['/api/regional-pricing'],
    queryFn: async () => {
      const response = await fetch('/api/regional-pricing');
      if (!response.ok) throw new Error('Failed to fetch regional pricing');
      return response.json();
    },
  });
}

export function useRegionalPricingByCity(city: string) {
  return useQuery<RegionalPricing>({
    queryKey: ['/api/regional-pricing', city],
    queryFn: async () => {
      const response = await fetch(`/api/regional-pricing/${city}`);
      if (!response.ok) throw new Error('Failed to fetch regional pricing');
      return response.json();
    },
    enabled: !!city,
  });
}

export interface CeremonyEstimateRequest {
  tradition: string;
  ceremonyId: string;
  guestCount: number;
  city?: string;
}

export interface CeremonyEstimateResponse {
  ceremonyId: string;
  ceremonyName: string;
  tradition: string;
  guestCount: number;
  city: string;
  multiplier: number;
  totalLow: number;
  totalHigh: number;
  costPerGuestLow: number;
  costPerGuestHigh: number;
  breakdown: Array<{
    category: string;
    lowCost: number;
    highCost: number;
    notes?: string;
    budgetBucket?: string;
  }>;
}

// Line item type from the ceremony_budget_categories junction table (API response)
export interface CeremonyBudgetCategoryApiItem {
  id: string;
  name: string;
  budgetBucketId: string; // FK to budget_bucket_categories.id
  lowCost: number;
  highCost: number;
  unit: 'fixed' | 'per_person' | 'per_hour';
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
}

// Backward compatibility alias
export type CeremonyTypeLineItem = CeremonyBudgetCategoryApiItem;

export interface CeremonyBudgetCategoriesResponse {
  ceremonyId: string;
  ceremonyName: string;
  tradition: string;
  lineItems: CeremonyBudgetCategoryApiItem[];
}

// Backward compatibility alias
export type CeremonyLineItemsResponse = CeremonyBudgetCategoriesResponse;

// Hook to fetch ceremony budget categories for a specific ceremony type
export function useCeremonyBudgetCategories(ceremonyId: string | null | undefined) {
  return useQuery<CeremonyBudgetCategoriesResponse>({
    queryKey: ['/api/ceremony-types', ceremonyId, 'line-items'],
    queryFn: async () => {
      const response = await fetch(`/api/ceremony-types/${ceremonyId}/line-items`);
      if (!response.ok) throw new Error('Failed to fetch ceremony budget categories');
      return response.json();
    },
    enabled: !!ceremonyId,
  });
}

// Backward compatibility alias
export const useCeremonyTypeLineItems = useCeremonyBudgetCategories;

export async function getCeremonyEstimate(request: CeremonyEstimateRequest): Promise<CeremonyEstimateResponse> {
  const response = await fetch('/api/ceremony-estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to calculate ceremony estimate');
  return response.json();
}

export function getCostBreakdownFromType(template: CeremonyType): CeremonyBudgetCategoryItem[] {
  if (!template.costBreakdown) return [];
  if (Array.isArray(template.costBreakdown)) {
    return template.costBreakdown as CeremonyBudgetCategoryItem[];
  }
  return [];
}

export function calculateCeremonyTotal(
  template: CeremonyType,
  guestCount: number,
  multiplier: number = 1.0
): { low: number; high: number } {
  const breakdown = getCostBreakdownFromType(template);
  let totalLow = 0;
  let totalHigh = 0;

  for (const item of breakdown) {
    let itemLow = item.lowCost;
    let itemHigh = item.highCost;

    if (item.unit === 'per_person') {
      itemLow *= guestCount;
      itemHigh *= guestCount;
    } else if (item.unit === 'per_hour') {
      const hoursLow = item.hoursLow || 1;
      const hoursHigh = item.hoursHigh || hoursLow;
      itemLow *= hoursLow;
      itemHigh *= hoursHigh;
    }

    itemLow *= multiplier;
    itemHigh *= multiplier;

    totalLow += itemLow;
    totalHigh += itemHigh;
  }

  return { low: Math.round(totalLow), high: Math.round(totalHigh) };
}

// Build a lookup map from ceremonyId to type
export function buildCeremonyTypeMap(
  types: CeremonyType[] | undefined
): Record<string, CeremonyType> {
  if (!types) return {};
  const map: Record<string, CeremonyType> = {};
  for (const type of types) {
    map[type.ceremonyId] = type;
  }
  return map;
}

// Build a lookup map from ceremonyId to costBreakdown array
// DEPRECATED: Use useAllCeremonyLineItems hook instead for normalized data
export function buildCeremonyBreakdownMap(
  types: CeremonyType[] | undefined
): Record<string, CeremonyBudgetCategoryItem[]> {
  if (!types) return {};
  const map: Record<string, CeremonyBudgetCategoryItem[]> = {};
  for (const type of types) {
    map[type.ceremonyId] = getCostBreakdownFromType(type);
  }
  return map;
}

// Hook to fetch all ceremony line items from the normalized ceremony_type_items table
// Returns a map of ceremonyId -> CeremonyBudgetCategoryItem[]
export function useAllCeremonyLineItems() {
  return useQuery<Record<string, CeremonyBudgetCategoryItem[]>>({
    queryKey: ['/api/ceremony-types/all/line-items'],
    queryFn: async () => {
      const response = await fetch('/api/ceremony-types/all/line-items');
      if (!response.ok) throw new Error('Failed to fetch all ceremony line items');
      return response.json();
    },
  });
}

// Calculate ceremony total from a breakdown array (works with breakdown map values)
export function calculateCeremonyTotalFromBreakdown(
  breakdown: CeremonyBudgetCategoryItem[] | undefined,
  guestCount: number,
  multiplier: number = 1.0
): { low: number; high: number } {
  if (!breakdown || breakdown.length === 0) {
    return { low: 0, high: 0 };
  }

  let totalLow = 0;
  let totalHigh = 0;

  for (const item of breakdown) {
    let itemLow = item.lowCost;
    let itemHigh = item.highCost;

    if (item.unit === 'per_person') {
      itemLow *= guestCount;
      itemHigh *= guestCount;
    } else if (item.unit === 'per_hour') {
      const hoursLow = item.hoursLow || 1;
      const hoursHigh = item.hoursHigh || hoursLow;
      itemLow *= hoursLow;
      itemHigh *= hoursHigh;
    }

    itemLow *= multiplier;
    itemHigh *= multiplier;

    totalLow += itemLow;
    totalHigh += itemHigh;
  }

  return { low: Math.round(totalLow), high: Math.round(totalHigh) };
}

// Get budget bucket label from a line item (uses budgetBucket from type data)
export function getLineItemBucketLabel(item: CeremonyBudgetCategoryItem): string {
  const bucketLabels: Record<string, string> = {
    venue: "Venue",
    catering: "Catering",
    photography: "Photography",
    videography: "Videography",
    decoration: "Decoration",
    entertainment: "Entertainment",
    attire: "Attire & Beauty",
    religious: "Religious & Ceremonial",
    stationery: "Stationery & Gifts",
    transportation: "Transportation",
    favors: "Favors",
    other: "Other",
  };
  return bucketLabels[item.budgetBucket || "other"] || "Other";
}
