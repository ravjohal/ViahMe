import { Router } from "express";
import type { IStorage } from "../storage";

export async function registerCollectorRoutes(router: Router, storage: IStorage) {
  // ============================================================================
  // COLLECTOR LINKS - Shareable links for family to submit guests
  // ============================================================================

  router.get("/weddings/:weddingId/collector-links", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const links = await storage.getGuestCollectorLinksByWedding(req.params.weddingId);
      res.json(links);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId/collector-links", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const user = await storage.getUser(userId);
      const link = await storage.createGuestCollectorLink({
        weddingId: req.params.weddingId,
        name: req.body.name,
        side: req.body.side,
        createdById: userId,
        createdByName: user?.name || user?.email,
        maxSubmissions: req.body.maxSubmissions,
        isActive: true,
        expiresAt: req.body.expiresAt,
      });
      res.status(201).json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/collector-links/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const link = await storage.updateGuestCollectorLink(req.params.id, req.body);
      if (!link) {
        return res.status(404).json({ error: "Collector link not found" });
      }
      res.json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-links/:id/deactivate", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const link = await storage.deactivateGuestCollectorLink(req.params.id);
      if (!link) {
        return res.status(404).json({ error: "Collector link not found" });
      }
      res.json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-links/:id/reactivate", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const link = await storage.updateGuestCollectorLink(req.params.id, { isActive: true });
      if (!link) {
        return res.status(404).json({ error: "Collector link not found" });
      }
      res.json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/collector-links/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      await storage.deleteGuestCollectorLink(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PUBLIC COLLECTOR ENDPOINTS (no auth required)
  // ============================================================================

  router.get("/collector/:token", async (req, res) => {
    try {
      const link = await storage.getGuestCollectorLinkByToken(req.params.token);
      if (!link) {
        return res.status(404).json({ error: "Collector link not found" });
      }
      if (!link.isActive) {
        return res.status(410).json({ error: "This link is no longer active" });
      }
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ error: "This link has expired" });
      }
      if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
        return res.status(410).json({ error: "This link has reached its submission limit" });
      }
      
      const wedding = await storage.getWedding(link.weddingId);
      const events = await storage.getEventsByWedding(link.weddingId);
      
      res.json({
        id: link.id,
        name: link.name,
        side: link.side,
        createdByName: link.createdByName,
        weddingInfo: wedding ? {
          partner1Name: wedding.partner1Name,
          partner2Name: wedding.partner2Name,
          weddingDate: wedding.weddingDate,
        } : null,
        events: events.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          date: e.date,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector/:token/submit", async (req, res) => {
    try {
      const link = await storage.getGuestCollectorLinkByToken(req.params.token);
      if (!link) {
        return res.status(404).json({ error: "Collector link not found" });
      }
      if (!link.isActive) {
        return res.status(410).json({ error: "This link is no longer active" });
      }
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ error: "This link has expired" });
      }
      if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
        return res.status(410).json({ error: "This link has reached its submission limit" });
      }
      
      const members = req.body.members || [];
      const guestCount = members.length > 0 ? members.length : (req.body.guestCount || 1);
      
      const submission = await storage.createGuestCollectorSubmission({
        collectorLinkId: link.id,
        weddingId: link.weddingId,
        submitterName: req.body.submitterName,
        submitterRelation: req.body.submitterRelation,
        householdName: req.body.householdName,
        mainContactName: req.body.mainContactName,
        mainContactEmail: req.body.mainContactEmail,
        mainContactPhone: req.body.mainContactPhone,
        relationshipTier: req.body.relationshipTier,
        notes: req.body.notes,
        guestCount,
        dietaryRestriction: req.body.dietaryRestriction,
        members: members.length > 0 ? JSON.stringify(members) : undefined,
        eventSuggestions: req.body.eventSuggestions || [],
        contactStreet: req.body.contactStreet,
        contactCity: req.body.contactCity,
        contactState: req.body.contactState,
        contactPostalCode: req.body.contactPostalCode,
        contactCountry: req.body.contactCountry,
      });
      
      res.status(201).json({ success: true, submissionId: submission.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // COLLECTOR SUBMISSIONS MANAGEMENT
  // ============================================================================

  router.get("/weddings/:weddingId/collector-submissions", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const status = req.query.status as string | undefined;
      const submissions = await storage.getGuestCollectorSubmissionsByWedding(req.params.weddingId, status);
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/weddings/:weddingId/collector-submissions/count", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const count = await storage.getPendingCollectorSubmissionsCount(req.params.weddingId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-submissions/:id/approve", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const result = await storage.approveCollectorSubmission(req.params.id, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-submissions/:id/decline", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const result = await storage.declineCollectorSubmission(req.params.id, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-submissions/:id/maybe", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const result = await storage.markCollectorSubmissionMaybe(req.params.id, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/collector-submissions/:id/restore", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { targetStatus } = req.body;
      if (!targetStatus || !['pending', 'maybe', 'approved'].includes(targetStatus)) {
        return res.status(400).json({ error: "Valid targetStatus required (pending, maybe, or approved)" });
      }
      const result = await storage.restoreCollectorSubmission(req.params.id, targetStatus, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // VOICE-TO-GUEST (public endpoint for collector)
  // ============================================================================

  router.post("/voice-to-guest", async (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "Transcript is required" });
      }
      if (transcript.length > 1000) {
        return res.status(400).json({ error: "Transcript too long (max 1000 characters)" });
      }
      
      const { parseVoiceTranscript } = await import('../ai/gemini');
      const result = await parseVoiceTranscript(transcript);
      res.json(result);
    } catch (error: any) {
      console.error("Voice-to-guest parsing error:", error);
      res.status(500).json({ error: "Failed to parse voice input" });
    }
  });
}
