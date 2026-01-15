import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertHoneymoonBudgetCategorySchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === "true";
    const categories = activeOnly
      ? await storage.getActiveHoneymoonBudgetCategories()
      : await storage.getAllHoneymoonBudgetCategories();
    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch honeymoon budget categories:", error);
    res.status(500).json({ error: "Failed to fetch honeymoon budget categories" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const category = await storage.getHoneymoonBudgetCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: "Honeymoon budget category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch honeymoon budget category by slug:", error);
    res.status(500).json({ error: "Failed to fetch honeymoon budget category" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await storage.getHoneymoonBudgetCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Honeymoon budget category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch honeymoon budget category:", error);
    res.status(500).json({ error: "Failed to fetch honeymoon budget category" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertHoneymoonBudgetCategorySchema.parse(req.body);
    const category = await storage.createHoneymoonBudgetCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to create honeymoon budget category:", error);
    res.status(500).json({ error: "Failed to create honeymoon budget category" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const partialSchema = insertHoneymoonBudgetCategorySchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const category = await storage.updateHoneymoonBudgetCategory(req.params.id, validatedData);
    if (!category) {
      return res.status(404).json({ error: "Honeymoon budget category not found" });
    }
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to update honeymoon budget category:", error);
    res.status(500).json({ error: "Failed to update honeymoon budget category" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await storage.deleteHoneymoonBudgetCategory(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Honeymoon budget category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete honeymoon budget category:", error);
    res.status(500).json({ error: "Failed to delete honeymoon budget category" });
  }
});

export default router;
