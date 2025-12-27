export interface CeremonyDefinition {
  id: string;
  name: string;
  description: string;
  costPerGuestLow: number;
  costPerGuestHigh: number;
  defaultGuests: number;
  traditions: string[];
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
