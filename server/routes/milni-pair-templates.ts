import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertMilniPairTemplateSchema } from "@shared/schema";

export async function registerMilniPairTemplatesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const tradition = req.query.tradition as string | undefined;

      if (tradition) {
        const templates = await storage.getMilniPairTemplatesByTradition(tradition);
        return res.json(templates);
      }

      const templates = activeOnly
        ? await storage.getActiveMilniPairTemplates()
        : await storage.getAllMilniPairTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch milni pair templates:", error);
      res.status(500).json({ error: "Failed to fetch milni pair templates" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const template = await storage.getMilniPairTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Milni pair template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to fetch milni pair template:", error);
      res.status(500).json({ error: "Failed to fetch milni pair template" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertMilniPairTemplateSchema.parse(req.body);
      const template = await storage.createMilniPairTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create milni pair template:", error);
      res.status(500).json({ error: "Failed to create milni pair template" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.updateMilniPairTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Milni pair template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to update milni pair template:", error);
      res.status(500).json({ error: "Failed to update milni pair template" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const template = await storage.getMilniPairTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Milni pair template not found" });
      }

      if (template.isSystemTemplate) {
        return res.status(403).json({ error: "Cannot delete system templates" });
      }

      await storage.deleteMilniPairTemplate(req.params.id);
      res.json({ message: "Milni pair template deleted successfully" });
    } catch (error) {
      console.error("Failed to delete milni pair template:", error);
      res.status(500).json({ error: "Failed to delete milni pair template" });
    }
  });
}
