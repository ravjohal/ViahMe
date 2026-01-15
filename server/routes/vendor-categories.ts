import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertVendorCategorySchema } from "@shared/schema";

export async function registerVendorCategoriesRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const tradition = req.query.tradition as string | undefined;
      
      let categories;
      if (tradition) {
        categories = await storage.getVendorCategoriesByTradition(tradition);
      } else if (includeInactive) {
        categories = await storage.getAllVendorCategories();
      } else {
        categories = await storage.getActiveVendorCategories();
      }
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch vendor categories:", error);
      res.status(500).json({ error: "Failed to fetch vendor categories" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const category = await storage.getVendorCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Vendor category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch vendor category by slug:", error);
      res.status(500).json({ error: "Failed to fetch vendor category" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const category = await storage.getVendorCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Vendor category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch vendor category:", error);
      res.status(500).json({ error: "Failed to fetch vendor category" });
    }
  });

  router.post("/seed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const categories = await storage.seedVendorCategories();
      res.json({ 
        message: "Vendor categories seeded successfully", 
        count: categories.length,
        categories
      });
    } catch (error) {
      console.error("Failed to seed vendor categories:", error);
      res.status(500).json({ error: "Failed to seed vendor categories" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertVendorCategorySchema.parse(req.body);
      const category = await storage.createVendorCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create vendor category:", error);
      res.status(500).json({ error: "Failed to create vendor category" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateVendorCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Vendor category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update vendor category:", error);
      res.status(500).json({ error: "Failed to update vendor category" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.getVendorCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Vendor category not found" });
      }

      if (category.isSystemCategory) {
        return res.status(403).json({ error: "Cannot delete system categories" });
      }

      await storage.deleteVendorCategory(req.params.id);
      res.json({ message: "Vendor category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete vendor category:", error);
      res.status(500).json({ error: "Failed to delete vendor category" });
    }
  });
}
