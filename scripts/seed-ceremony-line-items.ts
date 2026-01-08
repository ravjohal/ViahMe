/**
 * Seed script: Populate ceremony templates with line items and budget bucket mappings
 * 
 * This script migrates ceremony cost breakdowns from shared/ceremonies.ts into
 * the ceremony_templates database table, making line items admin-editable.
 * 
 * Run with: npx tsx scripts/seed-ceremony-line-items.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ceremonyTemplates } from "../shared/schema";
import type { BudgetBucket, CeremonyTemplateCostItem } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

// Line item to budget bucket mappings
const LINE_ITEM_TO_BUCKET: Record<string, BudgetBucket> = {
  // Venue-related
  "venue": "venue",
  "venue (typically at home)": "venue",
  "venue (typically a home)": "venue",
  "venue (typically home)": "venue",
  "venue rental": "venue",
  "venue / home setup": "venue",
  "gurdwara": "venue",
  "gurdwara fee": "venue",
  "temple": "venue",
  "tent / marquee": "venue",
  "venue (typically a sikh temple)": "venue",
  
  // Catering
  "caterer": "catering",
  "catering": "catering",
  "langar service": "catering",
  "bartenders": "catering",
  "alcohol / drinks": "catering",
  "snacks/drinks": "catering",
  
  // Photography & Video
  "photographer": "photography",
  "videographer": "photography",
  "photo booth": "photography",
  "photography": "photography",
  "photography/video": "photography",
  
  // Decoration & Florals
  "decoration": "decoration",
  "decorations": "decoration",
  "decor": "decoration",
  "florals": "decoration",
  "mandap": "decoration",
  "mandap setup": "decoration",
  "stage setup": "decoration",
  "garlands": "decoration",
  "lighting": "decoration",
  
  // Entertainment
  "dj": "entertainment",
  "dhol player": "entertainment",
  "dhol players": "entertainment",
  "live band": "entertainment",
  "live band/dj": "entertainment",
  "dancers": "entertainment",
  "choreographer": "entertainment",
  "nadaswaram": "entertainment",
  "baraat band": "entertainment",
  "entertainment": "entertainment",
  "entertainment (singers, bands, bhangra teams)": "entertainment",
  "music": "entertainment",
  "music/sound": "entertainment",
  "raagi jatha / kirtan musicians": "entertainment",
  
  // Attire & Beauty
  "makeup": "attire",
  "makeup artist": "attire",
  "mehndi artist": "attire",
  "mehndi": "attire",
  "henna artist (bride)": "attire",
  "henna artists (guests)": "attire",
  "turban tier": "attire",
  "turban tying": "attire",
  "bride's outfit": "attire",
  "groom's outfit": "attire",
  "attire for groom": "attire",
  "attire for bride": "attire",
  "attire for groom's side": "attire",
  "attire for bride's side": "attire",
  "jewelry": "jewelry",
  "hair styling": "attire",
  
  // Transportation
  "transportation": "transportation",
  "transportation for guests": "transportation",
  "horse / ghodi": "transportation",
  "horse/carriage": "transportation",
  "horse rental": "transportation",
  "carriage": "transportation",
  "car rental": "transportation",
  "limo rental": "transportation",
  
  // Gifts & Favors
  "shagun / gifts": "stationery",
  "shagun / gifts for other side": "stationery",
  "gifts / shagun": "stationery",
  "favors": "stationery",
  "gift bags": "stationery",
  "mehr display": "stationery",
  
  // Stationery
  "invitations": "stationery",
  "signage": "stationery",
  
  // Religious / Ceremonial
  "pandit": "other",
  "granthi": "other",
  "qazi": "other",
  "priest": "other",
  "imam/officiant": "other",
  "priest/pandit": "other",
  "pooja items": "other",
  "ceremony supplies": "other",
  "haldi supplies": "other",
  "pithi supplies": "other",
  "chooda set": "other",
  "kalire": "other",
  "sword rental": "other",
  "gurdwara bheta / donation": "other",
  "rumalla sahib": "other",
  "dandiya sticks": "other",
  
  // Other
  "hotels for guests": "other",
};

function getLineItemBucket(categoryName: string): BudgetBucket {
  const normalized = categoryName.toLowerCase().trim();
  
  // Direct match
  if (LINE_ITEM_TO_BUCKET[normalized]) {
    return LINE_ITEM_TO_BUCKET[normalized];
  }
  
  // Partial match
  for (const [key, bucket] of Object.entries(LINE_ITEM_TO_BUCKET)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return bucket;
    }
  }
  
  return "other";
}

interface CostCategory {
  category: string;
  lowCost: number;
  highCost: number;
  unit: "fixed" | "per_hour" | "per_person";
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
}

// Complete ceremony definitions with line items
const CEREMONY_DEFINITIONS: Array<{
  ceremonyId: string;
  name: string;
  description: string;
  tradition: string;
  costPerGuestLow: string;
  costPerGuestHigh: string;
  defaultGuests: number;
  displayOrder: number;
  costBreakdown: CostCategory[];
}> = [
  // ============ SIKH CEREMONIES ============
  {
    ceremonyId: "sikh_roka",
    name: "Roka",
    description: "Traditional ceremony where both families agree to the union",
    tradition: "sikh",
    costPerGuestLow: "50",
    costPerGuestHigh: "120",
    defaultGuests: 50,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue (typically at home)", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at home" },
      { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
      { category: "Caterer", lowCost: 30, highCost: 60, unit: "per_person", notes: "Snacks and light meal" },
      { category: "Decoration", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Simple home decor" },
      { category: "Makeup", lowCost: 150, highCost: 400, unit: "fixed", notes: "Bride's makeup" },
      { category: "Shagun / Gifts", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Traditional gifts exchanged" },
    ],
  },
  {
    ceremonyId: "sikh_engagement",
    name: "Kurmai / Engagement",
    description: "Formal engagement ceremony with ring exchange",
    tradition: "sikh",
    costPerGuestLow: "80",
    costPerGuestHigh: "180",
    defaultGuests: 100,
    displayOrder: 2,
    costBreakdown: [
      { category: "Venue", lowCost: 1500, highCost: 6000, unit: "fixed", notes: "Banquet hall or restaurant" },
      { category: "Photographer", lowCost: 800, highCost: 2000, unit: "fixed", notes: "3-4 hour coverage" },
      { category: "Caterer", lowCost: 40, highCost: 80, unit: "per_person", notes: "Full meal service" },
      { category: "Decoration", lowCost: 1000, highCost: 4000, unit: "fixed", notes: "Stage setup and florals" },
      { category: "DJ", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Music and sound system" },
      { category: "Makeup", lowCost: 200, highCost: 500, unit: "fixed", notes: "Bride's makeup and styling" },
      { category: "Shagun / Gifts for other side", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Gifts for the other family" },
      { category: "Dhol Player", lowCost: 200, highCost: 600, unit: "fixed", notes: "1-2 dhol players" },
      { category: "Bartenders", lowCost: 200, highCost: 500, unit: "fixed", notes: "Professional bartender service" },
      { category: "Alcohol / Drinks", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Bar service and beverages" },
    ],
  },
  {
    ceremonyId: "sikh_sangeet",
    name: "Sangeet",
    description: "Pre-wedding music and dance celebration",
    tradition: "sikh",
    costPerGuestLow: "100",
    costPerGuestHigh: "200",
    defaultGuests: 150,
    displayOrder: 3,
    costBreakdown: [
      { category: "Venue", lowCost: 2500, highCost: 10000, unit: "fixed", notes: "Banquet hall or hotel ballroom" },
      { category: "Photographer", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Full event coverage" },
      { category: "Caterer", lowCost: 50, highCost: 100, unit: "per_person", notes: "Full dinner service" },
      { category: "Decoration", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Stage, lighting, backdrop" },
      { category: "DJ", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "DJ with sound and lights" },
      { category: "Dhol Player", lowCost: 300, highCost: 800, unit: "fixed", notes: "1-2 dhol players" },
      { category: "Makeup", lowCost: 200, highCost: 600, unit: "fixed", notes: "Makeup and styling" },
      { category: "Entertainment (Singers, Bands, Bhangra Teams)", lowCost: 1500, highCost: 6000, unit: "fixed", notes: "Live performers or dance teams" },
      { category: "Bartenders", lowCost: 200, highCost: 500, unit: "fixed", notes: "Professional bartender service" },
      { category: "Alcohol / Drinks", lowCost: 1000, highCost: 4000, unit: "fixed", notes: "Full bar service" },
    ],
  },
  {
    ceremonyId: "sikh_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony for the bride",
    tradition: "sikh",
    costPerGuestLow: "40",
    costPerGuestHigh: "100",
    defaultGuests: 75,
    displayOrder: 4,
    costBreakdown: [
      { category: "Venue (typically home)", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Often held at home or small venue" },
      { category: "Photographer", lowCost: 800, highCost: 2000, unit: "fixed", notes: "3-4 hour coverage" },
      { category: "Caterer", lowCost: 30, highCost: 60, unit: "per_person", notes: "Chaat and finger foods" },
      { category: "Decoration", lowCost: 1000, highCost: 4000, unit: "fixed", notes: "Colorful drapes, cushions, florals" },
      { category: "Mehndi Artist", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Professional henna application" },
    ],
  },
  {
    ceremonyId: "sikh_maiyan",
    name: "Maiyan",
    description: "Turmeric cleansing ceremony held at home",
    tradition: "sikh",
    costPerGuestLow: "30",
    costPerGuestHigh: "80",
    defaultGuests: 50,
    displayOrder: 5,
    costBreakdown: [
      { category: "Venue (typically home)", lowCost: 0, highCost: 500, unit: "fixed", notes: "Traditionally held at home" },
      { category: "Photographer", lowCost: 500, highCost: 1200, unit: "fixed", notes: "2-3 hour coverage" },
      { category: "Caterer", lowCost: 20, highCost: 40, unit: "per_person", notes: "Tea, snacks, traditional sweets" },
      { category: "Decoration", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Phulkari fabrics, marigolds, rangoli" },
    ],
  },
  {
    ceremonyId: "sikh_chooda_kalire",
    name: "Chooda & Kalire",
    description: "Ceremony where mama (uncle) gifts the bride red bangles and kalire",
    tradition: "sikh",
    costPerGuestLow: "30",
    costPerGuestHigh: "70",
    defaultGuests: 40,
    displayOrder: 6,
    costBreakdown: [
      { category: "Venue (typically home)", lowCost: 0, highCost: 500, unit: "fixed", notes: "Held at bride's home" },
      { category: "Photographer", lowCost: 500, highCost: 1200, unit: "fixed", notes: "2-3 hour coverage" },
      { category: "Caterer", lowCost: 25, highCost: 50, unit: "per_person", notes: "Light breakfast and chai" },
      { category: "Decoration", lowCost: 200, highCost: 800, unit: "fixed", notes: "Simple floral arrangements" },
      { category: "Chooda Set", lowCost: 200, highCost: 1000, unit: "fixed", notes: "Red and white bangles" },
      { category: "Kalire", lowCost: 100, highCost: 500, unit: "fixed", notes: "Gold or silver kalire" },
    ],
  },
  {
    ceremonyId: "sikh_jaggo",
    name: "Jaggo",
    description: "Evening celebration with decorated pot and dancing through the neighborhood",
    tradition: "sikh",
    costPerGuestLow: "20",
    costPerGuestHigh: "50",
    defaultGuests: 100,
    displayOrder: 7,
    costBreakdown: [
      { category: "Dhol Players", lowCost: 400, highCost: 1000, unit: "fixed", notes: "Multiple dhol players for procession" },
      { category: "Decoration", lowCost: 200, highCost: 600, unit: "fixed", notes: "Decorated pot and supplies" },
      { category: "Caterer", lowCost: 15, highCost: 30, unit: "per_person", notes: "Late night snacks" },
      { category: "Photographer", lowCost: 400, highCost: 1000, unit: "fixed", notes: "2 hour coverage" },
    ],
  },
  {
    ceremonyId: "sikh_anand_karaj",
    name: "Anand Karaj",
    description: "Sacred Sikh wedding ceremony at the Gurdwara",
    tradition: "sikh",
    costPerGuestLow: "80",
    costPerGuestHigh: "180",
    defaultGuests: 300,
    displayOrder: 8,
    costBreakdown: [
      { category: "Venue (typically a Sikh Temple)", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Gurdwara venue (often by donation)" },
      { category: "Photographer", lowCost: 2500, highCost: 6000, unit: "fixed", notes: "Full ceremony coverage" },
      { category: "Caterer", lowCost: 25, highCost: 55, unit: "per_person", notes: "Langar or catered lunch" },
      { category: "Decoration", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "Florals and minimal decor" },
      { category: "Gurdwara Bheta / Donation", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Donation to the Gurdwara" },
      { category: "Rumalla Sahib", lowCost: 150, highCost: 600, unit: "fixed", notes: "Sacred cloth offering" },
      { category: "Raagi Jatha / Kirtan Musicians", lowCost: 600, highCost: 2000, unit: "fixed", notes: "Professional kirtan group" },
      { category: "Horse Rental", lowCost: 600, highCost: 1800, unit: "fixed", notes: "Decorated horse for groom's arrival" },
      { category: "Car Rental", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Luxury vehicle for couple" },
      { category: "Makeup", lowCost: 300, highCost: 800, unit: "fixed", notes: "Bride's makeup and styling" },
      { category: "Dhol Player", lowCost: 400, highCost: 1000, unit: "fixed", notes: "2-4 dhol players for baraat" },
      { category: "Turban Tier", lowCost: 300, highCost: 1200, unit: "fixed", notes: "Professional turban tying service for groom and male family members" },
      { category: "Attire for Groom", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Sherwani, turban, accessories" },
      { category: "Attire for Bride", lowCost: 1000, highCost: 8000, unit: "fixed", notes: "Lehenga, jewelry, dupatta" },
      { category: "Attire for Groom's side", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Family attire" },
      { category: "Attire for Bride's side", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Family attire" },
      { category: "Hotels for Guests", lowCost: 1000, highCost: 5000, unit: "fixed", notes: "Room blocks for out-of-town guests" },
      { category: "Transportation for Guests", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Shuttle or bus service" },
    ],
  },
  {
    ceremonyId: "sikh_baraat",
    name: "Baraat",
    description: "Groom's wedding procession to the ceremony venue",
    tradition: "sikh",
    costPerGuestLow: "30",
    costPerGuestHigh: "80",
    defaultGuests: 100,
    displayOrder: 9,
    costBreakdown: [
      { category: "Horse Rental", lowCost: 600, highCost: 1800, unit: "fixed", notes: "Decorated horse for groom" },
      { category: "Dhol Players", lowCost: 400, highCost: 1200, unit: "fixed", notes: "2-4 dhol players" },
      { category: "Decoration", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Umbrella, garlands, decorations" },
      { category: "Snacks/Drinks", lowCost: 300, highCost: 800, unit: "fixed", notes: "Refreshments for procession" },
      { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Baraat coverage" },
    ],
  },
  {
    ceremonyId: "sikh_milni",
    name: "Milni",
    description: "Formal meeting of the two families before the ceremony",
    tradition: "sikh",
    costPerGuestLow: "20",
    costPerGuestHigh: "50",
    defaultGuests: 50,
    displayOrder: 10,
    costBreakdown: [
      { category: "Garlands", lowCost: 100, highCost: 400, unit: "fixed", notes: "For family members exchange" },
      { category: "Gifts / Shagun", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Traditional gifts" },
      { category: "Photographer", lowCost: 300, highCost: 800, unit: "fixed", notes: "1 hour coverage" },
      { category: "Snacks/Drinks", lowCost: 200, highCost: 500, unit: "fixed", notes: "Light refreshments" },
    ],
  },
  {
    ceremonyId: "sikh_reception",
    name: "Reception",
    description: "Grand celebration following the wedding ceremony",
    tradition: "sikh",
    costPerGuestLow: "120",
    costPerGuestHigh: "250",
    defaultGuests: 300,
    displayOrder: 11,
    costBreakdown: [
      { category: "Venue", lowCost: 5000, highCost: 25000, unit: "fixed", notes: "Hotel ballroom or banquet hall" },
      { category: "Photographer", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full reception coverage" },
      { category: "Caterer", lowCost: 75, highCost: 150, unit: "per_person", notes: "Multi-course dinner with bar" },
      { category: "Decoration", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Centerpieces, stage, lighting" },
      { category: "DJ", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "DJ with MC services" },
      { category: "Dhol Player", lowCost: 400, highCost: 1000, unit: "fixed", notes: "For couple's entrance" },
      { category: "Makeup", lowCost: 300, highCost: 800, unit: "fixed", notes: "Bride's reception look" },
      { category: "Entertainment (Singers, Bands, Bhangra Teams)", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Live band or performers" },
      { category: "Bartenders", lowCost: 300, highCost: 800, unit: "fixed", notes: "Professional bartender service" },
      { category: "Alcohol / Drinks", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Full bar service" },
      { category: "Attire for Groom", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Reception outfit" },
      { category: "Attire for Bride", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Reception lehenga or gown" },
      { category: "Transportation for Guests", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Shuttle or bus service" },
      { category: "Limo rental", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Luxury vehicle for couple" },
    ],
  },

  // ============ HINDU CEREMONIES ============
  {
    ceremonyId: "hindu_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony with music and celebration",
    tradition: "hindu",
    costPerGuestLow: "50",
    costPerGuestHigh: "120",
    defaultGuests: 100,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue (typically home)", lowCost: 0, highCost: 3000, unit: "fixed", notes: "Backyard setups are popular" },
      { category: "Photographer", lowCost: 1000, highCost: 2500, unit: "fixed", notes: "4-hour coverage" },
      { category: "Caterer", lowCost: 35, highCost: 65, unit: "per_person", notes: "Chaat stations or finger foods" },
      { category: "Decoration", lowCost: 1500, highCost: 4500, unit: "fixed", notes: "Drapes, pillows, mehndi swings" },
      { category: "Henna Artist (Bride)", lowCost: 300, highCost: 800, unit: "fixed", notes: "Intricate designs for hands and feet" },
      { category: "Henna Artists (Guests)", lowCost: 100, highCost: 150, unit: "per_hour", hoursLow: 3, hoursHigh: 4, notes: "2+ artists for guests" },
      { category: "Entertainment", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Dhol player or DJ" },
    ],
  },
  {
    ceremonyId: "hindu_sangeet",
    name: "Sangeet",
    description: "Pre-wedding music and dance night",
    tradition: "hindu",
    costPerGuestLow: "80",
    costPerGuestHigh: "180",
    defaultGuests: 150,
    displayOrder: 2,
    costBreakdown: [
      { category: "Venue", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Banquet hall or hotel ballroom" },
      { category: "Photographer", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Full event coverage" },
      { category: "Caterer", lowCost: 50, highCost: 100, unit: "per_person", notes: "Full dinner service" },
      { category: "Decoration", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Stage for performances, backdrop" },
      { category: "DJ", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "DJ, MC, sound system" },
      { category: "Choreographer", lowCost: 500, highCost: 2500, unit: "fixed", notes: "For family performances" },
      { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "1-2 dhol players" },
    ],
  },
  {
    ceremonyId: "hindu_haldi",
    name: "Haldi",
    description: "Turmeric cleansing ceremony",
    tradition: "hindu",
    costPerGuestLow: "30",
    costPerGuestHigh: "70",
    defaultGuests: 50,
    displayOrder: 3,
    costBreakdown: [
      { category: "Venue (typically home)", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually at home" },
      { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
      { category: "Caterer", lowCost: 25, highCost: 50, unit: "per_person", notes: "Light breakfast or brunch" },
      { category: "Decoration", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Yellow/marigold themed" },
      { category: "Haldi Supplies", lowCost: 100, highCost: 300, unit: "fixed", notes: "Turmeric paste, flowers" },
      { category: "Music", lowCost: 0, highCost: 500, unit: "fixed", notes: "DIY playlist or speaker" },
    ],
  },
  {
    ceremonyId: "hindu_baraat",
    name: "Baraat",
    description: "Groom's wedding procession",
    tradition: "hindu",
    costPerGuestLow: "25",
    costPerGuestHigh: "60",
    defaultGuests: 100,
    displayOrder: 4,
    costBreakdown: [
      { category: "Horse/Carriage", lowCost: 500, highCost: 1500, unit: "fixed", notes: "White horse with decorated saddle" },
      { category: "Baraat Band", lowCost: 800, highCost: 2000, unit: "fixed", notes: "Traditional brass band" },
      { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "2-4 dhol players" },
      { category: "Decorations", lowCost: 200, highCost: 600, unit: "fixed", notes: "Umbrella, flower garlands" },
      { category: "Snacks/Drinks", lowCost: 200, highCost: 500, unit: "fixed", notes: "Light refreshments" },
    ],
  },
  {
    ceremonyId: "hindu_wedding",
    name: "Hindu Wedding Ceremony",
    description: "Sacred wedding ceremony with traditional rituals",
    tradition: "hindu",
    costPerGuestLow: "100",
    costPerGuestHigh: "220",
    defaultGuests: 250,
    displayOrder: 5,
    costBreakdown: [
      { category: "Venue", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple, banquet hall, or hotel" },
      { category: "Photographer", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full ceremony coverage" },
      { category: "Caterer", lowCost: 60, highCost: 120, unit: "per_person", notes: "Vegetarian feast" },
      { category: "Decoration", lowCost: 3000, highCost: 12000, unit: "fixed", notes: "Stage, aisle, centerpieces" },
      { category: "Mandap Setup", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Decorated wedding canopy" },
      { category: "Priest/Pandit", lowCost: 500, highCost: 1500, unit: "fixed", notes: "For performing ceremony" },
      { category: "Music/Sound", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Sound system for mantras" },
    ],
  },

  // ============ MUSLIM CEREMONIES ============
  {
    ceremonyId: "muslim_nikah",
    name: "Nikah",
    description: "Islamic marriage ceremony",
    tradition: "muslim",
    costPerGuestLow: "60",
    costPerGuestHigh: "140",
    defaultGuests: 200,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue Rental", lowCost: 2000, highCost: 10000, unit: "fixed", notes: "Mosque, banquet hall, or home" },
      { category: "Imam/Officiant", lowCost: 300, highCost: 800, unit: "fixed", notes: "For performing the Nikah" },
      { category: "Decor", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "Stage setup, florals" },
      { category: "Catering", lowCost: 40, highCost: 80, unit: "per_person", notes: "Halal catering" },
      { category: "Photography", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Ceremony coverage" },
      { category: "Mehr Display", lowCost: 200, highCost: 1000, unit: "fixed", notes: "Decorative presentation of bridal gift" },
    ],
  },
  {
    ceremonyId: "muslim_walima",
    name: "Walima",
    description: "Wedding reception hosted by the groom's family",
    tradition: "muslim",
    costPerGuestLow: "80",
    costPerGuestHigh: "180",
    defaultGuests: 250,
    displayOrder: 2,
    costBreakdown: [
      { category: "Venue Rental", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Banquet hall or hotel" },
      { category: "Catering", lowCost: 60, highCost: 120, unit: "per_person", notes: "Full halal dinner service" },
      { category: "Decor", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Elegant decor and florals" },
      { category: "Entertainment", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "DJ or live music" },
      { category: "Photography/Video", lowCost: 2000, highCost: 5000, unit: "fixed", notes: "Full event coverage" },
    ],
  },
  {
    ceremonyId: "muslim_dholki",
    name: "Dholki",
    description: "Pre-wedding music celebration with traditional drumming",
    tradition: "muslim",
    costPerGuestLow: "30",
    costPerGuestHigh: "70",
    defaultGuests: 75,
    displayOrder: 3,
    costBreakdown: [
      { category: "Venue / Home Setup", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Often held at home" },
      { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "Traditional drummers" },
      { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Colorful textiles, lights" },
      { category: "Catering", lowCost: 25, highCost: 50, unit: "per_person", notes: "Appetizers and chai" },
      { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "3-4 hour coverage" },
    ],
  },

  // ============ GUJARATI CEREMONIES ============
  {
    ceremonyId: "gujarati_pithi",
    name: "Pithi",
    description: "Turmeric cleansing ceremony",
    tradition: "gujarati",
    costPerGuestLow: "25",
    costPerGuestHigh: "60",
    defaultGuests: 50,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue / Home Setup", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at home" },
      { category: "Pithi Supplies", lowCost: 100, highCost: 300, unit: "fixed", notes: "Turmeric paste, oils, flowers" },
      { category: "Decor", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Yellow/green themed decorations" },
      { category: "Catering", lowCost: 20, highCost: 45, unit: "per_person", notes: "Light breakfast/snacks" },
      { category: "Photography", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    ],
  },
  {
    ceremonyId: "gujarati_garba",
    name: "Garba Night",
    description: "Traditional folk dance celebration",
    tradition: "gujarati",
    costPerGuestLow: "50",
    costPerGuestHigh: "120",
    defaultGuests: 150,
    displayOrder: 2,
    costBreakdown: [
      { category: "Venue Rental", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Banquet hall with dance floor" },
      { category: "Live Band/DJ", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Garba music specialists" },
      { category: "Decor", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "Colorful traditional decor" },
      { category: "Dandiya Sticks", lowCost: 100, highCost: 300, unit: "fixed", notes: "For all guests" },
      { category: "Catering", lowCost: 30, highCost: 60, unit: "per_person", notes: "Gujarati snacks and dinner" },
      { category: "Photography", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "Full event coverage" },
    ],
  },
  {
    ceremonyId: "gujarati_wedding",
    name: "Gujarati Wedding",
    description: "Traditional Gujarati wedding ceremony",
    tradition: "gujarati",
    costPerGuestLow: "90",
    costPerGuestHigh: "200",
    defaultGuests: 250,
    displayOrder: 3,
    costBreakdown: [
      { category: "Venue Rental", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple or banquet hall" },
      { category: "Mandap Setup", lowCost: 2000, highCost: 7000, unit: "fixed", notes: "Traditional wedding canopy" },
      { category: "Priest", lowCost: 500, highCost: 1200, unit: "fixed", notes: "For performing rituals" },
      { category: "Catering", lowCost: 50, highCost: 100, unit: "per_person", notes: "Gujarati vegetarian feast" },
      { category: "Photography", lowCost: 2500, highCost: 6000, unit: "fixed", notes: "Full ceremony coverage" },
      { category: "Decor", lowCost: 3000, highCost: 10000, unit: "fixed", notes: "Florals and decorations" },
    ],
  },

  // ============ SOUTH INDIAN CEREMONIES ============
  {
    ceremonyId: "south_indian_muhurtham",
    name: "Muhurtham",
    description: "South Indian wedding ceremony",
    tradition: "south_indian",
    costPerGuestLow: "80",
    costPerGuestHigh: "180",
    defaultGuests: 300,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue Rental", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple or convention center" },
      { category: "Priest", lowCost: 500, highCost: 1500, unit: "fixed", notes: "For performing rituals" },
      { category: "Mandap Setup", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Traditional setup with banana stalks" },
      { category: "Nadaswaram", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Traditional musicians" },
      { category: "Catering", lowCost: 40, highCost: 80, unit: "per_person", notes: "Traditional banana leaf meal" },
      { category: "Photography", lowCost: 2500, highCost: 6000, unit: "fixed", notes: "Full ceremony coverage" },
      { category: "Decor", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Flowers and traditional elements" },
    ],
  },

  // ============ GENERAL / COMMON CEREMONIES ============
  {
    ceremonyId: "reception",
    name: "Reception",
    description: "Grand celebration following the wedding",
    tradition: "general",
    costPerGuestLow: "100",
    costPerGuestHigh: "250",
    defaultGuests: 250,
    displayOrder: 1,
    costBreakdown: [
      { category: "Venue", lowCost: 5000, highCost: 25000, unit: "fixed", notes: "Hotel ballroom or banquet hall" },
      { category: "Photographer", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full reception coverage" },
      { category: "Caterer", lowCost: 75, highCost: 175, unit: "per_person", notes: "Multi-course dinner" },
      { category: "Decoration", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Centerpieces, uplighting" },
      { category: "DJ", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "DJ, MC, dance floor lighting" },
      { category: "Dhol Player", lowCost: 400, highCost: 1000, unit: "fixed", notes: "For couple's entrance" },
      { category: "Makeup", lowCost: 300, highCost: 800, unit: "fixed", notes: "Bride's reception look" },
      { category: "Entertainment (Singers, Bands, Bhangra Teams)", lowCost: 1500, highCost: 6000, unit: "fixed", notes: "Live performers" },
    ],
  },
  {
    ceremonyId: "general_wedding",
    name: "Wedding Ceremony",
    description: "General wedding ceremony",
    tradition: "general",
    costPerGuestLow: "80",
    costPerGuestHigh: "200",
    defaultGuests: 150,
    displayOrder: 2,
    costBreakdown: [
      { category: "Venue", lowCost: 3000, highCost: 15000, unit: "fixed", notes: "Venue rental" },
      { category: "Photographer", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Ceremony coverage" },
      { category: "Caterer", lowCost: 50, highCost: 120, unit: "per_person", notes: "Dinner service" },
      { category: "Decoration", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Florals and decor" },
      { category: "DJ", lowCost: 1000, highCost: 3000, unit: "fixed", notes: "Music and sound" },
      { category: "Officiant", lowCost: 200, highCost: 800, unit: "fixed", notes: "Wedding officiant" },
    ],
  },
  {
    ceremonyId: "rehearsal_dinner",
    name: "Rehearsal Dinner",
    description: "Pre-wedding dinner for wedding party and close family",
    tradition: "general",
    costPerGuestLow: "60",
    costPerGuestHigh: "150",
    defaultGuests: 40,
    displayOrder: 3,
    costBreakdown: [
      { category: "Venue", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Restaurant or private room" },
      { category: "Caterer", lowCost: 50, highCost: 100, unit: "per_person", notes: "Sit-down dinner" },
      { category: "Decoration", lowCost: 200, highCost: 800, unit: "fixed", notes: "Simple centerpieces" },
      { category: "Alcohol / Drinks", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Wine and drinks" },
    ],
  },
  {
    ceremonyId: "cocktail_hour",
    name: "Cocktail Hour",
    description: "Pre-reception social hour with drinks and appetizers",
    tradition: "general",
    costPerGuestLow: "30",
    costPerGuestHigh: "80",
    defaultGuests: 150,
    displayOrder: 4,
    costBreakdown: [
      { category: "Caterer", lowCost: 20, highCost: 50, unit: "per_person", notes: "Appetizers and hors d'oeuvres" },
      { category: "Bartenders", lowCost: 200, highCost: 600, unit: "fixed", notes: "Professional bar service" },
      { category: "Alcohol / Drinks", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Signature cocktails and bar" },
      { category: "Music", lowCost: 200, highCost: 800, unit: "fixed", notes: "Background music" },
    ],
  },
];

async function seedCeremonyTemplates() {
  console.log("Starting ceremony template seeding...");

  for (const ceremony of CEREMONY_DEFINITIONS) {
    // Add budgetBucket to each cost breakdown item
    const costBreakdownWithBuckets: CeremonyTemplateCostItem[] = ceremony.costBreakdown.map(item => ({
      ...item,
      budgetBucket: getLineItemBucket(item.category),
    }));

    try {
      // Check if ceremony already exists
      const existing = await db
        .select()
        .from(ceremonyTemplates)
        .where(eq(ceremonyTemplates.ceremonyId, ceremony.ceremonyId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(ceremonyTemplates)
          .set({
            name: ceremony.name,
            description: ceremony.description,
            tradition: ceremony.tradition,
            costPerGuestLow: ceremony.costPerGuestLow,
            costPerGuestHigh: ceremony.costPerGuestHigh,
            defaultGuests: ceremony.defaultGuests,
            displayOrder: ceremony.displayOrder,
            costBreakdown: costBreakdownWithBuckets,
            updatedAt: new Date(),
          })
          .where(eq(ceremonyTemplates.ceremonyId, ceremony.ceremonyId));
        console.log(`Updated: ${ceremony.ceremonyId}`);
      } else {
        // Insert new
        await db.insert(ceremonyTemplates).values({
          ceremonyId: ceremony.ceremonyId,
          name: ceremony.name,
          description: ceremony.description,
          tradition: ceremony.tradition,
          costPerGuestLow: ceremony.costPerGuestLow,
          costPerGuestHigh: ceremony.costPerGuestHigh,
          defaultGuests: ceremony.defaultGuests,
          displayOrder: ceremony.displayOrder,
          costBreakdown: costBreakdownWithBuckets,
          isActive: true,
        });
        console.log(`Inserted: ${ceremony.ceremonyId}`);
      }
    } catch (error) {
      console.error(`Error processing ${ceremony.ceremonyId}:`, error);
    }
  }

  console.log("Ceremony template seeding complete!");
}

seedCeremonyTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
