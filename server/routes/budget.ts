import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertExpenseSchema, insertBudgetAllocationSchema, insertBudgetBenchmarkSchema, BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";

export async function registerBudgetRoutes(router: Router, storage: IStorage) {
  router.get("/buckets", async (_req, res) => {
    try {
      const buckets = BUDGET_BUCKETS.map(bucket => ({
        id: bucket,
        label: BUDGET_BUCKET_LABELS[bucket],
      }));
      res.json(buckets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget buckets" });
    }
  });

  router.get("/allocations/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const allocations = await storage.getBudgetAllocationsByWedding(req.params.weddingId);
      
      const bucketsWithAllocations = BUDGET_BUCKETS.map(bucket => {
        const allocation = allocations.find(a => a.bucket === bucket);
        return {
          bucket,
          label: BUDGET_BUCKET_LABELS[bucket],
          allocatedAmount: allocation?.allocatedAmount || "0",
          allocationId: allocation?.id || null,
        };
      });
      
      res.json(bucketsWithAllocations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget allocations" });
    }
  });

  router.post("/allocations", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertBudgetAllocationSchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(validatedData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const allocation = await storage.upsertBudgetAllocation(
        validatedData.weddingId,
        validatedData.bucket as BudgetBucket,
        validatedData.allocatedAmount
      );
      res.json(allocation);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget allocation" });
    }
  });

  router.patch("/allocations/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingAllocation = await storage.getBudgetAllocation(req.params.id);
      if (!existingAllocation) {
        return res.status(404).json({ error: "Budget allocation not found" });
      }

      const wedding = await storage.getWedding(existingAllocation.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingAllocation.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const allocation = await storage.updateBudgetAllocation(req.params.id, req.body);
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update budget allocation" });
    }
  });

  router.delete("/allocations/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingAllocation = await storage.getBudgetAllocation(req.params.id);
      if (!existingAllocation) {
        return res.status(404).json({ error: "Budget allocation not found" });
      }

      const wedding = await storage.getWedding(existingAllocation.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingAllocation.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteBudgetAllocation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget allocation" });
    }
  });

  router.post("/allocations/estimate", async (req, res) => {
    try {
      const { budget, city, tradition, guestCount } = req.body;
      const benchmarks = await storage.getBudgetBenchmarksByCityAndTradition(city, tradition);
      
      const allocations = benchmarks.map((b) => ({
        bucket: b.categoryName,
        label: BUDGET_BUCKET_LABELS[b.categoryName as BudgetBucket] || b.categoryName,
        allocatedAmount: Math.round((budget * (b.percentageOfBudget || 0)) / 100),
        percentageOfBudget: b.percentageOfBudget,
        priority: b.priority,
        typicalRange: b.typicalRange,
      }));
      
      res.json({ allocations, guestCount });
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

  router.get("/expenses/:weddingId/by-bucket/:bucket", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
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

  router.get("/expenses/:weddingId/by-ceremony/:ceremonyId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
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
      if (wedding.userId !== authReq.session.userId) {
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
      if (wedding.userId !== authReq.session.userId) {
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
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingExpense.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

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
      if (wedding.userId !== authReq.session.userId) {
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

  router.get("/benchmarks", async (_req, res) => {
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
      
      const [wedding, allocations, expenses, events, bookings, benchmarks] = await Promise.all([
        storage.getWedding(weddingId),
        storage.getBudgetAllocationsByWedding(weddingId),
        storage.getExpensesByWedding(weddingId),
        storage.getEventsByWedding(weddingId),
        storage.getBookingsByWedding(weddingId),
        storage.getAllBudgetBenchmarks(),
      ]);

      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const totalBudget = wedding.budget || 0;
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
      const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

      const bucketBreakdown = BUDGET_BUCKETS.map(bucket => {
        const allocation = allocations.find(a => a.bucket === bucket);
        const bucketExpenses = expenses.filter(e => e.parentCategory === bucket);
        const allocated = parseFloat(allocation?.allocatedAmount || '0');
        const spent = bucketExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        
        return {
          bucket,
          label: BUDGET_BUCKET_LABELS[bucket],
          allocated,
          spent,
          remaining: allocated - spent,
          percentUsed: allocated ? Math.round((spent / allocated) * 100) : 0,
        };
      });

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
        bucketBreakdown,
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
