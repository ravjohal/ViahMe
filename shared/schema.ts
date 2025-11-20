import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
  weddingDate: timestamp("wedding_date"),
  location: text("location").notNull(), // 'Bay Area' etc
  guestCountEstimate: integer("guest_count_estimate"),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }),
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
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ============================================================================
// VENDORS - Culturally-specific service providers
// ============================================================================

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'makeup' | 'dj' | 'dhol' | 'turban_tier' | 'mehndi' | etc
  location: text("location").notNull(),
  city: text("city").notNull().default('San Francisco Bay Area'), // 'San Francisco Bay Area' | 'New York City' | 'Los Angeles' | 'Chicago' | 'Seattle'
  priceRange: text("price_range").notNull(), // '$' | '$$' | '$$$' | '$$$$'
  culturalSpecialties: text("cultural_specialties").array(), // ['sikh', 'hindu', 'punjabi', etc]
  description: text("description"),
  portfolio: jsonb("portfolio"), // Array of image URLs
  availability: jsonb("availability"), // Calendar data
  contact: text("contact"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  featured: boolean("featured").default(false),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  rating: true,
  reviewCount: true,
}).extend({
  category: z.enum([
    // Common vendors
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
    // Hindu-specific vendors
    'pandit',
    'mandap_decorator',
    'haldi_supplies',
    'pooja_items',
    'astrologer',
    'garland_maker',
    // Muslim-specific vendors
    'qazi',
    'imam',
    'nikah_decorator',
    'halal_caterer',
    'quran_reciter',
    // Gujarati-specific vendors
    'garba_instructor',
    'dandiya_equipment',
    'rangoli_artist',
    // South Indian-specific vendors
    'nadaswaram_player',
    'silk_saree_rental',
    'kolam_artist'
  ]),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// ============================================================================
// BOOKINGS - Vendor assignment to events
// ============================================================================

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  eventId: varchar("event_id"),
  vendorId: varchar("vendor_id").notNull(),
  status: text("status").notNull().default('pending'), // 'pending' | 'confirmed' | 'declined' | 'cancelled'
  requestDate: timestamp("request_date").notNull().defaultNow(),
  confirmedDate: timestamp("confirmed_date"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  requestDate: true,
  confirmedDate: true,
}).extend({
  status: z.enum(['pending', 'confirmed', 'declined', 'cancelled']).optional(),
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
// GUESTS - Multi-event guest management
// ============================================================================

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  side: text("side"), // 'bride' | 'groom' | 'mutual'
  eventIds: text("event_ids").array(), // Which events they're invited to
  rsvpStatus: text("rsvp_status").default('pending'), // 'pending' | 'confirmed' | 'declined'
  plusOne: boolean("plus_one").default(false),
  dietaryRestrictions: text("dietary_restrictions"),
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
}).extend({
  side: z.enum(['bride', 'groom', 'mutual']).optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined']).optional(),
});

export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

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
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
}).extend({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ============================================================================
// CONTRACTS - Vendor contract management
// ============================================================================

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
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
  status: z.enum(['draft', 'sent', 'signed', 'active', 'completed', 'cancelled']).optional(),
  totalAmount: z.string(),
  signedDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ============================================================================
// MESSAGES - Couple-Vendor Communication
// ============================================================================

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // Composite of weddingId-vendorId for grouping
  weddingId: varchar("wedding_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  senderId: varchar("sender_id").notNull(), // Could be couple or vendor
  senderType: text("sender_type").notNull(), // 'couple' | 'vendor'
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  conversationId: true, // Generated server-side from weddingId + vendorId
}).extend({
  senderType: z.enum(['couple', 'vendor']),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  helpful: true,
}).extend({
  rating: z.number().min(1).max(5),
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
  requestedBy: text("requested_by"), // Guest name or "Couple"
  notes: text("notes"), // Special instructions for DJ
  voteCount: integer("vote_count").default(0),
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'declined'
  order: integer("order"), // For custom playlist ordering
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  createdAt: true,
  voteCount: true,
}).extend({
  status: z.enum(['pending', 'approved', 'declined']).optional(),
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
