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
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ============================================================================
// VENDORS - Culturally-specific service providers
// ============================================================================

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Link to user account (for vendor-owned profiles)
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
  email: text("email"), // Vendor business email
  phone: text("phone"), // Vendor business phone
  website: text("website"), // Vendor website URL
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  featured: boolean("featured").default(false),
  isPublished: boolean("is_published").notNull().default(false), // Whether vendor profile is visible to couples
  yelpBusinessId: text("yelp_business_id"), // Yelp business ID for fetching external reviews
  googlePlaceId: text("google_place_id"), // Google Place ID for fetching external reviews
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  timeSlot: text("time_slot"), // 'morning' | 'afternoon' | 'evening' | 'full_day'
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
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'full_day']).optional(),
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
// HOUSEHOLDS - Family/group management for unified RSVPs
// ============================================================================

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weddingId: varchar("wedding_id").notNull(),
  name: text("name").notNull(), // e.g., "The Patel Family"
  maxCount: integer("max_count").notNull().default(1), // Total seats allocated (e.g., 4)
  affiliation: text("affiliation").notNull().default("bride"), // "bride" | "groom" | "mutual"
  relationshipTier: text("relationship_tier").notNull().default("friend"), // "immediate_family" | "extended_family" | "friend" | "parents_friend"
  magicLinkTokenHash: varchar("magic_link_token_hash").unique(), // HASHED secure token for passwordless access
  magicLinkExpires: timestamp("magic_link_expires"), // Token expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  magicLinkTokenHash: true,
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
  requestedBy: z.string().optional(),
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
