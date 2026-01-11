import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CeremonyType, RegionalPricing, CeremonyBudgetCategoryItem, CeremonyBudgetCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  weddingId?: string | null; // NULL = system template, string = custom for wedding
  isCustom?: boolean; // Convenience flag: true if wedding-specific
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
// weddingId: optional - when provided, includes wedding-specific custom items
export function useCeremonyBudgetCategories(ceremonyId: string | null | undefined, weddingId?: string) {
  return useQuery<CeremonyBudgetCategoriesResponse>({
    queryKey: ['/api/ceremony-types', ceremonyId, 'line-items', weddingId || null],
    queryFn: async () => {
      const url = weddingId 
        ? `/api/ceremony-types/${ceremonyId}/line-items?weddingId=${weddingId}`
        : `/api/ceremony-types/${ceremonyId}/line-items`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ceremony budget categories');
      return response.json();
    },
    enabled: !!ceremonyId,
  });
}

// Backward compatibility alias
export const useCeremonyTypeLineItems = useCeremonyBudgetCategories;

// Input type for creating a custom ceremony budget category
// Custom items use a single budget amount (stored as lowCost=highCost, unit='fixed')
// Can optionally include sourceCategoryId when importing from library (for tracking/deduplication)
export interface CreateCustomCeremonyItemInput {
  weddingId: string;
  ceremonyTypeId: string;
  itemName: string;
  budgetBucketId: string;
  amount?: string; // Optional - when empty and sourceCategoryId provided, inherits source's low/high range
  notes?: string;
  sourceCategoryId?: string; // Reference to library item if imported from library
}

// Input type for cloning a library item to a ceremony
// Clone inherits lowCost/highCost from source - no amount needed
export interface CloneLibraryItemInput {
  weddingId: string;
  ceremonyTypeId: string;
  sourceCategoryId: string; // ID of the library item to clone
  notes?: string;
}

// Library item type returned by /api/ceremony-types/library
export interface LibraryItem {
  id: string;
  itemName: string;
  budgetBucketId: string;
  lowCost: number;
  highCost: number;
  unit: string;
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
  ceremonies: Array<{
    ceremonyId: string;
    ceremonyName: string;
    tradition: string;
  }>;
}

export interface LibraryResponse {
  items: LibraryItem[];
  groupedByBucket: Record<string, LibraryItem[]>;
  totalCount: number;
}

// Hook to fetch the budget item library (all unique system items)
export function useBudgetItemLibrary() {
  return useQuery<LibraryResponse>({
    queryKey: ['/api/ceremony-types/library'],
    queryFn: async () => {
      const response = await fetch('/api/ceremony-types/library');
      if (!response.ok) throw new Error('Failed to fetch budget item library');
      return response.json();
    },
  });
}

// Hook for creating custom ceremony budget categories
export function useCreateCustomCeremonyItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCustomCeremonyItemInput) => {
      const response = await apiRequest('POST', `/api/ceremony-types/${data.ceremonyTypeId}/line-items`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the line items query for this ceremony type
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types', variables.ceremonyTypeId, 'line-items'] 
      });
    },
  });
}

// Hook for cloning a library item to a ceremony
export function useCloneLibraryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CloneLibraryItemInput) => {
      const response = await apiRequest('POST', `/api/ceremony-types/${data.ceremonyTypeId}/line-items`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the line items query for this ceremony type
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types', variables.ceremonyTypeId, 'line-items'] 
      });
      // Invalidate the all line items query (base key)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types/all/line-items'] 
      });
      // CRITICAL: Also invalidate the wedding-specific line items map used by budget page
      if (variables.weddingId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/ceremony-types/all/line-items', variables.weddingId] 
        });
      }
    },
  });
}

// Input type for deleting a custom ceremony budget category
export interface DeleteCeremonyItemInput {
  weddingId: string;
  ceremonyTypeId: string;
  itemId: string;
}

// Hook for deleting a custom ceremony budget category
export function useDeleteCeremonyItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DeleteCeremonyItemInput) => {
      const response = await apiRequest(
        'DELETE', 
        `/api/ceremony-types/${data.ceremonyTypeId}/line-items/${data.itemId}?weddingId=${data.weddingId}`
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the line items query for this ceremony type
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types', variables.ceremonyTypeId, 'line-items'] 
      });
      // Invalidate the all line items query (base key)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types/all/line-items'] 
      });
      // CRITICAL: Also invalidate the wedding-specific line items map used by budget page
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ceremony-types/all/line-items', variables.weddingId] 
      });
    },
  });
}

export async function getCeremonyEstimate(request: CeremonyEstimateRequest): Promise<CeremonyEstimateResponse> {
  const response = await fetch('/api/ceremony-estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to calculate ceremony estimate');
  return response.json();
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

// Hook to fetch ceremony line items for a specific ceremony INCLUDING wedding-specific custom items
// Returns array of line items with isCustom flag for custom items
export function useCeremonyLineItemsWithCustom(ceremonyId: string | null | undefined, weddingId: string | undefined) {
  return useQuery<CeremonyBudgetCategoryApiItem[]>({
    queryKey: ['/api/ceremony-types', ceremonyId, 'line-items', 'with-wedding', weddingId || null],
    queryFn: async () => {
      const url = weddingId 
        ? `/api/ceremony-types/${ceremonyId}/line-items?weddingId=${weddingId}`
        : `/api/ceremony-types/${ceremonyId}/line-items`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ceremony line items');
      const data = await response.json();
      return data.lineItems || [];
    },
    enabled: !!ceremonyId,
  });
}

// Hook to fetch ALL ceremony line items including wedding-specific custom items
// Returns a map of ceremonyTypeId -> CeremonyBudgetCategoryItem[] (with isCustom flag)
export function useWeddingCeremonyLineItemsMap(weddingId: string | undefined) {
  return useQuery<Record<string, CeremonyBudgetCategoryItem[]>>({
    queryKey: ['/api/ceremony-types/all/line-items', weddingId || null],
    queryFn: async () => {
      const url = weddingId 
        ? `/api/ceremony-types/all/line-items?weddingId=${weddingId}`
        : `/api/ceremony-types/all/line-items`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ceremony line items');
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
