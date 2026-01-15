import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertDecorCategorySchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === "true";
    const categories = activeOnly
      ? await storage.getActiveDecorCategories()
      : await storage.getAllDecorCategories();
    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch decor categories:", error);
    res.status(500).json({ error: "Failed to fetch decor categories" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const category = await storage.getDecorCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: "Decor category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch decor category by slug:", error);
    res.status(500).json({ error: "Failed to fetch decor category" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await storage.getDecorCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Decor category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch decor category:", error);
    res.status(500).json({ error: "Failed to fetch decor category" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertDecorCategorySchema.parse(req.body);
    const category = await storage.createDecorCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to create decor category:", error);
    res.status(500).json({ error: "Failed to create decor category" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const partialSchema = insertDecorCategorySchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const category = await storage.updateDecorCategory(req.params.id, validatedData);
    if (!category) {
      return res.status(404).json({ error: "Decor category not found" });
    }
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to update decor category:", error);
    res.status(500).json({ error: "Failed to update decor category" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await storage.deleteDecorCategory(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Decor category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete decor category:", error);
    res.status(500).json({ error: "Failed to delete decor category" });
  }
});

export default router;
