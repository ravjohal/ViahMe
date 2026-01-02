import { Router } from "express";
import type { IStorage } from "../storage";
import { insertExpenseSchema } from "@shared/schema";

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

  router.post("/", async (req, res) => {
    try {
      const { splits, ...expenseData } = req.body;
      const validatedData = insertExpenseSchema.parse(expenseData);
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
      console.error("Error creating expense:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { splits, ...expenseData } = req.body;
      const expense = await storage.updateExpense(req.params.id, expenseData);
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
