import { Router, Request, Response, NextFunction } from "express";
import type { IStorage } from "../storage";
import { insertCeremonyTemplateSchema, insertRegionalPricingSchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

async function requireSiteAdmin(req: Request, res: Response, next: NextFunction, storage: IStorage) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUser(userId);
  if (!user || !user.isSiteAdmin) {
    return res.status(403).json({ error: "Site admin access required" });
  }
  
  next();
}

export function createCeremonyTemplatesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const templates = await storage.getAllCeremonyTemplates();
      res.json(templates);
    } catch (error) {
      console.error("[Ceremony Templates] Error fetching all:", error);
      res.status(500).json({ error: "Failed to fetch ceremony templates" });
    }
  });

  router.get("/tradition/:tradition", async (req, res) => {
    try {
      const { tradition } = req.params;
      const templates = await storage.getCeremonyTemplatesByTradition(tradition);
      res.json(templates);
    } catch (error) {
      console.error("[Ceremony Templates] Error fetching by tradition:", error);
      res.status(500).json({ error: "Failed to fetch ceremony templates" });
    }
  });

  router.get("/:ceremonyId", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const template = await storage.getCeremonyTemplate(ceremonyId);
      if (!template) {
        return res.status(404).json({ error: "Ceremony template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("[Ceremony Templates] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch ceremony template" });
    }
  });

  router.post("/", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const validatedData = insertCeremonyTemplateSchema.parse(req.body);
        const template = await storage.createCeremonyTemplate(validatedData);
        res.json(template);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Ceremony Templates] Error creating:", error);
        res.status(500).json({ error: "Failed to create ceremony template" });
      }
    }, storage);
  });

  router.patch("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        const template = await storage.updateCeremonyTemplate(ceremonyId, req.body);
        if (!template) {
          return res.status(404).json({ error: "Ceremony template not found" });
        }
        res.json(template);
      } catch (error) {
        console.error("[Ceremony Templates] Error updating:", error);
        res.status(500).json({ error: "Failed to update ceremony template" });
      }
    }, storage);
  });

  router.delete("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        await storage.deleteCeremonyTemplate(ceremonyId);
        res.json({ success: true });
      } catch (error) {
        console.error("[Ceremony Templates] Error deleting:", error);
        res.status(500).json({ error: "Failed to delete ceremony template" });
      }
    }, storage);
  });

  return router;
}

export function createRegionalPricingRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const pricing = await storage.getAllRegionalPricing();
      res.json(pricing);
    } catch (error) {
      console.error("[Regional Pricing] Error fetching all:", error);
      res.status(500).json({ error: "Failed to fetch regional pricing" });
    }
  });

  router.get("/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const pricing = await storage.getRegionalPricing(city);
      if (!pricing) {
        return res.status(404).json({ error: "Regional pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("[Regional Pricing] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch regional pricing" });
    }
  });

  router.post("/", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const validatedData = insertRegionalPricingSchema.parse(req.body);
        const pricing = await storage.createRegionalPricing(validatedData);
        res.json(pricing);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Regional Pricing] Error creating:", error);
        res.status(500).json({ error: "Failed to create regional pricing" });
      }
    }, storage);
  });

  router.patch("/:city", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { city } = req.params;
        const pricing = await storage.updateRegionalPricing(city, req.body);
        if (!pricing) {
          return res.status(404).json({ error: "Regional pricing not found" });
        }
        res.json(pricing);
      } catch (error) {
        console.error("[Regional Pricing] Error updating:", error);
        res.status(500).json({ error: "Failed to update regional pricing" });
      }
    }, storage);
  });

  return router;
}

export function createCeremonyEstimateRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { tradition, ceremonyId, guestCount, city } = req.body;

      if (!tradition || !ceremonyId || !guestCount) {
        return res.status(400).json({ error: "tradition, ceremonyId, and guestCount are required" });
      }

      const template = await storage.getCeremonyTemplate(ceremonyId);
      if (!template) {
        return res.status(404).json({ error: "Ceremony template not found" });
      }

      let multiplier = 1.0;
      if (city) {
        const pricing = await storage.getRegionalPricing(city);
        if (pricing) {
          multiplier = parseFloat(pricing.multiplier);
        }
      }

      const breakdown = template.costBreakdown as Array<{
        category: string;
        lowCost: number;
        highCost: number;
        unit: 'fixed' | 'per_person' | 'per_hour';
        hoursLow?: number;
        hoursHigh?: number;
        notes?: string;
      }>;

      let totalLow = 0;
      let totalHigh = 0;
      const categoryEstimates: Array<{
        category: string;
        lowCost: number;
        highCost: number;
        notes?: string;
      }> = [];

      for (const item of breakdown) {
        let itemLow = item.lowCost;
        let itemHigh = item.highCost;

        if (item.unit === 'per_person') {
          itemLow *= guestCount;
          itemHigh *= guestCount;
        } else if (item.unit === 'per_hour') {
          const hoursLow = item.hoursLow || 1;
          const hoursHigh = item.hoursHigh || hoursLow;
          itemLow *= hoursLow;
          itemHigh *= hoursHigh;
        }

        itemLow *= multiplier;
        itemHigh *= multiplier;

        totalLow += itemLow;
        totalHigh += itemHigh;

        categoryEstimates.push({
          category: item.category,
          lowCost: Math.round(itemLow),
          highCost: Math.round(itemHigh),
          notes: item.notes,
        });
      }

      res.json({
        ceremonyId,
        ceremonyName: template.name,
        tradition,
        guestCount,
        city: city || 'default',
        multiplier,
        totalLow: Math.round(totalLow),
        totalHigh: Math.round(totalHigh),
        costPerGuestLow: Math.round(totalLow / guestCount),
        costPerGuestHigh: Math.round(totalHigh / guestCount),
        breakdown: categoryEstimates,
      });
    } catch (error) {
      console.error("[Ceremony Estimate] Error:", error);
      res.status(500).json({ error: "Failed to calculate ceremony estimate" });
    }
  });

  return router;
}
