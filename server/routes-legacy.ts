import type { Express } from "express";
import { z } from "zod";
import { parseConversationId, generateConversationId, type IStorage } from "./storage";
import { calculateDueDate } from "./task-templates";
import { requireAuth, requireRole, type AuthRequest } from "./auth-middleware";
import {
  insertWeddingSchema,
  insertEventSchema,
  insertEventCostItemSchema,
  insertTaskSchema,
  insertContractSchema,
  insertMessageSchema,
  insertQuickReplyTemplateSchema,
  insertFollowUpReminderSchema,
  insertPlaylistSchema,
  insertPlaylistSongSchema,
  insertSongVoteSchema,
  insertDocumentSchema,
  insertWeddingWebsiteSchema,
  insertPhotoGallerySchema,
  insertPhotoSchema,
  insertVendorAvailabilitySchema,
  insertContractSignatureSchema,
  insertMeasurementProfileSchema,
  insertShoppingOrderItemSchema,
  insertGapWindowSchema,
  insertGapRecommendationSchema,
  insertRitualStageSchema,
  insertRitualStageUpdateSchema,
  insertGuestNotificationSchema,
  insertLiveWeddingStatusSchema,
  insertWeddingRoleSchema,
  insertGuestSourceSchema,
  insertGuestSuggestionSchema,
  insertGuestListScenarioSchema,
  insertGuestBudgetSettingsSchema,
  insertCutListItemSchema,
  insertVendorTeammateInvitationSchema,
  VENDOR_TEAMMATE_PERMISSIONS,
  insertVendorLeadSchema,
  insertLeadNurtureSequenceSchema,
  insertLeadNurtureStepSchema,
  insertLeadActivityLogSchema,
  coupleSubmitVendorSchema,
  type InsertVendor,
  type VendorLead,
} from "@shared/schema";
import {
  sendBookingConfirmationEmail,
  sendVendorNotificationEmail,
  sendRsvpConfirmationEmail,
  sendInvitationEmail,
} from "./email";

interface ViewerSession {
  viewerId: string;
  weddingId: string;
  lastHeartbeat: number;
}

interface ViewerUtils {
  activeViewers: Map<string, ViewerSession>;
  getViewerCount: (weddingId: string) => number;
  cleanupStaleViewers: () => void;
}

export async function registerLegacyRoutes(app: Express, storage: IStorage, viewerUtils: ViewerUtils): Promise<void> {
  const { activeViewers, getViewerCount, cleanupStaleViewers } = viewerUtils;

  // NOTE: The following routes have been migrated to modular routers in server/routes/:
  // - Lead inbox, quick reply templates, follow-up reminders (vendor-tools.ts)
  // - Reviews (reviews.ts)
  // - Playlists, songs, votes (playlists.ts)
  // - Documents, object storage (documents.ts)
  // - Budget benchmarks, analytics (budget.ts)
  // - Wedding websites, registries, public wedding (wedding-websites.ts)
  // - Galleries, photos (galleries.ts)
  // - Vendor availability (vendor-availability.ts)
  // - Vendor calendar accounts, vendor calendars (vendor-calendars.ts)
  // - Analytics - vendor and wedding (analytics.ts)
  // - Invitation cards, orders, payments, deposit payments (orders-payments.ts)
  // - Measurement profiles, shopping items (shopping.ts)
  // - Gap windows, gap recommendations (gap-concierge.ts)
  // - Ritual stages, stage updates, guest notifications, live status (live-wedding.ts)
  // - Roles, collaborators, permissions, my-collaborations (collaborators.ts)
  
  // ============================================================================
  // GUEST SOURCES - Track who submitted each guest
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-sources", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weddings/:weddingId/guest-sources/stats", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const stats = await storage.getGuestSourceStats(weddingId);
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      
      const enrichedStats = stats.map(stat => {
        const source = sources.find(s => s.id === stat.sourceId);
        return {
          ...stat,
          source,
        };
      });
      
      res.json(enrichedStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/guest-sources", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestSourceSchema.parse({
        ...req.body,
        weddingId,
      });
      const source = await storage.createGuestSource(validatedData);
      res.status(201).json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/guest-sources/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const source = await storage.updateGuestSource(req.params.id, req.body);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guest-sources/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const deleted = await storage.deleteGuestSource(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GUEST SUGGESTIONS - Collaborators suggest guests for approval
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-suggestions", async (req, res) => {
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

  app.get("/api/weddings/:weddingId/guest-suggestions/count", async (req, res) => {
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

  app.post("/api/weddings/:weddingId/guest-suggestions", async (req, res) => {
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
      
      // Log activity
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

  app.post("/api/guest-suggestions/:id/approve", async (req, res) => {
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
      
      // Log activity
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

  app.post("/api/guest-suggestions/:id/reject", async (req, res) => {
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
      
      // Log activity
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

  app.patch("/api/guest-suggestions/:id/status", async (req, res) => {
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
      
      // Log activity
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


  // ============================================================================
  // GUEST SIDE MANAGEMENT - Bride/Groom side features with privacy
  // ============================================================================

  app.get("/api/weddings/:weddingId/side-statistics", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
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

  app.get("/api/weddings/:weddingId/guests-by-side/:side", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
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

  app.post("/api/weddings/:weddingId/share-guests", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      
      // Verify wedding ownership
      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this wedding" });
      }
      
      const { guestIds } = req.body;
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({ error: "guestIds array is required" });
      }
      
      const guests = await storage.shareGuestsWithPartner(weddingId, guestIds);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: req.params.weddingId,
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

  app.post("/api/guests/update-consensus-status", async (req, res) => {
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
      
      // Verify wedding ownership if weddingId is provided
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

  // ============================================================================
  // GUEST LIST SCENARIOS - What-if planning playground
  // ============================================================================

  app.get("/api/weddings/:weddingId/scenarios", async (req, res) => {
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

  app.get("/api/scenarios/:id", async (req, res) => {
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

  app.post("/api/weddings/:weddingId/scenarios", async (req, res) => {
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
      
      // Optionally copy all current households to new scenario
      if (req.body.copyCurrentHouseholds) {
        await storage.copyAllHouseholdsToScenario(scenario.id, weddingId);
      }
      
      const withStats = await storage.getGuestListScenarioWithStats(scenario.id);
      res.status(201).json(withStats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/scenarios/:id", async (req, res) => {
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

  app.delete("/api/scenarios/:id", async (req, res) => {
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

  app.post("/api/scenarios/:id/duplicate", async (req, res) => {
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

  app.post("/api/scenarios/:id/set-active", async (req, res) => {
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

  app.post("/api/scenarios/:id/promote", async (req, res) => {
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

  // Scenario Households
  app.get("/api/scenarios/:scenarioId/households", async (req, res) => {
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

  app.post("/api/scenarios/:scenarioId/households", async (req, res) => {
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

  app.delete("/api/scenarios/:scenarioId/households/:householdId", async (req, res) => {
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

  // ============================================================================
  // GUEST BUDGET SETTINGS - Cost per head and capacity planning
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-budget", async (req, res) => {
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

  app.post("/api/weddings/:weddingId/guest-budget", async (req, res) => {
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

  app.get("/api/weddings/:weddingId/guest-budget/capacity", async (req, res) => {
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

  // ============================================================================
  // GUEST PLANNING SNAPSHOT - Comprehensive view for planning workflow
  // ============================================================================

  app.get("/api/weddings/:weddingId/guest-planning-snapshot", async (req, res) => {
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

  // ============================================================================
  // CUT LIST - Track removed guests with reasons and restore capability
  // ============================================================================

  app.get("/api/weddings/:weddingId/cut-list", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const cutList = await storage.getCutListByWedding(weddingId);
      res.json(cutList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/cut-list", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertCutListItemSchema.parse({
        ...req.body,
        weddingId,
        cutBy: userId,
      });
      const cutItem = await storage.addToCutList(validatedData);
      
      // Log activity
      const household = await storage.getHousehold(validatedData.householdId);
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "guest_cut",
        targetType: "household",
        targetId: validatedData.householdId,
        details: { householdName: household?.name, reason: validatedData.cutReason },
      });
      
      res.status(201).json(cutItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cut-list/:id/restore", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const cutItem = await storage.getCutListItem(req.params.id);
      if (!cutItem) {
        return res.status(404).json({ error: "Cut list item not found" });
      }
      
      const household = await storage.restoreFromCutList(req.params.id, userId);
      
      // Log activity
      await storage.logCollaboratorActivity({
        weddingId: cutItem.weddingId,
        collaboratorId: null,
        userId,
        action: "guest_restored",
        targetType: "household",
        targetId: household.id,
        details: { householdName: household.name },
      });
      
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cut-list/:id/permanent", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const cutItem = await storage.getCutListItem(req.params.id);
      if (!cutItem) {
        return res.status(404).json({ error: "Cut list item not found" });
      }
      
      const household = await storage.getHousehold(cutItem.householdId);
      const deleted = await storage.permanentlyDeleteFromCutList(req.params.id);
      
      if (deleted) {
        await storage.logCollaboratorActivity({
          weddingId: cutItem.weddingId,
          collaboratorId: null,
          userId,
          action: "guest_deleted",
          targetType: "household",
          targetId: cutItem.householdId,
          details: { householdName: household?.name },
        });
      }
      
      res.json({ success: deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weddings/:weddingId/cut-list/bulk-by-priority", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const { priorityTier, reason } = req.body;
      
      if (!priorityTier) {
        return res.status(400).json({ error: "Priority tier is required" });
      }
      
      const count = await storage.bulkCutByPriority(weddingId, priorityTier, userId, reason);
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "bulk_cut",
        targetType: "wedding",
        targetId: weddingId,
        details: { priorityTier, count, reason },
      });
      
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // HOUSEHOLD PRIORITY & SOURCE UPDATES
  // ============================================================================

  app.patch("/api/households/:id/priority", async (req, res) => {
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

  // ============================================================================
  // REAL-TIME MASTER TIMELINE - Day-of coordination
  // ============================================================================

  // Get timeline with vendor tags and acknowledgment status for a wedding
  app.get("/api/weddings/:weddingId/timeline", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        // Check if user is a collaborator
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const timeline = await storage.getTimelineWithAcknowledgments(weddingId);
      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reorder events in the timeline (drag-and-drop)
  app.patch("/api/weddings/:weddingId/timeline/reorder", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const { orderedEventIds } = req.body;

      // Validate input
      const reorderSchema = z.object({
        orderedEventIds: z.array(z.string().uuid()).min(1),
      });

      const validationResult = reorderSchema.safeParse({ orderedEventIds });
      if (!validationResult.success) {
        return res.status(400).json({ error: "orderedEventIds must be an array of valid UUIDs" });
      }

      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const events = await storage.reorderEvents(weddingId, orderedEventIds, userId);
      
      // Broadcast the reorder to all connected clients
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: 'timeline_reordered',
          events: events.map(e => ({ id: e.id, order: e.order })),
        });
      }

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update event time and trigger vendor notifications
  app.patch("/api/events/:eventId/time", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { newTime, note } = req.body;

      // Validate input
      const timeChangeSchema = z.object({
        newTime: z.string().min(1, "newTime is required"),
        note: z.string().optional(),
      });

      const validationResult = timeChangeSchema.safeParse({ newTime, note });
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      // Get event and verify access
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const result = await storage.updateEventTime(eventId, newTime, userId, note);

      // Broadcast the time change to all connected clients
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(event.weddingId, {
          type: 'timeline_updated',
          eventId,
          eventName: result.event.name,
          oldTime: result.change.oldValue,
          newTime: result.change.newValue,
          changeId: result.change.id,
          note: result.change.note,
        });
      }

      // Send email notifications to tagged vendors
      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || wedding.partner2Name || 'The Couple';
      const weddingTitle = wedding.title || 'Your Wedding';

      // Send notifications in background (don't block response)
      const notificationPromises: Promise<void>[] = [];

      // Send email notifications
      result.taggedVendors
        .filter(v => v.email)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeEmail } = await import('./email');
              const baseUrl = process.env.REPL_SLUG 
                ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co`
                : 'http://localhost:5000';
              
              await sendTimelineChangeEmail({
                to: vendor.email!,
                vendorName: vendor.name,
                eventName: result.event.name,
                eventDate: result.event.date || undefined,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
                acknowledgeUrl: `${baseUrl}/vendor-dashboard?ack=${result.change.id}`,
              });
              console.log(`Sent timeline change email to ${vendor.email}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${vendor.email}:`, emailError);
            }
          })());
        });

      // Send SMS notifications (if vendor has phone number)
      result.taggedVendors
        .filter(v => v.phone)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeSMS } = await import('./twilio');
              await sendTimelineChangeSMS({
                vendorPhone: vendor.phone!,
                vendorName: vendor.name,
                eventName: result.event.name,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
              });
              console.log(`Sent timeline change SMS to ${vendor.phone}`);
            } catch (smsError) {
              console.error(`Failed to send SMS to ${vendor.phone}:`, smsError);
            }
          })());
        });

      Promise.all(notificationPromises).then(() => {
        // Mark notifications as sent
        storage.markNotificationsSent(result.change.id);
      });

      res.json({
        event: result.event,
        change: result.change,
        taggedVendors: result.taggedVendors.map(v => ({ id: v.id, name: v.name, email: v.email })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tag vendors to an event for notifications
  app.post("/api/events/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { vendorIds, notifyVia } = req.body;

      if (!vendorIds || !Array.isArray(vendorIds)) {
        return res.status(400).json({ error: "vendorIds array is required" });
      }

      // Get event and verify access
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const tags = await storage.tagVendorsToEvent(eventId, event.weddingId, vendorIds, notifyVia || 'email');
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get vendor tags for an event
  app.get("/api/events/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(eventId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent timeline changes for a wedding
  app.get("/api/weddings/:weddingId/timeline-changes", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const changes = await storage.getRecentTimelineChanges(weddingId, limit);
      res.json(changes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vendor acknowledges a timeline change
  app.post("/api/timeline-changes/:changeId/acknowledge", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;
      const { status, message } = req.body;

      if (!status || !['acknowledged', 'declined'].includes(status)) {
        return res.status(400).json({ error: "status must be 'acknowledged' or 'declined'" });
      }

      // Get vendor profile for this user
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can acknowledge timeline changes" });
      }

      // Find vendor by userId
      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      // Verify the vendor is tagged to this event
      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(change.eventId);
      const isTagged = tags.some(t => t.vendorId === vendor.id);
      if (!isTagged) {
        return res.status(403).json({ error: "You are not tagged to this event" });
      }

      const ack = await storage.acknowledgeChange(changeId, vendor.id, status, message);

      // Broadcast the acknowledgment to the wedding planners
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(change.weddingId, {
          type: 'vendor_ack',
          eventId: change.eventId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          changeId,
          status,
          acknowledgedAt: ack.acknowledgedAt,
        });
      }

      res.json(ack);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending acknowledgments for a vendor
  app.get("/api/vendor/pending-acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get vendor profile for this user
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can access this endpoint" });
      }

      // Find vendor by userId
      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      const pendingAcks = await storage.getPendingAcknowledgmentsForVendor(vendor.id);
      res.json(pendingAcks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get acknowledgments by change
  app.get("/api/timeline-changes/:changeId/acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;

      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      // Verify user has access
      const wedding = await storage.getWedding(change.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, change.weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const acks = await storage.getAcknowledgmentsByChange(changeId);
      res.json(acks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get booked vendors for a wedding (for tagging UI)
  app.get("/api/weddings/:weddingId/booked-vendors", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const bookings = await storage.getBookingsWithVendorsByWedding(weddingId);
      const bookedVendors = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'pending')
        .map(b => ({
          id: b.vendor.id,
          name: b.vendor.name,
          categories: b.vendor.categories,
          email: b.vendor.email,
          phone: b.vendor.phone,
        }));
      
      res.json(bookedVendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
// HELPER FUNCTIONS
// ============================================================================

// Normalize city names to match benchmark data
function normalizeCityName(location: string): string {
  const cityMap: Record<string, string> = {
    'San Francisco': 'San Francisco Bay Area',
    'San Francisco, CA': 'San Francisco Bay Area',
    'SF': 'San Francisco Bay Area',
    'Bay Area': 'San Francisco Bay Area',
    'San Francisco Bay Area': 'San Francisco Bay Area',
    'New York': 'New York City',
    'NYC': 'New York City',
    'New York, NY': 'New York City',
    'New York City': 'New York City',
    'LA': 'Los Angeles',
    'Los Angeles, CA': 'Los Angeles',
    'Los Angeles': 'Los Angeles',
    'Chicago, IL': 'Chicago',
    'Chicago': 'Chicago',
    'Seattle, WA': 'Seattle',
    'Seattle': 'Seattle',
  };

  // Try exact match first
  if (cityMap[location]) {
    return cityMap[location];
  }

  // Try case-insensitive partial match
  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(cityMap)) {
    if (lowerLocation.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to original if no match
  return location;
}

function generateBudgetRecommendations(
  wedding: any,
  benchmarks: any[],
  budgetCategories: any[]
): string[] {
  const recommendations: string[] = [];
  const totalBudget = wedding.totalBudget ? parseFloat(wedding.totalBudget) : 0;

  if (totalBudget === 0) {
    return ["Set a total budget to receive personalized recommendations"];
  }

  // Compare current allocations to benchmarks
  budgetCategories.forEach((bc) => {
    const benchmark = benchmarks.find((b) => b.category === bc.category);
    if (benchmark) {
      const allocated = parseFloat(bc.allocatedAmount);
      const avg = parseFloat(benchmark.averageSpend);
      const min = parseFloat(benchmark.minSpend);
      const max = parseFloat(benchmark.maxSpend);

      if (allocated < min) {
        recommendations.push(
          `Consider increasing ${bc.category} budget: You've allocated $${allocated.toLocaleString()}, but the minimum typical spend in ${wedding.location} is $${min.toLocaleString()}`
        );
      } else if (allocated > max) {
        recommendations.push(
          `${bc.category} budget is above average: You've allocated $${allocated.toLocaleString()}, while the typical maximum is $${max.toLocaleString()}. Consider if this aligns with your priorities.`
        );
      } else if (allocated < avg * 0.8) {
        recommendations.push(
          `${bc.category} allocation is below average: You've budgeted $${allocated.toLocaleString()} vs average of $${avg.toLocaleString()}`
        );
      }
    }
  });

  // Check for missing important categories
  const essentialCategories = ['Catering', 'Venue', 'Photography', 'DJ'];
  essentialCategories.forEach((cat) => {
    const hasCategory = budgetCategories.some((bc) => bc.category === cat);
    if (!hasCategory) {
      const benchmark = benchmarks.find((b) => b.category === cat);
      if (benchmark) {
        recommendations.push(
          `Add ${cat} to your budget: Average spend in ${wedding.location} is $${parseFloat(benchmark.averageSpend).toLocaleString()}`
        );
      }
    }
  });

  // Check total allocation vs total budget
  const totalAllocated = budgetCategories.reduce(
    (sum, bc) => sum + parseFloat(bc.allocatedAmount),
    0
  );

  if (totalAllocated < totalBudget * 0.8) {
    recommendations.push(
      `You've only allocated $${totalAllocated.toLocaleString()} of your $${totalBudget.toLocaleString()} budget. Consider planning for additional categories.`
    );
  } else if (totalAllocated > totalBudget) {
    recommendations.push(
      `⚠️ Budget alert: You've allocated $${totalAllocated.toLocaleString()}, which exceeds your total budget of $${totalBudget.toLocaleString()} by $${(totalAllocated - totalBudget).toLocaleString()}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `✅ Your budget allocation looks well-balanced compared to ${wedding.tradition} wedding benchmarks in ${wedding.location}!`
    );
  }

  return recommendations;
}

// ============================================================================
// LEAD SCORING FUNCTIONS
// ============================================================================

interface LeadScoreInput {
  eventDate?: Date | null;
  estimatedBudget?: string | null;
  guestCount?: number | null;
  tradition?: string | null;
  city?: string | null;
}

interface LeadScores {
  urgencyScore: number;
  budgetFitScore: number;
  qualificationScore: number;
  overallScore: number;
  priority: 'hot' | 'warm' | 'medium' | 'cold';
}

function calculateLeadScore(lead: LeadScoreInput): LeadScores {
  // Urgency score based on wedding date proximity
  let urgencyScore = 50; // Default medium
  if (lead.eventDate) {
    const eventDate = new Date(lead.eventDate);
    const now = new Date();
    const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent < 0) {
      urgencyScore = 0; // Past event
    } else if (daysUntilEvent <= 30) {
      urgencyScore = 100; // Very urgent
    } else if (daysUntilEvent <= 90) {
      urgencyScore = 85;
    } else if (daysUntilEvent <= 180) {
      urgencyScore = 70;
    } else if (daysUntilEvent <= 365) {
      urgencyScore = 50;
    } else {
      urgencyScore = 30; // Far away
    }
  }

  // Budget fit score - higher budget generally means more serious lead
  let budgetFitScore = 50;
  if (lead.estimatedBudget) {
    const budget = lead.estimatedBudget.toLowerCase();
    if (budget.includes('50000') || budget.includes('50k') || budget.includes('premium') || budget.includes('luxury')) {
      budgetFitScore = 100;
    } else if (budget.includes('30000') || budget.includes('30k') || budget.includes('high')) {
      budgetFitScore = 85;
    } else if (budget.includes('20000') || budget.includes('20k') || budget.includes('medium')) {
      budgetFitScore = 70;
    } else if (budget.includes('10000') || budget.includes('10k') || budget.includes('budget')) {
      budgetFitScore = 50;
    } else if (budget.includes('5000') || budget.includes('5k') || budget.includes('low')) {
      budgetFitScore = 30;
    }
  }

  // Qualification score based on completeness of info
  let qualificationScore = 0;
  if (lead.eventDate) qualificationScore += 25;
  if (lead.estimatedBudget) qualificationScore += 25;
  if (lead.guestCount) qualificationScore += 25;
  if (lead.tradition || lead.city) qualificationScore += 25;

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (urgencyScore * 0.4) + 
    (budgetFitScore * 0.3) + 
    (qualificationScore * 0.3)
  );

  // Determine priority based on overall score
  let priority: 'hot' | 'warm' | 'medium' | 'cold' = 'medium';
  if (overallScore >= 80) {
    priority = 'hot';
  } else if (overallScore >= 60) {
    priority = 'warm';
  } else if (overallScore >= 40) {
    priority = 'medium';
  } else {
    priority = 'cold';
  }

  return {
    urgencyScore,
    budgetFitScore,
    qualificationScore,
    overallScore,
    priority,
  };
}

function calculateOverallScore(scores: { urgencyScore: number; budgetFitScore: number; engagementScore: number }): number {
  return Math.round(
    (scores.urgencyScore * 0.35) + 
    (scores.budgetFitScore * 0.25) + 
    (scores.engagementScore * 0.4)
  );
}
