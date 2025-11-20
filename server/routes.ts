import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, parseConversationId } from "./storage";
import {
  insertWeddingSchema,
  insertEventSchema,
  insertVendorSchema,
  insertBookingSchema,
  insertBudgetCategorySchema,
  insertGuestSchema,
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
} from "@shared/schema";
import { seedVendors, seedBudgetBenchmarks } from "./seed-data";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // WEDDINGS
  // ============================================================================

  app.get("/api/weddings", async (req, res) => {
    try {
      // For MVP, return all weddings for a demo user
      const weddings = await storage.getWeddingsByUser("user-1");
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

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
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

  app.patch("/api/guests/:id", async (req, res) => {
    try {
      const guest = await storage.updateGuest(req.params.id, req.body);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
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

  const httpServer = createServer(app);
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
