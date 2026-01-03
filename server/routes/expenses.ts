import { Router } from "express";
import type { IStorage } from "../storage";
import { insertExpenseSchema } from "@shared/schema";

// Helper to sync budget category spent amount from linked expenses
async function syncBudgetCategorySpent(storage: IStorage, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const total = await storage.getExpenseTotalByBudgetCategory(categoryId);
  const safeTotal = isNaN(total) ? 0 : total;
  await storage.updateBudgetCategory(categoryId, { spentAmount: safeTotal.toFixed(2) });
}

export async function registerExpenseRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      const expensesWithSplitsAndAllocations = await Promise.all(
        expenses.map(async (expense) => {
          const splits = await storage.getExpenseSplitsByExpense(expense.id);
          const eventAllocations = await storage.getExpenseEventAllocationsByExpense(expense.id);
          return { ...expense, splits, eventAllocations };
        })
      );
      res.json(expensesWithSplitsAndAllocations);
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
      const eventAllocations = await storage.getExpenseEventAllocationsByExpense(expense.id);
      res.json({ ...expense, splits, eventAllocations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { splits, eventAllocations, ...expenseData } = req.body;
      const validatedData = insertExpenseSchema.parse(expenseData);
      const expense = await storage.createExpense(validatedData);
      
      // Create expense splits (who pays what share)
      if (splits && Array.isArray(splits)) {
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      // Create event allocations (multi-event cost distribution)
      if (eventAllocations && Array.isArray(eventAllocations)) {
        for (const allocation of eventAllocations) {
          await storage.createExpenseEventAllocation({
            expenseId: expense.id,
            eventId: allocation.eventId,
            allocatedAmount: allocation.allocatedAmount,
            allocatedPercent: allocation.allocatedPercent,
          });
        }
      }
      
      // Sync budget category spent amount if linked
      await syncBudgetCategorySpent(storage, expense.categoryId);
      
      const createdSplits = await storage.getExpenseSplitsByExpense(expense.id);
      const createdAllocations = await storage.getExpenseEventAllocationsByExpense(expense.id);
      res.json({ ...expense, splits: createdSplits, eventAllocations: createdAllocations });
    } catch (error) {
      console.error("Error creating expense:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { splits, eventAllocations, expenseDate, ...expenseData } = req.body;
      // Get old expense to check if category changed
      const oldExpense = await storage.getExpense(req.params.id);
      const oldCategoryId = oldExpense?.categoryId;
      
      // Convert expenseDate string to Date object if provided
      const updateData = {
        ...expenseData,
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
      };
      
      const expense = await storage.updateExpense(req.params.id, updateData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      // Update splits if provided
      if (splits && Array.isArray(splits)) {
        await storage.deleteExpenseSplitsByExpense(expense.id);
        for (const split of splits) {
          await storage.createExpenseSplit({
            ...split,
            expenseId: expense.id,
          });
        }
      }
      
      // Update event allocations if provided
      if (eventAllocations && Array.isArray(eventAllocations)) {
        await storage.deleteExpenseEventAllocationsByExpense(expense.id);
        for (const allocation of eventAllocations) {
          await storage.createExpenseEventAllocation({
            expenseId: expense.id,
            eventId: allocation.eventId,
            allocatedAmount: allocation.allocatedAmount,
            allocatedPercent: allocation.allocatedPercent,
          });
        }
      }
      
      // Sync both old and new budget categories if they changed
      if (oldCategoryId !== expense.categoryId) {
        await syncBudgetCategorySpent(storage, oldCategoryId);
      }
      await syncBudgetCategorySpent(storage, expense.categoryId);
      
      const updatedSplits = await storage.getExpenseSplitsByExpense(expense.id);
      const updatedAllocations = await storage.getExpenseEventAllocationsByExpense(expense.id);
      res.json({ ...expense, splits: updatedSplits, eventAllocations: updatedAllocations });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      // Get expense before deleting to sync budget category
      const expense = await storage.getExpense(req.params.id);
      const categoryId = expense?.categoryId;
      
      // Delete related data first
      await storage.deleteExpenseSplitsByExpense(req.params.id);
      await storage.deleteExpenseEventAllocationsByExpense(req.params.id);
      await storage.deleteExpense(req.params.id);
      
      // Sync budget category after deletion
      await syncBudgetCategorySpent(storage, categoryId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  router.get("/:weddingId/settlement", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);
      
      const balances: Record<string, { name: string; paid: number; owes: number; balance: number }> = {};
      
      for (const expense of expenses) {
        const splits = await storage.getExpenseSplitsByExpense(expense.id);
        
        if (!balances[expense.paidById]) {
          balances[expense.paidById] = { name: expense.paidByName, paid: 0, owes: 0, balance: 0 };
        }
        balances[expense.paidById].paid += parseFloat(expense.amount);
        
        for (const split of splits) {
          if (!balances[split.userId]) {
            balances[split.userId] = { name: split.userName, paid: 0, owes: 0, balance: 0 };
          }
          if (!split.isPaid) {
            balances[split.userId].owes += parseFloat(split.shareAmount);
          }
        }
      }
      
      for (const userId in balances) {
        balances[userId].balance = balances[userId].paid - balances[userId].owes;
      }
      
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate settlement" });
    }
  });
}

export async function registerExpenseSplitRoutes(router: Router, storage: IStorage) {
  router.patch("/:id", async (req, res) => {
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
