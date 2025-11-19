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
  tradition: z.enum(['sikh', 'hindu', 'general']),
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
  type: z.enum(['paath', 'mehndi', 'maiyan', 'sangeet', 'anand_karaj', 'reception', 'custom']),
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
    'baraat_band'
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
