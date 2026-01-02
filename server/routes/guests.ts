import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertHouseholdSchema, insertGuestSchema, insertInvitationSchema } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";
import { sendRsvpConfirmationEmail, sendInvitationEmail } from "../email";

export async function registerGuestRoutes(router: Router, storage: IStorage) {
  router.get("/households/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const households = await storage.getHouseholdsByWedding(req.params.weddingId);
      res.json(households);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch households" });
    }
  });

  router.get("/households/by-id/:id", async (req, res) => {
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

  router.get("/households/by-token/:token", async (req, res) => {
    try {
      const household = await storage.getHouseholdByToken(req.params.token);
      if (!household) {
        return res.status(404).json({ error: "Invalid or expired link" });
      }
      
      if (household.magicLinkExpires && new Date(household.magicLinkExpires) < new Date()) {
        return res.status(410).json({ error: "This link has expired" });
      }
      
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate link" });
    }
  });

  router.post("/households", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertHouseholdSchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(validatedData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const household = await storage.createHousehold(validatedData);
      res.json(household);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  router.patch("/households/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingHousehold = await storage.getHousehold(req.params.id);
      if (!existingHousehold) {
        return res.status(404).json({ error: "Household not found" });
      }

      const wedding = await storage.getWedding(existingHousehold.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingHousehold.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const household = await storage.updateHousehold(req.params.id, req.body);
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to update household" });
    }
  });

  router.delete("/households/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingHousehold = await storage.getHousehold(req.params.id);
      if (!existingHousehold) {
        return res.status(404).json({ error: "Household not found" });
      }

      const wedding = await storage.getWedding(existingHousehold.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingHousehold.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      await storage.deleteHousehold(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete household" });
    }
  });

  router.patch("/households/:id/priority", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingHousehold = await storage.getHousehold(req.params.id);
      if (!existingHousehold) {
        return res.status(404).json({ error: "Household not found" });
      }

      const wedding = await storage.getWedding(existingHousehold.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingHousehold.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const { priority } = req.body;
      const household = await storage.updateHousehold(req.params.id, { priority });
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to update household priority" });
    }
  });

  router.post("/households/:id/generate-token", await requireAuth(storage, false), async (req, res) => {
    try {
      const household = await storage.generateMagicLinkToken(req.params.id);
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate magic link" });
    }
  });

  router.post("/households/:id/revoke-token", await requireAuth(storage, false), async (req, res) => {
    try {
      const household = await storage.revokeMagicLinkToken(req.params.id);
      res.json(household);
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke magic link" });
    }
  });

  router.get("/households/:id/magic-link", async (req, res) => {
    try {
      const household = await storage.getHousehold(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      if (!household.magicLinkTokenHash) {
        return res.status(404).json({ error: "No magic link generated for this household" });
      }
      
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      
      const magicLink = `${baseUrl}/rsvp/${household.magicLinkTokenHash}`;
      
      res.json({ 
        magicLink,
        expiresAt: household.magicLinkExpires,
        hasToken: true,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get magic link" });
    }
  });

  router.get("/guests/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const guests = await storage.getGuestsByWedding(req.params.weddingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  router.get("/guests/by-household/:householdId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByHousehold(req.params.householdId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  router.post("/guests", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertGuestSchema.parse(req.body);

      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(validatedData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const guest = await storage.createGuest(validatedData);
      res.json(guest);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create guest" });
    }
  });

  router.post("/guests/bulk", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const guestsArray = req.body.guests;
      if (!Array.isArray(guestsArray)) {
        return res.status(400).json({ error: "Request body must contain a 'guests' array" });
      }

      if (guestsArray.length === 0) {
        return res.json({ success: 0, failed: 0, guests: [], errors: undefined });
      }

      // Debug: log first guest to see if householdName is present
      console.log("=== BULK IMPORT DEBUG ===");
      console.log("Number of guests:", guestsArray.length);
      console.log("First guest data received:", JSON.stringify(guestsArray[0], null, 2));
      console.log("First guest householdName:", guestsArray[0]?.householdName);
      console.log("=========================");

      const weddingId = guestsArray[0].weddingId;
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const createdGuests = [];
      const errors = [];
      const householdMap = new Map<string, string>();

      const existingHouseholds = await storage.getHouseholdsByWedding(weddingId);
      for (const household of existingHouseholds) {
        householdMap.set(household.name.toLowerCase(), household.id);
      }

      const guestCountByHousehold = new Map<string, number>();
      for (const guest of guestsArray) {
        const name = guest.householdName?.trim()?.toLowerCase();
        if (name) {
          guestCountByHousehold.set(name, (guestCountByHousehold.get(name) || 0) + 1);
        }
      }

      for (let i = 0; i < guestsArray.length; i++) {
        try {
          const guestData = guestsArray[i];
          const householdName = guestData.householdName?.trim();
          let householdId: string | undefined;

          if (householdName) {
            const normalizedName = householdName.toLowerCase();
            if (householdMap.has(normalizedName)) {
              householdId = householdMap.get(normalizedName);
            } else {
              const guestCount = guestCountByHousehold.get(normalizedName) || 1;
              const household = await storage.createHousehold({
                weddingId: guestData.weddingId,
                name: householdName,
                affiliation: guestData.side || 'mutual',
                relationshipTier: 'friend',
                priorityTier: 'nice_to_have',
                maxCount: guestCount,
              });
              householdId = household.id;
              householdMap.set(normalizedName, household.id);
            }
          }

          const { householdName: _, address, ...guestWithoutHouseholdName } = guestData;
          const validatedData = insertGuestSchema.parse({
            ...guestWithoutHouseholdName,
            householdId,
            // Map 'address' from import to 'addressStreet' in schema
            addressStreet: address || guestWithoutHouseholdName.addressStreet,
          });
          const guest = await storage.createGuest(validatedData);
          createdGuests.push(guest);
        } catch (error) {
          errors.push({
            index: i,
            data: guestsArray[i],
            error: error instanceof Error ? error.message : "Validation failed"
          });
        }
      }

      res.json({
        success: createdGuests.length,
        failed: errors.length,
        guests: createdGuests,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk import guests" });
    }
  });

  router.patch("/guests/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingGuest = await storage.getGuest(req.params.id);
      if (!existingGuest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      const wedding = await storage.getWedding(existingGuest.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingGuest.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Prevent uninviting guests who have already RSVP'd (confirmed)
      if (req.body.rsvpStatus === "uninvited" && existingGuest.rsvpStatus === "confirmed") {
        return res.status(400).json({ error: "Cannot uninvite a guest who has already RSVP'd" });
      }

      const guest = await storage.updateGuest(req.params.id, req.body);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }
      
      if (req.body.rsvpStatus && guest.email) {
        const guestEmail = guest.email;
        (async () => {
          try {
            const eventId = guest.eventIds && guest.eventIds.length > 0 ? guest.eventIds[0] : null;
            const event = eventId ? await storage.getEvent(eventId) : null;
            const weddingData = event ? await storage.getWedding(event.weddingId) : null;
            
            const eventName = event?.name || 'Wedding Event';
            const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Date TBD';
            const eventVenue = event?.location || undefined;
            
            const coupleName = weddingData?.partner1Name && weddingData?.partner2Name 
              ? `${weddingData.partner1Name} & ${weddingData.partner2Name}`
              : weddingData?.partner1Name || weddingData?.partner2Name || 'The Couple';
            
            await sendRsvpConfirmationEmail({
              to: guestEmail,
              guestName: guest.name,
              eventName,
              eventDate,
              eventVenue,
              rsvpStatus: guest.rsvpStatus as 'attending' | 'not_attending' | 'maybe',
              coupleName,
            });
          } catch (emailError) {
            console.error('Failed to send RSVP confirmation email:', emailError);
          }
        })();
      }
      
      res.json(guest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update guest" });
    }
  });

  router.delete("/guests/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existingGuest = await storage.getGuest(req.params.id);
      if (!existingGuest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      const wedding = await storage.getWedding(existingGuest.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingGuest.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Prevent deleting guests who have already RSVP'd (confirmed)
      if (existingGuest.rsvpStatus === "confirmed") {
        return res.status(400).json({ error: "Cannot delete a guest who has already RSVP'd" });
      }

      const success = await storage.deleteGuest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Guest not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete guest" });
    }
  });

  // Plus-One Management
  router.post("/guests/:id/plus-one", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const guest = await storage.getGuest(req.params.id);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      // Prevent creating a plus-one for a guest that is already a plus-one
      if ((guest as any).plusOneForGuestId) {
        return res.status(400).json({ error: "Cannot create a plus-one for a guest that is already a plus-one" });
      }

      const wedding = await storage.getWedding(guest.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(guest.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const plusOneGuest = await storage.createPlusOneGuest(req.params.id);
      res.json(plusOneGuest);
    } catch (error) {
      console.error("Failed to create plus-one:", error);
      res.status(500).json({ error: "Failed to create plus-one" });
    }
  });

  router.delete("/guests/:id/plus-one", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const guest = await storage.getGuest(req.params.id);
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      const wedding = await storage.getWedding(guest.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.coupleId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(guest.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const success = await storage.deletePlusOneGuest(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Failed to delete plus-one:", error);
      res.status(500).json({ error: "Failed to delete plus-one" });
    }
  });

  router.get("/guests/:id/plus-one", async (req, res) => {
    try {
      const plusOne = await storage.getPlusOneForGuest(req.params.id);
      res.json(plusOne || null);
    } catch (error) {
      console.error("Failed to get plus-one:", error);
      res.status(500).json({ error: "Failed to get plus-one" });
    }
  });

  router.get("/invitations/by-guest/:guestId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByGuest(req.params.guestId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  router.get("/invitations/by-event/:eventId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByEvent(req.params.eventId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  router.get("/invitations/household/:householdId", async (req, res) => {
    try {
      const householdId = req.params.householdId;
      const guests = await storage.getGuestsByHousehold(householdId);
      const allInvitations = [];
      
      for (const guest of guests) {
        const invitations = await storage.getInvitationsByGuest(guest.id);
        allInvitations.push(...invitations);
      }
      
      res.json(allInvitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household invitations" });
    }
  });

  router.post("/invitations", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertInvitationSchema.parse(req.body);
      const invitation = await storage.createInvitation(validatedData);
      res.json(invitation);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  router.patch("/invitations/:id/rsvp", async (req, res) => {
    try {
      const { rsvpStatus, dietaryRestrictions, plusOneCount, plusOneName, message } = req.body;
      
      const updatedInvitation = await storage.updateInvitation(req.params.id, {
        rsvpStatus,
        dietaryRestrictions,
        plusOneCount,
        plusOneName,
        rsvpNotes: message,
        respondedAt: new Date(),
      });
      
      if (!updatedInvitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      (async () => {
        try {
          const guest = await storage.getGuest(updatedInvitation.guestId);
          if (guest?.email) {
            const event = await storage.getEvent(updatedInvitation.eventId);
            const wedding = event ? await storage.getWedding(event.weddingId) : null;
            
            const coupleName = wedding?.partner1Name && wedding?.partner2Name 
              ? `${wedding.partner1Name} & ${wedding.partner2Name}`
              : wedding?.partner1Name || wedding?.partner2Name || 'The Couple';
            
            await sendRsvpConfirmationEmail({
              to: guest.email,
              guestName: guest.name,
              eventName: event?.name || 'Wedding Event',
              eventDate: event?.date ? new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Date TBD',
              rsvpStatus: rsvpStatus === 'attending' ? 'Attending' : 'Not Attending',
            });
          }
        } catch (emailError) {
          console.error('Failed to send RSVP confirmation email:', emailError);
        }
      })();

      res.json(updatedInvitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit RSVP" });
    }
  });

  router.delete("/invitations/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      await storage.deleteInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  router.get("/budget/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const settings = await storage.getGuestBudgetSettings(req.params.weddingId);
      res.json(settings || { maxGuests: 0, costPerHead: 150 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guest budget settings" });
    }
  });

  router.post("/budget/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const settings = await storage.upsertGuestBudgetSettings({
        weddingId: req.params.weddingId,
        ...req.body,
      });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to save guest budget settings" });
    }
  });

  router.get("/budget/:weddingId/capacity", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      const [settings, guests] = await Promise.all([
        storage.getGuestBudgetSettings(weddingId),
        storage.getGuestsByWedding(weddingId),
      ]);
      
      const maxGuests = settings?.maxGuests || 0;
      const currentCount = guests.length;
      const costPerHead = settings?.costPerHead || 150;
      
      res.json({
        maxGuests,
        currentCount,
        remaining: Math.max(0, maxGuests - currentCount),
        costPerHead,
        estimatedTotalCost: currentCount * costPerHead,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capacity" });
    }
  });

  return router;
}
