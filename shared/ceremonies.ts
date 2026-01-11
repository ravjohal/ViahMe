import type { BudgetBucket } from "./schema";

export interface CostCategory {
  category: string;
  lowCost: number;
  highCost: number;
  unit: "fixed" | "per_hour" | "per_person";
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
  budgetBucket?: BudgetBucket;
}

export interface CeremonyDefinition {
  id: string;
  name: string;
  description: string;
  costPerGuestLow: number;
  costPerGuestHigh: number;
  defaultGuests: number;
  traditions: string[];
  costBreakdown?: CostCategory[]; // DEPRECATED: Use ceremony_budget_categories table instead
  defaultSide: 'mutual' | 'bride' | 'groom' | 'separate';
}

// Maps event names/types to ceremony IDs for matching events to templates
export const CEREMONY_MAPPINGS: Record<string, string[]> = {
  sikh_roka: ["roka", "sikh roka"],
  sikh_engagement: ["kurmai", "engagement", "sikh engagement"],
  sikh_sangeet: ["sangeet", "lady sangeet", "sikh sangeet"],
  sikh_mehndi: ["mehndi", "henna", "sikh mehndi"],
  sikh_maiyan: ["maiyan", "sikh maiyan"],
  sikh_chooda_kalire: ["chooda", "kalire", "chooda kalire", "chooda & kalire"],
  sikh_jaggo: ["jaggo", "sikh jaggo"],
  sikh_anand_karaj: ["anand karaj", "anand_karaj", "sikh wedding"],
  sikh_baraat: ["baraat", "sikh baraat"],
  sikh_milni: ["milni", "sikh milni"],
  sikh_reception: ["sikh reception"],
  hindu_mehndi: ["mehndi", "henna", "hindu mehndi"],
  hindu_sangeet: ["sangeet", "lady sangeet", "hindu sangeet"],
  hindu_haldi: ["haldi", "hindu haldi"],
  hindu_baraat: ["baraat", "hindu baraat"],
  hindu_wedding: ["hindu wedding", "wedding ceremony"],
  reception: ["reception"],
  muslim_nikah: ["nikah", "muslim nikah", "muslim wedding"],
  muslim_walima: ["walima", "muslim walima"],
  muslim_dholki: ["dholki", "muslim dholki"],
  gujarati_pithi: ["pithi", "gujarati pithi"],
  gujarati_garba: ["garba", "gujarati garba"],
  gujarati_wedding: ["gujarati wedding"],
  south_indian_muhurtham: ["muhurtham", "south indian muhurtham", "south indian wedding"],
  general_wedding: ["general wedding", "western wedding", "christian wedding", "civil ceremony"],
  rehearsal_dinner: ["rehearsal dinner", "rehearsal"],
  cocktail_hour: ["cocktail hour", "cocktail", "cocktails"],
};

// Helper to get ceremony ID from event name/type
export function getCeremonyIdFromEvent(eventName: string, eventType: string): string | null {
  const normalizedName = eventName.toLowerCase().trim();
  const normalizedType = eventType.toLowerCase().trim();
  
  for (const [ceremonyId, keywords] of Object.entries(CEREMONY_MAPPINGS)) {
    if (keywords.some(kw => normalizedName.includes(kw) || normalizedType.includes(kw))) {
      return ceremonyId;
    }
  }
  
  return null;
}

// Ceremony catalog for onboarding and ceremony selection
export const CEREMONY_CATALOG: CeremonyDefinition[] = [
  // Hindu ceremonies
  {
    id: "hindu_wedding",
    name: "Wedding Ceremony",
    description: "Main Hindu wedding ceremony with pheras around the sacred fire",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 200,
    traditions: ["hindu"],
    defaultSide: "mutual",
  },
  {
    id: "hindu_sangeet",
    name: "Sangeet",
    description: "Musical night with performances and dancing",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 150,
    traditions: ["hindu", "south_indian", "mixed"],
    defaultSide: "separate",
  },
  {
    id: "hindu_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony for the bride",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 100,
    traditions: ["hindu", "muslim", "gujarati", "south_indian", "mixed"],
    defaultSide: "separate",
  },
  {
    id: "hindu_haldi",
    name: "Haldi",
    description: "Turmeric application ceremony for bride and groom",
    costPerGuestLow: 30,
    costPerGuestHigh: 60,
    defaultGuests: 75,
    traditions: ["hindu"],
    defaultSide: "separate",
  },
  {
    id: "hindu_baraat",
    name: "Baraat",
    description: "Groom's procession with music and dancing",
    costPerGuestLow: 20,
    costPerGuestHigh: 40,
    defaultGuests: 100,
    traditions: ["hindu"],
    defaultSide: "groom",
  },
  {
    id: "reception",
    name: "Reception",
    description: "Post-wedding celebration with dinner and dancing",
    costPerGuestLow: 100,
    costPerGuestHigh: 200,
    defaultGuests: 300,
    traditions: ["hindu", "muslim", "gujarati", "south_indian", "mixed", "general"],
    defaultSide: "mutual",
  },

  // Sikh ceremonies (11 total)
  {
    id: "sikh_roka",
    name: "Roka",
    description: "Formal blessing and acceptance ceremony between families",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 50,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },
  {
    id: "sikh_engagement",
    name: "Engagement",
    description: "Formal engagement ceremony with ring exchange and celebrations",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 100,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },
  {
    id: "sikh_chunni_chadana",
    name: "Chunni Chadana",
    description: "Ceremony where groom's family presents chunni to the bride",
    costPerGuestLow: 35,
    costPerGuestHigh: 70,
    defaultGuests: 50,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },
  {
    id: "sikh_paath",
    name: "Paath (Akhand Paath / Sehaj Paath)",
    description: "Sacred prayer reading at Gurdwara or home",
    costPerGuestLow: 35,
    costPerGuestHigh: 70,
    defaultGuests: 75,
    traditions: ["sikh"],
    defaultSide: "separate",
  },
  {
    id: "sikh_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony",
    costPerGuestLow: 35,
    costPerGuestHigh: 75,
    defaultGuests: 80,
    traditions: ["sikh"],
    defaultSide: "separate",
  },
  {
    id: "sikh_bakra_party",
    name: "Bakra Party",
    description: "Groom's side pre-wedding celebration with meat feast",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 75,
    traditions: ["sikh"],
    defaultSide: "groom",
  },
  {
    id: "sikh_mayian",
    name: "Mayian (Choora / Vatna)",
    description: "Turmeric ceremony with choora (red bangles)",
    costPerGuestLow: 25,
    costPerGuestHigh: 50,
    defaultGuests: 50,
    traditions: ["sikh"],
    defaultSide: "separate",
  },
  {
    id: "sikh_sangeet",
    name: "Sangeet",
    description: "Musical night with performances and Bhangra dancing",
    costPerGuestLow: 75,
    costPerGuestHigh: 150,
    defaultGuests: 150,
    traditions: ["sikh"],
    defaultSide: "separate",
  },
  {
    id: "sikh_anand_karaj",
    name: "Anand Karaj",
    description: "Sikh wedding ceremony at the Gurdwara",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 250,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },
  {
    id: "sikh_reception",
    name: "Reception",
    description: "Post-wedding celebration with dinner and entertainment",
    costPerGuestLow: 100,
    costPerGuestHigh: 200,
    defaultGuests: 300,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },
  {
    id: "sikh_day_after",
    name: "Day After Visit",
    description: "Post-wedding family visit and brunch",
    costPerGuestLow: 30,
    costPerGuestHigh: 60,
    defaultGuests: 40,
    traditions: ["sikh"],
    defaultSide: "mutual",
  },

  // Muslim ceremonies
  {
    id: "muslim_nikah",
    name: "Nikah",
    description: "Islamic wedding ceremony",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 150,
    traditions: ["muslim"],
    defaultSide: "mutual",
  },
  {
    id: "muslim_walima",
    name: "Walima",
    description: "Wedding banquet hosted by the groom's family",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 250,
    traditions: ["muslim"],
    defaultSide: "groom",
  },
  {
    id: "muslim_dholki",
    name: "Dholki",
    description: "Pre-wedding music and dance celebration",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 80,
    traditions: ["muslim"],
    defaultSide: "separate",
  },

  // Gujarati ceremonies
  {
    id: "gujarati_pithi",
    name: "Pithi",
    description: "Turmeric ceremony for Gujarati weddings",
    costPerGuestLow: 30,
    costPerGuestHigh: 60,
    defaultGuests: 75,
    traditions: ["gujarati"],
    defaultSide: "separate",
  },
  {
    id: "gujarati_garba",
    name: "Garba",
    description: "Traditional Gujarati dance celebration",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 200,
    traditions: ["gujarati"],
    defaultSide: "mutual",
  },
  {
    id: "gujarati_wedding",
    name: "Wedding Ceremony",
    description: "Main Gujarati wedding ceremony",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 200,
    traditions: ["gujarati"],
    defaultSide: "mutual",
  },

  // South Indian ceremonies
  {
    id: "south_indian_muhurtham",
    name: "Muhurtham",
    description: "South Indian wedding ceremony",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 150,
    traditions: ["south_indian"],
    defaultSide: "mutual",
  },

  // General/Western ceremonies
  {
    id: "general_wedding",
    name: "Wedding Ceremony",
    description: "Main wedding ceremony",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 200,
    traditions: ["general", "mixed"],
    defaultSide: "mutual",
  },
  {
    id: "rehearsal_dinner",
    name: "Rehearsal Dinner",
    description: "Pre-wedding dinner for wedding party and close family",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 50,
    traditions: ["general", "mixed"],
    defaultSide: "groom",
  },
  {
    id: "cocktail_hour",
    name: "Cocktail Hour",
    description: "Pre-reception drinks and appetizers",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 150,
    traditions: ["general", "mixed", "hindu", "gujarati", "south_indian"],
    defaultSide: "mutual",
  },
];

export function getCeremoniesForTradition(tradition: string): CeremonyDefinition[] {
  return CEREMONY_CATALOG.filter(c => c.traditions.includes(tradition));
}

export function getCeremonyById(id: string): CeremonyDefinition | undefined {
  return CEREMONY_CATALOG.find(c => c.id === id);
}

export function getDefaultCeremoniesForTradition(tradition: string): string[] {
  const defaults: Record<string, string[]> = {
    hindu: ["hindu_wedding", "reception"],
    sikh: [
      "sikh_roka",
      "sikh_engagement",
      "sikh_chunni_chadana",
      "sikh_paath",
      "sikh_mehndi",
      "sikh_bakra_party",
      "sikh_mayian",
      "sikh_sangeet",
      "sikh_anand_karaj",
      "sikh_reception",
      "sikh_day_after"
    ],
    muslim: ["muslim_nikah", "muslim_walima"],
    gujarati: ["gujarati_wedding", "reception"],
    south_indian: ["south_indian_muhurtham", "reception"],
    mixed: ["general_wedding", "reception"],
    general: ["general_wedding", "reception"],
  };
  return defaults[tradition] || defaults.general;
}
