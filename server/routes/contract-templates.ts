import { Router } from "express";
import type { IStorage } from "../storage";

export async function registerContractTemplateRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const templates = await storage.getAllContractTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract templates" });
    }
  });

  router.get("/category/:category", async (req, res) => {
    try {
      const templates = await storage.getContractTemplatesByCategory(req.params.category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract templates" });
    }
  });

  router.get("/default/:category", async (req, res) => {
    try {
      const template = await storage.getDefaultContractTemplate(req.params.category);
      if (!template) {
        return res.status(404).json({ error: "No default template found for this category" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default contract template" });
    }
  });

  router.get("/custom/:weddingId", async (req, res) => {
    try {
      const templates = await storage.getCustomTemplatesByWedding(req.params.weddingId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom contract templates" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract template" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const template = await storage.createContractTemplate({
        ...req.body,
        isCustom: true,
      });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create contract template" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const template = await storage.updateContractTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract template" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (!template.isCustom) {
        return res.status(403).json({ error: "Cannot delete system templates" });
      }
      const success = await storage.deleteContractTemplate(req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract template" });
    }
  });
}
