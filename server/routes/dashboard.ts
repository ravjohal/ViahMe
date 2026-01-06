import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertBudgetAlertSchema, insertDashboardWidgetSchema } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";
import { z } from "zod";

const DEFAULT_WIDGET_TYPES = [
  "budget_overview",
  "alerts",
  "spending_by_category",
  "spending_trend",
  "recent_expenses",
  "upcoming_payments",
] as const;

export async function registerDashboardRoutes(router: Router, storage: IStorage) {
  router.get("/widgets/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      let widgets = await storage.getDashboardWidgetsByWedding(req.params.weddingId);
      
      if (widgets.length === 0) {
        const defaultWidgets = DEFAULT_WIDGET_TYPES.map((type, index) => ({
          weddingId: req.params.weddingId,
          widgetType: type,
          position: index,
          isVisible: true,
          config: {},
        }));
        
        for (const widget of defaultWidgets) {
          await storage.createDashboardWidget(widget);
        }
        widgets = await storage.getDashboardWidgetsByWedding(req.params.weddingId);
      }
      
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching dashboard widgets:", error);
      res.status(500).json({ error: "Failed to fetch dashboard widgets" });
    }
  });

  router.patch("/widgets/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const widget = await storage.getDashboardWidget(req.params.id);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      const wedding = await storage.getWedding(widget.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(widget.weddingId);
        const hasAccess = roles.some(role => 
          role.userId === authReq.session.userId && 
          (role.permissions as any)?.budget === true
        );
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied - budget permission required" });
        }
      }

      const allowedFields = ["isVisible", "position", "config"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const updated = await storage.updateDashboardWidget(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating widget:", error);
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  router.post("/widgets/reorder", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, widgetIds } = req.body;
      
      if (!weddingId || !Array.isArray(widgetIds)) {
        return res.status(400).json({ error: "weddingId and widgetIds array required" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => 
          role.userId === authReq.session.userId && 
          (role.permissions as any)?.budget === true
        );
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied - budget permission required" });
        }
      }

      const existingWidgets = await storage.getDashboardWidgetsByWedding(weddingId);
      const validWidgetIds = existingWidgets.map(w => w.id);
      const allWidgetsBelongToWedding = widgetIds.every(id => validWidgetIds.includes(id));
      
      if (!allWidgetsBelongToWedding) {
        return res.status(400).json({ error: "Invalid widget IDs - some widgets don't belong to this wedding" });
      }

      const positions = widgetIds.map((_, index) => index);
      const updated = await storage.updateDashboardWidgetPositions(widgetIds, positions);
      res.json(updated);
    } catch (error) {
      console.error("Error reordering widgets:", error);
      res.status(500).json({ error: "Failed to reorder widgets" });
    }
  });

  router.get("/alerts/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const alerts = await storage.getBudgetAlertsByWedding(req.params.weddingId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch budget alerts" });
    }
  });

  router.post("/alerts", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertBudgetAlertSchema.parse(req.body);
      
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

      const alert = await storage.createBudgetAlert(validatedData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create budget alert" });
    }
  });

  router.patch("/alerts/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingAlert = await storage.getBudgetAlert(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const wedding = await storage.getWedding(existingAlert.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingAlert.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const updated = await storage.updateBudgetAlert(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update budget alert" });
    }
  });

  router.delete("/alerts/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingAlert = await storage.getBudgetAlert(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const wedding = await storage.getWedding(existingAlert.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingAlert.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteBudgetAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ error: "Failed to delete budget alert" });
    }
  });

  router.get("/alerts/:weddingId/triggered", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const alerts = await storage.getTriggeredAlerts(req.params.weddingId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching triggered alerts:", error);
      res.status(500).json({ error: "Failed to fetch triggered alerts" });
    }
  });

  router.post("/alerts/:weddingId/check", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const expenses = await storage.getExpensesByWedding(weddingId);
      const allocations = await storage.getBudgetAllocationsByWedding(weddingId);
      const alerts = await storage.getBudgetAlertsByWedding(weddingId);

      const totalBudget = parseFloat(wedding.totalBudget?.toString() || "0");
      const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      const triggeredAlerts: any[] = [];

      for (const alert of alerts) {
        if (!alert.isEnabled) continue;

        let shouldTrigger = false;
        const threshold = alert.thresholdPercent || 0;

        if (alert.alertType === "total_threshold") {
          shouldTrigger = totalPercent >= threshold;
        } else if (alert.alertType === "category_threshold" && alert.categoryId) {
          const allocation = allocations.find(a => a.bucket === alert.categoryId);
          if (allocation) {
            const bucketExpenses = expenses.filter(e => e.parentCategory === allocation.bucket);
            const bucketSpent = bucketExpenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
            const bucketBudget = parseFloat(allocation.allocatedAmount?.toString() || "0");
            const bucketPercent = bucketBudget > 0 ? (bucketSpent / bucketBudget) * 100 : 0;
            shouldTrigger = bucketPercent >= threshold;
          }
        } else if (alert.alertType === "overspend") {
          if (alert.categoryId) {
            const allocation = allocations.find(a => a.bucket === alert.categoryId);
            if (allocation) {
              const bucketExpenses = expenses.filter(e => e.parentCategory === allocation.bucket);
              const bucketSpent = bucketExpenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
              const bucketBudget = parseFloat(allocation.allocatedAmount?.toString() || "0");
              shouldTrigger = bucketSpent > bucketBudget;
            }
          } else {
            shouldTrigger = totalSpent > totalBudget;
          }
        }

        if (shouldTrigger && !alert.isTriggered) {
          await storage.updateBudgetAlert(alert.id, {
            isTriggered: true,
          });
          triggeredAlerts.push(alert);
        } else if (!shouldTrigger && alert.isTriggered) {
          await storage.updateBudgetAlert(alert.id, {
            isTriggered: false,
          });
        }
      }

      res.json({
        checked: alerts.length,
        triggered: triggeredAlerts.length,
        totalPercent,
        alerts: triggeredAlerts,
      });
    } catch (error) {
      console.error("Error checking alerts:", error);
      res.status(500).json({ error: "Failed to check budget alerts" });
    }
  });
}
