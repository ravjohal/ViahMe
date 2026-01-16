import { Router } from "express";
import type { IStorage } from "../storage";
import { insertExpenseSchema, type BudgetBucket } from "@shared/schema";

export async function registerExpenseRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      const expensesWithSplits = await Promise.all(
        expenses.map(async (expense) => {
          const splits = await storage.getExpenseSplitsByExpense(expense.id);
          return { ...expense, splits };
        })
      );
      res.json(expensesWithSplits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  router.get("/by-id/:id", async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      const splits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  router.get("/:weddingId/by-bucket/:bucket", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByBucket(req.params.weddingId, req.params.bucket as BudgetBucket);
      const expensesWithSplits = await Promise.all(
        expenses.map(async (expense) => {
          const splits = await storage.getExpenseSplitsByExpense(expense.id);
          return { ...expense, splits };
        })
      );
      res.json(expensesWithSplits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses by bucket" });
    }
  });

  router.get("/:weddingId/by-ceremony/:ceremonyId", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByCeremony(req.params.weddingId, req.params.ceremonyId);
      const expensesWithSplits = await Promise.all(
        expenses.map(async (expense) => {
          const splits = await storage.getExpenseSplitsByExpense(expense.id);
          return { ...expense, splits };
        })
      );
      res.json(expensesWithSplits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses by ceremony" });
    }
  });

  router.get("/:weddingId/totals", async (req, res) => {
    try {
      // Auto-recalculate ceremony aggregates on each load to ensure fresh data
      // This aggregates ceremony budget categories by budgetBucketId → autoLow/autoHigh/autoItemCount
      await storage.recalculateBucketAllocationsFromCeremonies(req.params.weddingId);
      
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      const allocations = await storage.getBudgetAllocationsByWedding(req.params.weddingId);
      
      // Use UUID-based categories from database instead of slug constants
      const categories = await storage.getActiveBudgetCategories();
      
      const bucketTotals = categories.map(category => {
        // Match allocations by UUID (bucketCategoryId) with fallback to legacy slug
        const allocation = allocations.find(a => 
          a.bucketCategoryId === category.id || a.bucket === category.slug
        );
        // Match expenses by UUID (bucketCategoryId) with fallback to legacy slug
        const bucketExpenses = expenses.filter(e => 
          e.bucketCategoryId === category.id || e.parentCategory === category.slug
        );
        const spent = bucketExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        const allocated = parseFloat(allocation?.allocatedAmount || '0');
        // Auto-calculated values from ceremony budget categories
        const autoLow = parseFloat(allocation?.autoLowAmount || '0');
        const autoHigh = parseFloat(allocation?.autoHighAmount || '0');
        const autoItemCount = allocation?.autoItemCount || 0;
        const isManualOverride = allocation?.isManualOverride || false;
        return {
          bucket: category.id, // UUID as primary key
          slug: category.slug, // For backward compatibility during transition
          label: category.displayName,
          allocated,
          spent,
          remaining: allocated - spent,
          // Auto-aggregation from ceremony budget categories
          autoLow,
          autoHigh,
          autoItemCount,
          isManualOverride,
          allocationId: allocation?.id || null,
        };
      });
      
      const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
      
      res.json({
        bucketTotals,
        totalSpent,
        totalAllocated,
        totalRemaining: totalAllocated - totalSpent,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense totals" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { splits, bucketCategoryId, ...expenseData } = req.body;
      
      // Resolve bucketCategoryId (UUID) to parentCategory (slug) for backward compatibility
      let parentCategory = expenseData.parentCategory || 'other';
      let resolvedBucketCategoryId = bucketCategoryId;
      
      if (bucketCategoryId) {
        // Look up the bucket category to get its slug
        const bucketCategory = await storage.getBudgetBucketCategory(bucketCategoryId);
        if (bucketCategory) {
          parentCategory = bucketCategory.slug;
          resolvedBucketCategoryId = bucketCategory.id;
        }
      } else if (!expenseData.parentCategory) {
        // If no bucketCategoryId and no parentCategory, find the 'other' bucket UUID
        const allCategories = await storage.getAllBudgetBucketCategories();
        const otherBucket = allCategories.find(c => c.slug === 'other');
        if (otherBucket) {
          resolvedBucketCategoryId = otherBucket.id;
        }
      }
      
      const validatedData = insertExpenseSchema.parse({
        ...expenseData,
        parentCategory,
        bucketCategoryId: resolvedBucketCategoryId,
      });
      const expense = await storage.createExpense(validatedData);
      
      if (splits && Array.isArray(splits)) {
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      const createdSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: createdSplits });
    } catch (error) {
      console.error("[Expense POST] Error:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { splits, expenseDate, paymentDueDate, ...expenseData } = req.body;
      
      const updateData = {
        ...expenseData,
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...(paymentDueDate && { paymentDueDate: new Date(paymentDueDate) }),
      };
      
      const expense = await storage.updateExpense(req.params.id, updateData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      if (splits && Array.isArray(splits)) {
        await storage.deleteExpenseSplitsByExpense(expense.id);
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      const updatedSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: updatedSplits });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteExpenseSplitsByExpense(req.params.id);
      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  router.patch("/splits/:id", async (req, res) => {
    try {
      const split = await storage.updateExpenseSplit(req.params.id, req.body);
      if (!split) {
        return res.status(404).json({ error: "Expense split not found" });
      }
      res.json(split);
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense split" });
    }
  });
}
