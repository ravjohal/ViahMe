import { Router } from "express";
import type { IStorage } from "../storage";
import type { CeremonyBudgetCategoryItem } from "@shared/schema";

const PARENT_BUDGET_CATEGORY_MAP: Record<string, string> = {
  "venue": "venue",
  "venue (typically at home)": "venue",
  "venue (typically a home)": "venue",
  "venue (typically home)": "venue",
  "venue (typically a sikh temple)": "venue",
  "photographer": "photography",
  "caterer": "catering",
  "catering": "catering",
  "decoration": "decoration",
  "decor": "decoration",
  "dj": "entertainment",
  "makeup": "attire",
  "entertainment": "entertainment",
  "entertainment (singers, bands, bhangra teams)": "entertainment",
  "alcohol / drinks": "catering",
  "alcohol/drinks": "catering",
  "bartenders": "catering",
  "gurdwara bheta / donation": "other",
  "rumalla sahib": "other",
  "raagi jatha / kirtan musicians": "entertainment",
  "shagun / gifts": "other",
  "shagun / gifts for other side": "other",
  "gifts / shagun": "other",
  "dhol player": "entertainment",
  "attire for groom": "attire",
  "attire for bride": "attire",
  "attire for groom's side": "attire",
  "attire for bride's side": "attire",
  "hotels for guests": "other",
  "transportation for guests": "transportation",
  "horse rental": "transportation",
  "car rental": "transportation",
  "limo rental": "transportation",
};

function getParentBudgetCategory(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();
  return PARENT_BUDGET_CATEGORY_MAP[normalized] || "other";
}

export function createSpendCategoriesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const categories = await storage.getAllSpendCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching spend categories:", error);
      res.status(500).json({ error: "Failed to fetch spend categories" });
    }
  });

  router.get("/by-parent/:parentCategory", async (req, res) => {
    try {
      const { parentCategory } = req.params;
      const categories = await storage.getSpendCategoriesByParent(parentCategory);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching spend categories by parent:", error);
      res.status(500).json({ error: "Failed to fetch spend categories" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getSpendCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Spend category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching spend category:", error);
      res.status(500).json({ error: "Failed to fetch spend category" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { name, parentBudgetCategory, description, isSystemDefault } = req.body;
      
      if (!name || !parentBudgetCategory) {
        return res.status(400).json({ error: "Name and parent budget category are required" });
      }

      const category = await storage.createSpendCategory({
        name,
        parentBudgetCategory,
        description: description || null,
        isSystemDefault: isSystemDefault ?? false,
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating spend category:", error);
      res.status(500).json({ error: "Failed to create spend category" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = req.body;
      const category = await storage.updateSpendCategory(id, update);
      if (!category) {
        return res.status(404).json({ error: "Spend category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating spend category:", error);
      res.status(500).json({ error: "Failed to update spend category" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSpendCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Spend category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting spend category:", error);
      res.status(500).json({ error: "Failed to delete spend category" });
    }
  });

  router.post("/seed", async (_req, res) => {
    try {
      const result = await seedSpendCategoriesFromCeremonies(storage);
      res.json(result);
    } catch (error) {
      console.error("Error seeding spend categories:", error);
      res.status(500).json({ error: "Failed to seed spend categories" });
    }
  });

  return router;
}

export function createCeremonySpendCategoriesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/ceremony/:ceremonyId", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const categories = await storage.getCeremonySpendCategoriesWithDetails(ceremonyId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching ceremony spend categories:", error);
      res.status(500).json({ error: "Failed to fetch ceremony spend categories" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { ceremonyId, spendCategoryId, lowCost, highCost, unit, hoursLow, hoursHigh, notes } = req.body;
      
      if (!ceremonyId || !spendCategoryId) {
        return res.status(400).json({ error: "Ceremony ID and spend category ID are required" });
      }

      const mapping = await storage.createCeremonySpendCategory({
        ceremonyId,
        spendCategoryId,
        lowCost: lowCost || "0",
        highCost: highCost || "0",
        unit: unit || "fixed",
        hoursLow: hoursLow || null,
        hoursHigh: hoursHigh || null,
        notes: notes || null,
      });
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating ceremony spend category:", error);
      res.status(500).json({ error: "Failed to create ceremony spend category" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = req.body;
      const mapping = await storage.updateCeremonySpendCategory(id, update);
      if (!mapping) {
        return res.status(404).json({ error: "Ceremony spend category not found" });
      }
      res.json(mapping);
    } catch (error) {
      console.error("Error updating ceremony spend category:", error);
      res.status(500).json({ error: "Failed to update ceremony spend category" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCeremonySpendCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Ceremony spend category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ceremony spend category:", error);
      res.status(500).json({ error: "Failed to delete ceremony spend category" });
    }
  });

  return router;
}

export async function seedSpendCategoriesFromCeremonies(storage: IStorage): Promise<{ 
  spendCategoriesCreated: number;
  ceremonyMappingsCreated: number;
}> {
  let spendCategoriesCreated = 0;
  let ceremonyMappingsCreated = 0;

  const spendCategoryCache: Map<string, string> = new Map();

  // Fetch ceremony types from database
  const templates = await storage.getAllCeremonyTypes();

  for (const template of templates) {
    const ceremonyId = template.ceremonyId;
    
    // Fetch line items from the normalized ceremony_budget_categories table using UUID
    const lineItems = await storage.getCeremonyBudgetCategoriesByUuid(template.id);
    
    if (!lineItems || lineItems.length === 0) {
      continue;
    }

    for (const item of lineItems) {
      const categoryName = item.name;
      const parentCategory = item.budgetBucket || getParentBudgetCategory(categoryName);

      let spendCategoryId = spendCategoryCache.get(categoryName.toLowerCase());

      if (!spendCategoryId) {
        let existing = await storage.getSpendCategoryByName(categoryName);
        
        if (!existing) {
          existing = await storage.createSpendCategory({
            name: categoryName,
            parentBudgetCategory: parentCategory,
            description: item.notes || null,
            isSystemDefault: true,
          });
          spendCategoriesCreated++;
        }
        
        spendCategoryId = existing.id;
        spendCategoryCache.set(categoryName.toLowerCase(), spendCategoryId);
      }

      const existingMappings = await storage.getCeremonySpendCategories(ceremonyId);
      const alreadyMapped = existingMappings.some(m => m.spendCategoryId === spendCategoryId);

      if (!alreadyMapped) {
        await storage.createCeremonySpendCategory({
          ceremonyId,
          spendCategoryId,
          lowCost: item.lowCost.toString(),
          highCost: item.highCost.toString(),
          unit: item.unit,
          hoursLow: item.hoursLow || null,
          hoursHigh: item.hoursHigh || null,
          notes: item.notes || null,
        });
        ceremonyMappingsCreated++;
      }
    }
  }

  return { spendCategoriesCreated, ceremonyMappingsCreated };
}
