import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertWeddingTraditionSchema, insertWeddingSubTraditionSchema } from "@shared/schema";

export async function registerTraditionsRoutes(router: Router, storage: IStorage) {
  // Get all traditions - public endpoint
  // By default returns only active traditions; use ?includeInactive=true for admin UI
  router.get("/", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const traditions = includeInactive 
        ? await storage.getAllWeddingTraditions()
        : await storage.getActiveWeddingTraditions();
      res.json(traditions);
    } catch (error) {
      console.error("Failed to fetch wedding traditions:", error);
      res.status(500).json({ error: "Failed to fetch wedding traditions" });
    }
  });

  // Get a specific tradition
  router.get("/:id", async (req, res) => {
    try {
      const tradition = await storage.getWeddingTradition(req.params.id);
      if (!tradition) {
        return res.status(404).json({ error: "Wedding tradition not found" });
      }
      res.json(tradition);
    } catch (error) {
      console.error("Failed to fetch wedding tradition:", error);
      res.status(500).json({ error: "Failed to fetch wedding tradition" });
    }
  });

  // Get sub-traditions for a specific tradition
  router.get("/:id/sub-traditions", async (req, res) => {
    try {
      const subTraditions = await storage.getWeddingSubTraditionsByTradition(req.params.id);
      res.json(subTraditions);
    } catch (error) {
      console.error("Failed to fetch wedding sub-traditions:", error);
      res.status(500).json({ error: "Failed to fetch wedding sub-traditions" });
    }
  });

  // Admin: Seed traditions from defaults
  router.post("/seed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const traditions = await storage.seedWeddingTraditions();
      const subTraditions = await storage.seedWeddingSubTraditions();
      res.json({ 
        message: "Wedding traditions seeded successfully", 
        traditionsCount: traditions.length,
        subTraditionsCount: subTraditions.length,
        traditions,
        subTraditions
      });
    } catch (error) {
      console.error("Failed to seed wedding traditions:", error);
      res.status(500).json({ error: "Failed to seed wedding traditions" });
    }
  });

  // Admin: Create a new tradition
  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertWeddingTraditionSchema.parse(req.body);
      const tradition = await storage.createWeddingTradition(validatedData);
      res.status(201).json(tradition);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create wedding tradition:", error);
      res.status(500).json({ error: "Failed to create wedding tradition" });
    }
  });

  // Admin: Update a tradition
  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const tradition = await storage.updateWeddingTradition(req.params.id, req.body);
      if (!tradition) {
        return res.status(404).json({ error: "Wedding tradition not found" });
      }
      res.json(tradition);
    } catch (error) {
      console.error("Failed to update wedding tradition:", error);
      res.status(500).json({ error: "Failed to update wedding tradition" });
    }
  });

  // Admin: Delete a tradition (system traditions cannot be deleted)
  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deleted = await storage.deleteWeddingTradition(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Wedding tradition not found or cannot be deleted" });
      }
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot delete system traditions")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Failed to delete wedding tradition:", error);
      res.status(500).json({ error: "Failed to delete wedding tradition" });
    }
  });

  // ========================================
  // SUB-TRADITIONS ROUTES
  // ========================================

  // Get all sub-traditions
  router.get("/sub-traditions/all", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const subTraditions = includeInactive 
        ? await storage.getAllWeddingSubTraditions()
        : await storage.getActiveWeddingSubTraditions();
      res.json(subTraditions);
    } catch (error) {
      console.error("Failed to fetch wedding sub-traditions:", error);
      res.status(500).json({ error: "Failed to fetch wedding sub-traditions" });
    }
  });

  // Get a specific sub-tradition
  router.get("/sub-traditions/:id", async (req, res) => {
    try {
      const subTradition = await storage.getWeddingSubTradition(req.params.id);
      if (!subTradition) {
        return res.status(404).json({ error: "Wedding sub-tradition not found" });
      }
      res.json(subTradition);
    } catch (error) {
      console.error("Failed to fetch wedding sub-tradition:", error);
      res.status(500).json({ error: "Failed to fetch wedding sub-tradition" });
    }
  });

  // Admin: Create a new sub-tradition
  router.post("/sub-traditions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertWeddingSubTraditionSchema.parse(req.body);
      const subTradition = await storage.createWeddingSubTradition(validatedData);
      res.status(201).json(subTradition);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create wedding sub-tradition:", error);
      res.status(500).json({ error: "Failed to create wedding sub-tradition" });
    }
  });

  // Admin: Update a sub-tradition
  router.patch("/sub-traditions/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const subTradition = await storage.updateWeddingSubTradition(req.params.id, req.body);
      if (!subTradition) {
        return res.status(404).json({ error: "Wedding sub-tradition not found" });
      }
      res.json(subTradition);
    } catch (error) {
      console.error("Failed to update wedding sub-tradition:", error);
      res.status(500).json({ error: "Failed to update wedding sub-tradition" });
    }
  });

  // Admin: Delete a sub-tradition
  router.delete("/sub-traditions/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deleted = await storage.deleteWeddingSubTradition(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Wedding sub-tradition not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete wedding sub-tradition:", error);
      res.status(500).json({ error: "Failed to delete wedding sub-tradition" });
    }
  });
}
