import { Router } from "express";
import type { IStorage } from "../storage";
import { insertBudgetAllocationSchema, type BudgetBucket } from "@shared/schema";

// Helper to get budget bucket labels from database
async function getBudgetBucketLabels(storage: IStorage): Promise<Record<string, string>> {
  const categories = await storage.getActiveBudgetCategories();
  const labels: Record<string, string> = {};
  for (const cat of categories) {
    labels[cat.slug] = cat.displayName;
  }
  return labels;
}

export async function registerBudgetBucketCategoryRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const allocations = await storage.getBudgetAllocationsByWedding(req.params.weddingId);
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      const budgetCategories = await storage.getActiveBudgetCategories();
      
      const categories = budgetCategories.map(cat => {
        const allocation = allocations.find(a => a.bucket === cat.slug);
        const bucketExpenses = expenses.filter(e => e.parentCategory === cat.slug);
        const spentAmount = bucketExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        
        return {
          id: allocation?.id || cat.slug,
          name: cat.displayName,
          bucket: cat.slug,
          allocatedAmount: parseFloat(allocation?.allocatedAmount || '0'),
          spentAmount,
          weddingId: req.params.weddingId,
        };
      });
      
      res.json(categories);
    } catch (error) {
      console.error("[Budget Categories GET] Error:", error);
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { weddingId, bucket, allocatedAmount } = req.body;
      const allocation = await storage.upsertBudgetAllocation(weddingId, bucket as BudgetBucket, String(allocatedAmount));
      const labels = await getBudgetBucketLabels(storage);
      res.json({
        id: allocation.id,
        name: labels[bucket] || bucket,
        bucket,
        allocatedAmount: parseFloat(allocation.allocatedAmount),
        spentAmount: 0,
        weddingId,
      });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget category" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { allocatedAmount } = req.body;
      
      const allocation = await storage.updateBudgetAllocation(req.params.id, { 
        allocatedAmount: String(allocatedAmount) 
      });
      if (!allocation) {
        return res.status(404).json({ error: "Budget allocation not found" });
      }
      
      const expenses = await storage.getExpensesByBucket(allocation.weddingId, allocation.bucket as BudgetBucket);
      const spentAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
      const labels = await getBudgetBucketLabels(storage);
      
      res.json({
        id: allocation.id,
        name: labels[allocation.bucket] || allocation.bucket,
        bucket: allocation.bucket,
        allocatedAmount: parseFloat(allocation.allocatedAmount),
        spentAmount,
        weddingId: allocation.weddingId,
      });
    } catch (error) {
      console.error("[Budget Category PATCH] Error:", error);
      res.status(500).json({ error: "Failed to update budget category" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteBudgetAllocation(req.params.id);
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
