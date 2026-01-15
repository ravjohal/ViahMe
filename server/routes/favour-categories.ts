import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertFavourCategorySchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === "true";
    const tradition = req.query.tradition as string | undefined;

    if (tradition) {
      const categories = await storage.getFavourCategoriesByTradition(tradition);
      return res.json(categories);
    }

    const categories = activeOnly
      ? await storage.getActiveFavourCategories()
      : await storage.getAllFavourCategories();
    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch favour categories:", error);
    res.status(500).json({ error: "Failed to fetch favour categories" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const category = await storage.getFavourCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: "Favour category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch favour category by slug:", error);
    res.status(500).json({ error: "Failed to fetch favour category" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await storage.getFavourCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Favour category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch favour category:", error);
    res.status(500).json({ error: "Failed to fetch favour category" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFavourCategorySchema.parse(req.body);
    const category = await storage.createFavourCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to create favour category:", error);
    res.status(500).json({ error: "Failed to create favour category" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const partialSchema = insertFavourCategorySchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const category = await storage.updateFavourCategory(req.params.id, validatedData);
    if (!category) {
      return res.status(404).json({ error: "Favour category not found" });
    }
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Failed to update favour category:", error);
    res.status(500).json({ error: "Failed to update favour category" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await storage.deleteFavourCategory(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Favour category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete favour category:", error);
    res.status(500).json({ error: "Failed to delete favour category" });
  }
});

export default router;
