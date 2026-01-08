export const VENUE_CLASSES = ["home", "community_hall", "hotel_ballroom"] as const;
export type VenueClass = typeof VENUE_CLASSES[number];

export const VENUE_CLASS_LABELS: Record<VenueClass, string> = {
  home: "Home / Backyard",
  community_hall: "Community Hall / Temple",
  hotel_ballroom: "Hotel Ballroom / Banquet",
};

export const VENDOR_TIERS = ["budget", "standard", "premium"] as const;
export type VendorTier = typeof VENDOR_TIERS[number];

export const VENDOR_TIER_LABELS: Record<VendorTier, string> = {
  budget: "Budget-Friendly",
  standard: "Standard",
  premium: "Premium / Luxury",
};

export const GUEST_BRACKETS = ["under_100", "100_200", "200_300", "over_300"] as const;
export type GuestBracket = typeof GUEST_BRACKETS[number];

export const GUEST_BRACKET_LABELS: Record<GuestBracket, string> = {
  under_100: "Under 100 guests",
  "100_200": "100-200 guests",
  "200_300": "200-300 guests",
  over_300: "300+ guests",
};

export const VENUE_CLASS_MULTIPLIERS: Record<VenueClass, number> = {
  home: 0.6,
  community_hall: 0.85,
  hotel_ballroom: 1.0,
};

export const VENDOR_TIER_MULTIPLIERS: Record<VendorTier, number> = {
  budget: 0.65,
  standard: 0.85,
  premium: 1.0,
};

export const GUEST_BRACKET_MULTIPLIERS: Record<GuestBracket, number> = {
  under_100: 0.9,
  "100_200": 0.95,
  "200_300": 1.0,
  over_300: 1.05,
};

export function getGuestBracket(guestCount: number): GuestBracket {
  if (guestCount < 100) return "under_100";
  if (guestCount < 200) return "100_200";
  if (guestCount < 300) return "200_300";
  return "over_300";
}

export interface PricingContext {
  venueClass: VenueClass;
  vendorTier: VendorTier;
  guestCount: number;
  city?: string;
}

export const CITY_MULTIPLIERS: Record<string, number> = {
  bay_area: 1.5,
  nyc: 1.4,
  la: 1.3,
  chicago: 1.2,
  seattle: 1.1,
  other: 1.0,
};

export function calculatePricingMultiplier(context: PricingContext): number {
  const venueMultiplier = VENUE_CLASS_MULTIPLIERS[context.venueClass];
  const vendorMultiplier = VENDOR_TIER_MULTIPLIERS[context.vendorTier];
  const guestBracket = getGuestBracket(context.guestCount);
  const guestMultiplier = GUEST_BRACKET_MULTIPLIERS[guestBracket];
  const cityMultiplier = context.city ? (CITY_MULTIPLIERS[context.city] || 1.0) : 1.0;
  
  return venueMultiplier * vendorMultiplier * guestMultiplier * cityMultiplier;
}

export function calculateRefinedCostRange(
  baseLow: number,
  baseHigh: number,
  context: PricingContext
): { low: number; high: number; single: number } {
  const multiplier = calculatePricingMultiplier(context);
  
  const refinedLow = Math.round(baseLow * multiplier);
  const refinedHigh = Math.round(baseHigh * multiplier);
  const single = Math.round((refinedLow + refinedHigh) / 2);
  
  return { low: refinedLow, high: refinedHigh, single };
}

export const DEFAULT_PRICING_CONTEXT: PricingContext = {
  venueClass: "community_hall",
  vendorTier: "standard",
  guestCount: 150,
};

// Calculate estimate for a single line item using the same logic as budget estimator
export interface LineItemCost {
  category: string;
  lowCost: number;
  highCost: number;
  unit?: "fixed" | "per_person" | "per_hour";
  hoursLow?: number;
  hoursHigh?: number;
}

export function calculateLineItemEstimate(
  item: LineItemCost,
  guestCount: number,
  context: PricingContext
): { low: number; high: number } {
  const multiplier = calculatePricingMultiplier(context);
  
  if (item.unit === "per_person") {
    return {
      low: Math.round(item.lowCost * guestCount * multiplier),
      high: Math.round(item.highCost * guestCount * multiplier),
    };
  } else if (item.unit === "per_hour") {
    const hoursLow = item.hoursLow ?? 3;
    const hoursHigh = item.hoursHigh ?? 4;
    return {
      low: Math.round(item.lowCost * hoursLow * multiplier),
      high: Math.round(item.highCost * hoursHigh * multiplier),
    };
  }
  
  return {
    low: Math.round(item.lowCost * multiplier),
    high: Math.round(item.highCost * multiplier),
  };
}
