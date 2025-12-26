export interface TaskTemplate {
  id: string;
  task: string;
  category: string;
  description: string;
  ceremony?: string;
  priority?: 'high' | 'medium' | 'low';
  daysBeforeWedding?: number;
}

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
  { id: "SK01", task: "Book Gurdwara for Anand Karaj", category: "Venue", description: "Reserve the Gurdwara and confirm ceremony timings.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 180 },
  { id: "SK02", task: "Arrange Ragis/Kirtan Singers", category: "Music", description: "Book professional Ragis for the ceremony.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 120 },
  { id: "SK03", task: "Source Rumala Sahib and Chanani", category: "Rituals", description: "Sacred cloths and canopy for Guru Granth Sahib.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 60 },
  { id: "SK04", task: "Order Karah Prasad Ingredients", category: "Food", description: "Prepare or order the sacred sweet offering.", ceremony: "Anand Karaj", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK05", task: "Arrange Phulkari or Chunni for Bride", category: "Attire", description: "Traditional embroidered headscarf for the ceremony.", priority: "high", daysBeforeWedding: 90 },
  { id: "SK06", task: "Plan Mehndi/Ladies Sangeet", category: "Pre-Wedding", description: "Book henna artists and entertainment.", ceremony: "Mehndi", priority: "medium", daysBeforeWedding: 60 },
  { id: "SK07", task: "Organize Jaggo Night", category: "Pre-Wedding", description: "Arrange decorated pot and dance procession.", ceremony: "Jaggo", priority: "medium", daysBeforeWedding: 30 },
  { id: "SK08", task: "Coordinate Milni Ceremony", category: "Rituals", description: "Matching garlands and gifts for family introductions.", ceremony: "Milni", priority: "medium", daysBeforeWedding: 30 },
  { id: "SK09", task: "Book Doli/Vidaai Arrangements", category: "Logistics", description: "Decorated car and flower petals for bride's departure.", ceremony: "Doli", priority: "medium", daysBeforeWedding: 14 },
  { id: "SK10", task: "Plan Reception/Dinner", category: "Venue", description: "Book venue for evening celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "SK11", task: "Order Groom's Sherwani/Kurta", category: "Attire", description: "Traditional outfit with matching turban.", priority: "high", daysBeforeWedding: 90 },
  { id: "SK12", task: "Purchase Bridal Lehenga", category: "Attire", description: "Red or pink traditional bridal outfit.", priority: "high", daysBeforeWedding: 120 },
  { id: "SK13", task: "Arrange Baraat Procession", category: "Logistics", description: "Book dhol players and transportation.", ceremony: "Baraat", priority: "high", daysBeforeWedding: 60 },
  { id: "SK14", task: "Plan Choora Ceremony", category: "Pre-Wedding", description: "Red and white bangles ceremony for bride.", ceremony: "Choora", priority: "medium", daysBeforeWedding: 14 },
  { id: "SK15", task: "Organize Vatna/Haldi", category: "Pre-Wedding", description: "Turmeric ceremony with family.", ceremony: "Vatna", priority: "medium", daysBeforeWedding: 7 },
  { id: "SK16", task: "Confirm Laavan Phere Procedure", category: "Rituals", description: "Discuss four circumambulations with Granthi.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 30 },
  { id: "SK17", task: "Book Langar/Catering", category: "Food", description: "Arrange vegetarian meal for all guests.", ceremony: "Anand Karaj", priority: "high", daysBeforeWedding: 90 },
  { id: "SK18", task: "Create Ceremony Program", category: "Experience", description: "Guide explaining Sikh wedding traditions for guests.", ceremony: "Anand Karaj", priority: "low", daysBeforeWedding: 21 },
  { id: "SK19", task: "Arrange Head Coverings for Guests", category: "Logistics", description: "Provide scarves/bandanas for non-Sikh guests.", ceremony: "Anand Karaj", priority: "medium", daysBeforeWedding: 14 },
  { id: "SK20", task: "Book Wedding Photographer", category: "Photography", description: "Hire photographer experienced with Gurdwara ceremonies.", priority: "high", daysBeforeWedding: 150 },
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
  { id: "G01", task: "Plan Pithi Ceremony", category: "Pre-Wedding", description: "Turmeric application ceremony for bride and groom.", ceremony: "Pithi", priority: "medium", daysBeforeWedding: 7 },
  { id: "G02", task: "Arrange Garba/Raas Night", category: "Pre-Wedding", description: "Book venue and dandiya sticks for traditional dance.", ceremony: "Garba", priority: "high", daysBeforeWedding: 60 },
  { id: "G03", task: "Plan Mandap Mahurat", category: "Rituals", description: "Auspicious installation of wedding canopy.", ceremony: "Mandap Mahurat", priority: "medium", daysBeforeWedding: 3 },
  { id: "G04", task: "Organize Grah Shanti Puja", category: "Rituals", description: "Prayer ceremony for household blessings.", ceremony: "Grah Shanti", priority: "medium", daysBeforeWedding: 7 },
  { id: "G05", task: "Hire Gujarati Priest", category: "Officiant", description: "Book priest familiar with Gujarati traditions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "G06", task: "Source Antarpat (Cloth Screen)", category: "Rituals", description: "Sacred curtain for first look ceremony.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "G07", task: "Plan Ponkhanu (Welcoming)", category: "Rituals", description: "Bride's family welcomes groom with rituals.", ceremony: "Ponkhanu", priority: "medium", daysBeforeWedding: 14 },
  { id: "G08", task: "Arrange Kanya Daan Items", category: "Rituals", description: "Items for father giving away the bride.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 14 },
  { id: "G09", task: "Source Mangal Feras Setup", category: "Rituals", description: "Sacred fire and items for seven rounds.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "G10", task: "Plan Vidaai and Ponkvu", category: "Logistics", description: "Bride's departure with rice throwing.", ceremony: "Vidaai", priority: "medium", daysBeforeWedding: 7 },
  { id: "G11", task: "Order Chaniya Choli for Garba", category: "Attire", description: "Traditional outfit for Garba celebrations.", priority: "medium", daysBeforeWedding: 60 },
  { id: "G12", task: "Order Bridal Saree/Lehenga", category: "Attire", description: "Traditional red bridal outfit.", priority: "high", daysBeforeWedding: 120 },
  { id: "G13", task: "Order Groom's Outfit", category: "Attire", description: "Sherwani or traditional Gujarati attire.", priority: "high", daysBeforeWedding: 90 },
  { id: "G14", task: "Book Gujarati Catering", category: "Food", description: "Traditional Gujarati thali and sweets.", priority: "high", daysBeforeWedding: 90 },
  { id: "G15", task: "Book Reception Venue", category: "Venue", description: "Evening celebration venue.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "G16", task: "Arrange Saptapadi Items", category: "Rituals", description: "Seven steps ceremony materials.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 14 },
  { id: "G17", task: "Book Dhol/Band for Baraat", category: "Music", description: "Traditional musicians for groom's procession.", ceremony: "Baraat", priority: "high", daysBeforeWedding: 60 },
  { id: "G18", task: "Order Mangalsutra", category: "Jewelry", description: "Sacred wedding necklace.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "G19", task: "Book Wedding Photographer", category: "Photography", description: "Experienced with multi-day Gujarati weddings.", priority: "high", daysBeforeWedding: 150 },
  { id: "G20", task: "Create Guest Ritual Guide", category: "Experience", description: "Explain traditions to non-Gujarati guests.", priority: "low", daysBeforeWedding: 21 },
];

export const CHRISTIAN_TASKS: TaskTemplate[] = [
  { id: "C01", task: "Book Church for Ceremony", category: "Venue", description: "Reserve church and confirm available dates.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 180 },
  { id: "C02", task: "Schedule Pre-Marriage Counseling", category: "Planning", description: "Complete required church counseling sessions.", priority: "high", daysBeforeWedding: 120 },
  { id: "C03", task: "Meet with Priest/Pastor", category: "Officiant", description: "Discuss ceremony structure and readings.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 150 },
  { id: "C04", task: "Choose Scripture Readings", category: "Rituals", description: "Select Bible passages for the ceremony.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 60 },
  { id: "C05", task: "Book Church Choir/Musicians", category: "Music", description: "Arrange traditional hymns and music.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 90 },
  { id: "C06", task: "Order Wedding Saree/Gown", category: "Attire", description: "White saree or Western gown for bride.", priority: "high", daysBeforeWedding: 120 },
  { id: "C07", task: "Order Groom's Suit", category: "Attire", description: "Traditional suit with matching accessories.", priority: "high", daysBeforeWedding: 90 },
  { id: "C08", task: "Arrange Thali/Minnu", category: "Jewelry", description: "Traditional wedding pendant for Syrian Christians.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 60 },
  { id: "C09", task: "Plan Sangeet/Eve Party", category: "Pre-Wedding", description: "Musical celebration before wedding day.", ceremony: "Sangeet", priority: "medium", daysBeforeWedding: 45 },
  { id: "C10", task: "Book Reception Venue", category: "Venue", description: "Separate venue for reception celebration.", ceremony: "Reception", priority: "high", daysBeforeWedding: 180 },
  { id: "C11", task: "Coordinate Ring Ceremony", category: "Rituals", description: "Exchange of wedding rings.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "C12", task: "Arrange Church Decorations", category: "Decor", description: "Flowers and altar decorations.", ceremony: "Wedding Ceremony", priority: "medium", daysBeforeWedding: 30 },
  { id: "C13", task: "Plan Cake Cutting Ceremony", category: "Rituals", description: "Wedding cake for reception.", ceremony: "Reception", priority: "medium", daysBeforeWedding: 30 },
  { id: "C14", task: "Book Non-Vegetarian Catering", category: "Food", description: "Traditional feast with regional specialties.", priority: "high", daysBeforeWedding: 90 },
  { id: "C15", task: "Arrange Church Banns", category: "Legal", description: "Public announcement of marriage intentions.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 30 },
  { id: "C16", task: "Select Bridesmaids and Groomsmen", category: "Planning", description: "Choose wedding party members.", priority: "high", daysBeforeWedding: 150 },
  { id: "C17", task: "Order Wedding Invitations", category: "Stationery", description: "Traditional Christian wedding invites.", priority: "high", daysBeforeWedding: 120 },
  { id: "C18", task: "Book Photographer", category: "Photography", description: "Experienced with church ceremonies.", priority: "high", daysBeforeWedding: 150 },
  { id: "C19", task: "Plan First Dance", category: "Entertainment", description: "Choreograph couple's first dance.", ceremony: "Reception", priority: "medium", daysBeforeWedding: 30 },
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
  { id: "GEN01", task: "Set Wedding Budget", category: "Planning", description: "Establish overall budget and allocate to categories.", priority: "high", daysBeforeWedding: 365 },
  { id: "GEN02", task: "Create Guest List", category: "Guests", description: "Compile initial guest list with addresses.", priority: "high", daysBeforeWedding: 300 },
  { id: "GEN03", task: "Book Wedding Venue", category: "Venue", description: "Research and reserve ceremony/reception venue.", ceremony: "Wedding Ceremony", priority: "high", daysBeforeWedding: 300 },
  { id: "GEN04", task: "Hire Wedding Photographer", category: "Photography", description: "Book professional photographer and videographer.", priority: "high", daysBeforeWedding: 240 },
  { id: "GEN05", task: "Book Wedding Caterer", category: "Food", description: "Select caterer and plan menu.", priority: "high", daysBeforeWedding: 180 },
  { id: "GEN06", task: "Order Wedding Invitations", category: "Stationery", description: "Design and order wedding invitations.", priority: "high", daysBeforeWedding: 150 },
  { id: "GEN07", task: "Book Florist/Decorator", category: "Decor", description: "Hire decorator for venue and flowers.", priority: "high", daysBeforeWedding: 180 },
  { id: "GEN08", task: "Hire DJ/Music", category: "Entertainment", description: "Book entertainment for reception.", ceremony: "Reception", priority: "high", daysBeforeWedding: 150 },
  { id: "GEN09", task: "Purchase Wedding Attire", category: "Attire", description: "Shop for wedding outfits for couple.", priority: "high", daysBeforeWedding: 180 },
  { id: "GEN10", task: "Book Hair and Makeup Artist", category: "Beauty", description: "Hire professionals for wedding day styling.", priority: "high", daysBeforeWedding: 120 },
  { id: "GEN11", task: "Arrange Transportation", category: "Logistics", description: "Book cars for wedding party and guests.", priority: "medium", daysBeforeWedding: 90 },
  { id: "GEN12", task: "Plan Honeymoon", category: "Travel", description: "Research and book honeymoon destination.", priority: "medium", daysBeforeWedding: 180 },
  { id: "GEN13", task: "Apply for Marriage License", category: "Legal", description: "Complete legal paperwork.", priority: "high", daysBeforeWedding: 30 },
  { id: "GEN14", task: "Send Wedding Invitations", category: "Stationery", description: "Mail out all wedding invitations.", priority: "high", daysBeforeWedding: 60 },
  { id: "GEN15", task: "Finalize Guest Count", category: "Guests", description: "Confirm RSVPs and final headcount.", priority: "high", daysBeforeWedding: 14 },
  { id: "GEN16", task: "Create Seating Chart", category: "Planning", description: "Assign guests to tables.", priority: "medium", daysBeforeWedding: 14 },
  { id: "GEN17", task: "Plan Rehearsal Dinner", category: "Planning", description: "Organize dinner for wedding party.", priority: "medium", daysBeforeWedding: 60 },
  { id: "GEN18", task: "Final Dress Fitting", category: "Attire", description: "Complete final alterations.", priority: "high", daysBeforeWedding: 14 },
  { id: "GEN19", task: "Confirm All Vendors", category: "Planning", description: "Reconfirm all vendor bookings.", priority: "high", daysBeforeWedding: 7 },
  { id: "GEN20", task: "Prepare Wedding Day Timeline", category: "Planning", description: "Create detailed schedule for the day.", priority: "high", daysBeforeWedding: 7 },
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

  const allTasks = [...generalTasks, ...traditionSpecificTasks];
  
  allTasks.sort((a, b) => (b.daysBeforeWedding || 0) - (a.daysBeforeWedding || 0));
  
  return allTasks;
}

export function calculateDueDate(weddingDate: Date, daysBeforeWedding: number): Date {
  const dueDate = new Date(weddingDate);
  dueDate.setDate(dueDate.getDate() - daysBeforeWedding);
  return dueDate;
}
