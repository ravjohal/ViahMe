import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// DIETARY RESTRICTIONS - Centralized options for South Asian weddings
// ============================================================================

// Combined dietary options - South Asian specific + common Western preferences
export const DIETARY_OPTIONS = [
  { value: "none", label: "No dietary restrictions", description: "Standard menu is fine" },
  { value: "strict_vegetarian", label: "Strict Vegetarian", description: "No meat, fish, or eggs" },
  { value: "jain", label: "Jain", description: "No root vegetables, no eggs" },
  { value: "swaminarayan", label: "Swaminarayan", description: "Strictly vegetarian, no onion/garlic" },
  { value: "eggless", label: "Eggless Vegetarian", description: "Vegetarian, no eggs" },
  { value: "halal", label: "Halal", description: "Halal meat only" },
  { value: "kosher", label: "Kosher", description: "Kosher dietary laws" },
  { value: "vegan", label: "Vegan", description: "No animal products" },
  { value: "gluten_free", label: "Gluten-Free", description: "No gluten-containing foods" },
  { value: "lactose_intolerant", label: "Lactose Intolerant", description: "No dairy products" },
  { value: "nut_allergy", label: "Nut Allergy", description: "No nuts or nut products" },
  { value: "other", label: "Other", description: "Other restrictions, please specify in notes" },
] as const;

// Extract the value types for type safety
export type DietaryOptionValue = typeof DIETARY_OPTIONS[number]['value'];

// Zod enum for validation
export const dietaryOptionSchema = z.enum([
  'none', 'strict_vegetarian', 'jain', 'swaminarayan', 'eggless', 
  'halal', 'kosher', 'vegan', 'gluten_free', 'lactose_intolerant', 
  'nut_allergy', 'other'
]);

// Helper function to get label from value
export function getDietaryLabel(value: string | null | undefined): string {
  if (!value || value === 'none') return '';
  const option = DIETARY_OPTIONS.find(o => o.value === value);
  return option?.label || value;
}

// ============================================================================
// BUDGET BUCKETS - System-defined high-level spending categories
// ============================================================================

// The fixed list of budget buckets (system-defined, not user-editable)
export const BUDGET_BUCKETS = [
  "venue", "catering", "decoration", "photography", "attire", 
  "jewelry", "religious", "entertainment", "stationery", 
  "transportation", "planning", "other"
] as const;

export type BudgetBucket = typeof BUDGET_BUCKETS[number];

// Human-readable labels for budget buckets
export const BUDGET_BUCKET_LABELS: Record<BudgetBucket, string> = {
  venue: "Venue",
  catering: "Catering & Food",
  decoration: "Decoration & Flowers",
  photography: "Photography & Video",
  attire: "Attire & Beauty",
  jewelry: "Jewelry & Accessories",
  religious: "Religious & Ceremonial",
  entertainment: "Music & Entertainment",
  stationery: "Invitations & Gifts",
  transportation: "Transportation",
  planning: "Wedding Planning Services",
  other: "Other"
};

// Zod schema for budget bucket validation
export const budgetBucketSchema = z.enum(BUDGET_BUCKETS);

// Helper function to get bucket label
export function getBucketLabel(bucket: string | null | undefined): string {
  if (!bucket) return 'Other';
  return BUDGET_BUCKET_LABELS[bucket as BudgetBucket] || bucket;
}

// ============================================================================
// BUDGET BUCKET CATEGORIES TABLE - Dynamic category management with rich metadata
// ============================================================================

export const budgetBucketCategories = pgTable("budget_bucket_categories", {
  // UUID primary key for proper relational integrity
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Slug for code compatibility (e.g., 'venue', 'catering')
  slug: varchar("slug").notNull().unique(),
  
  // Display metadata
  displayName: text("display_name").notNull(), // e.g., "Catering & Food"
  description: text("description"), // Help text for this category
  iconName: text("icon_name"), // Lucide icon name like 'utensils', 'camera', 'music'
  
  // Category classification
  isEssential: boolean("is_essential").default(true), // Essential vs. Optional grouping
  
  // Benchmark data for budget recommendations
  suggestedPercentage: integer("suggested_percentage"), // What % of budget typically goes here
  
  // Admin controls
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  isSystemCategory: boolean("is_system_category").default(false), // Can't be deleted by admin
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBudgetBucketCategorySchema = createInsertSchema(budgetBucketCategories).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertBudgetBucketCategory = z.infer<typeof insertBudgetBucketCategorySchema>;
export type BudgetBucketCategory = typeof budgetBucketCategories.$inferSelect;

// Backward compatibility aliases
export const budgetCategories = budgetBucketCategories;
export const insertBudgetCategorySchema = insertBudgetBucketCategorySchema;
export type InsertBudgetCategory = InsertBudgetBucketCategory;
export type BudgetCategory = BudgetBucketCategory;

// Default category metadata for seeding - based on typical South Asian wedding spending
export const DEFAULT_CATEGORY_METADATA: Record<BudgetBucket, {
  displayName: string;
  description: string;
  iconName: string;
  isEssential: boolean;
  suggestedPercentage: number;
  displayOrder: number;
}> = {
  venue: {
    displayName: "Venue",
    description: "Wedding venue rental, multiple event spaces",
    iconName: "building-2",
    isEssential: true,
    suggestedPercentage: 30,
    displayOrder: 1,
  },
  catering: {
    displayName: "Catering & Food",
    description: "Food service, catering staff, bar service",
    iconName: "utensils",
    isEssential: true,
    suggestedPercentage: 25,
    displayOrder: 2,
  },
  decoration: {
    displayName: "Decoration & Flowers",
    description: "Mandap, floral arrangements, ceremony decor",
    iconName: "flower-2",
    isEssential: true,
    suggestedPercentage: 10,
    displayOrder: 3,
  },
  photography: {
    displayName: "Photography & Video",
    description: "Photo and video coverage, albums, prints",
    iconName: "camera",
    isEssential: true,
    suggestedPercentage: 10,
    displayOrder: 4,
  },
  attire: {
    displayName: "Attire & Beauty",
    description: "Wedding outfits, makeup, mehndi, hair styling",
    iconName: "shirt",
    isEssential: true,
    suggestedPercentage: 8,
    displayOrder: 5,
  },
  jewelry: {
    displayName: "Jewelry & Accessories",
    description: "Wedding jewelry, kalire, accessories",
    iconName: "gem",
    isEssential: false,
    suggestedPercentage: 5,
    displayOrder: 6,
  },
  religious: {
    displayName: "Religious & Ceremonial",
    description: "Pandit, religious items, ceremony supplies",
    iconName: "flame",
    isEssential: true,
    suggestedPercentage: 3,
    displayOrder: 7,
  },
  entertainment: {
    displayName: "Music & Entertainment",
    description: "DJ, dhol, live music, sangeet performances",
    iconName: "music",
    isEssential: true,
    suggestedPercentage: 4,
    displayOrder: 8,
  },
  stationery: {
    displayName: "Invitations & Gifts",
    description: "Wedding invitations, favors, guest gifts",
    iconName: "mail",
    isEssential: false,
    suggestedPercentage: 2,
    displayOrder: 9,
  },
  transportation: {
    displayName: "Transportation",
    description: "Baraat vehicles, guest shuttles, airport pickups",
    iconName: "car",
    isEssential: false,
    suggestedPercentage: 2,
    displayOrder: 10,
  },
  planning: {
    displayName: "Wedding Planning Services",
    description: "Wedding coordinator, day-of coordination",
    iconName: "clipboard-list",
    isEssential: false,
    suggestedPercentage: 3,
    displayOrder: 11,
  },
  other: {
    displayName: "Other",
    description: "Miscellaneous wedding expenses",
    iconName: "more-horizontal",
    isEssential: false,
    suggestedPercentage: 0,
    displayOrder: 99,
  },
};

// ============================================================================
// WEDDING TRADITIONS TABLE - Database-driven tradition management
// ============================================================================

export const weddingTraditions = pgTable("wedding_traditions", {
  // UUID primary key for proper relational integrity
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Slug for code compatibility and display (e.g., 'sikh', 'hindu')
  slug: varchar("slug").notNull().unique(),
  
  // Display metadata
  displayName: text("display_name").notNull(), // e.g., "Sikh", "Hindu"
  description: text("description"), // Brief description of this tradition
  
  // Admin controls
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  isSystemTradition: boolean("is_system_tradition").default(true), // System traditions can't be deleted
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeddingTraditionSchema = createInsertSchema(weddingTraditions).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertWeddingTradition = z.infer<typeof insertWeddingTraditionSchema>;
export type WeddingTradition = typeof weddingTraditions.$inferSelect;

// ============================================================================
// WEDDING SUB-TRADITIONS TABLE - Regional/cultural variations within traditions
// ============================================================================

export const weddingSubTraditions = pgTable("wedding_sub_traditions", {
  // UUID primary key for proper relational integrity
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Slug for code compatibility (e.g., 'punjabi', 'tamil')
  slug: varchar("slug").notNull().unique(),
  
  // Parent tradition reference (UUID FK)
  traditionId: varchar("tradition_id").notNull().references(() => weddingTraditions.id),
  
  // Display metadata
  displayName: text("display_name").notNull(), // e.g., "Punjabi", "Tamil"
  description: text("description"), // Brief description of this sub-tradition
  
  // Admin controls
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  traditionIdx: index("wedding_sub_traditions_tradition_idx").on(table.traditionId),
}));

export const insertWeddingSubTraditionSchema = createInsertSchema(weddingSubTraditions).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertWeddingSubTradition = z.infer<typeof insertWeddingSubTraditionSchema>;
export type WeddingSubTradition = typeof weddingSubTraditions.$inferSelect;

// Default traditions data for seeding (slug is the code-friendly identifier)
export const DEFAULT_TRADITIONS: Array<{
  slug: string;
  displayName: string;
  description: string;
  displayOrder: number;
}> = [
  { slug: "sikh", displayName: "Sikh", description: "Punjabi Sikh wedding traditions with Anand Karaj ceremony", displayOrder: 1 },
  { slug: "hindu", displayName: "Hindu", description: "Hindu wedding traditions across regional variations", displayOrder: 2 },
  { slug: "muslim", displayName: "Muslim", description: "Islamic wedding traditions with Nikah ceremony", displayOrder: 3 },
  { slug: "gujarati", displayName: "Gujarati", description: "Gujarati Hindu wedding traditions with Garba celebrations", displayOrder: 4 },
  { slug: "south_indian", displayName: "South Indian", description: "South Indian traditions including Tamil, Telugu, Malayalam, Kannada", displayOrder: 5 },
  { slug: "christian", displayName: "Christian", description: "Christian wedding traditions with church ceremony", displayOrder: 6 },
  { slug: "jain", displayName: "Jain", description: "Jain wedding traditions with unique rituals", displayOrder: 7 },
  { slug: "parsi", displayName: "Parsi", description: "Zoroastrian Parsi wedding traditions", displayOrder: 8 },
  { slug: "mixed", displayName: "Mixed/Fusion", description: "Multi-tradition or fusion wedding combining elements", displayOrder: 9 },
  { slug: "general", displayName: "General", description: "Non-specific or secular wedding celebration", displayOrder: 10 },
];

// Default sub-traditions data for seeding (slug is the code-friendly identifier, traditionSlug references parent)
export const DEFAULT_SUB_TRADITIONS: Array<{
  slug: string;
  traditionSlug: string; // References parent tradition by slug (will be resolved to UUID at seed time)
  displayName: string;
  description: string;
  displayOrder: number;
}> = [
  // Sikh sub-traditions
  { slug: "punjabi_sikh", traditionSlug: "sikh", displayName: "Punjabi Sikh", description: "Traditional Punjabi Sikh wedding", displayOrder: 1 },
  
  // Hindu sub-traditions (regional variations)
  { slug: "punjabi_hindu", traditionSlug: "hindu", displayName: "Punjabi Hindu", description: "North Indian Punjabi Hindu traditions", displayOrder: 1 },
  { slug: "bengali", traditionSlug: "hindu", displayName: "Bengali", description: "Bengali Hindu wedding traditions", displayOrder: 2 },
  { slug: "marathi", traditionSlug: "hindu", displayName: "Marathi", description: "Maharashtrian Hindu wedding traditions", displayOrder: 3 },
  { slug: "rajasthani", traditionSlug: "hindu", displayName: "Rajasthani", description: "Rajasthani Hindu wedding traditions", displayOrder: 4 },
  { slug: "bihari", traditionSlug: "hindu", displayName: "Bihari", description: "Bihar/Jharkhand Hindu wedding traditions", displayOrder: 5 },
  { slug: "kashmiri", traditionSlug: "hindu", displayName: "Kashmiri Pandit", description: "Kashmiri Pandit wedding traditions", displayOrder: 6 },
  
  // South Indian sub-traditions
  { slug: "tamil", traditionSlug: "south_indian", displayName: "Tamil", description: "Tamil Nadu wedding traditions", displayOrder: 1 },
  { slug: "telugu", traditionSlug: "south_indian", displayName: "Telugu", description: "Andhra/Telangana wedding traditions", displayOrder: 2 },
  { slug: "malayalam", traditionSlug: "south_indian", displayName: "Malayalam (Kerala)", description: "Kerala wedding traditions", displayOrder: 3 },
  { slug: "kannada", traditionSlug: "south_indian", displayName: "Kannada", description: "Karnataka wedding traditions", displayOrder: 4 },
  
  // Gujarati sub-traditions
  { slug: "gujarati_patel", traditionSlug: "gujarati", displayName: "Patidar/Patel", description: "Patidar community traditions", displayOrder: 1 },
  { slug: "gujarati_brahmin", traditionSlug: "gujarati", displayName: "Gujarati Brahmin", description: "Gujarati Brahmin traditions", displayOrder: 2 },
  { slug: "kutchi", traditionSlug: "gujarati", displayName: "Kutchi", description: "Kutch region traditions", displayOrder: 3 },
  
  // Muslim sub-traditions
  { slug: "sunni", traditionSlug: "muslim", displayName: "Sunni", description: "Sunni Muslim traditions", displayOrder: 1 },
  { slug: "shia", traditionSlug: "muslim", displayName: "Shia", description: "Shia Muslim traditions", displayOrder: 2 },
  { slug: "hyderabadi_muslim", traditionSlug: "muslim", displayName: "Hyderabadi", description: "Hyderabadi Muslim traditions", displayOrder: 3 },
];

// Mapping from vendor categories to budget buckets
export const VENDOR_CATEGORY_TO_BUCKET: Record<string, BudgetBucket> = {
  // Venue-related
  'banquet_hall': 'venue',
  'gurdwara': 'venue',
  'temple': 'venue',
  'tent_service': 'venue',
  
  // Catering
  'caterer': 'catering',
  'mobile_food': 'catering',
  'halal_caterer': 'catering',
  
  // Decoration & Flowers
  'decorator': 'decoration',
  'florist': 'decoration',
  'mandap_decorator': 'decoration',
  'nikah_decorator': 'decoration',
  'rangoli_artist': 'decoration',
  'kolam_artist': 'decoration',
  'garland_maker': 'decoration',
  
  // Photography & Video
  'photographer': 'photography',
  'videographer': 'photography',
  
  // Attire & Beauty
  'makeup_artist': 'attire',
  'mehndi_artist': 'attire',
  'turban_tier': 'attire',
  'silk_saree_rental': 'attire',
  
  // Jewelry
  'jewelry': 'jewelry',
  
  // Religious & Ceremonial
  'pandit': 'religious',
  'qazi': 'religious',
  'imam': 'religious',
  'quran_reciter': 'religious',
  'astrologer': 'religious',
  'pooja_items': 'religious',
  'haldi_supplies': 'religious',
  'sword_rental': 'religious',
  
  // Entertainment
  'dj': 'entertainment',
  'dhol_player': 'entertainment',
  'baraat_band': 'entertainment',
  'nadaswaram_player': 'entertainment',
  'garba_instructor': 'entertainment',
  'dandiya_equipment': 'entertainment',
  
  // Transportation
  'horse_rental': 'transportation',
  'limo_service': 'transportation',
};

// Helper function to get budget bucket from vendor category
export function getVendorBudgetBucket(vendorCategories: string[] | null | undefined): BudgetBucket {
  if (!vendorCategories || vendorCategories.length === 0) return 'other';
  
  // Return the bucket for the first matching category
  for (const category of vendorCategories) {
    const bucket = VENDOR_CATEGORY_TO_BUCKET[category];
    if (bucket) return bucket;
  }
  
  return 'other';
}

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'couple' | 'vendor' | 'admin'
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  lastLoginAt: timestamp("last_login_at"),
  isSiteAdmin: boolean("is_site_admin").notNull().default(false), // Platform-wide admin access
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Deprecated fields - keeping for backward compatibility
  username: text("username"),
  password: text("password"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  verificationToken: true,
  verificationTokenExpires: true,
  resetToken: true,
  resetTokenExpires: true,
  lastLoginAt: true,
  createdAt: true,
  username: true,
  password: true,
}).extend({
  email: z.string().email(),
  passwordHash: z.string().min(8),
  role: z.enum(['couple', 'vendor', 'admin']),
  emailVerified: z.boolean().optional(), // Allow setting emailVerified during registration
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// WEDDINGS - Core planning entity
// ============================================================================

export const weddings = pgTable("weddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  // PRIMARY: UUID FK to wedding_traditions.id (required)
  traditionId: varchar("tradition_id").notNull().references(() => weddingTraditions.id),
  // DEPRECATED: Legacy slug - kept for backward compatibility, auto-resolved from traditionId
  tradition: text("tradition").notNull(), // Main tradition slug: 'sikh' | 'hindu' | 'muslim' | etc
  subTradition: text("sub_tradition"), // Single sub-tradition for most main traditions
  subTraditions: text("sub_traditions").array(), // Multiple sub-traditions for Mixed tradition
  role: text("role").notNull(), // 'bride' | 'groom' | 'planner'
  partner1Name: text("partner1_name"),
  partner2Name: text("partner2_name"),
  coupleEmail: text("couple_email"),
  couplePhone: text("couple_phone"),
  weddingDate: timestamp("wedding_date"),
  location: text("location").notNull(), // 'Bay Area' etc
  guestCountEstimate: integer("guest_count_estimate"),
  ceremonyGuestCount: integer("ceremony_guest_count"), // Event-specific: ceremony guests
  receptionGuestCount: integer("reception_guest_count"), // Event-specific: reception guests
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }),
  budgetConfirmed: boolean("budget_confirmed").default(false),
  eventsConfirmed: boolean("events_confirmed").default(false),
  budgetContribution: text("budget_contribution"), // 'couple_only' | 'both_families' | 'mix'
  partnerNewToTraditions: boolean("partner_new_to_traditions").default(false), // Culture Bridge feature
  // Budget tracking mode (set during onboarding)
  budgetTrackingMode: text("budget_tracking_mode").notNull().default('category'), // 'category' | 'ceremony' - primary tracking mode
  // Legacy budget granularity preferences (kept for backward compatibility)
  showBudgetOverview: boolean("show_budget_overview").default(true), // High-level total budget
  showBucketBudgets: boolean("show_bucket_budgets").default(true), // Budget by category (venue, catering, etc.)
  showCeremonyBudgets: boolean("show_ceremony_budgets").default(true), // Budget by ceremony/event
  status: text("status").notNull().default('planning'), // 'planning' | 'active' | 'completed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  traditionIdx: index("weddings_tradition_idx").on(table.traditionId),
}));

export const insertWeddingSchema = createInsertSchema(weddings).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  // PRIMARY: UUID FK - optional at validation, auto-resolved from tradition slug in storage layer
  traditionId: z.string().optional(),
  // DEPRECATED: Legacy slug - still required for backward compatibility, used for auto-resolution
  tradition: z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'christian', 'jain', 'parsi', 'mixed', 'other']),
  subTradition: z.string().nullable().optional(),
  subTraditions: z.array(z.string()).nullable().optional(),
  role: z.enum(['bride', 'groom', 'planner']),
  location: z.string().min(1),
  weddingDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  guestCountEstimate: z.number().min(1).optional(),
  ceremonyGuestCount: z.number().min(1).optional(),
  receptionGuestCount: z.number().min(1).optional(),
  totalBudget: z.string().nullable().optional(),
  budgetContribution: z.enum(['couple_only', 'both_families', 'mix']).nullable().optional(),
  partnerNewToTraditions: z.boolean().optional(),
  // Budget tracking mode
  budgetTrackingMode: z.enum(['category', 'ceremony']).optional(),
  // Budget granularity preferences
  showBudgetOverview: z.boolean().optional(),
  showBucketBudgets: z.boolean().optional(),
  showCeremonyBudgets: z.boolean().optional(),
});

export type InsertWedding = z.infer<typeof insertWeddingSchema>;
export type Wedding = typeof weddings.$inferSelect;

// ============================================================================
// EVENTS - Multi-day ceremony breakdown
// ============================================================================

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Legacy: 'paath' | 'mehndi' | 'maiyan' | 'sangeet' | 'anand_karaj' | 'reception' | 'custom'
  // PRIMARY: UUID FK to ceremony_types.id (required)
  ceremonyTypeId: varchar("ceremony_type_id").notNull().references(() => ceremonyTypes.id),
  date: timestamp("date"),
  time: text("time"),
  location: text("location"),
  guestCount: integer("guest_count"),
  description: text("description"),
  order: integer("order").notNull(), // For sorting timeline
  // Side-based separation for multi-family planning
  side: text("side").notNull().default("mutual"), // 'bride' | 'groom' | 'mutual' - which side owns/manages this event
  visibility: text("visibility").notNull().default("shared"), // 'private' | 'shared' - can the other side see this event
  // Budget & capacity planning fields
  costPerHead: decimal("cost_per_head", { precision: 8, scale: 2 }), // Cost per guest for this event
  allocatedBudget: decimal("allocated_budget", { precision: 10, scale: 2 }), // User-set budget allocation for this ceremony
  venueCapacity: integer("venue_capacity"), // Maximum venue capacity for this event
  // Public-facing guest website fields
  dressCode: text("dress_code"), // e.g., "Formal Indian attire", "Business casual"
  locationDetails: text("location_details"), // Detailed venue information
  directions: text("directions"), // Driving/transit directions
  mapUrl: text("map_url"), // Google Maps link
  parkingInfo: text("parking_info"), // Parking instructions
  // Livestream integration
  livestreamUrl: text("livestream_url"), // YouTube live stream URL for remote guests
}, (table) => ({
  weddingIdIdx: index("events_wedding_id_idx").on(table.weddingId),
  ceremonyTypeIdIdx: index("events_ceremony_type_id_idx").on(table.ceremonyTypeId),
}));

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
}).extend({
  // UUID FK to ceremony_types.id - optional at validation, auto-resolved from type+tradition in storage layer
  ceremonyTypeId: z.string().optional(),
  type: z.enum([
    // Sikh events
    'engagement', 'paath', 'mehndi', 'maiyan', 'sangeet', 'anand_karaj', 'reception', 'day_after',
    'chunni_chadana', 'jaggo', 'chooda', 'bakra_party', 'baraat', 'milni',
    // Hindu events
    'haldi', 'mehendi', 'sangeet_hindu', 'pheras', 'vidaai', 'tilak', 'chunni_ceremony',
    // Muslim events
    'mangni', 'mehndi_muslim', 'nikah', 'walima', 'rukhsati',
    // Gujarati events
    'mandvo_mahurat', 'pithi', 'garba', 'jaan', 'pheras_gujarati', 'vidaai_gujarati',
    // South Indian events
    'vratham', 'nalugu', 'muhurtham', 'oonjal', 'saptapadi', 'arundhati',
    // General/Western-style
    'cocktail', 'rehearsal_dinner', 'bridal_shower', 'bachelor_party',
    // Generic
    'custom', 'other'
  ]),
  date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  costPerHead: z.string().nullable().optional(),
  allocatedBudget: z.string().nullable().optional(),
  venueCapacity: z.number().nullable().optional(),
  side: z.enum(['bride', 'groom', 'mutual']).optional(),
  visibility: z.enum(['private', 'shared']).optional(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ============================================================================
// EVENT COST ITEMS - Granular cost breakdown per event
// ============================================================================

export const eventCostItems = pgTable("event_cost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(), // FK to events.id
  categoryId: varchar("category_id"), // Legacy: links to budget_categories table
  ceremonyBudgetCategoryId: varchar("ceremony_budget_category_id"), // FK to ceremony_template_items.id (template line item)
  budgetBucketCategoryId: varchar("budget_bucket_category_id"), // FK to budget_bucket_categories.id
  name: text("name").notNull(), // e.g., "Catering", "Decorations", "DJ", "Venue Rental"
  costType: text("cost_type").notNull(), // 'per_head' | 'fixed' | 'per_hour'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Cost amount
  lowEstimate: decimal("low_estimate", { precision: 10, scale: 2 }), // Low cost estimate from template
  highEstimate: decimal("high_estimate", { precision: 10, scale: 2 }), // High cost estimate from template
  notes: text("notes"), // Additional notes
}, (table) => ({
  eventIdIdx: index("event_cost_items_event_id_idx").on(table.eventId),
  ceremonyBudgetCategoryIdIdx: index("event_cost_items_ceremony_budget_category_id_idx").on(table.ceremonyBudgetCategoryId),
  budgetBucketCategoryIdIdx: index("event_cost_items_budget_bucket_category_id_idx").on(table.budgetBucketCategoryId),
}));

export const insertEventCostItemSchema = createInsertSchema(eventCostItems).omit({
  id: true,
}).extend({
  costType: z.enum(['per_head', 'fixed', 'per_hour']),
  amount: z.string(),
  categoryId: z.string().nullable().optional(),
  ceremonyBudgetCategoryId: z.string().nullable().optional(), // FK to ceremony_template_items
  budgetBucketCategoryId: z.string().nullable().optional(), // FK to budget_bucket_categories
  lowEstimate: z.string().nullable().optional(),
  highEstimate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type InsertEventCostItem = z.infer<typeof insertEventCostItemSchema>;
export type EventCostItem = typeof eventCostItems.$inferSelect;

// ============================================================================
// VENDORS - Culturally-specific service providers
// ============================================================================

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Link to user account (for vendor-owned profiles)
  name: text("name").notNull(),
  categories: text("categories").array().notNull(), // Multiple service categories vendor provides
  preferredWeddingTraditions: text("preferred_wedding_traditions").array(), // ['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general']
  location: text("location").notNull(),
  city: text("city").notNull().default('San Francisco Bay Area'), // 'San Francisco Bay Area' | 'New York City' | 'Los Angeles' | 'Chicago' | 'Seattle'
  priceRange: text("price_range").notNull(), // '$' | '$$' | '$$$' | '$$$$'
  culturalSpecialties: text("cultural_specialties").array(), // ['sikh', 'hindu', 'punjabi', etc]
  description: text("description"),
  logoUrl: text("logo_url"), // Business logo image URL
  coverImageUrl: text("cover_image_url"), // Cover/background image URL for profile
  portfolio: jsonb("portfolio"), // Array of image URLs
  availability: jsonb("availability"), // Calendar data
  contact: text("contact"),
  email: text("email"), // Vendor business email
  phone: text("phone"), // Vendor business phone
  website: text("website"), // Vendor website URL
  instagram: text("instagram"), // Instagram handle (without @)
  facebook: text("facebook"), // Facebook page URL or username
  twitter: text("twitter"), // Twitter/X handle (without @)
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  featured: boolean("featured").default(false),
  isPublished: boolean("is_published").notNull().default(false), // Whether vendor profile is visible to couples
  calendarShared: boolean("calendar_shared").notNull().default(false), // Whether vendor shares availability calendar with couples
  calendarSource: text("calendar_source").notNull().default('local'), // 'local' | 'google' | 'outlook' - which calendar is source of truth
  externalCalendarId: text("external_calendar_id"), // The ID of the external calendar (Google/Outlook) to sync with
  yelpBusinessId: text("yelp_business_id"), // Yelp business ID for fetching external reviews
  googlePlaceId: text("google_place_id"), // Google Place ID for fetching external reviews
  // Ghost Profile / Claim Your Profile fields
  claimed: boolean("claimed").notNull().default(true), // false = ghost profile from Google Places/couple-submitted, true = vendor-owned
  source: text("source").notNull().default('manual'), // 'manual' | 'google_places' | 'couple_submitted' - how the profile was created
  createdByUserId: varchar("created_by_user_id"), // User ID of who created this profile (vendor or couple)
  createdByUserType: text("created_by_user_type"), // 'vendor' | 'couple' - indicates who created the profile
  claimToken: text("claim_token"), // Token sent to vendor to claim their profile
  claimTokenExpires: timestamp("claim_token_expires"), // When the claim token expires
  notifyCooldownUntil: timestamp("notify_cooldown_until"), // Don't send another notification until this time
  lastViewNotifiedAt: timestamp("last_view_notified_at"), // Last time we notified vendor about a profile view
  viewCount: integer("view_count").notNull().default(0), // Number of profile views
  optedOutOfNotifications: boolean("opted_out_of_notifications").default(false), // Vendor opted out of claim notifications
  // Sulekha-specific fields for imported vendor data
  sulekhaRating: decimal("sulekha_rating", { precision: 3, scale: 1 }), // Sulekha score (e.g., 9.5)
  experience: text("experience"), // Years in business (e.g., "13 Years in Business")
  zipCodesServing: text("zip_codes_serving").array(), // Array of ZIP codes served
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Admin approval fields
  approvalStatus: text("approval_status").notNull().default('approved'), // 'pending' | 'approved' | 'rejected' - admin approval for new vendors
  approvalNotes: text("approval_notes"), // Admin notes for approval/rejection
  approvedBy: varchar("approved_by"), // Admin user ID who approved/rejected
  approvedAt: timestamp("approved_at"), // When the vendor was approved/rejected
}, (table) => ({
  nameIdx: index("vendors_name_idx").on(table.name),
  userIdIdx: index("vendors_user_id_idx").on(table.userId),
  cityIdx: index("vendors_city_idx").on(table.city),
}));

export const VENDOR_CATEGORIES = [
  'makeup_artist',
  'dj',
  'dhol_player',
  'turban_tier',
  'mehndi_artist',
  'photographer',
  'videographer',
  'caterer',
  'banquet_hall',
  'gurdwara',
  'temple',
  'decorator',
  'florist',
  'horse_rental',
  'sword_rental',
  'tent_service',
  'limo_service',
  'mobile_food',
  'baraat_band',
  'pandit',
  'mandap_decorator',
  'haldi_supplies',
  'pooja_items',
  'astrologer',
  'garland_maker',
  'qazi',
  'imam',
  'nikah_decorator',
  'halal_caterer',
  'quran_reciter',
  'garba_instructor',
  'dandiya_equipment',
  'rangoli_artist',
  'nadaswaram_player',
  'silk_saree_rental',
  'kolam_artist'
] as const;

export const WEDDING_TRADITIONS = [
  'Sikh',
  'Hindu', 
  'Muslim',
  'Gujarati',
  'South Indian',
  'Mixed/Fusion',
  'General'
] as const;

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  rating: true,
  reviewCount: true,
  claimToken: true,
  claimTokenExpires: true,
  notifyCooldownUntil: true,
  lastViewNotifiedAt: true,
  viewCount: true,
  approvalStatus: true,
  approvalNotes: true,
  approvedBy: true,
  approvedAt: true,
}).extend({
  categories: z.array(z.enum(VENDOR_CATEGORIES)).min(1, "Select at least one service category"),
  preferredWeddingTraditions: z.array(z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general'])).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  claimed: z.boolean().optional(),
  source: z.enum(['manual', 'google_places', 'couple_submitted']).optional(),
  createdByUserType: z.enum(['vendor', 'couple', 'system']).optional(),
  optedOutOfNotifications: z.boolean().optional(),
});

export const coupleSubmitVendorSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  categories: z.array(z.enum(VENDOR_CATEGORIES)).min(1, "Select at least one category"),
  city: z.enum(['San Francisco Bay Area', 'New York City', 'Los Angeles', 'Chicago', 'Seattle']),
  location: z.string().min(1, "Address/Location is required"),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  culturalSpecialties: z.array(z.string()).optional(),
  description: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().transform(val => val?.replace(/\D/g, '') || null),
  website: z.string().url().optional().or(z.literal("")),
  instagram: z.string().optional().transform(val => val?.replace(/^@/, '') || null),
});

export type CoupleSubmitVendor = z.infer<typeof coupleSubmitVendorSchema>;

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// ============================================================================
// VENDOR CLAIM STAGING - Pending claims requiring admin review
// ============================================================================

export const vendorClaimStaging = pgTable("vendor_claim_staging", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(), // The vendor being claimed
  vendorName: text("vendor_name").notNull(), // Copy of vendor name at time of claim
  vendorCategories: text("vendor_categories").array().notNull(), // Copy of vendor categories
  vendorLocation: text("vendor_location"), // Copy of vendor location
  vendorCity: text("vendor_city"), // Copy of vendor city
  claimantEmail: text("claimant_email").notNull(), // Email provided by the claimant
  claimantName: text("claimant_name"), // Optional name of claimant
  claimantPhone: text("claimant_phone"), // Optional phone of claimant
  businessDocuments: text("business_documents").array(), // Optional document URLs for verification
  notes: text("notes"), // Optional notes from claimant
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'denied'
  adminNotes: text("admin_notes"), // Notes from admin on decision
  reviewedBy: varchar("reviewed_by"), // Admin user who reviewed
  reviewedAt: timestamp("reviewed_at"), // When the claim was reviewed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorClaimStagingSchema = createInsertSchema(vendorClaimStaging).omit({
  id: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
});

export type InsertVendorClaimStaging = z.infer<typeof insertVendorClaimStagingSchema>;
export type VendorClaimStaging = typeof vendorClaimStaging.$inferSelect;

// ============================================================================
// SERVICE PACKAGES - Vendor service packages with cultural specialization
// ============================================================================

export const servicePackages = pgTable("service_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  traditions: text("traditions").array(), // Multiple traditions this package applies to
  categories: text("categories").array(), // Multiple service categories this package covers
  features: jsonb("features"), // List of what's included (stored as JSON array)
  duration: text("duration"), // e.g., "Full Day", "4 Hours", "Multi-Day"
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Package name is required"),
  price: z.string().min(1, "Price is required"),
  traditions: z.array(z.string()).min(1, "Select at least one tradition"),
  categories: z.array(z.string()).min(1, "Select at least one service category"),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;

// ============================================================================
// BOOKINGS - Vendor assignment to events
// ============================================================================

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"),
  vendorId: varchar("vendor_id").notNull(),
  requestedDate: timestamp("requested_date"), // The date couple is requesting for the service
  timeSlot: text("time_slot"), // 'morning' | 'afternoon' | 'evening' | 'full_day'
  status: text("status").notNull().default('pending'), // 'pending' | 'confirmed' | 'declined' | 'cancelled'
  bookingSource: text("booking_source").notNull().default('platform'), // 'platform' | 'offline' - where the booking was made
  requestDate: timestamp("request_date").notNull().defaultNow(),
  confirmedDate: timestamp("confirmed_date"),
  declinedDate: timestamp("declined_date"),
  declineReason: text("decline_reason"), // Vendor's reason for declining
  alternateSlots: jsonb("alternate_slots"), // Array of {date: Date, timeSlot: string, notes: string} suggested by vendor
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  coupleNotes: text("couple_notes"), // Notes from the couple when requesting
  vendorNotes: text("vendor_notes"), // Notes from vendor when responding
  // Deposit payment tracking
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Required deposit to confirm booking
  depositPercentage: integer("deposit_percentage").default(25), // % of estimated cost
  depositPaid: boolean("deposit_paid").default(false),
  depositPaidDate: timestamp("deposit_paid_date"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"), // 'pending' | 'succeeded' | 'failed'
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  requestDate: true,
  confirmedDate: true,
  declinedDate: true,
  depositPaidDate: true,
}).extend({
  status: z.enum(['pending', 'confirmed', 'declined', 'cancelled']).optional(),
  bookingSource: z.enum(['platform', 'offline']).optional(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'full_day']).optional(),
  requestedDate: z.coerce.date().optional(),
  depositAmount: z.string().optional(),
  depositPercentage: z.number().optional(),
  depositPaid: z.boolean().optional(),
  stripePaymentIntentId: z.string().optional(),
  stripePaymentStatus: z.enum(['pending', 'succeeded', 'failed']).optional(),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// ============================================================================
// VENDOR FAVORITES - Couples can save vendors they're interested in
// ============================================================================

export const vendorFavorites = pgTable("vendor_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorFavoriteSchema = createInsertSchema(vendorFavorites).omit({
  id: true,
  createdAt: true,
});
export type InsertVendorFavorite = z.infer<typeof insertVendorFavoriteSchema>;
export type VendorFavorite = typeof vendorFavorites.$inferSelect;

// ============================================================================
// EXPENSES - Single Ledger Model for expense tracking
// Uses BUDGET_BUCKETS (code constant) for high-level categories
// User provides custom expense names for granular tracking
// ============================================================================

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  
  // Tie to ceremony from events table (e.g., event ID or ceremony type like 'sikh_sangeet')
  ceremonyId: text("ceremony_id"), // Legacy: which ceremony this expense belongs to (event.id or type string)
  eventId: varchar("event_id"), // FK to events.id (new, nullable during migration)
  
  // Tie to HIGH-LEVEL system category from BUDGET_BUCKETS
  parentCategory: text("parent_category").notNull(), // DEPRECATED: Legacy e.g., "attire", "catering", "venue"
  // PRIMARY: UUID FK to budget_bucket_categories.id (required)
  bucketCategoryId: varchar("bucket_category_id").notNull(), // FK to budget_bucket_categories.id
  
  // Link to planned cost item (The Plan)
  eventCostItemId: varchar("event_cost_item_id"), // FK to event_cost_items.id (new, nullable during migration)
  
  // User-defined granular name for this expense
  expenseName: text("expense_name").notNull(), // e.g., "Custom Pink Pagg Turbans"
  
  // Financial fields
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default('0'),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default('0'),
  
  // Status tracking
  status: text("status").notNull().default('estimated'), // 'estimated' | 'booked' | 'paid'
  
  // Who paid
  paidById: varchar("paid_by_id").notNull(),
  paidByName: text("paid_by_name").notNull(),
  
  // Optional vendor link
  vendorId: varchar("vendor_id"),
  
  // Optional fields
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  paymentDueDate: timestamp("payment_due_date"),
  
  // Timestamps
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdIdx: index("expenses_wedding_id_idx").on(table.weddingId),
  parentCategoryIdx: index("expenses_parent_category_idx").on(table.parentCategory),
  ceremonyIdIdx: index("expenses_ceremony_id_idx").on(table.ceremonyId),
  eventIdIdx: index("expenses_event_id_idx").on(table.eventId),
  bucketCategoryIdIdx: index("expenses_bucket_category_id_idx").on(table.bucketCategoryId),
  eventCostItemIdIdx: index("expenses_event_cost_item_id_idx").on(table.eventCostItemId),
}));

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  // DEPRECATED: Legacy slug - still required for backward compatibility, used for auto-resolution
  parentCategory: budgetBucketSchema,
  eventId: z.string().nullable().optional(), // FK to events.id
  // PRIMARY: UUID FK - optional at validation, auto-resolved from parentCategory slug in storage layer
  bucketCategoryId: z.string().optional(),
  eventCostItemId: z.string().nullable().optional(), // FK to event_cost_items.id
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal"),
  amountPaid: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount paid must be a valid decimal").optional(),
  status: z.enum(['estimated', 'booked', 'paid']).optional(),
  expenseDate: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  paymentDueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// ============================================================================
// EXPENSE SPLITS - How each expense is divided between parties
// ============================================================================

export const expenseSplits = pgTable("expense_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: varchar("expense_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(),
  sharePercentage: integer("share_percentage"),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
});

export const insertExpenseSplitSchema = createInsertSchema(expenseSplits).omit({
  id: true,
}).extend({
  shareAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Share amount must be a valid decimal"),
  sharePercentage: z.number().optional(),
  isPaid: z.boolean().optional(),
  paidAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertExpenseSplit = z.infer<typeof insertExpenseSplitSchema>;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;

// ============================================================================
// BUDGET ALLOCATIONS - Unified budget planning table (Single Ledger Model)
// Consolidates bucket-level, ceremony-level, and line-item-level budgets
// - ceremonyId NULL + lineItemLabel NULL = total budget for bucket
// - ceremonyId set + lineItemLabel NULL = ceremony-level bucket budget
// - ceremonyId set + lineItemLabel set = specific line item budget
// ============================================================================

export const budgetAllocations = pgTable("budget_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  // PRIMARY: UUID FK to budget_bucket_categories.id (required)
  bucketCategoryId: varchar("bucket_category_id").notNull().references(() => budgetBucketCategories.id),
  // DEPRECATED: Legacy slug - kept for backward compatibility, auto-resolved from bucketCategoryId
  bucket: text("bucket").notNull(), // From BUDGET_BUCKETS (venue, catering, etc.)
  ceremonyId: varchar("ceremony_id"), // Optional: References events.id - if set, this is ceremony-specific
  lineItemLabel: text("line_item_label"), // Optional: "Turban Tying", "DJ", etc. - granular line item
  allocatedAmount: decimal("allocated_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  // Auto-aggregation: calculated amounts from ceremony budget categories
  autoLowAmount: decimal("auto_low_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  autoHighAmount: decimal("auto_high_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  autoItemCount: integer("auto_item_count").notNull().default(0),
  isManualOverride: boolean("is_manual_override").notNull().default(false), // True if user manually set allocatedAmount
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  weddingBucketIdx: index("budget_allocations_wedding_bucket_idx").on(table.weddingId, table.bucket),
  weddingCeremonyIdx: index("budget_allocations_wedding_ceremony_idx").on(table.weddingId, table.ceremonyId),
  weddingBucketCeremonyIdx: index("budget_allocations_wedding_bucket_ceremony_idx").on(table.weddingId, table.bucket, table.ceremonyId),
  weddingBucketCategoryIdx: index("budget_allocations_bucket_category_idx").on(table.weddingId, table.bucketCategoryId),
  uniqueAllocation: uniqueIndex("budget_allocations_unique").on(table.weddingId, table.bucket, table.ceremonyId, table.lineItemLabel),
}));

export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocations).omit({
  id: true,
  createdAt: true,
}).extend({
  // PRIMARY: UUID FK - optional at validation, auto-resolved from bucket slug in storage layer
  bucketCategoryId: z.string().optional(),
  // DEPRECATED: Legacy slug - still required for backward compatibility, used for auto-resolution
  bucket: budgetBucketSchema,
  ceremonyId: z.string().nullable().optional(),
  lineItemLabel: z.string().nullable().optional(),
  allocatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal"),
  // Auto-aggregation fields (optional - set by backend service)
  autoLowAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  autoHighAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  autoItemCount: z.number().int().optional(),
  isManualOverride: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type BudgetAllocation = typeof budgetAllocations.$inferSelect;

// ============================================================================
// HOUSEHOLDS - Family/group management for unified RSVPs
// ============================================================================

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // e.g., "The Patel Family"
  // Address fields
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressPostalCode: text("address_postal_code"),
  addressCountry: text("address_country"),
  maxCount: integer("max_count").notNull().default(1), // Total seats allocated (e.g., 4)
  affiliation: text("affiliation").notNull().default("bride"), // "bride" | "groom" | "mutual"
  relationshipTier: text("relationship_tier").notNull().default("friend"), // "immediate_family" | "extended_family" | "friend" | "parents_friend" | "coworker"
  // Priority and source tracking for advanced guest management
  priorityTier: text("priority_tier").notNull().default("should_invite"), // "must_invite" | "should_invite" | "nice_to_have"
  sourceId: varchar("source_id"), // Reference to guest_sources table
  // Desi dietary preferences for South Asian weddings
  desiDietaryType: text("desi_dietary_type"), // 'strict_vegetarian' | 'jain' | 'swaminarayan' | 'eggless' | 'halal' | 'none'
  // Head of House - index of the member who is the primary contact (0-based index in members array)
  headOfHouseIndex: integer("head_of_house_index").default(0),
  // Lifafa (monetary gift) tracking post-wedding
  lifafaAmount: decimal("lifafa_amount", { precision: 10, scale: 2 }), // Monetary gift amount
  giftDescription: text("gift_description"), // Description of physical gifts (e.g., "Silver Set, Saree")
  giftNotes: text("gift_notes"), // Notes about gifts received
  thankYouSent: boolean("thank_you_sent").default(false), // Whether thank you note was sent
  magicLinkTokenHash: varchar("magic_link_token_hash").unique(), // HASHED secure token for passwordless access
  magicLinkToken: varchar("magic_link_token"), // Plaintext token for QR/copy functionality
  magicLinkExpires: timestamp("magic_link_expires"), // Token expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  magicLinkTokenHash: true,
  magicLinkToken: true,
  magicLinkExpires: true,
  createdAt: true,
}).extend({
  addressStreet: z.string().nullable().optional(),
  addressCity: z.string().nullable().optional(),
  addressState: z.string().nullable().optional(),
  addressPostalCode: z.string().nullable().optional(),
  addressCountry: z.string().nullable().optional(),
  desiDietaryType: dietaryOptionSchema.nullable().optional(),
  headOfHouseIndex: z.number().nullable().optional(),
  lifafaAmount: z.string().nullable().optional(),
  giftDescription: z.string().nullable().optional(),
  thankYouSent: z.boolean().nullable().optional(),
});

export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Household = typeof households.$inferSelect;

// ============================================================================
// GUESTS - Multi-event guest management
// ============================================================================

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  householdId: varchar("household_id"), // Links to households table for family grouping
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // Address fields (used when guest is not part of a household, or for individual mailing)
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressPostalCode: text("address_postal_code"),
  addressCountry: text("address_country"),
  isMainHouseholdContact: boolean("is_main_household_contact").default(false), // If true, this guest is the main contact for their household
  side: text("side").notNull().default('mutual'), // 'bride' | 'groom' | 'mutual' (Affiliation)
  relationshipTier: text("relationship_tier"), // 'immediate_family' | 'extended_family' | 'friend' | 'parents_friend'
  group: text("group"), // Legacy field - deprecated, use householdId
  eventIds: text("event_ids").array(), // Which events they're invited to (deprecated - use invitations table)
  rsvpStatus: text("rsvp_status").default('pending'), // 'pending' | 'confirmed' | 'declined' | 'uninvited' (deprecated - use invitations table)
  plusOne: boolean("plus_one").default(false), // Flag indicating this guest can bring a plus-one
  plusOneForGuestId: varchar("plus_one_for_guest_id"), // If set, this guest IS a plus-one for the referenced guest
  dietaryRestrictions: text("dietary_restrictions"), // (deprecated - use invitations table)
  magicLinkTokenHash: varchar("magic_link_token_hash").unique(), // HASHED secure token (deprecated - use household token)
  magicLinkExpires: timestamp("magic_link_expires"), // Token expiration (deprecated - use household token)
  // Privacy & Consensus fields for South Asian wedding side-based management
  visibility: text("visibility").notNull().default('shared'), // 'private' | 'shared' - private guests hidden from partner until shared
  addedBySide: text("added_by_side"), // 'bride' | 'groom' - which partner added this guest
  consensusStatus: text("consensus_status").notNull().default('approved'), // 'pending' | 'under_discussion' | 'approved' | 'declined' | 'frozen' | 'waitlisted'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdIdx: index("guests_wedding_id_idx").on(table.weddingId),
  householdIdIdx: index("guests_household_id_idx").on(table.householdId),
  plusOneForGuestIdIdx: index("guests_plus_one_for_guest_id_idx").on(table.plusOneForGuestId),
}));

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  magicLinkTokenHash: true,
  magicLinkExpires: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, { message: "Guest name is required" }),
  addressStreet: z.string().nullable().optional(),
  addressCity: z.string().nullable().optional(),
  addressState: z.string().nullable().optional(),
  addressPostalCode: z.string().nullable().optional(),
  addressCountry: z.string().nullable().optional(),
  isMainHouseholdContact: z.boolean().optional(),
  side: z.enum(['bride', 'groom', 'mutual']).optional(),
  relationshipTier: z.enum(['immediate_family', 'extended_family', 'friend', 'parents_friend']).optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'uninvited']).optional(),
  visibility: z.enum(['private', 'shared']).optional(),
  addedBySide: z.enum(['bride', 'groom']).optional(),
  consensusStatus: z.enum(['pending', 'under_discussion', 'approved', 'declined', 'frozen', 'waitlisted']).optional(),
});

export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

// ============================================================================
// GUEST COLLECTOR LINKS - Shareable links for family to submit guest suggestions
// ============================================================================

export const guestCollectorLinks = pgTable("guest_collector_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  token: varchar("token").notNull().unique(), // Unique shareable token
  name: text("name").notNull(), // e.g., "Mom's Guest List", "Uncle Raj's Contacts"
  side: text("side").notNull(), // 'bride' | 'groom' - which side this collector belongs to
  createdById: varchar("created_by_id").notNull(), // User who created this link
  createdByName: text("created_by_name"), // Cached name of creator
  maxSubmissions: integer("max_submissions"), // Optional limit on number of submissions
  submissionCount: integer("submission_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuestCollectorLinkSchema = createInsertSchema(guestCollectorLinks).omit({
  id: true,
  token: true,
  submissionCount: true,
  createdAt: true,
}).extend({
  side: z.enum(['bride', 'groom']),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertGuestCollectorLink = z.infer<typeof insertGuestCollectorLinkSchema>;
export type GuestCollectorLink = typeof guestCollectorLinks.$inferSelect;

// Guest submissions through collector links - supports household-first entry
export const guestCollectorSubmissions = pgTable("guest_collector_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectorLinkId: varchar("collector_link_id").notNull().references(() => guestCollectorLinks.id, { onDelete: 'cascade' }),
  weddingId: varchar("wedding_id").notNull(),
  submitterName: text("submitter_name"), // Name of person submitting (optional)
  submitterRelation: text("submitter_relation"), // e.g., "Mother of Bride"
  // Household-first entry support (Dadi-proof unified flow)
  householdName: text("household_name").notNull(), // e.g., "The Sharma Family"
  mainContactName: text("main_contact_name"), // Primary contact person for invitations
  mainContactPhone: text("main_contact_phone"), // Contact phone number
  mainContactEmail: text("main_contact_email"), // Contact email address
  // Contact address fields
  contactStreet: text("contact_street"), // Street address
  contactCity: text("contact_city"), // City
  contactState: text("contact_state"), // State/Province
  contactPostalCode: text("contact_postal_code"), // Postal/ZIP code
  contactCountry: text("contact_country"), // Country
  guestCount: integer("guest_count").default(1), // Number of family members invited
  dietaryRestriction: text("dietary_restriction"), // Household dietary preference (uses DIETARY_OPTIONS)
  members: jsonb("members"), // Individual guest members with name, email, phone, dietary
  eventSuggestions: text("event_suggestions").array(), // Suggested event IDs for this family
  relationshipTier: text("relationship_tier"), // 'immediate_family' | 'extended_family' | 'friend' | 'parents_friend'
  notes: text("notes"), // Any notes about the family
  submissionSessionId: text("submission_session_id"), // Browser session ID to track submissions from same device
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'declined' | 'maybe'
  reviewedById: varchar("reviewed_by_id"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type for per-guest dietary info (with optional contact for magic links)
export const guestDietaryInfoSchema = z.array(z.object({
  name: z.string(),
  dietary: dietaryOptionSchema,
  phone: z.string().optional(),
  email: z.string().optional(),
}));

export type GuestDietaryInfo = z.infer<typeof guestDietaryInfoSchema>;

// Individual guest member schema
export const guestMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  dietaryRestriction: dietaryOptionSchema.optional(),
});

export type GuestMember = z.infer<typeof guestMemberSchema>;

export const insertGuestCollectorSubmissionSchema = createInsertSchema(guestCollectorSubmissions).omit({
  id: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
}).extend({
  relationshipTier: z.enum(['immediate_family', 'extended_family', 'friend', 'parents_friend']).optional(),
  dietaryRestriction: dietaryOptionSchema.nullable().optional(),
  guestCount: z.number().optional(),
  // Address fields
  contactStreet: z.string().nullable().optional(),
  contactCity: z.string().nullable().optional(),
  contactState: z.string().nullable().optional(),
  contactPostalCode: z.string().nullable().optional(),
  contactCountry: z.string().nullable().optional(),
  // Individual guest members - stored as JSONB array
  members: z.array(guestMemberSchema).nullable().optional(),
  // Event suggestions
  eventSuggestions: z.array(z.string()).nullable().optional(),
  mainContactName: z.string().nullable().optional(),
  mainContactEmail: z.string().nullable().optional(),
  mainContactPhone: z.string().nullable().optional(),
  submissionSessionId: z.string().nullable().optional(),
});

export type InsertGuestCollectorSubmission = z.infer<typeof insertGuestCollectorSubmissionSchema>;
export type GuestCollectorSubmission = typeof guestCollectorSubmissions.$inferSelect;

// ============================================================================
// INVITATIONS - Junction table linking guests to specific events
// ============================================================================

export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull().references(() => guests.id, { onDelete: 'cascade' }), // Foreign key to guests.id
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }), // Foreign key to events.id
  rsvpStatus: text("rsvp_status").notNull().default('pending'), // 'attending' | 'not_attending' | 'pending'
  dietaryRestrictions: text("dietary_restrictions"), // Per-event dietary restrictions
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"), // When guest responded to RSVP
  plusOneAttending: boolean("plus_one_attending"), // Whether they're bringing a plus one to this event
}, (table) => {
  return {
    // Composite unique constraint to prevent duplicate RSVPs for same guest/event
    guestEventUnique: sql`UNIQUE(guest_id, event_id)`,
  };
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  invitedAt: true,
  respondedAt: true,
}).extend({
  rsvpStatus: z.enum(['attending', 'not_attending', 'pending']).optional(),
});

export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;

// ============================================================================
// GUEST COMMUNICATIONS - Tracking all messages sent to guests
// ============================================================================

export const guestCommunications = pgTable("guest_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'invitation' | 'rsvp_reminder' | 'update' | 'thank_you'
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  channel: text("channel").notNull().default('email'), // 'email' | 'sms' | 'both'
  recipientCount: integer("recipient_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: text("status").notNull().default('pending'), // 'pending' | 'sending' | 'completed' | 'failed'
  scheduledAt: timestamp("scheduled_at"), // For scheduled sends
  sentAt: timestamp("sent_at"), // When actually sent
  sentById: varchar("sent_by_id").notNull(), // User who sent
  eventIds: text("event_ids").array(), // Which events this relates to
  householdIds: text("household_ids").array(), // Which households received this
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdIdx: index("guest_communications_wedding_id_idx").on(table.weddingId),
  typeIdx: index("guest_communications_type_idx").on(table.type),
  statusIdx: index("guest_communications_status_idx").on(table.status),
}));

export const insertGuestCommunicationSchema = createInsertSchema(guestCommunications).omit({
  id: true,
  deliveredCount: true,
  failedCount: true,
  status: true,
  sentAt: true,
  createdAt: true,
}).extend({
  type: z.enum(['invitation', 'rsvp_reminder', 'update', 'thank_you']),
  channel: z.enum(['email', 'sms', 'both']).optional(),
  scheduledAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  eventIds: z.array(z.string()).optional(),
  householdIds: z.array(z.string()).optional(),
});

export type InsertGuestCommunication = z.infer<typeof insertGuestCommunicationSchema>;
export type GuestCommunication = typeof guestCommunications.$inferSelect;

// Communication Recipients - Individual delivery tracking
export const communicationRecipients = pgTable("communication_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communicationId: varchar("communication_id").notNull().references(() => guestCommunications.id, { onDelete: 'cascade' }),
  householdId: varchar("household_id").notNull().references(() => households.id, { onDelete: 'cascade' }),
  email: text("email"),
  phone: text("phone"),
  channel: text("channel").notNull(), // 'email' | 'sms'
  status: text("status").notNull().default('pending'), // 'pending' | 'sent' | 'delivered' | 'failed' | 'opened'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
}, (table) => ({
  communicationIdIdx: index("communication_recipients_communication_id_idx").on(table.communicationId),
  householdIdIdx: index("communication_recipients_household_id_idx").on(table.householdId),
  statusIdx: index("communication_recipients_status_idx").on(table.status),
}));

export const insertCommunicationRecipientSchema = createInsertSchema(communicationRecipients).omit({
  id: true,
  status: true,
  errorMessage: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
}).extend({
  channel: z.enum(['email', 'sms']),
});

export type InsertCommunicationRecipient = z.infer<typeof insertCommunicationRecipientSchema>;
export type CommunicationRecipient = typeof communicationRecipients.$inferSelect;

// ============================================================================
// TASKS - Checklist management
// ============================================================================

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  priority: text("priority").default('medium'), // 'high' | 'medium' | 'low'
  category: text("category"),
  phase: text("phase"), // 'vision' | 'curation' | 'logistics' | 'home_stretch'
  assignedToId: varchar("assigned_to_id"), // Team member user ID
  assignedToName: text("assigned_to_name"), // Cached name for display
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderDate: timestamp("reminder_date"), // Specific date to send reminder
  reminderDaysBefore: integer("reminder_days_before").default(1), // Days before due date to send reminder (legacy)
  reminderMethod: text("reminder_method").default('email'), // 'email' | 'sms' | 'both'
  lastReminderSentAt: timestamp("last_reminder_sent_at"), // Track on-demand reminders
  completedAt: timestamp("completed_at"), // When task was completed
  createdAt: timestamp("created_at").defaultNow(),
  // AI recommendation fields
  isAiRecommended: boolean("is_ai_recommended").default(false), // Was this task AI-generated
  aiReason: text("ai_reason"), // Why AI recommended this task
  aiCategory: text("ai_category"), // AI categorization (e.g., 'vendor', 'venue', 'attire', 'ceremony')
  dismissed: boolean("dismissed").default(false), // If user dismissed the AI recommendation
}, (table) => ({
  weddingIdIdx: index("tasks_wedding_id_idx").on(table.weddingId),
  eventIdIdx: index("tasks_event_id_idx").on(table.eventId),
  assignedToIdIdx: index("tasks_assigned_to_id_idx").on(table.assignedToId),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  completedAt: true,
  createdAt: true,
}).extend({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  reminderDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  reminderMethod: z.enum(['email', 'sms', 'both']).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ============================================================================
// TASK TEMPLATES - Tradition-specific task templates for auto-seeding
// ============================================================================

export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(), // Original ID like "H01", "SK01", etc.
  tradition: text("tradition").notNull(), // 'hindu' | 'sikh' | 'muslim' | 'gujarati' | 'south_indian' | 'christian' | 'jain' | 'parsi' | 'general'
  title: text("title").notNull(), // Task name
  category: text("category").notNull(), // Category like "Venue", "Attire", "Rituals"
  description: text("description").notNull(),
  ceremony: text("ceremony"), // Related ceremony like "Wedding Ceremony", "Mehndi", etc.
  priority: text("priority").notNull().default('medium'), // 'high' | 'medium' | 'low'
  daysBeforeWedding: integer("days_before_wedding"), // Days before wedding when this should be done
  phase: text("phase"), // 'vision' | 'curation' | 'logistics' | 'home_stretch'
  isActive: boolean("is_active").notNull().default(true), // Allow disabling templates
  sortOrder: integer("sort_order"), // For custom ordering within tradition
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  traditionIdx: index("task_templates_tradition_idx").on(table.tradition),
  templateIdIdx: index("task_templates_template_id_idx").on(table.templateId),
}));

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tradition: z.enum(['hindu', 'sikh', 'muslim', 'gujarati', 'south_indian', 'christian', 'jain', 'parsi', 'mixed', 'other', 'general']),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  phase: z.enum(['vision', 'curation', 'logistics', 'home_stretch']).optional(),
});

export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;

// ============================================================================
// TASK REMINDERS - Track sent reminders
// ============================================================================

export const taskReminders = pgTable("task_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  weddingId: varchar("wedding_id").notNull(),
  reminderType: text("reminder_type").notNull(), // 'email' | 'sms'
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  sentTo: text("sent_to").notNull(), // Email address or phone number
  status: text("status").notNull().default('sent'), // 'sent' | 'failed' | 'delivered'
  errorMessage: text("error_message"),
});

export const insertTaskReminderSchema = createInsertSchema(taskReminders).omit({
  id: true,
  sentAt: true,
});

export type InsertTaskReminder = z.infer<typeof insertTaskReminderSchema>;
export type TaskReminder = typeof taskReminders.$inferSelect;

// ============================================================================
// TASK COMMENTS - Collaborative comments on tasks
// ============================================================================

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  weddingId: varchar("wedding_id").notNull(),
  userId: varchar("user_id").notNull(), // Who posted the comment
  userName: text("user_name").notNull(), // Display name for quick access
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

// ============================================================================
// CONTRACTS - Vendor contract management
// ============================================================================

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(), // Which event this contract is for
  vendorId: varchar("vendor_id").notNull(),
  bookingId: varchar("booking_id"), // Optional - for legacy compatibility
  contractTerms: text("contract_terms"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMilestones: jsonb("payment_milestones"), // Array of {name, amount, dueDate, status, paidDate}
  status: text("status").notNull().default('draft'), // 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'cancelled'
  signedDate: timestamp("signed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
}).extend({
  eventId: z.string().min(1, "Event is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  status: z.enum(['draft', 'sent', 'signed', 'active', 'completed', 'cancelled']).optional(),
  totalAmount: z.string().min(1, "Contract amount is required"),
  signedDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  bookingId: z.string().optional().nullable(),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ============================================================================
// CONTRACT TEMPLATES - Pre-made contract templates for vendor categories
// ============================================================================

export const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  vendorCategory: text("vendor_category").notNull(), // Matches vendor category: 'photographer', 'caterer', 'decorator', etc.
  description: text("description"),
  templateContent: text("template_content").notNull(), // The actual contract terms with placeholders
  keyTerms: jsonb("key_terms"), // Array of key terms/highlights for quick preview
  suggestedMilestones: jsonb("suggested_milestones"), // Default payment milestones structure
  isDefault: boolean("is_default").default(false), // Mark as default template for category
  isCustom: boolean("is_custom").default(false), // User-created templates vs system templates
  weddingId: varchar("wedding_id"), // Null for system templates, set for custom user templates
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  isDefault: z.boolean().optional(),
  isCustom: z.boolean().optional(),
});

export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

// ============================================================================
// MESSAGES - Couple-Vendor Communication
// ============================================================================

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // Composite of weddingId-vendorId-eventId for grouping
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  eventId: varchar("event_id"), // Optional - for event-specific conversations
  senderId: varchar("sender_id").notNull(), // Could be couple or vendor
  senderType: text("sender_type").notNull(), // 'couple' | 'vendor' | 'system'
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs
  isRead: boolean("is_read").default(false),
  messageType: text("message_type").default('message'), // 'message' | 'booking_request' | 'booking_confirmed' | 'booking_declined'
  bookingId: varchar("booking_id"), // Reference to booking for booking-related messages
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  conversationId: true, // Generated server-side from weddingId + vendorId + eventId
}).extend({
  senderType: z.enum(['couple', 'vendor', 'system']),
  messageType: z.enum(['message', 'booking_request', 'booking_confirmed', 'booking_declined']).optional(),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ============================================================================
// CONVERSATION STATUS - Track whether conversations are open or closed
// ============================================================================

export const conversationStatus = pgTable("conversation_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().unique(),
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  eventId: varchar("event_id"),
  status: text("status").notNull().default('open'), // 'open' | 'closed'
  closedBy: varchar("closed_by"), // userId who closed the conversation
  closedByType: text("closed_by_type"), // 'couple' | 'vendor'
  closureReason: text("closure_reason"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationStatusSchema = createInsertSchema(conversationStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['open', 'closed']).optional(),
  closedByType: z.enum(['couple', 'vendor']).optional(),
});

export type InsertConversationStatus = z.infer<typeof insertConversationStatusSchema>;
export type ConversationStatus = typeof conversationStatus.$inferSelect;

// ============================================================================
// QUICK REPLY TEMPLATES - Vendor response templates for common inquiries
// ============================================================================

export const quickReplyTemplates = pgTable("quick_reply_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category"), // e.g., 'greeting', 'pricing', 'availability', 'follow-up'
  isDefault: boolean("is_default").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuickReplyTemplateSchema = createInsertSchema(quickReplyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Template content is required"),
});

export type InsertQuickReplyTemplate = z.infer<typeof insertQuickReplyTemplateSchema>;
export type QuickReplyTemplate = typeof quickReplyTemplates.$inferSelect;

// ============================================================================
// FOLLOW-UP REMINDERS - Vendor reminders for lead follow-ups
// ============================================================================

export const followUpReminders = pgTable("follow_up_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  conversationId: varchar("conversation_id").notNull(),
  weddingId: varchar("wedding_id").notNull(),
  reminderDate: timestamp("reminder_date").notNull(),
  note: text("note"),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'dismissed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFollowUpReminderSchema = createInsertSchema(followUpReminders).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(['pending', 'completed', 'dismissed']).optional(),
});

export type InsertFollowUpReminder = z.infer<typeof insertFollowUpReminderSchema>;
export type FollowUpReminder = typeof followUpReminders.$inferSelect;

// ============================================================================
// REVIEWS - Vendor rating and feedback system
// ============================================================================

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  helpful: integer("helpful").default(0), // Count of users who found this helpful
  createdById: varchar("created_by_id"), // User ID of who submitted the review (couple or collaborator)
  createdByName: text("created_by_name"), // Display name of reviewer for quick access
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  helpful: true,
}).extend({
  rating: z.number().min(1).max(5),
  createdById: z.string().optional(),
  createdByName: z.string().optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ============================================================================
// PLAYLISTS - Music playlist collaboration for events
// ============================================================================

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(), // Which event this playlist is for
  name: text("name").notNull(),
  description: text("description"),
  sharedWithVendors: text("shared_with_vendors").array().default(sql`ARRAY[]::text[]`), // Array of vendor IDs who can view
  isPublic: boolean("is_public").default(false), // If true, guests can view and vote
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  eventId: z.string().min(1, "Event is required"),
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// ============================================================================
// PLAYLIST SONGS - Individual songs in playlists with voting
// ============================================================================

export const playlistSongs = pgTable("playlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  duration: text("duration"), // e.g., "3:45"
  category: text("category"), // 'first_dance' | 'father_daughter' | 'mother_son' | 'cake_cutting' | 'party' | 'slow' | 'entrance' | 'exit' | 'dinner' | 'other'
  streamingLink: text("streaming_link"), // Spotify or Apple Music link
  requestedBy: text("requested_by"), // Guest name or "Couple"
  isGuestRequest: boolean("is_guest_request").default(false), // True if submitted by a guest
  notes: text("notes"), // Special instructions for DJ
  voteCount: integer("vote_count").default(0),
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'declined'
  order: integer("order"), // For custom playlist ordering
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const SONG_CATEGORIES = [
  { value: 'first_dance', label: 'First Dance' },
  { value: 'father_daughter', label: 'Father-Daughter Dance' },
  { value: 'mother_son', label: 'Mother-Son Dance' },
  { value: 'cake_cutting', label: 'Cake Cutting' },
  { value: 'party', label: 'Party Starters' },
  { value: 'slow', label: 'Slow Songs' },
  { value: 'entrance', label: 'Entrance' },
  { value: 'exit', label: 'Exit/Send-Off' },
  { value: 'dinner', label: 'Dinner Music' },
  { value: 'cocktail', label: 'Cocktail Hour' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'other', label: 'Other' },
] as const;

export const insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  createdAt: true,
  voteCount: true,
}).extend({
  status: z.enum(['pending', 'approved', 'declined']).optional(),
  requestedBy: z.string().optional(),
  category: z.string().optional(),
  streamingLink: z.string().url().optional().or(z.literal('')),
  isGuestRequest: z.boolean().optional(),
});

export type InsertPlaylistSong = z.infer<typeof insertPlaylistSongSchema>;
export type PlaylistSong = typeof playlistSongs.$inferSelect;

// ============================================================================
// SONG VOTES - Track who voted for which songs
// ============================================================================

export const songVotes = pgTable("song_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  voterId: varchar("voter_id").notNull(), // Guest ID or user ID
  voterName: text("voter_name"), // For display purposes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSongVoteSchema = createInsertSchema(songVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertSongVote = z.infer<typeof insertSongVoteSchema>;
export type SongVote = typeof songVotes.$inferSelect;

// ============================================================================
// DOCUMENTS - Contract and file storage
// ============================================================================

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"), // Optional: link to specific event
  name: text("name").notNull(),
  type: text("type").notNull(), // 'contract' | 'permit' | 'license' | 'invoice' | 'receipt' | 'other'
  category: text("category").notNull(), // 'vendor' | 'venue' | 'legal' | 'insurance' | 'other'
  fileUrl: text("file_url").notNull(), // Object storage path
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  uploadedBy: varchar("uploaded_by").notNull(), // userId
  sharedWithVendors: text("shared_with_vendors").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['contract', 'permit', 'license', 'invoice', 'receipt', 'other']),
  category: z.enum(['vendor', 'venue', 'legal', 'insurance', 'other']),
  name: z.string().min(1, "Document name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// ============================================================================
// NOTIFICATIONS - Email/SMS notification system
// ============================================================================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  recipientId: varchar("recipient_id").notNull(), // weddingId for couples, vendorId for vendors
  recipientType: text("recipient_type").notNull(), // 'couple' | 'vendor'
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  type: text("type").notNull(), // 'booking_confirmation' | 'payment_reminder' | 'event_alert' | 'contract_update'
  channel: text("channel").notNull(), // 'email' | 'sms' | 'both'
  status: text("status").notNull().default('scheduled'), // 'scheduled' | 'sent' | 'failed' | 'cancelled'
  scheduledFor: timestamp("scheduled_for").notNull(), // When to send
  sentAt: timestamp("sent_at"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Related IDs, event details, etc
  errorMessage: text("error_message"), // If status is 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
}).extend({
  recipientType: z.enum(['couple', 'vendor']),
  type: z.enum(['booking_confirmation', 'payment_reminder', 'event_alert', 'contract_update']),
  channel: z.enum(['email', 'sms', 'both']),
  status: z.enum(['scheduled', 'sent', 'failed', 'cancelled']).optional(),
  scheduledFor: z.string().transform(val => new Date(val)),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================================================
// NOTIFICATION PREFERENCES - User notification settings
// ============================================================================

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  bookingConfirmationsEnabled: boolean("booking_confirmations_enabled").default(true),
  paymentRemindersEnabled: boolean("payment_reminders_enabled").default(true),
  eventAlertsEnabled: boolean("event_alerts_enabled").default(true),
  contractUpdatesEnabled: boolean("contract_updates_enabled").default(true),
  preferredChannel: text("preferred_channel").default('email'), // 'email' | 'sms' | 'both'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  preferredChannel: z.enum(['email', 'sms', 'both']).optional(),
});

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Budget Analytics Response Type
export interface BudgetAnalyticsResponse {
  wedding: {
    city: string;
    tradition: string;
    totalBudget: string | null;
  };
  benchmarks: Array<{
    category: string;
    averageSpend: string;
    minSpend: string;
    maxSpend: string;
    percentageOfBudget: number | null;
    sampleSize: number | null;
    description: string | null;
  }>;
  currentBudget: Array<{
    category: string;
    allocated: string;
    spent: string;
    percentage: number | null;
  }>;
  vendorComparison: Array<{
    category: string;
    vendorCount: number;
    priceRangeDistribution: {
      '$': number;
      '$$': number;
      '$$$': number;
      '$$$$': number;
    };
    averageRating: string;
  }>;
  recommendations: string[];
}

// ============================================================================
// WEDDING WEBSITES - Public-facing guest website configuration
// ============================================================================

export const weddingWebsites = pgTable("wedding_websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull().unique(),
  slug: text("slug").notNull().unique(), // Unique URL slug (e.g., "sarah-and-raj-2024")
  isPublished: boolean("is_published").default(false),
  heroImageUrl: text("hero_image_url"),
  couplePhotoUrl: text("couple_photo_url"), // Main couple photo displayed prominently
  galleryPhotos: text("gallery_photos").array(), // Array of photo URLs for gallery section
  welcomeTitle: text("welcome_title"), // e.g., "Sarah & Raj"
  welcomeMessage: text("welcome_message"), // Couple's welcome message to guests
  coupleStory: text("couple_story"), // How we met story
  travelInfo: text("travel_info"), // Airport info, transportation tips
  accommodationInfo: text("accommodation_info"), // Hotel blocks, Airbnb recommendations
  thingsToDoInfo: text("things_to_do_info"), // Local attractions, activities
  faqInfo: text("faq_info"), // Common questions answered
  registryLinks: jsonb("registry_links"), // Array of {name, url} objects
  primaryColor: text("primary_color").default('#f97316'), // Theme color (default orange)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeddingWebsiteSchema = createInsertSchema(weddingWebsites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
});

export type InsertWeddingWebsite = z.infer<typeof insertWeddingWebsiteSchema>;
export type WeddingWebsite = typeof weddingWebsites.$inferSelect;

// ============================================================================
// WEDDING REGISTRIES - Gift registry links from major retailers
// ============================================================================

export const registryRetailers = pgTable("registry_retailers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Amazon", "Target", "Walmart", etc.
  slug: text("slug").notNull().unique(), // "amazon", "target", "walmart"
  logoUrl: text("logo_url"), // URL to retailer logo
  websiteUrl: text("website_url").notNull(), // Base website URL
  registryUrlPattern: text("registry_url_pattern"), // Pattern for registry URLs (for validation)
  helpText: text("help_text"), // Instructions for finding registry link
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const insertRegistryRetailerSchema = createInsertSchema(registryRetailers).omit({
  id: true,
});

export type InsertRegistryRetailer = z.infer<typeof insertRegistryRetailerSchema>;
export type RegistryRetailer = typeof registryRetailers.$inferSelect;

export const weddingRegistries = pgTable("wedding_registries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  retailerId: varchar("retailer_id"), // Links to registryRetailers, null for custom
  customRetailerName: text("custom_retailer_name"), // For custom/other retailers
  customLogoUrl: text("custom_logo_url"), // Custom logo for non-preset retailers
  registryUrl: text("registry_url").notNull(), // Full URL to the registry
  notes: text("notes"), // Optional notes (e.g., "Our main registry")
  sortOrder: integer("sort_order").default(0),
  isPrimary: boolean("is_primary").default(false), // Highlight as primary registry
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeddingRegistrySchema = createInsertSchema(weddingRegistries).omit({
  id: true,
  createdAt: true,
}).extend({
  registryUrl: z.string().url("Please enter a valid URL"),
});

export type InsertWeddingRegistry = z.infer<typeof insertWeddingRegistrySchema>;
export type WeddingRegistry = typeof weddingRegistries.$inferSelect;

// ============================================================================
// PHOTO GALLERIES - Inspiration boards, vendor portfolios, event photo sharing
// ============================================================================

export const photoGalleries = pgTable("photo_galleries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Gallery name/title
  type: text("type").notNull(), // 'inspiration' | 'vendor_portfolio' | 'event_photos'
  weddingId: varchar("wedding_id"), // For inspiration boards and event photos (nullable for vendor portfolios)
  vendorId: varchar("vendor_id"), // For vendor portfolios
  eventId: varchar("event_id"), // For event-specific photo sharing
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"), // Featured/cover image
  isPublic: boolean("is_public").default(false), // Whether gallery is publicly viewable
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPhotoGallerySchema = createInsertSchema(photoGalleries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['inspiration', 'vendor_portfolio', 'event_photos']),
});

export type InsertPhotoGallery = z.infer<typeof insertPhotoGallerySchema>;
export type PhotoGallery = typeof photoGalleries.$inferSelect;

// ============================================================================
// PHOTOS - Individual photos in galleries
// ============================================================================

export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  galleryId: varchar("gallery_id").notNull(),
  url: text("url").notNull(), // Cloud storage URL (Replit Object Storage)
  caption: text("caption"),
  order: integer("order").notNull().default(0), // For custom ordering in gallery
  uploadedBy: varchar("uploaded_by"), // User ID who uploaded (could be couple or vendor)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// ============================================================================
// VENDOR AVAILABILITY - Real-time calendar and booking management
// ============================================================================

export const vendorAvailability = pgTable("vendor_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot"), // e.g., "morning" (8am-12pm) | "afternoon" (12pm-5pm) | "evening" (5pm-11pm) | "full_day"
  status: text("status").notNull().default('available'), // 'available' | 'booked' | 'pending' | 'blocked'
  weddingId: varchar("wedding_id"), // If booked, which wedding
  eventId: varchar("event_id"), // If booked for specific event
  bookingId: varchar("booking_id"), // Reference to booking if status is 'booked' or 'pending'
  notes: text("notes"), // Internal notes for vendor
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorAvailabilitySchema = createInsertSchema(vendorAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date value",
  }),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'full_day']).optional(),
  status: z.enum(['available', 'booked', 'pending', 'blocked']),
});

export type InsertVendorAvailability = z.infer<typeof insertVendorAvailabilitySchema>;
export type VendorAvailability = typeof vendorAvailability.$inferSelect;

// ============================================================================
// VENDOR CALENDAR ACCOUNTS - Multiple Google/Outlook calendar connections
// ============================================================================

export const vendorCalendarAccounts = pgTable("vendor_calendar_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  provider: text("provider").notNull(), // 'google' | 'outlook'
  email: text("email").notNull(), // The email address for this calendar account
  label: text("label"), // Optional friendly name for the account
  status: text("status").notNull().default('pending'), // 'pending' | 'connected' | 'error' | 'disconnected'
  lastSyncedAt: timestamp("last_synced_at"),
  errorMessage: text("error_message"), // Last error if status is 'error'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorCalendarAccountSchema = createInsertSchema(vendorCalendarAccounts).omit({
  id: true,
  lastSyncedAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  provider: z.enum(['google', 'outlook']),
  status: z.enum(['pending', 'connected', 'error', 'disconnected']).optional(),
});

export type InsertVendorCalendarAccount = z.infer<typeof insertVendorCalendarAccountSchema>;
export type VendorCalendarAccount = typeof vendorCalendarAccounts.$inferSelect;

// ============================================================================
// VENDOR CALENDARS - Individual calendars within connected accounts
// ============================================================================

export const vendorCalendars = pgTable("vendor_calendars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(), // FK to vendor_calendar_accounts
  vendorId: varchar("vendor_id").notNull(), // Denormalized for easier queries
  providerCalendarId: text("provider_calendar_id").notNull(), // Google/Outlook calendar ID
  displayName: text("display_name").notNull(),
  color: text("color"), // Calendar color from provider
  isPrimary: boolean("is_primary").notNull().default(false), // Is this the primary calendar in that account
  isSelected: boolean("is_selected").notNull().default(true), // Should we sync this calendar's availability
  isWriteTarget: boolean("is_write_target").notNull().default(false), // Create bookings on this calendar
  syncDirection: text("sync_direction").notNull().default('read'), // 'read' | 'write' | 'two_way'
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorCalendarSchema = createInsertSchema(vendorCalendars).omit({
  id: true,
  lastSyncedAt: true,
  createdAt: true,
}).extend({
  syncDirection: z.enum(['read', 'write', 'two_way']).optional(),
});

export type InsertVendorCalendar = z.infer<typeof insertVendorCalendarSchema>;
export type VendorCalendar = typeof vendorCalendars.$inferSelect;

// ============================================================================
// CONTRACT SIGNATURES - E-signature tracking and vault
// ============================================================================

export const contractSignatures = pgTable("contract_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  signerId: varchar("signer_id").notNull(), // User ID (couple or vendor)
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email").notNull(),
  signerRole: text("signer_role").notNull(), // 'couple' | 'vendor'
  signatureData: text("signature_data").notNull(), // Base64 encoded signature image
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at").notNull().defaultNow(),
});

export const insertContractSignatureSchema = createInsertSchema(contractSignatures).omit({
  id: true,
  signedAt: true,
}).extend({
  signerRole: z.enum(['couple', 'vendor']),
  signatureData: z.string().min(1, "Signature is required"),
});

export type InsertContractSignature = z.infer<typeof insertContractSignatureSchema>;
export type ContractSignature = typeof contractSignatures.$inferSelect;

// ============================================================================
// CONTRACT DOCUMENTS - File attachments for contracts
// ============================================================================

export const contractDocuments = pgTable("contract_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // 'pdf' | 'image' | 'doc' | 'other'
  fileSize: integer("file_size"), // Size in bytes
  uploadedBy: varchar("uploaded_by").notNull(), // User ID
  uploaderRole: text("uploader_role").notNull(), // 'couple' | 'vendor'
  category: text("category"), // 'contract' | 'amendment' | 'receipt' | 'insurance' | 'license' | 'other'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).omit({
  id: true,
  createdAt: true,
}).extend({
  uploaderRole: z.enum(['couple', 'vendor']),
  fileType: z.enum(['pdf', 'image', 'doc', 'other']),
  category: z.enum(['contract', 'amendment', 'receipt', 'insurance', 'license', 'other']).optional(),
});

export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;

// ============================================================================
// CONTRACT PAYMENTS - Track actual payments against milestones
// ============================================================================

export const contractPayments = pgTable("contract_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestoneIndex: integer("milestone_index"), // Which milestone this payment is for (null for ad-hoc)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // 'card' | 'bank_transfer' | 'check' | 'cash' | 'venmo' | 'other'
  transactionId: text("transaction_id"), // External payment reference (Stripe, etc.)
  status: text("status").notNull().default('pending'), // 'pending' | 'completed' | 'failed' | 'refunded'
  notes: text("notes"),
  receiptUrl: text("receipt_url"), // Link to receipt document
  recordedBy: varchar("recorded_by").notNull(), // User ID who recorded this
  recorderRole: text("recorder_role").notNull(), // 'couple' | 'vendor'
  paidAt: timestamp("paid_at"), // When payment was actually made
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractPaymentSchema = createInsertSchema(contractPayments).omit({
  id: true,
  createdAt: true,
}).extend({
  recorderRole: z.enum(['couple', 'vendor']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  paymentMethod: z.enum(['card', 'bank_transfer', 'check', 'cash', 'venmo', 'other']).optional(),
  paidAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertContractPayment = z.infer<typeof insertContractPaymentSchema>;
export type ContractPayment = typeof contractPayments.$inferSelect;

// ============================================================================
// VENDOR ANALYTICS - Performance tracking and ROI metrics
// ============================================================================

export const vendorAnalytics = pgTable("vendor_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  // Lead tracking
  profileViews: integer("profile_views").notNull().default(0),
  contactClicks: integer("contact_clicks").notNull().default(0),
  emailSent: integer("email_sent").notNull().default(0),
  phoneCalls: integer("phone_calls").notNull().default(0),
  // Conversion tracking
  inquiriesReceived: integer("inquiries_received").notNull().default(0),
  proposalsSent: integer("proposals_sent").notNull().default(0),
  bookingsReceived: integer("bookings_received").notNull().default(0),
  bookingsConfirmed: integer("bookings_confirmed").notNull().default(0),
  // Financial tracking
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default('0'),
  averageBookingValue: decimal("average_booking_value", { precision: 10, scale: 2 }).default('0'),
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: text("period_type").notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'
  // Metadata
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertVendorAnalyticsSchema = createInsertSchema(vendorAnalytics).omit({
  id: true,
  lastUpdated: true,
}).extend({
  periodType: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'all_time']),
  periodStart: z.string().transform(val => new Date(val)),
  periodEnd: z.string().transform(val => new Date(val)),
  totalRevenue: z.string().optional(),
  averageBookingValue: z.string().optional(),
});

export type InsertVendorAnalytics = z.infer<typeof insertVendorAnalyticsSchema>;
export type VendorAnalytics = typeof vendorAnalytics.$inferSelect;

// ============================================================================
// VENDOR INTERACTION EVENTS - Track individual engagement events for analytics
// ============================================================================

export const vendorInteractionEvents = pgTable("vendor_interaction_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  weddingId: varchar("wedding_id"), // Optional - may be anonymous browsing
  userId: varchar("user_id"), // Optional - may be anonymous
  eventType: text("event_type").notNull(), // 'profile_view' | 'contact_click' | 'email_sent' | 'phone_call' | 'inquiry' | 'proposal_sent' | 'booking_request' | 'booking_confirmed'
  metadata: jsonb("metadata"), // Additional data like source, campaign, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorInteractionEventSchema = createInsertSchema(vendorInteractionEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  eventType: z.enum(['profile_view', 'contact_click', 'email_sent', 'phone_call', 'inquiry', 'proposal_sent', 'booking_request', 'booking_confirmed']),
});

export type InsertVendorInteractionEvent = z.infer<typeof insertVendorInteractionEventSchema>;
export type VendorInteractionEvent = typeof vendorInteractionEvents.$inferSelect;

// ============================================================================
// INVITATION CARDS - Pre-designed invitation card templates for purchase
// ============================================================================

export const invitationCards = pgTable("invitation_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Golden Lotus Mehndi Invitation"
  description: text("description").notNull(),
  tradition: text("tradition").notNull(), // 'sikh' | 'hindu' | 'muslim' | 'gujarati' | 'south_indian' | 'mixed' | 'general'
  ceremonyType: text("ceremony_type").notNull(), // e.g., 'mehndi', 'sangeet', 'pheras', etc.
  imageUrl: text("image_url").notNull(), // Path to the card design image
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price in USD
  featured: boolean("featured").notNull().default(false), // Show in featured section
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvitationCardSchema = createInsertSchema(invitationCards).omit({
  id: true,
  createdAt: true,
}).extend({
  tradition: z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general']),
  ceremonyType: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal"),
});

export type InsertInvitationCard = z.infer<typeof insertInvitationCardSchema>;
export type InvitationCard = typeof invitationCards.$inferSelect;

// ============================================================================
// ORDERS - Customer orders for invitation cards
// ============================================================================

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  userId: varchar("user_id").notNull(),
  // Stripe payment info
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"), // 'pending' | 'succeeded' | 'failed'
  // Order details
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'), // 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  // Shipping information
  shippingName: text("shipping_name").notNull(),
  shippingEmail: text("shipping_email").notNull(),
  shippingPhone: text("shipping_phone"),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingZip: text("shipping_zip").notNull(),
  shippingCountry: text("shipping_country").notNull().default('USA'),
  // Metadata
  orderNotes: text("order_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
}).extend({
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Total must be a valid decimal"),
  shippingEmail: z.string().email(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ============================================================================
// ORDER ITEMS - Individual items in an order
// ============================================================================

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  cardId: varchar("card_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  pricePerItem: decimal("price_per_item", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
}).extend({
  quantity: z.number().min(1).default(1),
  pricePerItem: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal"),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Subtotal must be a valid decimal"),
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// ============================================================================
// MEASUREMENT PROFILES - Guest clothing measurements for South Asian attire
// ============================================================================

export const measurementProfiles = pgTable("measurement_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  blouseSize: text("blouse_size"), // e.g., "S", "M", "L", "XL", "36", "38"
  waist: decimal("waist", { precision: 5, scale: 2 }), // in inches
  inseam: decimal("inseam", { precision: 5, scale: 2 }), // in inches
  sariBlouseStyle: text("sari_blouse_style"), // "backless" | "standard"
  notes: text("notes"), // Additional measurement notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMeasurementProfileSchema = createInsertSchema(measurementProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sariBlouseStyle: z.enum(['backless', 'standard']).optional(),
  waist: z.string().regex(/^\d+(\.\d{1,2})?$/, "Waist must be a valid decimal").optional(),
  inseam: z.string().regex(/^\d+(\.\d{1,2})?$/, "Inseam must be a valid decimal").optional(),
});

export type InsertMeasurementProfile = z.infer<typeof insertMeasurementProfileSchema>;
export type MeasurementProfile = typeof measurementProfiles.$inferSelect;

// ============================================================================
// SHOPPING ORDER ITEMS - Track clothing/outfit purchases and alterations
// ============================================================================

export const shoppingOrderItems = pgTable("shopping_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  itemName: text("item_name").notNull(), // e.g., "Dad's Sherwani", "Mom's Sari"
  storeName: text("store_name"), // Store where item was purchased
  status: text("status").notNull().default('ordered'), // "ordered" | "in_alterations" | "picked_up"
  costINR: decimal("cost_inr", { precision: 10, scale: 2 }), // Cost in Indian Rupees
  costUSD: decimal("cost_usd", { precision: 10, scale: 2 }), // Auto-calculated USD equivalent
  weightKg: decimal("weight_kg", { precision: 6, scale: 2 }), // Weight in kilograms
  notes: text("notes"), // Additional notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShoppingOrderItemSchema = createInsertSchema(shoppingOrderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  costUSD: true, // Auto-calculated from INR
}).extend({
  status: z.enum(['ordered', 'in_alterations', 'picked_up']).optional(),
  costINR: z.string().regex(/^\d+(\.\d{1,2})?$/, "Cost must be a valid decimal").optional(),
  weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/, "Weight must be a valid decimal").optional(),
});

export type InsertShoppingOrderItem = z.infer<typeof insertShoppingOrderItemSchema>;
export type ShoppingOrderItem = typeof shoppingOrderItems.$inferSelect;

// ============================================================================
// GAP WINDOWS - Breaks between events for guest concierge
// ============================================================================

export const gapWindows = pgTable("gap_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  beforeEventId: varchar("before_event_id").notNull(), // Event that ends before the gap
  afterEventId: varchar("after_event_id").notNull(), // Event that starts after the gap
  label: text("label").notNull(), // e.g., "Break between Ceremony & Reception"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  shuttleSchedule: jsonb("shuttle_schedule"), // Array of shuttle times and destinations
  specialInstructions: text("special_instructions"), // e.g., "Guests can explore downtown"
  isActive: boolean("is_active").notNull().default(false), // Is this gap currently happening?
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGapWindowSchema = createInsertSchema(gapWindows).omit({
  id: true,
  isActive: true,
  createdAt: true,
}).extend({
  startTime: z.string().transform(val => new Date(val)),
  endTime: z.string().transform(val => new Date(val)),
  shuttleSchedule: z.array(z.object({
    time: z.string(),
    destination: z.string(),
    pickupLocation: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

export type InsertGapWindow = z.infer<typeof insertGapWindowSchema>;
export type GapWindow = typeof gapWindows.$inferSelect;

// ============================================================================
// GAP RECOMMENDATIONS - Places to visit during gaps
// ============================================================================

export const gapRecommendations = pgTable("gap_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gapWindowId: varchar("gap_window_id").notNull(),
  name: text("name").notNull(), // e.g., "Blue Bottle Coffee"
  type: text("type").notNull(), // 'coffee_shop' | 'restaurant' | 'bar' | 'attraction' | 'shopping'
  description: text("description"),
  address: text("address"),
  mapUrl: text("map_url"), // Google Maps URL
  googlePlaceId: text("google_place_id"), // For fetching live data
  estimatedTravelTime: integer("estimated_travel_time"), // Minutes from venue
  priceLevel: text("price_level"), // '$' | '$$' | '$$$'
  photoUrl: text("photo_url"),
  order: integer("order").notNull().default(0), // Display order
});

export const insertGapRecommendationSchema = createInsertSchema(gapRecommendations).omit({
  id: true,
}).extend({
  type: z.enum(['coffee_shop', 'restaurant', 'bar', 'attraction', 'shopping', 'lounge', 'other']),
  priceLevel: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
});

export type InsertGapRecommendation = z.infer<typeof insertGapRecommendationSchema>;
export type GapRecommendation = typeof gapRecommendations.$inferSelect;

// ============================================================================
// RITUAL STAGES - Ceremony milestones for live tracking
// ============================================================================

export const ritualStages = pgTable("ritual_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  stageKey: text("stage_key").notNull(), // Standardized key for the stage
  displayName: text("display_name").notNull(), // User-facing name
  description: text("description"), // What happens during this stage
  plannedStartTime: timestamp("planned_start_time"),
  plannedDuration: integer("planned_duration"), // Minutes
  displayOrder: integer("display_order").notNull(),
  guestInstructions: text("guest_instructions"), // e.g., "Please be seated at the Mandap"
  notifyOnStart: boolean("notify_on_start").notNull().default(true), // Send notification when starts
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Common ritual stage keys for different traditions
export const RITUAL_STAGE_KEYS = {
  // General
  'guests_arriving': 'Guests Arriving',
  'ceremony_starting_soon': 'Ceremony Starting Soon',
  'ceremony_in_progress': 'Ceremony In Progress',
  'ceremony_complete': 'Ceremony Complete',
  'lunch_served': 'Lunch is Served',
  'dinner_served': 'Dinner is Served',
  'cocktail_hour': 'Cocktail Hour',
  'reception_starting': 'Reception Starting',
  'first_dance': 'First Dance',
  'speeches': 'Speeches & Toasts',
  'cake_cutting': 'Cake Cutting',
  'party_time': 'Party Time!',
  
  // Hindu/Sikh specific
  'baraat_forming': 'Baraat is Forming',
  'baraat_started': 'Baraat Has Started!',
  'baraat_arriving': 'Baraat Arriving at Venue',
  'milni': 'Milni Ceremony',
  'groom_entering': 'Groom Entering',
  'bride_entering': 'Bride Entering',
  'jai_mala': 'Jai Mala (Garland Exchange)',
  'kanyadaan': 'Kanyadaan',
  'mangal_pheras': 'Mangal Pheras (Sacred Rounds)',
  'sindoor_mangalsutra': 'Sindoor & Mangalsutra',
  'saptapadi': 'Saptapadi (Seven Steps)',
  'vidaai': 'Vidaai (Farewell)',
  
  // Sikh specific
  'anand_karaj_starting': 'Anand Karaj Starting',
  'laavan': 'Laavan (Sacred Rounds)',
  'ardas': 'Ardas (Prayer)',
  'hukamnama': 'Hukamnama',
  
  // Mehndi/Sangeet
  'mehndi_artists_ready': 'Mehndi Artists Ready',
  'performances_starting': 'Performances Starting',
  'dance_floor_open': 'Dance Floor is Open!',
} as const;

export const insertRitualStageSchema = createInsertSchema(ritualStages).omit({
  id: true,
  createdAt: true,
}).extend({
  plannedStartTime: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertRitualStage = z.infer<typeof insertRitualStageSchema>;
export type RitualStage = typeof ritualStages.$inferSelect;

// ============================================================================
// RITUAL STAGE UPDATES - Live status updates for ceremonies
// ============================================================================

export const ritualStageUpdates = pgTable("ritual_stage_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ritualStageId: varchar("ritual_stage_id").notNull(),
  status: text("status").notNull(), // 'upcoming' | 'active' | 'completed' | 'delayed' | 'skipped'
  message: text("message"), // Optional custom message, e.g., "Running 15 minutes late"
  delayMinutes: integer("delay_minutes"), // How many minutes delayed
  updatedBy: varchar("updated_by"), // User ID who made the update
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRitualStageUpdateSchema = createInsertSchema(ritualStageUpdates).omit({
  id: true,
  updatedAt: true,
}).extend({
  status: z.enum(['upcoming', 'active', 'completed', 'delayed', 'skipped']),
});

export type InsertRitualStageUpdate = z.infer<typeof insertRitualStageUpdateSchema>;
export type RitualStageUpdate = typeof ritualStageUpdates.$inferSelect;

// ============================================================================
// GUEST NOTIFICATIONS - Track notifications sent to guests
// ============================================================================

export const guestNotifications = pgTable("guest_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  householdId: varchar("household_id"), // Optional - if targeting specific household
  type: text("type").notNull(), // 'gap_started' | 'ritual_update' | 'shuttle_reminder' | 'custom'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedGapId: varchar("related_gap_id"), // If related to a gap window
  relatedStageId: varchar("related_stage_id"), // If related to a ritual stage
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  channel: text("channel").notNull(), // 'in_app' | 'email' | 'sms'
});

export const insertGuestNotificationSchema = createInsertSchema(guestNotifications).omit({
  id: true,
  sentAt: true,
}).extend({
  type: z.enum(['gap_started', 'gap_ending', 'ritual_update', 'shuttle_reminder', 'custom']),
  channel: z.enum(['in_app', 'email', 'sms']),
});

export type InsertGuestNotification = z.infer<typeof insertGuestNotificationSchema>;
export type GuestNotification = typeof guestNotifications.$inferSelect;

// ============================================================================
// LIVE WEDDING STATUS - Current state of the wedding day
// ============================================================================

export const liveWeddingStatus = pgTable("live_wedding_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull().unique(),
  isLive: boolean("is_live").notNull().default(false), // Is the wedding day active?
  currentEventId: varchar("current_event_id"), // Currently active event
  currentStageId: varchar("current_stage_id"), // Currently active ritual stage
  currentGapId: varchar("current_gap_id"), // Currently active gap window
  lastBroadcastMessage: text("last_broadcast_message"), // Most recent announcement
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
});

export const insertLiveWeddingStatusSchema = createInsertSchema(liveWeddingStatus).omit({
  id: true,
  lastUpdatedAt: true,
});

export type InsertLiveWeddingStatus = z.infer<typeof insertLiveWeddingStatusSchema>;
export type LiveWeddingStatus = typeof liveWeddingStatus.$inferSelect;

// ============================================================================
// ROLES & PERMISSIONS - Wedding-scoped access control
// ============================================================================

// Define all available permissions in the system
export const PERMISSION_CATEGORIES = {
  // Guest Management
  guests: {
    label: "Guest Management",
    description: "Manage guest lists, households, and RSVPs",
    permissions: ["view", "edit", "manage"] as const,
  },
  invitations: {
    label: "Invitations",
    description: "Send and manage invitations",
    permissions: ["view", "edit", "manage"] as const,
  },
  // Planning
  timeline: {
    label: "Timeline & Events",
    description: "Manage events, schedule, and ceremony timeline",
    permissions: ["view", "edit", "manage"] as const,
  },
  tasks: {
    label: "Tasks",
    description: "View and manage wedding tasks",
    permissions: ["view", "edit", "manage"] as const,
  },
  // Vendors & Budget
  vendors: {
    label: "Vendors",
    description: "Manage vendor relationships and bookings",
    permissions: ["view", "edit", "manage"] as const,
  },
  budget: {
    label: "Budget & Payments",
    description: "View and manage wedding budget",
    permissions: ["view", "edit", "manage"] as const,
  },
  contracts: {
    label: "Contracts",
    description: "View and sign vendor contracts",
    permissions: ["view", "edit", "manage"] as const,
  },
  // Content
  website: {
    label: "Wedding Website",
    description: "Manage the public wedding website",
    permissions: ["view", "edit", "manage"] as const,
  },
  documents: {
    label: "Documents",
    description: "Access and manage documents",
    permissions: ["view", "edit", "manage"] as const,
  },
  playlists: {
    label: "Music & Playlists",
    description: "Manage music playlists",
    permissions: ["view", "edit", "manage"] as const,
  },
  messages: {
    label: "Messages",
    description: "Communicate with vendors and team",
    permissions: ["view", "manage"] as const,
  },
  // Shopping
  shopping: {
    label: "Shopping & Measurements",
    description: "Track shopping and measurements",
    permissions: ["view", "edit", "manage"] as const,
  },
  // AI Features
  ai_planner: {
    label: "AI Wedding Planner",
    description: "Access AI-powered wedding planning assistant",
    permissions: ["view"] as const,
  },
  // Admin
  settings: {
    label: "Wedding Settings",
    description: "Modify wedding settings",
    permissions: ["view", "edit", "manage"] as const,
  },
  collaborators: {
    label: "Team Members",
    description: "Invite and manage collaborators",
    permissions: ["view", "manage"] as const,
  },
} as const;

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES;
export type PermissionLevel = "view" | "edit" | "manage";

// Wedding Roles - system and custom roles
export const weddingRoles = pgTable("wedding_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // 'owner', 'wedding_planner', 'family_member', 'custom'
  displayName: text("display_name").notNull(), // User-friendly name
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false), // System roles can't be deleted
  isOwner: boolean("is_owner").notNull().default(false), // Owner has full access
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeddingRoleSchema = createInsertSchema(weddingRoles).omit({
  id: true,
  createdAt: true,
});

export type InsertWeddingRole = z.infer<typeof insertWeddingRoleSchema>;
export type WeddingRole = typeof weddingRoles.$inferSelect;

// Role Permissions - What each role can do
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull(),
  category: text("category").notNull(), // Permission category key
  level: text("level").notNull(), // 'view' | 'edit' | 'manage'
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
}).extend({
  category: z.string().min(1),
  level: z.enum(["view", "edit", "manage"]),
});

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Wedding Collaborators - Users who can access a wedding
export const weddingCollaborators = pgTable("wedding_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  userId: varchar("user_id"), // Null until they accept and create account
  email: text("email").notNull(), // Email to send invitation to
  roleId: varchar("role_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined' | 'revoked'
  inviteToken: text("invite_token"), // Hashed token for magic link
  inviteTokenExpires: timestamp("invite_token_expires"),
  invitedBy: varchar("invited_by").notNull(), // User who sent the invite
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  displayName: text("display_name"), // Optional name for the collaborator
  notes: text("notes"), // Private notes about this collaborator
});

export const insertWeddingCollaboratorSchema = createInsertSchema(weddingCollaborators).omit({
  id: true,
  inviteToken: true,
  inviteTokenExpires: true,
  invitedAt: true,
  acceptedAt: true,
}).extend({
  email: z.string().email(),
  status: z.enum(["pending", "accepted", "declined", "revoked"]).optional(),
});

export type InsertWeddingCollaborator = z.infer<typeof insertWeddingCollaboratorSchema>;
export type WeddingCollaborator = typeof weddingCollaborators.$inferSelect;

// Collaborator Activity Log - Track actions for transparency
export const collaboratorActivityLog = pgTable("collaborator_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  collaboratorId: varchar("collaborator_id"), // Who did the action
  userId: varchar("user_id"), // The user account if known
  action: text("action").notNull(), // 'invited' | 'accepted' | 'declined' | 'revoked' | 'role_changed' | etc.
  targetType: text("target_type"), // What was affected: 'guest', 'vendor', 'event', etc.
  targetId: varchar("target_id"), // ID of the affected entity
  details: jsonb("details"), // Additional action details
  performedAt: timestamp("performed_at").notNull().defaultNow(),
});

export const insertCollaboratorActivityLogSchema = createInsertSchema(collaboratorActivityLog).omit({
  id: true,
  performedAt: true,
});

export type InsertCollaboratorActivityLog = z.infer<typeof insertCollaboratorActivityLogSchema>;
export type CollaboratorActivityLog = typeof collaboratorActivityLog.$inferSelect;

// Type for role with permissions
export type RoleWithPermissions = WeddingRole & {
  permissions: RolePermission[];
};

// Type for collaborator with role and user info
export type CollaboratorWithDetails = WeddingCollaborator & {
  role: WeddingRole;
  permissions: RolePermission[];
};

// ============================================================================
// RITUAL ROLES - Ceremony-specific micro-roles for guests
// ============================================================================

// Ritual Role Assignments - Assign specific ceremonial duties to guests
export const ritualRoleAssignments = pgTable("ritual_role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(), // Which ceremony this role is for
  guestId: varchar("guest_id").notNull(), // The guest assigned to this role
  roleName: text("role_name").notNull(), // 'palla_holder', 'milni_coordinator', 'shoe_guardian', etc.
  roleDisplayName: text("role_display_name").notNull(), // User-friendly name
  description: text("description"), // What this role entails
  instructions: text("instructions"), // Detailed instructions for the guest
  timing: text("timing"), // When they need to perform this duty
  location: text("location"), // Where they need to be
  attireNotes: text("attire_notes"), // Special attire requirements
  priority: text("priority").notNull().default("medium"), // 'high' | 'medium' | 'low'
  status: text("status").notNull().default("assigned"), // 'assigned' | 'acknowledged' | 'completed'
  acknowledgedAt: timestamp("acknowledged_at"), // When the guest acknowledged the role
  notificationSent: boolean("notification_sent").default(false), // Has mission card been sent
  notificationSentAt: timestamp("notification_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRitualRoleAssignmentSchema = createInsertSchema(ritualRoleAssignments).omit({
  id: true,
  acknowledgedAt: true,
  notificationSent: true,
  notificationSentAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["assigned", "acknowledged", "completed"]).optional(),
});

export type InsertRitualRoleAssignment = z.infer<typeof insertRitualRoleAssignmentSchema>;
export type RitualRoleAssignment = typeof ritualRoleAssignments.$inferSelect;

// ============================================================================
// RITUAL ROLE TEMPLATES - Database-driven ceremony role templates
// ============================================================================

export const ritualRoleTemplates = pgTable("ritual_role_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ceremonySlug: text("ceremony_slug").notNull(), // e.g., 'anand_karaj', 'mehndi', 'reception'
  roleName: text("role_name").notNull(), // Unique identifier: 'ardas_leader', 'palla_holder'
  roleDisplayName: text("role_display_name").notNull(), // User-friendly: "Ardas Leader", "Palla Holder"
  description: text("description").notNull(), // What this role entails
  instructions: text("instructions").notNull(), // Detailed instructions for the guest
  timing: text("timing").notNull(), // When they need to perform this duty
  priority: text("priority").notNull().default("medium"), // 'high' | 'medium' | 'low'
  displayOrder: integer("display_order").notNull().default(0), // For sorting within ceremony
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  ceremonySlugIdx: index("ritual_role_templates_ceremony_slug_idx").on(table.ceremonySlug),
  roleNameIdx: index("ritual_role_templates_role_name_idx").on(table.roleName),
  uniqueCeremonyRole: uniqueIndex("ritual_role_templates_ceremony_role_idx").on(table.ceremonySlug, table.roleName),
}));

export const insertRitualRoleTemplateSchema = createInsertSchema(ritualRoleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: z.enum(["high", "medium", "low"]).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type InsertRitualRoleTemplate = z.infer<typeof insertRitualRoleTemplateSchema>;
export type RitualRoleTemplate = typeof ritualRoleTemplates.$inferSelect;

// DEPRECATED: Legacy constant - kept temporarily for seeding database
// Use ritualRoleTemplates table via API instead
export const RITUAL_ROLE_TEMPLATES: Record<string, Array<{
  roleName: string;
  roleDisplayName: string;
  description: string;
  instructions: string;
  timing: string;
  priority: "high" | "medium" | "low";
}>> = {
  // Sikh ceremonies
  anand_karaj: [
    { roleName: "ardas_leader", roleDisplayName: "Ardas Leader", description: "Lead the opening and closing Ardas prayers", instructions: "Stand at the front near the Guru Granth Sahib. Lead the congregation in reciting the Ardas prayer. Speak clearly and with reverence.", timing: "At the beginning and end of the ceremony", priority: "high" },
    { roleName: "palla_holder", roleDisplayName: "Palla Holder", description: "Hold the groom's palla (scarf) during the ceremony", instructions: "Stand behind the bride. Hold one end of the palla that connects the bride to the groom during the Lavaan (4 circles around the Guru Granth Sahib).", timing: "During the Lavaan ceremony", priority: "high" },
    { roleName: "rumala_sahib", roleDisplayName: "Rumala Sahib Attendant", description: "Manage the ceremonial cloth covering", instructions: "Gently wave the chaur (ceremonial whisk) over the Guru Granth Sahib. Handle the rumala (cloth covering) with respect.", timing: "Throughout the ceremony", priority: "medium" },
    { roleName: "langar_coordinator", roleDisplayName: "Langar Coordinator", description: "Oversee the community meal service", instructions: "Coordinate with the Gurdwara kitchen. Ensure guests are seated properly and served promptly. Manage the flow of diners.", timing: "After the ceremony", priority: "medium" },
    { roleName: "milni_organizer", roleDisplayName: "Milni Organizer", description: "Organize the Milni garland exchange", instructions: "Line up family members from both sides in order (fathers first, then uncles, etc.). Call out names and guide each pair to exchange garlands.", timing: "Before the main ceremony", priority: "high" },
    { roleName: "shoe_guardian", roleDisplayName: "Joota Chupai Captain", description: "Lead the shoe-hiding game team", instructions: "Coordinate with bride's siblings/cousins to 'steal' the groom's shoes. Negotiate the ransom with groom's side. Keep it fun!", timing: "During the ceremony when groom removes shoes", priority: "low" },
  ],
  paath: [
    { roleName: "paathi", roleDisplayName: "Paathi (Reader)", description: "Read from the Guru Granth Sahib", instructions: "Read the assigned portion of the Sukhmani Sahib or other prayer. Maintain a steady, clear pace.", timing: "As scheduled during the Paath", priority: "high" },
    { roleName: "degh_server", roleDisplayName: "Degh Server", description: "Serve the blessed prasad", instructions: "Distribute the karah prasad (blessed sweet) to all attendees at the end of the Paath.", timing: "After the Bhog (completion)", priority: "medium" },
  ],
  maiyan: [
    { roleName: "maiyan_leader", roleDisplayName: "Maiyan Ceremony Leader", description: "Lead the turmeric application ceremony", instructions: "Begin by applying the maiyan (turmeric mixture) to the bride/groom's face, hands, and feet. Sing traditional songs!", timing: "Start of the Maiyan ceremony", priority: "high" },
    { roleName: "vatna_preparer", roleDisplayName: "Vatna Mixture Preparer", description: "Prepare the turmeric paste", instructions: "Mix turmeric, mustard oil, and other traditional ingredients. Have the mixture ready before the ceremony begins.", timing: "Before the ceremony", priority: "medium" },
    { roleName: "dhol_player_coordinator", roleDisplayName: "Dhol Coordinator", description: "Coordinate with the dhol players", instructions: "Ensure dhol players know the timing. Signal them to start/stop at key moments.", timing: "Throughout the ceremony", priority: "medium" },
  ],
  jaggo: [
    { roleName: "jaggo_pot_carrier", roleDisplayName: "Jaggo Pot Carrier", description: "Carry the decorated brass pot (gaggar) on your head", instructions: "Balance the decorated pot with lit candles on your head. Lead the dancing procession through the neighborhood.", timing: "During the Jaggo procession", priority: "high" },
    { roleName: "jaggo_song_leader", roleDisplayName: "Jaggo Song Leader", description: "Lead the traditional Jaggo songs", instructions: "Know the traditional Jaggo songs. Lead the group in singing as they dance through the streets.", timing: "Throughout the Jaggo", priority: "high" },
  ],
  chooda: [
    { roleName: "mama_chooda", roleDisplayName: "Maternal Uncle (Chooda Giver)", description: "Present the red and white bangles to the bride", instructions: "Wash the bride's hands ceremonially. Place the chooda (bangles) on her wrists. This is a very emotional moment.", timing: "Morning of the wedding", priority: "high" },
    { roleName: "kalire_tier", roleDisplayName: "Kalire Tier", description: "Tie the kalire (golden ornaments) to the chooda", instructions: "After the chooda is placed, tie the decorative kalire to the bride's bangles.", timing: "After chooda ceremony", priority: "medium" },
  ],
  chunni_chadana: [
    { roleName: "chunni_presenter", roleDisplayName: "Chunni Presenter", description: "Present the chunni (scarf) to the bride", instructions: "Carry the ceremonial chunni on a decorated tray. Present it to the bride's family.", timing: "During the ceremony", priority: "high" },
    { roleName: "gift_coordinator", roleDisplayName: "Gift Coordinator", description: "Manage the exchange of gifts", instructions: "Organize the gifts from both families. Ensure proper presentation and documentation.", timing: "Throughout the ceremony", priority: "medium" },
  ],
  // Hindu ceremonies
  haldi: [
    { roleName: "haldi_applicator_lead", roleDisplayName: "Lead Haldi Applicator", description: "Start the haldi application ceremony", instructions: "Be the first to apply haldi paste to the bride/groom. Apply to face, arms, and feet. Encourage others to join!", timing: "Start of Haldi ceremony", priority: "high" },
    { roleName: "haldi_mixer", roleDisplayName: "Haldi Paste Preparer", description: "Prepare the turmeric paste", instructions: "Mix fresh turmeric with sandalwood, rose water, and milk. Have bowls ready for family members.", timing: "Before the ceremony", priority: "medium" },
  ],
  mehndi: [
    { roleName: "mehndi_coordinator", roleDisplayName: "Mehndi Night Coordinator", description: "Oversee the mehndi celebration", instructions: "Coordinate with mehndi artists. Manage the queue of guests wanting henna. Keep the energy high!", timing: "Throughout the evening", priority: "medium" },
    { roleName: "dance_mc", roleDisplayName: "Dance Performance MC", description: "MC for dance performances", instructions: "Announce each dance performance. Keep the crowd engaged between sets.", timing: "During entertainment portion", priority: "medium" },
  ],
  sangeet: [
    { roleName: "sangeet_emcee", roleDisplayName: "Sangeet Emcee", description: "Host and MC the Sangeet night", instructions: "Welcome guests. Introduce each dance performance. Keep energy high. Manage transitions between acts.", timing: "Throughout the event", priority: "high" },
    { roleName: "performance_coordinator", roleDisplayName: "Performance Coordinator", description: "Manage backstage and performer lineup", instructions: "Ensure performers are ready. Cue each group. Manage costume changes and props.", timing: "Throughout performances", priority: "high" },
    { roleName: "av_coordinator", roleDisplayName: "AV Coordinator", description: "Manage music and video", instructions: "Work with DJ/sound system. Queue up performance tracks. Handle any AV issues.", timing: "Throughout the event", priority: "medium" },
  ],
  baraat: [
    { roleName: "baraat_leader", roleDisplayName: "Baraat Leader", description: "Lead the groom's procession", instructions: "Dance at the front of the baraat. Keep energy high. Lead the group toward the venue.", timing: "During baraat procession", priority: "high" },
    { roleName: "horse_handler", roleDisplayName: "Horse/Mare Handler", description: "Guide the groom's horse or vehicle", instructions: "Walk alongside the horse. Ensure groom's safety. Keep the procession moving at the right pace.", timing: "During baraat", priority: "high" },
    { roleName: "baraat_photographer", roleDisplayName: "Baraat Photography Coordinator", description: "Coordinate candid baraat photos", instructions: "Work with photographer to capture key moments. Gather family for group shots.", timing: "During baraat", priority: "medium" },
  ],
  milni: [
    { roleName: "milni_announcer", roleDisplayName: "Milni Announcer", description: "Announce each family pair for the Milni", instructions: "Call out the names and relationship of each pair (e.g., 'Fathers of the bride and groom'). Guide them to exchange garlands.", timing: "During Milni ceremony", priority: "high" },
    { roleName: "milni_envelope_manager", roleDisplayName: "Milni Envelope Manager", description: "Manage the gift envelopes", instructions: "Hand out prepared shagun envelopes to each person before their turn. Collect any reciprocal gifts.", timing: "During Milni", priority: "high" },
  ],
  pheras: [
    { roleName: "agni_keeper", roleDisplayName: "Sacred Fire Keeper", description: "Maintain the sacred fire (Agni)", instructions: "Keep the fire burning at the right intensity. Add ghee or samagri as directed by the priest.", timing: "During the pheras", priority: "high" },
    { roleName: "phera_guide", roleDisplayName: "Phera Guide", description: "Guide the couple during the seven rounds", instructions: "Walk alongside the couple. Ensure they complete each round properly. Hold the bride's veil if needed.", timing: "During the 7 pheras", priority: "medium" },
  ],
  vidaai: [
    { roleName: "vidaai_organizer", roleDisplayName: "Vidaai Organizer", description: "Organize the farewell ceremony", instructions: "Gather family for the emotional farewell. Ensure rice and flower petals are ready. Guide the bride to the car.", timing: "End of wedding day", priority: "high" },
    { roleName: "getaway_driver", roleDisplayName: "Getaway Driver", description: "Drive the newlyweds away", instructions: "Have the decorated car ready. Drive safely! Take the scenic route if requested.", timing: "After vidaai", priority: "medium" },
  ],
  // Muslim ceremonies
  nikah: [
    { roleName: "wali", roleDisplayName: "Wali (Guardian)", description: "Represent the bride in the marriage contract", instructions: "Sit with the bride during the Nikah. Sign the Nikahnama on her behalf if required.", timing: "During Nikah ceremony", priority: "high" },
    { roleName: "witness_bride", roleDisplayName: "Bride's Witness", description: "Witness the marriage contract for the bride", instructions: "Be present during the signing. Verify the bride's consent. Sign the Nikahnama as witness.", timing: "During contract signing", priority: "high" },
    { roleName: "witness_groom", roleDisplayName: "Groom's Witness", description: "Witness the marriage contract for the groom", instructions: "Be present during the signing. Verify the terms. Sign the Nikahnama as witness.", timing: "During contract signing", priority: "high" },
    { roleName: "mahr_coordinator", roleDisplayName: "Mahr Coordinator", description: "Manage the mahr (bridal gift) presentation", instructions: "Prepare and present the mahr to the bride. Ensure it is documented properly.", timing: "During Nikah", priority: "medium" },
  ],
  walima: [
    { roleName: "walima_host", roleDisplayName: "Walima Host", description: "Welcome guests to the reception feast", instructions: "Greet guests at the entrance. Direct them to seating. Ensure they feel welcomed.", timing: "As guests arrive", priority: "high" },
    { roleName: "walima_coordinator", roleDisplayName: "Walima Coordinator", description: "Coordinate the reception feast", instructions: "Work with caterers. Manage food service timing. Handle any issues.", timing: "Throughout the event", priority: "medium" },
  ],
  // General events
  reception: [
    { roleName: "reception_emcee", roleDisplayName: "Reception Emcee", description: "MC for the reception", instructions: "Welcome guests. Announce the couple's entrance. Introduce speeches and toasts. Keep the program on track.", timing: "Throughout reception", priority: "high" },
    { roleName: "toast_coordinator", roleDisplayName: "Toast Coordinator", description: "Coordinate speeches and toasts", instructions: "Line up speakers. Give them time warnings. Manage microphone handoffs.", timing: "During toasts", priority: "medium" },
    { roleName: "guest_book_attendant", roleDisplayName: "Guest Book Attendant", description: "Manage the guest book station", instructions: "Encourage guests to sign. Provide pens. Help elderly guests if needed.", timing: "During cocktail hour and reception", priority: "low" },
    { roleName: "gift_table_manager", roleDisplayName: "Gift Table Manager", description: "Oversee the gift table", instructions: "Keep gifts organized. Note who gave what. Ensure card stays with gift. Secure valuable items.", timing: "Throughout reception", priority: "medium" },
    { roleName: "first_dance_cuer", roleDisplayName: "First Dance Cuer", description: "Cue the couple for their first dance", instructions: "Work with DJ. Clear the dance floor. Signal the couple when music starts.", timing: "For first dance", priority: "medium" },
  ],
  cocktail: [
    { roleName: "cocktail_greeter", roleDisplayName: "Cocktail Hour Greeter", description: "Welcome guests to cocktail hour", instructions: "Direct guests to bar and appetizers. Help them find seating. Make introductions.", timing: "During cocktail hour", priority: "medium" },
  ],
  custom: [
    { roleName: "custom_coordinator", roleDisplayName: "Event Coordinator", description: "Help coordinate this event", instructions: "Assist with event logistics as needed.", timing: "As needed", priority: "medium" },
  ],
};

// Type for ritual role with guest details
export type RitualRoleWithGuest = RitualRoleAssignment & {
  guest: Guest;
  event: Event;
};

// ============================================================================
// VENDOR ACCESS PASS & COLLABORATION HUB - Share filtered timelines with vendors
// ============================================================================

// Vendor Access Passes - Grant vendors access to filtered timeline views
export const vendorAccessPasses = pgTable("vendor_access_passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(), // The vendor receiving access
  bookingId: varchar("booking_id"), // Optional - link to specific booking
  token: varchar("token").notNull().unique(), // Unique access token for URL
  name: text("name").notNull(), // Display name (e.g., "Sarah's MUA Access")
  // Access filters - which events/timeline segments they can see
  eventIds: text("event_ids").array(), // Specific events they can view (null = all booked events)
  vendorCategories: text("vendor_categories").array(), // Filter by vendor category relevance
  timelineViewType: text("timeline_view_type").notNull().default("filtered"), // 'filtered' | 'full'
  // Access permissions
  canViewGuestCount: boolean("can_view_guest_count").default(false),
  canViewVendorDetails: boolean("can_view_vendor_details").default(false),
  canViewBudget: boolean("can_view_budget").default(false),
  // Status and metadata
  status: text("status").notNull().default("active"), // 'active' | 'revoked' | 'expired'
  lastAccessedAt: timestamp("last_accessed_at"),
  accessCount: integer("access_count").default(0),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  notes: text("notes"), // Private notes from couple
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorAccessPassSchema = createInsertSchema(vendorAccessPasses).omit({
  id: true,
  token: true,
  lastAccessedAt: true,
  accessCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  timelineViewType: z.enum(["filtered", "full"]).optional(),
  status: z.enum(["active", "revoked", "expired"]).optional(),
  eventIds: z.array(z.string()).optional().nullable(),
  vendorCategories: z.array(z.string()).optional().nullable(),
  canViewGuestCount: z.boolean().optional(),
  canViewVendorDetails: z.boolean().optional(),
  canViewBudget: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InsertVendorAccessPass = z.infer<typeof insertVendorAccessPassSchema>;
export type VendorAccessPass = typeof vendorAccessPasses.$inferSelect;

// Extended type with vendor and event details
export type VendorAccessPassWithDetails = VendorAccessPass & {
  vendor: Vendor;
  booking?: Booking;
  events?: Event[];
};

// ============================================================================
// GUEST MANAGEMENT SYSTEM - Advanced guest list management
// ============================================================================

// Guest Sources - Track who submitted each guest (e.g., "Bride's Mom", "Groom's Grandfather")
export const guestSources = pgTable("guest_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // "mom", "dad", "grandma", etc.
  label: text("label").notNull(), // "Bride's Mom", "Groom's Grandfather"
  side: text("side").notNull().default("bride"), // "bride" | "groom" | "mutual"
  quotaLimit: integer("quota_limit"), // Optional max guests this source can suggest
  color: text("color"), // Color for UI display
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuestSourceSchema = createInsertSchema(guestSources).omit({
  id: true,
  createdAt: true,
}).extend({
  side: z.enum(["bride", "groom", "mutual"]),
});

export type InsertGuestSource = z.infer<typeof insertGuestSourceSchema>;
export type GuestSource = typeof guestSources.$inferSelect;

// Guest List Scenarios - What-if playground for comparing guest lists
export const guestListScenarios = pgTable("guest_list_scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // "Dream List", "Budget A", "Tight Budget"
  description: text("description"),
  budgetLimit: decimal("budget_limit", { precision: 10, scale: 2 }), // Total budget for this scenario
  costPerHead: decimal("cost_per_head", { precision: 8, scale: 2 }), // Cost per guest
  isActive: boolean("is_active").notNull().default(false), // Is this the active/final list?
  totalSeats: integer("total_seats"), // Calculated total seats in this scenario
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }), // Calculated total cost
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGuestListScenarioSchema = createInsertSchema(guestListScenarios).omit({
  id: true,
  totalSeats: true,
  totalCost: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  budgetLimit: z.string().nullable().optional(),
  costPerHead: z.string().nullable().optional(),
});

export type InsertGuestListScenario = z.infer<typeof insertGuestListScenarioSchema>;
export type GuestListScenario = typeof guestListScenarios.$inferSelect;

// Scenario Households - Which households are included in each scenario
export const scenarioHouseholds = pgTable("scenario_households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: varchar("scenario_id").notNull(),
  householdId: varchar("household_id").notNull(),
  isIncluded: boolean("is_included").notNull().default(true),
  adjustedMaxCount: integer("adjusted_max_count"), // Override seat count for this scenario
  notes: text("notes"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const insertScenarioHouseholdSchema = createInsertSchema(scenarioHouseholds).omit({
  id: true,
  addedAt: true,
});

export type InsertScenarioHousehold = z.infer<typeof insertScenarioHouseholdSchema>;
export type ScenarioHousehold = typeof scenarioHouseholds.$inferSelect;

// Guest Budget Settings - Per-wedding budget configuration
export const guestBudgetSettings = pgTable("guest_budget_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull().unique(),
  defaultCostPerHead: decimal("default_cost_per_head", { precision: 8, scale: 2 }),
  maxGuestBudget: decimal("max_guest_budget", { precision: 10, scale: 2 }),
  targetGuestCount: integer("target_guest_count"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGuestBudgetSettingsSchema = createInsertSchema(guestBudgetSettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  defaultCostPerHead: z.string().nullable().optional(),
  maxGuestBudget: z.string().nullable().optional(),
});

export type InsertGuestBudgetSettings = z.infer<typeof insertGuestBudgetSettingsSchema>;
export type GuestBudgetSettings = typeof guestBudgetSettings.$inferSelect;

// Extended types for guest management
export type ScenarioWithStats = GuestListScenario & {
  householdCount: number;
  guestCount: number;
  remainingBudget?: number;
};

export type HouseholdWithPriority = Household & {
  priorityTier?: string;
  sourceId?: string;
  source?: GuestSource;
};

// ============================================================================
// REAL-TIME MASTER TIMELINE - Day-of coordination
// ============================================================================

// Vendor Event Tags - Which vendors are tagged for notifications on which events
export const vendorEventTags = pgTable("vendor_event_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  weddingId: varchar("wedding_id").notNull(),
  notifyVia: text("notify_via").notNull().default('email'), // 'email' | 'sms' | 'both'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorEventTagSchema = createInsertSchema(vendorEventTags).omit({
  id: true,
  createdAt: true,
}).extend({
  notifyVia: z.enum(['email', 'sms', 'both']).default('email'),
});

export type InsertVendorEventTag = z.infer<typeof insertVendorEventTagSchema>;
export type VendorEventTag = typeof vendorEventTags.$inferSelect;

// Timeline Changes - Audit log of all timeline modifications
export const timelineChanges = pgTable("timeline_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(),
  changeType: text("change_type").notNull(), // 'time' | 'date' | 'location' | 'order' | 'name'
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedByUserId: varchar("changed_by_user_id").notNull(),
  note: text("note"), // Optional note about the change
  notificationsSent: boolean("notifications_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTimelineChangeSchema = createInsertSchema(timelineChanges).omit({
  id: true,
  notificationsSent: true,
  createdAt: true,
}).extend({
  changeType: z.enum(['time', 'date', 'location', 'order', 'name']),
});

export type InsertTimelineChange = z.infer<typeof insertTimelineChangeSchema>;
export type TimelineChange = typeof timelineChanges.$inferSelect;

// Vendor Acknowledgments - Track vendor responses to timeline changes
export const vendorAcknowledgments = pgTable("vendor_acknowledgments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  changeId: varchar("change_id").notNull(), // FK to timeline_changes
  status: text("status").notNull().default('pending'), // 'pending' | 'acknowledged' | 'declined'
  message: text("message"), // Optional response message from vendor
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVendorAcknowledgmentSchema = createInsertSchema(vendorAcknowledgments).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
}).extend({
  status: z.enum(['pending', 'acknowledged', 'declined']).default('pending'),
});

export type InsertVendorAcknowledgment = z.infer<typeof insertVendorAcknowledgmentSchema>;
export type VendorAcknowledgment = typeof vendorAcknowledgments.$inferSelect;

// Extended types for timeline management
export type VendorEventTagWithVendor = VendorEventTag & {
  vendor: Vendor;
};

export type TimelineChangeWithAcks = TimelineChange & {
  acknowledgments: VendorAcknowledgment[];
  event?: Event;
};

export type VendorAcknowledgmentWithDetails = VendorAcknowledgment & {
  vendor: Vendor;
  change: TimelineChange;
};

// ============ Vendor Teammate Management ============

export const VENDOR_TEAMMATE_PERMISSIONS = [
  'bookings',      // View and manage bookings
  'contracts',     // View and manage contracts
  'packages',      // View and manage service packages
  'calendar',      // View and manage availability calendar
  'analytics',     // View analytics and reports
  'messages',      // View and send messages
  'profile',       // Edit vendor profile information
  'team_manage',   // Invite/remove teammates and manage permissions
] as const;

export type VendorTeammatePermission = typeof VENDOR_TEAMMATE_PERMISSIONS[number];

// Vendor Teammates - Active team members with access to vendor account
export const vendorTeammates = pgTable("vendor_teammates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  userId: varchar("user_id").notNull(), // Linked user account
  email: text("email").notNull(),
  displayName: text("display_name"),
  permissions: text("permissions").array().notNull(), // Array of permission keys
  status: text("status").notNull().default("active"), // 'active' | 'revoked'
  invitedBy: varchar("invited_by").notNull(), // User who sent the invite
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by"),
});

export const insertVendorTeammateSchema = createInsertSchema(vendorTeammates).omit({
  id: true,
  createdAt: true,
  revokedAt: true,
  revokedBy: true,
}).extend({
  email: z.string().email(),
  permissions: z.array(z.enum(VENDOR_TEAMMATE_PERMISSIONS)),
  status: z.enum(["active", "revoked"]).optional(),
});

export type InsertVendorTeammate = z.infer<typeof insertVendorTeammateSchema>;
export type VendorTeammate = typeof vendorTeammates.$inferSelect;

// Vendor Teammate Invitations - Pending invitations
export const vendorTeammateInvitations = pgTable("vendor_teammate_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  email: text("email").notNull(),
  permissions: text("permissions").array().notNull(), // Permissions to grant on acceptance
  inviteToken: text("invite_token").notNull(), // Token for accepting invitation
  inviteTokenExpires: timestamp("invite_token_expires").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'expired' | 'revoked'
  invitedBy: varchar("invited_by").notNull(), // User who sent the invite
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  displayName: text("display_name"), // Optional name for the invitee
});

export const insertVendorTeammateInvitationSchema = createInsertSchema(vendorTeammateInvitations).omit({
  id: true,
  inviteToken: true,
  inviteTokenExpires: true,
  invitedAt: true,
  acceptedAt: true,
}).extend({
  email: z.string().email(),
  permissions: z.array(z.enum(VENDOR_TEAMMATE_PERMISSIONS)),
  status: z.enum(["pending", "accepted", "expired", "revoked"]).optional(),
});

export type InsertVendorTeammateInvitation = z.infer<typeof insertVendorTeammateInvitationSchema>;
export type VendorTeammateInvitation = typeof vendorTeammateInvitations.$inferSelect;

// Extended type for teammate with user info
export type VendorTeammateWithUser = VendorTeammate & {
  user?: { email: string };
};

// ============================================================================
// QUOTE REQUESTS - Vendor quote requests from couples
// ============================================================================

export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  eventId: varchar("event_id").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name").notNull(),
  eventName: text("event_name").notNull(),
  eventDate: text("event_date"),
  eventLocation: text("event_location"),
  guestCount: integer("guest_count"),
  budgetRange: text("budget_range"),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["sent", "viewed", "responded", "declined"]).optional(),
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

// ============================================================================
// VENDOR LEADS - Lead qualification and nurturing system
// ============================================================================

export const vendorLeads = pgTable("vendor_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  weddingId: varchar("wedding_id").notNull(),
  coupleName: text("couple_name").notNull(),
  coupleEmail: text("couple_email"),
  
  // Source tracking
  sourceType: text("source_type").notNull(), // 'booking_request' | 'quote_request' | 'message' | 'manual'
  sourceId: varchar("source_id"), // ID of the booking/quote/message that created this lead
  
  // Lead details
  eventDate: timestamp("event_date"),
  eventType: text("event_type"), // Which event type they're interested in
  estimatedBudget: text("estimated_budget"),
  guestCount: integer("guest_count"),
  eventLocation: text("event_location"),
  tradition: text("tradition"), // Wedding tradition for cultural matching
  city: text("city"),
  notes: text("notes"),
  
  // Lead scoring (0-100)
  qualificationScore: integer("qualification_score").default(0),
  urgencyScore: integer("urgency_score").default(0), // Based on wedding date proximity
  budgetFitScore: integer("budget_fit_score").default(0), // Based on budget alignment
  engagementScore: integer("engagement_score").default(0), // Based on response/activity
  overallScore: integer("overall_score").default(0), // Weighted combination
  
  // Lead status pipeline
  status: text("status").notNull().default('new'), // 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'won' | 'lost' | 'nurturing'
  priority: text("priority").default('medium'), // 'hot' | 'warm' | 'cold' | 'medium'
  
  // Nurturing
  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  followUpCount: integer("follow_up_count").default(0),
  autoNurtureEnabled: boolean("auto_nurture_enabled").default(true),
  nurtureSequenceId: varchar("nurture_sequence_id"),
  currentNurtureStep: integer("current_nurture_step").default(0),
  
  // Tracking
  firstContactAt: timestamp("first_contact_at").notNull().defaultNow(),
  statusChangedAt: timestamp("status_changed_at"),
  wonAt: timestamp("won_at"),
  lostAt: timestamp("lost_at"),
  lostReason: text("lost_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  vendorIdIdx: index("vendor_leads_vendor_id_idx").on(table.vendorId),
  weddingIdIdx: index("vendor_leads_wedding_id_idx").on(table.weddingId),
}));

export const insertVendorLeadSchema = createInsertSchema(vendorLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'nurturing']).optional(),
  priority: z.enum(['hot', 'warm', 'cold', 'medium']).optional(),
  sourceType: z.enum(['booking_request', 'quote_request', 'message', 'manual']),
});

export type InsertVendorLead = z.infer<typeof insertVendorLeadSchema>;
export type VendorLead = typeof vendorLeads.$inferSelect;

// Nurturing email sequences
export const leadNurtureSequences = pgTable("lead_nurture_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default sequence for new leads
  triggerType: text("trigger_type").notNull(), // 'new_lead' | 'no_response' | 'post_quote' | 'manual'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeadNurtureSequenceSchema = createInsertSchema(leadNurtureSequences).omit({
  id: true,
  createdAt: true,
}).extend({
  triggerType: z.enum(['new_lead', 'no_response', 'post_quote', 'manual']),
});

export type InsertLeadNurtureSequence = z.infer<typeof insertLeadNurtureSequenceSchema>;
export type LeadNurtureSequence = typeof leadNurtureSequences.$inferSelect;

// Individual steps in a nurturing sequence
export const leadNurtureSteps = pgTable("lead_nurture_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  delayDays: integer("delay_days").notNull().default(0), // Days to wait before sending
  actionType: text("action_type").notNull(), // 'email' | 'reminder' | 'status_change' | 'tag'
  emailSubject: text("email_subject"),
  emailTemplate: text("email_template"), // Template with variables like {{coupleName}}, {{eventDate}}
  reminderText: text("reminder_text"),
  newStatus: text("new_status"), // For status_change actions
  isActive: boolean("is_active").default(true),
});

export const insertLeadNurtureStepSchema = createInsertSchema(leadNurtureSteps).omit({
  id: true,
}).extend({
  actionType: z.enum(['email', 'reminder', 'status_change', 'tag']),
});

export type InsertLeadNurtureStep = z.infer<typeof insertLeadNurtureStepSchema>;
export type LeadNurtureStep = typeof leadNurtureSteps.$inferSelect;

// Scheduled nurture actions
export const leadNurtureActions = pgTable("lead_nurture_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  stepId: varchar("step_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  executedAt: timestamp("executed_at"),
  status: text("status").notNull().default('pending'), // 'pending' | 'executed' | 'skipped' | 'failed'
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeadNurtureActionSchema = createInsertSchema(leadNurtureActions).omit({
  id: true,
  createdAt: true,
  executedAt: true,
}).extend({
  status: z.enum(['pending', 'executed', 'skipped', 'failed']).optional(),
});

export type InsertLeadNurtureAction = z.infer<typeof insertLeadNurtureActionSchema>;
export type LeadNurtureAction = typeof leadNurtureActions.$inferSelect;

// Lead activity log for tracking all interactions
export const leadActivityLog = pgTable("lead_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  activityType: text("activity_type").notNull(), // 'email_sent' | 'email_opened' | 'replied' | 'call' | 'meeting' | 'status_change' | 'note_added' | 'proposal_viewed'
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional data like email subject, call duration, etc.
  performedBy: varchar("performed_by"), // User ID if manual action
  performedAt: timestamp("performed_at").notNull().defaultNow(),
});

export const insertLeadActivityLogSchema = createInsertSchema(leadActivityLog).omit({
  id: true,
  performedAt: true,
}).extend({
  activityType: z.enum(['email_sent', 'email_opened', 'replied', 'call', 'meeting', 'status_change', 'note_added', 'proposal_viewed']),
});

export type InsertLeadActivityLog = z.infer<typeof insertLeadActivityLogSchema>;
export type LeadActivityLog = typeof leadActivityLog.$inferSelect;

// ============================================================================
// HOUSEHOLD MERGE AUDITS - Track duplicate household merges
// ============================================================================

export const householdMergeAudits = pgTable("household_merge_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  survivorHouseholdId: varchar("survivor_household_id").notNull(),
  mergedHouseholdId: varchar("merged_household_id").notNull(),
  decision: text("decision").notNull(), // 'kept_older' | 'kept_newer'
  survivorSnapshot: jsonb("survivor_snapshot").notNull(), // Snapshot of survivor before merge
  mergedSnapshot: jsonb("merged_snapshot").notNull(), // Snapshot of merged household before deletion
  guestsMoved: integer("guests_moved").notNull().default(0),
  invitationsMoved: integer("invitations_moved").notNull().default(0),
  reviewedById: varchar("reviewed_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHouseholdMergeAuditSchema = createInsertSchema(householdMergeAudits).omit({
  id: true,
  createdAt: true,
}).extend({
  decision: z.enum(['kept_older', 'kept_newer']),
});

export type InsertHouseholdMergeAudit = z.infer<typeof insertHouseholdMergeAuditSchema>;
export type HouseholdMergeAudit = typeof householdMergeAudits.$inferSelect;

// ============================================================================
// IGNORED DUPLICATE PAIRS - Track household pairs marked as "not duplicates"
// ============================================================================

export const ignoredDuplicatePairs = pgTable("ignored_duplicate_pairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  householdId1: varchar("household_id_1").notNull(),
  householdId2: varchar("household_id_2").notNull(),
  ignoredById: varchar("ignored_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIgnoredDuplicatePairSchema = createInsertSchema(ignoredDuplicatePairs).omit({
  id: true,
  createdAt: true,
});

export type InsertIgnoredDuplicatePair = z.infer<typeof insertIgnoredDuplicatePairSchema>;
export type IgnoredDuplicatePair = typeof ignoredDuplicatePairs.$inferSelect;

// ============================================================================
// GUEST ENGAGEMENT GAMES - Scavenger hunts and trivia for wedding events
// ============================================================================

export const GAME_TYPES = ['scavenger_hunt', 'trivia'] as const;
export type GameType = typeof GAME_TYPES[number];

export const GAME_STATUSES = ['draft', 'active', 'paused', 'completed'] as const;
export type GameStatus = typeof GAME_STATUSES[number];

// Main games table
export const engagementGames = pgTable("engagement_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"), // Optional - can be tied to specific event
  name: text("name").notNull(),
  description: text("description"),
  gameType: text("game_type").notNull(), // 'scavenger_hunt' | 'trivia'
  status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'paused' | 'completed'
  pointsPerChallenge: integer("points_per_challenge").default(10), // Default points per item
  startTime: timestamp("start_time"), // When the game becomes available
  endTime: timestamp("end_time"), // When the game closes
  showLeaderboard: boolean("show_leaderboard").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEngagementGameSchema = createInsertSchema(engagementGames).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  gameType: z.enum(GAME_TYPES),
  status: z.enum(GAME_STATUSES).optional(),
});

export type InsertEngagementGame = z.infer<typeof insertEngagementGameSchema>;
export type EngagementGame = typeof engagementGames.$inferSelect;

// Scavenger hunt challenges
export const scavengerChallenges = pgTable("scavenger_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  prompt: text("prompt").notNull(), // e.g., "Take a photo with the bride"
  description: text("description"), // Additional instructions
  points: integer("points").notNull().default(10),
  requiresPhoto: boolean("requires_photo").default(true),
  verificationMode: text("verification_mode").notNull().default("auto"), // 'auto' | 'manual' (manual = couple reviews)
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScavengerChallengeSchema = createInsertSchema(scavengerChallenges).omit({
  id: true,
  createdAt: true,
}).extend({
  verificationMode: z.enum(['auto', 'manual']).optional(),
});

export type InsertScavengerChallenge = z.infer<typeof insertScavengerChallengeSchema>;
export type ScavengerChallenge = typeof scavengerChallenges.$inferSelect;

// Trivia questions
export const triviaQuestions = pgTable("trivia_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of answer options: ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based)
  points: integer("points").notNull().default(10),
  explanation: text("explanation"), // Optional explanation shown after answering
  sortOrder: integer("sort_order").default(0),
  timeLimitSeconds: integer("time_limit_seconds"), // Optional time limit per question
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTriviaQuestionSchema = createInsertSchema(triviaQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertTriviaQuestion = z.infer<typeof insertTriviaQuestionSchema>;
export type TriviaQuestion = typeof triviaQuestions.$inferSelect;

// Guest participation tracking
export const gameParticipation = pgTable("game_participation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  householdId: varchar("household_id"), // For grouping by household in leaderboard
  totalPoints: integer("total_points").notNull().default(0),
  challengesCompleted: integer("challenges_completed").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
});

export const insertGameParticipationSchema = createInsertSchema(gameParticipation).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export type InsertGameParticipation = z.infer<typeof insertGameParticipationSchema>;
export type GameParticipation = typeof gameParticipation.$inferSelect;

// Scavenger hunt submissions (photo/activity proof)
export const scavengerSubmissions = pgTable("scavenger_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  participationId: varchar("participation_id").notNull(),
  photoUrl: text("photo_url"), // Object storage URL
  textResponse: text("text_response"), // For non-photo challenges
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  pointsAwarded: integer("points_awarded").default(0),
  reviewedById: varchar("reviewed_by_id"), // User who reviewed (for manual verification)
  reviewNote: text("review_note"), // Optional feedback
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertScavengerSubmissionSchema = createInsertSchema(scavengerSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
}).extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type InsertScavengerSubmission = z.infer<typeof insertScavengerSubmissionSchema>;
export type ScavengerSubmission = typeof scavengerSubmissions.$inferSelect;

// Trivia answers
export const triviaAnswers = pgTable("trivia_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  participationId: varchar("participation_id").notNull(),
  selectedOption: integer("selected_option").notNull(), // Index of selected answer
  isCorrect: boolean("is_correct").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  responseTimeMs: integer("response_time_ms"), // How fast they answered
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

export const insertTriviaAnswerSchema = createInsertSchema(triviaAnswers).omit({
  id: true,
  answeredAt: true,
});

export type InsertTriviaAnswer = z.infer<typeof insertTriviaAnswerSchema>;
export type TriviaAnswer = typeof triviaAnswers.$inferSelect;

// Extended types for leaderboard
export type LeaderboardEntry = {
  guestId: string;
  guestName: string;
  householdName?: string;
  totalPoints: number;
  challengesCompleted: number;
  rank: number;
};

export type GameWithStats = EngagementGame & {
  challengeCount: number;
  participantCount: number;
  event?: Event;
};

// ============================================================================
// BUDGET ALERTS - Threshold-based alerts for budget monitoring
// ============================================================================

export const budgetAlerts = pgTable("budget_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // e.g., "Catering Over Budget"
  alertType: text("alert_type").notNull(), // 'bucket_threshold' | 'total_threshold' | 'payment_due' | 'overspend'
  bucket: text("bucket"), // Optional - for bucket-specific alerts (from BUDGET_BUCKETS)
  thresholdPercent: integer("threshold_percent"), // e.g., 80 = alert at 80% of budget
  thresholdAmount: decimal("threshold_amount", { precision: 10, scale: 2 }), // Fixed amount threshold
  isEnabled: boolean("is_enabled").notNull().default(true),
  isTriggered: boolean("is_triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at"),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBudgetAlertSchema = createInsertSchema(budgetAlerts).omit({
  id: true,
  isTriggered: true,
  triggeredAt: true,
  lastCheckedAt: true,
  createdAt: true,
}).extend({
  alertType: z.enum(['bucket_threshold', 'total_threshold', 'payment_due', 'overspend']),
  bucket: budgetBucketSchema.optional(),
  thresholdPercent: z.number().min(1).max(200).optional(),
  thresholdAmount: z.string().optional(),
});

export type InsertBudgetAlert = z.infer<typeof insertBudgetAlertSchema>;
export type BudgetAlert = typeof budgetAlerts.$inferSelect;

// ============================================================================
// DASHBOARD WIDGETS - User preferences for financial dashboard layout
// ============================================================================

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  widgetType: text("widget_type").notNull(), // 'budget_overview' | 'spending_by_category' | 'recent_expenses' | 'upcoming_payments' | 'alerts' | 'spending_trend'
  position: integer("position").notNull().default(0), // Order in the dashboard
  isVisible: boolean("is_visible").notNull().default(true),
  config: jsonb("config"), // Widget-specific configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  widgetType: z.enum(['budget_overview', 'spending_by_category', 'recent_expenses', 'upcoming_payments', 'alerts', 'spending_trend']),
  position: z.number().optional(),
  config: z.record(z.any()).optional(),
});

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

// ============================================================================
// CEREMONY TYPES - Database-driven ceremony cost estimates (linked to traditions)
// ============================================================================

export const ceremonyTypes = pgTable("ceremony_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ceremonyId: text("ceremony_id").notNull().unique(), // e.g., 'sikh_maiyan', 'sikh_anand_karaj' - slug identifier
  name: text("name").notNull(), // Display name e.g., "Maiyan"
  description: text("description"), // Description of the ceremony
  // PRIMARY: UUID FK to wedding_traditions.id (required)
  traditionId: varchar("tradition_id").notNull().references(() => weddingTraditions.id),
  // DEPRECATED: Legacy slug - kept for backward compatibility, auto-resolved from traditionId
  tradition: text("tradition").notNull(), // Text field: 'sikh', 'hindu', etc.
  costPerGuestLow: decimal("cost_per_guest_low", { precision: 10, scale: 2 }).notNull(),
  costPerGuestHigh: decimal("cost_per_guest_high", { precision: 10, scale: 2 }).notNull(),
  defaultGuests: integer("default_guests").notNull().default(100),
  costBreakdown: jsonb("cost_breakdown"), // DEPRECATED: Use ceremony_budget_categories table instead. Kept for backward compatibility.
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  traditionIdx: index("ceremony_types_tradition_idx").on(table.tradition),
  traditionIdIdx: index("ceremony_types_tradition_id_idx").on(table.traditionId),
}));

export const insertCeremonyTypeSchema = createInsertSchema(ceremonyTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tradition: z.string(), // Text field for tradition
  costPerGuestLow: z.string(),
  costPerGuestHigh: z.string(),
  // DEPRECATED: Use ceremony_budget_categories table instead
  costBreakdown: z.array(z.object({
    category: z.string(),
    lowCost: z.number(),
    highCost: z.number(),
    unit: z.enum(['fixed', 'per_hour', 'per_person']),
    hoursLow: z.number().optional(),
    hoursHigh: z.number().optional(),
    notes: z.string().optional(),
    budgetBucket: z.enum(BUDGET_BUCKETS).optional(),
  })).optional().nullable(),
});

export type InsertCeremonyType = z.infer<typeof insertCeremonyTypeSchema>;
export type CeremonyType = typeof ceremonyTypes.$inferSelect;

// Cost breakdown item type for the JSON field in ceremony types
export type CeremonyBudgetCategoryItem = {
  id?: string; // Item ID - present when fetched from API, used for deleting custom items
  category: string;
  lowCost: number;
  highCost: number;
  unit: 'fixed' | 'per_hour' | 'per_person';
  hoursLow?: number;
  hoursHigh?: number;
  notes?: string;
  budgetBucket?: BudgetBucket;
  budgetBucketId?: string;
  isCustom?: boolean;
};

// ============================================================================
// CEREMONY BUDGET CATEGORIES - Junction table connecting ceremony types to budget buckets
// Links ceremony-specific line items to their ceremony type and financial bucket
// ============================================================================

export const ceremonyBudgetCategories = pgTable("ceremony_budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Nullable: NULL = system-defined global template, value = custom item for specific wedding
  weddingId: varchar("wedding_id"), // References weddings.id (nullable for system templates)
  // Reference to source library item when cloning from master library (nullable)
  sourceCategoryId: varchar("source_category_id"), // References ceremony_budget_categories.id (library item)
  // PRIMARY: UUID FK to ceremony_types.id
  ceremonyTypeId: varchar("ceremony_type_id").notNull().references(() => ceremonyTypes.id),
  // Foreign key to budget_bucket_categories.id (slug-style ID like 'venue', 'attire')
  budgetBucketId: text("budget_bucket_id").notNull(),
  itemName: text("item_name").notNull(), // e.g., "Gurdwara Donation", "Turban Tying"
  lowCost: decimal("low_cost", { precision: 12, scale: 2 }).notNull(),
  highCost: decimal("high_cost", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // 'fixed', 'per_person', 'per_hour'
  hoursLow: decimal("hours_low", { precision: 6, scale: 2 }), // For per_hour items
  hoursHigh: decimal("hours_high", { precision: 6, scale: 2 }), // For per_hour items
  notes: text("notes"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdx: index("ceremony_budget_categories_wedding_idx").on(table.weddingId),
  ceremonyTypeIdx: index("ceremony_budget_categories_type_idx").on(table.ceremonyTypeId),
  budgetBucketIdx: index("ceremony_budget_categories_bucket_idx").on(table.budgetBucketId),
  sourceCategoryIdx: index("ceremony_budget_categories_source_idx").on(table.sourceCategoryId),
}));

export const insertCeremonyBudgetCategorySchema = createInsertSchema(ceremonyBudgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  weddingId: z.string().nullable().optional(), // NULL = system template, value = custom for wedding
  sourceCategoryId: z.string().nullable().optional(), // Reference to source library item when cloning
  // UUID FK to ceremony_types.id
  ceremonyTypeId: z.string(),
  budgetBucketId: z.string(), // UUID FK to budget_bucket_categories.id
  unit: z.enum(['fixed', 'per_hour', 'per_person']),
  lowCost: z.string(),
  highCost: z.string(),
  hoursLow: z.string().nullable().optional(),
  hoursHigh: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type InsertCeremonyBudgetCategory = z.infer<typeof insertCeremonyBudgetCategorySchema>;
export type CeremonyBudgetCategory = typeof ceremonyBudgetCategories.$inferSelect;

// ============================================================================
// WEDDING LINE ITEMS - Couple's customized budget line items
// ============================================================================

export const weddingLineItems = pgTable("wedding_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  ceremonyId: varchar("ceremony_id"), // References specific event in 'events' table (null = general item)
  label: text("label").notNull(), // User can rename this
  bucket: text("bucket").notNull(), // Maps to BUDGET_BUCKETS - user can change category
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  isSystemGenerated: boolean("is_system_generated").notNull().default(false), // Track if it came from template
  sourceTemplateItemId: varchar("source_template_item_id"), // Reference to original template item if hydrated
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdx: index("wedding_line_items_wedding_idx").on(table.weddingId),
  ceremonyIdx: index("wedding_line_items_ceremony_idx").on(table.ceremonyId),
}));

export const insertWeddingLineItemSchema = createInsertSchema(weddingLineItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  bucket: z.enum(BUDGET_BUCKETS),
  targetAmount: z.string(),
});

export type InsertWeddingLineItem = z.infer<typeof insertWeddingLineItemSchema>;
export type WeddingLineItem = typeof weddingLineItems.$inferSelect;

// ============================================================================
// REGIONAL PRICING - City-specific cost multipliers
// ============================================================================

export const regionalPricing = pgTable("regional_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull().unique(), // 'Bay Area', 'NYC', 'LA', 'Chicago', 'Seattle'
  displayName: text("display_name").notNull(), // Full display name
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull(), // e.g., 1.50 for 50% more expensive
  venueMultiplier: decimal("venue_multiplier", { precision: 4, scale: 2 }), // Optional venue-specific multiplier
  cateringMultiplier: decimal("catering_multiplier", { precision: 4, scale: 2 }), // Optional catering-specific multiplier
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRegionalPricingSchema = createInsertSchema(regionalPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  multiplier: z.string(),
  venueMultiplier: z.string().optional(),
  cateringMultiplier: z.string().optional(),
});

export type InsertRegionalPricing = z.infer<typeof insertRegionalPricingSchema>;
export type RegionalPricing = typeof regionalPricing.$inferSelect;

// ============================================================================
// CEREMONY EXPLAINERS - AI-generated "Wait, what's happening?" cultural guides
// ============================================================================

export const ceremonyExplainers = pgTable("ceremony_explainers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id").notNull(), // Link to specific event
  ceremonyType: text("ceremony_type").notNull(), // e.g., 'anand_karaj', 'pheras', 'nikah'
  tradition: text("tradition").notNull(), // Primary tradition for this ceremony
  // Content fields
  title: text("title").notNull(), // e.g., "What is the Anand Karaj?"
  shortExplainer: text("short_explainer").notNull(), // 1-2 sentence summary
  fullExplainer: text("full_explainer").notNull(), // Detailed explanation (2-3 paragraphs)
  keyMoments: jsonb("key_moments").$type<{ moment: string; explanation: string }[]>(), // Key moments to watch for
  culturalSignificance: text("cultural_significance"), // Why this matters
  guestTips: text("guest_tips").array(), // Tips for guests (what to do/not do)
  attireGuidance: text("attire_guidance"), // Dress code explanation
  // For fusion weddings - explain for those new to the tradition
  targetAudience: text("target_audience").notNull().default("all"), // 'all' | 'new_to_tradition' | 'family_friends'
  // Metadata
  isAutoGenerated: boolean("is_auto_generated").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(false), // Couple must approve before showing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  weddingIdx: index("ceremony_explainers_wedding_idx").on(table.weddingId),
  eventIdx: index("ceremony_explainers_event_idx").on(table.eventId),
}));

export const insertCeremonyExplainerSchema = createInsertSchema(ceremonyExplainers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  keyMoments: z.array(z.object({
    moment: z.string(),
    explanation: z.string(),
  })).optional().nullable(),
  guestTips: z.array(z.string()).optional().nullable(),
  targetAudience: z.enum(["all", "new_to_tradition", "family_friends"]).optional(),
  isAutoGenerated: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type InsertCeremonyExplainer = z.infer<typeof insertCeremonyExplainerSchema>;
export type CeremonyExplainer = typeof ceremonyExplainers.$inferSelect;
