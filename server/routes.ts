import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage as defaultStorage, parseConversationId, generateConversationId, type IStorage } from "./storage";
import { registerAuthRoutes } from "./auth-routes";
import { getTasksForTradition, calculateDueDate } from "./task-templates";
import { requireAuth, requireRole, type AuthRequest } from "./auth-middleware";
import {
  insertWeddingSchema,
  insertEventSchema,
  insertEventCostItemSchema,
  insertVendorSchema,
  insertServicePackageSchema,
  insertBookingSchema,
  insertBudgetCategorySchema,
  insertHouseholdSchema,
  insertGuestSchema,
  insertInvitationSchema,
  insertTaskSchema,
  insertContractSchema,
  insertMessageSchema,
  insertQuickReplyTemplateSchema,
  insertFollowUpReminderSchema,
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
  insertVendorTeammateInvitationSchema,
  insertExpenseSchema,
  VENDOR_TEAMMATE_PERMISSIONS,
  insertVendorLeadSchema,
  insertLeadNurtureSequenceSchema,
  insertLeadNurtureStepSchema,
  insertLeadActivityLogSchema,
  type VendorLead,
} from "@shared/schema";
import { seedVendors, seedBudgetBenchmarks } from "./seed-data";
import {
  sendBookingConfirmationEmail,
  sendVendorNotificationEmail,
  sendRsvpConfirmationEmail,
  sendInvitationEmail,
} from "./email";
import {
  draftContract,
  reviewContract,
  chatWithPlanner,
  generateContractClause,
  suggestContractImprovements,
  generateVendorReplySuggestions,
  generateCoupleMessageSuggestions,
  type ContractDraftRequest,
  type ContractReviewRequest,
  type ChatMessage,
  type WeddingContext,
  type VendorReplySuggestionRequest,
  type CoupleMessageSuggestionRequest,
} from "./ai/gemini";

// Flag to track if seeding has been done for default storage
let defaultStorageSeeded = false;

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

export async function registerRoutes(app: Express, injectedStorage?: IStorage): Promise<Server> {
  const storage = injectedStorage || defaultStorage;
  
  // Seed vendors and budget benchmarks if using default storage and not already seeded
  if (!injectedStorage && !defaultStorageSeeded) {
    const existingVendors = await storage.getAllVendors();
    if (existingVendors.length === 0) {
      await seedVendors(storage);
    }
    
    const existingBenchmarks = await storage.getAllBudgetBenchmarks();
    if (existingBenchmarks.length === 0) {
      await seedBudgetBenchmarks(storage);
    }
    defaultStorageSeeded = true;
  }
  
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
      
      const [ownedWeddings, collaboratorWeddings] = await Promise.all([
        storage.getWeddingsByUser(authReq.session.userId),
        storage.getWeddingsForCollaborator(authReq.session.userId),
      ]);
      
      // Combine and deduplicate by ID
      const weddingMap = new Map();
      [...ownedWeddings, ...collaboratorWeddings].forEach((w) => {
        weddingMap.set(w.id, w);
      });
      
      res.json(Array.from(weddingMap.values()));
    } catch (error) {
      console.error("Error fetching weddings:", error);
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
      // Transform the data before updating
      const updateData: any = { ...req.body };
      
      // Convert weddingDate string to Date if provided
      if (updateData.weddingDate && typeof updateData.weddingDate === 'string') {
        updateData.weddingDate = new Date(updateData.weddingDate);
      }
      
      // Ensure guestCountEstimate is a number if provided
      if (updateData.guestCountEstimate !== undefined) {
        updateData.guestCountEstimate = typeof updateData.guestCountEstimate === 'string' 
          ? parseInt(updateData.guestCountEstimate) 
          : updateData.guestCountEstimate;
      }
      
      const wedding = await storage.updateWedding(req.params.id, updateData);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json(wedding);
    } catch (error) {
      console.error("Failed to update wedding:", error);
      res.status(500).json({ error: "Failed to update wedding" });
    }
  });

  app.post("/api/weddings", async (req, res) => {
    try {
      const validatedData = insertWeddingSchema.parse(req.body);
      const wedding = await storage.createWedding(validatedData);

      // Import ceremony catalog for lookups
      const { CEREMONY_CATALOG } = await import("../shared/ceremonies");

      // Check if customEvents were provided from onboarding
      const customEvents = req.body.customEvents as Array<{
        ceremonyId: string;
        customName?: string;
        guestCount?: string;
      }> | undefined;

      if (customEvents && customEvents.length > 0) {
        // Create events from customEvents with guest counts
        for (let i = 0; i < customEvents.length; i++) {
          const customEvent = customEvents[i];
          const ceremony = CEREMONY_CATALOG.find(c => c.id === customEvent.ceremonyId);
          
          // Determine event name and description
          let eventName: string;
          let eventDescription: string;
          let eventType: string;
          
          if (customEvent.ceremonyId === "custom" && customEvent.customName) {
            eventName = customEvent.customName;
            eventDescription = "Custom event";
            eventType = "other";
          } else if (ceremony) {
            eventName = ceremony.name;
            eventDescription = ceremony.description;
            eventType = customEvent.ceremonyId.replace(/^(hindu_|sikh_|muslim_|gujarati_|south_indian_)/, "");
          } else {
            continue; // Skip invalid ceremony IDs
          }
          
          // Parse guest count
          const guestCount = customEvent.guestCount && customEvent.guestCount !== "" 
            ? parseInt(customEvent.guestCount) 
            : (ceremony?.defaultGuests || undefined);
          
          await storage.createEvent({
            weddingId: wedding.id,
            name: eventName,
            type: eventType as any,
            description: eventDescription,
            order: i + 1,
            guestCount: guestCount,
          });
        }
      } else if (wedding.tradition === "sikh") {
        // Fallback to hardcoded events if no customEvents provided
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

      // Auto-create tradition-specific tasks
      if (wedding.tradition) {
        const taskTemplates = getTasksForTradition(wedding.tradition);
        
        for (const template of taskTemplates) {
          let dueDate: Date | undefined = undefined;
          
          // Calculate due date if wedding date is provided
          if (wedding.weddingDate && template.daysBeforeWedding) {
            dueDate = calculateDueDate(new Date(wedding.weddingDate), template.daysBeforeWedding);
          }
          
          await storage.createTask({
            weddingId: wedding.id,
            title: template.task,
            description: template.description,
            category: template.category,
            priority: template.priority || 'medium',
            dueDate: dueDate,
            phase: template.phase,
            completed: false,
            isAiRecommended: true,
            aiCategory: template.ceremony || template.category,
            aiReason: `Auto-generated task for ${wedding.tradition} wedding tradition`,
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
      const updateData = { ...req.body };
      // Convert date string to Date object if present
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }
      const event = await storage.updateEvent(req.params.id, updateData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event", details: error instanceof Error ? error.message : String(error) });
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
  // EVENT COST ITEMS - Granular cost breakdown per event
  // ============================================================================

  app.get("/api/events/:eventId/cost-items", async (req, res) => {
    try {
      const costItems = await storage.getEventCostItemsByEvent(req.params.eventId);
      res.json(costItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event cost items" });
    }
  });

  app.post("/api/events/:eventId/cost-items", async (req, res) => {
    try {
      // Verify event exists
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const validatedData = insertEventCostItemSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const costItem = await storage.createEventCostItem(validatedData);
      res.json(costItem);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create event cost item" });
    }
  });

  app.patch("/api/event-cost-items/:id", async (req, res) => {
    try {
      const costItem = await storage.updateEventCostItem(req.params.id, req.body);
      if (!costItem) {
        return res.status(404).json({ error: "Event cost item not found" });
      }
      res.json(costItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event cost item" });
    }
  });

  app.delete("/api/event-cost-items/:id", async (req, res) => {
    try {
      const success = await storage.deleteEventCostItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event cost item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event cost item" });
    }
  });

  // Get aggregated costs by category for a wedding (funneled up from all events)
  app.get("/api/weddings/:weddingId/cost-summary", async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      // Get all events for this wedding
      const events = await storage.getEventsByWedding(weddingId);
      
      // Get all cost items for all events
      const allCostItems: Array<{ eventId: string; eventName: string; categoryId: string | null; name: string; costType: string; amount: string; guestCount: number | null }> = [];
      
      for (const event of events) {
        const costItems = await storage.getEventCostItemsByEvent(event.id);
        costItems.forEach(item => {
          allCostItems.push({
            eventId: event.id,
            eventName: event.name,
            categoryId: item.categoryId,
            name: item.name,
            costType: item.costType,
            amount: item.amount,
            guestCount: event.guestCount,
          });
        });
      }
      
      // Aggregate by category
      const categoryTotals: Record<string, { fixed: number; perHead: number; total: number; items: typeof allCostItems }> = {};
      let grandTotalFixed = 0;
      let grandTotalPerHead = 0;
      
      for (const item of allCostItems) {
        const catId = item.categoryId || 'uncategorized';
        if (!categoryTotals[catId]) {
          categoryTotals[catId] = { fixed: 0, perHead: 0, total: 0, items: [] };
        }
        
        const amount = parseFloat(item.amount) || 0;
        if (item.costType === 'fixed') {
          categoryTotals[catId].fixed += amount;
          grandTotalFixed += amount;
        } else {
          // Per head costs - multiply by guest count
          const guestCount = item.guestCount || 0;
          const totalCost = amount * guestCount;
          categoryTotals[catId].perHead += totalCost;
          grandTotalPerHead += totalCost;
        }
        categoryTotals[catId].items.push(item);
      }
      
      // Calculate totals
      Object.keys(categoryTotals).forEach(catId => {
        categoryTotals[catId].total = categoryTotals[catId].fixed + categoryTotals[catId].perHead;
      });
      
      res.json({
        categories: categoryTotals,
        grandTotal: grandTotalFixed + grandTotalPerHead,
        grandTotalFixed,
        grandTotalPerHead,
        eventCount: events.length,
        itemCount: allCostItems.length,
      });
    } catch (error) {
      console.error("Error fetching cost summary:", error);
      res.status(500).json({ error: "Failed to fetch cost summary" });
    }
  });

  // ============================================================================
  // VENDORS
  // ============================================================================

  app.get("/api/vendors", async (req, res) => {
    try {
      const { category, location, includeUnpublished, includeAllApproval } = req.query;

      let vendors = await storage.getAllVendors();

      // Only show approved vendors in directory unless admin explicitly requests all
      if (includeAllApproval !== "true") {
        vendors = vendors.filter((v) => v.approvalStatus === 'approved');
      }

      // Only show published vendors unless explicitly requesting unpublished (for admin/vendor use)
      if (includeUnpublished !== "true") {
        vendors = vendors.filter((v) => v.isPublished === true);
      }

      if (category && typeof category === "string") {
        vendors = vendors.filter((v) => v.categories?.includes(category));
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

  // Get the current user's vendor profile
  app.get("/api/vendors/me", async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.session.userId);
      
      if (!userVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      res.json(userVendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor profile" });
    }
  });

  // Search for unclaimed vendor profiles (public - for claim your business page)
  // NOTE: This must be BEFORE /api/vendors/:id to avoid "unclaimed" being matched as an ID
  app.get("/api/vendors/unclaimed", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (!search || typeof search !== "string" || search.length < 2) {
        return res.json([]);
      }
      
      const allVendors = await storage.getAllVendors();
      
      // Filter to only unclaimed vendors that:
      // 1. Are not claimed
      // 2. Have contact info (email or phone) so they can actually be claimed
      // 3. Match the search query
      const unclaimedVendors = allVendors.filter(v => {
        if (v.claimed !== false) return false;
        if (!v.email && !v.phone) return false; // Must have contact info
        
        const searchLower = search.toLowerCase();
        const categoryMatch = v.categories?.some(cat => cat.toLowerCase().includes(searchLower)) || false;
        return (
          v.name.toLowerCase().includes(searchLower) ||
          v.location.toLowerCase().includes(searchLower) ||
          categoryMatch
        );
      });
      
      // Return limited results for performance, sanitize sensitive data
      const sanitizedVendors = unclaimedVendors.slice(0, 20).map(v => ({
        ...v,
        // Mask sensitive contact info for public display
        email: v.email ? v.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
        phone: v.phone ? v.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) ***-$3") : null,
      }));
      
      res.json(sanitizedVendors);
    } catch (error) {
      console.error("Error searching unclaimed vendors:", error);
      res.status(500).json({ error: "Failed to search vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Track view count for all vendors
      await storage.incrementVendorViewCount(req.params.id);
      
      // For unclaimed ghost profiles, check if we should send a claim notification
      if (!vendor.claimed && vendor.phone && !vendor.optedOutOfNotifications) {
        const now = new Date();
        const cooldownUntil = vendor.notifyCooldownUntil ? new Date(vendor.notifyCooldownUntil) : null;
        
        // Only send notification if cooldown has passed (72 hours between notifications)
        if (!cooldownUntil || now > cooldownUntil) {
          // Queue claim notification (non-blocking)
          storage.queueClaimNotification(req.params.id).catch(err => {
            console.error("Failed to queue claim notification:", err);
          });
        }
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  // ============================================================================
  // GHOST PROFILE / CLAIM YOUR PROFILE
  // ============================================================================

  // Admin: Get all unclaimed vendors for management
  // Protected - only accessible to authenticated couple users (platform operators)
  app.get("/api/admin/vendors/unclaimed", async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Verify user is a couple (platform operator role)
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== "couple") {
        return res.status(403).json({ error: "Access denied. Admin features are for platform operators only." });
      }
      
      const allVendors = await storage.getAllVendors();
      const unclaimedVendors = allVendors.filter(v => v.claimed === false);
      
      res.json(unclaimedVendors);
    } catch (error) {
      console.error("Error fetching unclaimed vendors:", error);
      res.status(500).json({ error: "Failed to fetch unclaimed vendors" });
    }
  });

  // Admin: Manually send claim invitation to a vendor
  // Protected - only accessible to authenticated couple users (platform operators)
  app.post("/api/admin/vendors/:id/send-claim-invitation", async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Verify user is a couple (platform operator role)
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== "couple") {
        return res.status(403).json({ error: "Access denied. Admin features are for platform operators only." });
      }
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        return res.status(400).json({ error: "This profile has already been claimed" });
      }
      
      if (!vendor.email && !vendor.phone) {
        return res.status(400).json({ error: "Vendor has no email or phone to send invitation to" });
      }
      
      // Generate claim token
      const claimToken = crypto.randomUUID();
      const claimTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
      
      await storage.updateVendor(req.params.id, {
        claimToken,
        claimTokenExpires,
      });
      
      // Build claim link
      const claimLink = `${req.protocol}://${req.get('host')}/claim-profile/${claimToken}`;
      
      // Send claim email if email exists
      if (vendor.email) {
        try {
          await storage.sendClaimEmail(vendor.id, vendor.email, vendor.name, claimLink);
        } catch (err) {
          console.error("Failed to send claim email:", err);
        }
      }
      
      res.json({ 
        success: true,
        message: `Claim invitation sent to ${vendor.email || vendor.phone}`,
        claimLink: process.env.NODE_ENV === 'development' ? claimLink : undefined,
      });
    } catch (error) {
      console.error("Error sending claim invitation:", error);
      res.status(500).json({ error: "Failed to send claim invitation" });
    }
  });

  // Seed vendors from Google Places API (admin only)
  app.post("/api/admin/seed-google-places", async (req, res) => {
    try {
      const { region, category, apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Google Places API key is required" });
      }
      
      if (!region || !category) {
        return res.status(400).json({ error: "Region and category are required" });
      }
      
      // Build search query for Indian wedding vendors
      const searchQueries = [
        `Indian ${category} ${region}`,
        `South Asian ${category} ${region}`,
        `Desi ${category} ${region}`,
      ];
      
      const results: any[] = [];
      
      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
          );
          const data = await response.json();
          
          if (data.results) {
            results.push(...data.results);
          }
        } catch (err) {
          console.error(`Failed to search: ${query}`, err);
        }
      }
      
      // Deduplicate by place_id
      const uniquePlaces = new Map();
      for (const place of results) {
        if (!uniquePlaces.has(place.place_id)) {
          uniquePlaces.set(place.place_id, place);
        }
      }
      
      // Create ghost profiles
      const created: any[] = [];
      const skipped: any[] = [];
      
      for (const place of uniquePlaces.values()) {
        // Check if vendor with this placeId already exists
        const existing = await storage.getVendorByGooglePlaceId(place.place_id);
        if (existing) {
          skipped.push({ name: place.name, reason: "Already exists" });
          continue;
        }
        
        // Get place details for phone number
        let phone = null;
        let website = null;
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${apiKey}`
          );
          const detailsData = await detailsResponse.json();
          phone = detailsData.result?.formatted_phone_number || null;
          website = detailsData.result?.website || null;
        } catch (err) {
          console.error(`Failed to get details for ${place.name}`, err);
        }
        
        // Map category to our vendor categories
        const categoryMapping: Record<string, string> = {
          'dj': 'DJ & Music',
          'photographer': 'Photography',
          'videographer': 'Photography',
          'caterer': 'Catering',
          'decorator': 'Decor & Rentals',
          'florist': 'Florist',
          'makeup': 'Makeup Artist',
          'mehndi': 'Mehndi Artist',
          'venue': 'Venues',
          'planner': 'Event Planning',
        };
        
        const mappedCategory = categoryMapping[category.toLowerCase()] || category;
        
        // Create ghost profile
        const vendor = await storage.createVendor({
          name: place.name,
          category: mappedCategory,
          categories: [category.toLowerCase() as any],
          location: place.formatted_address || region,
          city: region,
          priceRange: '$$',
          phone: phone,
          website: website,
          googlePlaceId: place.place_id,
          rating: place.rating?.toString() || null,
          claimed: false,
          source: 'google_places',
          isPublished: true,
          description: `${place.name} - Indian wedding ${category} serving ${region}. Contact us to learn more about our services.`,
        });
        
        created.push({ name: place.name, id: vendor.id });
      }
      
      res.json({
        message: `Seeded ${created.length} vendors, skipped ${skipped.length}`,
        created,
        skipped,
      });
    } catch (error) {
      console.error("Error seeding from Google Places:", error);
      res.status(500).json({ error: "Failed to seed vendors from Google Places" });
    }
  });

  // Request to claim a vendor profile (email verification only)
  app.post("/api/vendors/:id/request-claim", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        return res.status(400).json({ error: "This profile has already been claimed" });
      }
      
      // If vendor has an email on file, use email verification flow
      if (vendor.email) {
        // Generate claim token
        const claimToken = crypto.randomUUID();
        const claimTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
        
        await storage.updateVendor(req.params.id, {
          claimToken,
          claimTokenExpires,
        } as any);
        
        // Send claim email
        const claimLink = `${req.protocol}://${req.get('host')}/claim-profile?token=${claimToken}`;
        
        try {
          await storage.sendClaimEmail(vendor.id, vendor.email, vendor.name, claimLink);
        } catch (err) {
          console.error("Failed to send claim email:", err);
        }
        
        return res.json({
          message: "Claim request sent. Check your email for verification instructions.",
          requiresEmail: false,
          // Only include claimLink in development for testing
          ...(process.env.NODE_ENV === 'development' && { claimLink }),
        });
      }
      
      // No email on file - require claimant to provide their email for admin review
      const { claimantEmail, claimantName, claimantPhone, notes } = req.body;
      
      if (!claimantEmail) {
        return res.status(400).json({ 
          error: "This vendor has no email on file. Please provide your business email for verification.",
          requiresEmail: true
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(claimantEmail)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
      }
      
      // Check if there's already a pending claim for this vendor
      const existingClaims = await storage.getVendorClaimStagingByVendor(req.params.id);
      const pendingClaim = existingClaims.find(c => c.status === 'pending');
      if (pendingClaim) {
        return res.status(400).json({ 
          error: "There is already a pending claim for this vendor. Please wait for admin review." 
        });
      }
      
      // Create staging entry for admin review
      await storage.createVendorClaimStaging({
        vendorId: req.params.id,
        vendorName: vendor.name,
        vendorCategories: vendor.categories,
        vendorLocation: vendor.location,
        vendorCity: vendor.city,
        claimantEmail,
        claimantName: claimantName || null,
        claimantPhone: claimantPhone || null,
        notes: notes || null,
      });
      
      res.json({
        message: "Claim request submitted for admin review. We'll contact you at the provided email once verified.",
        requiresEmail: false,
        pendingAdminReview: true,
      });
    } catch (error) {
      console.error("Error requesting claim:", error);
      res.status(500).json({ error: "Failed to request profile claim" });
    }
  });

  // GET: Verify claim token and return vendor info (for claim page)
  app.get("/api/vendors/claim/verify", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ error: "Claim token is required", valid: false });
      }
      
      // Find vendor by claim token
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token", valid: false });
      }
      
      // Check if token has expired
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired", valid: false, expired: true });
      }
      
      // Return vendor info for the claim form
      res.json({
        valid: true,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          categories: vendor.categories,
          location: vendor.location,
          phone: vendor.phone,
          website: vendor.website,
          description: vendor.description,
          priceRange: vendor.priceRange,
        },
      });
    } catch (error) {
      console.error("Error verifying claim token:", error);
      res.status(500).json({ error: "Failed to verify claim token", valid: false });
    }
  });

  // POST: Complete profile claim with account creation
  app.post("/api/vendors/claim/complete", async (req, res) => {
    try {
      const { token, email, password, phone, description, website, priceRange } = req.body;
      
      if (!token || !email || !password) {
        return res.status(400).json({ error: "Token, email, and password are required" });
      }
      
      // Find vendor by claim token
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token" });
      }
      
      // Check if token has expired
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired. Please request a new one." });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use. Please login instead." });
      }
      
      // Create new user account
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        email,
        passwordHash,
        role: 'vendor',
        emailVerified: true, // Auto-verify since they're claiming via token
      });
      
      // Mark profile as claimed and update info
      await storage.updateVendor(vendor.id, {
        claimed: true,
        userId: newUser.id,
        claimToken: null,
        claimTokenExpires: null,
        email: email,
        phone: phone || vendor.phone,
        description: description || vendor.description,
        website: website || vendor.website,
        priceRange: priceRange || vendor.priceRange,
      } as any);
      
      res.json({
        message: "Profile claimed successfully! You can now login to manage your profile.",
        vendorId: vendor.id,
      });
    } catch (error) {
      console.error("Error completing claim:", error);
      res.status(500).json({ error: "Failed to complete claim" });
    }
  });

  // Legacy: Verify claim token and complete profile claim (deprecated, use /claim/complete)
  app.post("/api/vendors/claim/verify", async (req, res) => {
    try {
      const { token, email, password } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Claim token is required" });
      }
      
      // Find vendor by claim token
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token" });
      }
      
      // Check if token has expired
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired. Please request a new one." });
      }
      
      // Create vendor user account if email and password provided
      let userId = vendor.userId;
      if (email && password) {
        // Check if email already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use. Please login instead." });
        }
        
        // Create new user account
        const bcrypt = await import('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await storage.createUser({
          email,
          passwordHash,
          role: 'vendor',
          emailVerified: true, // Auto-verify since they're claiming via token
        });
        userId = newUser.id;
      }
      
      // Mark profile as claimed
      await storage.updateVendor(vendor.id, {
        claimed: true,
        userId: userId,
        claimToken: null,
        claimTokenExpires: null,
        email: email || vendor.email,
      } as any);
      
      res.json({
        message: "Profile claimed successfully! You can now login to manage your profile.",
        vendorId: vendor.id,
      });
    } catch (error) {
      console.error("Error verifying claim:", error);
      res.status(500).json({ error: "Failed to verify claim" });
    }
  });

  // Opt out of claim notifications
  app.post("/api/vendors/:id/opt-out", async (req, res) => {
    try {
      const { token } = req.body;
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Verify opt-out is legitimate (token from email or direct request)
      await storage.updateVendor(req.params.id, {
        optedOutOfNotifications: true,
      } as any);
      
      res.json({ message: "You have been opted out of future notifications." });
    } catch (error) {
      console.error("Error opting out:", error);
      res.status(500).json({ error: "Failed to opt out" });
    }
  });

  // ============================================================================
  // ADMIN: Vendor Claim Staging Management
  // ============================================================================

  // GET: List all pending vendor claims (admin only)
  app.get("/api/admin/vendor-claims", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const claims = await storage.getAllPendingVendorClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching pending claims:", error);
      res.status(500).json({ error: "Failed to fetch pending claims" });
    }
  });

  // GET: Get single claim details (admin only)
  app.get("/api/admin/vendor-claims/:id", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      // Also fetch the original vendor info
      const vendor = await storage.getVendor(claim.vendorId);
      
      res.json({ claim, vendor });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // POST: Approve a vendor claim (admin only)
  app.post("/api/admin/vendor-claims/:id/approve", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { adminNotes } = req.body;
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ error: "This claim has already been processed" });
      }
      
      // Get the vendor
      const vendor = await storage.getVendor(claim.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        // Mark claim as denied since vendor already claimed
        await storage.updateVendorClaimStaging(req.params.id, {
          status: 'denied',
          adminNotes: adminNotes || 'Vendor was already claimed by another user',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        });
        return res.status(400).json({ error: "This vendor has already been claimed" });
      }
      
      // Update vendor with claimant's email and generate claim token
      const claimToken = crypto.randomUUID();
      const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await storage.updateVendor(claim.vendorId, {
        email: claim.claimantEmail,
        claimToken,
        claimTokenExpires,
      } as any);
      
      // Send claim email to claimant
      const claimLink = `${req.protocol}://${req.get('host')}/claim-profile?token=${claimToken}`;
      try {
        await storage.sendClaimEmail(vendor.id, claim.claimantEmail, vendor.name, claimLink);
      } catch (err) {
        console.error("Failed to send claim approval email:", err);
      }
      
      // Update claim status
      await storage.updateVendorClaimStaging(req.params.id, {
        status: 'approved',
        adminNotes: adminNotes || null,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });
      
      res.json({ 
        message: "Claim approved! A verification link has been sent to the claimant.",
        claimLink: process.env.NODE_ENV === 'development' ? claimLink : undefined,
      });
    } catch (error) {
      console.error("Error approving claim:", error);
      res.status(500).json({ error: "Failed to approve claim" });
    }
  });

  // POST: Deny a vendor claim (admin only)
  app.post("/api/admin/vendor-claims/:id/deny", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { adminNotes } = req.body;
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ error: "This claim has already been processed" });
      }
      
      // Update claim status
      await storage.updateVendorClaimStaging(req.params.id, {
        status: 'denied',
        adminNotes: adminNotes || null,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });
      
      res.json({ message: "Claim denied." });
    } catch (error) {
      console.error("Error denying claim:", error);
      res.status(500).json({ error: "Failed to deny claim" });
    }
  });

  // ============================================================================
  // ADMIN: Vendor Approval Management
  // ============================================================================

  // GET: List all vendors pending approval (admin only)
  app.get("/api/admin/vendors/pending-approval", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const vendors = await storage.getPendingApprovalVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching pending approval vendors:", error);
      res.status(500).json({ error: "Failed to fetch pending approval vendors" });
    }
  });

  // POST: Approve a vendor (admin only)
  app.post("/api/admin/vendors/:id/approve", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { notes } = req.body;
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const updatedVendor = await storage.approveVendor(req.params.id, req.user.id, notes);
      res.json({ message: "Vendor approved!", vendor: updatedVendor });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ error: "Failed to approve vendor" });
    }
  });

  // POST: Reject a vendor (admin only)
  app.post("/api/admin/vendors/:id/reject", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { notes } = req.body;
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const updatedVendor = await storage.rejectVendor(req.params.id, req.user.id, notes);
      res.json({ message: "Vendor rejected.", vendor: updatedVendor });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ error: "Failed to reject vendor" });
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
      // For PATCH updates, allow more flexible validation since seeded vendors may have
      // legacy category names. We validate basic types but don't enforce strict enum values.
      const updateData: any = { ...req.body };
      
      // Ensure categories is an array if provided (don't validate enum values strictly)
      if (updateData.categories !== undefined) {
        if (!Array.isArray(updateData.categories)) {
          return res.status(400).json({ error: "Categories must be an array" });
        }
      }
      
      // Sync preferredWeddingTraditions to culturalSpecialties for filtering
      if (updateData.preferredWeddingTraditions) {
        updateData.culturalSpecialties = updateData.preferredWeddingTraditions;
      }
      
      // Validate priceRange if provided
      if (updateData.priceRange && !['$', '$$', '$$$', '$$$$'].includes(updateData.priceRange)) {
        return res.status(400).json({ error: "Invalid price range" });
      }
      
      const vendor = await storage.updateVendor(req.params.id, updateData);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  // ============================================================================
  // QUOTE REQUESTS
  // ============================================================================

  app.post("/api/vendors/:vendorId/quote-request", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const { vendorId } = req.params;
      const { 
        weddingId,
        eventId,
        eventName,
        eventDate,
        eventLocation,
        guestCount,
        budgetRange,
        additionalNotes,
      } = req.body;

      if (!weddingId || !eventId || !eventName) {
        return res.status(400).json({ error: "Wedding ID, event ID, and event name are required" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      if (!vendor.email) {
        return res.status(400).json({ error: "Vendor does not have an email address configured" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = req.user;
      if (!user?.email) {
        return res.status(400).json({ error: "User email is required to send quote request" });
      }

      const senderName = user.email.split('@')[0];
      const weddingTitle = wedding.title || `${wedding.partner1Name} & ${wedding.partner2Name || 'Partner'}'s Wedding`;

      // Log the quote request details being sent
      console.log('=== QUOTE REQUEST DETAILS ===');
      console.log('To Vendor:', vendor.name, `(${vendor.email})`);
      console.log('From:', senderName, `(${user.email})`);
      console.log('Wedding:', weddingTitle);
      console.log('Event:', eventName);
      console.log('Event Date:', eventDate || 'Not specified');
      console.log('Event Location:', eventLocation || 'Not specified');
      console.log('Guest Count:', guestCount || 'Not specified');
      console.log('Budget Range:', budgetRange || 'Not specified');
      console.log('Additional Notes:', additionalNotes || 'None');
      console.log('=============================');

      const quoteRequest = await storage.createQuoteRequest({
        weddingId,
        vendorId,
        eventId,
        senderEmail: user.email,
        senderName,
        eventName,
        eventDate: eventDate || null,
        eventLocation: eventLocation || null,
        guestCount: guestCount || null,
        budgetRange: budgetRange || null,
        additionalNotes: additionalNotes || null,
      });

      try {
        const { sendQuoteRequestEmail } = await import('./email');
        await sendQuoteRequestEmail({
          to: vendor.email,
          vendorName: vendor.name,
          senderName,
          senderEmail: user.email,
          eventName,
          eventDate,
          eventLocation,
          guestCount,
          budgetRange,
          additionalNotes,
          weddingTitle,
        });
      } catch (emailError) {
        console.error('Failed to send quote request email:', emailError);
      }

      res.json({ 
        message: "Quote request sent successfully",
        quoteRequest 
      });
    } catch (error) {
      console.error("Error sending quote request:", error);
      res.status(500).json({ error: "Failed to send quote request" });
    }
  });

  app.get("/api/quote-requests/wedding/:weddingId", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const quoteRequests = await storage.getQuoteRequestsByWedding(req.params.weddingId);
      res.json(quoteRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  // ============================================================================
  // SERVICE PACKAGES
  // ============================================================================

  app.get("/api/service-packages/vendor/:vendorId", async (req, res) => {
    try {
      const packages = await storage.getServicePackagesByVendor(req.params.vendorId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service packages" });
    }
  });

  app.get("/api/service-packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getServicePackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service package" });
    }
  });

  app.post("/api/service-packages", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertServicePackageSchema.parse(req.body);
      
      // Verify the user owns the vendor they're creating a package for
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create packages for your own vendor profile" });
      }
      
      const pkg = await storage.createServicePackage(validatedData);
      res.json(pkg);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create service package" });
    }
  });

  app.patch("/api/service-packages/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertServicePackageSchema.partial().parse(req.body);
      
      // Get the package to verify ownership
      const existingPkg = await storage.getServicePackage(req.params.id);
      if (!existingPkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      
      // Verify the user owns the vendor
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existingPkg.vendorId) {
        return res.status(403).json({ error: "You can only update your own packages" });
      }
      
      const pkg = await storage.updateServicePackage(req.params.id, validatedData);
      res.json(pkg);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update service package" });
    }
  });

  app.delete("/api/service-packages/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      // Get the package to verify ownership
      const existingPkg = await storage.getServicePackage(req.params.id);
      if (!existingPkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      
      // Verify the user owns the vendor
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existingPkg.vendorId) {
        return res.status(403).json({ error: "You can only delete your own packages" });
      }
      
      const success = await storage.deleteServicePackage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service package not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service package" });
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
    // Require authentication for booking creation
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Verify user has access to this wedding (owner or collaborator)
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const user = await storage.getUser(userId);
      const isOwner = wedding.userId === userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(validatedData.weddingId, user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied to this wedding" });
      }
      
      // Log the booking request details
      const vendor = await storage.getVendor(validatedData.vendorId);
      const event = validatedData.eventId ? await storage.getEvent(validatedData.eventId) : null;
      
      console.log('=== BOOKING REQUEST DETAILS ===');
      console.log('To Vendor:', vendor?.name || 'Unknown', vendor?.email ? `(${vendor.email})` : '');
      console.log('Wedding:', wedding?.partner1Name && wedding?.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
        : wedding?.title || 'Unknown');
      console.log('Event:', event?.name || 'No specific event');
      console.log('Event Date:', event?.date ? new Date(event.date).toLocaleDateString() : 'Not specified');
      console.log('Event Time:', event?.time || 'Not specified');
      console.log('Event Location:', event?.location || 'Not specified');
      console.log('Guest Count:', event?.guestCount || 'Not specified');
      console.log('Couple Notes:', validatedData.coupleNotes || 'None');
      console.log('Status:', validatedData.status);
      console.log('================================');
      
      const booking = await storage.createBooking(validatedData);
      
      // Create a system message in the event-specific conversation thread
      if (wedding && vendor) {
        const eventName = event?.name || 'General Inquiry';
        const coupleName = wedding.partner1Name && wedding.partner2Name 
          ? `${wedding.partner1Name} & ${wedding.partner2Name}`
          : wedding.partner1Name || wedding.partner2Name || 'The Couple';
        
        const systemMessageContent = `📩 **Booking Request Sent**\n\n${coupleName} has requested a booking for **${eventName}**${event?.date ? ` on ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.\n\n${validatedData.coupleNotes ? `**Notes from couple:**\n${validatedData.coupleNotes}` : ''}`;
        
        await storage.createMessage({
          weddingId: booking.weddingId,
          vendorId: booking.vendorId,
          eventId: booking.eventId || null,
          bookingId: booking.id,
          senderId: 'system',
          senderType: 'system',
          content: systemMessageContent,
          messageType: 'booking_request',
          attachments: null,
        });

        // Automatically create a lead for this booking request
        try {
          // Calculate lead scores based on available info
          let urgencyScore = 50;
          let budgetFitScore = 50;
          let qualificationScore = 25;

          if (event?.date) {
            const eventDate = new Date(event.date);
            const now = new Date();
            const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilEvent > 0 && daysUntilEvent <= 30) urgencyScore = 100;
            else if (daysUntilEvent <= 90) urgencyScore = 85;
            else if (daysUntilEvent <= 180) urgencyScore = 70;
            else if (daysUntilEvent <= 365) urgencyScore = 50;
            else urgencyScore = 30;
            qualificationScore += 25;
          }

          if (wedding.totalBudget) {
            const budget = parseFloat(wedding.totalBudget);
            if (budget >= 50000) budgetFitScore = 100;
            else if (budget >= 30000) budgetFitScore = 85;
            else if (budget >= 20000) budgetFitScore = 70;
            else if (budget >= 10000) budgetFitScore = 50;
            else budgetFitScore = 30;
            qualificationScore += 25;
          }

          if (event?.guestCount) qualificationScore += 25;

          const overallScore = Math.round((urgencyScore * 0.4) + (budgetFitScore * 0.3) + (qualificationScore * 0.3));
          let priority: 'hot' | 'warm' | 'medium' | 'cold' = 'medium';
          if (overallScore >= 80) priority = 'hot';
          else if (overallScore >= 60) priority = 'warm';
          else if (overallScore >= 40) priority = 'medium';
          else priority = 'cold';

          await storage.createVendorLead({
            vendorId: vendor.id,
            weddingId: wedding.id,
            bookingId: booking.id,
            coupleName,
            coupleEmail: wedding.coupleEmail || undefined,
            couplePhone: undefined,
            sourceType: 'booking_request',
            status: 'new',
            priority,
            eventDate: event?.date ? new Date(event.date) : undefined,
            estimatedBudget: wedding.totalBudget ? `$${parseFloat(wedding.totalBudget).toLocaleString()}` : undefined,
            guestCount: event?.guestCount || undefined,
            tradition: wedding.tradition || undefined,
            city: wedding.location || undefined,
            notes: validatedData.coupleNotes || undefined,
            urgencyScore,
            budgetFitScore,
            engagementScore: 50,
            qualificationScore,
            overallScore,
          });

          console.log(`Lead created for vendor ${vendor.name} from booking request`);
        } catch (leadError) {
          console.error('Failed to create lead from booking:', leadError);
          // Don't fail the booking if lead creation fails
        }
      }
      
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
              vendorCategory: vendor.categories?.[0] || 'vendor',
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

  app.patch("/api/bookings/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const existingBooking = await storage.getBooking(req.params.id);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Only vendors can update booking status (accept/decline)
      // Couples can only add notes, not change status
      if (authReq.user?.role === 'vendor') {
        // Verify vendor owns this booking
        const vendors = await storage.getAllVendors();
        const userVendor = vendors.find((v: Vendor) => v.userId === authReq.user?.id);
        if (!userVendor || userVendor.id !== existingBooking.vendorId) {
          return res.status(403).json({ error: "You can only update bookings for your own vendor profile" });
        }
      } else if (authReq.user?.role === 'couple') {
        // Couples can only update notes, not status
        const allowedFields = ['notes', 'coupleNotes'];
        const updateFields = Object.keys(req.body);
        const hasDisallowedFields = updateFields.some(f => !allowedFields.includes(f));
        if (hasDisallowedFields) {
          return res.status(403).json({ error: "Couples can only update notes, not booking status" });
        }
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const booking = await storage.updateBooking(req.params.id, req.body);
      
      // Create system message for status changes
      if (booking && req.body.status && req.body.status !== existingBooking.status) {
        const vendor = await storage.getVendor(booking.vendorId);
        const event = booking.eventId ? await storage.getEvent(booking.eventId) : null;
        
        let messageContent = '';
        let messageType: 'booking_confirmed' | 'booking_declined' | 'status_update' = 'status_update';
        
        if (req.body.status === 'confirmed') {
          messageType = 'booking_confirmed';
          messageContent = `✅ **Booking Confirmed**\n\n${vendor?.name || 'The vendor'} has confirmed the booking request for **${event?.name || 'your event'}**.${req.body.vendorNotes ? `\n\n**Vendor notes:**\n${req.body.vendorNotes}` : ''}`;
          
          // Auto-complete related tasks when vendor is booked
          if (vendor && vendor.categories) {
            try {
              const tasks = await storage.getTasksByWedding(booking.weddingId);
              const vendorCategories = vendor.categories.map((c: string) => c.toLowerCase());
              
              // Find incomplete tasks that match vendor categories
              for (const task of tasks) {
                if (task.completed) continue;
                
                const taskTitle = task.title.toLowerCase();
                const taskCategory = (task.category || '').toLowerCase();
                
                // Check if task relates to this vendor's category
                const matchesCategory = vendorCategories.some((vc: string) => {
                  // Direct category match
                  if (taskCategory.includes(vc) || vc.includes(taskCategory)) return true;
                  
                  // Title contains "book" and vendor category
                  if (taskTitle.includes('book') && (taskTitle.includes(vc) || vc.includes(taskTitle.split(' ').pop() || ''))) return true;
                  
                  // Common mappings
                  const categoryMappings: Record<string, string[]> = {
                    'photography': ['photographer', 'photo', 'photography'],
                    'videography': ['videographer', 'video', 'videography'],
                    'catering': ['caterer', 'catering', 'food'],
                    'florist': ['florist', 'flowers', 'floral', 'decor'],
                    'decorator': ['decorator', 'decor', 'decoration', 'mandap'],
                    'dj': ['dj', 'music', 'entertainment', 'dhol'],
                    'venue': ['venue', 'hall', 'banquet', 'temple', 'gurdwara', 'church'],
                    'makeup': ['makeup', 'hair', 'mehndi', 'henna', 'beauty'],
                    'officiant': ['priest', 'pandit', 'officiant', 'granthi', 'ragi'],
                    'attire': ['attire', 'lehenga', 'sherwani', 'dress', 'clothing'],
                    'jewelry': ['jewelry', 'jewellery'],
                    'invitation': ['invitation', 'stationery', 'cards'],
                    'transportation': ['transport', 'baraat', 'car', 'limo'],
                    'cake': ['cake', 'bakery', 'dessert'],
                    'band': ['band', 'orchestra', 'kirtan', 'sangeet'],
                  };
                  
                  for (const [key, aliases] of Object.entries(categoryMappings)) {
                    if (aliases.some(a => vc.includes(a) || a.includes(vc))) {
                      if (aliases.some(a => taskTitle.includes(a) || taskCategory.includes(a))) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                });
                
                if (matchesCategory) {
                  await storage.updateTask(task.id, { 
                    completed: true, 
                    completedAt: new Date() 
                  });
                  console.log(`Auto-completed task "${task.title}" after booking vendor ${vendor.name}`);
                }
              }
            } catch (taskError) {
              console.error("Error auto-completing tasks:", taskError);
              // Don't fail the booking if task completion fails
            }
          }
        } else if (req.body.status === 'declined') {
          messageType = 'booking_declined';
          messageContent = `❌ **Booking Declined**\n\n${vendor?.name || 'The vendor'} has declined the booking request for **${event?.name || 'your event'}**.${req.body.vendorNotes ? `\n\n**Vendor notes:**\n${req.body.vendorNotes}` : ''}`;
        }
        
        if (messageContent) {
          await storage.createMessage({
            weddingId: booking.weddingId,
            vendorId: booking.vendorId,
            eventId: booking.eventId || null,
            bookingId: booking.id,
            senderId: 'system',
            senderType: 'system',
            content: messageContent,
            messageType,
            attachments: null,
          });
        }
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  app.get("/api/bookings/vendor/:vendorId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      // Verify vendor owns this vendor profile
      if (authReq.user?.role === 'vendor') {
        const vendors = await storage.getAllVendors();
        const userVendor = vendors.find((v: Vendor) => v.userId === authReq.user?.id);
        if (!userVendor || userVendor.id !== req.params.vendorId) {
          return res.status(403).json({ error: "You can only view bookings for your own vendor profile" });
        }
      }
      
      const bookings = await storage.getBookingsByVendor(req.params.vendorId);
      res.json(bookings || []);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ error: "Failed to fetch vendor bookings", details: error instanceof Error ? error.message : "Unknown error" });
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
  // EXPENSES - Shared expense tracking for couples
  // ============================================================================

  app.get("/api/expenses/:weddingId", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      // Get splits for each expense
      const expensesWithSplits = await Promise.all(
        expenses.map(async (expense) => {
          const splits = await storage.getExpenseSplitsByExpense(expense.id);
          return { ...expense, splits };
        })
      );
      res.json(expensesWithSplits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/by-id/:id", async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      const splits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const { splits, ...expenseData } = req.body;
      const validatedData = insertExpenseSchema.parse(expenseData);
      const expense = await storage.createExpense(validatedData);
      
      // Create splits if provided
      if (splits && Array.isArray(splits)) {
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      const createdSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: createdSplits });
    } catch (error) {
      console.error("Error creating expense:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const { splits, ...expenseData } = req.body;
      const expense = await storage.updateExpense(req.params.id, expenseData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      // Update splits if provided - delete existing and recreate
      if (splits && Array.isArray(splits)) {
        await storage.deleteExpenseSplitsByExpense(expense.id);
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      const updatedSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: updatedSplits });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      // Delete splits first
      await storage.deleteExpenseSplitsByExpense(req.params.id);
      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Mark a split as paid/unpaid
  app.patch("/api/expense-splits/:id", async (req, res) => {
    try {
      const split = await storage.updateExpenseSplit(req.params.id, req.body);
      if (!split) {
        return res.status(404).json({ error: "Expense split not found" });
      }
      res.json(split);
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense split" });
    }
  });

  // Get settlement summary - who owes whom
  app.get("/api/expenses/:weddingId/settlement", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      
      // Calculate balances: what each person paid vs what they owe
      const balances: Record<string, { name: string; paid: number; owes: number; balance: number }> = {};
      
      for (const expense of expenses) {
        const splits = await storage.getExpenseSplitsByExpense(expense.id);
        
        // Track what the payer paid
        if (!balances[expense.paidById]) {
          balances[expense.paidById] = { name: expense.paidByName, paid: 0, owes: 0, balance: 0 };
        }
        balances[expense.paidById].paid += parseFloat(expense.amount);
        
        // Track what each person owes from their splits
        for (const split of splits) {
          if (!balances[split.userId]) {
            balances[split.userId] = { name: split.userName, paid: 0, owes: 0, balance: 0 };
          }
          if (!split.isPaid) {
            balances[split.userId].owes += parseFloat(split.shareAmount);
          }
        }
      }
      
      // Calculate net balance for each person (positive = they are owed money, negative = they owe money)
      for (const userId in balances) {
        balances[userId].balance = balances[userId].paid - balances[userId].owes;
      }
      
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate settlement" });
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

  // Task Progress Stats
  app.get("/api/tasks/progress/:weddingId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByWedding(req.params.weddingId);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
      const overdue = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date();
      }).length;
      const withReminders = tasks.filter(t => t.reminderEnabled).length;

      const progress = total > 0 ? (completed / total) * 100 : 0;

      res.json({
        total,
        completed,
        highPriority,
        overdue,
        withReminders,
        progress: Math.round(progress * 100) / 100,
        remaining: total - completed,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task progress" });
    }
  });

  // Task Reminders - Get reminders for a wedding
  app.get("/api/task-reminders/:weddingId", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByWedding(req.params.weddingId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task reminders" });
    }
  });

  // Task Reminders - Get reminders for a specific task
  app.get("/api/tasks/:taskId/reminders", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByTask(req.params.taskId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task reminders" });
    }
  });

  // Toggle task reminder (consistent with other task routes)
  app.patch("/api/tasks/:id/reminder", async (req, res) => {
    try {
      const taskId = req.params.id;
      
      // Validate task exists
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const { reminderEnabled, reminderDate, reminderDaysBefore, reminderMethod } = req.body;
      
      const updates: any = {};
      if (reminderEnabled !== undefined) updates.reminderEnabled = Boolean(reminderEnabled);
      if (reminderDate !== undefined) {
        updates.reminderDate = reminderDate ? new Date(reminderDate) : null;
      }
      if (reminderDaysBefore !== undefined) {
        const days = parseInt(reminderDaysBefore);
        if (!isNaN(days) && days >= 1 && days <= 30) {
          updates.reminderDaysBefore = days;
        }
      }
      if (reminderMethod !== undefined) {
        const validMethods = ['email', 'sms', 'both'];
        if (validMethods.includes(reminderMethod)) {
          updates.reminderMethod = reminderMethod;
        }
      }

      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Failed to update task reminder:", error);
      res.status(500).json({ error: "Failed to update task reminder" });
    }
  });

  // Send on-demand reminder to assigned team member
  app.post("/api/tasks/:id/send-reminder", async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (!task.assignedToId) {
        return res.status(400).json({ error: "Task is not assigned to anyone" });
      }

      // Import and use the scheduler to send on-demand reminder
      const { TaskReminderScheduler } = await import('./services/task-reminder-scheduler');
      const scheduler = new TaskReminderScheduler(storage);
      
      const result = await scheduler.sendOnDemandReminder(taskId, userId);
      
      res.json({
        success: result.email || result.sms,
        message: result.message,
        emailSent: result.email,
        smsSent: result.sms
      });
    } catch (error: any) {
      console.error("Failed to send on-demand reminder:", error);
      res.status(500).json({ error: error.message || "Failed to send reminder" });
    }
  });

  // Get tasks assigned to the current user (for team members)
  app.get("/api/tasks/assigned/:weddingId", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const tasks = await storage.getTasksByAssignedUser(req.params.weddingId, userId);
      res.json(tasks);
    } catch (error) {
      console.error("Failed to fetch assigned tasks:", error);
      res.status(500).json({ error: "Failed to fetch assigned tasks" });
    }
  });

  // ============================================================================
  // AI TASK RECOMMENDATIONS
  // ============================================================================

  // Generate personalized AI task recommendations
  app.post("/api/tasks/:weddingId/ai-recommendations", async (req, res) => {
    try {
      const { weddingId } = req.params;
      
      // Get wedding details
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      // Get existing tasks
      const existingTasks = await storage.getTasksByWedding(weddingId);
      
      // Get planned events
      const events = await storage.getEventsByWedding(weddingId);
      
      // Import the AI function
      const { generateTaskRecommendations } = await import('./ai/gemini');
      
      const recommendations = await generateTaskRecommendations({
        tradition: wedding.tradition || 'General',
        weddingDate: wedding.date ? wedding.date.toISOString().split('T')[0] : undefined,
        city: wedding.city || undefined,
        budget: wedding.budget ? Number(wedding.budget) : undefined,
        events: events.map(e => ({ 
          name: e.name, 
          date: e.date ? e.date.toISOString() : undefined 
        })),
        existingTasks: existingTasks.map(t => ({
          title: t.title,
          completed: t.completed || false,
          category: t.category || undefined,
        })),
        partner1Name: wedding.partner1Name || undefined,
        partner2Name: wedding.partner2Name || undefined,
        guestCount: wedding.expectedGuests || undefined,
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error("Failed to generate AI task recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Add AI-recommended task to checklist
  app.post("/api/tasks/:weddingId/adopt-recommendation", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const { title, description, priority, category, suggestedDueDate, reason } = req.body;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const taskData = {
        weddingId,
        title,
        description,
        priority: priority || 'medium',
        category,
        dueDate: suggestedDueDate ? new Date(suggestedDueDate) : undefined,
        isAiRecommended: true,
        aiReason: reason,
        aiCategory: category,
        completed: false,
      };
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Failed to adopt AI task recommendation:", error);
      res.status(500).json({ error: "Failed to add task" });
    }
  });

  // Dismiss an AI recommendation (track that user doesn't want this)
  app.post("/api/tasks/:taskId/dismiss", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const task = await storage.updateTask(taskId, { dismissed: true });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to dismiss task:", error);
      res.status(500).json({ error: "Failed to dismiss task" });
    }
  });

  // ============================================================================
  // TASK COMMENTS - Collaborative comments on tasks
  // ============================================================================

  // Get comments for a task
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByTask(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Add a comment to a task
  app.post("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { userId, userName, content, weddingId } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      const comment = await storage.createTaskComment({
        taskId,
        weddingId,
        userId,
        userName,
        content: content.trim(),
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Failed to create task comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Delete a comment
  app.delete("/api/task-comments/:id", async (req, res) => {
    try {
      const success = await storage.deleteTaskComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
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
      
      // Server-side validation: eventId and vendorId are required
      if (!validatedData.eventId || validatedData.eventId.trim().length === 0) {
        return res.status(400).json({ 
          error: "Event is required",
          message: "Please select an event for this contract." 
        });
      }
      
      if (!validatedData.vendorId || validatedData.vendorId.trim().length === 0) {
        return res.status(400).json({ 
          error: "Vendor is required",
          message: "Please select a vendor for this contract." 
        });
      }
      
      // Server-side validation: contract terms cannot be empty
      if (!validatedData.contractTerms || validatedData.contractTerms.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract terms are required",
          message: "Please add contract terms before creating the contract." 
        });
      }
      
      // Server-side validation: total amount must be valid
      if (!validatedData.totalAmount || parseFloat(validatedData.totalAmount) <= 0) {
        return res.status(400).json({ 
          error: "Invalid total amount",
          message: "Please enter a valid contract amount greater than zero." 
        });
      }
      
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
      // Validate contract terms aren't being cleared to empty
      if (req.body.contractTerms !== undefined && 
          (req.body.contractTerms === null || req.body.contractTerms.trim().length === 0)) {
        return res.status(400).json({ 
          error: "Contract terms cannot be empty",
          message: "Contract terms are required and cannot be removed." 
        });
      }
      
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
  // CONTRACT TEMPLATES - Pre-made contract templates
  // ============================================================================

  // Get all contract templates (system templates)
  app.get("/api/contract-templates", async (req, res) => {
    try {
      const templates = await storage.getAllContractTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract templates" });
    }
  });

  // Get contract templates by vendor category
  app.get("/api/contract-templates/category/:category", async (req, res) => {
    try {
      const templates = await storage.getContractTemplatesByCategory(req.params.category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract templates" });
    }
  });

  // Get default template for a category
  app.get("/api/contract-templates/default/:category", async (req, res) => {
    try {
      const template = await storage.getDefaultContractTemplate(req.params.category);
      if (!template) {
        return res.status(404).json({ error: "No default template found for this category" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default contract template" });
    }
  });

  // Get custom templates for a wedding
  app.get("/api/contract-templates/custom/:weddingId", async (req, res) => {
    try {
      const templates = await storage.getCustomTemplatesByWedding(req.params.weddingId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom contract templates" });
    }
  });

  // Get a single template by ID
  app.get("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract template" });
    }
  });

  // Create a custom template
  app.post("/api/contract-templates", async (req, res) => {
    try {
      const template = await storage.createContractTemplate({
        ...req.body,
        isCustom: true,
      });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create contract template" });
    }
  });

  // Update a template
  app.patch("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateContractTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract template" });
    }
  });

  // Delete a template (only custom templates)
  app.delete("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (!template.isCustom) {
        return res.status(403).json({ error: "Cannot delete system templates" });
      }
      const success = await storage.deleteContractTemplate(req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract template" });
    }
  });

  // ============================================================================
  // AI ASSISTANT - Contract drafting and wedding planning chat
  // ============================================================================

  // Draft a contract using AI
  app.post("/api/ai/contract/draft", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const request: ContractDraftRequest = req.body;
      
      // Validate required fields
      if (!request.vendorName || !request.vendorCategory || !request.eventName || !request.servicesDescription) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Vendor name, category, event name, and services description are required" 
        });
      }

      if (typeof request.totalAmount !== 'number' || request.totalAmount <= 0) {
        return res.status(400).json({ 
          error: "Invalid amount",
          message: "Total amount must be a positive number" 
        });
      }

      const contractText = await draftContract(request);
      res.json({ contract: contractText });
    } catch (error) {
      console.error("Error drafting contract:", error);
      res.status(500).json({ 
        error: "Failed to draft contract",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Review an existing contract using AI
  app.post("/api/ai/contract/review", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const request: ContractReviewRequest = req.body;
      
      if (!request.contractText || request.contractText.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract text required",
          message: "Please provide the contract text to review" 
        });
      }

      const review = await reviewContract(request);
      res.json({ review });
    } catch (error) {
      console.error("Error reviewing contract:", error);
      res.status(500).json({ 
        error: "Failed to review contract",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Generate a specific contract clause
  app.post("/api/ai/contract/clause", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { clauseType, vendorCategory, tradition, specificDetails } = req.body;
      
      if (!clauseType || clauseType.trim().length === 0) {
        return res.status(400).json({ 
          error: "Clause type required",
          message: "Please specify the type of clause to generate" 
        });
      }

      const clause = await generateContractClause(clauseType, {
        vendorCategory,
        tradition,
        specificDetails,
      });
      res.json({ clause });
    } catch (error) {
      console.error("Error generating clause:", error);
      res.status(500).json({ 
        error: "Failed to generate clause",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Get contract improvement suggestions
  app.post("/api/ai/contract/suggestions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { currentTerms, vendorCategory } = req.body;
      
      if (!currentTerms || currentTerms.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract terms required",
          message: "Please provide the current contract terms" 
        });
      }

      const suggestions = await suggestContractImprovements(currentTerms, vendorCategory || "General");
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ 
        error: "Failed to get suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Wedding planning chat
  app.post("/api/ai/chat", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { message, conversationHistory, weddingContext } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory) ? conversationHistory : [];
      const context: WeddingContext | undefined = weddingContext;

      const response = await chatWithPlanner(message, history, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        error: "Failed to get response",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Vendor reply suggestions - AI-powered response suggestions for vendor inbox
  app.post("/api/ai/vendor-reply-suggestions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify user is a vendor
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can access this endpoint" });
      }

      const { vendorName, vendorCategory, coupleName, coupleMessage, eventName, weddingDate, tradition, bookingStatus } = req.body;
      
      // Validate required fields
      if (!vendorName || !coupleName || !coupleMessage) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "vendorName, coupleName, and coupleMessage are required" 
        });
      }
      
      // Input sanitization - limit string lengths to prevent abuse
      const sanitize = (str: string | undefined, maxLen: number) => 
        str ? str.slice(0, maxLen).trim() : undefined;
      
      const request: VendorReplySuggestionRequest = {
        vendorName: sanitize(vendorName, 100)!,
        vendorCategory: sanitize(vendorCategory, 50) || "Wedding Vendor",
        coupleName: sanitize(coupleName, 100)!,
        coupleMessage: sanitize(coupleMessage, 1000)!,
        eventName: sanitize(eventName, 100),
        weddingDate: sanitize(weddingDate, 50),
        tradition: sanitize(tradition, 50),
        bookingStatus: sanitize(bookingStatus, 50),
      };

      const suggestions = await generateVendorReplySuggestions(request);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating vendor reply suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Couple booking request suggestions - AI-powered message suggestions for couples
  app.post("/api/ai/couple-message-suggestions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify user is a couple
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== 'couple') {
        return res.status(403).json({ error: "Only couples can access this endpoint" });
      }

      const { vendorName, vendorCategory, coupleName, eventName, eventDate, tradition, city, guestCount, existingNotes } = req.body;
      
      // Validate required fields
      if (!vendorName || !coupleName) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "vendorName and coupleName are required" 
        });
      }
      
      // Input sanitization - limit string lengths to prevent abuse
      const sanitize = (str: string | undefined, maxLen: number) => 
        str ? str.slice(0, maxLen).trim() : undefined;

      const request: CoupleMessageSuggestionRequest = {
        vendorName: sanitize(vendorName, 100)!,
        vendorCategory: sanitize(vendorCategory, 50) || "Wedding Vendor",
        coupleName: sanitize(coupleName, 100)!,
        eventName: sanitize(eventName, 200),
        eventDate: sanitize(eventDate, 50),
        tradition: sanitize(tradition, 50),
        city: sanitize(city, 50),
        guestCount: typeof guestCount === 'number' ? Math.min(guestCount, 10000) : undefined,
        existingNotes: sanitize(existingNotes, 500),
      };

      const suggestions = await generateCoupleMessageSuggestions(request);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating couple message suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
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
  // CONTRACT DOCUMENTS - Document storage for contracts
  // ============================================================================

  // Helper function to check contract access authorization
  async function checkContractAccess(storage: IStorage, contractId: string, userId: string): Promise<{ authorized: boolean; contract?: Contract; reason?: string }> {
    const contract = await storage.getContract(contractId);
    if (!contract) {
      return { authorized: false, reason: "Contract not found" };
    }

    // Check if user is the vendor for this contract
    const vendor = await storage.getVendor(contract.vendorId);
    if (vendor && vendor.userId === userId) {
      return { authorized: true, contract };
    }

    // Check if user owns the wedding
    const wedding = await storage.getWedding(contract.weddingId);
    if (wedding && wedding.userId === userId) {
      return { authorized: true, contract };
    }

    // Check if user is a team member of the wedding
    const teamMembers = await storage.getTeamMembersByWedding(contract.weddingId);
    const isMember = teamMembers.some(m => m.userId === userId && m.status === 'active');
    if (isMember) {
      return { authorized: true, contract };
    }

    return { authorized: false, reason: "Not authorized to access this contract" };
  }

  // Get all documents for a contract
  app.get("/api/contracts/:contractId/documents", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const documents = await storage.getDocumentsByContract(contractId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract documents" });
    }
  });

  // Upload a document to a contract
  app.post("/api/contracts/:contractId/documents", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { fileName, fileUrl, fileType, fileSize, documentType, description } = req.body;

      // Validate required fields
      if (!fileName || !fileUrl || !documentType) {
        return res.status(400).json({ error: "Missing required fields: fileName, fileUrl, documentType" });
      }

      // Validate file name (prevent path traversal)
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({ error: "Invalid file name" });
      }

      // Validate URL format
      try {
        new URL(fileUrl);
      } catch {
        return res.status(400).json({ error: "Invalid file URL" });
      }

      // Validate document type
      const validDocTypes = ['contract', 'amendment', 'invoice', 'receipt', 'proposal', 'other'];
      if (!validDocTypes.includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      // Check authorization
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const document = await storage.createContractDocument({
        contractId,
        fileName: fileName.substring(0, 255), // Limit filename length
        fileUrl,
        fileType: fileType || 'application/octet-stream',
        fileSize: Math.max(0, parseInt(fileSize) || 0),
        documentType,
        description: description ? description.substring(0, 1000) : null,
        uploadedBy: authReq.session.userId,
      });

      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Delete a contract document
  app.delete("/api/contracts/:contractId/documents/:documentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, documentId } = req.params;
      
      // Check contract access
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const document = await storage.getContractDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Only the uploader or vendor/wedding owner can delete
      if (document.uploadedBy !== authReq.session.userId) {
        const vendor = await storage.getVendor(access.contract!.vendorId);
        const wedding = await storage.getWedding(access.contract!.weddingId);
        const isOwner = (vendor && vendor.userId === authReq.session.userId) || 
                       (wedding && wedding.userId === authReq.session.userId);
        if (!isOwner) {
          return res.status(403).json({ error: "Not authorized to delete this document" });
        }
      }

      await storage.deleteContractDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============================================================================
  // CONTRACT PAYMENTS - Payment tracking for contracts
  // ============================================================================

  // Get all payments for a contract
  app.get("/api/contracts/:contractId/payments", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payments = await storage.getPaymentsByContract(contractId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract payments" });
    }
  });

  // Get payment summary for a contract
  app.get("/api/contracts/:contractId/payment-summary", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payments = await storage.getPaymentsByContract(contractId);
      const totalPaid = await storage.getTotalPaidForContract(contractId);
      const totalAmount = parseFloat(access.contract!.totalAmount || '0');
      const remaining = Math.max(0, totalAmount - totalPaid);

      res.json({
        totalAmount,
        totalPaid,
        remaining,
        paymentCount: payments.length,
        completedPayments: payments.filter(p => p.status === 'completed').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment summary" });
    }
  });

  // Record a new payment
  app.post("/api/contracts/:contractId/payments", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { amount, paymentMethod, paymentType, dueDate, notes, milestoneId } = req.body;

      // Validate required fields
      if (!amount || !paymentMethod || !paymentType) {
        return res.status(400).json({ error: "Missing required fields: amount, paymentMethod, paymentType" });
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      // Validate payment method
      const validMethods = ['credit_card', 'bank_transfer', 'check', 'cash', 'venmo', 'zelle', 'other'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // Validate payment type
      const validTypes = ['deposit', 'milestone', 'final', 'partial', 'refund'];
      if (!validTypes.includes(paymentType)) {
        return res.status(400).json({ error: "Invalid payment type" });
      }

      // Check authorization
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.createContractPayment({
        contractId,
        amount: parsedAmount.toFixed(2),
        paymentMethod,
        paymentType,
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ? notes.substring(0, 1000) : null,
        milestoneId: milestoneId || null,
        recordedBy: authReq.session.userId,
      });

      res.json(payment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  // Update payment status
  app.patch("/api/contracts/:contractId/payments/:paymentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, paymentId } = req.params;
      const { status, paidDate, transactionId, notes } = req.body;

      // Check contract access
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.getContractPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Verify payment belongs to this contract
      if (payment.contractId !== contractId) {
        return res.status(403).json({ error: "Payment does not belong to this contract" });
      }

      // Validate status if provided
      if (status) {
        const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: "Invalid payment status" });
        }
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (paidDate) updateData.paidDate = new Date(paidDate);
      if (transactionId !== undefined) updateData.transactionId = transactionId ? transactionId.substring(0, 255) : null;
      if (notes !== undefined) updateData.notes = notes ? notes.substring(0, 1000) : null;

      const updated = await storage.updateContractPayment(paymentId, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  // Delete a payment record
  app.delete("/api/contracts/:contractId/payments/:paymentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, paymentId } = req.params;
      
      // Check contract access
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.getContractPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Verify payment belongs to this contract
      if (payment.contractId !== contractId) {
        return res.status(403).json({ error: "Payment does not belong to this contract" });
      }

      // Only the recorder or vendor/wedding owner can delete
      if (payment.recordedBy !== authReq.session.userId) {
        const vendor = await storage.getVendor(access.contract!.vendorId);
        const wedding = await storage.getWedding(access.contract!.weddingId);
        const isOwner = (vendor && vendor.userId === authReq.session.userId) || 
                       (wedding && wedding.userId === authReq.session.userId);
        if (!isOwner) {
          return res.status(403).json({ error: "Not authorized to delete this payment" });
        }
      }

      await storage.deleteContractPayment(paymentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // ============================================================================
  // NOTIFICATIONS - Couple notifications for unread messages and team joins
  // ============================================================================

  app.get("/api/notifications/couple/:weddingId", async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      // Get all unread vendor messages in a single query (optimized - no N+1)
      const allUnreadMessages = await storage.getUnreadVendorMessagesByWedding(weddingId);
      
      // Group unread messages by conversationId
      const messagesByConversation = new Map<string, typeof allUnreadMessages>();
      for (const msg of allUnreadMessages) {
        const convId = msg.conversationId;
        if (!messagesByConversation.has(convId)) {
          messagesByConversation.set(convId, []);
        }
        messagesByConversation.get(convId)!.push(msg);
      }
      
      // Collect unique vendor IDs for batch fetching
      const vendorIds = new Set<string>();
      for (const convId of messagesByConversation.keys()) {
        const parsed = parseConversationId(convId);
        if (parsed) {
          vendorIds.add(parsed.vendorId);
        }
      }
      
      // Batch fetch all vendors and events in parallel
      const [vendors, events] = await Promise.all([
        storage.getVendorsByIds(Array.from(vendorIds)),
        storage.getEventsByWedding(weddingId),
      ]);
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      // Build unread message notifications
      const unreadVendorMessages: Array<{
        type: 'unread_message';
        vendorId: string;
        vendorName: string;
        eventId?: string;
        eventName?: string;
        unreadCount: number;
        conversationId: string;
        latestMessage: string;
        createdAt: Date;
      }> = [];
      
      for (const [convId, messages] of messagesByConversation) {
        const parsed = parseConversationId(convId);
        if (parsed) {
          const vendor = vendorMap.get(parsed.vendorId);
          const event = parsed.eventId ? eventMap.get(parsed.eventId) : undefined;
          // Messages are already sorted desc by createdAt from storage
          const latestUnread = messages[0];
          
          unreadVendorMessages.push({
            type: 'unread_message',
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            eventId: parsed.eventId,
            eventName: event?.name,
            unreadCount: messages.length,
            conversationId: convId,
            latestMessage: latestUnread.content.slice(0, 100) + (latestUnread.content.length > 100 ? '...' : ''),
            createdAt: latestUnread.createdAt,
          });
        }
      }
      
      // Get recent team member joins (last 7 days)
      const collaborators = await storage.getWeddingCollaboratorsByWedding(weddingId);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentJoins = collaborators
        .filter(c => c.status === 'accepted' && c.acceptedAt && new Date(c.acceptedAt) > sevenDaysAgo)
        .map(c => ({
          type: 'team_join' as const,
          collaboratorId: c.id,
          email: c.email,
          displayName: c.displayName,
          acceptedAt: c.acceptedAt!,
        }));
      
      // Combine and sort by date (newest first)
      const notifications: Array<{
        id: string;
        type: 'unread_message' | 'team_join';
        title: string;
        description: string;
        link: string;
        createdAt: Date;
      }> = [];
      
      // Add unread message notifications
      for (const msg of unreadVendorMessages) {
        // Build title with event name if available
        const eventSuffix = msg.eventName ? ` for ${msg.eventName}` : '';
        notifications.push({
          id: `msg-${msg.conversationId}`,
          type: 'unread_message',
          title: `${msg.unreadCount} unread message${msg.unreadCount > 1 ? 's' : ''} from ${msg.vendorName}${eventSuffix}`,
          description: msg.latestMessage,
          link: `/messages?conversation=${msg.conversationId}`,
          createdAt: msg.createdAt,
        });
      }
      
      // Add team join notifications
      for (const join of recentJoins) {
        notifications.push({
          id: `join-${join.collaboratorId}`,
          type: 'team_join',
          title: `${join.displayName || join.email} joined your team`,
          description: 'A new team member has accepted your invitation',
          link: '/collaborators',
          createdAt: join.acceptedAt,
        });
      }
      
      // Sort by date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json({
        notifications,
        totalCount: notifications.length,
        unreadMessageCount: unreadVendorMessages.reduce((sum, m) => sum + m.unreadCount, 0),
        teamJoinCount: recentJoins.length,
      });
    } catch (error) {
      console.error("Error fetching couple notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
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

  // Get all conversations for a wedding (includes bookings as synthetic conversations)
  app.get("/api/conversations/wedding/:weddingId", async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      // Fetch conversations and bookings in parallel
      const [conversationIds, bookings, events] = await Promise.all([
        storage.getConversationsByWedding(weddingId),
        storage.getBookingsByWedding(weddingId),
        storage.getEventsByWedding(weddingId),
      ]);
      
      // Create event lookup map
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      // Track which vendor+event combinations have conversations
      const existingConversations = new Set<string>();
      
      // Enrich conversations with vendor metadata and booking status
      const conversationsWithMetadata = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const vendor = await storage.getVendor(parsed.vendorId);
          const event = parsed.eventId ? eventMap.get(parsed.eventId) : null;
          
          // Track this conversation exists
          const key = `${parsed.vendorId}:${parsed.eventId || 'general'}`;
          existingConversations.add(key);
          
          // Check if there's a booking for this vendor+event
          // Normalize null/undefined for comparison
          const parsedEventId = parsed.eventId || null;
          const booking = bookings.find(b => 
            b.vendorId === parsed.vendorId && 
            (b.eventId || null) === parsedEventId
          );
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            vendorCategory: vendor?.categories?.[0] || '',
            eventId: parsed.eventId,
            eventName: event?.name,
            bookingId: booking?.id,
            bookingStatus: booking?.status,
          };
        })
      );
      
      // Create synthetic conversations for bookings that don't have conversations yet
      const syntheticConversations = await Promise.all(
        bookings
          .filter(booking => {
            const key = `${booking.vendorId}:${booking.eventId || 'general'}`;
            return !existingConversations.has(key);
          })
          .map(async (booking) => {
            const vendor = await storage.getVendor(booking.vendorId);
            const event = booking.eventId ? eventMap.get(booking.eventId) : null;
            const convId = generateConversationId(weddingId, booking.vendorId, booking.eventId || undefined);
            
            return {
              conversationId: convId,
              weddingId: weddingId,
              vendorId: booking.vendorId,
              vendorName: vendor?.name || 'Unknown Vendor',
              vendorCategory: vendor?.categories?.[0] || '',
              eventId: booking.eventId,
              eventName: event?.name,
              bookingId: booking.id,
              bookingStatus: booking.status,
            };
          })
      );
      
      const allConversations = [...conversationsWithMetadata.filter(Boolean), ...syntheticConversations];
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching wedding conversations:", error);
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
            vendorCategory: vendor?.categories?.[0] || '',
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
      
      // Check if conversation is closed before allowing new messages
      const conversationId = generateConversationId(
        validatedData.weddingId,
        validatedData.vendorId,
        validatedData.eventId
      );
      const conversationStatus = await storage.getConversationStatus(conversationId);
      if (conversationStatus?.status === 'closed') {
        return res.status(403).json({ 
          error: "Conversation closed", 
          message: "This inquiry has been closed and no new messages can be sent." 
        });
      }
      
      const message = await storage.createMessage(validatedData);
      
      // Broadcast new message via WebSocket for real-time updates
      if (message.conversationId && (global as any).broadcastNewMessage) {
        (global as any).broadcastNewMessage(message.conversationId, message);
      }
      
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
  // CONVERSATION STATUS - Close/Withdraw Inquiry
  // ============================================================================

  // Get conversation status
  app.get("/api/conversations/:conversationId/status", async (req, res) => {
    try {
      const status = await storage.getConversationStatus(decodeURIComponent(req.params.conversationId));
      if (!status) {
        return res.json({ status: 'open' });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation status" });
    }
  });

  // Close/withdraw an inquiry
  app.patch("/api/conversations/:conversationId/close", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const conversationId = decodeURIComponent(req.params.conversationId);
      const { reason } = req.body;
      
      const parsed = parseConversationId(conversationId);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      // Verify the user is authorized to close this conversation
      const wedding = await storage.getWedding(parsed.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "You can only close inquiries for your own wedding" });
      }
      
      // Close the conversation
      const status = await storage.closeConversation(
        conversationId,
        authReq.session.userId,
        'couple',
        reason
      );
      
      // Send email notification to vendor
      try {
        const vendor = await storage.getVendor(parsed.vendorId);
        const user = vendor?.userId ? await storage.getUser(vendor.userId) : null;
        
        if (user?.email && vendor) {
          const coupleName = wedding.partner1Name && wedding.partner2Name
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'A couple';
          
          const { sendInquiryClosedEmail } = await import("./email");
          await sendInquiryClosedEmail(
            user.email,
            vendor.name,
            coupleName,
            reason || undefined
          );
        }
      } catch (emailError) {
        console.error("Failed to send inquiry closed email:", emailError);
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error closing conversation:", error);
      res.status(500).json({ error: "Failed to close conversation" });
    }
  });

  // ============================================================================
  // LEAD INBOX - Vendor inquiry management with quick replies and reminders
  // ============================================================================

  // Get lead inbox data for a vendor (conversations with unread counts and wedding details)
  // Also includes booking requests that may not have messages yet
  app.get("/api/lead-inbox/:vendorId", async (req, res) => {
    try {
      const vendorId = req.params.vendorId;
      const conversationIds = await storage.getConversationsByVendor(vendorId);
      
      // Track which wedding+event combinations already have conversations
      const existingConversations = new Set<string>();
      
      const leadsFromConversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          // Track this conversation
          const key = parsed.eventId ? `${parsed.weddingId}-${parsed.eventId}` : parsed.weddingId;
          existingConversations.add(key);
          
          const messages = await storage.getConversationMessages(convId);
          const wedding = await storage.getWedding(parsed.weddingId);
          const unreadCount = await storage.getUnreadCount(convId, 'vendor');
          
          // Get event name if eventId exists
          let eventName: string | undefined;
          if (parsed.eventId) {
            const event = await storage.getEvent(parsed.eventId);
            eventName = event?.name;
          }
          
          const lastMessage = messages[messages.length - 1];
          const firstMessage = messages[0];
          
          const coupleName = wedding?.partner1Name && wedding?.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding?.partner1Name || wedding?.partner2Name || 'Couple';
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            eventId: parsed.eventId,
            coupleName,
            eventName,
            weddingDate: wedding?.date,
            city: wedding?.city,
            tradition: wedding?.tradition,
            unreadCount,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderType: lastMessage.senderType,
              createdAt: lastMessage.createdAt,
            } : null,
            firstInquiryDate: firstMessage?.createdAt,
            totalMessages: messages.length,
            bookingStatus: undefined as string | undefined,
            bookingId: undefined as string | undefined,
          };
        })
      );
      
      // Also fetch bookings for this vendor that don't have conversations yet
      const bookings = await storage.getBookingsByVendor(vendorId);
      
      const leadsFromBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          // Check if this booking already has a conversation
          const key = booking.eventId ? `${booking.weddingId}-${booking.eventId}` : booking.weddingId;
          if (existingConversations.has(key)) {
            return null; // Skip - already included from conversations
          }
          
          const wedding = await storage.getWedding(booking.weddingId);
          if (!wedding) return null;
          
          let eventName: string | undefined;
          if (booking.eventId) {
            const event = await storage.getEvent(booking.eventId);
            eventName = event?.name;
          }
          
          const coupleName = wedding.partner1Name && wedding.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'Couple';
          
          // Generate a conversation ID for this booking
          const convId = generateConversationId(booking.weddingId, vendorId, booking.eventId || undefined);
          
          return {
            conversationId: convId,
            weddingId: booking.weddingId,
            vendorId: vendorId,
            eventId: booking.eventId || undefined,
            coupleName,
            eventName,
            weddingDate: wedding.date,
            city: wedding.city,
            tradition: wedding.tradition,
            unreadCount: 1, // Treat new booking requests as unread
            lastMessage: {
              content: `Booking request: ${booking.status === 'pending' ? 'Awaiting your response' : booking.status}`,
              senderType: 'couple',
              createdAt: booking.requestDate,
            },
            firstInquiryDate: booking.requestDate,
            totalMessages: 0,
            bookingStatus: booking.status,
            bookingId: booking.id,
          };
        })
      );
      
      // Combine both sources
      const allLeads = [...leadsFromConversations, ...leadsFromBookings].filter(Boolean);
      
      // Sort by unread count first, then by last message date
      const sortedLeads = allLeads.sort((a, b) => {
        if (b!.unreadCount !== a!.unreadCount) return b!.unreadCount - a!.unreadCount;
        const aDate = a!.lastMessage?.createdAt || new Date(0);
        const bDate = b!.lastMessage?.createdAt || new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      
      res.json(sortedLeads);
    } catch (error) {
      console.error("Error fetching lead inbox:", error);
      res.status(500).json({ error: "Failed to fetch lead inbox" });
    }
  });

  // ============================================================================
  // QUICK REPLY TEMPLATES
  // ============================================================================

  // Get all templates for a vendor
  app.get("/api/quick-reply-templates/vendor/:vendorId", async (req, res) => {
    try {
      const templates = await storage.getQuickReplyTemplatesByVendor(req.params.vendorId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Create a new template
  app.post("/api/quick-reply-templates", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertQuickReplyTemplateSchema.parse(req.body);
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create templates for your own vendor profile" });
      }
      
      const template = await storage.createQuickReplyTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update a template
  app.patch("/api/quick-reply-templates/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertQuickReplyTemplateSchema.partial().parse(req.body);
      
      const existing = await storage.getQuickReplyTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only update your own templates" });
      }
      
      const template = await storage.updateQuickReplyTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete a template
  app.delete("/api/quick-reply-templates/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getQuickReplyTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only delete your own templates" });
      }
      
      await storage.deleteQuickReplyTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Increment template usage count
  app.post("/api/quick-reply-templates/:id/use", async (req, res) => {
    try {
      const template = await storage.incrementTemplateUsage(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to track template usage" });
    }
  });

  // ============================================================================
  // FOLLOW-UP REMINDERS
  // ============================================================================

  // Get all reminders for a vendor
  app.get("/api/follow-up-reminders/vendor/:vendorId", async (req, res) => {
    try {
      const reminders = await storage.getFollowUpRemindersByVendor(req.params.vendorId);
      
      // Enrich with wedding details
      const enrichedReminders = await Promise.all(
        reminders.map(async (reminder) => {
          const wedding = await storage.getWedding(reminder.weddingId);
          return {
            ...reminder,
            coupleName: wedding?.coupleName1 && wedding?.coupleName2 
              ? `${wedding.coupleName1} & ${wedding.coupleName2}`
              : wedding?.coupleName1 || 'Unknown',
          };
        })
      );
      
      res.json(enrichedReminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  // Get pending reminders for a vendor
  app.get("/api/follow-up-reminders/vendor/:vendorId/pending", async (req, res) => {
    try {
      const reminders = await storage.getPendingRemindersForVendor(req.params.vendorId);
      
      // Enrich with wedding details
      const enrichedReminders = await Promise.all(
        reminders.map(async (reminder) => {
          const wedding = await storage.getWedding(reminder.weddingId);
          return {
            ...reminder,
            coupleName: wedding?.coupleName1 && wedding?.coupleName2 
              ? `${wedding.coupleName1} & ${wedding.coupleName2}`
              : wedding?.coupleName1 || 'Unknown',
          };
        })
      );
      
      res.json(enrichedReminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reminders" });
    }
  });

  // Create a new reminder
  app.post("/api/follow-up-reminders", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertFollowUpReminderSchema.parse(req.body);
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create reminders for your own vendor profile" });
      }
      
      const reminder = await storage.createFollowUpReminder(validatedData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  // Update a reminder (mark as completed/dismissed)
  app.patch("/api/follow-up-reminders/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertFollowUpReminderSchema.partial().parse(req.body);
      
      const existing = await storage.getFollowUpReminder(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only update your own reminders" });
      }
      
      const reminder = await storage.updateFollowUpReminder(req.params.id, validatedData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  // Delete a reminder
  app.delete("/api/follow-up-reminders/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getFollowUpReminder(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      
      // Verify vendor ownership
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only delete your own reminders" });
      }
      
      await storage.deleteFollowUpReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reminder" });
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
      
      // Update vendor's aggregated rating and review count
      const allVendorReviews = await storage.getReviewsByVendor(validatedData.vendorId);
      if (allVendorReviews.length > 0) {
        const totalRating = allVendorReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Math.round((totalRating / allVendorReviews.length) * 10) / 10; // Numeric with 1 decimal
        await storage.updateVendor(validatedData.vendorId, {
          rating: String(avgRating), // Schema expects string for decimal column
          reviewCount: allVendorReviews.length,
        });
      }
      
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
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, objectPath });
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
        const primaryCategory = vendor.categories?.[0] || 'other';
        if (!vendorsByCategory[primaryCategory]) {
          vendorsByCategory[primaryCategory] = [];
        }
        vendorsByCategory[primaryCategory].push(vendor);
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
  // VENDOR CALENDAR ACCOUNTS & CALENDARS ROUTES
  // ============================================================================

  // Get all calendar accounts for a vendor
  app.get("/api/vendor-calendar-accounts/vendor/:vendorId", async (req, res) => {
    try {
      const accounts = await storage.getCalendarAccountsByVendor(req.params.vendorId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching calendar accounts:", error);
      res.status(500).json({ error: "Failed to fetch calendar accounts" });
    }
  });

  // Get single calendar account
  app.get("/api/vendor-calendar-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getVendorCalendarAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching calendar account:", error);
      res.status(500).json({ error: "Failed to fetch calendar account" });
    }
  });

  // Create new calendar account connection
  app.post("/api/vendor-calendar-accounts", async (req, res) => {
    try {
      const { vendorId, provider, email, label } = req.body;
      if (!vendorId || !provider || !email) {
        return res.status(400).json({ error: "vendorId, provider, and email are required" });
      }
      
      // Check if account with same email already exists for this vendor
      const existing = await storage.getCalendarAccountByEmail(vendorId, email);
      if (existing) {
        return res.status(409).json({ error: "A calendar account with this email already exists" });
      }
      
      const account = await storage.createVendorCalendarAccount({
        vendorId,
        provider,
        email,
        label: label || null,
        status: 'pending',
      });
      res.json(account);
    } catch (error) {
      console.error("Error creating calendar account:", error);
      res.status(500).json({ error: "Failed to create calendar account" });
    }
  });

  // Update calendar account
  app.patch("/api/vendor-calendar-accounts/:id", async (req, res) => {
    try {
      const account = await storage.updateVendorCalendarAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating calendar account:", error);
      res.status(500).json({ error: "Failed to update calendar account" });
    }
  });

  // Delete calendar account and all its calendars
  app.delete("/api/vendor-calendar-accounts/:id", async (req, res) => {
    try {
      // First delete all calendars associated with this account
      await storage.deleteCalendarsByAccount(req.params.id);
      
      // Then delete the account itself
      const success = await storage.deleteVendorCalendarAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json({ message: "Calendar account deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar account:", error);
      res.status(500).json({ error: "Failed to delete calendar account" });
    }
  });

  // Get all calendars for a vendor
  app.get("/api/vendor-calendars/vendor/:vendorId", async (req, res) => {
    try {
      const calendars = await storage.getCalendarsByVendor(req.params.vendorId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching vendor calendars:", error);
      res.status(500).json({ error: "Failed to fetch vendor calendars" });
    }
  });

  // Get calendars by account
  app.get("/api/vendor-calendars/account/:accountId", async (req, res) => {
    try {
      const calendars = await storage.getCalendarsByAccount(req.params.accountId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching account calendars:", error);
      res.status(500).json({ error: "Failed to fetch account calendars" });
    }
  });

  // Get selected calendars for availability aggregation
  app.get("/api/vendor-calendars/vendor/:vendorId/selected", async (req, res) => {
    try {
      const calendars = await storage.getSelectedCalendarsByVendor(req.params.vendorId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching selected calendars:", error);
      res.status(500).json({ error: "Failed to fetch selected calendars" });
    }
  });

  // Get write target calendar for creating bookings
  app.get("/api/vendor-calendars/vendor/:vendorId/write-target", async (req, res) => {
    try {
      const calendar = await storage.getWriteTargetCalendar(req.params.vendorId);
      res.json(calendar || null);
    } catch (error) {
      console.error("Error fetching write target calendar:", error);
      res.status(500).json({ error: "Failed to fetch write target calendar" });
    }
  });

  // Get aggregated availability across all selected calendars for a vendor
  // Fetches busy slots from each selected calendar and merges them
  app.get("/api/vendor-calendars/vendor/:vendorId/aggregated-availability", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate query parameters are required" });
      }

      // Get all selected calendars with their account info
      const selectedCalendars = await storage.getSelectedCalendarsByVendor(vendorId);
      const writeTarget = await storage.getWriteTargetCalendar(vendorId);
      
      // Get account info for each calendar
      const accounts = await storage.getCalendarAccountsByVendor(vendorId);
      const accountsMap = new Map(accounts.map(acc => [acc.id, acc]));

      // Aggregate busy slots from all selected calendars
      const allBusySlots: Array<{ start: Date; end: Date; calendarId: string; calendarName: string }> = [];
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Fetch busy slots from each selected calendar based on provider
      for (const cal of selectedCalendars) {
        const account = accountsMap.get(cal.accountId);
        if (!account) continue;

        try {
          if (account.provider === 'google') {
            // Use the Google Calendar getFreeBusy function
            const { getFreeBusy } = await import("./googleCalendar");
            const busySlots = await getFreeBusy(cal.providerCalendarId, start, end);
            busySlots.forEach(slot => {
              allBusySlots.push({
                ...slot,
                calendarId: cal.id,
                calendarName: cal.displayName,
              });
            });
          } else if (account.provider === 'outlook') {
            // Use Outlook Calendar getAvailability
            const { getAvailability } = await import("./outlookCalendar");
            const availability = await getAvailability(start, end);
            // Extract busy slots from availability windows
            availability.forEach(window => {
              window.slots.forEach(slot => {
                if (!slot.available) {
                  allBusySlots.push({
                    start: new Date(slot.start),
                    end: new Date(slot.end),
                    calendarId: cal.id,
                    calendarName: cal.displayName,
                  });
                }
              });
            });
          }
        } catch (calendarError) {
          console.log(`Could not fetch from calendar ${cal.displayName}:`, calendarError);
          // Continue with other calendars even if one fails
        }
      }

      // Merge overlapping busy slots
      const sortedSlots = allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
      const mergedBusySlots: Array<{ start: string; end: string; sources: string[] }> = [];
      
      for (const slot of sortedSlots) {
        const lastMerged = mergedBusySlots[mergedBusySlots.length - 1];
        if (lastMerged && new Date(lastMerged.end) >= slot.start) {
          // Overlapping or adjacent - extend the slot
          lastMerged.end = new Date(Math.max(new Date(lastMerged.end).getTime(), slot.end.getTime())).toISOString();
          if (!lastMerged.sources.includes(slot.calendarName)) {
            lastMerged.sources.push(slot.calendarName);
          }
        } else {
          // New slot
          mergedBusySlots.push({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            sources: [slot.calendarName],
          });
        }
      }

      // Group calendars by account for the response
      const calendarsByAccount = selectedCalendars.reduce((acc, cal) => {
        const account = accountsMap.get(cal.accountId);
        if (!account) return acc;
        
        if (!acc[account.id]) {
          acc[account.id] = {
            account: {
              id: account.id,
              email: account.email,
              provider: account.provider,
              status: account.status,
              label: account.label,
            },
            calendars: [],
          };
        }
        
        acc[account.id].calendars.push({
          id: cal.id,
          providerCalendarId: cal.providerCalendarId,
          displayName: cal.displayName,
          color: cal.color,
          isPrimary: cal.isPrimary,
          isWriteTarget: cal.isWriteTarget,
        });
        
        return acc;
      }, {} as Record<string, any>);

      res.json({
        selectedCalendars: selectedCalendars.map(cal => ({
          id: cal.id,
          providerCalendarId: cal.providerCalendarId,
          displayName: cal.displayName,
          color: cal.color,
          accountId: cal.accountId,
          isWriteTarget: cal.isWriteTarget,
        })),
        writeTarget: writeTarget ? {
          id: writeTarget.id,
          providerCalendarId: writeTarget.providerCalendarId,
          displayName: writeTarget.displayName,
          accountId: writeTarget.accountId,
        } : null,
        accounts: Object.values(calendarsByAccount),
        aggregatedBusySlots: mergedBusySlots,
        totalSelectedCalendars: selectedCalendars.length,
        hasWriteTarget: !!writeTarget,
      });
    } catch (error) {
      console.error("Error fetching aggregated availability:", error);
      res.status(500).json({ error: "Failed to fetch aggregated availability" });
    }
  });

  // Create vendor calendar
  app.post("/api/vendor-calendars", async (req, res) => {
    try {
      const { accountId, vendorId, providerCalendarId, displayName, color, isPrimary } = req.body;
      if (!accountId || !vendorId || !providerCalendarId || !displayName) {
        return res.status(400).json({ error: "accountId, vendorId, providerCalendarId, and displayName are required" });
      }
      
      const calendar = await storage.createVendorCalendar({
        accountId,
        vendorId,
        providerCalendarId,
        displayName,
        color: color || null,
        isPrimary: isPrimary || false,
        isSelected: true,
        isWriteTarget: false,
        syncDirection: 'read',
      });
      res.json(calendar);
    } catch (error) {
      console.error("Error creating vendor calendar:", error);
      res.status(500).json({ error: "Failed to create vendor calendar" });
    }
  });

  // Update vendor calendar (toggle selection, set as write target, etc.)
  app.patch("/api/vendor-calendars/:id", async (req, res) => {
    try {
      const { isSelected, isWriteTarget, syncDirection } = req.body;
      
      // If setting as write target, unset any existing write target for this vendor
      if (isWriteTarget === true) {
        const calendar = await storage.getVendorCalendar(req.params.id);
        if (calendar) {
          const currentWriteTarget = await storage.getWriteTargetCalendar(calendar.vendorId);
          if (currentWriteTarget && currentWriteTarget.id !== req.params.id) {
            await storage.updateVendorCalendar(currentWriteTarget.id, { isWriteTarget: false });
          }
        }
      }
      
      const calendar = await storage.updateVendorCalendar(req.params.id, req.body);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json(calendar);
    } catch (error) {
      console.error("Error updating vendor calendar:", error);
      res.status(500).json({ error: "Failed to update vendor calendar" });
    }
  });

  // Delete vendor calendar
  app.delete("/api/vendor-calendars/:id", async (req, res) => {
    try {
      const success = await storage.deleteVendorCalendar(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json({ message: "Calendar deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor calendar:", error);
      res.status(500).json({ error: "Failed to delete vendor calendar" });
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
  // VENDOR DEPOSIT PAYMENTS - Stripe integration for booking confirmations
  // ============================================================================

  // Create payment intent for vendor deposit
  app.post("/api/bookings/:bookingId/create-deposit-intent", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      // Load booking from database
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Prevent creating new payment intents for already paid deposits
      if (booking.depositPaid) {
        return res.status(400).json({ error: "Deposit has already been paid for this booking" });
      }
      
      // Load vendor details for description
      const vendor = await storage.getVendor(booking.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Calculate deposit amount (use stored amount or default to 25% of estimated cost)
      let depositAmount: number;
      if (booking.depositAmount) {
        depositAmount = parseFloat(booking.depositAmount);
      } else if (booking.estimatedCost) {
        const percentage = booking.depositPercentage || 25;
        depositAmount = parseFloat(booking.estimatedCost) * (percentage / 100);
      } else {
        return res.status(400).json({ 
          error: "Cannot calculate deposit - booking has no estimated cost or deposit amount set" 
        });
      }
      
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      const amountInCents = Math.round(depositAmount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          bookingId: booking.id,
          vendorId: vendor.id,
          vendorName: vendor.name,
          weddingId: booking.weddingId, // For cross-account verification
          type: 'vendor_deposit',
        },
        description: `Deposit for ${vendor.name} - Booking confirmation`,
      });
      
      // Update booking with payment intent ID
      await storage.updateBooking(bookingId, {
        depositAmount: depositAmount.toString(),
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: 'pending',
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        depositAmount,
        vendorName: vendor.name,
      });
    } catch (error: any) {
      console.error("Error creating deposit payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Confirm deposit payment (called after successful Stripe payment)
  // This endpoint verifies the payment with Stripe before marking as paid
  app.post("/api/bookings/:bookingId/confirm-deposit", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Prevent double-confirmation
      if (booking.depositPaid) {
        return res.status(400).json({ error: "Deposit has already been paid" });
      }
      
      // CRITICAL: Require a stored payment intent ID from create-deposit-intent
      if (!booking.stripePaymentIntentId) {
        console.error(`SECURITY ALERT: Booking ${bookingId} has no stored stripePaymentIntentId - create-deposit-intent must be called first`);
        return res.status(400).json({ error: "No payment intent exists for this booking. Please start the payment process again." });
      }
      
      // CRITICAL: Verify the submitted payment intent matches exactly what we stored
      if (booking.stripePaymentIntentId !== paymentIntentId) {
        console.error(`SECURITY ALERT: Payment intent mismatch for booking ${bookingId}: stored ${booking.stripePaymentIntentId}, received ${paymentIntentId}`);
        return res.status(400).json({ error: "Payment intent mismatch" });
      }
      
      // CRITICAL: Require stored deposit amount (set during create-deposit-intent)
      if (!booking.depositAmount) {
        console.error(`SECURITY ALERT: Booking ${bookingId} has no stored depositAmount`);
        return res.status(400).json({ error: "No deposit amount recorded for this booking" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      // CRITICAL: Verify payment status with Stripe directly - never trust client-supplied status
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify the retrieved payment intent ID matches what we stored (belt and suspenders)
      if (paymentIntent.id !== booking.stripePaymentIntentId) {
        console.error(`SECURITY ALERT: Retrieved PaymentIntent ID ${paymentIntent.id} does not match stored ${booking.stripePaymentIntentId}`);
        return res.status(400).json({ error: "Payment intent verification failed" });
      }
      
      // Verify the payment intent metadata matches this booking
      if (paymentIntent.metadata?.bookingId !== bookingId) {
        console.error(`SECURITY ALERT: Payment intent ${paymentIntentId} metadata bookingId (${paymentIntent.metadata?.bookingId}) does not match request bookingId (${bookingId})`);
        return res.status(400).json({ error: "Payment intent does not match this booking" });
      }
      
      // Verify the payment intent was created for this wedding (cross-account protection)
      if (paymentIntent.metadata?.weddingId !== booking.weddingId) {
        console.error(`SECURITY ALERT: Payment intent ${paymentIntentId} weddingId (${paymentIntent.metadata?.weddingId}) does not match booking weddingId (${booking.weddingId})`);
        return res.status(400).json({ error: "Payment intent does not belong to this wedding" });
      }
      
      // Verify currency is USD
      if (paymentIntent.currency !== 'usd') {
        console.error(`SECURITY ALERT: Payment intent currency ${paymentIntent.currency} is not USD for booking ${bookingId}`);
        return res.status(400).json({ error: "Invalid payment currency" });
      }
      
      // Verify the amount matches the canonical stored deposit amount
      const expectedDepositAmount = parseFloat(booking.depositAmount);
      const expectedAmountInCents = Math.round(expectedDepositAmount * 100);
      if (paymentIntent.amount !== expectedAmountInCents) {
        console.error(`SECURITY ALERT: Payment amount mismatch for booking ${bookingId}: expected ${expectedAmountInCents}, got ${paymentIntent.amount}`);
        return res.status(400).json({ error: "Payment amount mismatch" });
      }
      
      // Only mark as paid if Stripe confirms the payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: "Payment has not succeeded",
          paymentStatus: paymentIntent.status 
        });
      }
      
      // RACE CONDITION PROTECTION: Re-read booking to ensure no concurrent confirmation
      // This reduces the race window significantly (though full transactional locking would be ideal)
      const freshBooking = await storage.getBooking(bookingId);
      if (!freshBooking) {
        return res.status(404).json({ error: "Booking no longer exists" });
      }
      if (freshBooking.depositPaid) {
        console.log(`Booking ${bookingId} deposit already marked paid by concurrent request`);
        return res.status(400).json({ error: "Deposit has already been paid" });
      }
      if (freshBooking.stripePaymentIntentId !== paymentIntentId) {
        console.error(`SECURITY ALERT: Booking ${bookingId} stripePaymentIntentId changed during confirmation`);
        return res.status(400).json({ error: "Payment intent changed during confirmation" });
      }
      
      // Payment verified - update booking and clear the payment intent ID to prevent reuse
      const updatedBooking = await storage.updateBooking(bookingId, {
        stripePaymentStatus: 'succeeded',
        depositPaid: true,
        depositPaidDate: new Date(),
        status: 'confirmed',
        confirmedDate: new Date(),
        stripePaymentIntentId: null, // Clear to prevent any reuse attempts
      });
      
      console.log(`Booking ${bookingId} deposit confirmed: ${paymentIntent.amount} cents paid via ${paymentIntentId}`);
      
      res.json(updatedBooking);
    } catch (error: any) {
      console.error("Error confirming deposit payment:", error);
      res.status(500).json({ error: "Failed to confirm deposit payment: " + error.message });
    }
  });

  // Get booking with deposit details
  app.get("/api/bookings/:bookingId/deposit-status", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Calculate deposit if not set
      let depositAmount = booking.depositAmount ? parseFloat(booking.depositAmount) : null;
      if (!depositAmount && booking.estimatedCost) {
        const percentage = booking.depositPercentage || 25;
        depositAmount = parseFloat(booking.estimatedCost) * (percentage / 100);
      }
      
      res.json({
        bookingId: booking.id,
        depositAmount,
        depositPercentage: booking.depositPercentage || 25,
        depositPaid: booking.depositPaid || false,
        depositPaidDate: booking.depositPaidDate,
        stripePaymentStatus: booking.stripePaymentStatus,
        estimatedCost: booking.estimatedCost ? parseFloat(booking.estimatedCost) : null,
      });
    } catch (error) {
      console.error("Error fetching deposit status:", error);
      res.status(500).json({ error: "Failed to fetch deposit status" });
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
      
      let roles = await storage.getWeddingRolesByWedding(weddingId);
      
      // Ensure system roles have descriptions
      const roleDescriptions: Record<string, string> = {
        owner: "Full access to all sections",
        wedding_planner: "Access to: Guests, Invitations, Timeline, Tasks, Vendors, Photos, Documents, Concierge, Contracts, Website, Playlists, Messages",
        family_member: "Access to: Guest List (view), Timeline (view), Tasks (view), Vendors (view), Photos (edit), Playlists (edit)",
        guest_coordinator: "Access to: Guests (manage), Invitations (manage), Timeline (view), Concierge (edit)",
      };
      
      roles = roles.map(role => {
        if (role.isSystem && !role.description && roleDescriptions[role.name as keyof typeof roleDescriptions]) {
          return {
            ...role,
            description: roleDescriptions[role.name as keyof typeof roleDescriptions],
          };
        }
        return role;
      });
      
      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await storage.getRolePermissions(role.id);
          return { ...role, permissions };
        })
      );
      
      res.json(rolesWithPermissions);
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

  // Get current user's role for a wedding (for collaborator dashboard)
  app.get("/api/weddings/:weddingId/my-role", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Check if user is the wedding owner
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId === userId) {
        return res.json({ role: null, isOwner: true });
      }
      
      // Find collaborator record for this user
      const collaborators = await storage.getWeddingCollaboratorsByWedding(weddingId);
      const collaborator = collaborators.find(c => c.userId === userId && c.status === 'accepted');
      
      if (!collaborator) {
        return res.json({ role: null, isOwner: false });
      }
      
      // Get the role details
      const role = await storage.getWeddingRole(collaborator.roleId);
      
      res.json({ role: role || null, isOwner: false });
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
  // GUEST PLANNING SNAPSHOT - Comprehensive view for planning workflow
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-planning-snapshot", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const snapshot = await storage.getGuestPlanningSnapshot(weddingId);
      res.json(snapshot);
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

  // ============================================================================
  // REAL-TIME MASTER TIMELINE - Day-of coordination
  // ============================================================================

  // Get timeline with vendor tags and acknowledgment status for a wedding
  app.get("/api/weddings/:weddingId/timeline", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        // Check if user is a collaborator
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const timeline = await storage.getTimelineWithAcknowledgments(weddingId);
      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reorder events in the timeline (drag-and-drop)
  app.patch("/api/weddings/:weddingId/timeline/reorder", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const { orderedEventIds } = req.body;

      // Validate input
      const reorderSchema = z.object({
        orderedEventIds: z.array(z.string().uuid()).min(1),
      });

      const validationResult = reorderSchema.safeParse({ orderedEventIds });
      if (!validationResult.success) {
        return res.status(400).json({ error: "orderedEventIds must be an array of valid UUIDs" });
      }

      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const events = await storage.reorderEvents(weddingId, orderedEventIds, userId);
      
      // Broadcast the reorder to all connected clients
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: 'timeline_reordered',
          events: events.map(e => ({ id: e.id, order: e.order })),
        });
      }

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update event time and trigger vendor notifications
  app.patch("/api/events/:eventId/time", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { newTime, note } = req.body;

      // Validate input
      const timeChangeSchema = z.object({
        newTime: z.string().min(1, "newTime is required"),
        note: z.string().optional(),
      });

      const validationResult = timeChangeSchema.safeParse({ newTime, note });
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      // Get event and verify access
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const result = await storage.updateEventTime(eventId, newTime, userId, note);

      // Broadcast the time change to all connected clients
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(event.weddingId, {
          type: 'timeline_updated',
          eventId,
          eventName: result.event.name,
          oldTime: result.change.oldValue,
          newTime: result.change.newValue,
          changeId: result.change.id,
          note: result.change.note,
        });
      }

      // Send email notifications to tagged vendors
      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || wedding.partner2Name || 'The Couple';
      const weddingTitle = wedding.title || 'Your Wedding';

      // Send notifications in background (don't block response)
      const notificationPromises: Promise<void>[] = [];

      // Send email notifications
      result.taggedVendors
        .filter(v => v.email)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeEmail } = await import('./email');
              const baseUrl = process.env.REPL_SLUG 
                ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co`
                : 'http://localhost:5000';
              
              await sendTimelineChangeEmail({
                to: vendor.email!,
                vendorName: vendor.name,
                eventName: result.event.name,
                eventDate: result.event.date || undefined,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
                acknowledgeUrl: `${baseUrl}/vendor-dashboard?ack=${result.change.id}`,
              });
              console.log(`Sent timeline change email to ${vendor.email}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${vendor.email}:`, emailError);
            }
          })());
        });

      // Send SMS notifications (if vendor has phone number)
      result.taggedVendors
        .filter(v => v.phone)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeSMS } = await import('./twilio');
              await sendTimelineChangeSMS({
                vendorPhone: vendor.phone!,
                vendorName: vendor.name,
                eventName: result.event.name,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
              });
              console.log(`Sent timeline change SMS to ${vendor.phone}`);
            } catch (smsError) {
              console.error(`Failed to send SMS to ${vendor.phone}:`, smsError);
            }
          })());
        });

      Promise.all(notificationPromises).then(() => {
        // Mark notifications as sent
        storage.markNotificationsSent(result.change.id);
      });

      res.json({
        event: result.event,
        change: result.change,
        taggedVendors: result.taggedVendors.map(v => ({ id: v.id, name: v.name, email: v.email })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tag vendors to an event for notifications
  app.post("/api/events/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { vendorIds, notifyVia } = req.body;

      if (!vendorIds || !Array.isArray(vendorIds)) {
        return res.status(400).json({ error: "vendorIds array is required" });
      }

      // Get event and verify access
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const tags = await storage.tagVendorsToEvent(eventId, event.weddingId, vendorIds, notifyVia || 'email');
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get vendor tags for an event
  app.get("/api/events/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(eventId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent timeline changes for a wedding
  app.get("/api/weddings/:weddingId/timeline-changes", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const changes = await storage.getRecentTimelineChanges(weddingId, limit);
      res.json(changes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vendor acknowledges a timeline change
  app.post("/api/timeline-changes/:changeId/acknowledge", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;
      const { status, message } = req.body;

      if (!status || !['acknowledged', 'declined'].includes(status)) {
        return res.status(400).json({ error: "status must be 'acknowledged' or 'declined'" });
      }

      // Get vendor profile for this user
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can acknowledge timeline changes" });
      }

      // Find vendor by userId
      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      // Verify the vendor is tagged to this event
      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(change.eventId);
      const isTagged = tags.some(t => t.vendorId === vendor.id);
      if (!isTagged) {
        return res.status(403).json({ error: "You are not tagged to this event" });
      }

      const ack = await storage.acknowledgeChange(changeId, vendor.id, status, message);

      // Broadcast the acknowledgment to the wedding planners
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(change.weddingId, {
          type: 'vendor_ack',
          eventId: change.eventId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          changeId,
          status,
          acknowledgedAt: ack.acknowledgedAt,
        });
      }

      res.json(ack);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending acknowledgments for a vendor
  app.get("/api/vendor/pending-acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get vendor profile for this user
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can access this endpoint" });
      }

      // Find vendor by userId
      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      const pendingAcks = await storage.getPendingAcknowledgmentsForVendor(vendor.id);
      res.json(pendingAcks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get acknowledgments by change
  app.get("/api/timeline-changes/:changeId/acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;

      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      // Verify user has access
      const wedding = await storage.getWedding(change.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, change.weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const acks = await storage.getAcknowledgmentsByChange(changeId);
      res.json(acks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get booked vendors for a wedding (for tagging UI)
  app.get("/api/weddings/:weddingId/booked-vendors", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const bookings = await storage.getBookingsWithVendorsByWedding(weddingId);
      const bookedVendors = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'pending')
        .map(b => ({
          id: b.vendor.id,
          name: b.vendor.name,
          categories: b.vendor.categories,
          email: b.vendor.email,
          phone: b.vendor.phone,
        }));
      
      res.json(bookedVendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // ============================================================================
  // WEBSOCKET SERVER - Real-time updates for guests
  // ============================================================================
  // Use noServer mode to manually handle upgrades (avoids conflicts with Vite HMR)
  const wss = new WebSocketServer({ noServer: true });
  
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

  // ============================================================================
  // MESSAGING WEBSOCKET - Real-time message notifications
  // ============================================================================
  // Use noServer mode to manually handle upgrades (avoids conflicts with Vite HMR)
  const messageWss = new WebSocketServer({ noServer: true });
  
  // Track connections by conversationId for targeted notifications
  const messageConnections = new Map<string, Set<WebSocket>>();
  
  messageWss.on('error', (error) => {
    console.error('[WebSocket] Message server error:', error);
  });
  
  messageWss.on('connection', (ws, req) => {
    console.log('[WebSocket] New message connection from:', req.url);
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      console.log('[WebSocket] Connection rejected: no conversationId');
      ws.close(1008, 'conversationId required');
      return;
    }
    
    console.log('[WebSocket] Connected to conversation:', conversationId);
    
    if (!messageConnections.has(conversationId)) {
      messageConnections.set(conversationId, new Set());
    }
    messageConnections.get(conversationId)!.add(ws);
    
    ws.on('error', (error) => {
      console.error('[WebSocket] Client connection error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log('[WebSocket] Connection closed:', conversationId, 'code:', code, 'reason:', reason?.toString());
      messageConnections.get(conversationId)?.delete(ws);
      if (messageConnections.get(conversationId)?.size === 0) {
        messageConnections.delete(conversationId);
      }
    });
    
    ws.send(JSON.stringify({ type: 'connected', conversationId }));
  });
  
  (global as any).broadcastNewMessage = (conversationId: string, message: any) => {
    const connections = messageConnections.get(conversationId);
    if (connections) {
      const payload = JSON.stringify({ type: 'message:new', conversationId, message });
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  };

  // ============================================================================
  // MANUAL WEBSOCKET UPGRADE HANDLER - Route upgrades to correct WebSocket server
  // ============================================================================
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (pathname === '/ws/live-feed') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/messages') {
      messageWss.handleUpgrade(request, socket, head, (ws) => {
        messageWss.emit('connection', ws, request);
      });
    }
    // Don't destroy socket for unhandled paths - let Vite HMR handle its own upgrades
  });

  // ============================================================================
  // GOOGLE CALENDAR INTEGRATION - Vendor availability from external calendars
  // ============================================================================

  // List connected calendars
  app.get("/api/calendar/list", async (req, res) => {
    try {
      const { listCalendars } = await import("./googleCalendar");
      const calendars = await listCalendars();
      res.json(calendars);
    } catch (error: any) {
      console.error("Error listing calendars:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to list calendars" });
    }
  });

  // Get calendar events for a date range
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const { calendarId = 'primary', startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getCalendarEvents } = await import("./googleCalendar");
      const events = await getCalendarEvents(
        calendarId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  // Get free/busy information
  app.get("/api/calendar/freebusy", async (req, res) => {
    try {
      const { calendarId = 'primary', startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getFreeBusy } = await import("./googleCalendar");
      const busySlots = await getFreeBusy(
        calendarId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(busySlots);
    } catch (error: any) {
      console.error("Error fetching free/busy:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch free/busy information" });
    }
  });

  // Get availability windows for booking
  app.get("/api/calendar/availability", async (req, res) => {
    try {
      const { 
        calendarId = 'primary', 
        startDate, 
        endDate,
        workingHoursStart = '9',
        workingHoursEnd = '18',
        slotDuration = '60'
      } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getAvailabilityWindows } = await import("./googleCalendar");
      const availability = await getAvailabilityWindows(
        calendarId as string,
        new Date(startDate as string),
        new Date(endDate as string),
        parseInt(workingHoursStart as string),
        parseInt(workingHoursEnd as string),
        parseInt(slotDuration as string)
      );
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  // Check if a specific slot is available
  app.get("/api/calendar/check-slot", async (req, res) => {
    try {
      const { calendarId = 'primary', startTime, endTime } = req.query;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }

      const { isSlotAvailable } = await import("./googleCalendar");
      const available = await isSlotAvailable(
        calendarId as string,
        new Date(startTime as string),
        new Date(endTime as string)
      );
      res.json({ available });
    } catch (error: any) {
      console.error("Error checking slot:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to check slot availability" });
    }
  });

  // Create a calendar event (for confirmed bookings)
  app.post("/api/calendar/events", async (req, res) => {
    try {
      const { calendarId = 'primary', summary, description, startTime, endTime, attendees } = req.body;
      
      if (!summary || !startTime || !endTime) {
        return res.status(400).json({ error: "summary, startTime, and endTime are required" });
      }

      const { createCalendarEvent } = await import("./googleCalendar");
      const event = await createCalendarEvent(
        calendarId,
        summary,
        description || '',
        new Date(startTime),
        new Date(endTime),
        attendees
      );
      res.json(event);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });

  // Sync vendor availability from Google Calendar to the app
  app.post("/api/vendors/:vendorId/sync-calendar", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { calendarId = 'primary', startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const { getCalendarEvents } = await import("./googleCalendar");
      const events = await getCalendarEvents(
        calendarId,
        new Date(startDate),
        new Date(endDate)
      );

      // Convert calendar events to vendor availability records
      const availabilityRecords = [];
      for (const event of events) {
        const dateStr = event.start.toISOString().split('T')[0];
        const timeSlot = event.isAllDay 
          ? 'all-day'
          : `${event.start.toTimeString().slice(0, 5)}-${event.end.toTimeString().slice(0, 5)}`;

        // Create blocked availability for busy times
        const record = await storage.createVendorAvailability({
          vendorId,
          date: new Date(dateStr),
          timeSlot,
          status: 'blocked',
          notes: `Synced from Google Calendar: ${event.summary}`,
        });
        availabilityRecords.push(record);
      }

      res.json({ 
        message: `Synced ${events.length} events from Google Calendar`,
        records: availabilityRecords 
      });
    } catch (error: any) {
      console.error("Error syncing vendor calendar:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Google Calendar not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to sync vendor calendar" });
    }
  });

  // ============================================================================
  // OUTLOOK CALENDAR INTEGRATION - Vendor availability from Microsoft 365
  // ============================================================================

  // List connected Outlook calendars (requires authentication)
  app.get("/api/outlook-calendar/list", await requireAuth(storage, false), async (req, res) => {
    try {
      const { listOutlookCalendars } = await import("./outlookCalendar");
      const calendars = await listOutlookCalendars();
      res.json(calendars);
    } catch (error: any) {
      console.error("Error listing Outlook calendars:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to list Outlook calendars" });
    }
  });

  // Get Outlook calendar events for a date range (requires authentication)
  app.get("/api/outlook-calendar/events", await requireAuth(storage, false), async (req, res) => {
    try {
      const { calendarId = 'primary', startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getOutlookCalendarEvents } = await import("./outlookCalendar");
      const events = await getOutlookCalendarEvents(
        calendarId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching Outlook calendar events:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch Outlook calendar events" });
    }
  });

  // Get Outlook free/busy information (requires authentication)
  app.get("/api/outlook-calendar/freebusy", await requireAuth(storage, false), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getOutlookFreeBusy } = await import("./outlookCalendar");
      const busySlots = await getOutlookFreeBusy(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(busySlots);
    } catch (error: any) {
      console.error("Error fetching Outlook free/busy:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch Outlook free/busy information" });
    }
  });

  // Get Outlook availability windows for booking (requires authentication)
  app.get("/api/outlook-calendar/availability", await requireAuth(storage, false), async (req, res) => {
    try {
      const { 
        startDate, 
        endDate,
        workingHoursStart = '9',
        workingHoursEnd = '18',
        slotDuration = '60'
      } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const { getOutlookAvailabilityWindows } = await import("./outlookCalendar");
      const availability = await getOutlookAvailabilityWindows(
        new Date(startDate as string),
        new Date(endDate as string),
        parseInt(workingHoursStart as string),
        parseInt(workingHoursEnd as string),
        parseInt(slotDuration as string)
      );
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching Outlook availability:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to fetch Outlook availability" });
    }
  });

  // Check if a specific Outlook slot is available (requires authentication)
  app.get("/api/outlook-calendar/check-slot", await requireAuth(storage, false), async (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }

      const { isOutlookSlotAvailable } = await import("./outlookCalendar");
      const available = await isOutlookSlotAvailable(
        new Date(startTime as string),
        new Date(endTime as string)
      );
      res.json({ available });
    } catch (error: any) {
      console.error("Error checking Outlook slot:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to check Outlook slot availability" });
    }
  });

  // Create a calendar event in Outlook (for confirmed bookings, requires authentication)
  app.post("/api/outlook-calendar/events", await requireAuth(storage, false), async (req, res) => {
    try {
      const { calendarId = 'primary', subject, body, startTime, endTime, attendees } = req.body;
      
      if (!subject || !startTime || !endTime) {
        return res.status(400).json({ error: "subject, startTime, and endTime are required" });
      }

      const { createOutlookCalendarEvent } = await import("./outlookCalendar");
      const event = await createOutlookCalendarEvent(
        calendarId,
        subject,
        body || '',
        new Date(startTime),
        new Date(endTime),
        attendees
      );
      res.json(event);
    } catch (error: any) {
      console.error("Error creating Outlook calendar event:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to create Outlook calendar event" });
    }
  });

  // Sync vendor availability from Outlook Calendar to the app (requires authentication)
  app.post("/api/vendors/:vendorId/sync-outlook-calendar", await requireAuth(storage, false), async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { calendarId = 'primary', startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const { getOutlookCalendarEvents } = await import("./outlookCalendar");
      const events = await getOutlookCalendarEvents(
        calendarId,
        new Date(startDate),
        new Date(endDate)
      );

      // Convert calendar events to vendor availability records
      const availabilityRecords = [];
      for (const event of events) {
        const dateStr = event.start.toISOString().split('T')[0];
        const timeSlot = event.isAllDay 
          ? 'all-day'
          : `${event.start.toTimeString().slice(0, 5)}-${event.end.toTimeString().slice(0, 5)}`;

        // Create blocked availability for busy times
        const record = await storage.createVendorAvailability({
          vendorId,
          date: new Date(dateStr),
          timeSlot,
          status: 'blocked',
          notes: `Synced from Outlook Calendar: ${event.subject}`,
        });
        availabilityRecords.push(record);
      }

      res.json({ 
        message: `Synced ${events.length} events from Outlook Calendar`,
        records: availabilityRecords 
      });
    } catch (error: any) {
      console.error("Error syncing Outlook vendor calendar:", error);
      if (error.message?.includes('not connected')) {
        return res.status(401).json({ error: "Outlook not connected", needsAuth: true });
      }
      res.status(500).json({ error: "Failed to sync Outlook vendor calendar" });
    }
  });

  // ============================================================================
  // VENDOR TEAMMATE MANAGEMENT
  // ============================================================================

  // Get teammates for a vendor
  app.get("/api/vendor-teammates", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.query;
      if (!vendorId) {
        return res.status(400).json({ error: "vendorId is required" });
      }

      // Verify user has access to this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId as string, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const teammates = await storage.getVendorTeammatesByVendor(vendorId as string);
      res.json(teammates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending invitations for a vendor
  app.get("/api/vendor-teammates/invitations", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.query;
      if (!vendorId) {
        return res.status(400).json({ error: "vendorId is required" });
      }

      // Verify user has access to this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId as string, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getVendorTeammateInvitationsByVendor(vendorId as string);
      // Filter to only pending invitations
      const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
      res.json(pendingInvitations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new teammate invitation
  app.post("/api/vendor-teammates/invitations", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId, email, permissions, displayName } = req.body;
      
      if (!vendorId || !email || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "vendorId, email, and permissions are required" });
      }

      // Validate permissions
      const validPermissions = permissions.filter(p => VENDOR_TEAMMATE_PERMISSIONS.includes(p));
      if (validPermissions.length === 0) {
        return res.status(400).json({ error: "At least one valid permission is required" });
      }

      // Verify user has access to manage teammates for this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. You need team_manage permission." });
      }

      // Check if invitation already exists for this email and vendor
      const existingInvitations = await storage.getVendorTeammateInvitationsByVendor(vendorId);
      const pendingInvite = existingInvitations.find(
        inv => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
      );
      if (pendingInvite) {
        return res.status(400).json({ error: "An invitation is already pending for this email" });
      }

      // Check if user is already a teammate
      const existingTeammates = await storage.getVendorTeammatesByVendor(vendorId);
      const existingTeammate = existingTeammates.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (existingTeammate) {
        return res.status(400).json({ error: "This email is already a teammate" });
      }

      // Generate invite token
      const crypto = await import("crypto");
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await storage.createVendorTeammateInvitation({
        vendorId,
        email,
        permissions: validPermissions,
        displayName,
        invitedBy: userId,
        inviteToken,
        inviteTokenExpires,
      });

      // Send invitation email
      try {
        const vendor = await storage.getVendor(vendorId);
        const inviteUrl = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : ''}/vendor-invite?token=${inviteToken}`;
        
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: "Viah.me <noreply@viah.me>",
          to: email,
          subject: `You've been invited to join ${vendor?.name || 'a vendor'} on Viah.me`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're Invited!</h2>
              <p>You've been invited to join <strong>${vendor?.name || 'a vendor team'}</strong> on Viah.me, the South Asian wedding management platform.</p>
              <p>Click the button below to accept this invitation and create your account:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
              </p>
              <p style="color: #666;">This invitation will expire in 7 days.</p>
              <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the request if email fails - invitation is still created
      }

      res.json(invitation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept a teammate invitation
  app.post("/api/vendor-teammates/accept", async (req, res) => {
    try {
      const { token, email, password, name } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Invitation token is required" });
      }

      // Get the invitation
      const invitation = await storage.getVendorTeammateInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invalid or expired invitation" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "This invitation has already been used or revoked" });
      }

      if (new Date() > invitation.inviteTokenExpires) {
        return res.status(400).json({ error: "This invitation has expired" });
      }

      // Check if user already exists with this email
      let user = await storage.getUserByEmail(invitation.email);
      
      if (!user) {
        // Need to create a new user - require password
        if (!password) {
          return res.status(400).json({ 
            error: "Password required for new account",
            needsPassword: true,
            email: invitation.email 
          });
        }

        const bcrypt = await import("bcrypt");
        const passwordHash = await bcrypt.hash(password, 10);
        
        user = await storage.createUser({
          email: invitation.email,
          username: invitation.email,
          password: passwordHash,
          role: 'vendor', // Teammates get vendor role
          emailVerified: true, // Auto-verify since they got the email
        });
      }

      // Accept the invitation and create teammate record
      const result = await storage.acceptVendorTeammateInvitation(token, user.id);

      // Update display name if provided
      if (name && result.teammate) {
        await storage.updateVendorTeammate(result.teammate.id, { displayName: name });
      }

      // Set up session for the user
      if (req.session) {
        req.session.userId = user.id;
      }

      res.json({ 
        success: true, 
        teammate: result.teammate,
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update teammate permissions
  app.patch("/api/vendor-teammates/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { id } = req.params;
      const { permissions } = req.body;

      const teammate = await storage.getVendorTeammate(id);
      if (!teammate) {
        return res.status(404).json({ error: "Teammate not found" });
      }

      // Verify user has access to manage teammates for this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, teammate.vendorId, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate permissions
      if (permissions && Array.isArray(permissions)) {
        const validPermissions = permissions.filter(p => VENDOR_TEAMMATE_PERMISSIONS.includes(p));
        if (validPermissions.length === 0) {
          return res.status(400).json({ error: "At least one valid permission is required" });
        }

        const updated = await storage.updateVendorTeammate(id, { permissions: validPermissions });
        res.json(updated);
      } else {
        res.status(400).json({ error: "permissions array is required" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke a teammate
  app.delete("/api/vendor-teammates/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { id } = req.params;

      const teammate = await storage.getVendorTeammate(id);
      if (!teammate) {
        return res.status(404).json({ error: "Teammate not found" });
      }

      // Verify user has access to manage teammates for this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, teammate.vendorId, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Don't allow revoking yourself
      if (teammate.userId === userId) {
        return res.status(400).json({ error: "You cannot remove yourself from the team" });
      }

      const revoked = await storage.revokeVendorTeammate(id, userId);
      res.json(revoked);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke a pending invitation
  app.delete("/api/vendor-teammates/invitations/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { id } = req.params;

      const invitation = await storage.getVendorTeammateInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Verify user has access to manage teammates for this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, invitation.vendorId, 'team_manage');
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const revoked = await storage.revokeVendorTeammateInvitation(id);
      res.json(revoked);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get available permissions list (for UI)
  app.get("/api/vendor-teammates/permissions", async (req, res) => {
    res.json(VENDOR_TEAMMATE_PERMISSIONS);
  });

  // ============================================================================
  // VENDOR LEADS - Lead qualification and nurturing system
  // ============================================================================

  // Get all leads for a vendor
  app.get("/api/vendor-leads/:vendorId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.params;
      
      // Verify user has access to this vendor
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const leads = await storage.getVendorLeadsByVendor(vendorId);
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single lead
  app.get("/api/vendor-leads/:vendorId/:leadId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId, leadId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const lead = await storage.getVendorLead(leadId);
      if (!lead || lead.vendorId !== vendorId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Also fetch activity log
      const activity = await storage.getLeadActivityLog(leadId);
      
      res.json({ lead, activity });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a lead manually
  app.post("/api/vendor-leads/:vendorId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertVendorLeadSchema.parse({
        ...req.body,
        vendorId,
        sourceType: req.body.sourceType || 'manual',
      });

      // Calculate initial lead score
      const scores = calculateLeadScore(validatedData);
      
      const lead = await storage.createVendorLead({
        ...validatedData,
        ...scores,
      });

      // Log the creation
      await storage.createLeadActivityLog({
        leadId: lead.id,
        activityType: 'note_added',
        description: 'Lead created manually',
        performedBy: userId,
      });

      res.json(lead);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update a lead (status, notes, scores, etc.)
  app.patch("/api/vendor-leads/:vendorId/:leadId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId, leadId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existingLead = await storage.getVendorLead(leadId);
      if (!existingLead || existingLead.vendorId !== vendorId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Track status changes
      const oldStatus = existingLead.status;
      const newStatus = req.body.status;

      const updates: Partial<VendorLead> = { ...req.body };
      
      // Update status timestamps
      if (newStatus && newStatus !== oldStatus) {
        updates.statusChangedAt = new Date();
        if (newStatus === 'won') {
          updates.wonAt = new Date();
        } else if (newStatus === 'lost') {
          updates.lostAt = new Date();
        }
      }

      // If marking as contacted, update last contacted
      if (newStatus === 'contacted' && oldStatus === 'new') {
        updates.lastContactedAt = new Date();
      }

      const lead = await storage.updateVendorLead(leadId, updates);

      // Log status change
      if (newStatus && newStatus !== oldStatus) {
        await storage.createLeadActivityLog({
          leadId,
          activityType: 'status_change',
          description: `Status changed from "${oldStatus}" to "${newStatus}"`,
          performedBy: userId,
          metadata: { oldStatus, newStatus },
        });
      }

      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a note/activity to a lead
  app.post("/api/vendor-leads/:vendorId/:leadId/activity", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId, leadId } = req.params;
      const { activityType, description, metadata } = req.body;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const lead = await storage.getVendorLead(leadId);
      if (!lead || lead.vendorId !== vendorId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const activity = await storage.createLeadActivityLog({
        leadId,
        activityType: activityType || 'note_added',
        description,
        metadata,
        performedBy: userId,
      });

      // Update engagement score based on activity
      const newEngagementScore = Math.min(100, (lead.engagementScore || 0) + 5);
      await storage.updateVendorLead(leadId, {
        engagementScore: newEngagementScore,
        overallScore: calculateOverallScore({
          urgencyScore: lead.urgencyScore || 0,
          budgetFitScore: lead.budgetFitScore || 0,
          engagementScore: newEngagementScore,
        }),
      });

      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get lead analytics/stats for a vendor
  app.get("/api/vendor-leads/:vendorId/analytics", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const leads = await storage.getVendorLeadsByVendor(vendorId);
      
      const analytics = {
        total: leads.length,
        byStatus: {
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          proposal_sent: leads.filter(l => l.status === 'proposal_sent').length,
          negotiating: leads.filter(l => l.status === 'negotiating').length,
          won: leads.filter(l => l.status === 'won').length,
          lost: leads.filter(l => l.status === 'lost').length,
          nurturing: leads.filter(l => l.status === 'nurturing').length,
        },
        byPriority: {
          hot: leads.filter(l => l.priority === 'hot').length,
          warm: leads.filter(l => l.priority === 'warm').length,
          medium: leads.filter(l => l.priority === 'medium').length,
          cold: leads.filter(l => l.priority === 'cold').length,
        },
        conversionRate: leads.length > 0 
          ? (leads.filter(l => l.status === 'won').length / leads.length * 100).toFixed(1)
          : 0,
        avgScore: leads.length > 0
          ? Math.round(leads.reduce((sum, l) => sum + (l.overallScore || 0), 0) / leads.length)
          : 0,
        needsFollowUp: leads.filter(l => 
          l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= new Date()
        ).length,
      };

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get nurture sequences for a vendor
  app.get("/api/vendor-leads/:vendorId/sequences", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sequences = await storage.getLeadNurtureSequencesByVendor(vendorId);
      
      // For each sequence, get its steps
      const sequencesWithSteps = await Promise.all(
        sequences.map(async (seq) => {
          const steps = await storage.getLeadNurtureStepsBySequence(seq.id);
          return { ...seq, steps };
        })
      );

      res.json(sequencesWithSteps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a nurture sequence
  app.post("/api/vendor-leads/:vendorId/sequences", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId } = req.params;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { steps, ...sequenceData } = req.body;
      
      const validatedSequence = insertLeadNurtureSequenceSchema.parse({
        ...sequenceData,
        vendorId,
      });

      const sequence = await storage.createLeadNurtureSequence(validatedSequence);

      // Create steps if provided
      if (steps && Array.isArray(steps)) {
        for (const step of steps) {
          await storage.createLeadNurtureStep({
            ...step,
            sequenceId: sequence.id,
          });
        }
      }

      res.json(sequence);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Send a nurture email to a lead
  app.post("/api/vendor-leads/:vendorId/:leadId/send-email", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { vendorId, leadId } = req.params;
      const { subject, body } = req.body;
      
      // Verify access
      const hasAccess = await storage.hasVendorTeammateAccess(userId, vendorId);
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === userId);
      
      if (!hasAccess && (!userVendor || userVendor.id !== vendorId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const lead = await storage.getVendorLead(leadId);
      if (!lead || lead.vendorId !== vendorId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (!lead.coupleEmail) {
        return res.status(400).json({ error: "Lead does not have an email address" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Send email using Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@viah.me';
      
      await resend.emails.send({
        from: `${vendor.name} via Viah.me <${fromEmail}>`,
        to: lead.coupleEmail,
        subject: subject,
        html: body,
      });

      // Log the email sent
      await storage.createLeadActivityLog({
        leadId,
        activityType: 'email_sent',
        description: `Email sent: "${subject}"`,
        metadata: { subject },
        performedBy: userId,
      });

      // Update lead
      await storage.updateVendorLead(leadId, {
        lastContactedAt: new Date(),
        followUpCount: (lead.followUpCount || 0) + 1,
      });

      res.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
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

// ============================================================================
// LEAD SCORING FUNCTIONS
// ============================================================================

interface LeadScoreInput {
  eventDate?: Date | null;
  estimatedBudget?: string | null;
  guestCount?: number | null;
  tradition?: string | null;
  city?: string | null;
}

interface LeadScores {
  urgencyScore: number;
  budgetFitScore: number;
  qualificationScore: number;
  overallScore: number;
  priority: 'hot' | 'warm' | 'medium' | 'cold';
}

function calculateLeadScore(lead: LeadScoreInput): LeadScores {
  // Urgency score based on wedding date proximity
  let urgencyScore = 50; // Default medium
  if (lead.eventDate) {
    const eventDate = new Date(lead.eventDate);
    const now = new Date();
    const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent < 0) {
      urgencyScore = 0; // Past event
    } else if (daysUntilEvent <= 30) {
      urgencyScore = 100; // Very urgent
    } else if (daysUntilEvent <= 90) {
      urgencyScore = 85;
    } else if (daysUntilEvent <= 180) {
      urgencyScore = 70;
    } else if (daysUntilEvent <= 365) {
      urgencyScore = 50;
    } else {
      urgencyScore = 30; // Far away
    }
  }

  // Budget fit score - higher budget generally means more serious lead
  let budgetFitScore = 50;
  if (lead.estimatedBudget) {
    const budget = lead.estimatedBudget.toLowerCase();
    if (budget.includes('50000') || budget.includes('50k') || budget.includes('premium') || budget.includes('luxury')) {
      budgetFitScore = 100;
    } else if (budget.includes('30000') || budget.includes('30k') || budget.includes('high')) {
      budgetFitScore = 85;
    } else if (budget.includes('20000') || budget.includes('20k') || budget.includes('medium')) {
      budgetFitScore = 70;
    } else if (budget.includes('10000') || budget.includes('10k') || budget.includes('budget')) {
      budgetFitScore = 50;
    } else if (budget.includes('5000') || budget.includes('5k') || budget.includes('low')) {
      budgetFitScore = 30;
    }
  }

  // Qualification score based on completeness of info
  let qualificationScore = 0;
  if (lead.eventDate) qualificationScore += 25;
  if (lead.estimatedBudget) qualificationScore += 25;
  if (lead.guestCount) qualificationScore += 25;
  if (lead.tradition || lead.city) qualificationScore += 25;

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (urgencyScore * 0.4) + 
    (budgetFitScore * 0.3) + 
    (qualificationScore * 0.3)
  );

  // Determine priority based on overall score
  let priority: 'hot' | 'warm' | 'medium' | 'cold' = 'medium';
  if (overallScore >= 80) {
    priority = 'hot';
  } else if (overallScore >= 60) {
    priority = 'warm';
  } else if (overallScore >= 40) {
    priority = 'medium';
  } else {
    priority = 'cold';
  }

  return {
    urgencyScore,
    budgetFitScore,
    qualificationScore,
    overallScore,
    priority,
  };
}

function calculateOverallScore(scores: { urgencyScore: number; budgetFitScore: number; engagementScore: number }): number {
  return Math.round(
    (scores.urgencyScore * 0.35) + 
    (scores.budgetFitScore * 0.25) + 
    (scores.engagementScore * 0.4)
  );
}
