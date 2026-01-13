import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertDecorItemSchema, DEFAULT_DECOR_LIBRARY, DECOR_SOURCING_OPTIONS, DECOR_CATEGORIES } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";
import { z } from "zod";

export async function registerDecorRoutes(router: Router, storage: IStorage) {
  
  // Get decor sourcing options and categories (public - used for dropdowns)
  router.get("/decor/options", async (req, res) => {
    try {
      res.json({
        sourcingOptions: DECOR_SOURCING_OPTIONS,
        categories: DECOR_CATEGORIES,
      });
    } catch (error) {
      console.error("Failed to fetch decor options:", error);
      res.status(500).json({ error: "Failed to fetch decor options" });
    }
  });

  // Get default library items (public - used to show what can be imported)
  router.get("/decor/library", async (req, res) => {
    try {
      res.json(DEFAULT_DECOR_LIBRARY);
    } catch (error) {
      console.error("Failed to fetch decor library:", error);
      res.status(500).json({ error: "Failed to fetch decor library" });
    }
  });

  // Get all decor items for a wedding (with optional category filter)
  router.get("/decor/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const { category } = req.query;
      
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      let items;
      if (category && typeof category === 'string') {
        items = await storage.getDecorItemsByWeddingAndCategory(weddingId, category);
      } else {
        items = await storage.getDecorItemsByWedding(weddingId);
      }
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch decor items:", error);
      res.status(500).json({ error: "Failed to fetch decor items" });
    }
  });

  // Create a new decor item
  router.post("/decor/items", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertDecorItemSchema.parse(req.body);

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const item = await storage.createDecorItem(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create decor item:", error);
      res.status(500).json({ error: "Failed to create decor item" });
    }
  });

  // Update a decor item
  router.patch("/decor/items/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDecorItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Decor item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate partial update and prevent overwriting critical fields
      // Use strict() to reject unknown keys, and explicitly omit weddingId
      const updateSchema = insertDecorItemSchema
        .pick({
          itemName: true,
          quantity: true,
          sourcing: true,
          sourced: true,
          notes: true,
          estimatedCost: true,
          actualCost: true,
          vendor: true,
          link: true,
          category: true,
          eventId: true,
          sortOrder: true,
        })
        .partial()
        .strict();
      const validatedData = updateSchema.parse(req.body);

      const updated = await storage.updateDecorItem(itemId, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update decor item:", error);
      res.status(500).json({ error: "Failed to update decor item" });
    }
  });

  // Toggle sourced status
  router.patch("/decor/items/:itemId/toggle-sourced", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDecorItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Decor item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.toggleDecorItemSourced(itemId);
      res.json(updated);
    } catch (error) {
      console.error("Failed to toggle decor item sourced status:", error);
      res.status(500).json({ error: "Failed to toggle sourced status" });
    }
  });

  // Delete a decor item
  router.delete("/decor/items/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDecorItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Decor item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteDecorItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete decor item:", error);
      res.status(500).json({ error: "Failed to delete decor item" });
    }
  });

  // Import default decor library items for a wedding
  router.post("/decor/import-defaults/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if items already exist for this wedding
      const existingItems = await storage.getDecorItemsByWedding(weddingId);
      if (existingItems.length > 0) {
        return res.status(400).json({ error: "Decor items already exist for this wedding. Clear them first or add items individually." });
      }

      const items = await storage.importDefaultDecorLibrary(weddingId);
      res.json(items);
    } catch (error) {
      console.error("Failed to import default decor library:", error);
      res.status(500).json({ error: "Failed to import default decor library" });
    }
  });
}
