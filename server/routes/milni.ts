import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { 
  insertMilniListSchema, 
  insertMilniParticipantSchema, 
  insertMilniPairSchema,
  DEFAULT_MILNI_TEMPLATES 
} from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";
import { z } from "zod";

export async function registerMilniRoutes(router: Router, storage: IStorage) {
  
  // Get default milni templates (public - used to pre-populate pairs)
  router.get("/milni/templates", async (req, res) => {
    try {
      res.json(DEFAULT_MILNI_TEMPLATES);
    } catch (error) {
      console.error("Failed to fetch milni templates:", error);
      res.status(500).json({ error: "Failed to fetch milni templates" });
    }
  });

  // Get all milni lists for a wedding
  router.get("/milni/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const lists = await storage.getMilniListsByWedding(weddingId);
      res.json(lists);
    } catch (error) {
      console.error("Failed to fetch milni lists:", error);
      res.status(500).json({ error: "Failed to fetch milni lists" });
    }
  });

  // Get a single milni list with all details
  router.get("/milni/lists/:listId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniListWithDetails(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(list);
    } catch (error) {
      console.error("Failed to fetch milni list:", error);
      res.status(500).json({ error: "Failed to fetch milni list" });
    }
  });

  // Create a new milni list (optionally pre-populate with default pairs)
  router.post("/milni/lists", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { useDefaultPairs, ...listData } = req.body;
      const validatedData = insertMilniListSchema.parse(listData);

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const list = await storage.createMilniList(validatedData);

      // Optionally pre-populate with default pairs
      if (useDefaultPairs) {
        for (const template of DEFAULT_MILNI_TEMPLATES) {
          await storage.createMilniPair({
            milniListId: list.id,
            sequence: template.sequence,
            relationSlug: template.relationSlug,
            relationLabel: template.relationLabel,
            status: "pending",
          });
        }
      }

      // Return the full list with details
      const fullList = await storage.getMilniListWithDetails(list.id);
      res.json(fullList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create milni list:", error);
      res.status(500).json({ error: "Failed to create milni list" });
    }
  });

  // Update a milni list
  router.patch("/milni/lists/:listId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateMilniList(listId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update milni list:", error);
      res.status(500).json({ error: "Failed to update milni list" });
    }
  });

  // Delete a milni list
  router.delete("/milni/lists/:listId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteMilniList(listId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete milni list:", error);
      res.status(500).json({ error: "Failed to delete milni list" });
    }
  });

  // ============ PARTICIPANTS ============

  // Get participants for a milni list
  router.get("/milni/lists/:listId/participants", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const { side } = req.query;
      
      const list = await storage.getMilniList(listId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      let participants;
      if (side === 'bride' || side === 'groom') {
        participants = await storage.getMilniParticipantsBySide(listId, side);
      } else {
        participants = await storage.getMilniParticipantsByList(listId);
      }

      res.json(participants);
    } catch (error) {
      console.error("Failed to fetch milni participants:", error);
      res.status(500).json({ error: "Failed to fetch milni participants" });
    }
  });

  // Create a participant
  router.post("/milni/lists/:listId/participants", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertMilniParticipantSchema.parse({
        ...req.body,
        milniListId: listId,
      });

      const participant = await storage.createMilniParticipant(validatedData);
      res.json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create milni participant:", error);
      res.status(500).json({ error: "Failed to create milni participant" });
    }
  });

  // Update a participant
  router.patch("/milni/participants/:participantId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { participantId } = req.params;
      const participant = await storage.getMilniParticipant(participantId);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      const list = await storage.getMilniList(participant.milniListId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateMilniParticipant(participantId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update milni participant:", error);
      res.status(500).json({ error: "Failed to update milni participant" });
    }
  });

  // Delete a participant
  router.delete("/milni/participants/:participantId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { participantId } = req.params;
      const participant = await storage.getMilniParticipant(participantId);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      const list = await storage.getMilniList(participant.milniListId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteMilniParticipant(participantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete milni participant:", error);
      res.status(500).json({ error: "Failed to delete milni participant" });
    }
  });

  // ============ PAIRS ============

  // Get pairs for a milni list (with participant details)
  router.get("/milni/lists/:listId/pairs", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const pairs = await storage.getMilniPairsWithParticipants(listId);
      res.json(pairs);
    } catch (error) {
      console.error("Failed to fetch milni pairs:", error);
      res.status(500).json({ error: "Failed to fetch milni pairs" });
    }
  });

  // Create a pair
  router.post("/milni/lists/:listId/pairs", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const list = await storage.getMilniList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertMilniPairSchema.parse({
        ...req.body,
        milniListId: listId,
      });

      const pair = await storage.createMilniPair(validatedData);
      res.json(pair);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create milni pair:", error);
      res.status(500).json({ error: "Failed to create milni pair" });
    }
  });

  // Update a pair (including gift tracking)
  router.patch("/milni/pairs/:pairId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { pairId } = req.params;
      const pair = await storage.getMilniPair(pairId);
      
      if (!pair) {
        return res.status(404).json({ error: "Pair not found" });
      }

      const list = await storage.getMilniList(pair.milniListId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateMilniPair(pairId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update milni pair:", error);
      res.status(500).json({ error: "Failed to update milni pair" });
    }
  });

  // Delete a pair
  router.delete("/milni/pairs/:pairId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { pairId } = req.params;
      const pair = await storage.getMilniPair(pairId);
      
      if (!pair) {
        return res.status(404).json({ error: "Pair not found" });
      }

      const list = await storage.getMilniList(pair.milniListId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteMilniPair(pairId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete milni pair:", error);
      res.status(500).json({ error: "Failed to delete milni pair" });
    }
  });

  // Reorder pairs (drag and drop)
  router.put("/milni/lists/:listId/pairs/reorder", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId } = req.params;
      const { pairIds } = req.body;

      if (!Array.isArray(pairIds)) {
        return res.status(400).json({ error: "pairIds must be an array" });
      }

      const list = await storage.getMilniList(listId);
      if (!list) {
        return res.status(404).json({ error: "Milni list not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, list.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const reorderedPairs = await storage.reorderMilniPairs(listId, pairIds);
      res.json(reorderedPairs);
    } catch (error) {
      console.error("Failed to reorder milni pairs:", error);
      res.status(500).json({ error: "Failed to reorder milni pairs" });
    }
  });

  // Search guests for participant linking
  router.get("/milni/wedding/:weddingId/guests/search", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const { q, side } = req.query;

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const allGuests = await storage.getGuestsByWedding(weddingId);
      
      let filteredGuests = allGuests;
      
      // Filter by side if provided
      if (side === 'bride' || side === 'groom') {
        filteredGuests = filteredGuests.filter(g => g.side === side);
      }
      
      // Filter by search query if provided
      if (typeof q === 'string' && q.trim()) {
        const query = q.toLowerCase().trim();
        filteredGuests = filteredGuests.filter(g => 
          g.name.toLowerCase().includes(query) ||
          (g.email && g.email.toLowerCase().includes(query))
        );
      }

      // Return limited results with essential fields
      const results = filteredGuests.slice(0, 20).map(g => ({
        id: g.id,
        name: g.name,
        email: g.email,
        phone: g.phone,
        side: g.side,
        relation: g.relation,
      }));

      res.json(results);
    } catch (error) {
      console.error("Failed to search guests:", error);
      res.status(500).json({ error: "Failed to search guests" });
    }
  });
}
