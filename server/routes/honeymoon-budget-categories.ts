import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertHoneymoonBudgetCategorySchema } from "@shared/schema";

export async function registerHoneymoonBudgetCategoriesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
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

  router.get("/slug/:slug", async (req, res) => {
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

  router.get("/:id", async (req, res) => {
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

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertHoneymoonBudgetCategorySchema.parse(req.body);
      const category = await storage.createHoneymoonBudgetCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create honeymoon budget category:", error);
      res.status(500).json({ error: "Failed to create honeymoon budget category" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateHoneymoonBudgetCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Honeymoon budget category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update honeymoon budget category:", error);
      res.status(500).json({ error: "Failed to update honeymoon budget category" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.getHoneymoonBudgetCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Honeymoon budget category not found" });
      }

      if (category.isSystemCategory) {
        return res.status(403).json({ error: "Cannot delete system categories" });
      }

      await storage.deleteHoneymoonBudgetCategory(req.params.id);
      res.json({ message: "Honeymoon budget category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete honeymoon budget category:", error);
      res.status(500).json({ error: "Failed to delete honeymoon budget category" });
    }
  });
}
