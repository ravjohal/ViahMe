import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";

export async function registerVendorFavoriteRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const weddingId = req.params.weddingId;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding's favorites" });
      }
      
      const favorites = await storage.getVendorFavoritesByWedding(weddingId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching vendor favorites:", error);
      res.status(500).json({ error: "Failed to fetch vendor favorites" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { weddingId, vendorId, notes } = req.body;
      
      if (!weddingId || !vendorId) {
        return res.status(400).json({ error: "Wedding ID and Vendor ID are required" });
      }
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      const existing = await storage.getVendorFavorite(weddingId, vendorId);
      if (existing) {
        return res.status(400).json({ error: "Vendor is already in favorites" });
      }
      
      const favorite = await storage.addVendorFavorite({ weddingId, vendorId, notes });
      res.json(favorite);
    } catch (error) {
      console.error("Error adding vendor favorite:", error);
      res.status(500).json({ error: "Failed to add vendor to favorites" });
    }
  });

  router.delete("/:weddingId/:vendorId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { weddingId, vendorId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      await storage.removeVendorFavorite(weddingId, vendorId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing vendor favorite:", error);
      res.status(500).json({ error: "Failed to remove vendor from favorites" });
    }
  });
}
