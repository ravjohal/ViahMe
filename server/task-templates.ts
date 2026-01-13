export type TaskPhase = 'vision' | 'curation' | 'logistics' | 'home_stretch';

export interface TaskTemplate {
  id: string;
  task: string;
  category: string;
  description: string;
  ceremony?: string;
  priority?: 'high' | 'medium' | 'low';
  daysBeforeWedding?: number;
  phase?: TaskPhase;
}

export function getPhaseFromDays(daysBeforeWedding: number | undefined): TaskPhase {
  if (!daysBeforeWedding) return 'logistics';
  if (daysBeforeWedding >= 365) return 'vision';        // 12+ months
  if (daysBeforeWedding >= 180) return 'curation';      // 6-12 months
  if (daysBeforeWedding >= 30) return 'logistics';      // 1-6 months
  return 'home_stretch';                                 // < 1 month
}

export const PHASE_INFO: Record<TaskPhase, { title: string; description: string; order: number }> = {
  vision: { 
    title: "The Vision Phase", 
    description: "12+ months out: Set the foundation with guest list, budget, and venue",
    order: 1 
  },
  curation: { 
    title: "The Curation Phase", 
    description: "6-9 months out: Book tradition-specific vendors, attire, photographer",
    order: 2 
  },
  logistics: { 
    title: "The Logistics Phase", 
    description: "3 months out: Handle invitations, marriage license, hotel blocks",
    order: 3 
  },
  home_stretch: { 
    title: "The Home Stretch", 
    description: "1 month out: Finalize seating charts, welcome bags, final fittings",
    order: 4 
  },
};

export const HINDU_TASKS: TaskTemplate[] = [
  { id: "H01", task: "Book Mandap and Decorator", category: "Decor", description: "Ensure the Mandap allows for a small sacred fire (Havan).", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "H02", task: "Hire Hindu Priest/Pandit", category: "Officiant", description: "Confirm dialect and if they provide puja samagri.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "H03", task: "Source Puja Samagri", category: "Rituals", description: "Ghee, incense, camphor, and copper vessels.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "H04", task: "Arrange Groom's Baraat", category: "Logistics", description: "Book a horse, exotic car, or mobile DJ truck.", ceremony: "Baraat", priority: "high", daysBeforeWedding: 90 },
  { id: "H05", task: "Purchase Varmalas", category: "Florals", description: "Fresh flower garlands for the initial exchange.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 14 },
  { id: "H06", task: "Order Mangalsutra and Sindoor", category: "Attire/Jewelry", description: "The sacred necklace and vermilion for the ceremony.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "H07", task: "Organize Haldi/Pithi Ceremony", category: "Pre-Wedding", description: "Source turmeric powder and coordinated outfits.", ceremony: "Haldi", priority: "medium", daysBeforeWedding: 45 },
  { id: "H08", task: "Plan Mehndi Event", category: "Pre-Wedding", description: "Book henna artists for bride and family.", ceremony: "Mehndi", priority: "high", daysBeforeWedding: 60 },
  { id: "H09", task: "Source Saptapadi Markers", category: "Rituals", description: "Items for the 'Seven Steps' around the fire.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "H10", task: "Create Ritual Guide for Guests", category: "Experience", description: "Explain the Pheras and rituals to non-Hindu guests.", ceremony: "Wedding Ceremony", priority: "low", daysBeforeWedding: 21 },
  { id: "H11", task: "Book Sangeet Venue and DJ", category: "Entertainment", description: "Secure venue and entertainment for the musical celebration.", ceremony: "Sangeet", priority: "high", daysBeforeWedding: 120 },
  { id: "H12", task: "Choreograph Sangeet Dances", category: "Entertainment", description: "Arrange dance practices for family performances.", ceremony: "Sangeet", priority: "medium", daysBeforeWedding: 60 },
  { id: "H13", task: "Plan Tilak/Sagai Ceremony", category: "Pre-Wedding", description: "Arrange gifts and ceremony items for formal engagement.", ceremony: "Tilak", priority: "medium", daysBeforeWedding: 90 },
  { id: "H14", task: "Arrange Vidaai Ceremony Items", category: "Rituals", description: "Rice, flower petals, and decorated car for bride's departure.", ceremony: "Vidaai", priority: "medium", daysBeforeWedding: 14 },
  { id: "H15", task: "Book Reception Venue", category: "Venue", description: "Secure venue for post-wedding reception celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "H16", task: "Order Wedding Invitations", category: "Stationery", description: "Design and print traditional Hindu wedding invitations.", priority: "high", daysBeforeWedding: 120 },
  { id: "H17", task: "Finalize Catering Menu", category: "Food", description: "Plan vegetarian menu with traditional dishes.", priority: "high", daysBeforeWedding: 90 },
  { id: "H18", task: "Book Photographer and Videographer", category: "Photography", description: "Hire professionals experienced with Hindu ceremonies.", priority: "high", daysBeforeWedding: 150 },
  { id: "H19", task: "Purchase Bridal Lehenga/Saree", category: "Attire", description: "Select and order bridal outfit with fittings.", priority: "high", daysBeforeWedding: 120 },
  { id: "H20", task: "Order Groom's Sherwani", category: "Attire", description: "Select and order groom's traditional outfit.", priority: "high", daysBeforeWedding: 90 },
];

export const SOUTH_INDIAN_TASKS: TaskTemplate[] = [
  { id: "SI01", task: "Consult Astrologer for Muhurtham", category: "Planning", description: "Set the auspicious early morning start time.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "SI02", task: "Hire Nadaswaram & Thavil Ensemble", category: "Music", description: "Traditional live wind and drum instruments.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 120 },
  { id: "SI03", task: "Source Kanjeevaram Silk Sarees", category: "Attire", description: "Plan for 2-3 outfit changes during the ceremony.", priority: "high", daysBeforeWedding: 120 },
  { id: "SI04", task: "Coordinate Banana Leaf Catering", category: "Food", description: "Sadhya meal served on authentic banana leaves.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 90 },
  { id: "SI05", task: "Arrange Kashi Yatra Props", category: "Rituals", description: "Parasol, walking stick, and wooden sandals.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "SI06", task: "Source Bulk Talambralu", category: "Rituals", description: "Rice mixed with turmeric or pearls for showering.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 21 },
  { id: "SI07", task: "Buy Jeelakarra Bellam Ingredients", category: "Rituals", description: "Cumin and jaggery paste for the head ritual.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 14 },
  { id: "SI08", task: "Purchase Temple Jewelry", category: "Jewelry", description: "Include Vaddanam (waist belt) and Manga Malai.", priority: "high", daysBeforeWedding: 90 },
  { id: "SI09", task: "Order Specific Thali/Mangalsutra", category: "Jewelry", description: "Ensure the design matches your specific sub-caste.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "SI10", task: "Source Antarpat (Sacred Curtain)", category: "Rituals", description: "Curtain held between the couple before the first look.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "SI11", task: "Book Temple or Kalyana Mandapam", category: "Venue", description: "Reserve traditional wedding hall for early morning ceremony.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "SI12", task: "Arrange Nalungu/Haldi Ceremony", category: "Pre-Wedding", description: "Plan turmeric ceremony with traditional games.", ceremony: "Nalungu", priority: "medium", daysBeforeWedding: 45 },
  { id: "SI13", task: "Plan Nichayathartham (Engagement)", category: "Pre-Wedding", description: "Organize formal engagement ceremony with family.", ceremony: "Engagement", priority: "high", daysBeforeWedding: 120 },
  { id: "SI14", task: "Hire Priest for Muhurtham Ceremony", category: "Officiant", description: "Book priest well-versed in your regional traditions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "SI15", task: "Order Traditional Flower Decorations", category: "Decor", description: "Jasmine, marigold, and banana leaf arrangements.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 45 },
  { id: "SI16", task: "Book Reception Hall", category: "Venue", description: "Separate venue for evening reception celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "SI17", task: "Arrange Groom's Veshti and Angavastram", category: "Attire", description: "Traditional silk dhoti and upper cloth for groom.", priority: "high", daysBeforeWedding: 60 },
  { id: "SI18", task: "Plan Seemantham Ceremony (if applicable)", category: "Pre-Wedding", description: "Baby shower ceremony if bride is expecting.", ceremony: "Seemantham", priority: "low", daysBeforeWedding: 60 },
  { id: "SI19", task: "Coordinate Early Morning Logistics", category: "Logistics", description: "Arrange transport and timings for 5-6 AM start.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "SI20", task: "Book Photographer for Multi-Day Coverage", category: "Photography", description: "Ensure coverage of all ceremonies across multiple days.", priority: "high", daysBeforeWedding: 150 },
];

export const SIKH_TASKS: TaskTemplate[] = [
  // 12+ MONTHS BEFORE (365 days)
  { id: "SK01", task: "Set Budget", category: "Planning", description: "Determine your overall wedding budget and allocate funds to different categories.", priority: "high", daysBeforeWedding: 365 },
  { id: "SK02", task: "Create a guest list", category: "Planning", description: "Create an initial guest list to help determine venue size and budget needs.", priority: "high", daysBeforeWedding: 365 },
  { id: "SK03", task: "Decide on budget", category: "Planning", description: "Finalize budget allocations for each wedding category and event.", priority: "high", daysBeforeWedding: 365 },
  { id: "SK04", task: "Decide how many events to have", category: "Planning", description: "Plan out all pre-wedding and post-wedding events (Mehndi, Jaggo, Choora, etc.).", priority: "high", daysBeforeWedding: 365 },
  { id: "SK05", task: "Book Gurdwara", category: "Venue", description: "Reserve the Gurdwara for the Anand Karaj ceremony and confirm timing requirements.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 365 },
  { id: "SK06", task: "Book reception/pre-wedding party venues", category: "Venue", description: "Secure venues for reception, mehndi, sangeet, and other pre-wedding events.", ceremony: "Reception", priority: "high", daysBeforeWedding: 365 },
  { id: "SK07", task: "Hire wedding planner", category: "Planning", description: "Hire a wedding planner experienced with Sikh/Punjabi weddings.", priority: "medium", daysBeforeWedding: 365 },
  { id: "SK08", task: "Book wedding venue", category: "Venue", description: "Finalize and book the main wedding venue.", priority: "high", daysBeforeWedding: 365 },
  { id: "SK09", task: "Send out save the dates", category: "Stationery", description: "Design and send save-the-date cards to guests.", priority: "medium", daysBeforeWedding: 365 },

  // 10 MONTHS BEFORE (306 days)
  { id: "SK10", task: "Start looking for bridal outfit", category: "Attire", description: "Begin shopping for the bridal lehenga or outfit for the main ceremony.", priority: "high", daysBeforeWedding: 306 },
  { id: "SK11", task: "Book paath", category: "Rituals", description: "Arrange for Akhand Paath or other religious ceremonies before the wedding.", ceremony: "Anand Karaj", priority: "medium", daysBeforeWedding: 306 },
  { id: "SK12", task: "Book honeymoon", category: "Planning", description: "Research and book your honeymoon destination and accommodations.", priority: "medium", daysBeforeWedding: 306 },
  { id: "SK13", task: "Choose bridesmaids/groomsmen", category: "Planning", description: "Finalize your bridal party and groomsmen selections.", priority: "medium", daysBeforeWedding: 306 },
  { id: "SK14", task: "Book caterer", category: "Food", description: "Hire a caterer experienced with Punjabi cuisine for all events.", priority: "high", daysBeforeWedding: 306 },
  { id: "SK15", task: "Book decor", category: "Decor", description: "Secure a decorator for the venue, mandap, and event styling.", priority: "high", daysBeforeWedding: 306 },
  { id: "SK16", task: "Start looking for pre-wedding events outfits", category: "Attire", description: "Begin shopping for outfits for mehndi, jaggo, choora, and other events.", priority: "medium", daysBeforeWedding: 306 },
  { id: "SK17", task: "Book DJ", category: "Entertainment", description: "Book a DJ for the reception and pre-wedding events.", priority: "high", daysBeforeWedding: 306 },

  // 8 MONTHS BEFORE (245 days)
  { id: "SK18", task: "Book florist", category: "Florals", description: "Hire a florist for ceremony and venue decorations.", priority: "high", daysBeforeWedding: 245 },
  { id: "SK19", task: "Book transport", category: "Logistics", description: "Arrange transportation for the wedding day and baraat procession.", ceremony: "Baraat", priority: "medium", daysBeforeWedding: 245 },
  { id: "SK20", task: "Book cake", category: "Food", description: "Order the wedding cake for the reception.", ceremony: "Reception", priority: "medium", daysBeforeWedding: 245 },
  { id: "SK21", task: "Book photographer / videographer", category: "Photography", description: "Hire professionals experienced with Sikh/Punjabi weddings and Gurdwara ceremonies.", priority: "high", daysBeforeWedding: 245 },
  { id: "SK22", task: "Book wedding stationery", category: "Stationery", description: "Order wedding invitations, programs, and other printed materials.", priority: "medium", daysBeforeWedding: 245 },
  { id: "SK23", task: "Book makeup and hair artist trial", category: "Beauty", description: "Schedule trial sessions with makeup and hair stylists.", priority: "medium", daysBeforeWedding: 245 },
  { id: "SK24", task: "Book mehndi artist", category: "Beauty", description: "Hire mehndi artists for the bride and family.", ceremony: "Mehndi", priority: "high", daysBeforeWedding: 245 },
  { id: "SK25", task: "Book turban tying", category: "Attire", description: "Arrange for a professional turban tyer (pagri) for the groom.", priority: "medium", daysBeforeWedding: 245 },
  { id: "SK26", task: "Book dhol players/band bhaja", category: "Music", description: "Book dhol players for the baraat and other celebrations.", ceremony: "Baraat", priority: "high", daysBeforeWedding: 245 },

  // 4 MONTHS BEFORE (122 days)
  { id: "SK27", task: "Dress fitting", category: "Attire", description: "Schedule fittings for bridal and groom outfits.", priority: "high", daysBeforeWedding: 122 },
  { id: "SK28", task: "Choose shoes and jewellery", category: "Attire", description: "Select shoes and jewelry for the bride and groom.", priority: "medium", daysBeforeWedding: 122 },
  { id: "SK29", task: "Order wedding rings", category: "Jewelry", description: "Select and order wedding bands.", priority: "high", daysBeforeWedding: 122 },
  { id: "SK30", task: "Arrange outfits for bridal party", category: "Attire", description: "Coordinate outfits for bridesmaids and groomsmen.", priority: "medium", daysBeforeWedding: 122 },
  { id: "SK31", task: "Order favors and stationery", category: "Stationery", description: "Order guest favors, place cards, and ceremony programs.", priority: "low", daysBeforeWedding: 122 },
  { id: "SK32", task: "Doli props and games", category: "Logistics", description: "Prepare doli (bride's departure) props and any traditional games.", ceremony: "Doli", priority: "medium", daysBeforeWedding: 122 },
  { id: "SK33", task: "Source jago and sticks", category: "Rituals", description: "Get the decorated jago pot and sticks for the Jaggo ceremony.", ceremony: "Jaggo", priority: "medium", daysBeforeWedding: 122 },

  // 3 MONTHS BEFORE (92 days)
  { id: "SK34", task: "Arrange marriage license", category: "Legal", description: "Research requirements and begin the marriage license application process.", priority: "high", daysBeforeWedding: 92 },
  { id: "SK35", task: "Send invitations", category: "Stationery", description: "Mail formal wedding invitations to all guests.", priority: "high", daysBeforeWedding: 92 },
  { id: "SK36", task: "Create wedding registry", category: "Planning", description: "Set up wedding registries at preferred stores.", priority: "medium", daysBeforeWedding: 92 },
  { id: "SK37", task: "Draft seating plans", category: "Planning", description: "Create initial seating arrangements for reception.", priority: "medium", daysBeforeWedding: 92 },
  { id: "SK38", task: "Buy final touches (e.g. guestbook)", category: "Decor", description: "Purchase guestbook, card box, and other finishing touches.", priority: "low", daysBeforeWedding: 92 },
  { id: "SK39", task: "Buy welcome signs", category: "Decor", description: "Order or create welcome signage for venue entrances.", priority: "low", daysBeforeWedding: 92 },

  // 2 MONTHS BEFORE (61 days)
  { id: "SK40", task: "Finalise music", category: "Entertainment", description: "Confirm playlists and song selections with DJ and musicians.", priority: "medium", daysBeforeWedding: 61 },
  { id: "SK41", task: "Finalise seating plans", category: "Planning", description: "Complete final seating arrangements for all events.", priority: "medium", daysBeforeWedding: 61 },
  { id: "SK42", task: "Finalise milni list", category: "Rituals", description: "Confirm milni pairings and gift arrangements between families.", ceremony: "Milni", priority: "medium", daysBeforeWedding: 61 },
  { id: "SK43", task: "Purchase gifts for bridal party", category: "Planning", description: "Buy thank-you gifts for bridesmaids and groomsmen.", priority: "medium", daysBeforeWedding: 61 },
  { id: "SK44", task: "Create wedding day timeline", category: "Planning", description: "Develop detailed schedule for the wedding day with all vendors.", priority: "high", daysBeforeWedding: 61 },

  // 1 MONTH BEFORE (31 days)
  { id: "SK45", task: "Confirm arrangements with vendors", category: "Planning", description: "Final confirmation calls with all vendors and service providers.", priority: "high", daysBeforeWedding: 31 },
  { id: "SK46", task: "Final dress fitting", category: "Attire", description: "Complete final alterations and fittings for all outfits.", priority: "high", daysBeforeWedding: 31 },
  { id: "SK47", task: "Write wedding speeches", category: "Experience", description: "Prepare any speeches for the reception.", priority: "medium", daysBeforeWedding: 31 },
  { id: "SK48", task: "Hen / Stag party", category: "Pre-Wedding", description: "Organize bachelor and bachelorette parties.", priority: "medium", daysBeforeWedding: 31 },
  { id: "SK49", task: "Pick up wedding rings", category: "Jewelry", description: "Collect wedding rings from the jeweler.", priority: "high", daysBeforeWedding: 31 },
  { id: "SK50", task: "Pick up marriage license", category: "Legal", description: "Obtain the official marriage license from the relevant authority.", priority: "high", daysBeforeWedding: 31 },

  // 2 WEEKS BEFORE (14 days)
  { id: "SK51", task: "Check on RSVPs", category: "Planning", description: "Follow up with guests who haven't responded to invitations.", priority: "high", daysBeforeWedding: 14 },
  { id: "SK52", task: "Give final count to caterer", category: "Food", description: "Provide final guest count to catering and venue.", priority: "high", daysBeforeWedding: 14 },
  { id: "SK53", task: "Break in wedding shoes", category: "Attire", description: "Wear wedding shoes around the house to break them in.", priority: "low", daysBeforeWedding: 14 },
  { id: "SK54", task: "Arrange head coverings for guests", category: "Logistics", description: "Provide scarves/bandanas for non-Sikh guests at Gurdwara.", ceremony: "Anand Karaj", priority: "medium", daysBeforeWedding: 14 },
  { id: "SK55", task: "Plan Choora Ceremony", category: "Pre-Wedding", description: "Finalize details for the red and white bangles ceremony.", ceremony: "Choora", priority: "medium", daysBeforeWedding: 14 },

  // 1 WEEK BEFORE (7 days)
  { id: "SK56", task: "Pack for overnight stay", category: "Logistics", description: "Prepare bags for wedding night and any overnight stays.", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK57", task: "Pack for honeymoon", category: "Logistics", description: "Pack all luggage and documents needed for honeymoon.", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK58", task: "Run through bridal party duties", category: "Planning", description: "Brief wedding party on their roles and responsibilities.", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK59", task: "Prepare final payments", category: "Planning", description: "Prepare final vendor payments and tips.", priority: "high", daysBeforeWedding: 7 },
  { id: "SK60", task: "Organize Vatna/Haldi", category: "Pre-Wedding", description: "Complete final preparations for the turmeric ceremony.", ceremony: "Vatna", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK61", task: "Order Karah Prasad ingredients", category: "Food", description: "Prepare or order the sacred sweet offering for Anand Karaj.", ceremony: "Anand Karaj", priority: "medium", daysBeforeWedding: 7 },

  // THE DAY BEFORE (1 day)
  { id: "SK62", task: "Go to beauty appointments", category: "Beauty", description: "Complete any final beauty treatments (waxing, facials, etc.).", priority: "high", daysBeforeWedding: 1 },
  { id: "SK63", task: "Get lots of beauty sleep", category: "Personal", description: "Rest well and get a good night's sleep before the big day.", priority: "high", daysBeforeWedding: 1 },
];

export const MUSLIM_TASKS: TaskTemplate[] = [
  { id: "M01", task: "Book Nikah Venue", category: "Venue", description: "Reserve mosque, banquet hall, or home for ceremony.", ceremony: "Nikah", priority: "high", daysBeforeWedding: 180 },
  { id: "M02", task: "Hire Imam/Qazi", category: "Officiant", description: "Book religious officiant for the Nikah ceremony.", ceremony: "Nikah", priority: "high", daysBeforeWedding: 150 },
  { id: "M03", task: "Finalize Mahr (Bridal Gift)", category: "Rituals", description: "Decide on the obligatory gift from groom to bride.", ceremony: "Nikah", priority: "high", daysBeforeWedding: 60 },
  { id: "M04", task: "Plan Mehndi Night", category: "Pre-Wedding", description: "Book henna artists and entertainment.", ceremony: "Mehndi", priority: "high", daysBeforeWedding: 60 },
  { id: "M05", task: "Organize Dholki/Sangeet", category: "Pre-Wedding", description: "Musical evening with traditional songs.", ceremony: "Dholki", priority: "medium", daysBeforeWedding: 45 },
  { id: "M06", task: "Arrange Mayoun/Haldi Ceremony", category: "Pre-Wedding", description: "Turmeric ceremony with yellow decorations.", ceremony: "Mayoun", priority: "medium", daysBeforeWedding: 14 },
  { id: "M07", task: "Order Bridal Sharara/Lehenga", category: "Attire", description: "Traditional red or chosen color bridal outfit.", priority: "high", daysBeforeWedding: 120 },
  { id: "M08", task: "Order Groom's Sherwani", category: "Attire", description: "Matching outfit with turban/sehra.", priority: "high", daysBeforeWedding: 90 },
  { id: "M09", task: "Prepare Nikah Contract", category: "Legal", description: "Draft the marriage contract with terms.", ceremony: "Nikah", priority: "high", daysBeforeWedding: 30 },
  { id: "M10", task: "Arrange Witnesses", category: "Legal", description: "Confirm two male witnesses for Nikah.", ceremony: "Nikah", priority: "high", daysBeforeWedding: 14 },
  { id: "M11", task: "Plan Walima Reception", category: "Venue", description: "Book venue for post-wedding feast.", ceremony: "Walima", priority: "high", daysBeforeWedding: 180 },
  { id: "M12", task: "Coordinate Rukhsati Ceremony", category: "Logistics", description: "Bride's departure from parental home.", ceremony: "Rukhsati", priority: "medium", daysBeforeWedding: 14 },
  { id: "M13", task: "Book Halal Catering", category: "Food", description: "Ensure all food is prepared according to halal standards.", priority: "high", daysBeforeWedding: 90 },
  { id: "M14", task: "Order Sehra for Groom", category: "Attire", description: "Floral or beaded face veil for groom.", priority: "medium", daysBeforeWedding: 30 },
  { id: "M15", task: "Plan Baraat Procession", category: "Logistics", description: "Groom's arrival with family and friends.", ceremony: "Baraat", priority: "medium", daysBeforeWedding: 30 },
  { id: "M16", task: "Arrange Prayer Space", category: "Logistics", description: "Designated area for prayers during events.", priority: "medium", daysBeforeWedding: 14 },
  { id: "M17", task: "Book Photographer/Videographer", category: "Photography", description: "Ensure they understand Islamic ceremony protocols.", priority: "high", daysBeforeWedding: 150 },
  { id: "M18", task: "Design Wedding Invitations", category: "Stationery", description: "Include Bismillah and event details.", priority: "high", daysBeforeWedding: 120 },
  { id: "M19", task: "Coordinate Joota Chupai (optional)", category: "Entertainment", description: "Fun shoe-hiding ritual with bridesmaids.", ceremony: "Nikah", priority: "low", daysBeforeWedding: 7 },
  { id: "M20", task: "Plan Arsi Mushaf (Mirror Ceremony)", category: "Rituals", description: "First look in mirror with Quran arrangement.", ceremony: "Nikah", priority: "medium", daysBeforeWedding: 14 },
];

export const GUJARATI_TASKS: TaskTemplate[] = [
  { id: "G01", task: "Book Garba/Dandiya Venue", category: "Venues", description: "A large hall for pre-wedding dance night.", ceremony: "Garba", priority: "high", daysBeforeWedding: 120 },
  { id: "G02", task: "Hire Folk Singers/Garba Band", category: "Entertainment", description: "Live music specialized in Gujarati folk and dandiya raas.", ceremony: "Garba", priority: "high", daysBeforeWedding: 90 },
  { id: "G03", task: "Purchase Dandiya Sticks", category: "Logistics", description: "Bulk wooden sticks for guest participation.", ceremony: "Garba", priority: "medium", daysBeforeWedding: 30 },
  { id: "G04", task: "Source Panetar and Gharchola", category: "Attire", description: "The traditional white/red and deep red sarees for the bride.", priority: "high", daysBeforeWedding: 120 },
  { id: "G05", task: "Plan Ponkhana Ritual Props", category: "Rituals", description: "Welcoming the groom; requires items for the 'nose-grabbing' ceremony.", ceremony: "Ponkhanu", priority: "medium", daysBeforeWedding: 14 },
  { id: "G06", task: "Coordinate Sankheda Furniture", category: "Decor", description: "Traditional Gujarati lacquered wood chairs for the Mandap.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 60 },
  { id: "G07", task: "Check Jain/Vegetarian Menu", category: "Food", description: "Verify restrictions on root vegetables (onion, garlic, potato) if applicable.", priority: "high", daysBeforeWedding: 90 },
  { id: "G08", task: "Arrange Chandlo Matli", category: "Pre-Wedding", description: "The formal acceptance of the marriage/engagement ritual.", ceremony: "Chandlo Matli", priority: "high", daysBeforeWedding: 90 },
  { id: "G09", task: "Source Pithi Setup", category: "Pre-Wedding", description: "Yellow turmeric paste ceremony items.", ceremony: "Pithi", priority: "medium", daysBeforeWedding: 14 },
  { id: "G10", task: "Order Mandavo Decor", category: "Decor", description: "Specific vibrant, colorful floral strings and entrance decor.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 45 },
  { id: "G11", task: "Plan Mandap Mahurat", category: "Rituals", description: "Auspicious installation of wedding canopy.", ceremony: "Mandap Mahurat", priority: "medium", daysBeforeWedding: 3 },
  { id: "G12", task: "Organize Grah Shanti Puja", category: "Rituals", description: "Prayer ceremony for household blessings.", ceremony: "Grah Shanti", priority: "medium", daysBeforeWedding: 7 },
  { id: "G13", task: "Hire Gujarati Priest", category: "Officiant", description: "Book priest familiar with Gujarati traditions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "G14", task: "Source Antarpat (Cloth Screen)", category: "Rituals", description: "Sacred curtain for first look ceremony.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "G15", task: "Arrange Kanya Daan Items", category: "Rituals", description: "Items for father giving away the bride.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
  { id: "G16", task: "Source Mangal Feras Setup", category: "Rituals", description: "Sacred fire and items for seven rounds.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "G17", task: "Plan Vidaai and Ponkvu", category: "Logistics", description: "Bride's departure with rice throwing.", ceremony: "Vidaai", priority: "medium", daysBeforeWedding: 7 },
  { id: "G18", task: "Order Chaniya Choli for Garba", category: "Attire", description: "Traditional outfit for Garba celebrations.", ceremony: "Garba", priority: "medium", daysBeforeWedding: 60 },
  { id: "G19", task: "Order Groom's Outfit", category: "Attire", description: "Sherwani or traditional Gujarati attire.", priority: "high", daysBeforeWedding: 90 },
  { id: "G20", task: "Book Gujarati Catering", category: "Food", description: "Traditional Gujarati thali and sweets.", priority: "high", daysBeforeWedding: 90 },
  { id: "G21", task: "Book Reception Venue", category: "Venue", description: "Evening celebration venue.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "G22", task: "Arrange Saptapadi Items", category: "Rituals", description: "Seven steps ceremony materials.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 14 },
  { id: "G23", task: "Book Dhol/Band for Baraat", category: "Music", description: "Traditional musicians for groom's procession.", ceremony: "Baraat", priority: "high", daysBeforeWedding: 60 },
  { id: "G24", task: "Order Mangalsutra", category: "Jewelry", description: "Sacred wedding necklace.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "G25", task: "Book Wedding Photographer", category: "Photography", description: "Experienced with multi-day Gujarati weddings.", priority: "high", daysBeforeWedding: 150 },
  { id: "G26", task: "Create Guest Ritual Guide", category: "Experience", description: "Explain traditions to non-Gujarati guests.", priority: "low", daysBeforeWedding: 21 },
];

export const CHRISTIAN_TASKS: TaskTemplate[] = [
  { id: "C01", task: "Book Church and Priest/Pastor", category: "Venues", description: "Secure the sanctuary for the religious ceremony.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "C02", task: "Select Wedding Party", category: "Planning", description: "Assign Bridesmaids, Groomsmen, Flower Girls, and Ring Bearers.", priority: "high", daysBeforeWedding: 150 },
  { id: "C03", task: "Purchase Minnu or Thali", category: "Jewelry", description: "Gold pendant on silk thread (specifically for Malayalee/South Indian Christians).", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "C04", task: "Source White Saree or Wedding Gown", category: "Attire", description: "The fusion of Western white with traditional Indian silhouettes.", priority: "high", daysBeforeWedding: 120 },
  { id: "C05", task: "Hire Choir or Church Organist", category: "Music", description: "Live music for hymns and the processional.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 90 },
  { id: "C06", task: "Order Multi-Tier Wedding Cake", category: "Food", description: "Traditional cake-cutting ceremony for the reception.", ceremony: "Reception", priority: "medium", daysBeforeWedding: 60 },
  { id: "C07", task: "Plan Roce Ceremony Items", category: "Pre-Wedding", description: "The traditional coconut milk bath (common for Goan/Mangalorean Catholics).", ceremony: "Roce", priority: "medium", daysBeforeWedding: 14 },
  { id: "C08", task: "Arrange Non-Veg Catering", category: "Food", description: "Traditional meat dishes like Appam and Stew or Beef/Pork roasts.", priority: "high", daysBeforeWedding: 90 },
  { id: "C09", task: "Choreograph First Dance", category: "Entertainment", description: "Coordinate the couple's first dance for the reception.", ceremony: "Reception", priority: "medium", daysBeforeWedding: 30 },
  { id: "C10", task: "Source Ring Exchange Items", category: "Rituals", description: "Wedding bands and ceremonial ring cushions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "C11", task: "Schedule Pre-Marriage Counseling", category: "Planning", description: "Complete required church counseling sessions.", priority: "high", daysBeforeWedding: 120 },
  { id: "C12", task: "Choose Scripture Readings", category: "Rituals", description: "Select Bible passages for the ceremony.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 60 },
  { id: "C13", task: "Order Groom's Suit", category: "Attire", description: "Traditional suit with matching accessories.", priority: "high", daysBeforeWedding: 90 },
  { id: "C14", task: "Plan Sangeet/Eve Party", category: "Pre-Wedding", description: "Musical celebration before wedding day.", ceremony: "Sangeet", priority: "medium", daysBeforeWedding: 45 },
  { id: "C15", task: "Book Reception Venue", category: "Venue", description: "Separate venue for reception celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "C16", task: "Arrange Church Decorations", category: "Decor", description: "Flowers and altar decorations.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "C17", task: "Arrange Church Banns", category: "Legal", description: "Public announcement of marriage intentions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "C18", task: "Order Wedding Invitations", category: "Stationery", description: "Traditional Christian wedding invites.", priority: "high", daysBeforeWedding: 120 },
  { id: "C19", task: "Book Photographer", category: "Photography", description: "Experienced with church ceremonies.", priority: "high", daysBeforeWedding: 150 },
  { id: "C20", task: "Arrange Church Marriage Certificate", category: "Legal", description: "Ensure proper documentation is prepared.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
];

export const JAIN_TASKS: TaskTemplate[] = [
  { id: "J01", task: "Consult Jain Priest/Pandit", category: "Officiant", description: "Book priest familiar with Jain traditions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "J02", task: "Plan Mandap Ropan", category: "Rituals", description: "Installation of wedding canopy ceremony.", ceremony: "Mandap Ropan", priority: "medium", daysBeforeWedding: 3 },
  { id: "J03", task: "Arrange Lagna Lekhan", category: "Rituals", description: "Writing of wedding date and time ceremony.", ceremony: "Lagna Lekhan", priority: "medium", daysBeforeWedding: 14 },
  { id: "J04", task: "Plan Sagai/Tilak Ceremony", category: "Pre-Wedding", description: "Formal engagement ceremony.", ceremony: "Sagai", priority: "high", daysBeforeWedding: 90 },
  { id: "J05", task: "Organize Grah Shanti", category: "Rituals", description: "Prayer for blessings and peace.", ceremony: "Grah Shanti", priority: "medium", daysBeforeWedding: 7 },
  { id: "J06", task: "Plan Varghodo (Baraat)", category: "Logistics", description: "Groom's procession to wedding venue.", ceremony: "Varghodo", priority: "high", daysBeforeWedding: 60 },
  { id: "J07", task: "Arrange Jaimala Ceremony", category: "Rituals", description: "Exchange of garlands between couple.", ceremony: "Jaimala", priority: "medium", daysBeforeWedding: 14 },
  { id: "J08", task: "Source Phera Materials", category: "Rituals", description: "Items for four circumambulations.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "J09", task: "Plan Kanyadan Ceremony", category: "Rituals", description: "Father giving away the bride.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
  { id: "J10", task: "Arrange Granthi Bandhan", category: "Rituals", description: "Tying of wedding knot.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
  { id: "J11", task: "Order Jain Vegetarian Catering", category: "Food", description: "Strictly vegetarian without root vegetables.", priority: "high", daysBeforeWedding: 90 },
  { id: "J12", task: "Order Bridal Outfit", category: "Attire", description: "Traditional Jain bridal attire.", priority: "high", daysBeforeWedding: 120 },
  { id: "J13", task: "Order Groom's Outfit", category: "Attire", description: "Traditional Jain groom attire.", priority: "high", daysBeforeWedding: 90 },
  { id: "J14", task: "Book Reception Venue", category: "Venue", description: "Post-wedding celebration venue.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "J15", task: "Plan Vidaai Ceremony", category: "Logistics", description: "Bride's emotional departure.", ceremony: "Vidaai", priority: "medium", daysBeforeWedding: 7 },
  { id: "J16", task: "Book Photographer", category: "Photography", description: "Experienced with Jain ceremonies.", priority: "high", daysBeforeWedding: 150 },
  { id: "J17", task: "Order Mangalsutra", category: "Jewelry", description: "Sacred wedding necklace.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "J18", task: "Design Wedding Invitations", category: "Stationery", description: "Include Jain religious symbols.", priority: "high", daysBeforeWedding: 120 },
  { id: "J19", task: "Arrange Temple Visit", category: "Rituals", description: "Pre-wedding temple blessings.", priority: "medium", daysBeforeWedding: 7 },
  { id: "J20", task: "Create Guest Information Guide", category: "Experience", description: "Explain Jain rituals to guests.", priority: "low", daysBeforeWedding: 21 },
];

export const PARSI_TASKS: TaskTemplate[] = [
  { id: "P01", task: "Book Agiary (Fire Temple)", category: "Venue", description: "Reserve fire temple for ceremony.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "P02", task: "Hire Parsi Priest (Mobed)", category: "Officiant", description: "Book two priests for traditional ceremony.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "P03", task: "Plan Madhavsaro Ceremony", category: "Pre-Wedding", description: "Planting of mango tree four days before.", ceremony: "Madhavsaro", priority: "medium", daysBeforeWedding: 7 },
  { id: "P04", task: "Arrange Adarni Ceremony", category: "Pre-Wedding", description: "Exchange of gifts between families.", ceremony: "Adarni", priority: "medium", daysBeforeWedding: 14 },
  { id: "P05", task: "Plan Nahan Ritual", category: "Rituals", description: "Purification bath before wedding.", ceremony: "Nahan", priority: "medium", daysBeforeWedding: 3 },
  { id: "P06", task: "Source Ses (Welcome Tray)", category: "Rituals", description: "Traditional silver tray with ritual items.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "P07", task: "Arrange Achumichu Ceremony", category: "Rituals", description: "Mother blesses the couple.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 14 },
  { id: "P08", task: "Prepare Lagan ni Bhonu", category: "Food", description: "Traditional Parsi wedding feast menu.", priority: "high", daysBeforeWedding: 60 },
  { id: "P09", task: "Order White Bridal Saree", category: "Attire", description: "Traditional white or cream saree with embroidery.", priority: "high", daysBeforeWedding: 120 },
  { id: "P10", task: "Order Groom's Dagli and Pheta", category: "Attire", description: "Traditional white coat and turban.", priority: "high", daysBeforeWedding: 90 },
  { id: "P11", task: "Arrange Haath Borvanu", category: "Rituals", description: "Holding hands ceremony with witnesses.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
  { id: "P12", task: "Plan Reception (if separate)", category: "Venue", description: "Book venue for evening celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "P13", task: "Source Fire/Divo for Ceremony", category: "Rituals", description: "Sacred fire arrangements.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 7 },
  { id: "P14", task: "Order Wedding Invitations", category: "Stationery", description: "Include Ahura Mazda blessings.", priority: "high", daysBeforeWedding: 120 },
  { id: "P15", task: "Arrange Rose Water and Rice", category: "Rituals", description: "For showering the couple.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 7 },
  { id: "P16", task: "Book Parsi Caterer", category: "Food", description: "Traditional Parsi cuisine specialist.", priority: "high", daysBeforeWedding: 90 },
  { id: "P17", task: "Book Photographer", category: "Photography", description: "Experienced with Parsi ceremonies.", priority: "high", daysBeforeWedding: 150 },
  { id: "P18", task: "Plan Pagdi Ceremony (if applicable)", category: "Rituals", description: "Groom's initiation if not yet done.", priority: "medium", daysBeforeWedding: 30 },
  { id: "P19", task: "Coordinate Ashirwad from Elders", category: "Rituals", description: "Blessings from senior community members.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 7 },
  { id: "P20", task: "Create Ceremony Program", category: "Experience", description: "Explain Zoroastrian rituals to guests.", priority: "low", daysBeforeWedding: 21 },
];

export const GENERAL_WEDDING_TASKS: TaskTemplate[] = [
  // Vision Phase (12+ months / 365+ days)
  { id: "GL01", task: "Finalize Guest List", category: "Planning", description: "Consolidate contacts from both families for all events.", priority: "high", daysBeforeWedding: 365, phase: "vision" },
  { id: "GEN01", task: "Set Wedding Budget", category: "Planning", description: "Establish overall budget and allocate to categories.", priority: "high", daysBeforeWedding: 365, phase: "vision" },
  { id: "GEN02", task: "Book Wedding Venue", category: "Venue", description: "Research and reserve ceremony/reception venue.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 300, phase: "vision" },
  { id: "GL02", task: "Secure Wedding Insurance", category: "Legal", description: "Protect your investment; many US/Canada venues require this.", priority: "high", daysBeforeWedding: 300, phase: "vision" },
  
  // Curation Phase (6-9 months / 180-270 days)
  { id: "GL03", task: "Book Lead Photographer", category: "Vendors", description: "Ensure they have experience with South Asian lighting and colors.", priority: "high", daysBeforeWedding: 240, phase: "curation" },
  { id: "GL04", task: "Book Videographer", category: "Vendors", description: "Decide on cinematic highlight film vs. documentary style.", priority: "high", daysBeforeWedding: 240, phase: "curation" },
  { id: "GL05", task: "Launch Wedding Website", category: "Digital", description: "Include dress codes for different events (e.g., 'Indian Festive').", priority: "medium", daysBeforeWedding: 210, phase: "curation" },
  { id: "GL06", task: "Send Save the Dates", category: "Communications", description: "Crucial for Desi weddings where guests travel from overseas.", priority: "high", daysBeforeWedding: 210, phase: "curation" },
  { id: "GEN03", task: "Book Wedding Caterer", category: "Food", description: "Select caterer and plan menu.", priority: "high", daysBeforeWedding: 180, phase: "curation" },
  { id: "GEN04", task: "Book Florist/Decorator", category: "Decor", description: "Hire decorator for venue and flowers.", priority: "high", daysBeforeWedding: 180, phase: "curation" },
  { id: "GEN05", task: "Purchase Wedding Attire", category: "Attire", description: "Shop for wedding outfits for couple (plan India trips if needed).", priority: "high", daysBeforeWedding: 180, phase: "curation" },
  { id: "GL08", task: "Hire Lead Makeup & Hair Artist", category: "Beauty", description: "Schedule trials for multiple looks (Ceremony vs. Reception).", priority: "high", daysBeforeWedding: 150, phase: "curation" },
  { id: "GEN06", task: "Hire DJ and MC", category: "Entertainment", description: "Ensure they can handle bilingual announcements if needed.", priority: "high", daysBeforeWedding: 150, phase: "curation" },
  { id: "GL10", task: "Select Wedding Registry", category: "Planning", description: "Mix traditional items with cash/honeymoon funds.", priority: "medium", daysBeforeWedding: 150, phase: "curation" },
  { id: "GL12", task: "Book Sound & Lighting", category: "Production", description: "Often separate from DJ for large ballroom events.", priority: "medium", daysBeforeWedding: 120, phase: "curation" },
  { id: "GL19", task: "First Dance Lessons", category: "Entertainment", description: "Choreograph your debut as a couple.", priority: "medium", daysBeforeWedding: 120, phase: "curation" },
  { id: "GL24", task: "Purchase Wedding Rings", category: "Jewelry", description: "Ensure sizing is done at least 2 months out.", priority: "high", daysBeforeWedding: 90, phase: "curation" },
  
  // Logistics Phase (1-3 months / 30-90 days)
  { id: "GL07", task: "Book Hotel Room Blocks", category: "Logistics", description: "Secure discounted rates for out-of-town guests.", priority: "high", daysBeforeWedding: 90, phase: "logistics" },
  { id: "GL11", task: "Order Physical Invitations", category: "Communications", description: "Desi weddings often require multi-page inserts for various events.", priority: "high", daysBeforeWedding: 90, phase: "logistics" },
  { id: "GL15", task: "Arrange Transportation/Shuttles", category: "Logistics", description: "Move guests between hotel, temple/church, and reception.", priority: "medium", daysBeforeWedding: 75, phase: "logistics" },
  { id: "GEN07", task: "Plan Rehearsal Dinner / Welcome Party", category: "Events", description: "The 'icebreaker' event for guests arriving early.", priority: "medium", daysBeforeWedding: 60, phase: "logistics" },
  { id: "GL14", task: "Finalize Reception Menu", category: "Food", description: "Balance heavy traditional dishes with lighter fusion options.", priority: "high", daysBeforeWedding: 60, phase: "logistics" },
  { id: "GL23", task: "Plan Honeymoon Logistics", category: "Post-Wedding", description: "Passports, visas, and flight bookings.", priority: "medium", daysBeforeWedding: 60, phase: "logistics" },
  { id: "GL09", task: "Apply for Marriage License", category: "Legal", description: "Check local county/province residency requirements and expiry.", priority: "high", daysBeforeWedding: 45, phase: "logistics" },
  { id: "GL22", task: "Order Reception Party Favors", category: "Gifts", description: "Personalized mementos for guests to take home.", priority: "low", daysBeforeWedding: 45, phase: "logistics" },
  
  // Home Stretch (< 1 month / < 30 days)
  { id: "GL16", task: "Draft Seating Chart", category: "Planning", description: "Navigate complex family dynamics early!", priority: "high", daysBeforeWedding: 21, phase: "home_stretch" },
  { id: "GL21", task: "Final Headcount for Caterer", category: "Food", description: "Confirm numbers 2-4 weeks prior to the first event.", priority: "high", daysBeforeWedding: 21, phase: "home_stretch" },
  { id: "GEN08", task: "Final Dress Fitting", category: "Attire", description: "Complete final alterations.", priority: "high", daysBeforeWedding: 14, phase: "home_stretch" },
  { id: "GL17", task: "Assemble Welcome Bags", category: "Guest Experience", description: "Include bottled water, Tylenol, and Indian snacks (Bhujia/Parle-G).", priority: "medium", daysBeforeWedding: 14, phase: "home_stretch" },
  { id: "GL20", task: "Prepare Vendor Tips/Gratuity", category: "Budget", description: "Organize cash envelopes for the day-of.", priority: "medium", daysBeforeWedding: 7, phase: "home_stretch" },
  { id: "GEN09", task: "Confirm All Vendors", category: "Planning", description: "Reconfirm all vendor bookings.", priority: "high", daysBeforeWedding: 7, phase: "home_stretch" },
  { id: "GEN10", task: "Prepare Wedding Day Timeline", category: "Planning", description: "Create detailed schedule for the day.", priority: "high", daysBeforeWedding: 7, phase: "home_stretch" },
  { id: "GL25", task: "Pack Emergency Kit", category: "Planning", description: "Safety pins, stain remover, mints, and double-sided tape.", priority: "medium", daysBeforeWedding: 3, phase: "home_stretch" },
];

export function getTasksForTradition(tradition: string): TaskTemplate[] {
  const generalTasks = [...GENERAL_WEDDING_TASKS];
  let traditionSpecificTasks: TaskTemplate[] = [];

  switch (tradition.toLowerCase()) {
    case 'hindu':
      traditionSpecificTasks = [...HINDU_TASKS];
      break;
    case 'south_indian':
      traditionSpecificTasks = [...SOUTH_INDIAN_TASKS];
      break;
    case 'sikh':
      traditionSpecificTasks = [...SIKH_TASKS];
      break;
    case 'muslim':
      traditionSpecificTasks = [...MUSLIM_TASKS];
      break;
    case 'gujarati':
      traditionSpecificTasks = [...GUJARATI_TASKS];
      break;
    case 'christian':
      traditionSpecificTasks = [...CHRISTIAN_TASKS];
      break;
    case 'jain':
      traditionSpecificTasks = [...JAIN_TASKS];
      break;
    case 'parsi':
      traditionSpecificTasks = [...PARSI_TASKS];
      break;
    case 'mixed':
    case 'other':
    default:
      traditionSpecificTasks = [];
  }

  // Assign phases to tradition-specific tasks based on daysBeforeWedding
  const tasksWithPhases = traditionSpecificTasks.map(task => ({
    ...task,
    phase: task.phase || getPhaseFromDays(task.daysBeforeWedding)
  }));

  const allTasks = [...generalTasks, ...tasksWithPhases];
  
  allTasks.sort((a, b) => (b.daysBeforeWedding || 0) - (a.daysBeforeWedding || 0));
  
  return allTasks;
}

export function calculateDueDate(weddingDate: Date, daysBeforeWedding: number): Date {
  const dueDate = new Date(weddingDate);
  dueDate.setDate(dueDate.getDate() - daysBeforeWedding);
  return dueDate;
}
