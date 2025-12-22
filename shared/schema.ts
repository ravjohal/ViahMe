import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'couple' | 'vendor'
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  lastLoginAt: timestamp("last_login_at"),
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
  role: z.enum(['couple', 'vendor']),
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
  tradition: text("tradition").notNull(), // 'sikh' | 'hindu' | 'general'
  role: text("role").notNull(), // 'bride' | 'groom' | 'planner'
  partner1Name: text("partner1_name"),
  partner2Name: text("partner2_name"),
  coupleEmail: text("couple_email"),
  couplePhone: text("couple_phone"),
  weddingDate: timestamp("wedding_date"),
  location: text("location").notNull(), // 'Bay Area' etc
  guestCountEstimate: integer("guest_count_estimate"),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }),
  budgetConfirmed: boolean("budget_confirmed").default(false),
  eventsConfirmed: boolean("events_confirmed").default(false),
  status: text("status").notNull().default('planning'), // 'planning' | 'active' | 'completed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeddingSchema = createInsertSchema(weddings).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  tradition: z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general']),
  role: z.enum(['bride', 'groom', 'planner']),
  location: z.string().min(1),
  weddingDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  guestCountEstimate: z.number().min(1).optional(),
  totalBudget: z.string().nullable().optional(),
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
  type: text("type").notNull(), // 'paath' | 'mehndi' | 'maiyan' | 'sangeet' | 'anand_karaj' | 'reception' | 'custom'
  date: timestamp("date"),
  time: text("time"),
  location: text("location"),
  guestCount: integer("guest_count"),
  description: text("description"),
  order: integer("order").notNull(), // For sorting timeline
  // Budget & capacity planning fields
  costPerHead: decimal("cost_per_head", { precision: 8, scale: 2 }), // Cost per guest for this event
  venueCapacity: integer("venue_capacity"), // Maximum venue capacity for this event
  // Public-facing guest website fields
  dressCode: text("dress_code"), // e.g., "Formal Indian attire", "Business casual"
  locationDetails: text("location_details"), // Detailed venue information
  directions: text("directions"), // Driving/transit directions
  mapUrl: text("map_url"), // Google Maps link
  parkingInfo: text("parking_info"), // Parking instructions
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
}).extend({
  type: z.enum([
    // Sikh events
    'paath', 'mehndi', 'maiyan', 'sangeet', 'anand_karaj', 'reception',
    // Hindu events
    'haldi', 'mehendi', 'sangeet_hindu', 'pheras', 'vidaai', 'tilak', 'chunni_ceremony',
    // Muslim events
    'mangni', 'mehndi_muslim', 'nikah', 'walima', 'rukhsati',
    // Gujarati events
    'mandvo_mahurat', 'pithi', 'garba', 'jaan', 'pheras_gujarati', 'vidaai_gujarati',
    // South Indian events
    'vratham', 'nalugu', 'muhurtham', 'oonjal', 'saptapadi', 'arundhati',
    // Generic
    'custom'
  ]),
  date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  costPerHead: z.string().nullable().optional(),
  venueCapacity: z.number().nullable().optional(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ============================================================================
// EVENT COST ITEMS - Granular cost breakdown per event
// ============================================================================

export const eventCostItems = pgTable("event_cost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  categoryId: varchar("category_id"), // Links to budget_categories table for cost aggregation
  name: text("name").notNull(), // e.g., "Catering", "Decorations", "DJ", "Venue Rental"
  costType: text("cost_type").notNull(), // 'per_head' | 'fixed'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Cost amount
});

export const insertEventCostItemSchema = createInsertSchema(eventCostItems).omit({
  id: true,
}).extend({
  costType: z.enum(['per_head', 'fixed']),
  amount: z.string(),
  categoryId: z.string().nullable().optional(),
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
  category: text("category").notNull(), // Legacy single category field
  categories: text("categories").array(), // Multiple service categories vendor provides (new)
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
  claimed: boolean("claimed").notNull().default(true), // false = ghost profile from Google Places, true = vendor-owned
  source: text("source").notNull().default('manual'), // 'manual' | 'google_places' - how the profile was created
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
});

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
}).extend({
  categories: z.array(z.enum(VENDOR_CATEGORIES)).min(1, "Select at least one service category"),
  preferredWeddingTraditions: z.array(z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general'])).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  claimed: z.boolean().optional(),
  source: z.enum(['manual', 'google_places']).optional(),
  optedOutOfNotifications: z.boolean().optional(),
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

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
// BUDGET CATEGORIES - Cultural budget allocation
// ============================================================================

export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  category: text("category").notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default('0'),
  percentage: integer("percentage"),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
}).extend({
  allocatedAmount: z.string(),
  spentAmount: z.string().optional(),
});

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

// ============================================================================
// EXPENSES - Shared expense tracking for couples
// ============================================================================

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"), // Optional - link to specific event
  categoryId: varchar("category_id"), // Optional - link to budget category
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidById: varchar("paid_by_id").notNull(), // User ID who paid
  paidByName: text("paid_by_name").notNull(), // Cached name for display
  splitType: text("split_type").notNull().default('equal'), // 'equal' | 'percentage' | 'custom' | 'full'
  receiptUrl: text("receipt_url"), // Optional receipt image/document
  notes: text("notes"),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal"),
  splitType: z.enum(['equal', 'percentage', 'custom', 'full']),
  expenseDate: z.string().optional().transform(val => val ? new Date(val) : new Date()),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// ============================================================================
// EXPENSE SPLITS - How each expense is divided between parties
// ============================================================================

export const expenseSplits = pgTable("expense_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: varchar("expense_id").notNull(),
  userId: varchar("user_id").notNull(), // User who owes this portion
  userName: text("user_name").notNull(), // Cached name for display
  shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(), // Amount this user owes
  sharePercentage: integer("share_percentage"), // Optional percentage (for percentage splits)
  isPaid: boolean("is_paid").notNull().default(false), // Has this person settled their share?
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
// HOUSEHOLDS - Family/group management for unified RSVPs
// ============================================================================

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // e.g., "The Patel Family"
  contactEmail: text("contact_email"), // Primary contact email for invitations (required for sending)
  maxCount: integer("max_count").notNull().default(1), // Total seats allocated (e.g., 4)
  affiliation: text("affiliation").notNull().default("bride"), // "bride" | "groom" | "mutual"
  relationshipTier: text("relationship_tier").notNull().default("friend"), // "immediate_family" | "extended_family" | "friend" | "parents_friend"
  // Priority and source tracking for advanced guest management
  priorityTier: text("priority_tier").notNull().default("should_invite"), // "must_invite" | "should_invite" | "nice_to_have"
  sourceId: varchar("source_id"), // Reference to guest_sources table
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
  side: text("side").notNull().default('mutual'), // 'bride' | 'groom' | 'mutual' (Affiliation)
  relationshipTier: text("relationship_tier"), // 'immediate_family' | 'extended_family' | 'friend' | 'parents_friend'
  group: text("group"), // Legacy field - deprecated, use householdId
  eventIds: text("event_ids").array(), // Which events they're invited to (deprecated - use invitations table)
  rsvpStatus: text("rsvp_status").default('pending'), // 'pending' | 'confirmed' | 'declined' (deprecated - use invitations table)
  plusOne: boolean("plus_one").default(false),
  dietaryRestrictions: text("dietary_restrictions"), // (deprecated - use invitations table)
  magicLinkTokenHash: varchar("magic_link_token_hash").unique(), // HASHED secure token (deprecated - use household token)
  magicLinkExpires: timestamp("magic_link_expires"), // Token expiration (deprecated - use household token)
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  magicLinkTokenHash: true,
  magicLinkExpires: true,
}).extend({
  name: z.string().min(1, { message: "Guest name is required" }),
  side: z.enum(['bride', 'groom', 'mutual']).optional(),
  relationshipTier: z.enum(['immediate_family', 'extended_family', 'friend', 'parents_friend']).optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined']).optional(),
});

export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

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
  assignedToId: varchar("assigned_to_id"), // Team member user ID
  assignedToName: text("assigned_to_name"), // Cached name for display
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderDaysBefore: integer("reminder_days_before").default(1), // Days before due date to send reminder
  reminderMethod: text("reminder_method").default('email'), // 'email' | 'sms' | 'both'
  lastReminderSentAt: timestamp("last_reminder_sent_at"), // Track on-demand reminders
  completedAt: timestamp("completed_at"), // When task was completed
  createdAt: timestamp("created_at").defaultNow(),
  // AI recommendation fields
  isAiRecommended: boolean("is_ai_recommended").default(false), // Was this task AI-generated
  aiReason: text("ai_reason"), // Why AI recommended this task
  aiCategory: text("ai_category"), // AI categorization (e.g., 'vendor', 'venue', 'attire', 'ceremony')
  dismissed: boolean("dismissed").default(false), // If user dismissed the AI recommendation
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  completedAt: true,
  createdAt: true,
}).extend({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  reminderMethod: z.enum(['email', 'sms', 'both']).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

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

// ============================================================================
// BUDGET BENCHMARKS - Cultural spending benchmarks by city and tradition
// ============================================================================

export const budgetBenchmarks = pgTable("budget_benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull(), // 'San Francisco Bay Area' | 'New York City' | 'Los Angeles' | 'Chicago' | 'Seattle'
  tradition: text("tradition").notNull(), // 'sikh' | 'hindu' | 'general'
  category: text("category").notNull(), // Vendor category or budget category
  averageSpend: decimal("average_spend", { precision: 10, scale: 2 }).notNull(),
  minSpend: decimal("min_spend", { precision: 10, scale: 2 }).notNull(),
  maxSpend: decimal("max_spend", { precision: 10, scale: 2 }).notNull(),
  percentageOfBudget: integer("percentage_of_budget"), // Recommended % of total budget
  sampleSize: integer("sample_size").default(0), // Number of weddings in this benchmark
  description: text("description"), // Context about this spending category
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBudgetBenchmarkSchema = createInsertSchema(budgetBenchmarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  city: z.enum(['San Francisco Bay Area', 'New York City', 'Los Angeles', 'Chicago', 'Seattle']),
  tradition: z.enum(['sikh', 'hindu', 'general']),
  averageSpend: z.string(),
  minSpend: z.string(),
  maxSpend: z.string(),
});

export type InsertBudgetBenchmark = z.infer<typeof insertBudgetBenchmarkSchema>;
export type BudgetBenchmark = typeof budgetBenchmarks.$inferSelect;

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
  guest_suggestions: {
    label: "Suggest Guests",
    description: "Suggest guests for the couple to approve",
    permissions: ["edit"] as const,
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
  photos: {
    label: "Photos & Media",
    description: "Upload and manage photos",
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
  // Concierge
  concierge: {
    label: "Guest Concierge",
    description: "Manage live updates, gaps, and rituals",
    permissions: ["view", "edit", "manage"] as const,
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

// Guest Suggestions - For collaborators to suggest guests pending approval
export const guestSuggestions = pgTable("guest_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  suggestedBy: varchar("suggested_by").notNull(), // User ID who made the suggestion
  suggestedByName: text("suggested_by_name"), // Display name of suggester
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  
  // Household suggestion fields
  householdName: text("household_name").notNull(), // e.g., "The Patel Family"
  contactEmail: text("contact_email"),
  maxCount: integer("max_count").notNull().default(1), // Seats requested
  affiliation: text("affiliation").notNull().default("bride"), // "bride" | "groom" | "mutual"
  relationshipTier: text("relationship_tier").notNull().default("friend"),
  priorityTier: text("priority_tier").notNull().default("nice_to_have"), // "must_invite" | "should_invite" | "nice_to_have"
  
  // Guest names within household (comma separated or JSON)
  guestNames: text("guest_names"), // Individual guest names
  
  // Source tracking
  sourceId: varchar("source_id"), // Who submitted originally (e.g., Mom, Grandma)
  notes: text("notes"), // Suggester's notes
  
  // Review fields
  reviewedBy: varchar("reviewed_by"), // User who reviewed
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuestSuggestionSchema = createInsertSchema(guestSuggestions).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
}).extend({
  affiliation: z.enum(["bride", "groom", "mutual"]),
  relationshipTier: z.enum(["immediate_family", "extended_family", "friend", "parents_friend"]),
  priorityTier: z.enum(["must_invite", "should_invite", "nice_to_have"]),
});

export type InsertGuestSuggestion = z.infer<typeof insertGuestSuggestionSchema>;
export type GuestSuggestion = typeof guestSuggestions.$inferSelect;

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

// Cut List - Track households that were removed from guest list
export const cutListItems = pgTable("cut_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  householdId: varchar("household_id").notNull(),
  cutReason: text("cut_reason"), // "budget", "space", "priority", "other"
  cutNotes: text("cut_notes"),
  cutBy: varchar("cut_by").notNull(), // User who cut
  cutAt: timestamp("cut_at").notNull().defaultNow(),
  canRestore: boolean("can_restore").notNull().default(true),
  restoredAt: timestamp("restored_at"),
  restoredBy: varchar("restored_by"),
});

export const insertCutListItemSchema = createInsertSchema(cutListItems).omit({
  id: true,
  cutAt: true,
  restoredAt: true,
  restoredBy: true,
}).extend({
  cutReason: z.enum(["budget", "space", "priority", "other"]).optional(),
  cutNotes: z.string().optional().nullable(),
});

export type InsertCutListItem = z.infer<typeof insertCutListItemSchema>;
export type CutListItem = typeof cutListItems.$inferSelect;

// Extended types for guest management
export type GuestSuggestionWithSource = GuestSuggestion & {
  source?: GuestSource;
};

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

export type CutListItemWithHousehold = CutListItem & {
  household: Household;
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
