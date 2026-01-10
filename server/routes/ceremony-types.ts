import { Router, Request, Response, NextFunction } from "express";
import type { IStorage } from "../storage";
import { insertCeremonyTypeSchema, insertRegionalPricingSchema } from "@shared/schema";

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

export function createCeremonyTypesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const types = await storage.getAllCeremonyTypes();
      res.json(types);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching all:", error);
      res.status(500).json({ error: "Failed to fetch ceremony types" });
    }
  });

  router.get("/tradition/:tradition", async (req, res) => {
    try {
      const { tradition } = req.params;
      const types = await storage.getCeremonyTypesByTradition(tradition);
      res.json(types);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching by tradition:", error);
      res.status(500).json({ error: "Failed to fetch ceremony types" });
    }
  });

  router.get("/all/line-items", async (req, res) => {
    try {
      const allItems = await storage.getAllCeremonyBudgetCategories();
      
      const grouped: Record<string, Array<{
        category: string;
        lowCost: number;
        highCost: number;
        unit: 'fixed' | 'per_person' | 'per_hour';
        hoursLow?: number;
        hoursHigh?: number;
        notes?: string;
        budgetBucketId?: string;
      }>> = {};
      
      for (const item of allItems) {
        const key = item.ceremonyTypeId;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push({
          category: item.itemName,
          lowCost: parseFloat(item.lowCost),
          highCost: parseFloat(item.highCost),
          unit: item.unit as 'fixed' | 'per_person' | 'per_hour',
          hoursLow: item.hoursLow ? parseFloat(item.hoursLow) : undefined,
          hoursHigh: item.hoursHigh ? parseFloat(item.hoursHigh) : undefined,
          notes: item.notes ?? undefined,
          budgetBucketId: item.budgetBucketId ?? 'other',
        });
      }
      
      res.json(grouped);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching all line items:", error);
      res.status(500).json({ error: "Failed to fetch all ceremony line items" });
    }
  });

  router.get("/:ceremonyId", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }
      res.json(type);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch ceremony type" });
    }
  });

  router.get("/:ceremonyId/line-items", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }
      
      const budgetCategories = await storage.getCeremonyBudgetCategories(ceremonyId);
      
      const lineItems = budgetCategories.map(item => ({
        id: item.id,
        name: item.itemName,
        budgetBucketId: item.budgetBucketId || 'other',
        lowCost: parseFloat(item.lowCost),
        highCost: parseFloat(item.highCost),
        unit: item.unit,
        hoursLow: item.hoursLow ? parseFloat(item.hoursLow) : undefined,
        hoursHigh: item.hoursHigh ? parseFloat(item.hoursHigh) : undefined,
        notes: item.notes,
      }));
      
      res.json({
        ceremonyId: type.ceremonyId,
        ceremonyName: type.name,
        tradition: type.tradition,
        lineItems,
      });
    } catch (error) {
      console.error("[Ceremony Types] Error fetching line items:", error);
      res.status(500).json({ error: "Failed to fetch ceremony line items" });
    }
  });

  router.post("/", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const validatedData = insertCeremonyTypeSchema.parse(req.body);
        const type = await storage.createCeremonyType(validatedData);
        res.json(type);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Ceremony Types] Error creating:", error);
        res.status(500).json({ error: "Failed to create ceremony type" });
      }
    }, storage);
  });

  router.patch("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        const type = await storage.updateCeremonyType(ceremonyId, req.body);
        if (!type) {
          return res.status(404).json({ error: "Ceremony type not found" });
        }
        res.json(type);
      } catch (error) {
        console.error("[Ceremony Types] Error updating:", error);
        res.status(500).json({ error: "Failed to update ceremony type" });
      }
    }, storage);
  });

  router.delete("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        await storage.deleteCeremonyType(ceremonyId);
        res.json({ success: true });
      } catch (error) {
        console.error("[Ceremony Types] Error deleting:", error);
        res.status(500).json({ error: "Failed to delete ceremony type" });
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

      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }

      let multiplier = 1.0;
      if (city) {
        const pricing = await storage.getRegionalPricing(city);
        if (pricing) {
          multiplier = parseFloat(pricing.multiplier);
        }
      }

      const typeItems = await storage.getCeremonyTypeItems(ceremonyId);

      let totalLow = 0;
      let totalHigh = 0;
      const categoryEstimates: Array<{
        category: string;
        lowCost: number;
        highCost: number;
        notes?: string;
        budgetBucket?: string;
      }> = [];

      for (const item of typeItems) {
        let itemLow = parseFloat(item.lowCost);
        let itemHigh = parseFloat(item.highCost);

        if (item.unit === 'per_person') {
          itemLow *= guestCount;
          itemHigh *= guestCount;
        } else if (item.unit === 'per_hour') {
          const hoursLow = item.hoursLow ? parseFloat(item.hoursLow) : 1;
          const hoursHigh = item.hoursHigh ? parseFloat(item.hoursHigh) : hoursLow;
          itemLow *= hoursLow;
          itemHigh *= hoursHigh;
        }

        itemLow *= multiplier;
        itemHigh *= multiplier;

        totalLow += itemLow;
        totalHigh += itemHigh;

        categoryEstimates.push({
          category: item.itemName,
          lowCost: Math.round(itemLow),
          highCost: Math.round(itemHigh),
          notes: item.notes || undefined,
          budgetBucket: item.budgetBucket,
        });
      }

      res.json({
        ceremonyId,
        ceremonyName: type.name,
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
