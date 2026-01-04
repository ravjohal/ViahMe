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
  // ============ SIKH CEREMONIES (11 Total) ============
  
  // 1. Roka - Together
  sikh_roka: [
    { category: "Venue (typically at home)", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at home" },
    { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 30, highCost: 60, unit: "per_person", notes: "Snacks and light meal" },
    { category: "Decoration", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Simple home decor" },
    { category: "Makeup", lowCost: 150, highCost: 400, unit: "fixed", notes: "Bride's makeup" },
    { category: "Shagun / Gifts", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Traditional gifts exchanged" },
  ],
  
  // 2. Engagement - Together
  sikh_engagement: [
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
  
  // 3. Chunni Chadana - Together
  sikh_chunni_chadana: [
    { category: "Venue (typically a home)", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually held at bride's home" },
    { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 25, highCost: 50, unit: "per_person", notes: "Snacks and light meal" },
    { category: "Decoration", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Simple elegant decor" },
    { category: "Gifts / Shagun", lowCost: 500, highCost: 3000, unit: "fixed", notes: "Chunni and traditional gifts" },
  ],
  
  // 4. Paath (Akhand Paath / Sehaj Paath) - Separate (Bride & Groom)
  sikh_paath: [
    { category: "Venue", lowCost: 0, highCost: 1000, unit: "fixed", notes: "Often at Gurdwara or home" },
    { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 20, highCost: 45, unit: "per_person", notes: "Langar-style meal" },
    { category: "Decoration", lowCost: 200, highCost: 800, unit: "fixed", notes: "Simple floral arrangements" },
    { category: "Gurdwara Bheta / Donation", lowCost: 200, highCost: 1000, unit: "fixed", notes: "Donation to the Gurdwara" },
    { category: "Rumalla Sahib", lowCost: 100, highCost: 500, unit: "fixed", notes: "Sacred cloth for Guru Granth Sahib" },
    { category: "Raagi Jatha / Kirtan Musicians", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Professional kirtan musicians" },
    { category: "Turban Tier", lowCost: 150, highCost: 500, unit: "fixed", notes: "Professional turban tying service for groom and male family" },
  ],
  
  // 5. Mehndi - Separate (Bride & Groom)
  sikh_mehndi: [
    { category: "Venue (typically home)", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Often held at home or small venue" },
    { category: "Photographer", lowCost: 800, highCost: 2000, unit: "fixed", notes: "3-4 hour coverage" },
    { category: "Caterer", lowCost: 30, highCost: 60, unit: "per_person", notes: "Chaat and finger foods" },
    { category: "Decoration", lowCost: 1000, highCost: 4000, unit: "fixed", notes: "Colorful drapes, cushions, florals" },
  ],
  
  // 6. Bakra Party - Groom's Side Only
  sikh_bakra_party: [
    { category: "Venue (typically home)", lowCost: 0, highCost: 2000, unit: "fixed", notes: "Often held at home or backyard" },
    { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 40, highCost: 80, unit: "per_person", notes: "Meat-based feast" },
    { category: "Decoration", lowCost: 300, highCost: 1500, unit: "fixed", notes: "Simple party decor" },
    { category: "Alcohol / Drinks", lowCost: 500, highCost: 2500, unit: "fixed", notes: "Full bar service" },
    { category: "DJ", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Music and sound system" },
  ],
  
  // 7. Mayian (Choora / Vatna) - Separate (Bride & Groom)
  sikh_mayian: [
    { category: "Venue (typically home)", lowCost: 0, highCost: 500, unit: "fixed", notes: "Traditionally held at home" },
    { category: "Photographer", lowCost: 500, highCost: 1200, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 20, highCost: 40, unit: "per_person", notes: "Tea, snacks, traditional sweets" },
    { category: "Decoration", lowCost: 300, highCost: 1000, unit: "fixed", notes: "Phulkari fabrics, marigolds, rangoli" },
  ],
  
  // 8. Sangeet - Separate (Bride & Groom)
  sikh_sangeet: [
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
  
  // 9. Anand Karaj (The Wedding Ceremony) - Together
  sikh_anand_karaj: [
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
  
  // 10. Reception - Together
  sikh_reception: [
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
  
  // 11. Day After Visit - Together
  sikh_day_after: [
    { category: "Caterer", lowCost: 25, highCost: 50, unit: "per_person", notes: "Brunch or lunch" },
    { category: "Decoration", lowCost: 100, highCost: 400, unit: "fixed", notes: "Simple home decor" },
    { category: "DJ", lowCost: 0, highCost: 500, unit: "fixed", notes: "Optional background music" },
    { category: "Alcohol / Drinks", lowCost: 200, highCost: 800, unit: "fixed", notes: "Light refreshments" },
  ],

  // ============ HINDU CEREMONIES ============
  hindu_mehndi: [
    { category: "Venue (typically home)", lowCost: 0, highCost: 3000, unit: "fixed", notes: "Backyard setups are popular" },
    { category: "Photographer", lowCost: 1000, highCost: 2500, unit: "fixed", notes: "4-hour coverage" },
    { category: "Caterer", lowCost: 35, highCost: 65, unit: "per_person", notes: "Chaat stations or finger foods" },
    { category: "Decoration", lowCost: 1500, highCost: 4500, unit: "fixed", notes: "Drapes, pillows, mehndi swings" },
    { category: "Henna Artist (Bride)", lowCost: 300, highCost: 800, unit: "fixed", notes: "Intricate designs for hands and feet" },
    { category: "Henna Artists (Guests)", lowCost: 100, highCost: 150, unit: "per_hour", hoursLow: 3, hoursHigh: 4, notes: "2+ artists for guests" },
    { category: "Entertainment", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Dhol player or DJ" },
  ],
  hindu_sangeet: [
    { category: "Venue", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Banquet hall or hotel ballroom" },
    { category: "Photographer", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "Full event coverage" },
    { category: "Caterer", lowCost: 50, highCost: 100, unit: "per_person", notes: "Full dinner service" },
    { category: "Decoration", lowCost: 2000, highCost: 6000, unit: "fixed", notes: "Stage for performances, backdrop" },
    { category: "DJ", lowCost: 1500, highCost: 4000, unit: "fixed", notes: "DJ, MC, sound system" },
    { category: "Choreographer", lowCost: 500, highCost: 2500, unit: "fixed", notes: "For family performances" },
    { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "1-2 dhol players" },
  ],
  hindu_haldi: [
    { category: "Venue (typically home)", lowCost: 0, highCost: 1500, unit: "fixed", notes: "Usually at home" },
    { category: "Photographer", lowCost: 500, highCost: 1500, unit: "fixed", notes: "2-3 hour coverage" },
    { category: "Caterer", lowCost: 25, highCost: 50, unit: "per_person", notes: "Light breakfast or brunch" },
    { category: "Decoration", lowCost: 500, highCost: 2000, unit: "fixed", notes: "Yellow/marigold themed" },
    { category: "Haldi Supplies", lowCost: 100, highCost: 300, unit: "fixed", notes: "Turmeric paste, flowers" },
    { category: "Music", lowCost: 0, highCost: 500, unit: "fixed", notes: "DIY playlist or speaker" },
  ],
  hindu_baraat: [
    { category: "Horse/Carriage", lowCost: 500, highCost: 1500, unit: "fixed", notes: "White horse with decorated saddle" },
    { category: "Baraat Band", lowCost: 800, highCost: 2000, unit: "fixed", notes: "Traditional brass band" },
    { category: "Dhol Players", lowCost: 300, highCost: 800, unit: "fixed", notes: "2-4 dhol players" },
    { category: "Decorations", lowCost: 200, highCost: 600, unit: "fixed", notes: "Umbrella, flower garlands" },
    { category: "Snacks/Drinks", lowCost: 200, highCost: 500, unit: "fixed", notes: "Light refreshments" },
  ],
  hindu_wedding: [
    { category: "Venue", lowCost: 5000, highCost: 20000, unit: "fixed", notes: "Temple, banquet hall, or hotel" },
    { category: "Photographer", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full ceremony coverage" },
    { category: "Caterer", lowCost: 60, highCost: 120, unit: "per_person", notes: "Vegetarian feast" },
    { category: "Decoration", lowCost: 3000, highCost: 12000, unit: "fixed", notes: "Stage, aisle, centerpieces" },
    { category: "Mandap Setup", lowCost: 2000, highCost: 8000, unit: "fixed", notes: "Decorated wedding canopy" },
    { category: "Priest/Pandit", lowCost: 500, highCost: 1500, unit: "fixed", notes: "For performing ceremony" },
    { category: "Music/Sound", lowCost: 500, highCost: 1500, unit: "fixed", notes: "Sound system for mantras" },
  ],
  reception: [
    { category: "Venue", lowCost: 5000, highCost: 25000, unit: "fixed", notes: "Hotel ballroom or banquet hall" },
    { category: "Photographer", lowCost: 3000, highCost: 8000, unit: "fixed", notes: "Full reception coverage" },
    { category: "Caterer", lowCost: 75, highCost: 175, unit: "per_person", notes: "Multi-course dinner" },
    { category: "Decoration", lowCost: 4000, highCost: 15000, unit: "fixed", notes: "Centerpieces, uplighting" },
    { category: "DJ", lowCost: 1500, highCost: 5000, unit: "fixed", notes: "DJ, MC, dance floor lighting" },
    { category: "Dhol Player", lowCost: 400, highCost: 1000, unit: "fixed", notes: "For couple's entrance" },
    { category: "Makeup", lowCost: 300, highCost: 800, unit: "fixed", notes: "Bride's reception look" },
    { category: "Entertainment (Singers, Bands, Bhangra Teams)", lowCost: 1500, highCost: 6000, unit: "fixed", notes: "Live performers" },
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
    traditions: ["hindu", "south_indian", "mixed"],
  },
  {
    id: "hindu_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony for the bride",
    costPerGuestLow: 40,
    costPerGuestHigh: 80,
    defaultGuests: 100,
    traditions: ["hindu", "muslim", "gujarati", "south_indian", "mixed"],
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
    traditions: ["hindu"],
  },
  {
    id: "reception",
    name: "Reception",
    description: "Post-wedding celebration with dinner and dancing",
    costPerGuestLow: 100,
    costPerGuestHigh: 200,
    defaultGuests: 300,
    traditions: ["hindu", "muslim", "gujarati", "south_indian", "mixed", "general"],
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
  },
  {
    id: "sikh_engagement",
    name: "Engagement",
    description: "Formal engagement ceremony with ring exchange and celebrations",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 100,
    traditions: ["sikh"],
  },
  {
    id: "sikh_chunni_chadana",
    name: "Chunni Chadana",
    description: "Ceremony where groom's family presents chunni to the bride",
    costPerGuestLow: 35,
    costPerGuestHigh: 70,
    defaultGuests: 50,
    traditions: ["sikh"],
  },
  {
    id: "sikh_paath",
    name: "Paath (Akhand Paath / Sehaj Paath)",
    description: "Sacred prayer reading at Gurdwara or home",
    costPerGuestLow: 35,
    costPerGuestHigh: 70,
    defaultGuests: 75,
    traditions: ["sikh"],
  },
  {
    id: "sikh_mehndi",
    name: "Mehndi",
    description: "Henna application ceremony",
    costPerGuestLow: 35,
    costPerGuestHigh: 75,
    defaultGuests: 80,
    traditions: ["sikh"],
  },
  {
    id: "sikh_bakra_party",
    name: "Bakra Party",
    description: "Groom's side pre-wedding celebration with meat feast",
    costPerGuestLow: 50,
    costPerGuestHigh: 100,
    defaultGuests: 75,
    traditions: ["sikh"],
  },
  {
    id: "sikh_mayian",
    name: "Mayian (Choora / Vatna)",
    description: "Turmeric ceremony with choora (red bangles)",
    costPerGuestLow: 25,
    costPerGuestHigh: 50,
    defaultGuests: 50,
    traditions: ["sikh"],
  },
  {
    id: "sikh_sangeet",
    name: "Sangeet",
    description: "Musical night with performances and Bhangra dancing",
    costPerGuestLow: 75,
    costPerGuestHigh: 150,
    defaultGuests: 150,
    traditions: ["sikh"],
  },
  {
    id: "sikh_anand_karaj",
    name: "Anand Karaj",
    description: "Sikh wedding ceremony at the Gurdwara",
    costPerGuestLow: 60,
    costPerGuestHigh: 120,
    defaultGuests: 250,
    traditions: ["sikh"],
  },
  {
    id: "sikh_reception",
    name: "Reception",
    description: "Post-wedding celebration with dinner and entertainment",
    costPerGuestLow: 100,
    costPerGuestHigh: 200,
    defaultGuests: 300,
    traditions: ["sikh"],
  },
  {
    id: "sikh_day_after",
    name: "Day After Visit",
    description: "Post-wedding family visit and brunch",
    costPerGuestLow: 30,
    costPerGuestHigh: 60,
    defaultGuests: 40,
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
    traditions: ["general", "mixed", "hindu", "gujarati", "south_indian"],
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
