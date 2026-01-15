import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertFavourCategorySchema } from "@shared/schema";

export async function registerFavourCategoriesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
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

  router.get("/slug/:slug", async (req, res) => {
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

  router.get("/:id", async (req, res) => {
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

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertFavourCategorySchema.parse(req.body);
      const category = await storage.createFavourCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create favour category:", error);
      res.status(500).json({ error: "Failed to create favour category" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateFavourCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Favour category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update favour category:", error);
      res.status(500).json({ error: "Failed to update favour category" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.getFavourCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Favour category not found" });
      }

      if (category.isSystemCategory) {
        return res.status(403).json({ error: "Cannot delete system categories" });
      }

      await storage.deleteFavourCategory(req.params.id);
      res.json({ message: "Favour category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete favour category:", error);
      res.status(500).json({ error: "Failed to delete favour category" });
    }
  });
}
