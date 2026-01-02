import { Router } from "express";
import type { IStorage } from "../storage";
import { insertPhotoGallerySchema, insertPhotoSchema } from "@shared/schema";

export function createGalleriesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByWedding(req.params.weddingId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByVendor(req.params.vendorId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor galleries" });
    }
  });

  router.get("/event/:eventId", async (req, res) => {
    try {
      const galleries = await storage.getGalleriesByEvent(req.params.eventId);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event galleries" });
    }
  });

  router.get("/type/:type", async (req, res) => {
    try {
      const type = req.params.type as 'inspiration' | 'vendor_portfolio' | 'event_photos';
      const galleries = await storage.getGalleriesByType(type);
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch galleries by type" });
    }
  });

  router.get("/:id", async (req, res) => {
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

  router.post("/", async (req, res) => {
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

  router.patch("/:id", async (req, res) => {
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

  router.delete("/:id", async (req, res) => {
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

  return router;
}

export function createPhotosRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/gallery/:galleryId", async (req, res) => {
    try {
      const photos = await storage.getPhotosByGallery(req.params.galleryId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  router.get("/:id", async (req, res) => {
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

  router.post("/", async (req, res) => {
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

  router.patch("/:id", async (req, res) => {
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

  router.delete("/:id", async (req, res) => {
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

  return router;
}
