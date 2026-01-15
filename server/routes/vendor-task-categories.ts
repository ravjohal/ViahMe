import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertVendorTaskCategorySchema } from "@shared/schema";

export async function registerVendorTaskCategoriesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const tradition = req.query.tradition as string | undefined;

      if (tradition) {
        const categories = await storage.getVendorTaskCategoriesByTradition(tradition);
        return res.json(categories);
      }

      const categories = activeOnly
        ? await storage.getActiveVendorTaskCategories()
        : await storage.getAllVendorTaskCategories();
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch vendor task categories:", error);
      res.status(500).json({ error: "Failed to fetch vendor task categories" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const category = await storage.getVendorTaskCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Vendor task category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch vendor task category by slug:", error);
      res.status(500).json({ error: "Failed to fetch vendor task category" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const category = await storage.getVendorTaskCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Vendor task category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch vendor task category:", error);
      res.status(500).json({ error: "Failed to fetch vendor task category" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertVendorTaskCategorySchema.parse(req.body);
      const category = await storage.createVendorTaskCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create vendor task category:", error);
      res.status(500).json({ error: "Failed to create vendor task category" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateVendorTaskCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Vendor task category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update vendor task category:", error);
      res.status(500).json({ error: "Failed to update vendor task category" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.getVendorTaskCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Vendor task category not found" });
      }

      if (category.isSystemCategory) {
        return res.status(403).json({ error: "Cannot delete system categories" });
      }

      await storage.deleteVendorTaskCategory(req.params.id);
      res.json({ message: "Vendor task category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete vendor task category:", error);
      res.status(500).json({ error: "Failed to delete vendor task category" });
    }
  });
}
