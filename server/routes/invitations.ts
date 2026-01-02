import { Router } from "express";
import type { IStorage } from "../storage";
import { insertInvitationSchema } from "@shared/schema";
import { sendRsvpConfirmationEmail } from "../email";

export async function registerInvitationRoutes(router: Router, storage: IStorage) {
  router.get("/by-guest/:guestId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByGuest(req.params.guestId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  router.get("/by-event/:eventId", async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByEvent(req.params.eventId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  router.get("/household/:householdId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByHousehold(req.params.householdId);
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

  router.post("/", async (req, res) => {
    try {
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

  router.post("/bulk", async (req, res) => {
    try {
      const invitationsArray = req.body.invitations;
      if (!Array.isArray(invitationsArray)) {
        return res.status(400).json({ error: "Request body must contain an 'invitations' array" });
      }

      const validatedInvitations = invitationsArray.map(inv => 
        insertInvitationSchema.parse(inv)
      );

      const createdInvitations = await storage.bulkCreateInvitations(validatedInvitations);
      res.json({ 
        success: createdInvitations.length,
        invitations: createdInvitations 
      });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create invitations" });
    }
  });

  router.patch("/:id/rsvp", async (req, res) => {
    try {
      const { rsvpStatus, dietaryRestrictions, plusOneAttending } = req.body;
      
      const updatedInvitation = await storage.updateInvitation(req.params.id, {
        rsvpStatus,
        dietaryRestrictions,
        plusOneAttending,
        respondedAt: new Date(),
      });

      if (!updatedInvitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      (async () => {
        try {
          const guest = await storage.getGuest(updatedInvitation.guestId);
          const event = await storage.getEvent(updatedInvitation.eventId);
          
          if (guest?.email && event) {
            await sendRsvpConfirmationEmail({
              to: guest.email,
              guestName: guest.name,
              eventName: event.name,
              eventDate: event.date ? new Date(event.date).toLocaleDateString('en-US', {
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

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });
}
