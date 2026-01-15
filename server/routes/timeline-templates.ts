import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertTimelineTemplateSchema } from "@shared/schema";

export async function registerTimelineTemplatesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const tradition = req.query.tradition as string | undefined;

      if (tradition) {
        const templates = await storage.getTimelineTemplatesByTradition(tradition);
        return res.json(templates);
      }

      const templates = activeOnly
        ? await storage.getActiveTimelineTemplates()
        : await storage.getAllTimelineTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch timeline templates:", error);
      res.status(500).json({ error: "Failed to fetch timeline templates" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const template = await storage.getTimelineTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Timeline template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to fetch timeline template:", error);
      res.status(500).json({ error: "Failed to fetch timeline template" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertTimelineTemplateSchema.parse(req.body);
      const template = await storage.createTimelineTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create timeline template:", error);
      res.status(500).json({ error: "Failed to create timeline template" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.updateTimelineTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Timeline template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to update timeline template:", error);
      res.status(500).json({ error: "Failed to update timeline template" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.getTimelineTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Timeline template not found" });
      }

      if (template.isSystemTemplate) {
        return res.status(403).json({ error: "Cannot delete system templates" });
      }

      await storage.deleteTimelineTemplate(req.params.id);
      res.json({ message: "Timeline template deleted successfully" });
    } catch (error) {
      console.error("Failed to delete timeline template:", error);
      res.status(500).json({ error: "Failed to delete timeline template" });
    }
  });
}
