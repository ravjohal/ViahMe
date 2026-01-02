import type { Express } from "express";
import { z } from "zod";
import { parseConversationId, generateConversationId, type IStorage } from "./storage";
import { calculateDueDate } from "./task-templates";
import { requireAuth, requireRole, type AuthRequest } from "./auth-middleware";
import {
  insertWeddingSchema,
  insertEventSchema,
  insertEventCostItemSchema,
  insertTaskSchema,
  insertContractSchema,
  insertMessageSchema,
  insertQuickReplyTemplateSchema,
  insertFollowUpReminderSchema,
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
  VENDOR_TEAMMATE_PERMISSIONS,
  insertVendorLeadSchema,
  insertLeadNurtureSequenceSchema,
  insertLeadNurtureStepSchema,
  insertLeadActivityLogSchema,
  coupleSubmitVendorSchema,
  type InsertVendor,
  type VendorLead,
} from "@shared/schema";
import {
  sendBookingConfirmationEmail,
  sendVendorNotificationEmail,
  sendRsvpConfirmationEmail,
  sendInvitationEmail,
} from "./email";

interface ViewerSession {
  viewerId: string;
  weddingId: string;
  lastHeartbeat: number;
}

interface ViewerUtils {
  activeViewers: Map<string, ViewerSession>;
  getViewerCount: (weddingId: string) => number;
  cleanupStaleViewers: () => void;
}

export async function registerLegacyRoutes(app: Express, storage: IStorage, viewerUtils: ViewerUtils): Promise<void> {
  const { activeViewers, getViewerCount, cleanupStaleViewers } = viewerUtils;

  // NOTE: Lead inbox, quick reply templates, follow-up reminders, reviews, 
  // playlists, songs, votes, documents, and object storage routes have been
  // migrated to modular routers in server/routes/
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

  // ============================================================================
  // WEDDING REGISTRIES
  // ============================================================================

  // Get all active registry retailers (preset options)
  app.get("/api/registry-retailers", async (req, res) => {
    try {
      const retailers = await storage.getActiveRegistryRetailers();
      res.json(retailers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registry retailers" });
    }
  });

  // Get registries for a wedding (with retailer details)
  app.get("/api/weddings/:weddingId/registries", async (req, res) => {
    try {
      const registries = await storage.getRegistriesWithRetailersByWedding(req.params.weddingId);
      res.json(registries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registries" });
    }
  });

  // Create a registry for a wedding
  app.post("/api/weddings/:weddingId/registries", async (req, res) => {
    try {
      const { insertWeddingRegistrySchema } = await import("@shared/schema");
      const validatedData = insertWeddingRegistrySchema.parse({
        ...req.body,
        weddingId: req.params.weddingId,
      });
      const registry = await storage.createWeddingRegistry(validatedData);
      res.status(201).json(registry);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create registry" });
    }
  });

  // Update a registry
  app.patch("/api/registries/:id", async (req, res) => {
    try {
      const { insertWeddingRegistrySchema } = await import("@shared/schema");
      const validatedData = insertWeddingRegistrySchema.partial().parse(req.body);
      const registry = await storage.updateWeddingRegistry(req.params.id, validatedData);
      if (!registry) {
        return res.status(404).json({ error: "Registry not found" });
      }
      res.json(registry);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update registry" });
    }
  });

  // Delete a registry
  app.delete("/api/registries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWeddingRegistry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Registry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete registry" });
    }
  });

  // Get public wedding data by slug (for guest website)
  app.get("/api/public/wedding/:slug", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      // Check if user is owner (allow preview even when unpublished)
      const authReq = req as AuthenticatedRequest;
      const isOwner = authReq.session?.userId === wedding.userId;
      
      // If not published and not owner, deny access
      if (!website.isPublished && !isOwner) {
        return res.status(404).json({ error: "This wedding website hasn't been published yet" });
      }

      const events = await storage.getEventsByWedding(website.weddingId);
      const registries = await storage.getRegistriesWithRetailersByWedding(website.weddingId);

      res.json({
        website,
        wedding,
        events: events.sort((a, b) => a.order - b.order),
        registries,
        isPreview: !website.isPublished && isOwner,
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

  // Guest FAQ chatbot (public endpoint for wedding websites)
  app.post("/api/public/wedding/:slug/chat", async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;
      
      if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ error: "Invalid message" });
      }

      // Validate conversation history format
      if (!Array.isArray(conversationHistory) || 
          !conversationHistory.every((m: any) => 
            m && typeof m.role === 'string' && 
            ['user', 'assistant'].includes(m.role) && 
            typeof m.content === 'string' && 
            m.content.length <= 2000
          )) {
        return res.status(400).json({ error: "Invalid conversation history" });
      }

      // Get wedding website and related data
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      // Only allow chat on published websites
      if (!website.isPublished) {
        return res.status(404).json({ error: "This wedding website hasn't been published yet" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const events = await storage.getEventsByWedding(website.weddingId);

      // Build context for AI
      const { chatWithGuestConcierge } = await import('./ai/gemini');
      
      const response = await chatWithGuestConcierge(
        message.slice(0, 1000),
        conversationHistory.slice(-10), // Keep last 10 messages for context
        {
          coupleName: website.welcomeTitle || undefined,
          partner1Name: wedding.partner1Name || undefined,
          partner2Name: wedding.partner2Name || undefined,
          weddingDate: wedding.weddingDate?.toISOString() || undefined,
          tradition: wedding.tradition || undefined,
          welcomeMessage: website.welcomeMessage || undefined,
          coupleStory: website.coupleStory || undefined,
          travelInfo: website.travelInfo || undefined,
          accommodationInfo: website.accommodationInfo || undefined,
          thingsToDoInfo: website.thingsToDoInfo || undefined,
          faqInfo: website.faqInfo || undefined,
          events: events.map(e => ({
            name: e.name,
            date: e.date?.toISOString() || undefined,
            time: e.time || undefined,
            location: e.location || undefined,
            dressCode: e.dressCode || undefined,
            locationDetails: e.locationDetails || undefined,
          })),
        }
      );

      res.json({ response });
    } catch (error) {
      console.error("Error in guest chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
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
      
      const households = await storage.getHouseholdsByWedding(weddingId);
      const householdNames = new Set(households.map(h => h.name.toLowerCase().trim()));
      const householdEmails = new Set(households.filter(h => h.email).map(h => h.email!.toLowerCase().trim()));
      
      const suggestionsWithDuplicates = suggestions.map(suggestion => {
        const nameMatch = householdNames.has(suggestion.householdName?.toLowerCase().trim() || '');
        const emailMatch = suggestion.contactEmail && householdEmails.has(suggestion.contactEmail.toLowerCase().trim());
        return {
          ...suggestion,
          potentialDuplicate: nameMatch || emailMatch,
          duplicateReason: nameMatch ? 'name' : emailMatch ? 'email' : null,
        };
      });
      
      res.json(suggestionsWithDuplicates);
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

  app.patch("/api/guest-suggestions/:id/status", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const { status } = req.body;
      const validStatuses = ["pending", "under_discussion", "approved", "declined", "frozen", "waitlisted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const result = await storage.updateGuestSuggestion(req.params.id, { status });
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_status_changed",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName, newStatus: status },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ============================================================================
  // GUEST SIDE MANAGEMENT - Bride/Groom side features with privacy
  // ============================================================================

  app.get("/api/weddings/:weddingId/side-statistics", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this wedding's statistics" });
      }
      
      const stats = await storage.getSideStatistics(weddingId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weddings/:weddingId/guests-by-side/:side", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this wedding's guests" });
      }
      
      const side = req.params.side as 'bride' | 'groom' | 'mutual';
      const guests = await storage.getGuestsBySide(weddingId, side);
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/share-guests", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this wedding" });
      }
      
      const { guestIds } = req.body;
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({ error: "guestIds array is required" });
      }
      
      const guests = await storage.shareGuestsWithPartner(weddingId, guestIds);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: req.params.weddingId,
        collaboratorId: null,
        userId,
        action: "guests_shared",
        targetType: "guest",
        targetId: guestIds.join(','),
        details: { count: guestIds.length },
      });
      
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guests/update-consensus-status", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { guestIds, status, weddingId } = req.body;
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({ error: "guestIds array is required" });
      }
      if (!['pending', 'under_discussion', 'approved', 'declined', 'frozen'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Verify wedding ownership if weddingId is provided
      if (weddingId) {
        const wedding = await storage.getWedding(weddingId);
        if (!wedding || wedding.userId !== userId) {
          return res.status(403).json({ error: "Not authorized to modify these guests" });
        }
      }
      
      const guests = await storage.updateGuestConsensusStatus(guestIds, status);
      res.json(guests);
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
}
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
