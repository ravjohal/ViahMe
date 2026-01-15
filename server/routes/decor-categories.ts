import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertDecorCategorySchema } from "@shared/schema";

export async function registerDecorCategoriesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
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

  router.get("/slug/:slug", async (req, res) => {
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

  router.get("/:id", async (req, res) => {
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

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertDecorCategorySchema.parse(req.body);
      const category = await storage.createDecorCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create decor category:", error);
      res.status(500).json({ error: "Failed to create decor category" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateDecorCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Decor category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update decor category:", error);
      res.status(500).json({ error: "Failed to update decor category" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.getDecorCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Decor category not found" });
      }

      if (category.isSystemCategory) {
        return res.status(403).json({ error: "Cannot delete system categories" });
      }

      await storage.deleteDecorCategory(req.params.id);
      res.json({ message: "Decor category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete decor category:", error);
      res.status(500).json({ error: "Failed to delete decor category" });
    }
  });
}
