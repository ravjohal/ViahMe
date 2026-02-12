import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import { ensureCoupleAccess } from "./middleware";

export async function createGuestMediaRouter(storage: IStorage): Promise<Router> {
  const router = Router();

  router.get("/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { status } = req.query;
      const media = await storage.getGuestMediaByWedding(
        req.params.weddingId,
        status as string | undefined
      );
      res.json(media);
    } catch (error) {
      console.error("Error fetching guest media:", error);
      res.status(500).json({ error: "Failed to fetch guest media" });
    }
  });

  router.get("/:weddingId/counts", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const counts = await storage.getGuestMediaCounts(req.params.weddingId);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching guest media counts:", error);
      res.status(500).json({ error: "Failed to fetch guest media counts" });
    }
  });

  router.patch("/:id/status", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      const media = await storage.getGuestMediaById(req.params.id);
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }

      const wedding = await storage.getWedding(media.weddingId);
      if (!wedding || wedding.userId !== req.session.userId) {
        const roles = await storage.getWeddingRoles(media.weddingId);
        const hasAccess = roles.some(role => role.userId === req.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const updated = await storage.updateGuestMediaStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating guest media status:", error);
      res.status(500).json({ error: "Failed to update media status" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const media = await storage.getGuestMediaById(req.params.id);
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }

      const wedding = await storage.getWedding(media.weddingId);
      if (!wedding || wedding.userId !== req.session.userId) {
        const roles = await storage.getWeddingRoles(media.weddingId);
        const hasAccess = roles.some(role => role.userId === req.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.updateGuestMediaStatus(req.params.id, 'rejected');
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting guest media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  return router;
}

export function createPublicGuestMediaRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/upload-settings/:weddingId", async (req, res) => {
    try {
      const wedding = await storage.getWedding(req.params.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json({
        guestUploadsEnabled: wedding.guestUploadsEnabled ?? false,
        guestUploadsRequireApproval: wedding.guestUploadsRequireApproval ?? true,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upload settings" });
    }
  });

  router.post("/wedding/:slug/upload-url", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding?.guestUploadsEnabled) {
        return res.status(403).json({ error: "Guest uploads are not enabled for this wedding" });
      }

      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error getting guest upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  router.post("/wedding/:slug/media", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding?.guestUploadsEnabled) {
        return res.status(403).json({ error: "Guest uploads are not enabled for this wedding" });
      }

      const { url, mediaType, caption, uploaderName, eventId } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }
      if (!['photo', 'video'].includes(mediaType)) {
        return res.status(400).json({ error: "mediaType must be 'photo' or 'video'" });
      }

      const status = wedding.guestUploadsRequireApproval ? 'pending' : 'approved';

      const media = await storage.createGuestMedia({
        weddingId: website.weddingId,
        url,
        mediaType,
        caption: caption || null,
        uploaderName: uploaderName || null,
        eventId: eventId || null,
        guestId: null,
        householdId: null,
        source: 'website',
        status,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating guest media:", error);
      res.status(500).json({ error: "Failed to save media" });
    }
  });

  router.post("/rsvp/:token/upload-url", async (req, res) => {
    try {
      const household = await storage.getHouseholdByMagicToken(req.params.token);
      if (!household) {
        return res.status(404).json({ error: "Invalid token" });
      }

      const wedding = await storage.getWedding(household.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (!wedding.guestUploadsEnabled) {
        return res.status(403).json({ error: "Guest uploads are not enabled for this wedding" });
      }

      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error getting RSVP upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  router.post("/rsvp/:token/media", async (req, res) => {
    try {
      const household = await storage.getHouseholdByMagicToken(req.params.token);
      if (!household) {
        return res.status(404).json({ error: "Invalid token" });
      }

      const wedding = await storage.getWedding(household.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (!wedding.guestUploadsEnabled) {
        return res.status(403).json({ error: "Guest uploads are not enabled for this wedding" });
      }

      const { url, mediaType, caption, guestId, eventId } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }
      if (!['photo', 'video'].includes(mediaType)) {
        return res.status(400).json({ error: "mediaType must be 'photo' or 'video'" });
      }

      let uploaderName: string | null = null;
      if (guestId) {
        const guests = await storage.getGuestsByHousehold(household.id);
        const guest = guests.find(g => g.id === guestId);
        if (guest) {
          uploaderName = `${guest.firstName} ${guest.lastName}`.trim();
        }
      }

      const status = wedding.guestUploadsRequireApproval ? 'pending' : 'approved';

      const media = await storage.createGuestMedia({
        weddingId: wedding.id,
        url,
        mediaType,
        caption: caption || null,
        uploaderName,
        eventId: eventId || null,
        guestId: guestId || null,
        householdId: household.id,
        source: 'rsvp',
        status,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating RSVP guest media:", error);
      res.status(500).json({ error: "Failed to save media" });
    }
  });

  router.get("/wedding/:slug/approved", async (req, res) => {
    try {
      const website = await storage.getWeddingWebsiteBySlug(req.params.slug);
      if (!website) {
        return res.status(404).json({ error: "Wedding website not found" });
      }

      const wedding = await storage.getWedding(website.weddingId);
      if (!wedding?.guestUploadsEnabled) {
        return res.json([]);
      }

      const media = await storage.getGuestMediaByWedding(website.weddingId, 'approved');
      res.json(media);
    } catch (error) {
      console.error("Error fetching approved guest media:", error);
      res.status(500).json({ error: "Failed to fetch guest media" });
    }
  });

  return router;
}
