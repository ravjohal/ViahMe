import { Router } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import {
  insertFavourSchema,
  insertFavourRecipientSchema,
} from "@shared/schema";

async function ensureCoupleAccess(storage: IStorage, userId: string, weddingId: string): Promise<boolean> {
  const wedding = await storage.getWedding(weddingId);
  if (!wedding) return false;
  
  if (wedding.coupleUserId === userId || wedding.partnerUserId === userId) {
    return true;
  }
  
  const collaborator = await storage.getWeddingCollaborator(weddingId, userId);
  if (collaborator && collaborator.status === 'accepted') {
    const role = await storage.getWeddingRole(collaborator.roleId);
    if (role) {
      const permissions = await storage.getRolePermissions(role.id);
      const hasPermission = permissions.some(p => 
        (p.category === 'planning' || p.category === 'all') && 
        (p.level === 'edit' || p.level === 'full')
      );
      if (hasPermission) return true;
    }
  }
  
  return false;
}

export async function createFavoursRouter(storage: IStorage): Promise<Router> {
  const router = Router();

  // ============================================================================
  // FAVOURS (Gift Items)
  // ============================================================================

  router.get("/favours/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
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

      const favours = await storage.getFavoursByWedding(weddingId);
      res.json(favours);
    } catch (error) {
      console.error("Failed to get favours:", error);
      res.status(500).json({ error: "Failed to get favours" });
    }
  });

  router.post("/favours", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertFavourSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const favour = await storage.createFavour(validatedData);
      res.status(201).json(favour);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create favour:", error);
      res.status(500).json({ error: "Failed to create favour" });
    }
  });

  router.patch("/favours/:favourId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { favourId } = req.params;
      const favour = await storage.getFavour(favourId);
      
      if (!favour) {
        return res.status(404).json({ error: "Favour not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, favour.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertFavourSchema
        .pick({
          name: true,
          description: true,
          category: true,
          quantityPurchased: true,
          quantityRemaining: true,
          costPerUnit: true,
          totalCost: true,
          supplier: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedFavour = await storage.updateFavour(favourId, validatedData);
      res.json(updatedFavour);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update favour:", error);
      res.status(500).json({ error: "Failed to update favour" });
    }
  });

  router.delete("/favours/:favourId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { favourId } = req.params;
      const favour = await storage.getFavour(favourId);
      
      if (!favour) {
        return res.status(404).json({ error: "Favour not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, favour.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteFavour(favourId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete favour:", error);
      res.status(500).json({ error: "Failed to delete favour" });
    }
  });

  // ============================================================================
  // FAVOUR RECIPIENTS
  // ============================================================================

  router.get("/favours/:favourId/recipients", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { favourId } = req.params;
      const favour = await storage.getFavour(favourId);
      
      if (!favour) {
        return res.status(404).json({ error: "Favour not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, favour.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const recipients = await storage.getFavourRecipientsByFavour(favourId);
      res.json(recipients);
    } catch (error) {
      console.error("Failed to get favour recipients:", error);
      res.status(500).json({ error: "Failed to get favour recipients" });
    }
  });

  router.get("/favour-recipients/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
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

      const recipients = await storage.getFavourRecipientsByWedding(weddingId);
      res.json(recipients);
    } catch (error) {
      console.error("Failed to get favour recipients:", error);
      res.status(500).json({ error: "Failed to get favour recipients" });
    }
  });

  router.post("/favour-recipients", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertFavourRecipientSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const recipient = await storage.createFavourRecipient(validatedData);
      res.status(201).json(recipient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create favour recipient:", error);
      res.status(500).json({ error: "Failed to create favour recipient" });
    }
  });

  router.patch("/favour-recipients/:recipientId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { recipientId } = req.params;
      const recipient = await storage.getFavourRecipient(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, recipient.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertFavourRecipientSchema
        .pick({
          recipientName: true,
          recipientType: true,
          householdId: true,
          guestId: true,
          quantity: true,
          deliveryStatus: true,
          deliveryDate: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedRecipient = await storage.updateFavourRecipient(recipientId, validatedData);
      res.json(updatedRecipient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update favour recipient:", error);
      res.status(500).json({ error: "Failed to update favour recipient" });
    }
  });

  router.delete("/favour-recipients/:recipientId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { recipientId } = req.params;
      const recipient = await storage.getFavourRecipient(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, recipient.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteFavourRecipient(recipientId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete favour recipient:", error);
      res.status(500).json({ error: "Failed to delete favour recipient" });
    }
  });

  router.post("/favour-recipients/:recipientId/toggle-delivered", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { recipientId } = req.params;
      const recipient = await storage.getFavourRecipient(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, recipient.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedRecipient = await storage.toggleFavourRecipientDelivered(recipientId);
      res.json(updatedRecipient);
    } catch (error) {
      console.error("Failed to toggle delivery status:", error);
      res.status(500).json({ error: "Failed to toggle delivery status" });
    }
  });

  return router;
}
