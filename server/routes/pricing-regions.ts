import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertPricingRegionSchema } from "@shared/schema";

export async function registerPricingRegionsRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const regions = includeInactive 
        ? await storage.getAllPricingRegions()
        : await storage.getActivePricingRegions();
      res.json(regions);
    } catch (error) {
      console.error("Failed to fetch pricing regions:", error);
      res.status(500).json({ error: "Failed to fetch pricing regions" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const region = await storage.getPricingRegionBySlug(req.params.slug);
      if (!region) {
        return res.status(404).json({ error: "Pricing region not found" });
      }
      res.json(region);
    } catch (error) {
      console.error("Failed to fetch pricing region by slug:", error);
      res.status(500).json({ error: "Failed to fetch pricing region" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const region = await storage.getPricingRegion(req.params.id);
      if (!region) {
        return res.status(404).json({ error: "Pricing region not found" });
      }
      res.json(region);
    } catch (error) {
      console.error("Failed to fetch pricing region:", error);
      res.status(500).json({ error: "Failed to fetch pricing region" });
    }
  });

  router.post("/seed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const regions = await storage.seedPricingRegions();
      res.json({ 
        message: "Pricing regions seeded successfully", 
        count: regions.length,
        regions
      });
    } catch (error) {
      console.error("Failed to seed pricing regions:", error);
      res.status(500).json({ error: "Failed to seed pricing regions" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertPricingRegionSchema.parse(req.body);
      const region = await storage.createPricingRegion(validatedData);
      res.status(201).json(region);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create pricing region:", error);
      res.status(500).json({ error: "Failed to create pricing region" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const region = await storage.updatePricingRegion(req.params.id, req.body);
      if (!region) {
        return res.status(404).json({ error: "Pricing region not found" });
      }
      res.json(region);
    } catch (error) {
      console.error("Failed to update pricing region:", error);
      res.status(500).json({ error: "Failed to update pricing region" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const region = await storage.getPricingRegion(req.params.id);
      if (!region) {
        return res.status(404).json({ error: "Pricing region not found" });
      }

      if (region.isSystemRegion) {
        return res.status(403).json({ error: "Cannot delete system regions" });
      }

      await storage.deletePricingRegion(req.params.id);
      res.json({ message: "Pricing region deleted successfully" });
    } catch (error) {
      console.error("Failed to delete pricing region:", error);
      res.status(500).json({ error: "Failed to delete pricing region" });
    }
  });
}
