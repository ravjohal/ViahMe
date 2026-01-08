import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertExpenseSchema, insertBudgetAllocationSchema, insertBudgetBenchmarkSchema, insertCeremonyBudgetSchema, insertCeremonyCategoryAllocationSchema, BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket } from "@shared/schema";
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

  // ============================================================================
  // CEREMONY BUDGETS - Per-ceremony/event budget targets (Budget Matrix)
  // ============================================================================

  router.get("/ceremony-budgets/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const ceremonyBudgets = await storage.getCeremonyBudgetsByWedding(req.params.weddingId);
      const events = await storage.getEventsByWedding(req.params.weddingId);
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);

      const ceremonyBreakdown = ceremonyBudgets.map(cb => {
        const event = events.find(e => e.id === cb.ceremonyId);
        const ceremonyExpenses = expenses.filter(e => e.ceremonyId === cb.ceremonyId);
        const spent = ceremonyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        const allocated = parseFloat(cb.allocatedAmount || '0');

        return {
          ...cb,
          eventName: event?.name || 'Unknown Event',
          eventDate: event?.date,
          spent,
          remaining: allocated - spent,
          percentUsed: allocated ? Math.round((spent / allocated) * 100) : 0,
        };
      });

      res.json(ceremonyBreakdown);
    } catch (error) {
      console.error("Error fetching ceremony budgets:", error);
      res.status(500).json({ error: "Failed to fetch ceremony budgets" });
    }
  });

  router.post("/ceremony-budgets", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertCeremonyBudgetSchema.parse(req.body);

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

      const ceremonyBudget = await storage.upsertCeremonyBudget(
        validatedData.weddingId,
        validatedData.ceremonyId,
        validatedData.allocatedAmount,
        validatedData.notes
      );
      res.json(ceremonyBudget);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Error creating ceremony budget:", error);
      res.status(500).json({ error: "Failed to create ceremony budget" });
    }
  });

  router.patch("/ceremony-budgets/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingBudget = await storage.getCeremonyBudget(req.params.id);
      if (!existingBudget) {
        return res.status(404).json({ error: "Ceremony budget not found" });
      }

      const wedding = await storage.getWedding(existingBudget.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingBudget.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const ceremonyBudget = await storage.updateCeremonyBudget(req.params.id, req.body);
      res.json(ceremonyBudget);
    } catch (error) {
      console.error("Error updating ceremony budget:", error);
      res.status(500).json({ error: "Failed to update ceremony budget" });
    }
  });

  router.delete("/ceremony-budgets/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingBudget = await storage.getCeremonyBudget(req.params.id);
      if (!existingBudget) {
        return res.status(404).json({ error: "Ceremony budget not found" });
      }

      const wedding = await storage.getWedding(existingBudget.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingBudget.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteCeremonyBudget(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ceremony budget:", error);
      res.status(500).json({ error: "Failed to delete ceremony budget" });
    }
  });

  router.get("/ceremony-analytics/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      const ceremonyBudgets = await storage.getCeremonyBudgetsByWedding(weddingId);
      const events = await storage.getEventsByWedding(weddingId);
      const expenses = await storage.getExpensesByWedding(weddingId);
      const wedding = await storage.getWedding(weddingId);

      const totalBudget = parseFloat(wedding?.budget || '0');
      const totalCeremonyAllocated = ceremonyBudgets.reduce((sum, cb) => sum + parseFloat(cb.allocatedAmount || '0'), 0);
      const unallocatedBudget = totalBudget - totalCeremonyAllocated;

      const ceremonyBreakdown = events.map(event => {
        const ceremonyBudget = ceremonyBudgets.find(cb => cb.ceremonyId === event.id);
        const ceremonyExpenses = expenses.filter(e => e.ceremonyId === event.id);
        const spent = ceremonyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        const allocated = parseFloat(ceremonyBudget?.allocatedAmount || '0');

        return {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          eventType: event.type,
          allocated,
          spent,
          remaining: allocated - spent,
          percentUsed: allocated ? Math.round((spent / allocated) * 100) : 0,
          isOverBudget: spent > allocated && allocated > 0,
          hasNoBudget: allocated === 0,
          expenseCount: ceremonyExpenses.length,
        };
      });

      const eventsWithBudget = ceremonyBreakdown.filter(c => c.allocated > 0);
      const eventsOverBudget = ceremonyBreakdown.filter(c => c.isOverBudget);

      res.json({
        overview: {
          totalBudget,
          totalCeremonyAllocated,
          unallocatedBudget,
          percentAllocated: totalBudget ? Math.round((totalCeremonyAllocated / totalBudget) * 100) : 0,
          isOverAllocated: totalCeremonyAllocated > totalBudget,
        },
        ceremonyBreakdown,
        summary: {
          totalEvents: events.length,
          eventsWithBudget: eventsWithBudget.length,
          eventsOverBudget: eventsOverBudget.length,
        },
      });
    } catch (error) {
      console.error("Error fetching ceremony analytics:", error);
      res.status(500).json({ error: "Failed to fetch ceremony analytics" });
    }
  });

  // ============================================================================
  // CEREMONY CATEGORY ALLOCATIONS (Budget Matrix - ceremony x category grid)
  // ============================================================================

  // POST /api/budget/allocate - Allocate budget to ceremony+category with validation
  router.post("/allocate", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, ceremonyId, categoryKey, amount, notes } = req.body;

      if (!weddingId || !ceremonyId || !categoryKey || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields: weddingId, ceremonyId, categoryKey, amount" });
      }

      // Validate categoryKey is a valid budget bucket
      if (!BUDGET_BUCKETS.includes(categoryKey)) {
        return res.status(400).json({ error: `Invalid category key. Must be one of: ${BUDGET_BUCKETS.join(', ')}` });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      // Check access
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Get the global category budget (from budgetAllocations table)
      const globalCategoryBudget = await storage.getBudgetAllocationByBucket(weddingId, categoryKey as BudgetBucket);
      const globalLimit = parseFloat(globalCategoryBudget?.allocatedAmount || '0');

      // Calculate current total across all ceremonies for this category (excluding current allocation if updating)
      const existingAllocation = await storage.getCeremonyCategoryAllocation(weddingId, ceremonyId, categoryKey as BudgetBucket);
      const currentTotal = await storage.getCategoryTotalAcrossCeremonies(weddingId, categoryKey as BudgetBucket);
      
      // Calculate what the new total would be
      const existingAmount = parseFloat(existingAllocation?.allocatedAmount || '0');
      const newAmount = parseFloat(amount);
      const projectedTotal = currentTotal - existingAmount + newAmount;

      // Validation: Check if new total exceeds global category budget
      if (globalLimit > 0 && projectedTotal > globalLimit) {
        const remaining = globalLimit - (currentTotal - existingAmount);
        return res.status(400).json({
          error: "Allocation exceeds global category budget",
          details: {
            categoryKey,
            categoryLabel: BUDGET_BUCKET_LABELS[categoryKey as BudgetBucket],
            globalBudget: globalLimit,
            currentAllocated: currentTotal - existingAmount,
            requested: newAmount,
            maxAllowable: Math.max(0, remaining),
          }
        });
      }

      // Upsert the allocation
      const allocation = await storage.upsertCeremonyCategoryAllocation(
        weddingId,
        ceremonyId,
        categoryKey as BudgetBucket,
        amount.toString(),
        notes
      );

      // Calculate ceremony total after update
      const ceremonyTotal = await storage.getCeremonyTotalAcrossCategories(weddingId, ceremonyId);
      const categoryTotal = await storage.getCategoryTotalAcrossCeremonies(weddingId, categoryKey as BudgetBucket);

      res.json({
        allocation,
        summary: {
          ceremonyTotal,
          categoryTotal,
          categoryRemaining: globalLimit > 0 ? globalLimit - categoryTotal : null,
        }
      });
    } catch (error) {
      console.error("Error allocating budget:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to allocate budget" });
    }
  });

  // GET /api/budget/matrix/:weddingId - Get full budget matrix (ceremonies x categories)
  router.get("/matrix/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { weddingId } = req.params;

      // Get all events/ceremonies for this wedding
      const events = await storage.getEventsByWedding(weddingId);
      
      // Get all ceremony-category allocations
      const allocations = await storage.getCeremonyCategoryAllocationsByWedding(weddingId);
      
      // Get global bucket allocations (source of truth for category limits)
      const bucketAllocations = await storage.getBudgetAllocationsByWedding(weddingId);

      // Build a lookup map: ceremonyId -> categoryKey -> allocation
      const allocationMap = new Map<string, Map<string, typeof allocations[0]>>();
      for (const alloc of allocations) {
        if (!allocationMap.has(alloc.ceremonyId)) {
          allocationMap.set(alloc.ceremonyId, new Map());
        }
        allocationMap.get(alloc.ceremonyId)!.set(alloc.categoryKey, alloc);
      }

      // Build rows (ceremonies) with their allocations
      const rows = events.map(event => {
        const ceremonyAllocations = allocationMap.get(event.id) || new Map();
        const cells: Record<string, { amount: string; allocationId: string | null }> = {};
        
        let ceremonyTotal = 0;
        for (const bucket of BUDGET_BUCKETS) {
          const alloc = ceremonyAllocations.get(bucket);
          const amount = alloc?.allocatedAmount || '0';
          ceremonyTotal += parseFloat(amount);
          cells[bucket] = {
            amount,
            allocationId: alloc?.id || null,
          };
        }

        return {
          ceremonyId: event.id,
          ceremonyName: event.name,
          ceremonyDate: event.date,
          ceremonyType: event.type,
          cells,
          totalPlanned: ceremonyTotal, // Sum of all category allocations for this ceremony
        };
      });

      // Build column summaries (category totals and remaining)
      const columns = BUDGET_BUCKETS.map(bucket => {
        const bucketAllocation = bucketAllocations.find(a => a.bucket === bucket);
        const globalBudget = parseFloat(bucketAllocation?.allocatedAmount || '0');
        
        let totalAllocated = 0;
        for (const alloc of allocations) {
          if (alloc.categoryKey === bucket) {
            totalAllocated += parseFloat(alloc.allocatedAmount || '0');
          }
        }

        return {
          categoryKey: bucket,
          categoryLabel: BUDGET_BUCKET_LABELS[bucket],
          globalBudget,
          totalAllocated,
          remaining: globalBudget - totalAllocated,
          isOverAllocated: totalAllocated > globalBudget && globalBudget > 0,
        };
      });

      // Calculate grand totals
      const totalGlobalBudget = columns.reduce((sum, col) => sum + col.globalBudget, 0);
      const totalAllocated = columns.reduce((sum, col) => sum + col.totalAllocated, 0);

      res.json({
        rows,
        columns,
        summary: {
          totalGlobalBudget,
          totalAllocated,
          totalRemaining: totalGlobalBudget - totalAllocated,
          isOverAllocated: totalAllocated > totalGlobalBudget && totalGlobalBudget > 0,
        }
      });
    } catch (error) {
      console.error("Error fetching budget matrix:", error);
      res.status(500).json({ error: "Failed to fetch budget matrix" });
    }
  });

  // DELETE /api/budget/matrix-allocation/:id - Delete a specific ceremony-category allocation
  router.delete("/matrix-allocation/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const allocation = await storage.getCeremonyCategoryAllocationById(req.params.id);
      if (!allocation) {
        return res.status(404).json({ error: "Allocation not found" });
      }

      const wedding = await storage.getWedding(allocation.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(allocation.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteCeremonyCategoryAllocation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting allocation:", error);
      res.status(500).json({ error: "Failed to delete allocation" });
    }
  });

  return router;
}
