import { Router } from "express";
import type { IStorage } from "../storage";
import { insertHouseholdSchema } from "@shared/schema";
import { sendInvitationEmail } from "../email";

export async function registerHouseholdRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const households = await storage.getHouseholdsByWedding(req.params.weddingId);
      res.json(households);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch households" });
    }
  });

  router.get("/by-id/:id", async (req, res) => {
    try {
      const household = await storage.getHousehold(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household" });
    }
  });

  router.get("/by-token/:token", async (req, res) => {
    try {
      const household = await storage.getHouseholdByMagicToken(req.params.token);
      
      if (!household) {
        return res.status(401).json({ error: "Invalid or expired magic link" });
      }
      
      if (household.magicLinkExpires && new Date(household.magicLinkExpires) < new Date()) {
        return res.status(401).json({ error: "Magic link has expired. Please contact the couple for a new invitation." });
      }
      
      const { magicLinkTokenHash, magicLinkExpires, ...sanitizedHousehold } = household;
      res.json(sanitizedHousehold);
    } catch (error) {
      res.status(500).json({ error: "Failed to authenticate household" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertHouseholdSchema.parse(req.body);
      const household = await storage.createHousehold(validatedData);
      res.json(household);
    } catch (error) {
      console.error("Error creating household:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const validatedData = insertHouseholdSchema.partial().parse(req.body);
      const household = await storage.updateHousehold(req.params.id, validatedData);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json(household);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update household" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteHousehold(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete household" });
    }
  });

  router.post("/:id/generate-token", async (req, res) => {
    try {
      const expiresInDays = req.body.expiresInDays || 30;
      const token = await storage.generateHouseholdMagicToken(req.params.id, expiresInDays);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate magic link token" });
    }
  });

  router.post("/:id/revoke-token", async (req, res) => {
    try {
      await storage.revokeHouseholdMagicToken(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke magic link token" });
    }
  });

  router.get("/:id/magic-link", async (req, res) => {
    try {
      const household = await storage.getHousehold(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      if (!household.magicLinkTokenHash || !household.magicLinkExpires || !household.magicLinkToken) {
        return res.status(404).json({ error: "No active magic link for this household" });
      }

      if (new Date(household.magicLinkExpires) < new Date()) {
        return res.status(410).json({ error: "Magic link has expired" });
      }

      const token = household.magicLinkToken;
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
      const magicLink = `${baseUrl}/rsvp/${token}`;

      res.json({ token, magicLink });
    } catch (error) {
      res.status(500).json({ error: "Failed to get magic link" });
    }
  });

  // Merge duplicate households
  router.post("/merge", async (req, res) => {
    try {
      const { survivorId, mergedId, decision } = req.body;
      
      if (!survivorId || !mergedId) {
        return res.status(400).json({ error: "Both survivorId and mergedId are required" });
      }
      
      if (!['kept_older', 'kept_newer'].includes(decision)) {
        return res.status(400).json({ error: "Decision must be 'kept_older' or 'kept_newer'" });
      }

      // Get user from session for audit logging
      const userId = (req as any).user?.id || 'system';
      
      const audit = await storage.mergeHouseholds(survivorId, mergedId, decision, userId);
      res.json({ success: true, audit });
    } catch (error) {
      console.error("Error merging households:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to merge households" });
    }
  });

  router.post("/send-invitations", async (req, res) => {
    try {
      const { householdIds, weddingId, eventIds, personalMessage } = req.body;

      if (!Array.isArray(householdIds) || !Array.isArray(eventIds)) {
        return res.status(400).json({ error: "householdIds and eventIds must be arrays" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || wedding.partner2Name || 'The Couple';

      const events = await Promise.all(eventIds.map(id => storage.getEvent(id)));
      const eventNames = events.filter(e => e).map(e => e!.name);
      
      const weddingDate = wedding.date ? new Date(wedding.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined;

      const results = [];
      const errors = [];

      for (const householdId of householdIds) {
        try {
          const household = await storage.getHousehold(householdId);
          if (!household) {
            errors.push({ householdId, error: "Household not found" });
            continue;
          }

          const token = await storage.generateHouseholdMagicToken(householdId, 30);
          const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
          const magicLink = `${baseUrl}/rsvp/${token}`;

          const guests = await storage.getGuestsByHousehold(householdId);
          for (const guest of guests) {
            for (const eventId of eventIds) {
              const existing = await storage.getInvitationByGuestAndEvent(guest.id, eventId);
              if (!existing) {
                await storage.createInvitation({
                  guestId: guest.id,
                  eventId,
                  rsvpStatus: 'pending',
                });
              }
            }
          }

          const mainContact = guests.find(g => g.isMainHouseholdContact) || guests[0];
          const contactEmail = mainContact?.email;
          if (contactEmail) {
            await sendInvitationEmail({
              to: contactEmail,
              householdName: household.name,
              coupleName,
              magicLink,
              eventNames,
              weddingDate,
              personalMessage,
            });

            results.push({ householdId, email: contactEmail, success: true });
          } else {
            errors.push({ householdId, error: "No contact email" });
          }
        } catch (error) {
          errors.push({ 
            householdId, 
            error: error instanceof Error ? error.message : "Failed to send invitation" 
          });
        }
      }

      res.json({ 
        success: results.length,
        results,
        errors,
        total: householdIds.length
      });
    } catch (error) {
      console.error("Failed to send bulk invitations:", error);
      res.status(500).json({ error: "Failed to send invitations" });
    }
  });
}
