import { storage } from "../server/storage";

// Helper to calculate cost per guest from categories
function calculateCostPerGuest(categories: Array<{lowCost: number; highCost: number; unit: string}>, guestCount: number): { low: string; high: string } {
  let totalLow = 0;
  let totalHigh = 0;
  
  for (const cat of categories) {
    if (cat.unit === "per_person") {
      totalLow += cat.lowCost;
      totalHigh += cat.highCost;
    } else {
      // Fixed costs divided by guest count
      totalLow += cat.lowCost / guestCount;
      totalHigh += cat.highCost / guestCount;
    }
  }
  
  return {
    low: totalLow.toFixed(2),
    high: totalHigh.toFixed(2),
  };
}

const sikhCeremonyTemplates = [
  {
    ceremonyId: "sikh_roka",
    tradition: "sikh" as const,
    name: "Roka",
    description: "The informal engagement ceremony marking the commitment between two families",
    defaultGuests: 30,
    displayOrder: 1,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Home ceremony or small restaurant" },
      { category: "Catering", lowCost: 20, highCost: 50, unit: "per_person" as const, notes: "Light snacks and sweets" },
      { category: "Gifts (Shagun)", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Cash and gifts for the couple" },
      { category: "Decor", lowCost: 200, highCost: 800, unit: "fixed" as const, notes: "Flowers and basic decor" },
      { category: "Photographer", lowCost: 200, highCost: 500, unit: "fixed" as const, notes: "2 hours coverage" },
    ],
  },
  {
    ceremonyId: "sikh_kurmai",
    tradition: "sikh" as const,
    name: "Kurmai/Engagement",
    description: "Formal engagement ceremony with exchange of rings and blessing from the Guru Granth Sahib",
    defaultGuests: 75,
    displayOrder: 2,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 1500, highCost: 5000, unit: "fixed" as const, notes: "Gurdwara hall or banquet hall" },
      { category: "Catering", lowCost: 30, highCost: 60, unit: "per_person" as const, notes: "Full langar-style meal" },
      { category: "Rings", lowCost: 2000, highCost: 10000, unit: "fixed" as const, notes: "Engagement rings" },
      { category: "Attire (Bride)", lowCost: 500, highCost: 2500, unit: "fixed" as const, notes: "Traditional salwar kameez or lehenga" },
      { category: "Attire (Groom)", lowCost: 300, highCost: 1000, unit: "fixed" as const, notes: "Kurta pajama or sherwani" },
      { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Floral arrangements" },
      { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed" as const, notes: "3 hours coverage" },
      { category: "Kirtan (Musicians)", lowCost: 200, highCost: 600, unit: "fixed" as const, notes: "Shabads and hymns" },
    ],
  },
  {
    ceremonyId: "sikh_sangeet",
    tradition: "sikh" as const,
    name: "Sangeet",
    description: "Musical celebration with dance performances from both families",
    defaultGuests: 150,
    displayOrder: 3,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 3000, highCost: 10000, unit: "fixed" as const, notes: "Banquet hall or event space" },
      { category: "Catering", lowCost: 40, highCost: 80, unit: "per_person" as const, notes: "Buffet dinner with bar" },
      { category: "DJ/Music", lowCost: 800, highCost: 2500, unit: "fixed" as const, notes: "DJ and sound system" },
      { category: "Choreographer", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Dance coordination" },
      { category: "Decor", lowCost: 1500, highCost: 5000, unit: "fixed" as const, notes: "Stage, lighting, flowers" },
      { category: "Photographer/Video", lowCost: 1000, highCost: 3000, unit: "fixed" as const, notes: "5 hours coverage" },
      { category: "Attire", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Party wear" },
    ],
  },
  {
    ceremonyId: "sikh_mehndi",
    tradition: "sikh" as const,
    name: "Mehndi",
    description: "Henna ceremony for the bride with music and celebration",
    defaultGuests: 60,
    displayOrder: 4,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Home or small venue" },
      { category: "Mehndi Artist", lowCost: 300, highCost: 1000, unit: "fixed" as const, notes: "Bridal mehndi + guests" },
      { category: "Catering", lowCost: 25, highCost: 50, unit: "per_person" as const, notes: "Light snacks and refreshments" },
      { category: "Decor", lowCost: 500, highCost: 1500, unit: "fixed" as const, notes: "Colorful drapes and cushions" },
      { category: "Music", lowCost: 300, highCost: 800, unit: "fixed" as const, notes: "Dholki or DJ" },
      { category: "Photographer", lowCost: 400, highCost: 1000, unit: "fixed" as const, notes: "4 hours coverage" },
    ],
  },
  {
    ceremonyId: "sikh_maiyan",
    tradition: "sikh" as const,
    name: "Maiyan",
    description: "Intimate home ceremony with turmeric paste application and blessings from elders",
    defaultGuests: 40,
    displayOrder: 5,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 0, highCost: 500, unit: "fixed" as const, notes: "Typically at home" },
      { category: "Catering", lowCost: 15, highCost: 30, unit: "per_person" as const, notes: "Simple refreshments - chai, pakoras, sweets" },
      { category: "Maiyan Supplies", lowCost: 100, highCost: 300, unit: "fixed" as const, notes: "Haldi, mustard oil, mauli thread, diya" },
      { category: "Decor", lowCost: 200, highCost: 800, unit: "fixed" as const, notes: "Simple floral, marigold garlands, chowki" },
      { category: "Dhol", lowCost: 0, highCost: 500, unit: "fixed" as const, notes: "Optional dhol player" },
      { category: "Photographer", lowCost: 300, highCost: 600, unit: "fixed" as const, notes: "2-3 hours coverage" },
      { category: "Attire", lowCost: 100, highCost: 300, unit: "fixed" as const, notes: "Yellow/simple traditional clothes" },
    ],
  },
  {
    ceremonyId: "sikh_chooda_kalire",
    tradition: "sikh" as const,
    name: "Chooda & Kalire",
    description: "Maternal uncle gifts red and white bangles to the bride, adorned with hanging ornaments",
    defaultGuests: 50,
    displayOrder: 6,
    isActive: true,
    costBreakdown: [
      { category: "Chooda Set", lowCost: 200, highCost: 800, unit: "fixed" as const, notes: "Red and white ivory/acrylic bangles" },
      { category: "Kalire", lowCost: 100, highCost: 500, unit: "fixed" as const, notes: "Golden umbrella-shaped ornaments" },
      { category: "Gifts from Mama", lowCost: 500, highCost: 3000, unit: "fixed" as const, notes: "Outfit and jewelry from maternal uncle" },
      { category: "Venue", lowCost: 0, highCost: 500, unit: "fixed" as const, notes: "Typically at home" },
      { category: "Catering", lowCost: 15, highCost: 35, unit: "per_person" as const, notes: "Light refreshments" },
      { category: "Decor", lowCost: 200, highCost: 600, unit: "fixed" as const, notes: "Simple floral setup" },
      { category: "Photographer", lowCost: 300, highCost: 600, unit: "fixed" as const, notes: "2 hours coverage" },
    ],
  },
  {
    ceremonyId: "sikh_jaggo",
    tradition: "sikh" as const,
    name: "Jaggo",
    description: "Pre-wedding night celebration with decorated pots, singing, and dancing through the neighborhood",
    defaultGuests: 100,
    displayOrder: 7,
    isActive: true,
    costBreakdown: [
      { category: "Jaggo Pot (Gagger)", lowCost: 100, highCost: 300, unit: "fixed" as const, notes: "Decorated copper pot with candles" },
      { category: "Dhol Players", lowCost: 400, highCost: 1000, unit: "fixed" as const, notes: "2-3 dhol players for procession" },
      { category: "Snacks & Sweets", lowCost: 300, highCost: 800, unit: "fixed" as const, notes: "Distribution during procession" },
      { category: "Decor & Lights", lowCost: 200, highCost: 600, unit: "fixed" as const, notes: "String lights, sticks, decorations" },
      { category: "After-party Catering", lowCost: 20, highCost: 40, unit: "per_person" as const, notes: "Late night snacks" },
      { category: "Photographer/Video", lowCost: 500, highCost: 1200, unit: "fixed" as const, notes: "Documentary coverage" },
    ],
  },
  {
    ceremonyId: "sikh_anand_karaj",
    tradition: "sikh" as const,
    name: "Anand Karaj",
    description: "The sacred Sikh wedding ceremony at the Gurdwara with four laavaan around the Guru Granth Sahib",
    defaultGuests: 200,
    displayOrder: 8,
    isActive: true,
    costBreakdown: [
      { category: "Gurdwara Donation", lowCost: 500, highCost: 2500, unit: "fixed" as const, notes: "Donation to the Gurdwara" },
      { category: "Langar Contribution", lowCost: 1000, highCost: 4000, unit: "fixed" as const, notes: "Contribution to community meal" },
      { category: "Ragis/Kirtan", lowCost: 500, highCost: 1500, unit: "fixed" as const, notes: "Professional kirtan musicians" },
      { category: "Bridal Lehenga", lowCost: 2000, highCost: 10000, unit: "fixed" as const, notes: "Red/pink wedding lehenga" },
      { category: "Groom Sherwani", lowCost: 800, highCost: 3000, unit: "fixed" as const, notes: "Matching sherwani with pagri" },
      { category: "Jewelry", lowCost: 3000, highCost: 20000, unit: "fixed" as const, notes: "Bridal jewelry set" },
      { category: "Rumala Sahib", lowCost: 100, highCost: 500, unit: "fixed" as const, notes: "Cloth offering for Guru Granth Sahib" },
      { category: "Flowers & Decor", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Palki decoration, flowers" },
      { category: "Photographer/Video", lowCost: 2000, highCost: 6000, unit: "fixed" as const, notes: "Full ceremony coverage" },
      { category: "Transportation", lowCost: 300, highCost: 1000, unit: "fixed" as const, notes: "Decorated car for couple" },
    ],
  },
  {
    ceremonyId: "sikh_baraat",
    tradition: "sikh" as const,
    name: "Baraat",
    description: "Groom's procession to the wedding venue with music, dancing, and celebration",
    defaultGuests: 100,
    displayOrder: 9,
    isActive: true,
    costBreakdown: [
      { category: "Dhol Players", lowCost: 500, highCost: 1500, unit: "fixed" as const, notes: "3-5 dhol players for procession" },
      { category: "DJ/Band", lowCost: 800, highCost: 2500, unit: "fixed" as const, notes: "Music for procession" },
      { category: "Ghodi (Horse)", lowCost: 400, highCost: 1200, unit: "fixed" as const, notes: "Decorated horse for groom" },
      { category: "Sehra", lowCost: 50, highCost: 200, unit: "fixed" as const, notes: "Groom's face veil with flowers" },
      { category: "Baraat Vehicle", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Decorated car or chariot" },
      { category: "Welcome Drinks", lowCost: 300, highCost: 800, unit: "fixed" as const, notes: "Refreshments for baraat party" },
      { category: "Fireworks/Confetti", lowCost: 200, highCost: 800, unit: "fixed" as const, notes: "Cold sparklers, confetti cannons" },
    ],
  },
  {
    ceremonyId: "sikh_milni",
    tradition: "sikh" as const,
    name: "Milni",
    description: "Formal meeting of both families with garland exchange between matching relatives",
    defaultGuests: 80,
    displayOrder: 10,
    isActive: true,
    costBreakdown: [
      { category: "Garlands (Haar)", lowCost: 100, highCost: 400, unit: "fixed" as const, notes: "Fresh flower garlands for each pair" },
      { category: "Gifts Exchange", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Token gifts for relatives" },
      { category: "Decor", lowCost: 300, highCost: 1000, unit: "fixed" as const, notes: "Entrance decor" },
      { category: "Photographer", lowCost: 300, highCost: 800, unit: "fixed" as const, notes: "1 hour focused coverage" },
      { category: "Welcome Tea/Snacks", lowCost: 200, highCost: 600, unit: "fixed" as const, notes: "Light refreshments" },
    ],
  },
  {
    ceremonyId: "sikh_reception",
    tradition: "sikh" as const,
    name: "Reception",
    description: "Grand celebration with dinner, music, and entertainment for all guests",
    defaultGuests: 300,
    displayOrder: 11,
    isActive: true,
    costBreakdown: [
      { category: "Venue", lowCost: 5000, highCost: 20000, unit: "fixed" as const, notes: "Banquet hall or hotel ballroom" },
      { category: "Catering", lowCost: 60, highCost: 150, unit: "per_person" as const, notes: "Full dinner with multiple courses" },
      { category: "Bar/Beverages", lowCost: 20, highCost: 50, unit: "per_person" as const, notes: "Open bar or hosted bar" },
      { category: "DJ/Band", lowCost: 1500, highCost: 5000, unit: "fixed" as const, notes: "Live entertainment" },
      { category: "Decor", lowCost: 3000, highCost: 15000, unit: "fixed" as const, notes: "Full venue transformation" },
      { category: "Lighting", lowCost: 1000, highCost: 5000, unit: "fixed" as const, notes: "Uplighting, gobo, specialty" },
      { category: "Photographer/Video", lowCost: 3000, highCost: 8000, unit: "fixed" as const, notes: "Full coverage with second shooter" },
      { category: "Wedding Cake", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Tiered wedding cake" },
      { category: "Bride Outfit", lowCost: 1500, highCost: 6000, unit: "fixed" as const, notes: "Reception lehenga or gown" },
      { category: "Groom Outfit", lowCost: 500, highCost: 2000, unit: "fixed" as const, notes: "Reception suit or sherwani" },
      { category: "Party Favors", lowCost: 3, highCost: 10, unit: "per_person" as const, notes: "Thank you gifts for guests" },
    ],
  },
];

const regionalPricingData = [
  {
    city: "bay_area",
    displayName: "Bay Area",
    state: "California",
    multiplier: "1.50",
    notes: "Highest cost market. San Francisco, Oakland, San Jose. Premium venue and vendor rates.",
  },
  {
    city: "nyc",
    displayName: "New York City",
    state: "New York",
    multiplier: "1.40",
    notes: "Manhattan, Brooklyn, Queens. High venue costs, competitive vendor market.",
  },
  {
    city: "la",
    displayName: "Los Angeles",
    state: "California",
    multiplier: "1.30",
    notes: "LA County and Orange County. Large South Asian community, good vendor availability.",
  },
  {
    city: "chicago",
    displayName: "Chicago",
    state: "Illinois",
    multiplier: "1.10",
    notes: "Chicagoland area. Growing South Asian wedding market, moderate pricing.",
  },
  {
    city: "seattle",
    displayName: "Seattle",
    state: "Washington",
    multiplier: "1.20",
    notes: "Seattle metro. Tech hub with growing South Asian population.",
  },
];

async function seedCeremonyTemplates() {
  console.log("Seeding Sikh ceremony templates...");
  
  for (const template of sikhCeremonyTemplates) {
    const costPerGuest = calculateCostPerGuest(template.costBreakdown, template.defaultGuests);
    
    const fullTemplate = {
      ...template,
      costPerGuestLow: costPerGuest.low,
      costPerGuestHigh: costPerGuest.high,
    };
    
    try {
      const existing = await storage.getCeremonyType(template.ceremonyId);
      if (existing) {
        console.log(`  Updating: ${template.name}`);
        await storage.updateCeremonyType(template.ceremonyId, fullTemplate);
      } else {
        console.log(`  Creating: ${template.name}`);
        await storage.createCeremonyType(fullTemplate);
      }
    } catch (error) {
      console.error(`  Error with ${template.name}:`, error);
    }
  }
  
  console.log("Done seeding ceremony templates.");
}

async function seedRegionalPricing() {
  console.log("Seeding regional pricing...");
  
  for (const pricing of regionalPricingData) {
    try {
      const existing = await storage.getRegionalPricing(pricing.city);
      if (existing) {
        console.log(`  Updating: ${pricing.displayName}`);
        await storage.updateRegionalPricing(pricing.city, pricing);
      } else {
        console.log(`  Creating: ${pricing.displayName}`);
        await storage.createRegionalPricing(pricing);
      }
    } catch (error) {
      console.error(`  Error with ${pricing.displayName}:`, error);
    }
  }
  
  console.log("Done seeding regional pricing.");
}

async function main() {
  try {
    await seedCeremonyTemplates();
    await seedRegionalPricing();
    console.log("All seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
