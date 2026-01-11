import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertExpenseSchema, insertBudgetAllocationSchema, BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, insertBudgetCategorySchema } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";

export async function registerBudgetRoutes(router: Router, storage: IStorage) {
  // Legacy endpoint - returns static buckets (kept for backwards compatibility)
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

  // New: Get all budget categories with rich metadata (from database)
  // By default returns only active categories; use ?includeInactive=true for admin UI
  router.get("/categories", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const categories = includeInactive 
        ? await storage.getAllBudgetCategories()
        : await storage.getActiveBudgetCategories();
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch budget categories:", error);
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  // New: Get a specific budget category
  router.get("/categories/:id", async (req, res) => {
    try {
      const category = await storage.getBudgetCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch budget category:", error);
      res.status(500).json({ error: "Failed to fetch budget category" });
    }
  });

  // Admin: Seed budget categories from defaults
  router.post("/categories/seed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const categories = await storage.seedBudgetCategories();
      res.json({ message: "Budget categories seeded successfully", count: categories.length, categories });
    } catch (error) {
      console.error("Failed to seed budget categories:", error);
      res.status(500).json({ error: "Failed to seed budget categories" });
    }
  });

  // Admin: Create a new budget category
  router.post("/categories", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create budget category:", error);
      res.status(500).json({ error: "Failed to create budget category" });
    }
  });

  // Admin: Update a budget category
  router.patch("/categories/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const category = await storage.updateBudgetCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update budget category:", error);
      res.status(500).json({ error: "Failed to update budget category" });
    }
  });

  // Admin: Delete a budget category (system categories cannot be deleted)
  router.delete("/categories/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deleted = await storage.deleteBudgetCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Budget category not found or cannot be deleted" });
      }
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot delete system categories")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Failed to delete budget category:", error);
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  router.get("/allocations/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const allocations = await storage.getBudgetAllocationsByWedding(req.params.weddingId);
      
      // Filter to only bucket-level allocations (no ceremonyId, no lineItemLabel)
      const bucketLevelAllocations = allocations.filter(a => !a.ceremonyId && !a.lineItemLabel);
      
      const bucketsWithAllocations = BUDGET_BUCKETS.map(bucket => {
        const allocation = bucketLevelAllocations.find(a => a.bucket === bucket);
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

  // Recalculate auto values from ceremony budget categories for a wedding
  // This aggregates line item costs by budgetBucketId and updates autoLow/autoHigh/autoItemCount
  router.post("/allocations/:weddingId/recalculate", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      await storage.recalculateBucketAllocationsFromCeremonies(weddingId);
      res.json({ success: true, message: "Budget allocations recalculated from ceremony items" });
    } catch (error) {
      console.error("Failed to recalculate budget allocations:", error);
      res.status(500).json({ error: "Failed to recalculate budget allocations" });
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
        validatedData.allocatedAmount,
        validatedData.ceremonyId ?? null,
        validatedData.lineItemLabel ?? null,
        validatedData.notes ?? null
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

      // When user manually changes allocatedAmount, mark as manual override
      const updateData = { ...req.body };
      if (req.body.allocatedAmount !== undefined) {
        updateData.isManualOverride = true;
      }
      
      const allocation = await storage.updateBudgetAllocation(req.params.id, updateData);
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

  router.get("/analytics/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      const [wedding, allocations, expenses, events, bookings] = await Promise.all([
        storage.getWedding(weddingId),
        storage.getBudgetAllocationsByWedding(weddingId),
        storage.getExpensesByWedding(weddingId),
        storage.getEventsByWedding(weddingId),
        storage.getBookingsByWedding(weddingId),
      ]);

      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const totalBudget = parseFloat(wedding.totalBudget || '0');
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

      res.json({
        wedding: {
          city: wedding.city,
          tradition: wedding.tradition,
          totalBudget: wedding.totalBudget,
        },
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
        benchmarks: [],
      });
    } catch (error) {
      console.error("Error fetching budget analytics:", error);
      res.status(500).json({ error: "Failed to fetch budget analytics" });
    }
  });

  // ============================================================================
  // CEREMONY BUDGET ALLOCATIONS - Unified budget planning using budget_allocations table
  // Now uses: ceremonyId field for ceremony-level allocations
  // ============================================================================

  router.get("/ceremony-budgets/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const allocations = await storage.getBudgetAllocationsByWedding(req.params.weddingId);
      const events = await storage.getEventsByWedding(req.params.weddingId);
      const expenses = await storage.getExpensesByWedding(req.params.weddingId);

      // Group allocations by ceremony
      const ceremonyAllocations = new Map<string, typeof allocations>();
      for (const alloc of allocations) {
        if (alloc.ceremonyId) {
          if (!ceremonyAllocations.has(alloc.ceremonyId)) {
            ceremonyAllocations.set(alloc.ceremonyId, []);
          }
          ceremonyAllocations.get(alloc.ceremonyId)!.push(alloc);
        }
      }

      const ceremonyBreakdown = events.map(event => {
        const eventAllocations = ceremonyAllocations.get(event.id) || [];
        const ceremonyExpenses = expenses.filter(e => e.ceremonyId === event.id);
        const spent = ceremonyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        const allocated = eventAllocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);

        return {
          ceremonyId: event.id,
          eventName: event.name,
          eventDate: event.date,
          allocatedAmount: allocated.toString(),
          spent,
          remaining: allocated - spent,
          percentUsed: allocated ? Math.round((spent / allocated) * 100) : 0,
          allocations: eventAllocations,
        };
      });

      res.json(ceremonyBreakdown);
    } catch (error) {
      console.error("Error fetching ceremony budgets:", error);
      res.status(500).json({ error: "Failed to fetch ceremony budgets" });
    }
  });

  // POST /api/budget/ceremony-budgets - Set ceremony-level total budget
  router.post("/ceremony-budgets", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, ceremonyId, allocatedAmount } = req.body;

      if (!weddingId || !ceremonyId || allocatedAmount === undefined) {
        return res.status(400).json({ error: "Missing required fields: weddingId, ceremonyId, allocatedAmount" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Use 'other' as the bucket for ceremony-level totals (no specific category)
      const allocation = await storage.upsertBudgetAllocation(
        weddingId,
        "other" as BudgetBucket,
        allocatedAmount.toString(),
        ceremonyId,
        null,
        null
      );

      res.json({ allocation });
    } catch (error) {
      console.error("Error saving ceremony budget:", error);
      res.status(500).json({ error: "Failed to save ceremony budget" });
    }
  });

  router.get("/ceremony-analytics/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      const allocations = await storage.getBudgetAllocationsByWedding(weddingId);
      const events = await storage.getEventsByWedding(weddingId);
      const expenses = await storage.getExpensesByWedding(weddingId);
      const wedding = await storage.getWedding(weddingId);

      const totalBudget = parseFloat(wedding?.totalBudget || '0');
      
      // Calculate ceremony-level allocations
      // IMPORTANT: Use line items if they exist, otherwise use the ceremony-level total
      // This prevents double-counting when both exist
      const ceremonyAllocationsMap = new Map<string, number>();
      const ceremonyLineItemsMap = new Map<string, number>(); // Sum of line items only
      const ceremonyCeremonyTotalsMap = new Map<string, number>(); // Ceremony-level total only (lineItemLabel = null)
      
      for (const alloc of allocations) {
        if (alloc.ceremonyId) {
          const amount = parseFloat(alloc.allocatedAmount || '0');
          if (alloc.lineItemLabel) {
            // This is a line item allocation
            const current = ceremonyLineItemsMap.get(alloc.ceremonyId) || 0;
            ceremonyLineItemsMap.set(alloc.ceremonyId, current + amount);
          } else {
            // This is a ceremony-level total (no line item label)
            ceremonyCeremonyTotalsMap.set(alloc.ceremonyId, amount);
          }
        }
      }
      
      // For each ceremony, use line items sum if available, else use ceremony total
      for (const event of events) {
        const lineItemsTotal = ceremonyLineItemsMap.get(event.id) || 0;
        const ceremonyTotal = ceremonyCeremonyTotalsMap.get(event.id) || 0;
        // Prefer line items if they exist (non-zero), otherwise use ceremony-level total
        ceremonyAllocationsMap.set(event.id, lineItemsTotal > 0 ? lineItemsTotal : ceremonyTotal);
      }

      const totalCeremonyAllocated = Array.from(ceremonyAllocationsMap.values()).reduce((sum, v) => sum + v, 0);
      const unallocatedBudget = totalBudget - totalCeremonyAllocated;

      const ceremonyBreakdown = events.map(event => {
        const allocated = ceremonyAllocationsMap.get(event.id) || 0;
        const ceremonyExpenses = expenses.filter(e => e.ceremonyId === event.id);
        const spent = ceremonyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

        return {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          eventType: event.type,
          ceremonyTypeId: event.ceremonyTypeId, // UUID FK to ceremony_types
          side: event.side || 'mutual',
          guestCount: event.guestCount || 0,
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

      const sideAnalytics = {
        bride: { allocated: 0, spent: 0, eventCount: 0 },
        groom: { allocated: 0, spent: 0, eventCount: 0 },
        mutual: { allocated: 0, spent: 0, eventCount: 0 },
      };

      ceremonyBreakdown.forEach(ceremony => {
        const side = ceremony.side as 'bride' | 'groom' | 'mutual';
        sideAnalytics[side].allocated += ceremony.allocated;
        sideAnalytics[side].spent += ceremony.spent;
        sideAnalytics[side].eventCount += 1;
      });

      res.json({
        overview: {
          totalBudget,
          totalCeremonyAllocated,
          unallocatedBudget,
          percentAllocated: totalBudget ? Math.round((totalCeremonyAllocated / totalBudget) * 100) : 0,
          isOverAllocated: totalCeremonyAllocated > totalBudget,
        },
        ceremonyBreakdown,
        sideAnalytics,
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

  // POST /api/budget/allocate - Allocate budget to ceremony+bucket (unified model)
  router.post("/allocate", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, ceremonyId, bucket, amount, lineItemLabel, notes } = req.body;

      if (!weddingId || !bucket || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields: weddingId, bucket, amount" });
      }

      if (!BUDGET_BUCKETS.includes(bucket)) {
        return res.status(400).json({ error: `Invalid bucket. Must be one of: ${BUDGET_BUCKETS.join(', ')}` });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const allocation = await storage.upsertBudgetAllocation(
        weddingId,
        bucket as BudgetBucket,
        amount.toString(),
        ceremonyId || null,
        lineItemLabel || null,
        notes || null
      );

      res.json({ allocation });
    } catch (error) {
      console.error("Error allocating budget:", error);
      res.status(500).json({ error: "Failed to allocate budget" });
    }
  });

  // POST /api/budget/allocate-bulk - Bulk allocate budgets
  router.post("/allocate-bulk", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, ceremonyId, allocations } = req.body;

      if (!weddingId || !allocations || !Array.isArray(allocations)) {
        return res.status(400).json({ error: "Missing required fields: weddingId, allocations (array)" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const results: Array<{ bucket: string; amount: string; success: boolean; error?: string }> = [];

      for (const alloc of allocations) {
        const { bucket, amount, lineItemLabel } = alloc;

        if (!BUDGET_BUCKETS.includes(bucket)) {
          results.push({ bucket, amount, success: false, error: "Invalid bucket" });
          continue;
        }

        try {
          await storage.upsertBudgetAllocation(
            weddingId,
            bucket as BudgetBucket,
            amount.toString(),
            ceremonyId || null,
            lineItemLabel || null
          );
          results.push({ bucket, amount, success: true });
        } catch (err) {
          results.push({ bucket, amount, success: false, error: "Failed to save" });
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error("Error bulk allocating budget:", error);
      res.status(500).json({ error: "Failed to bulk allocate budget" });
    }
  });

  // POST /api/budget/line-items/bulk - Bulk save line item budgets for a ceremony
  router.post("/line-items/bulk", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, eventId, ceremonyTypeId, items } = req.body;

      if (!weddingId || !eventId || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Missing required fields: weddingId, eventId, items (array)" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const results: Array<{ lineItemCategory: string; amount: string; success: boolean; error?: string }> = [];

      for (const item of items) {
        const { lineItemCategory, budgetedAmount, bucket } = item;

        if (!lineItemCategory) {
          results.push({ lineItemCategory: lineItemCategory || "unknown", amount: budgetedAmount, success: false, error: "Missing category" });
          continue;
        }

        // Validate bucket if provided, default to 'other'
        const validBucket = bucket && BUDGET_BUCKETS.includes(bucket) ? bucket : "other";

        try {
          // Store line item budgets in the unified budget_allocations table
          // The lineItemLabel field stores the specific line item category name
          await storage.upsertBudgetAllocation(
            weddingId,
            validBucket as BudgetBucket,
            budgetedAmount?.toString() || "0",
            eventId,
            lineItemCategory // This becomes the lineItemLabel
          );
          results.push({ lineItemCategory, amount: budgetedAmount, success: true });
        } catch (err) {
          results.push({ lineItemCategory, amount: budgetedAmount, success: false, error: "Failed to save" });
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error("Error bulk saving line item budgets:", error);
      res.status(500).json({ error: "Failed to save line item budgets" });
    }
  });

  // GET /api/budget/line-items/:weddingId - Get all line item budgets for a wedding
  router.get("/line-items/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { weddingId } = req.params;

      const allocations = await storage.getBudgetAllocationsByWedding(weddingId);
      
      // Filter to only line item level allocations (has ceremonyId AND lineItemLabel)
      const lineItemAllocations = allocations
        .filter(a => a.ceremonyId && a.lineItemLabel)
        .map(a => ({
          id: a.id,
          eventId: a.ceremonyId,
          lineItemCategory: a.lineItemLabel,
          budgetedAmount: a.allocatedAmount,
        }));

      res.json(lineItemAllocations);
    } catch (error) {
      console.error("Error fetching line item budgets:", error);
      res.status(500).json({ error: "Failed to fetch line item budgets" });
    }
  });

  // GET /api/budget/matrix/:weddingId - Get budget matrix (ceremonies x buckets)
  router.get("/matrix/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { weddingId } = req.params;

      const events = await storage.getEventsByWedding(weddingId);
      const allocations = await storage.getBudgetAllocationsByWedding(weddingId);
      const expenses = await storage.getExpensesByWedding(weddingId);
      
      // Build expense totals by ceremony-bucket combination
      const expenseMap = new Map<string, number>();
      const ceremonySpentMap = new Map<string, number>();
      for (const expense of expenses) {
        if (expense.ceremonyId && expense.parentCategory) {
          const key = `${expense.ceremonyId}:${expense.parentCategory}`;
          const amount = parseFloat(expense.amount || '0');
          expenseMap.set(key, (expenseMap.get(key) || 0) + amount);
          ceremonySpentMap.set(expense.ceremonyId, (ceremonySpentMap.get(expense.ceremonyId) || 0) + amount);
        }
      }

      // Build allocation lookup: ceremonyId -> bucket -> allocation
      const allocationMap = new Map<string, Map<string, typeof allocations[0]>>();
      const bucketTotals = new Map<string, { allocated: number; global: number }>();
      
      // Initialize bucket totals
      for (const bucket of BUDGET_BUCKETS) {
        bucketTotals.set(bucket, { allocated: 0, global: 0 });
      }

      for (const alloc of allocations) {
        if (alloc.ceremonyId && !alloc.lineItemLabel) {
          // Ceremony-level allocation
          if (!allocationMap.has(alloc.ceremonyId)) {
            allocationMap.set(alloc.ceremonyId, new Map());
          }
          allocationMap.get(alloc.ceremonyId)!.set(alloc.bucket, alloc);
          const current = bucketTotals.get(alloc.bucket)!;
          current.allocated += parseFloat(alloc.allocatedAmount || '0');
        } else if (!alloc.ceremonyId && !alloc.lineItemLabel) {
          // Bucket-level (global) allocation
          const current = bucketTotals.get(alloc.bucket)!;
          current.global = parseFloat(alloc.allocatedAmount || '0');
        }
      }

      // Build rows
      const rows = events.map(event => {
        const ceremonyAllocations = allocationMap.get(event.id) || new Map();
        const cells: Record<string, { amount: string; spent: number; allocationId: string | null }> = {};
        
        let ceremonyTotal = 0;
        for (const bucket of BUDGET_BUCKETS) {
          const alloc = ceremonyAllocations.get(bucket);
          const amount = alloc?.allocatedAmount || '0';
          const spentKey = `${event.id}:${bucket}`;
          const spent = expenseMap.get(spentKey) || 0;
          ceremonyTotal += parseFloat(amount);
          cells[bucket] = {
            amount,
            spent,
            allocationId: alloc?.id || null,
          };
        }

        const ceremonySpent = ceremonySpentMap.get(event.id) || 0;

        return {
          ceremonyId: event.id,
          ceremonyName: event.name,
          ceremonyDate: event.date,
          ceremonyType: event.type,
          cells,
          ceremonySpent,
          totalPlanned: ceremonyTotal,
        };
      });

      // Build column summaries
      const columns = BUDGET_BUCKETS.map(bucket => {
        const totals = bucketTotals.get(bucket)!;
        return {
          categoryKey: bucket,
          categoryLabel: BUDGET_BUCKET_LABELS[bucket],
          globalBudget: totals.global,
          totalAllocated: totals.allocated,
          remaining: totals.global - totals.allocated,
          isOverAllocated: totals.allocated > totals.global && totals.global > 0,
        };
      });

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

  return router;
}
