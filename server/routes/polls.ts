import { Router } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";
import { insertPollSchema, insertPollOptionSchema, insertPollVoteSchema } from "@shared/schema";

const updatePollSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["single", "multiple", "text"]).optional(),
  isOpen: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  showResultsToGuests: z.boolean().optional(),
  eventId: z.string().nullable().optional(),
});

const updatePollOptionSchema = z.object({
  label: z.string().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export function createPollsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const polls = await storage.getPollsByWedding(req.params.weddingId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  router.get("/event/:eventId", async (req, res) => {
    try {
      const polls = await storage.getPollsByEvent(req.params.eventId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch poll" });
    }
  });

  router.get("/:id/full", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const options = await storage.getPollOptionsByPoll(poll.id);
      const votes = await storage.getPollVotesByPoll(poll.id);
      res.json({ poll, options, votes });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch poll details" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { options: optionLabels, ...pollData } = req.body;
      const validatedData = insertPollSchema.parse(pollData);
      const poll = await storage.createPoll(validatedData);

      if (Array.isArray(optionLabels) && optionLabels.length > 0) {
        for (let i = 0; i < optionLabels.length; i++) {
          await storage.createPollOption({
            pollId: poll.id,
            label: optionLabels[i],
            displayOrder: i,
          });
        }
      }

      const options = await storage.getPollOptionsByPoll(poll.id);
      res.status(201).json({ ...poll, options });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Error creating poll:", error);
      res.status(500).json({ error: "Failed to create poll" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const validatedData = updatePollSchema.parse(req.body);
      const poll = await storage.updatePoll(req.params.id, validatedData);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.issues });
      }
      res.status(500).json({ error: "Failed to update poll" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deletePoll(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete poll" });
    }
  });

  return router;
}

export function createPollOptionsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/poll/:pollId", async (req, res) => {
    try {
      const options = await storage.getPollOptionsByPoll(req.params.pollId);
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch poll options" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertPollOptionSchema.parse(req.body);
      const option = await storage.createPollOption(validatedData);
      res.status(201).json(option);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create poll option" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const validatedData = updatePollOptionSchema.parse(req.body);
      const option = await storage.updatePollOption(req.params.id, validatedData);
      if (!option) {
        return res.status(404).json({ error: "Poll option not found" });
      }
      res.json(option);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.issues });
      }
      res.status(500).json({ error: "Failed to update poll option" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deletePollOption(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Poll option not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete poll option" });
    }
  });

  return router;
}

export function createPollVotesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/poll/:pollId", async (req, res) => {
    try {
      const votes = await storage.getPollVotesByPoll(req.params.pollId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  router.get("/poll/:pollId/results", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.pollId);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const options = await storage.getPollOptionsByPoll(poll.id);
      const votes = await storage.getPollVotesByPoll(poll.id);

      const optionResults = options.map(opt => ({
        ...opt,
        voteCount: votes.filter(v => v.optionId === opt.id).length,
      }));

      const textResponses = poll.type === "text"
        ? votes.filter(v => v.textResponse).map(v => ({
            textResponse: v.textResponse,
            guestId: poll.isAnonymous ? null : v.guestId,
            createdAt: v.createdAt,
          }))
        : [];

      const uniqueVoters = new Set(votes.map(v => v.guestId).filter(Boolean)).size;

      res.json({
        poll,
        options: optionResults,
        textResponses,
        totalVotes: votes.length,
        uniqueVoters,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch poll results" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { pollId, guestId, householdId, optionId, optionIds, textResponse } = req.body;

      if (!pollId || !guestId) {
        return res.status(400).json({ error: "pollId and guestId are required" });
      }

      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      if (!poll.isOpen) {
        return res.status(400).json({ error: "This poll is closed" });
      }

      if (householdId) {
        const householdGuests = await storage.getGuestsByHousehold(householdId);
        const guestBelongsToHousehold = householdGuests.some(g => g.id === guestId);
        if (!guestBelongsToHousehold) {
          return res.status(403).json({ error: "Guest does not belong to this household" });
        }
      }

      await storage.deletePollVotesByGuest(pollId, guestId);

      const createdVotes = [];

      if (poll.type === "text") {
        if (!textResponse) {
          return res.status(400).json({ error: "textResponse is required for text polls" });
        }
        const vote = await storage.createPollVote({
          pollId,
          guestId,
          householdId: householdId || null,
          optionId: null,
          textResponse,
        });
        createdVotes.push(vote);
      } else if (poll.type === "multiple" && Array.isArray(optionIds)) {
        for (const oid of optionIds) {
          const vote = await storage.createPollVote({
            pollId,
            guestId,
            householdId: householdId || null,
            optionId: oid,
            textResponse: null,
          });
          createdVotes.push(vote);
        }
      } else {
        if (!optionId) {
          return res.status(400).json({ error: "optionId is required for single-choice polls" });
        }
        const vote = await storage.createPollVote({
          pollId,
          guestId,
          householdId: householdId || null,
          optionId,
          textResponse: null,
        });
        createdVotes.push(vote);
      }

      res.status(201).json(createdVotes);
    } catch (error) {
      console.error("Error creating vote:", error);
      res.status(500).json({ error: "Failed to submit vote" });
    }
  });

  router.get("/guest/:pollId/:guestId", async (req, res) => {
    try {
      const votes = await storage.getPollVotesByGuest(req.params.pollId, req.params.guestId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guest votes" });
    }
  });

  return router;
}

export function createGuestPollsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/by-token/:token", async (req, res) => {
    try {
      const household = await storage.getHouseholdByMagicToken(req.params.token);
      if (!household) {
        return res.status(404).json({ error: "Invalid token" });
      }

      if (household.magicLinkExpires && new Date(household.magicLinkExpires) < new Date()) {
        return res.status(401).json({ error: "Token expired" });
      }

      const guests = await storage.getGuestsByHousehold(household.id);
      if (guests.length === 0) {
        return res.json([]);
      }

      const guestIds = guests.map(g => g.id);
      const invitations = [];
      for (const guestId of guestIds) {
        const guestInvitations = await storage.getInvitationsByGuest(guestId);
        invitations.push(...guestInvitations);
      }

      const eventIds = [...new Set(invitations.map(inv => inv.eventId))];
      if (eventIds.length === 0) {
        return res.json([]);
      }

      const allPolls = [];
      for (const eventId of eventIds) {
        const eventPolls = await storage.getPollsByEvent(eventId);
        allPolls.push(...eventPolls.filter(p => p.isOpen));
      }

      const pollsWithOptions = await Promise.all(
        allPolls.map(async (poll) => {
          const options = await storage.getPollOptionsByPoll(poll.id);

          const firstGuestId = guestIds[0];
          const existingVotes = await storage.getPollVotesByGuest(poll.id, firstGuestId);

          let results = null;
          if (poll.showResultsToGuests) {
            const allVotes = await storage.getPollVotesByPoll(poll.id);
            results = options.map(opt => ({
              ...opt,
              voteCount: allVotes.filter(v => v.optionId === opt.id).length,
            }));
          }

          return {
            ...poll,
            options,
            myVotes: existingVotes,
            results,
          };
        })
      );

      res.json({
        household: { id: household.id, name: household.name },
        guests: guests.map(g => ({ id: g.id, name: g.name })),
        polls: pollsWithOptions,
      });
    } catch (error) {
      console.error("Error fetching guest polls:", error);
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  return router;
}
