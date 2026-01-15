import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertDecorItemTemplateSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
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

router.get("/category/:categoryId", async (req: Request, res: Response) => {
  try {
    const templates = await storage.getDecorItemTemplatesByCategory(req.params.categoryId);
    res.json(templates);
  } catch (error) {
    console.error("Failed to fetch decor item templates by category:", error);
    res.status(500).json({ error: "Failed to fetch decor item templates" });
  }
});

router.get("/tradition/:tradition", async (req: Request, res: Response) => {
  try {
    const templates = await storage.getDecorItemTemplatesByTradition(req.params.tradition);
    res.json(templates);
  } catch (error) {
    console.error("Failed to fetch decor item templates by tradition:", error);
    res.status(500).json({ error: "Failed to fetch decor item templates" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
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

router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertDecorItemTemplateSchema.parse(req.body);
    const template = await storage.createDecorItemTemplate(validatedData);
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to create decor item template:", error);
    res.status(500).json({ error: "Failed to create decor item template" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const partialSchema = insertDecorItemTemplateSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const template = await storage.updateDecorItemTemplate(req.params.id, validatedData);
    if (!template) {
      return res.status(404).json({ error: "Decor item template not found" });
    }
    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to update decor item template:", error);
    res.status(500).json({ error: "Failed to update decor item template" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await storage.deleteDecorItemTemplate(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Decor item template not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete decor item template:", error);
    res.status(500).json({ error: "Failed to delete decor item template" });
  }
});

export default router;
