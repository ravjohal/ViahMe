import { Router } from "express";
import type { IStorage } from "../storage";
import { insertWeddingWebsiteSchema, insertWeddingRegistrySchema } from "@shared/schema";

interface AuthenticatedRequest {
  session?: { userId?: string };
}

export function createWeddingWebsitesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/wedding/:weddingId", async (req, res) => {
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

  router.get("/slug/:slug", async (req, res) => {
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

  router.post("/", async (req, res) => {
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

  router.patch("/:id", async (req, res) => {
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

  router.patch("/:id/publish", async (req, res) => {
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

  return router;
}

export function createRegistriesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/retailers", async (req, res) => {
    try {
      const retailers = await storage.getActiveRegistryRetailers();
      res.json(retailers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registry retailers" });
    }
  });

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const registries = await storage.getRegistriesWithRetailersByWedding(req.params.weddingId);
      res.json(registries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registries" });
    }
  });

  router.post("/wedding/:weddingId", async (req, res) => {
    try {
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

  router.patch("/:id", async (req, res) => {
    try {
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

  router.delete("/:id", async (req, res) => {
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

  return router;
}

export function createPublicWeddingRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/wedding/:slug", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const authReq = req as AuthenticatedRequest;
      const isOwner = authReq.session?.userId === wedding.userId;
      
      if (!website.isPublished && !isOwner) {
        return res.status(404).json({ error: "This wedding website hasn't been published yet" });
      }

      const events = await storage.getEventsByWedding(website.weddingId);
      const registries = await storage.getRegistriesWithRetailersByWedding(website.weddingId);
      
      // Fetch only published ceremony explainers for the guest website (filter at storage layer)
      let ceremonyExplainers: any[] = [];
      try {
        ceremonyExplainers = await storage.getPublishedCeremonyExplainersByWedding(website.weddingId);
      } catch (e) {
        // Ceremony explainers table may not exist yet - gracefully handle
        console.log("Could not fetch ceremony explainers:", e);
      }

      res.json({
        website,
        wedding,
        events: events.sort((a, b) => a.order - b.order),
        registries,
        ceremonyExplainers,
        isPreview: !website.isPublished && isOwner,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding data" });
    }
  });

  router.patch("/rsvp/:guestId", async (req, res) => {
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

  router.post("/wedding/:slug/chat", async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;
      
      if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ error: "Invalid message" });
      }

      if (!Array.isArray(conversationHistory) || 
          !conversationHistory.every((m: any) => 
            m && typeof m.role === 'string' && 
            ['user', 'assistant'].includes(m.role) && 
            typeof m.content === 'string' && 
            m.content.length <= 2000
          )) {
        return res.status(400).json({ error: "Invalid conversation history" });
      }

      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      if (!website.isPublished) {
        return res.status(404).json({ error: "This wedding website hasn't been published yet" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const events = await storage.getEventsByWedding(website.weddingId);

      const { chatWithGuestConcierge } = await import('../ai/gemini');
      
      const response = await chatWithGuestConcierge(
        message.slice(0, 1000),
        conversationHistory.slice(-10),
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

  return router;
}
