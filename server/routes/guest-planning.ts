import { Router } from "express";
import type { IStorage } from "../storage";
import { insertGuestListScenarioSchema, insertGuestBudgetSettingsSchema } from "@shared/schema";

export function createGuestSideRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:weddingId/side-statistics", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this wedding's statistics" });
      }
      
      const stats = await storage.getSideStatistics(weddingId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/guests-by-side/:side", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this wedding's guests" });
      }
      
      const side = req.params.side as 'bride' | 'groom' | 'mutual';
      const guests = await storage.getGuestsBySide(weddingId, side);
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:weddingId/share-guests", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this wedding" });
      }
      
      const { guestIds } = req.body;
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({ error: "guestIds array is required" });
      }
      
      const guests = await storage.shareGuestsWithPartner(weddingId, guestIds);
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "guests_shared",
        targetType: "guest",
        targetId: guestIds.join(','),
        details: { count: guestIds.length },
      });
      
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createGuestConsensusRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/update-consensus-status", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { guestIds, status, weddingId } = req.body;
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({ error: "guestIds array is required" });
      }
      if (!['pending', 'under_discussion', 'approved', 'declined', 'frozen'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      if (weddingId) {
        const wedding = await storage.getWedding(weddingId);
        if (!wedding || wedding.userId !== userId) {
          return res.status(403).json({ error: "Not authorized to modify these guests" });
        }
      }
      
      const guests = await storage.updateGuestConsensusStatus(guestIds, status);
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createScenariosRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const scenarios = await storage.getGuestListScenariosByWedding(weddingId);
      res.json(scenarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.getGuestListScenarioWithStats(req.params.id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestListScenarioSchema.parse({
        ...req.body,
        weddingId,
        createdBy: userId,
      });
      const scenario = await storage.createGuestListScenario(validatedData);
      
      if (req.body.copyCurrentHouseholds) {
        await storage.copyAllHouseholdsToScenario(scenario.id, weddingId);
      }
      
      const withStats = await storage.getGuestListScenarioWithStats(scenario.id);
      res.status(201).json(withStats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.updateGuestListScenario(req.params.id, req.body);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      const withStats = await storage.getGuestListScenarioWithStats(scenario.id);
      res.json(withStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const deleted = await storage.deleteGuestListScenario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/duplicate", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const newScenario = await storage.duplicateScenario(req.params.id, name, userId);
      const withStats = await storage.getGuestListScenarioWithStats(newScenario.id);
      res.status(201).json(withStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/set-active", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const scenario = await storage.getGuestListScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      const result = await storage.setActiveScenario(scenario.weddingId, req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/promote", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const success = await storage.promoteScenarioToMain(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:scenarioId/households", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const households = await storage.getScenarioHouseholds(req.params.scenarioId);
      res.json(households);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:scenarioId/households", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { householdId, adjustedMaxCount } = req.body;
      if (!householdId) {
        return res.status(400).json({ error: "Household ID is required" });
      }
      const result = await storage.addHouseholdToScenario(req.params.scenarioId, householdId, adjustedMaxCount);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:scenarioId/households/:householdId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { scenarioId, householdId } = req.params;
      const removed = await storage.removeHouseholdFromScenario(scenarioId, householdId);
      if (!removed) {
        return res.status(404).json({ error: "Household not found in scenario" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createGuestBudgetRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:weddingId/guest-budget", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const settings = await storage.getGuestBudgetSettings(weddingId);
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json({ settings, capacity });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:weddingId/guest-budget", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestBudgetSettingsSchema.parse({
        ...req.body,
        weddingId,
      });
      const settings = await storage.createOrUpdateGuestBudgetSettings(validatedData);
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json({ settings, capacity });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/:weddingId/guest-budget/capacity", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const capacity = await storage.calculateBudgetCapacity(weddingId);
      res.json(capacity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/guest-planning-snapshot", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const snapshot = await storage.getGuestPlanningSnapshot(weddingId);
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createHouseholdPriorityRouter(storage: IStorage): Router {
  const router = Router();

  router.patch("/:id/priority", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { priorityTier, sourceId } = req.body;
      const household = await storage.updateHousehold(req.params.id, {
        priorityTier,
        sourceId,
      });
      
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
