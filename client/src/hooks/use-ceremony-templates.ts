import { useQuery } from "@tanstack/react-query";
import type { CeremonyTemplate, RegionalPricing, CeremonyTemplateCostItem } from "@shared/schema";

export function useCeremonyTemplates() {
  return useQuery<CeremonyTemplate[]>({
    queryKey: ['/api/ceremony-templates'],
    queryFn: async () => {
      const response = await fetch('/api/ceremony-templates');
      if (!response.ok) throw new Error('Failed to fetch ceremony templates');
      return response.json();
    },
  });
}

export function useCeremonyTemplatesByTradition(tradition: string) {
  return useQuery<CeremonyTemplate[]>({
    queryKey: ['/api/ceremony-templates', 'tradition', tradition],
    queryFn: async () => {
      const response = await fetch(`/api/ceremony-templates/tradition/${tradition}`);
      if (!response.ok) throw new Error('Failed to fetch ceremony templates');
      return response.json();
    },
    enabled: !!tradition,
  });
}

export function useCeremonyTemplate(ceremonyId: string) {
  return useQuery<CeremonyTemplate>({
    queryKey: ['/api/ceremony-templates', ceremonyId],
    queryFn: async () => {
      const response = await fetch(`/api/ceremony-templates/${ceremonyId}`);
      if (!response.ok) throw new Error('Failed to fetch ceremony template');
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
  }>;
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

export function getCostBreakdownFromTemplate(template: CeremonyTemplate): CeremonyTemplateCostItem[] {
  if (!template.costBreakdown) return [];
  if (Array.isArray(template.costBreakdown)) {
    return template.costBreakdown as CeremonyTemplateCostItem[];
  }
  return [];
}

export function calculateCeremonyTotal(
  template: CeremonyTemplate,
  guestCount: number,
  multiplier: number = 1.0
): { low: number; high: number } {
  const breakdown = getCostBreakdownFromTemplate(template);
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

// Build a lookup map from ceremonyId to template
export function buildCeremonyTemplateMap(
  templates: CeremonyTemplate[] | undefined
): Record<string, CeremonyTemplate> {
  if (!templates) return {};
  const map: Record<string, CeremonyTemplate> = {};
  for (const template of templates) {
    map[template.ceremonyId] = template;
  }
  return map;
}

// Build a lookup map from ceremonyId to costBreakdown array
export function buildCeremonyBreakdownMap(
  templates: CeremonyTemplate[] | undefined
): Record<string, CeremonyTemplateCostItem[]> {
  if (!templates) return {};
  const map: Record<string, CeremonyTemplateCostItem[]> = {};
  for (const template of templates) {
    map[template.ceremonyId] = getCostBreakdownFromTemplate(template);
  }
  return map;
}

// Calculate ceremony total from a breakdown array (works with breakdown map values)
export function calculateCeremonyTotalFromBreakdown(
  breakdown: CeremonyTemplateCostItem[] | undefined,
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

// Get budget bucket label from a line item (uses budgetBucket from template data)
export function getLineItemBucketLabel(item: CeremonyTemplateCostItem): string {
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
