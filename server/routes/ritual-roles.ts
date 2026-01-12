import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertRitualRoleAssignmentSchema, insertRitualRoleTemplateSchema, RITUAL_ROLE_TEMPLATES } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";

export async function registerRitualRoleRoutes(router: Router, storage: IStorage) {
  // Get all ritual role templates (database-driven)
  router.get("/ritual-roles/templates", async (req, res) => {
    try {
      const templates = await storage.getActiveRitualRoleTemplates();
      
      // If no templates in DB, return legacy constant (backwards compatibility)
      if (templates.length === 0) {
        return res.json(RITUAL_ROLE_TEMPLATES);
      }
      
      // Group templates by ceremony slug for backwards compatibility with frontend
      const grouped: Record<string, typeof templates> = {};
      templates.forEach(template => {
        if (!grouped[template.ceremonySlug]) {
          grouped[template.ceremonySlug] = [];
        }
        grouped[template.ceremonySlug].push(template);
      });
      
      res.json(grouped);
    } catch (error) {
      console.error("Failed to fetch ritual role templates:", error);
      res.status(500).json({ error: "Failed to fetch ritual role templates" });
    }
  });

  // Get templates for a specific ceremony type
  router.get("/ritual-roles/templates/:eventType", async (req, res) => {
    try {
      const { eventType } = req.params;
      const templates = await storage.getRitualRoleTemplatesByCeremony(eventType);
      
      // If no templates in DB, return legacy constant (backwards compatibility)
      if (templates.length === 0) {
        const legacyTemplates = RITUAL_ROLE_TEMPLATES[eventType] || [];
        return res.json(legacyTemplates);
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch templates for event type:", error);
      res.status(500).json({ error: "Failed to fetch templates for event type" });
    }
  });

  // Seed templates from legacy constant to database
  router.post("/ritual-roles/templates/seed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const templates = await storage.seedRitualRoleTemplates();
      res.json({ message: "Templates seeded successfully", count: templates.length });
    } catch (error) {
      console.error("Failed to seed ritual role templates:", error);
      res.status(500).json({ error: "Failed to seed ritual role templates" });
    }
  });

  // Create a new template (admin)
  router.post("/ritual-roles/templates", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const validatedData = insertRitualRoleTemplateSchema.parse(req.body);
      const template = await storage.createRitualRoleTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create ritual role template:", error);
      res.status(500).json({ error: "Failed to create ritual role template" });
    }
  });

  // Update a template (admin)
  router.patch("/ritual-roles/templates/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const existing = await storage.getRitualRoleTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      const updated = await storage.updateRitualRoleTemplate(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update ritual role template:", error);
      res.status(500).json({ error: "Failed to update ritual role template" });
    }
  });

  // Delete a template (admin)
  router.delete("/ritual-roles/templates/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const existing = await storage.getRitualRoleTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      await storage.deleteRitualRoleTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete ritual role template:", error);
      res.status(500).json({ error: "Failed to delete ritual role template" });
    }
  });

  router.get("/ritual-roles/wedding/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const assignments = await storage.getRitualRolesByWedding(req.params.weddingId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ritual roles" });
    }
  });

  router.get("/ritual-roles/event/:eventId", await requireAuth(storage, false), async (req, res) => {
    try {
      const assignments = await storage.getRitualRolesByEvent(req.params.eventId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ritual roles for event" });
    }
  });

  router.get("/ritual-roles/guest/:guestId", async (req, res) => {
    try {
      const assignments = await storage.getRitualRolesByGuest(req.params.guestId);
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const event = await storage.getEvent(assignment.eventId);
          const guest = await storage.getGuest(assignment.guestId);
          return { ...assignment, event, guest };
        })
      );
      res.json(enrichedAssignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ritual roles for guest" });
    }
  });

  router.post("/ritual-roles", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertRitualRoleAssignmentSchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const guest = await storage.getGuest(validatedData.guestId);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      const event = await storage.getEvent(validatedData.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const assignment = await storage.createRitualRoleAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create ritual role assignment" });
    }
  });

  router.patch("/ritual-roles/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existing = await storage.getRitualRoleAssignment(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ritual role assignment not found" });
      }

      const updated = await storage.updateRitualRoleAssignment(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ritual role assignment" });
    }
  });

  router.delete("/ritual-roles/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existing = await storage.getRitualRoleAssignment(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ritual role assignment not found" });
      }

      await storage.deleteRitualRoleAssignment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ritual role assignment" });
    }
  });

  router.post("/ritual-roles/:id/acknowledge", async (req, res) => {
    try {
      const existing = await storage.getRitualRoleAssignment(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ritual role assignment not found" });
      }

      const updated = await storage.acknowledgeRitualRole(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge ritual role" });
    }
  });

  router.post("/ritual-roles/:id/mark-completed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existing = await storage.getRitualRoleAssignment(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ritual role assignment not found" });
      }

      const updated = await storage.updateRitualRoleAssignment(req.params.id, { status: "completed" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark ritual role as completed" });
    }
  });
}
