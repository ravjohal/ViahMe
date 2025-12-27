export interface CostCategory {
  category: string;
  lowCost: number;
  highCost: number;
  unit: "fixed" | "per_hour" | "per_person";
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
}

export interface CeremonyDefinition {
  id: string;
  name: string;
  description: string;
  costPerGuestLow: number;
  costPerGuestHigh: number;
  defaultGuests: number;
  traditions: string[];
  costBreakdown?: CostCategory[];
}

export const CEREMONY_COST_BREAKDOWNS: Record<string, CostCategory[]> = {
  hindu_mehndi: [
    { category: "Henna Artist (Bride)", lowCost: 300, highCost: 800, unit: "fixed", notes: "Includes intricate designs for hands (to elbows) and feet" },
    { category: "Henna Artists (Guests)", lowCost: 100, highCost: 150, unit: "per_hour", hoursLow: 3, hoursHigh: 4, notes: "Usually 2+ artists needed for 3-4 hours" },
    { category: "Venue / Home Setup", lowCost: 0, highCost: 3000, unit: "fixed", notes: "Backyard setups are popular; hotel rooms or small halls cost more" },
    { category: "Decor & Lighting", lowCost: 1500, highCost: 4500, unit: "fixed", notes: "Vibrant drapes, pillows, Mehndi swings, and marigold florals" },
    { category: "Catering & Drinks", lowCost: 35, highCost: 65, unit: "per_person", notes: "Often chaat stations or street food rather than heavy buffet" },
    { category: "Photography", lowCost: 1000, highCost: 2500, unit: "fixed", notes: "Usually a 4-hour coverage package" },
    { category: "Entertainment", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Dhol player, small DJ setup, or DIY Spotify playlist" },
  ],
  hindu_sangeet: [
    { category: "Venue Rental", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Banquet hall or hotel ballroom" },
    { category: "Decor & Stage Setup", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Stage for performances, lighting, backdrop" },
    { category: "Catering & Bar", lowCost: 50, highCost: 100, unit: "per_person", notes: "Full dinner service with appetizers" },
    { category: "DJ/Entertainment", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "DJ, MC, and sound system" },
    { category: "Choreographer", lowCost: 500, highCost: 2500, unit: "fixed", notes: "For family dance performances" },
    { category: "Photography/Video", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Full event coverage" },
    { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "1-2 dhol players for 2-3 hours" },
  ],
  hindu_haldi: [
    { category: "Venue / Home Setup", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at home or venue morning of wedding" },
    { category: "Haldi Supplies", lowCost: 100, highCost: 300, unit: "fixed", notes: "Turmeric paste, flowers, banana leaves" },
    { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Yellow/marigold themed decorations" },
    { category: "Catering", lowCost: 25, highCost: 50, unit: "per_person", notes: "Light breakfast or brunch" },
    { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Music", lowCost: 0, highCost: 500, unit: "fixed", notes: "Usually DIY playlist or small speaker" },
  ],
  hindu_baraat: [
    { category: "Horse/Carriage", lowCost: 500, highCost: 1500, unit: "fixed", notes: "White horse with decorated saddle" },
    { category: "Baraat Band", lowCost: 800, highCost: 2000, unit: "fixed", notes: "Traditional brass band with dancers" },
    { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "2-4 dhol players" },
    { category: "Decorations", lowCost: 200, highCost: 600, unit: "fixed", notes: "Umbrella, flower garlands for groom" },
    { category: "Snacks/Drinks", lowCost: 200, highCost: 500, unit: "fixed", notes: "Water, light refreshments for guests" },
  ],
  hindu_wedding: [
    { category: "Venue Rental", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple, banquet hall, or hotel" },
    { category: "Mandap Setup", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Decorated wedding canopy with flowers" },
    { category: "Priest/Pandit", lowCost: 500, highCost: 1500, unit: "fixed", notes: "For performing the ceremony" },
    { category: "Decor & Florals", lowCost: 3000, highCost: 12000, unit: "fixed", notes: "Stage, aisle, centerpieces" },
    { category: "Catering", lowCost: 60, highCost: 120, unit: "per_person", notes: "Vegetarian feast with multiple courses" },
    { category: "Photography/Video", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full ceremony coverage" },
    { category: "Music/Sound", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Sound system for mantras" },
  ],
  reception: [
    { category: "Venue Rental", lowCost: 5000, highCost: 25000, unit: "fixed", notes: "Hotel ballroom or banquet hall" },
    { category: "Catering & Bar", lowCost: 75, highCost: 175, unit: "per_person", notes: "Multi-course dinner with appetizers" },
    { category: "Decor & Florals", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Centerpieces, uplighting, drapery" },
    { category: "DJ/Entertainment", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "DJ, MC, and dance floor lighting" },
    { category: "Photography/Video", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full reception coverage" },
    { category: "Wedding Cake", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Multi-tier cake or dessert station" },
    { category: "Transportation", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Couple's exit vehicle, guest shuttles" },
  ],
  sikh_anand_karaj: [
    { category: "Gurdwara Donation", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Donation to the Gurdwara" },
    { category: "Langar (Community Meal)", lowCost: 15, highCost: 35, unit: "per_person", notes: "Traditional vegetarian meal" },
    { category: "Flowers & Decor", lowCost: 1000, highCost: 4000, unit: "fixed", notes: "Marigolds, rose petals, minimal decor" },
    { category: "Kirtan Musicians", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Professional raagis" },
    { category: "Photography/Video", lowCost: 2000, highCost: 5000, unit: "fixed", notes: "Ceremony coverage" },
    { category: "Transportation", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Couple and family transport" },
  ],
  muslim_nikah: [
    { category: "Venue Rental", lowCost: 2000, highCost: 10000, unit: "fixed", notes: "Mosque, banquet hall, or home" },
    { category: "Imam/Officiant", lowCost: 300, highCost: 800, unit: "fixed", notes: "For performing the Nikah" },
    { category: "Decor", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "Stage setup, florals" },
    { category: "Catering", lowCost: 40, highCost: 80, unit: "per_person", notes: "Halal catering" },
    { category: "Photography", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Ceremony coverage" },
    { category: "Mehr Display", lowCost: 200, highCost: 1000, unit: "fixed", notes: "Decorative presentation of bridal gift" },
  ],
  muslim_walima: [
    { category: "Venue Rental", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Banquet hall or hotel" },
    { category: "Catering", lowCost: 60, highCost: 120, unit: "per_person", notes: "Full halal dinner service" },
    { category: "Decor", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Elegant decor and florals" },
    { category: "Entertainment", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "DJ or live music" },
    { category: "Photography/Video", lowCost: 2000, highCost: 5000, unit: "fixed", notes: "Full event coverage" },
  ],
  muslim_dholki: [
    { category: "Venue / Home Setup", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Often held at home" },
    { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "Traditional drummers" },
    { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Colorful textiles, lights" },
    { category: "Catering", lowCost: 25, highCost: 50, unit: "per_person", notes: "Appetizers and chai" },
    { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "3-4 hour coverage" },
  ],
  gujarati_pithi: [
    { category: "Venue / Home Setup", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at home" },
    { category: "Pithi Supplies", lowCost: 100, highCost: 300, unit: "fixed", notes: "Turmeric paste, oils, flowers" },
    { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Yellow/green themed decorations" },
    { category: "Catering", lowCost: 20, highCost: 45, unit: "per_person", notes: "Light breakfast/snacks" },
    { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
  ],
  gujarati_garba: [
    { category: "Venue Rental", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Banquet hall with dance floor" },
    { category: "Live Band/DJ", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Garba music specialists" },
    { category: "Decor", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "Colorful traditional decor" },
    { category: "Dandiya Sticks", lowCost: 100, highCost: 300, unit: "fixed", notes: "For all guests" },
    { category: "Catering", lowCost: 30, highCost: 60, unit: "per_person", notes: "Gujarati snacks and dinner" },
    { category: "Photography", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "Full event coverage" },
  ],
  gujarati_wedding: [
    { category: "Venue Rental", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple or banquet hall" },
    { category: "Mandap Setup", lowCost: 2000, highCost: 7000, unit: "fixed", notes: "Traditional wedding canopy" },
    { category: "Priest", lowCost: 500, highCost: 1200, unit: "fixed", notes: "For performing rituals" },
    { category: "Decor & Florals", lowCost: 3000, highCost: 10000, unit: "fixed", notes: "Stage and venue decor" },
    { category: "Catering", lowCost: 55, highCost: 110, unit: "per_person", notes: "Vegetarian Gujarati feast" },
    { category: "Photography/Video", lowCost: 3000, highCost: 7000, unit: "fixed", notes: "Full coverage" },
  ],
  south_indian_muhurtham: [
    { category: "Venue/Temple", lowCost: 3000, highCost: 15000, unit: "fixed", notes: "Temple or banquet hall" },
    { category: "Mandapam Setup", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Traditional South Indian setup" },
    { category: "Priest", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Experienced temple priest" },
    { category: "Nadaswaram Musicians", lowCost: 800, highCost: 2000, unit: "fixed", notes: "Traditional pipe musicians" },
    { category: "Decor & Florals", lowCost: 2500, highCost: 8000, unit: "fixed", notes: "Jasmine, banana leaves, kolam" },
    { category: "Catering", lowCost: 50, highCost: 100, unit: "per_person", notes: "Traditional banana leaf meal" },
    { category: "Photography/Video", lowCost: 2500, highCost: 6000, unit: "fixed", notes: "Full ceremony coverage" },
  ],
  general_wedding: [
    { category: "Venue Rental", lowCost: 5000, highCost: 25000, unit: "fixed", notes: "Church, garden, or hotel" },
    { category: "Officiant", lowCost: 300, highCost: 800, unit: "fixed", notes: "Religious or civil officiant" },
    { category: "Decor & Florals", lowCost: 3000, highCost: 12000, unit: "fixed", notes: "Altar, aisle, centerpieces" },
    { category: "Catering", lowCost: 60, highCost: 150, unit: "per_person", notes: "Cocktail hour and dinner" },
    { category: "Photography/Video", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full day coverage" },
    { category: "Music", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Ceremony music" },
  ],
  rehearsal_dinner: [
    { category: "Venue/Restaurant", lowCost: 1000, highCost: 5000, unit: "fixed", notes: "Private dining room" },
    { category: "Catering", lowCost: 50, highCost: 120, unit: "per_person", notes: "Multi-course dinner" },
    { category: "Decor", lowCost: 200, highCost: 1000, unit: "fixed", notes: "Simple elegant touches" },
    { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
  ],
  cocktail_hour: [
    { category: "Bar Service", lowCost: 25, highCost: 60, unit: "per_person", notes: "Open bar or signature drinks" },
    { category: "Appetizers", lowCost: 20, highCost: 45, unit: "per_person", notes: "Passed hors d'oeuvres" },
    { category: "Live Music/Entertainment", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Jazz trio or string quartet" },
    { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Lounge areas, cocktail tables" },
  ],
};

export function getCeremonyCostBreakdown(ceremonyId: string): CostCategory[] | undefined {
  return CEREMONY_COST_BREAKDOWNS[ceremonyId];
}

export function hasCostBreakdown(ceremonyId: string): boolean {
  return ceremonyId in CEREMONY_COST_BREAKDOWNS;
}

export function calculateCeremonyTotalRange(ceremonyId: string, guestCount: number): { low: number; high: number } {
  const breakdown = CEREMONY_COST_BREAKDOWNS[ceremonyId];
  
  if (breakdown && breakdown.length > 0) {
    let totalLow = 0;
    let totalHigh = 0;

    for (const item of breakdown) {
      if (item.unit === "per_person") {
        totalLow += item.lowCost * guestCount;
        totalHigh += item.highCost * guestCount;
      } else if (item.unit === "per_hour") {
        const hoursLow = item.hoursLow ?? 3;
        const hoursHigh = item.hoursHigh ?? 4;
        totalLow += item.lowCost * hoursLow;
        totalHigh += item.highCost * hoursHigh;
      } else {
        totalLow += item.lowCost;
        totalHigh += item.highCost;
      }
    }

    return { low: totalLow, high: totalHigh };
  }
  
  const ceremony = CEREMONY_CATALOG.find(c => c.id === ceremonyId);
  if (ceremony) {
    return {
      low: ceremony.costPerGuestLow * guestCount,
      high: ceremony.costPerGuestHigh * guestCount,
    };
  }
  
  return { low: 0, high: 0 };
}

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
  },
  {
    id: "hindu_sangeet",
    name: "Sangeet",
    description: "Musical night with performances and dancing",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 150,
    traditions: ["hindu", "sikh", "south_indian", "mixed"],
  },
  {
    id: "hindu_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony for the bride",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 100,
    traditions: ["hindu", "sikh", "muslim", "gujarati", "south_indian", "mixed"],
  },
  {
    id: "hindu_haldi",
    name: "Haldi",
    description: "Turmeric application ceremony for bride and groom",
    costPerGuestLow: 30,
    costPerGuestHigh: 60,
    defaultGuests: 75,
    traditions: ["hindu"],
  },
  {
    id: "hindu_baraat",
    name: "Baraat",
    description: "Groom's procession with music and dancing",
    costPerGuestLow: 20,
    costPerGuestHigh: 40,
    defaultGuests: 100,
    traditions: ["hindu", "sikh"],
  },
  {
    id: "reception",
    name: "Reception",
    description: "Post-wedding celebration with dinner and dancing",
    costPerGuestLow: 100,
    costPerGuestHigh: 200,
    defaultGuests: 300,
    traditions: ["hindu", "sikh", "muslim", "gujarati", "south_indian", "mixed", "general"],
  },

  // Sikh ceremonies
  {
    id: "sikh_anand_karaj",
    name: "Anand Karaj",
    description: "Sikh wedding ceremony at the Gurdwara",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 200,
    traditions: ["sikh"],
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
  },
  {
    id: "muslim_walima",
    name: "Walima",
    description: "Wedding banquet hosted by the groom's family",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 250,
    traditions: ["muslim"],
  },
  {
    id: "muslim_dholki",
    name: "Dholki",
    description: "Pre-wedding music and dance celebration",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 80,
    traditions: ["muslim"],
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
  },
  {
    id: "gujarati_garba",
    name: "Garba",
    description: "Traditional Gujarati dance celebration",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 200,
    traditions: ["gujarati"],
  },
  {
    id: "gujarati_wedding",
    name: "Wedding Ceremony",
    description: "Main Gujarati wedding ceremony",
    costPerGuestLow: 80,
    costPerGuestHigh: 150,
    defaultGuests: 200,
    traditions: ["gujarati"],
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
  },
  {
    id: "rehearsal_dinner",
    name: "Rehearsal Dinner",
    description: "Pre-wedding dinner for wedding party and close family",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 50,
    traditions: ["general", "mixed"],
  },
  {
    id: "cocktail_hour",
    name: "Cocktail Hour",
    description: "Pre-reception drinks and appetizers",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 150,
    traditions: ["general", "mixed", "hindu", "sikh", "gujarati", "south_indian"],
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
    sikh: ["sikh_anand_karaj", "reception"],
    muslim: ["muslim_nikah", "muslim_walima"],
    gujarati: ["gujarati_wedding", "reception"],
    south_indian: ["south_indian_muhurtham", "reception"],
    mixed: ["general_wedding", "reception"],
    general: ["general_wedding", "reception"],
  };
  return defaults[tradition] || defaults.general;
}
