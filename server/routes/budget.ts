import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertBudgetCategorySchema, insertExpenseSchema, insertBudgetBenchmarkSchema } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";

export async function registerBudgetRoutes(router: Router, storage: IStorage) {
  router.get("/categories/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const categories = await storage.getBudgetCategoriesByWedding(req.params.weddingId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  router.post("/categories", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertBudgetCategorySchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(validatedData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const category = await storage.createBudgetCategory(validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget category" });
    }
  });

  router.patch("/categories/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingCategory = await storage.getBudgetCategory(req.params.id);
      if (!existingCategory) {
        return res.status(404).json({ error: "Budget category not found" });
      }

      const wedding = await storage.getWedding(existingCategory.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingCategory.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const category = await storage.updateBudgetCategory(req.params.id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update budget category" });
    }
  });

  router.delete("/categories/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingCategory = await storage.getBudgetCategory(req.params.id);
      if (!existingCategory) {
        return res.status(404).json({ error: "Budget category not found" });
      }

      const wedding = await storage.getWedding(existingCategory.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingCategory.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteBudgetCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  router.post("/categories/estimate", async (req, res) => {
    try {
      const { budget, city, tradition, guestCount } = req.body;
      const benchmarks = await storage.getBudgetBenchmarksByCityAndTradition(city, tradition);
      
      const categories = benchmarks.map((b) => ({
        name: b.categoryName,
        allocatedAmount: Math.round((budget * (b.percentageOfBudget || 0)) / 100),
        percentageOfBudget: b.percentageOfBudget,
        priority: b.priority,
        typicalRange: b.typicalRange,
      }));
      
      res.json({ categories, guestCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate budget estimate" });
    }
  });

  router.get("/expenses/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
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

  router.get("/expenses/by-id/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      const wedding = await storage.getWedding(expense.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(expense.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const splits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  router.post("/expenses", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { splits, ...expenseData } = req.body;
      
      const wedding = await storage.getWedding(expenseData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(expenseData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const validatedData = insertExpenseSchema.parse(expenseData);
      const expense = await storage.createExpense(validatedData);
      
      if (splits && Array.isArray(splits)) {
        for (const split of splits) {
          await storage.createExpenseSplit({
            expenseId: expense.id,
            userId: split.userId,
            amount: split.amount,
            isPaid: split.isPaid || false,
          });
        }
      }
      
      const createdSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: createdSplits });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  router.patch("/expenses/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingExpense = await storage.getExpense(req.params.id);
      if (!existingExpense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      const wedding = await storage.getWedding(existingExpense.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingExpense.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const { splits, ...expenseData } = req.body;
      const expense = await storage.updateExpense(req.params.id, expenseData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      if (splits && Array.isArray(splits)) {
        const existingSplits = await storage.getExpenseSplitsByExpense(expense.id);
        for (const existing of existingSplits) {
          await storage.deleteExpenseSplit(existing.id);
        }
        for (const split of splits) {
          await storage.createExpenseSplit({
            expenseId: expense.id,
            userId: split.userId,
            amount: split.amount,
            isPaid: split.isPaid || false,
          });
        }
      }
      
      const updatedSplits = await storage.getExpenseSplitsByExpense(expense.id);
      res.json({ ...expense, splits: updatedSplits });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  router.delete("/expenses/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingExpense = await storage.getExpense(req.params.id);
      if (!existingExpense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      const wedding = await storage.getWedding(existingExpense.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingExpense.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  router.patch("/expense-splits/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const split = await storage.updateExpenseSplit(req.params.id, req.body);
      if (!split) {
        return res.status(404).json({ error: "Expense split not found" });
      }
      res.json(split);
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense split" });
    }
  });

  router.get("/expenses/:weddingId/settlement", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      const expenses = await storage.getExpensesByWedding(weddingId);
      
      const allSplits = await Promise.all(
        expenses.map(e => storage.getExpenseSplitsByExpense(e.id))
      );
      
      const userBalances: Record<string, { paid: number; owes: number; net: number }> = {};
      
      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        const splits = allSplits[i];
        
        if (expense.paidById) {
          if (!userBalances[expense.paidById]) {
            userBalances[expense.paidById] = { paid: 0, owes: 0, net: 0 };
          }
          const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
          userBalances[expense.paidById].paid += amount;
        }
        
        for (const split of splits) {
          if (!userBalances[split.userId]) {
            userBalances[split.userId] = { paid: 0, owes: 0, net: 0 };
          }
          const amount = typeof split.amount === 'string' ? parseFloat(split.amount) : split.amount;
          userBalances[split.userId].owes += amount;
        }
      }
      
      Object.keys(userBalances).forEach(userId => {
        userBalances[userId].net = userBalances[userId].paid - userBalances[userId].owes;
      });
      
      res.json({ balances: userBalances, expenses: expenses.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate settlement" });
    }
  });

  router.get("/benchmarks", async (req, res) => {
    try {
      const benchmarks = await storage.getAllBudgetBenchmarks();
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget benchmarks" });
    }
  });

  router.get("/benchmarks/:city/:tradition", async (req, res) => {
    try {
      const { city, tradition } = req.params;
      const benchmarks = await storage.getBudgetBenchmarksByCityAndTradition(city, tradition);
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget benchmarks" });
    }
  });

  router.get("/analytics/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      const [wedding, categories, events, bookings, benchmarks] = await Promise.all([
        storage.getWedding(weddingId),
        storage.getBudgetCategoriesByWedding(weddingId),
        storage.getEventsByWedding(weddingId),
        storage.getBookingsByWedding(weddingId),
        storage.getAllBudgetBenchmarks(),
      ]);

      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const totalBudget = wedding.budget || 0;
      const totalAllocated = categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);
      const totalSpent = categories.reduce((sum, c) => sum + (c.spentAmount || 0), 0);

      const categoryBreakdown = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        allocated: cat.allocatedAmount || 0,
        spent: cat.spentAmount || 0,
        remaining: (cat.allocatedAmount || 0) - (cat.spentAmount || 0),
        percentUsed: cat.allocatedAmount ? Math.round(((cat.spentAmount || 0) / cat.allocatedAmount) * 100) : 0,
      }));

      const traditionBenchmarks = benchmarks.filter(b => 
        b.tradition === wedding.tradition && 
        (b.city === wedding.city || b.city === 'National')
      );

      res.json({
        overview: {
          totalBudget,
          totalAllocated,
          totalSpent,
          remaining: totalBudget - totalSpent,
          percentSpent: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
        },
        categoryBreakdown,
        eventCount: events.length,
        vendorBookings: bookings.length,
        benchmarks: traditionBenchmarks,
      });
    } catch (error) {
      console.error("Error fetching budget analytics:", error);
      res.status(500).json({ error: "Failed to fetch budget analytics" });
    }
  });

  router.post("/benchmarks", async (req, res) => {
    try {
      const validatedData = insertBudgetBenchmarkSchema.parse(req.body);
      const benchmark = await storage.createBudgetBenchmark(validatedData);
      res.json(benchmark);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget benchmark" });
    }
  });

  return router;
}
