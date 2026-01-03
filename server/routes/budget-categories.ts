import { Router } from "express";
import type { IStorage } from "../storage";
import { insertBudgetCategorySchema } from "@shared/schema";

export async function registerBudgetCategoryRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const categories = await storage.getBudgetCategoriesByWedding(req.params.weddingId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget category" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // Convert ISO string to Date for lastEstimatedAt if present
      if (updateData.lastEstimatedAt && typeof updateData.lastEstimatedAt === 'string') {
        updateData.lastEstimatedAt = new Date(updateData.lastEstimatedAt);
      }
      
      const category = await storage.updateBudgetCategory(req.params.id, updateData);
      if (!category) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("[Budget Category PATCH] Error:", error);
      res.status(500).json({ error: "Failed to update budget category" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteBudgetCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  router.post("/estimate", async (req, res) => {
    try {
      const { category, city, tradition, guestCount } = req.body;
      
      console.log("[Budget Estimate] Request received:", { category, city, tradition, guestCount });
      
      if (!category || !city) {
        console.log("[Budget Estimate] Missing required fields:", { category, city });
        return res.status(400).json({ error: "Category and city are required" });
      }

      const { getBudgetCategoryEstimate } = await import('../ai/gemini');
      const estimate = await getBudgetCategoryEstimate({
        category,
        city,
        tradition,
        guestCount,
      });

      console.log("[Budget Estimate] Result:", estimate);
      res.json(estimate);
    } catch (error) {
      console.error("[Budget Estimate] Error:", error);
      res.status(500).json({ 
        lowEstimate: 0,
        highEstimate: 0,
        averageEstimate: 0,
        notes: "",
        hasEstimate: false,
      });
    }
  });
}
