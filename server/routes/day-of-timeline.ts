import { Router, Response } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import { insertDayOfTimelineItemSchema } from "@shared/schema";

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

export async function createDayOfTimelineRouter(storage: IStorage): Promise<Router> {
  const router = Router();

  // Get all day-of timeline items for a wedding
  router.get("/day-of-timeline/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
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

      const items = await storage.getDayOfTimelineItemsByWedding(weddingId);
      res.json(items);
    } catch (error) {
      console.error("Failed to get day-of timeline items:", error);
      res.status(500).json({ error: "Failed to get day-of timeline items" });
    }
  });

  // Get items by assignee
  router.get("/day-of-timeline/wedding/:weddingId/assignee/:assignee", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, assignee } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const items = await storage.getDayOfTimelineItemsByAssignee(weddingId, assignee);
      res.json(items);
    } catch (error) {
      console.error("Failed to get day-of timeline items by assignee:", error);
      res.status(500).json({ error: "Failed to get day-of timeline items" });
    }
  });

  // Create a new timeline item
  router.post("/day-of-timeline/items", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertDayOfTimelineItemSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const item = await storage.createDayOfTimelineItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create day-of timeline item:", error);
      res.status(500).json({ error: "Failed to create day-of timeline item" });
    }
  });

  // Update a timeline item
  router.patch("/day-of-timeline/items/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDayOfTimelineItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Timeline item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Use strict whitelist validation
      const updateSchema = insertDayOfTimelineItemSchema
        .pick({
          scheduledTime: true,
          endTime: true,
          activity: true,
          assignee: true,
          vendorCategory: true,
          location: true,
          notes: true,
          completed: true,
          sortOrder: true,
          eventId: true,
        })
        .partial()
        .strict();
      const validatedData = updateSchema.parse(req.body);

      const updated = await storage.updateDayOfTimelineItem(itemId, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update day-of timeline item:", error);
      res.status(500).json({ error: "Failed to update day-of timeline item" });
    }
  });

  // Toggle completed status
  router.patch("/day-of-timeline/items/:itemId/toggle-completed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDayOfTimelineItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Timeline item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.toggleDayOfTimelineItemCompleted(itemId);
      res.json(updated);
    } catch (error) {
      console.error("Failed to toggle day-of timeline item completed status:", error);
      res.status(500).json({ error: "Failed to toggle completed status" });
    }
  });

  // Delete a timeline item
  router.delete("/day-of-timeline/items/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getDayOfTimelineItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Timeline item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteDayOfTimelineItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete day-of timeline item:", error);
      res.status(500).json({ error: "Failed to delete day-of timeline item" });
    }
  });

  // Import template
  router.post("/day-of-timeline/wedding/:weddingId/import-template", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const { template = "sikh" } = req.body;

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const items = await storage.importDayOfTimelineTemplate(weddingId, template);
      res.status(201).json(items);
    } catch (error) {
      console.error("Failed to import day-of timeline template:", error);
      res.status(500).json({ error: "Failed to import template" });
    }
  });

  // Clear all timeline items for a wedding
  router.delete("/day-of-timeline/wedding/:weddingId/clear", await requireAuth(storage, false), async (req, res) => {
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

      await storage.clearDayOfTimeline(weddingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to clear day-of timeline:", error);
      res.status(500).json({ error: "Failed to clear timeline" });
    }
  });

  return router;
}
