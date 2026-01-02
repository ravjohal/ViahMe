import { Router } from "express";
import type { IStorage } from "../storage";
import { insertGuestSuggestionSchema } from "@shared/schema";

export function createGuestSuggestionsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const status = req.query.status as string | undefined;
      const suggestions = await storage.getGuestSuggestionsByWedding(weddingId, status);
      
      const households = await storage.getHouseholdsByWedding(weddingId);
      const householdNames = new Set(households.map(h => h.name.toLowerCase().trim()));
      const householdEmails = new Set(households.filter(h => h.email).map(h => h.email!.toLowerCase().trim()));
      
      const suggestionsWithDuplicates = suggestions.map(suggestion => {
        const nameMatch = householdNames.has(suggestion.householdName?.toLowerCase().trim() || '');
        const emailMatch = suggestion.contactEmail && householdEmails.has(suggestion.contactEmail.toLowerCase().trim());
        return {
          ...suggestion,
          potentialDuplicate: nameMatch || emailMatch,
          duplicateReason: nameMatch ? 'name' : emailMatch ? 'email' : null,
        };
      });
      
      res.json(suggestionsWithDuplicates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/weddings/:weddingId/count", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const count = await storage.getPendingSuggestionsCount(weddingId);
      res.json({ count });
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
      const validatedData = insertGuestSuggestionSchema.parse({
        ...req.body,
        weddingId,
        suggestedBy: userId,
        status: "pending",
      });
      const suggestion = await storage.createGuestSuggestion(validatedData);
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_created",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName },
      });
      
      res.status(201).json(suggestion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/:id/approve", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const result = await storage.approveSuggestion(req.params.id, userId);
      
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_approved",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/reject", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const { reason } = req.body;
      const result = await storage.rejectSuggestion(req.params.id, userId, reason);
      
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_rejected",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName, reason },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.patch("/:id/status", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const suggestion = await storage.getGuestSuggestion(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      
      const { status } = req.body;
      const validStatuses = ["pending", "under_discussion", "approved", "declined", "frozen", "waitlisted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const result = await storage.updateGuestSuggestion(req.params.id, { status });
      
      await storage.logCollaboratorActivity({
        weddingId: suggestion.weddingId,
        collaboratorId: null,
        userId,
        action: "suggestion_status_changed",
        targetType: "suggestion",
        targetId: suggestion.id,
        details: { householdName: suggestion.householdName, newStatus: status },
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
