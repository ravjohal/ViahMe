import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage, parseConversationId } from "./storage";
import { registerAuthRoutes } from "./auth-routes";
import { requireAuth, requireRole, type AuthRequest } from "./auth-middleware";
import {
  insertWeddingSchema,
  insertEventSchema,
  insertVendorSchema,
  insertBookingSchema,
  insertBudgetCategorySchema,
  insertHouseholdSchema,
  insertGuestSchema,
  insertInvitationSchema,
  insertTaskSchema,
  insertContractSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertBudgetBenchmarkSchema,
  insertPlaylistSchema,
  insertPlaylistSongSchema,
  insertSongVoteSchema,
  insertDocumentSchema,
  insertWeddingWebsiteSchema,
  insertPhotoGallerySchema,
  insertPhotoSchema,
  insertVendorAvailabilitySchema,
  insertContractSignatureSchema,
  insertMeasurementProfileSchema,
  insertShoppingOrderItemSchema,
  insertGapWindowSchema,
  insertGapRecommendationSchema,
  insertRitualStageSchema,
  insertRitualStageUpdateSchema,
  insertGuestNotificationSchema,
  insertLiveWeddingStatusSchema,
  insertWeddingRoleSchema,
  insertGuestSourceSchema,
  insertGuestSuggestionSchema,
  insertGuestListScenarioSchema,
  insertGuestBudgetSettingsSchema,
  insertCutListItemSchema,
} from "@shared/schema";
import { seedVendors, seedBudgetBenchmarks } from "./seed-data";
import {
  sendBookingConfirmationEmail,
  sendVendorNotificationEmail,
  sendRsvpConfirmationEmail,
  sendInvitationEmail,
} from "./email";

// Seed vendors only if database is empty
(async () => {
  const existingVendors = await storage.getAllVendors();
  if (existingVendors.length === 0) {
    await seedVendors(storage);
  }
  
  // Seed budget benchmarks only if database is empty
  const existingBenchmarks = await storage.getAllBudgetBenchmarks();
  if (existingBenchmarks.length === 0) {
    await seedBudgetBenchmarks(storage);
  }
})();

// ============================================================================
// LIVE VIEWER TRACKING - In-memory tracking of active guests viewing live feed
// ============================================================================
interface ViewerSession {
  viewerId: string;
  weddingId: string;
  lastHeartbeat: number;
}

const activeViewers = new Map<string, ViewerSession>();
const VIEWER_TIMEOUT_MS = 60000; // Consider viewer inactive after 60 seconds

function cleanupStaleViewers() {
  const now = Date.now();
  for (const [viewerId, session] of activeViewers.entries()) {
    if (now - session.lastHeartbeat > VIEWER_TIMEOUT_MS) {
      activeViewers.delete(viewerId);
    }
  }
}

function getViewerCount(weddingId: string): number {
  cleanupStaleViewers();
  let count = 0;
  for (const session of activeViewers.values()) {
    if (session.weddingId === weddingId) {
      count++;
    }
  }
  return count;
}

// Cleanup stale viewers every 30 seconds
setInterval(cleanupStaleViewers, 30000);

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  registerAuthRoutes(app, storage);

  // ============================================================================
  // WEDDINGS
  // ============================================================================

  app.get("/api/weddings", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const weddings = await storage.getWeddingsByUser(authReq.session.userId);
      res.json(weddings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weddings" });
    }
  });

  app.get("/api/weddings/:id", async (req, res) => {
    try {
      const wedding = await storage.getWedding(req.params.id);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json(wedding);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding" });
    }
  });

  app.patch("/api/weddings/:id", async (req, res) => {
    try {
      const wedding = await storage.updateWedding(req.params.id, req.body);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json(wedding);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wedding" });
    }
  });

  app.post("/api/weddings", async (req, res) => {
    try {
      const validatedData = insertWeddingSchema.parse(req.body);
      const wedding = await storage.createWedding(validatedData);

      // Auto-create events based on tradition
      if (wedding.tradition === "sikh") {
        const sikhEvents = [
          {
            weddingId: wedding.id,
            name: "Paath",
            type: "paath" as const,
            description: "3-day prayer ceremony at home or Gurdwara",
            order: 1,
          },
          {
            weddingId: wedding.id,
            name: "Mehndi",
            type: "mehndi" as const,
            description: "Henna ceremony with close family and friends",
            order: 2,
          },
          {
            weddingId: wedding.id,
            name: "Maiyan",
            type: "maiyan" as const,
            description: "Traditional turmeric ceremony",
            order: 3,
          },
          {
            weddingId: wedding.id,
            name: "Lady Sangeet",
            type: "sangeet" as const,
            description: "Grand celebration with music and dance",
            order: 4,
          },
          {
            weddingId: wedding.id,
            name: "Anand Karaj",
            type: "anand_karaj" as const,
            description: "Sacred Sikh wedding ceremony at Gurdwara",
            order: 5,
          },
          {
            weddingId: wedding.id,
            name: "Reception",
            type: "reception" as const,
            description: "Grand celebration with all guests",
            order: 6,
          },
        ];

        // Auto-suggest dates if wedding date is provided
        const eventsWithDates = sikhEvents.map((event) => {
          if (wedding.weddingDate) {
            const weddingDate = new Date(wedding.weddingDate);
            let eventDate = new Date(weddingDate);
            
            // Calculate dates relative to wedding day
            if (event.type === "paath") {
              eventDate.setDate(weddingDate.getDate() - 7); // 1 week before
            } else if (event.type === "mehndi") {
              eventDate.setDate(weddingDate.getDate() - 3); // 3 days before
            } else if (event.type === "maiyan") {
              eventDate.setDate(weddingDate.getDate() - 3); // Same day as mehndi
            } else if (event.type === "sangeet") {
              eventDate.setDate(weddingDate.getDate() - 2); // 2 days before per research
            } else if (event.type === "anand_karaj") {
              eventDate = weddingDate; // Wedding day
            } else if (event.type === "reception") {
              eventDate = weddingDate; // Same day or next day
            }
            
            return { ...event, date: eventDate };
          }
          return event;
        });

        for (const eventData of eventsWithDates) {
          await storage.createEvent(eventData as any);
        }
      }

      // Auto-create budget categories with cultural-aware allocations
      if (wedding.totalBudget && parseFloat(wedding.totalBudget) > 0) {
        const totalBudget = parseFloat(wedding.totalBudget);
        const budgetAllocations = [
          { category: "catering", percentage: 40 },
          { category: "venue", percentage: 15 },
          { category: "entertainment", percentage: 12 },
          { category: "photography", percentage: 10 },
          { category: "decoration", percentage: 8 },
          { category: "attire", percentage: 8 },
          { category: "transportation", percentage: 4 },
          { category: "other", percentage: 3 },
        ];

        for (const allocation of budgetAllocations) {
          const allocatedAmount = ((totalBudget * allocation.percentage) / 100).toFixed(2);
          await storage.createBudgetCategory({
            weddingId: wedding.id,
            category: allocation.category,
            allocatedAmount,
            spentAmount: "0",
            percentage: allocation.percentage,
          });
        }
      }

      res.json(wedding);
    } catch (error) {
      console.error("Error creating wedding:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create wedding", message: error instanceof Error ? error.message : String(error) });
    }
  });

  // ============================================================================
  // EVENTS
  // ============================================================================

  app.get("/api/events/:weddingId", async (req, res) => {
    try {
      const events = await storage.getEventsByWedding(req.params.weddingId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get single event by ID (for RSVP portal and other frontend needs)
  app.get("/api/events/by-id/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ============================================================================
  // VENDORS
  // ============================================================================

  app.get("/api/vendors", async (req, res) => {
    try {
      const { category, location } = req.query;

      let vendors = await storage.getAllVendors();

      if (category && typeof category === "string") {
        vendors = vendors.filter((v) => v.category === category);
      }

      if (location && typeof location === "string") {
        vendors = vendors.filter((v) =>
          v.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.json(vendor);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.patch("/api/vendors/:id", async (req, res) => {
    try {
      const validatedData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(req.params.id, validatedData);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  // ============================================================================
  // BOOKINGS
  // ============================================================================

  app.get("/api/bookings/:weddingId", async (req, res) => {
    try {
      const bookings = await storage.getBookingsByWedding(req.params.weddingId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings-with-vendors/:weddingId", async (req, res) => {
    try {
      const bookings = await storage.getBookingsWithVendorsByWedding(req.params.weddingId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings with vendor details" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      
      // Send confirmation emails asynchronously (don't block response)
      (async () => {
        try {
          // Fetch vendor, event, and wedding details for email
          const vendor = await storage.getVendor(booking.vendorId);
          const event = booking.eventId ? await storage.getEvent(booking.eventId) : null;
          // Fetch wedding directly from booking.weddingId to ensure we have wedding data
          const wedding = await storage.getWedding(booking.weddingId);
          
          if (!vendor || !wedding) return;
          
          const eventName = event?.name || 'Your Event';
          const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Date TBD';
          
          // Build couple name from wedding data
          const coupleName = wedding.partner1Name && wedding.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'The Couple';
          
          // Format time slot (default to Full Day if not specified)
          const timeSlot = booking.timeSlot === 'full_day' || !booking.timeSlot ? 'Full Day' :
                          booking.timeSlot === 'morning' ? 'Morning' :
                          booking.timeSlot === 'afternoon' ? 'Afternoon' :
                          booking.timeSlot === 'evening' ? 'Evening' : 'Full Day';
          
          // Send confirmation email to couple if email is available
          if (wedding.coupleEmail) {
            await sendBookingConfirmationEmail({
              to: wedding.coupleEmail,
              coupleName,
              vendorName: vendor.name,
              vendorCategory: vendor.category,
              eventName,
              eventDate,
              timeSlot,
              bookingId: booking.id,
            });
          }
          
          // Send notification email to vendor if contact contains email
          const vendorEmail = vendor.contact && vendor.contact.includes('@') ? vendor.contact : null;
          if (vendorEmail) {
            await sendVendorNotificationEmail({
              to: vendorEmail,
              vendorName: vendor.name,
              coupleName,
              eventName,
              eventDate,
              timeSlot,
              bookingId: booking.id,
              coupleEmail: wedding.coupleEmail || undefined,
              couplePhone: wedding.couplePhone || undefined,
            });
          }
        } catch (emailError) {
          console.error('Failed to send booking emails:', emailError);
        }
      })();
      
      res.json(booking);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  app.get("/api/bookings/vendor/:vendorId", async (req, res) => {
    try {
      const bookings = await storage.getBookingsByVendor(req.params.vendorId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor bookings" });
    }
  });

  // ============================================================================
  // BUDGET CATEGORIES
  // ============================================================================

  app.get("/api/budget-categories/:weddingId", async (req, res) => {
    try {
      const categories = await storage.getBudgetCategoriesByWedding(req.params.weddingId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  app.post("/api/budget-categories", async (req, res) => {
    try {
      const validatedData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget category" });
    }
  });

  app.patch("/api/budget-categories/:id", async (req, res) => {
    try {
      const category = await storage.updateBudgetCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update budget category" });
    }
  });

  app.delete("/api/budget-categories/:id", async (req, res) => {
    try {
      await storage.deleteBudgetCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  // ============================================================================
  // HOUSEHOLDS - Family grouping for guest management
  // ============================================================================

  app.get("/api/households/:weddingId", async (req, res) => {
    try {
      const households = await storage.getHouseholdsByWedding(req.params.weddingId);
      res.json(households);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch households" });
    }
  });

  app.get("/api/households/by-id/:id", async (req, res) => {
    try {
      const household = await storage.getHousehold(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household" });
    }
  });

  // Public endpoint - accessible via magic link token (no auth required)
  app.get("/api/households/by-token/:token", async (req, res) => {
    try {
      const household = await storage.getHouseholdByMagicToken(req.params.token);
      
      // Token validation and expiry enforcement
      if (!household) {
        return res.status(401).json({ error: "Invalid or expired magic link" });
      }
      
      // Explicit expiry check (defense in depth)
      if (household.magicLinkExpires && new Date(household.magicLinkExpires) < new Date()) {
        return res.status(401).json({ error: "Magic link has expired. Please contact the couple for a new invitation." });
      }
      
      // Sanitize response - remove all sensitive token fields
      const { magicLinkTokenHash, magicLinkExpires, ...sanitizedHousehold } = household;
      res.json(sanitizedHousehold);
    } catch (error) {
      res.status(500).json({ error: "Failed to authenticate household" });
    }
  });

  app.post("/api/households", async (req, res) => {
    try {
      const validatedData = insertHouseholdSchema.parse(req.body);
      const household = await storage.createHousehold(validatedData);
      res.json(household);
    } catch (error) {
      console.error("Error creating household:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  app.patch("/api/households/:id", async (req, res) => {
    try {
      const validatedData = insertHouseholdSchema.partial().parse(req.body);
      const household = await storage.updateHousehold(req.params.id, validatedData);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json(household);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update household" });
    }
  });

  app.delete("/api/households/:id", async (req, res) => {
    try {
      await storage.deleteHousehold(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete household" });
    }
  });

  // Generate magic link token for household (30 day expiry)
  app.post("/api/households/:id/generate-token", async (req, res) => {
    try {
      const expiresInDays = req.body.expiresInDays || 30;
      const token = await storage.generateHouseholdMagicToken(req.params.id, expiresInDays);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate magic link token" });
    }
  });

  // Revoke magic link token for household
  app.post("/api/households/:id/revoke-token", async (req, res) => {
    try {
      await storage.revokeHouseholdMagicToken(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke magic link token" });
    }
  });

  // Get magic link for household with active link (retrieves stored token)
  app.get("/api/households/:id/magic-link", async (req, res) => {
    try {
      const household = await storage.getHousehold(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      // Check if household has an active magic link
      if (!household.magicLinkTokenHash || !household.magicLinkExpires || !household.magicLinkToken) {
        return res.status(404).json({ error: "No active magic link for this household" });
      }

      // Check if link is expired
      if (new Date(household.magicLinkExpires) < new Date()) {
        return res.status(410).json({ error: "Magic link has expired" });
      }

      // Return stored plaintext token
      const token = household.magicLinkToken;
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
      const magicLink = `${baseUrl}/rsvp/${token}`;

      res.json({ token, magicLink });
    } catch (error) {
      res.status(500).json({ error: "Failed to get magic link" });
    }
  });

  // Send bulk invitation emails to households
  app.post("/api/households/send-invitations", async (req, res) => {
    try {
      const { householdIds, weddingId, eventIds, personalMessage } = req.body;

      if (!Array.isArray(householdIds) || !Array.isArray(eventIds)) {
        return res.status(400).json({ error: "householdIds and eventIds must be arrays" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || wedding.partner2Name || 'The Couple';

      const events = await Promise.all(eventIds.map(id => storage.getEvent(id)));
      const eventNames = events.filter(e => e).map(e => e!.name);
      
      const weddingDate = wedding.date ? new Date(wedding.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined;

      const results = [];
      const errors = [];

      for (const householdId of householdIds) {
        try {
          const household = await storage.getHousehold(householdId);
          if (!household) {
            errors.push({ householdId, error: "Household not found" });
            continue;
          }

          // Generate magic link token
          const token = await storage.generateHouseholdMagicToken(householdId, 30);
          const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
          const magicLink = `${baseUrl}/rsvp/${token}`;

          // Create invitations for each event
          const guests = await storage.getGuestsByHousehold(householdId);
          for (const guest of guests) {
            for (const eventId of eventIds) {
              // Check if invitation already exists
              const existing = await storage.getInvitationByGuestAndEvent(guest.id, eventId);
              if (!existing) {
                await storage.createInvitation({
                  guestId: guest.id,
                  eventId,
                  rsvpStatus: 'pending',
                });
              }
            }
          }

          // Send email to household contact
          if (household.contactEmail) {
            await sendInvitationEmail({
              to: household.contactEmail,
              householdName: household.name,
              coupleName,
              magicLink,
              eventNames,
              weddingDate,
              personalMessage,
            });

            results.push({ householdId, email: household.contactEmail, success: true });
          } else {
            errors.push({ householdId, error: "No contact email" });
          }
        } catch (error) {
          errors.push({ 
            householdId, 
            error: error instanceof Error ? error.message : "Failed to send invitation" 
          });
        }
      }

      res.json({ 
        success: results.length,
        results,
        errors,
        total: householdIds.length
      });
    } catch (error) {
      console.error("Failed to send bulk invitations:", error);
      res.status(500).json({ error: "Failed to send invitations" });
    }
  });

  // ============================================================================
  // INVITATIONS - Per-event RSVP tracking
  // ============================================================================

  // Get invitations for a specific guest
  app.get("/api/invitations/by-guest/:guestId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByGuest(req.params.guestId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.get("/api/invitations/by-event/:eventId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByEvent(req.params.eventId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Get all invitations for all guests in a household (for RSVP portal)
  app.get("/api/invitations/household/:householdId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByHousehold(req.params.householdId);
      const allInvitations = [];
      
      for (const guest of guests) {
        const invitations = await storage.getInvitationsByGuest(guest.id);
        allInvitations.push(...invitations);
      }
      
      res.json(allInvitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household invitations" });
    }
  });

  app.post("/api/invitations", async (req, res) => {
    try {
      const validatedData = insertInvitationSchema.parse(req.body);
      const invitation = await storage.createInvitation(validatedData);
      res.json(invitation);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Bulk create invitations (for inviting multiple guests to multiple events)
  app.post("/api/invitations/bulk", async (req, res) => {
    try {
      const invitationsArray = req.body.invitations;
      if (!Array.isArray(invitationsArray)) {
        return res.status(400).json({ error: "Request body must contain an 'invitations' array" });
      }

      const validatedInvitations = invitationsArray.map(inv => 
        insertInvitationSchema.parse(inv)
      );

      const createdInvitations = await storage.bulkCreateInvitations(validatedInvitations);
      res.json({ 
        success: createdInvitations.length,
        invitations: createdInvitations 
      });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create invitations" });
    }
  });

  // Public RSVP submission endpoint (accessible via magic link, no auth required)
  app.patch("/api/invitations/:id/rsvp", async (req, res) => {
    try {
      const { rsvpStatus, dietaryRestrictions, plusOneAttending } = req.body;
      
      const updatedInvitation = await storage.updateInvitation(req.params.id, {
        rsvpStatus,
        dietaryRestrictions,
        plusOneAttending,
        respondedAt: new Date(),
      });

      if (!updatedInvitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Send RSVP confirmation email asynchronously
      (async () => {
        try {
          const guest = await storage.getGuest(updatedInvitation.guestId);
          const event = await storage.getEvent(updatedInvitation.eventId);
          
          if (guest?.email && event) {
            await sendRsvpConfirmationEmail({
              to: guest.email,
              guestName: guest.name,
              eventName: event.name,
              eventDate: event.date ? new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Date TBD',
              rsvpStatus: rsvpStatus === 'attending' ? 'Attending' : 'Not Attending',
            });
          }
        } catch (emailError) {
          console.error('Failed to send RSVP confirmation email:', emailError);
        }
      })();

      res.json(updatedInvitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit RSVP" });
    }
  });

  app.delete("/api/invitations/:id", async (req, res) => {
    try {
      await storage.deleteInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  // ============================================================================
  // GUESTS
  // ============================================================================

  app.get("/api/guests/:weddingId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByWedding(req.params.weddingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  // Get guests by household
  app.get("/api/guests/by-household/:householdId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByHousehold(req.params.householdId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  app.post("/api/guests", async (req, res) => {
    try {
      const validatedData = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(validatedData);
      res.json(guest);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create guest" });
    }
  });

  app.post("/api/guests/bulk", async (req, res) => {
    try {
      const guestsArray = req.body.guests;
      if (!Array.isArray(guestsArray)) {
        return res.status(400).json({ error: "Request body must contain a 'guests' array" });
      }

      const createdGuests = [];
      const errors = [];

      for (let i = 0; i < guestsArray.length; i++) {
        try {
          const validatedData = insertGuestSchema.parse(guestsArray[i]);
          const guest = await storage.createGuest(validatedData);
          createdGuests.push(guest);
        } catch (error) {
          errors.push({
            index: i,
            data: guestsArray[i],
            error: error instanceof Error ? error.message : "Validation failed"
          });
        }
      }

      res.json({
        success: createdGuests.length,
        failed: errors.length,
        guests: createdGuests,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk import guests" });
    }
  });

  app.patch("/api/guests/:id", async (req, res) => {
    try {
      const guest = await storage.updateGuest(req.params.id, req.body);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }
      
      // Send RSVP confirmation email if status was updated
      if (req.body.rsvpStatus && guest.email) {
        const guestEmail = guest.email; // Capture email for async context
        (async () => {
          try {
            // Guest has eventIds array, use first one if available
            const eventId = guest.eventIds && guest.eventIds.length > 0 ? guest.eventIds[0] : null;
            const event = eventId ? await storage.getEvent(eventId) : null;
            const wedding = event ? await storage.getWedding(event.weddingId) : null;
            
            const eventName = event?.name || 'Wedding Event';
            const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Date TBD';
            const eventVenue = event?.location || undefined;
            
            // Build couple name from wedding data
            const coupleName = wedding?.partner1Name && wedding?.partner2Name 
              ? `${wedding.partner1Name} & ${wedding.partner2Name}`
              : wedding?.partner1Name || wedding?.partner2Name || 'The Couple';
            
            await sendRsvpConfirmationEmail({
              to: guestEmail,
              guestName: guest.name,
              eventName,
              eventDate,
              eventVenue,
              rsvpStatus: guest.rsvpStatus as 'attending' | 'not_attending' | 'maybe',
              coupleName,
            });
          } catch (emailError) {
            console.error('Failed to send RSVP confirmation email:', emailError);
          }
        })();
      }
      
      res.json(guest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update guest" });
    }
  });

  app.delete("/api/guests/:id", async (req, res) => {
    try {
      const success = await storage.deleteGuest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Guest not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete guest" });
    }
  });

  // ============================================================================
  // TASKS
  // ============================================================================

  app.get("/api/tasks/:weddingId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByWedding(req.params.weddingId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ============================================================================
  // CONTRACTS
  // ============================================================================

  app.get("/api/contracts/:weddingId", async (req, res) => {
    try {
      const contracts = await storage.getContractsByWedding(req.params.weddingId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/vendor/:vendorId", async (req, res) => {
    try {
      const contracts = await storage.getContractsByVendor(req.params.vendorId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor contracts" });
    }
  });

  app.get("/api/contracts/booking/:bookingId", async (req, res) => {
    try {
      const contract = await storage.getContractByBooking(req.params.bookingId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.json(contract);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const success = await storage.deleteContract(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // ============================================================================
  // CONTRACT SIGNATURES - E-signature functionality
  // ============================================================================

  // Get all signatures for a contract
  app.get("/api/contracts/:contractId/signatures", async (req, res) => {
    try {
      const signatures = await storage.getSignaturesByContract(req.params.contractId);
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract signatures" });
    }
  });

  // Sign a contract with e-signature
  app.post("/api/contracts/:contractId/sign", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { signatureData, signerName, signerEmail, signerRole } = req.body;

      // Validate required fields
      if (!signatureData || !signerName || !signerEmail || !signerRole) {
        return res.status(400).json({ error: "Missing required signature data" });
      }

      // Validate signature data is not empty/whitespace
      if (typeof signatureData !== 'string' || signatureData.trim().length === 0) {
        return res.status(400).json({ error: "Signature data cannot be empty" });
      }

      // Validate signerRole is from allowed enum
      if (signerRole !== 'couple' && signerRole !== 'vendor') {
        return res.status(400).json({ error: "Invalid signer role. Must be 'couple' or 'vendor'" });
      }

      // Check if contract exists
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Authorization check: verify user is authorized to sign for this role
      if (signerRole === 'couple') {
        // For couples: ensure the contract belongs to a wedding owned by this user
        const wedding = await storage.getWedding(contract.weddingId);
        if (!wedding || wedding.userId !== authReq.session.userId) {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a couple" });
        }
      } else if (signerRole === 'vendor') {
        // For vendors: ensure the contract is for a vendor owned by this user
        const user = await storage.getUserById(authReq.session.userId);
        if (!user || user.role !== 'vendor') {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a vendor" });
        }
        const vendor = await storage.getVendor(contract.vendorId);
        if (!vendor || vendor.userId !== authReq.session.userId) {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a vendor" });
        }
      }

      // Check if user has already signed this contract
      const alreadySigned = await storage.hasContractBeenSigned(contractId, authReq.session.userId);
      if (alreadySigned) {
        return res.status(400).json({ error: "You have already signed this contract" });
      }

      // Create signature
      const signaturePayload = insertContractSignatureSchema.parse({
        contractId,
        signerId: authReq.session.userId,
        signerName,
        signerEmail,
        signerRole,
        signatureData,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      const signature = await storage.createContractSignature(signaturePayload);

      // Update contract status to 'signed' if it was 'sent' or 'draft'
      if (contract.status === 'sent' || contract.status === 'draft') {
        await storage.updateContract(contractId, {
          status: 'signed',
          signedDate: new Date(),
        });
      }

      res.json(signature);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error('Error signing contract:', error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });

  // ============================================================================
  // MESSAGES - Couple-Vendor Communication
  // ============================================================================

  // Get messages for a conversation
  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getConversationMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all conversations for a wedding
  app.get("/api/conversations/wedding/:weddingId", async (req, res) => {
    try {
      const conversationIds = await storage.getConversationsByWedding(req.params.weddingId);
      
      // Enrich with vendor metadata using shared parser
      const conversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const vendor = await storage.getVendor(parsed.vendorId);
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            vendorCategory: vendor?.category || '',
          };
        })
      );
      
      res.json(conversations.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get all conversations for a vendor
  app.get("/api/conversations/vendor/:vendorId", async (req, res) => {
    try {
      const conversationIds = await storage.getConversationsByVendor(req.params.vendorId);
      
      // Enrich with wedding/vendor metadata using shared parser
      const conversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const vendor = await storage.getVendor(req.params.vendorId);
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            vendorCategory: vendor?.category || '',
          };
        })
      );
      
      res.json(conversations.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Get unread count for a conversation
  app.get("/api/messages/:conversationId/unread/:recipientType", async (req, res) => {
    try {
      const count = await storage.getUnreadCount(
        req.params.conversationId,
        req.params.recipientType as 'couple' | 'vendor'
      );
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ============================================================================
  // REVIEWS - Vendor rating and feedback system
  // ============================================================================

  // Get reviews for a vendor
  app.get("/api/reviews/vendor/:vendorId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByVendor(req.params.vendorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get reviews for a wedding
  app.get("/api/reviews/wedding/:weddingId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByWedding(req.params.weddingId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Create a new review
  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Validate vendor exists
      const vendor = await storage.getVendor(validatedData.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Check for duplicate review (same wedding + vendor)
      const existingReviews = await storage.getReviewsByWedding(validatedData.weddingId);
      const duplicate = existingReviews.find(r => r.vendorId === validatedData.vendorId);
      if (duplicate) {
        return res.status(400).json({ error: "You have already reviewed this vendor" });
      }
      
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Fetch Yelp reviews for a vendor
  app.get("/api/reviews/yelp/:vendorId", async (req, res) => {
    try {
      const apiKey = process.env.YELP_API_KEY;
      if (!apiKey) {
        return res.json({ reviews: [], source: "yelp", available: false, message: "Yelp API key not configured" });
      }

      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor || !vendor.yelpBusinessId) {
        return res.json({ reviews: [], source: "yelp", available: false });
      }

      const response = await fetch(`https://api.yelp.com/v3/businesses/${vendor.yelpBusinessId}/reviews`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({
        reviews: data.reviews || [],
        total: data.total || 0,
        source: "yelp",
        available: true,
      });
    } catch (error) {
      console.error("Error fetching Yelp reviews:", error);
      res.json({ reviews: [], source: "yelp", available: false, error: "Failed to fetch Yelp reviews" });
    }
  });

  // Fetch Google reviews for a vendor
  app.get("/api/reviews/google/:vendorId", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.json({ reviews: [], source: "google", available: false, message: "Google Places API key not configured" });
      }

      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor || !vendor.googlePlaceId) {
        return res.json({ reviews: [], source: "google", available: false });
      }

      const response = await fetch(`https://places.googleapis.com/v1/places/${vendor.googlePlaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'reviews,displayName,rating,userRatingCount',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({
        reviews: data.reviews || [],
        displayName: data.displayName?.text,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        source: "google",
        available: true,
      });
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.json({ reviews: [], source: "google", available: false, error: "Failed to fetch Google reviews" });
    }
  });

  // ============================================================================
  // PLAYLISTS - Music playlist collaboration for events
  // ============================================================================

  // Get playlists by wedding
  app.get("/api/playlists/wedding/:weddingId", async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByWedding(req.params.weddingId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // Get playlists by event
  app.get("/api/playlists/event/:eventId", async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByEvent(req.params.eventId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // Get a single playlist
  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  // Create a playlist
  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.json(playlist);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  // Update a playlist
  app.patch("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.updatePlaylist(req.params.id, req.body);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  // Delete a playlist
  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      const success = await storage.deletePlaylist(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // ============================================================================
  // PLAYLIST SONGS - Individual songs in playlists with voting
  // ============================================================================

  // Get songs by playlist
  app.get("/api/playlists/:playlistId/songs", async (req, res) => {
    try {
      const songs = await storage.getSongsByPlaylist(req.params.playlistId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  // Get a single song
  app.get("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.getPlaylistSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch song" });
    }
  });

  // Add a song to a playlist
  app.post("/api/songs", async (req, res) => {
    try {
      const validatedData = insertPlaylistSongSchema.parse(req.body);
      const song = await storage.createPlaylistSong(validatedData);
      res.json(song);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to add song" });
    }
  });

  // Update a song
  app.patch("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.updatePlaylistSong(req.params.id, req.body);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to update song" });
    }
  });

  // Delete a song
  app.delete("/api/songs/:id", async (req, res) => {
    try {
      const success = await storage.deletePlaylistSong(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete song" });
    }
  });

  // ============================================================================
  // SONG VOTES - Voting system for song requests
  // ============================================================================

  // Get votes for a song
  app.get("/api/songs/:songId/votes", async (req, res) => {
    try {
      const votes = await storage.getVotesBySong(req.params.songId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  // Vote for a song
  app.post("/api/votes", async (req, res) => {
    try {
      const validatedData = insertSongVoteSchema.parse(req.body);
      
      // Check if user already voted
      const hasVoted = await storage.hasUserVoted(validatedData.voterId, validatedData.songId);
      if (hasVoted) {
        return res.status(400).json({ error: "You have already voted for this song" });
      }
      
      const vote = await storage.createSongVote(validatedData);
      res.json(vote);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Remove a vote
  app.delete("/api/votes/:voterId/:songId", async (req, res) => {
    try {
      const success = await storage.deleteVote(req.params.voterId, req.params.songId);
      if (!success) {
        return res.status(404).json({ error: "Vote not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove vote" });
    }
  });

  // ============================================================================
  // DOCUMENTS - Contract and file storage
  // ============================================================================

  // Get documents by wedding
  app.get("/api/documents/wedding/:weddingId", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByWedding(req.params.weddingId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get documents by event
  app.get("/api/documents/event/:eventId", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByEvent(req.params.eventId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get a single document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Create a document (after file upload)
  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Update a document
  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============================================================================
  // OBJECT STORAGE - File upload and download from blueprint
  // ============================================================================

  // Get upload URL for file upload
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Download a document file
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Check if user has voted
  app.get("/api/votes/:voterId/:songId", async (req, res) => {
    try {
      const hasVoted = await storage.hasUserVoted(req.params.voterId, req.params.songId);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  // ============================================================================
  // BUDGET BENCHMARKS - Cultural spending benchmarks and analytics
  // ============================================================================

  // Get all budget benchmarks
  app.get("/api/budget-benchmarks", async (req, res) => {
    try {
      const benchmarks = await storage.getAllBudgetBenchmarks();
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget benchmarks" });
    }
  });

  // Get budget benchmarks for a city and tradition
  app.get("/api/budget-benchmarks/:city/:tradition", async (req, res) => {
    try {
      const benchmarks = await storage.getBudgetBenchmarks(
        req.params.city,
        req.params.tradition
      );
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget benchmarks" });
    }
  });

  // Get budget analytics for a wedding
  app.get("/api/budget-analytics/:weddingId", async (req, res) => {
    try {
      const wedding = await storage.getWedding(req.params.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      // Get benchmarks for this wedding's city and tradition (normalize city name)
      const normalizedCity = normalizeCityName(wedding.location);
      const benchmarks = await storage.getBudgetBenchmarks(
        normalizedCity,
        wedding.tradition
      );

      // Get actual budget categories for this wedding
      const budgetCategories = await storage.getBudgetCategoriesByWedding(req.params.weddingId);

      // Get vendors with price ranges for comparison
      const vendors = await storage.getAllVendors();
      const vendorsByCategory: Record<string, any[]> = {};
      vendors.forEach((vendor) => {
        if (!vendorsByCategory[vendor.category]) {
          vendorsByCategory[vendor.category] = [];
        }
        vendorsByCategory[vendor.category].push(vendor);
      });

      // Calculate analytics
      const analytics = {
        wedding: {
          city: wedding.location,
          tradition: wedding.tradition,
          totalBudget: wedding.totalBudget,
        },
        benchmarks: benchmarks.map((b) => ({
          category: b.category,
          averageSpend: b.averageSpend,
          minSpend: b.minSpend,
          maxSpend: b.maxSpend,
          percentageOfBudget: b.percentageOfBudget,
          sampleSize: b.sampleSize,
          description: b.description,
        })),
        currentBudget: budgetCategories.map((bc) => ({
          category: bc.category,
          allocated: bc.allocatedAmount,
          spent: bc.spentAmount,
          percentage: bc.percentage,
        })),
        vendorComparison: Object.keys(vendorsByCategory).map((category) => {
          const categoryVendors = vendorsByCategory[category];
          const priceRanges = {
            '$': categoryVendors.filter((v) => v.priceRange === '$').length,
            '$$': categoryVendors.filter((v) => v.priceRange === '$$').length,
            '$$$': categoryVendors.filter((v) => v.priceRange === '$$$').length,
            '$$$$': categoryVendors.filter((v) => v.priceRange === '$$$$').length,
          };
          const avgRating = categoryVendors.reduce((sum, v) => {
            const rating = v.rating ? parseFloat(v.rating) : 0;
            return sum + rating;
          }, 0) / categoryVendors.length || 0;

          return {
            category,
            vendorCount: categoryVendors.length,
            priceRangeDistribution: priceRanges,
            averageRating: avgRating.toFixed(1),
          };
        }),
        recommendations: generateBudgetRecommendations(
          wedding,
          benchmarks,
          budgetCategories
        ),
      };

      res.json(analytics);
    } catch (error) {
      console.error("Budget analytics error:", error);
      res.status(500).json({ error: "Failed to generate budget analytics" });
    }
  });

  // Create a budget benchmark (admin/seeding)
  app.post("/api/budget-benchmarks", async (req, res) => {
    try {
      const validatedData = insertBudgetBenchmarkSchema.parse(req.body);
      const benchmark = await storage.createBudgetBenchmark(validatedData);
      res.json(benchmark);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget benchmark" });
    }
  });

  // ============================================================================
  // WEDDING WEBSITES - Public guest website management
  // ============================================================================

  // Get wedding website for a wedding
  app.get("/api/wedding-websites/wedding/:weddingId", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteByWeddingId(req.params.weddingId);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding website" });
    }
  });

  // Get wedding website by slug (for public access)
  app.get("/api/wedding-websites/slug/:slug", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding website" });
    }
  });

  // Create wedding website
  app.post("/api/wedding-websites", async (req, res) => {
    try {
      const validatedData = insertWeddingWebsiteSchema.parse(req.body);
      const website = await storage.createWeddingWebsite(validatedData);
      res.json(website);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create wedding website" });
    }
  });

  // Update wedding website
  app.patch("/api/wedding-websites/:id", async (req, res) => {
    try {
      const validatedData = insertWeddingWebsiteSchema.partial().parse(req.body);
      const website = await storage.updateWeddingWebsite(req.params.id, validatedData);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }
      res.json(website);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update wedding website" });
    }
  });

  // Publish/unpublish wedding website
  app.patch("/api/wedding-websites/:id/publish", async (req, res) => {
    try {
      const { isPublished } = req.body;
      const website = await storage.updateWeddingWebsite(req.params.id, { isPublished });
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to update publish status" });
    }
  });

  // Get public wedding data by slug (for guest website)
  app.get("/api/public/wedding/:slug", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website || !website.isPublished) {
        return res.status(404).json({ error: "Wedding not found or not published" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const events = await storage.getEventsByWedding(website.weddingId);

      res.json({
        website,
        wedding,
        events: events.sort((a, b) => a.order - b.order),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding data" });
    }
  });

  // Update guest RSVP status (public endpoint)
  app.patch("/api/public/rsvp/:guestId", async (req, res) => {
    try {
      const { rsvpStatus } = req.body;
      if (!['confirmed', 'declined'].includes(rsvpStatus)) {
        return res.status(400).json({ error: "Invalid RSVP status" });
      }

      const guest = await storage.updateGuest(req.params.guestId, { rsvpStatus });
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }
      res.json(guest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update RSVP" });
    }
  });

  // ============================================================================
  // PHOTO GALLERIES
  // ============================================================================

  // Get all galleries for a wedding
  app.get("/api/galleries/wedding/:weddingId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByWedding(req.params.weddingId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  // Get all galleries for a vendor
  app.get("/api/galleries/vendor/:vendorId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByVendor(req.params.vendorId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor galleries" });
    }
  });

  // Get all galleries for an event
  app.get("/api/galleries/event/:eventId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByEvent(req.params.eventId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event galleries" });
    }
  });

  // Get galleries by type (inspiration, vendor_portfolio, event_photos)
  app.get("/api/galleries/type/:type", async (req, res) => {
    try {
      const type = req.params.type as 'inspiration' | 'vendor_portfolio' | 'event_photos';
      const galleries = await storage.getGalleriesByType(type);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch galleries by type" });
    }
  });

  // Get single gallery
  app.get("/api/galleries/:id", async (req, res) => {
    try {
      const gallery = await storage.getPhotoGallery(req.params.id);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      res.json(gallery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  // Create new gallery
  app.post("/api/galleries", async (req, res) => {
    try {
      const validatedData = insertPhotoGallerySchema.parse(req.body);
      const gallery = await storage.createPhotoGallery(validatedData);
      res.json(gallery);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create gallery" });
    }
  });

  // Update gallery
  app.patch("/api/galleries/:id", async (req, res) => {
    try {
      const validatedData = insertPhotoGallerySchema.partial().parse(req.body);
      const gallery = await storage.updatePhotoGallery(req.params.id, validatedData);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      res.json(gallery);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update gallery" });
    }
  });

  // Delete gallery
  app.delete("/api/galleries/:id", async (req, res) => {
    try {
      const success = await storage.deletePhotoGallery(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      res.json({ message: "Gallery deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gallery" });
    }
  });

  // ============================================================================
  // PHOTOS
  // ============================================================================

  // Get all photos in a gallery
  app.get("/api/photos/gallery/:galleryId", async (req, res) => {
    try {
      const photos = await storage.getPhotosByGallery(req.params.galleryId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Get single photo
  app.get("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo" });
    }
  });

  // Create new photo
  app.post("/api/photos", async (req, res) => {
    try {
      const validatedData = insertPhotoSchema.parse(req.body);
      const photo = await storage.createPhoto(validatedData);
      res.json(photo);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create photo" });
    }
  });

  // Update photo
  app.patch("/api/photos/:id", async (req, res) => {
    try {
      const validatedData = insertPhotoSchema.partial().parse(req.body);
      const photo = await storage.updatePhoto(req.params.id, validatedData);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update photo" });
    }
  });

  // Delete photo
  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const success = await storage.deletePhoto(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Photo not found" });
      }
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // ============================================================================
  // VENDOR AVAILABILITY
  // ============================================================================

  // Get all availability slots for a vendor
  app.get("/api/vendor-availability/vendor/:vendorId", async (req, res) => {
    try {
      const availability = await storage.getAvailabilityByVendor(req.params.vendorId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor availability" });
    }
  });

  // Get availability for a vendor within a date range
  app.get("/api/vendor-availability/vendor/:vendorId/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      const availability = await storage.getAvailabilityByVendorAndDateRange(
        req.params.vendorId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability by date range" });
    }
  });

  // Get availability for a vendor on a specific date
  app.get("/api/vendor-availability/vendor/:vendorId/date/:date", async (req, res) => {
    try {
      const availability = await storage.getAvailabilityByDate(
        req.params.vendorId,
        new Date(req.params.date)
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability for date" });
    }
  });

  // Check for booking conflicts
  app.post("/api/vendor-availability/check-conflicts", async (req, res) => {
    try {
      const { vendorId, date, timeSlot, excludeBookingId } = req.body;
      if (!vendorId || !date || !timeSlot) {
        return res.status(400).json({ error: "vendorId, date, and timeSlot are required" });
      }
      const hasConflicts = await storage.checkAvailabilityConflicts(
        vendorId,
        new Date(date),
        timeSlot,
        excludeBookingId
      );
      res.json({ hasConflicts });
    } catch (error) {
      res.status(500).json({ error: "Failed to check conflicts" });
    }
  });

  // Get single availability slot
  app.get("/api/vendor-availability/:id", async (req, res) => {
    try {
      const availability = await storage.getVendorAvailability(req.params.id);
      if (!availability) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability slot" });
    }
  });

  // Create new availability slot
  app.post("/api/vendor-availability", async (req, res) => {
    try {
      const validatedData = insertVendorAvailabilitySchema.parse(req.body);
      
      // Check for conflicts before creating
      const hasConflicts = await storage.checkAvailabilityConflicts(
        validatedData.vendorId,
        new Date(validatedData.date),
        validatedData.timeSlot || 'full_day',
        undefined
      );
      
      if (hasConflicts) {
        return res.status(409).json({ error: "Vendor is already booked for this time slot" });
      }
      
      const availability = await storage.createVendorAvailability(validatedData);
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create availability slot" });
    }
  });

  // Update availability slot
  app.patch("/api/vendor-availability/:id", async (req, res) => {
    try {
      const validatedData = insertVendorAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateVendorAvailability(req.params.id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update availability slot" });
    }
  });

  // Delete availability slot
  app.delete("/api/vendor-availability/:id", async (req, res) => {
    try {
      const success = await storage.deleteVendorAvailability(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json({ message: "Availability slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete availability slot" });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  // Vendor Analytics
  app.get("/api/analytics/vendor/:vendorId/summary", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const summary = await storage.getVendorAnalyticsSummary(vendorId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching vendor analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch vendor analytics" });
    }
  });

  app.get("/api/analytics/vendor/:vendorId/booking-trends", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      const trends = await storage.getVendorBookingTrends(
        vendorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(trends);
    } catch (error) {
      console.error("Error fetching vendor booking trends:", error);
      res.status(500).json({ error: "Failed to fetch booking trends" });
    }
  });

  app.get("/api/analytics/vendor/:vendorId/revenue-trends", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      const trends = await storage.getVendorRevenueTrends(
        vendorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(trends);
    } catch (error) {
      console.error("Error fetching vendor revenue trends:", error);
      res.status(500).json({ error: "Failed to fetch revenue trends" });
    }
  });

  // Couple/Wedding Analytics
  app.get("/api/analytics/wedding/:weddingId/summary", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const summary = await storage.getWeddingAnalyticsSummary(weddingId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching wedding analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch wedding analytics" });
    }
  });

  app.get("/api/analytics/wedding/:weddingId/budget-breakdown", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const breakdown = await storage.getWeddingBudgetBreakdown(weddingId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching wedding budget breakdown:", error);
      res.status(500).json({ error: "Failed to fetch budget breakdown" });
    }
  });

  app.get("/api/analytics/wedding/:weddingId/spending-trends", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const trends = await storage.getWeddingSpendingTrends(weddingId);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching wedding spending trends:", error);
      res.status(500).json({ error: "Failed to fetch spending trends" });
    }
  });

  // ============================================================================
  // Invitation Cards Routes
  // ============================================================================

  app.get("/api/invitation-cards", async (req, res) => {
    try {
      const { tradition, ceremony, featured } = req.query;
      
      let cards;
      if (featured === 'true') {
        cards = await storage.getFeaturedInvitationCards();
      } else if (tradition) {
        cards = await storage.getInvitationCardsByTradition(tradition as string);
      } else if (ceremony) {
        cards = await storage.getInvitationCardsByCeremony(ceremony as string);
      } else {
        cards = await storage.getAllInvitationCards();
      }
      
      res.json(cards);
    } catch (error) {
      console.error("Error fetching invitation cards:", error);
      res.status(500).json({ error: "Failed to fetch invitation cards" });
    }
  });

  app.get("/api/invitation-cards/:id", async (req, res) => {
    try {
      const card = await storage.getInvitationCard(req.params.id);
      if (!card) {
        return res.status(404).json({ error: "Invitation card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error fetching invitation card:", error);
      res.status(500).json({ error: "Failed to fetch invitation card" });
    }
  });

  // ============================================================================
  // Orders Routes
  // ============================================================================

  app.post("/api/orders", async (req, res) => {
    try {
      const { weddingId, userId, cartItems, shippingInfo } = req.body;
      
      // Validate required fields
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: "Cart items are required" });
      }
      
      if (!shippingInfo || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
        return res.status(400).json({ error: "Complete shipping information is required" });
      }
      
      // Validate cart items and calculate server-side total
      let totalAmount = 0;
      const validatedItems = [];
      
      for (const item of cartItems) {
        const card = await storage.getInvitationCard(item.cardId);
        if (!card) {
          return res.status(400).json({ error: `Invalid card ID: ${item.cardId}` });
        }
        
        if (!item.quantity || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid quantity" });
        }
        
        const price = parseFloat(card.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;
        
        validatedItems.push({
          cardId: card.id,
          quantity: item.quantity,
          pricePerItem: price.toFixed(2),
          subtotal: subtotal.toFixed(2),
        });
      }
      
      // Create order with server-calculated total
      const order = await storage.createOrder({
        weddingId: weddingId || '',
        userId: userId || '',
        totalAmount: totalAmount.toFixed(2),
        shippingName: shippingInfo.name,
        shippingEmail: shippingInfo.email,
        shippingPhone: shippingInfo.phone || '',
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingState: shippingInfo.state,
        shippingZip: shippingInfo.zip,
        shippingCountry: shippingInfo.country || 'USA',
      });
      
      // Create order items server-side using validated data - never trust client
      for (const item of validatedItems) {
        await storage.createOrderItem({
          orderId: order.id,
          cardId: item.cardId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          subtotal: item.subtotal,
        });
      }
      
      res.status(201).json({ order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get("/api/orders/wedding/:weddingId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByWedding(req.params.weddingId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching wedding orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  // Order items are created server-side in POST /api/orders - no separate endpoint needed

  // ============================================================================
  // Stripe Payment Integration - Referenced from blueprint:javascript_stripe
  // ============================================================================

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      
      // Load order from database to get server-calculated total
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Validate total amount can be parsed
      const totalAmount = parseFloat(order.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({ error: "Invalid order total amount" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      // Use server-calculated total from order - never trust client
      const amountInCents = Math.round(totalAmount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          orderId: order.id,
        },
      });
      
      // Update order with payment intent ID
      await storage.updateOrderPaymentInfo(
        orderId,
        paymentIntent.id,
        'pending'
      );
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhook handler for payment confirmation
  // Note: In production, this should use express.raw() middleware and verify webhook signatures
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-11-17.clover",
      });
      
      // For production, implement proper webhook signature verification
      // For now, we'll handle the event payload directly
      const event = req.body;
      
      // Handle payment intent succeeded
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;
        
        if (orderId) {
          // Load order to verify payment amount matches
          const order = await storage.getOrder(orderId);
          if (!order) {
            console.error(`Order ${orderId} not found for payment verification`);
            return res.status(404).json({ error: 'Order not found' });
          }
          
          // Convert order total to cents for comparison
          const expectedAmountInCents = Math.round(parseFloat(order.totalAmount) * 100);
          
          // Verify payment amount matches order total
          if (paymentIntent.amount !== expectedAmountInCents) {
            console.error(
              `SECURITY ALERT: Payment amount mismatch for order ${orderId}: ` +
              `expected ${expectedAmountInCents}, got ${paymentIntent.amount}`
            );
            
            // Mark order as failed to prevent fulfillment
            await storage.updateOrderPaymentInfo(
              orderId,
              paymentIntent.id,
              'failed'
            );
            
            // TODO: In production, trigger alerts/notifications to operations team
            return res.status(400).json({ 
              error: 'Payment amount mismatch detected - order marked as failed' 
            });
          }
          
          // Amount verified - mark order as paid
          await storage.updateOrderPaymentInfo(
            orderId,
            paymentIntent.id,
            'paid'
          );
          console.log(`Order ${orderId} marked as paid (verified ${paymentIntent.amount} cents)`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  app.post("/api/orders/:orderId/confirm-payment", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentIntentId, paymentStatus } = req.body;
      
      const order = await storage.updateOrderPaymentInfo(
        orderId,
        paymentIntentId,
        paymentStatus
      );
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // ============================================================================
  // MEASUREMENT PROFILES - Guest clothing measurements for South Asian attire
  // ============================================================================

  // Get measurement profile by guest ID
  app.get("/api/guests/:guestId/measurement-profile", async (req, res) => {
    const { guestId } = req.params;
    const profile = await storage.getMeasurementProfileByGuest(guestId);
    res.json(profile || null);
  });

  // Create measurement profile
  app.post("/api/measurement-profiles", async (req, res) => {
    try {
      const profileData = insertMeasurementProfileSchema.parse(req.body);
      const profile = await storage.createMeasurementProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update measurement profile
  app.patch("/api/measurement-profiles/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const updates = insertMeasurementProfileSchema.partial().parse(req.body);
      const profile = await storage.updateMeasurementProfile(id, updates);
      if (!profile) {
        return res.status(404).json({ error: "Measurement profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete measurement profile
  app.delete("/api/measurement-profiles/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteMeasurementProfile(id);
    if (!success) {
      return res.status(404).json({ error: "Measurement profile not found" });
    }
    res.status(204).send();
  });

  // ============================================================================
  // SHOPPING ORDER ITEMS - Track clothing/outfit purchases and alterations
  // ============================================================================

  // Get all shopping items for a wedding
  app.get("/api/weddings/:weddingId/shopping-items", async (req, res) => {
    const { weddingId } = req.params;
    const items = await storage.getShoppingOrderItemsByWedding(weddingId);
    res.json(items);
  });

  // Create shopping order item
  app.post("/api/shopping-items", async (req, res) => {
    try {
      const itemData = insertShoppingOrderItemSchema.parse(req.body);
      const item = await storage.createShoppingOrderItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update shopping order item
  app.patch("/api/shopping-items/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const updates = insertShoppingOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateShoppingOrderItem(id, updates);
      if (!item) {
        return res.status(404).json({ error: "Shopping item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete shopping order item
  app.delete("/api/shopping-items/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteShoppingOrderItem(id);
    if (!success) {
      return res.status(404).json({ error: "Shopping item not found" });
    }
    res.status(204).send();
  });

  // ============================================================================
  // GAP WINDOWS - Guest Concierge (managing gaps between events)
  // ============================================================================

  // Get all gap windows for a wedding
  app.get("/api/weddings/:weddingId/gap-windows", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const gapWindows = await storage.getGapWindowsByWedding(weddingId);
      
      // Get recommendations for each gap window
      const gapsWithRecommendations = await Promise.all(
        gapWindows.map(async (gap) => {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          return { ...gap, recommendations };
        })
      );
      
      res.json(gapsWithRecommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single gap window with recommendations
  app.get("/api/gap-windows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const gap = await storage.getGapWindow(id);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      const recommendations = await storage.getRecommendationsByGapWindow(id);
      res.json({ ...gap, recommendations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a gap window
  app.post("/api/gap-windows", async (req, res) => {
    try {
      const gapData = insertGapWindowSchema.parse(req.body);
      const gap = await storage.createGapWindow(gapData);
      res.status(201).json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a gap window
  app.patch("/api/gap-windows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertGapWindowSchema.partial().parse(req.body);
      const gap = await storage.updateGapWindow(id, updates);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a gap window
  app.delete("/api/gap-windows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGapWindow(id);
      if (!success) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activate/deactivate a gap window
  app.patch("/api/gap-windows/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const gap = await storage.activateGapWindow(id, isActive === true);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // GAP RECOMMENDATIONS - Places to visit during event gaps
  // ============================================================================

  // Get recommendations for a gap window
  app.get("/api/gap-windows/:gapWindowId/recommendations", async (req, res) => {
    try {
      const { gapWindowId } = req.params;
      const recommendations = await storage.getRecommendationsByGapWindow(gapWindowId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a recommendation
  app.post("/api/gap-recommendations", async (req, res) => {
    try {
      const recData = insertGapRecommendationSchema.parse(req.body);
      const rec = await storage.createGapRecommendation(recData);
      res.status(201).json(rec);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a recommendation
  app.patch("/api/gap-recommendations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertGapRecommendationSchema.partial().parse(req.body);
      const rec = await storage.updateGapRecommendation(id, updates);
      if (!rec) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.json(rec);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a recommendation
  app.delete("/api/gap-recommendations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGapRecommendation(id);
      if (!success) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // RITUAL STAGES - Live ceremony tracking
  // ============================================================================

  // Get all ritual stages for an event
  app.get("/api/events/:eventId/ritual-stages", async (req, res) => {
    try {
      const { eventId } = req.params;
      const stages = await storage.getRitualStagesByEvent(eventId);
      
      // Get latest update for each stage
      const stagesWithStatus = await Promise.all(
        stages.map(async (stage) => {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          return { 
            ...stage, 
            currentStatus: latestUpdate?.status || 'pending',
            lastMessage: latestUpdate?.message,
            delayMinutes: latestUpdate?.delayMinutes || 0
          };
        })
      );
      
      res.json(stagesWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single ritual stage with history
  app.get("/api/ritual-stages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await storage.getRitualStage(id);
      if (!stage) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      const updates = await storage.getRitualStageUpdates(id);
      res.json({ ...stage, updates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a ritual stage
  app.post("/api/ritual-stages", async (req, res) => {
    try {
      const stageData = insertRitualStageSchema.parse(req.body);
      const stage = await storage.createRitualStage(stageData);
      res.status(201).json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a ritual stage
  app.patch("/api/ritual-stages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertRitualStageSchema.partial().parse(req.body);
      const stage = await storage.updateRitualStage(id, updates);
      if (!stage) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a ritual stage
  app.delete("/api/ritual-stages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRitualStage(id);
      if (!success) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // RITUAL STAGE UPDATES - Live status updates
  // ============================================================================

  // Create a ritual stage update (triggers live update to guests)
  app.post("/api/ritual-stage-updates", async (req, res) => {
    try {
      const updateData = insertRitualStageUpdateSchema.parse(req.body);
      const update = await storage.createRitualStageUpdate(updateData);
      
      // TODO: Broadcast to connected clients via WebSocket
      
      res.status(201).json(update);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get update history for a ritual stage
  app.get("/api/ritual-stages/:id/updates", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getRitualStageUpdates(id);
      res.json(updates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST NOTIFICATIONS - Send notifications to guests
  // ============================================================================

  // Get all notifications for a wedding
  app.get("/api/weddings/:weddingId/guest-notifications", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const notifications = await storage.getNotificationsByWedding(weddingId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a notification
  app.post("/api/guest-notifications", async (req, res) => {
    try {
      const notificationData = insertGuestNotificationSchema.parse(req.body);
      const notification = await storage.createGuestNotification(notificationData);
      
      // TODO: Actually send notification via email/push
      
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // LIVE WEDDING STATUS - Real-time wedding state
  // ============================================================================

  // Get live status for a wedding
  app.get("/api/weddings/:weddingId/live-status", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const status = await storage.getLiveWeddingStatus(weddingId);
      const viewerCount = getViewerCount(weddingId);
      
      if (!status) {
        // Return default status if none exists
        return res.json({
          weddingId,
          isLive: false,
          currentEventId: null,
          currentStageId: null,
          currentGapId: null,
          lastBroadcastMessage: null,
          lastUpdatedAt: new Date(),
          viewerCount
        });
      }
      
      // If live, enrich with current event/stage details
      let enrichedStatus: any = { ...status, viewerCount };
      
      if (status.currentEventId) {
        const event = await storage.getEvent(status.currentEventId);
        enrichedStatus.currentEvent = event;
      }
      
      if (status.currentStageId) {
        const stage = await storage.getRitualStage(status.currentStageId);
        if (stage) {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          enrichedStatus.currentStage = {
            ...stage,
            currentStatus: latestUpdate?.status || 'pending',
            lastMessage: latestUpdate?.message,
            delayMinutes: latestUpdate?.delayMinutes || 0
          };
        }
      }
      
      if (status.currentGapId) {
        const gap = await storage.getGapWindow(status.currentGapId);
        if (gap) {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          enrichedStatus.currentGap = { ...gap, recommendations };
        }
      }
      
      res.json(enrichedStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Viewer heartbeat - guests call this periodically to register as active
  app.post("/api/public/weddings/:weddingId/viewer-heartbeat", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const viewerId = req.body.viewerId || req.headers['x-viewer-id'] as string;
      
      if (!viewerId) {
        return res.status(400).json({ error: "viewerId is required" });
      }
      
      activeViewers.set(viewerId, {
        viewerId,
        weddingId,
        lastHeartbeat: Date.now()
      });
      
      const viewerCount = getViewerCount(weddingId);
      res.json({ success: true, viewerCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get viewer count for a wedding (public endpoint)
  app.get("/api/public/weddings/:weddingId/viewer-count", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const viewerCount = getViewerCount(weddingId);
      res.json({ viewerCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update live wedding status
  app.patch("/api/weddings/:weddingId/live-status", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const statusData = insertLiveWeddingStatusSchema.partial().parse(req.body);
      
      // Ensure weddingId is set
      const status = await storage.createOrUpdateLiveWeddingStatus({
        weddingId,
        ...statusData
      });
      
      // Broadcast status change via WebSocket
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: 'status_update',
          data: status
        });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Toggle live mode on/off
  app.post("/api/weddings/:weddingId/go-live", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const { isLive, currentEventId, lastBroadcastMessage } = req.body;
      
      const status = await storage.createOrUpdateLiveWeddingStatus({
        weddingId,
        isLive: isLive === true,
        currentEventId: currentEventId || null,
        lastBroadcastMessage: lastBroadcastMessage || (isLive ? "Wedding is now live!" : "Wedding broadcast has ended.")
      });
      
      // Broadcast to connected guests via WebSocket
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: isLive ? 'went_live' : 'went_offline',
          data: status
        });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // PUBLIC GUEST PORTAL - Guest-facing endpoints (no auth required)
  // ============================================================================

  // Get public live feed for guests (read-only, minimal data)
  app.get("/api/public/weddings/:weddingId/live-feed", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const status = await storage.getLiveWeddingStatus(weddingId);
      
      if (!status || !status.isLive) {
        return res.json({
          isLive: false,
          message: "The wedding broadcast hasn't started yet. Check back soon!"
        });
      }
      
      // Build public-safe response
      const publicFeed: any = {
        isLive: true,
        lastUpdatedAt: status.lastUpdatedAt,
        lastBroadcastMessage: status.lastBroadcastMessage
      };
      
      // Include current event info if available
      if (status.currentEventId) {
        const event = await storage.getEvent(status.currentEventId);
        if (event) {
          publicFeed.currentEvent = {
            name: event.name,
            eventType: event.type,
            date: event.date,
            time: event.time,
            location: event.location
          };
        }
      }
      
      // Include current stage progress if available
      if (status.currentStageId) {
        const stage = await storage.getRitualStage(status.currentStageId);
        if (stage) {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          
          // Get all stages for this event to show progress
          const allStages = await storage.getRitualStagesByEvent(stage.eventId);
          const stagesWithStatus = await Promise.all(
            allStages.map(async (s) => {
              const update = await storage.getLatestRitualStageUpdate(s.id);
              return {
                id: s.id,
                displayName: s.displayName,
                description: s.description,
                displayOrder: s.displayOrder,
                guestInstructions: s.guestInstructions,
                status: update?.status || 'pending',
                delayMinutes: update?.delayMinutes || 0
              };
            })
          );
          
          publicFeed.ritualProgress = {
            currentStage: {
              displayName: stage.displayName,
              description: stage.description,
              guestInstructions: stage.guestInstructions,
              status: latestUpdate?.status || 'pending',
              message: latestUpdate?.message,
              delayMinutes: latestUpdate?.delayMinutes || 0
            },
            allStages: stagesWithStatus
          };
        }
      }
      
      // Include gap information if in a gap period
      if (status.currentGapId) {
        const gap = await storage.getGapWindow(status.currentGapId);
        if (gap) {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          publicFeed.currentGap = {
            label: gap.label,
            startTime: gap.startTime,
            endTime: gap.endTime,
            shuttleSchedule: gap.shuttleSchedule,
            specialInstructions: gap.specialInstructions,
            recommendations: recommendations.map(r => ({
              name: r.name,
              type: r.type,
              description: r.description,
              address: r.address,
              mapUrl: r.mapUrl,
              estimatedTravelTime: r.estimatedTravelTime,
              priceLevel: r.priceLevel,
              photoUrl: r.photoUrl
            }))
          };
        }
      }
      
      res.json(publicFeed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // WEDDING ROLES & COLLABORATORS - Role-based access control
  // ============================================================================

  // Get all roles for a wedding
  app.get("/api/weddings/:weddingId/roles", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Check if user has access to this wedding
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!isOwner && permissions.size === 0) {
        return res.status(403).json({ error: "You do not have access to this wedding" });
      }
      
      const roles = await storage.getWeddingRolesByWedding(weddingId);
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific role with permissions
  app.get("/api/roles/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRoleWithPermissions(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Check if user has access to this wedding
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, role.weddingId);
      if (!isOwner && permissions.size === 0) {
        return res.status(403).json({ error: "You do not have access to this wedding" });
      }
      
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new role
  app.post("/api/weddings/:weddingId/roles", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Only owners can create roles
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      // Support both object format {category: level} and array format [{category, level}]
      let permissionsArray: Array<{ category: string; level: string }> = [];
      if (req.body.permissions) {
        if (Array.isArray(req.body.permissions)) {
          permissionsArray = req.body.permissions;
        } else if (typeof req.body.permissions === 'object') {
          // Convert object format to array format, filtering out "none" permissions
          permissionsArray = Object.entries(req.body.permissions)
            .filter(([_, level]) => level !== "none")
            .map(([category, level]) => ({ category, level: level as string }));
        }
      }
      
      const roleData = insertWeddingRoleSchema.parse({
        weddingId,
        name: req.body.name,
        displayName: req.body.name, // Use name as displayName for custom roles
        description: req.body.description || null,
        isSystem: false,
        isOwner: false,
      });
      const role = await storage.createWeddingRole(roleData);
      
      // Set permissions if any were provided
      if (permissionsArray.length > 0) {
        await storage.setRolePermissions(role.id, permissionsArray as any);
      }
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "role_created",
        targetType: "role",
        targetId: role.id,
        details: { roleName: role.displayName },
      });
      
      res.status(201).json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a role
  app.patch("/api/roles/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Only owners can update roles
      const hasPermission = await storage.checkUserPermission(userId, role.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      // Cannot update system roles' core properties
      if (role.isSystem && (req.body.name || req.body.isOwner !== undefined)) {
        return res.status(400).json({ error: "Cannot modify system role core properties" });
      }
      
      const updatedRole = await storage.updateWeddingRole(roleId, req.body);
      
      // If permissions are provided, update them
      if (req.body.permissions && Array.isArray(req.body.permissions)) {
        await storage.setRolePermissions(roleId, req.body.permissions);
      }
      
      res.json(updatedRole);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a role
  app.delete("/api/roles/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Only owners can delete roles
      const hasPermission = await storage.checkUserPermission(userId, role.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      const success = await storage.deleteWeddingRole(roleId);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete system or owner roles" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all collaborators for a wedding
  app.get("/api/weddings/:weddingId/collaborators", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Check if user has access to this wedding
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!isOwner && !permissions.get("collaborators")) {
        return res.status(403).json({ error: "You do not have access to view collaborators" });
      }
      
      const collaborators = await storage.getCollaboratorsWithDetailsByWedding(weddingId);
      
      // Sanitize response to hide tokens
      const sanitized = collaborators.map(c => ({
        ...c,
        inviteToken: undefined,
        inviteTokenExpires: c.inviteTokenExpires ? c.inviteTokenExpires : undefined,
      }));
      
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invite a collaborator
  const inviteCollaboratorSchema = z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().optional(),
    roleId: z.string().min(1, "Role ID is required"),
  });

  app.post("/api/weddings/:weddingId/collaborators", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Validate request body with Zod
      const parseResult = inviteCollaboratorSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      const { email, name, roleId } = parseResult.data;
      
      // Only owners or those with manage collaborators permission can invite
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to invite collaborators" });
      }
      
      // Check if collaborator already exists
      const existing = await storage.getWeddingCollaboratorByEmail(weddingId, email);
      if (existing) {
        return res.status(400).json({ error: "This email has already been invited" });
      }
      
      // Verify the role exists and belongs to this wedding
      const role = await storage.getWeddingRole(roleId);
      if (!role || role.weddingId !== weddingId) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Don't allow assigning owner role to invitees
      if (role.isOwner) {
        return res.status(400).json({ error: "Cannot assign owner role to collaborators" });
      }
      
      // Create the collaborator with pending status
      const collaborator = await storage.createWeddingCollaborator({
        weddingId,
        email: email.toLowerCase(),
        name: name || null,
        roleId,
        invitedBy: userId,
        status: "pending",
      });
      
      // Generate invite token
      const inviteToken = await storage.generateCollaboratorInviteToken(collaborator.id);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "invited",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email, roleName: role.displayName },
      });
      
      // Get wedding details for email
      const wedding = await storage.getWedding(weddingId);
      
      res.status(201).json({
        ...collaborator,
        inviteToken, // Return the raw token so it can be used to construct invite URL
        inviteUrl: `/accept-invite?token=${inviteToken}`,
        weddingTitle: wedding?.title || "Wedding",
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Accept collaborator invite (public endpoint)
  app.post("/api/collaborator-invites/:token", async (req, res) => {
    const { token } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Please log in to accept this invitation" });
    }
    
    try {
      const collaborator = await storage.acceptCollaboratorInvite(token, userId);
      
      if (!collaborator) {
        return res.status(400).json({ error: "Invalid or expired invitation" });
      }
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "accepted_invite",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      res.json({ success: true, weddingId: collaborator.weddingId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get invite details by token (public endpoint for preview)
  app.get("/api/collaborator-invites/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
      const collaborator = await storage.getWeddingCollaboratorByToken(token);
      
      if (!collaborator) {
        return res.status(404).json({ error: "Invalid or expired invitation" });
      }
      
      const wedding = await storage.getWedding(collaborator.weddingId);
      const role = await storage.getWeddingRole(collaborator.roleId);
      
      res.json({
        email: collaborator.email,
        name: collaborator.name,
        roleName: role?.displayName,
        weddingTitle: wedding?.title,
        partnerNames: wedding ? `${wedding.partner1Name} & ${wedding.partner2Name}` : undefined,
        expiresAt: collaborator.inviteTokenExpires,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update collaborator (change role, etc.)
  app.patch("/api/collaborators/:collaboratorId", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      // Only owners or those with manage collaborators permission can update
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      // If changing role, verify the new role exists and is valid
      if (req.body.roleId) {
        const role = await storage.getWeddingRole(req.body.roleId);
        if (!role || role.weddingId !== collaborator.weddingId) {
          return res.status(400).json({ error: "Invalid role" });
        }
        if (role.isOwner) {
          return res.status(400).json({ error: "Cannot assign owner role to collaborators" });
        }
      }
      
      const updated = await storage.updateWeddingCollaborator(collaboratorId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Remove collaborator
  app.delete("/api/collaborators/:collaboratorId", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      // Only owners or those with manage collaborators permission can remove
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      // Log activity before deletion
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "removed",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      await storage.deleteWeddingCollaborator(collaboratorId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resend collaborator invite
  app.post("/api/collaborators/:collaboratorId/resend-invite", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      if (collaborator.status !== "pending") {
        return res.status(400).json({ error: "Can only resend invites for pending collaborators" });
      }
      
      // Only owners or those with manage collaborators permission can resend
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      // Generate new invite token
      const inviteToken = await storage.generateCollaboratorInviteToken(collaboratorId);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "invite_resent",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      const wedding = await storage.getWedding(collaborator.weddingId);
      
      res.json({
        success: true,
        inviteToken,
        inviteUrl: `/accept-invite?token=${inviteToken}`,
        weddingTitle: wedding?.title || "Wedding",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get collaborator activity log
  app.get("/api/weddings/:weddingId/collaborator-activity", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Only owners or those with view collaborators permission can view activity
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "view");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to view collaborator activity" });
      }
      
      const activity = await storage.getCollaboratorActivityLog(weddingId, limit);
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's permissions for a wedding
  app.get("/api/weddings/:weddingId/my-permissions", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      
      // Convert Map to object for JSON serialization
      const permissionsObject: Record<string, string> = {};
      permissions.forEach((level, category) => {
        permissionsObject[category] = level;
      });
      
      res.json({
        isOwner,
        permissions: permissionsObject,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize default roles for a wedding (called during wedding creation or on-demand)
  app.post("/api/weddings/:weddingId/initialize-roles", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Only the wedding owner can initialize roles
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== userId) {
        return res.status(403).json({ error: "Only the wedding owner can initialize roles" });
      }
      
      // Check if roles already exist
      const existingRoles = await storage.getWeddingRolesByWedding(weddingId);
      if (existingRoles.length > 0) {
        return res.status(400).json({ error: "Roles already initialized for this wedding" });
      }
      
      const roles = await storage.createDefaultRolesForWedding(weddingId);
      
      // Log activity for each role created
      for (const role of roles) {
        await storage.logCollaboratorActivity({
          weddingId,
          collaboratorId: null,
          userId,
          action: "role_created",
          targetType: "role",
          targetId: role.id,
          details: { roleName: role.displayName },
        });
      }
      
      res.status(201).json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get weddings user collaborates on
  app.get("/api/my-collaborations", async (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const weddings = await storage.getWeddingsByCollaboratorUser(userId);
      res.json(weddings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST SOURCES - Track who submitted each guest
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-sources", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weddings/:weddingId/guest-sources/stats", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const stats = await storage.getGuestSourceStats(weddingId);
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      
      const enrichedStats = stats.map(stat => {
        const source = sources.find(s => s.id === stat.sourceId);
        return {
          ...stat,
          source,
        };
      });
      
      res.json(enrichedStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/guest-sources", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestSourceSchema.parse({
        ...req.body,
        weddingId,
      });
      const source = await storage.createGuestSource(validatedData);
      res.status(201).json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/guest-sources/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const source = await storage.updateGuestSource(req.params.id, req.body);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guest-sources/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const deleted = await storage.deleteGuestSource(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST SUGGESTIONS - Collaborators suggest guests for approval
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-suggestions", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const status = req.query.status as string | undefined;
      const suggestions = await storage.getGuestSuggestionsByWedding(weddingId, status);
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weddings/:weddingId/guest-suggestions/count", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const count = await storage.getPendingSuggestionsCount(weddingId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/guest-suggestions", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestSuggestionSchema.parse({
        ...req.body,
        weddingId,
        suggestedBy: userId,
        status: "pending",
      });
      const suggestion = await storage.createGuestSuggestion(validatedData);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_created",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName },
      });
      
      res.status(201).json(suggestion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/guest-suggestions/:id/approve", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const result = await storage.approveSuggestion(req.params.id, userId);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_approved",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guest-suggestions/:id/reject", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const { reason } = req.body;
      const result = await storage.rejectSuggestion(req.params.id, userId, reason);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_rejected",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName, reason },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST LIST SCENARIOS - What-if planning playground
  // ============================================================================

  app.get("/api/weddings/:weddingId/scenarios", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const scenarios = await storage.getGuestListScenariosByWedding(weddingId);
      res.json(scenarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scenarios/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.getGuestListScenarioWithStats(req.params.id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/scenarios", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestListScenarioSchema.parse({
        ...req.body,
        weddingId,
        createdBy: userId,
      });
      const scenario = await storage.createGuestListScenario(validatedData);
      
      // Optionally copy all current households to new scenario
      if (req.body.copyCurrentHouseholds) {
        await storage.copyAllHouseholdsToScenario(scenario.id, weddingId);
      }
      
      const withStats = await storage.getGuestListScenarioWithStats(scenario.id);
      res.status(201).json(withStats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/scenarios/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.updateGuestListScenario(req.params.id, req.body);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      const withStats = await storage.getGuestListScenarioWithStats(scenario.id);
      res.json(withStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scenarios/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const deleted = await storage.deleteGuestListScenario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scenarios/:id/duplicate", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const newScenario = await storage.duplicateScenario(req.params.id, name, userId);
      const withStats = await storage.getGuestListScenarioWithStats(newScenario.id);
      res.status(201).json(withStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scenarios/:id/set-active", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.getGuestListScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      const result = await storage.setActiveScenario(scenario.weddingId, req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scenarios/:id/promote", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const success = await storage.promoteScenarioToMain(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scenario Households
  app.get("/api/scenarios/:scenarioId/households", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const households = await storage.getScenarioHouseholds(req.params.scenarioId);
      res.json(households);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scenarios/:scenarioId/households", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { householdId, adjustedMaxCount } = req.body;
      if (!householdId) {
        return res.status(400).json({ error: "Household ID is required" });
      }
      const result = await storage.addHouseholdToScenario(req.params.scenarioId, householdId, adjustedMaxCount);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scenarios/:scenarioId/households/:householdId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { scenarioId, householdId } = req.params;
      const removed = await storage.removeHouseholdFromScenario(scenarioId, householdId);
      if (!removed) {
        return res.status(404).json({ error: "Household not found in scenario" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST BUDGET SETTINGS - Cost per head and capacity planning
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-budget", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const settings = await storage.getGuestBudgetSettings(weddingId);
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json({ settings, capacity });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/guest-budget", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestBudgetSettingsSchema.parse({
        ...req.body,
        weddingId,
      });
      const settings = await storage.createOrUpdateGuestBudgetSettings(validatedData);
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json({ settings, capacity });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/weddings/:weddingId/guest-budget/capacity", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json(capacity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // CUT LIST - Track removed guests with reasons and restore capability
  // ============================================================================

  app.get("/api/weddings/:weddingId/cut-list", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const cutList = await storage.getCutListByWedding(weddingId);
      res.json(cutList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/cut-list", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertCutListItemSchema.parse({
        ...req.body,
        weddingId,
        cutBy: userId,
      });
      const cutItem = await storage.addToCutList(validatedData);
      
      // Log activity
      const household = await storage.getHousehold(validatedData.householdId);
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "guest_cut",
        targetType: "household",
        targetId: validatedData.householdId,
        details: { householdName: household?.name, reason: validatedData.cutReason },
      });
      
      res.status(201).json(cutItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cut-list/:id/restore", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const cutItem = await storage.getCutListItem(req.params.id);
      if (!cutItem) {
        return res.status(404).json({ error: "Cut list item not found" });
      }
      
      const household = await storage.restoreFromCutList(req.params.id, userId);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: cutItem.weddingId,
        collaboratorId: null,
        userId,
        action: "guest_restored",
        targetType: "household",
        targetId: household.id,
        details: { householdName: household.name },
      });
      
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cut-list/:id/permanent", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const cutItem = await storage.getCutListItem(req.params.id);
      if (!cutItem) {
        return res.status(404).json({ error: "Cut list item not found" });
      }
      
      const household = await storage.getHousehold(cutItem.householdId);
      const deleted = await storage.permanentlyDeleteFromCutList(req.params.id);
      
      if (deleted) {
        await storage.logCollaboratorActivity({
          weddingId: cutItem.weddingId,
          collaboratorId: null,
          userId,
          action: "guest_deleted",
          targetType: "household",
          targetId: cutItem.householdId,
          details: { householdName: household?.name },
        });
      }
      
      res.json({ success: deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/cut-list/bulk-by-priority", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const { priorityTier, reason } = req.body;
      
      if (!priorityTier) {
        return res.status(400).json({ error: "Priority tier is required" });
      }
      
      const count = await storage.bulkCutByPriority(weddingId, priorityTier, userId, reason);
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "bulk_cut",
        targetType: "wedding",
        targetId: weddingId,
        details: { priorityTier, count, reason },
      });
      
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // HOUSEHOLD PRIORITY & SOURCE UPDATES
  // ============================================================================

  app.patch("/api/households/:id/priority", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { priorityTier, sourceId } = req.body;
      const household = await storage.updateHousehold(req.params.id, {
        priorityTier,
        sourceId,
      });
      
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // ============================================================================
  // WEBSOCKET SERVER - Real-time updates for guests
  // ============================================================================
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live-feed' });
  
  const weddingConnections = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const weddingId = url.searchParams.get('weddingId');
    
    if (!weddingId) {
      ws.close(1008, 'weddingId required');
      return;
    }
    
    if (!weddingConnections.has(weddingId)) {
      weddingConnections.set(weddingId, new Set());
    }
    weddingConnections.get(weddingId)!.add(ws);
    
    ws.on('close', () => {
      weddingConnections.get(weddingId)?.delete(ws);
      if (weddingConnections.get(weddingId)?.size === 0) {
        weddingConnections.delete(weddingId);
      }
    });
    
    ws.send(JSON.stringify({ type: 'connected', weddingId }));
  });
  
  (global as any).broadcastToWedding = (weddingId: string, data: any) => {
    const connections = weddingConnections.get(weddingId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };
  
  return httpServer;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Normalize city names to match benchmark data
function normalizeCityName(location: string): string {
  const cityMap: Record<string, string> = {
    'San Francisco': 'San Francisco Bay Area',
    'San Francisco, CA': 'San Francisco Bay Area',
    'SF': 'San Francisco Bay Area',
    'Bay Area': 'San Francisco Bay Area',
    'San Francisco Bay Area': 'San Francisco Bay Area',
    'New York': 'New York City',
    'NYC': 'New York City',
    'New York, NY': 'New York City',
    'New York City': 'New York City',
    'LA': 'Los Angeles',
    'Los Angeles, CA': 'Los Angeles',
    'Los Angeles': 'Los Angeles',
    'Chicago, IL': 'Chicago',
    'Chicago': 'Chicago',
    'Seattle, WA': 'Seattle',
    'Seattle': 'Seattle',
  };

  // Try exact match first
  if (cityMap[location]) {
    return cityMap[location];
  }

  // Try case-insensitive partial match
  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(cityMap)) {
    if (lowerLocation.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to original if no match
  return location;
}

function generateBudgetRecommendations(
  wedding: any,
  benchmarks: any[],
  budgetCategories: any[]
): string[] {
  const recommendations: string[] = [];
  const totalBudget = wedding.totalBudget ? parseFloat(wedding.totalBudget) : 0;

  if (totalBudget === 0) {
    return ["Set a total budget to receive personalized recommendations"];
  }

  // Compare current allocations to benchmarks
  budgetCategories.forEach((bc) => {
    const benchmark = benchmarks.find((b) => b.category === bc.category);
    if (benchmark) {
      const allocated = parseFloat(bc.allocatedAmount);
      const avg = parseFloat(benchmark.averageSpend);
      const min = parseFloat(benchmark.minSpend);
      const max = parseFloat(benchmark.maxSpend);

      if (allocated < min) {
        recommendations.push(
          `Consider increasing ${bc.category} budget: You've allocated $${allocated.toLocaleString()}, but the minimum typical spend in ${wedding.location} is $${min.toLocaleString()}`
        );
      } else if (allocated > max) {
        recommendations.push(
          `${bc.category} budget is above average: You've allocated $${allocated.toLocaleString()}, while the typical maximum is $${max.toLocaleString()}. Consider if this aligns with your priorities.`
        );
      } else if (allocated < avg * 0.8) {
        recommendations.push(
          `${bc.category} allocation is below average: You've budgeted $${allocated.toLocaleString()} vs average of $${avg.toLocaleString()}`
        );
      }
    }
  });

  // Check for missing important categories
  const essentialCategories = ['Catering', 'Venue', 'Photography', 'DJ'];
  essentialCategories.forEach((cat) => {
    const hasCategory = budgetCategories.some((bc) => bc.category === cat);
    if (!hasCategory) {
      const benchmark = benchmarks.find((b) => b.category === cat);
      if (benchmark) {
        recommendations.push(
          `Add ${cat} to your budget: Average spend in ${wedding.location} is $${parseFloat(benchmark.averageSpend).toLocaleString()}`
        );
      }
    }
  });

  // Check total allocation vs total budget
  const totalAllocated = budgetCategories.reduce(
    (sum, bc) => sum + parseFloat(bc.allocatedAmount),
    0
  );

  if (totalAllocated < totalBudget * 0.8) {
    recommendations.push(
      `You've only allocated $${totalAllocated.toLocaleString()} of your $${totalBudget.toLocaleString()} budget. Consider planning for additional categories.`
    );
  } else if (totalAllocated > totalBudget) {
    recommendations.push(
      `⚠️ Budget alert: You've allocated $${totalAllocated.toLocaleString()}, which exceeds your total budget of $${totalBudget.toLocaleString()} by $${(totalAllocated - totalBudget).toLocaleString()}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `✅ Your budget allocation looks well-balanced compared to ${wedding.tradition} wedding benchmarks in ${wedding.location}!`
    );
  }

  return recommendations;
}
