import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertDecorItemTemplateSchema } from "@shared/schema";

export async function registerDecorItemTemplatesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const categoryId = req.query.categoryId as string | undefined;
      const tradition = req.query.tradition as string | undefined;

      if (categoryId) {
        const templates = await storage.getDecorItemTemplatesByCategory(categoryId);
        return res.json(templates);
      }

      if (tradition) {
        const templates = await storage.getDecorItemTemplatesByTradition(tradition);
        return res.json(templates);
      }

      const templates = activeOnly
        ? await storage.getActiveDecorItemTemplates()
        : await storage.getAllDecorItemTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch decor item templates:", error);
      res.status(500).json({ error: "Failed to fetch decor item templates" });
    }
  });

  router.get("/category/:categoryId", async (req, res) => {
    try {
      const templates = await storage.getDecorItemTemplatesByCategory(req.params.categoryId);
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch decor item templates by category:", error);
      res.status(500).json({ error: "Failed to fetch decor item templates" });
    }
  });

  router.get("/tradition/:tradition", async (req, res) => {
    try {
      const templates = await storage.getDecorItemTemplatesByTradition(req.params.tradition);
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch decor item templates by tradition:", error);
      res.status(500).json({ error: "Failed to fetch decor item templates" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const template = await storage.getDecorItemTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Decor item template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to fetch decor item template:", error);
      res.status(500).json({ error: "Failed to fetch decor item template" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertDecorItemTemplateSchema.parse(req.body);
      const template = await storage.createDecorItemTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create decor item template:", error);
      res.status(500).json({ error: "Failed to create decor item template" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.updateDecorItemTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Decor item template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to update decor item template:", error);
      res.status(500).json({ error: "Failed to update decor item template" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.getDecorItemTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Decor item template not found" });
      }

      if (template.isSystemItem) {
        return res.status(403).json({ error: "Cannot delete system items" });
      }

      await storage.deleteDecorItemTemplate(req.params.id);
      res.json({ message: "Decor item template deleted successfully" });
    } catch (error) {
      console.error("Failed to delete decor item template:", error);
      res.status(500).json({ error: "Failed to delete decor item template" });
    }
  });
}
