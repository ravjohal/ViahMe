import { Router } from "express";
import type { IStorage } from "../storage";
import { insertGuestSchema } from "@shared/schema";
import { sendRsvpConfirmationEmail } from "../email";

export async function registerGuestPublicRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByWedding(req.params.weddingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  router.get("/by-household/:householdId", async (req, res) => {
    try {
      const guests = await storage.getGuestsByHousehold(req.params.householdId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(validatedData);
      res.json(guest);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create guest" });
    }
  });

  router.post("/bulk", async (req, res) => {
    try {
      const guestsArray = req.body.guests;
      if (!Array.isArray(guestsArray)) {
        return res.status(400).json({ error: "Request body must contain a 'guests' array" });
      }

      const createdGuests = [];
      const errors = [];

      for (let i = 0; i < guestsArray.length; i++) {
        try {
          const validatedData = insertGuestSchema.parse(guestsArray[i]);
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

  router.patch("/:id", async (req, res) => {
    try {
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
            const wedding = event ? await storage.getWedding(event.weddingId) : null;
            
            const eventName = event?.name || 'Wedding Event';
            const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Date TBD';
            const eventVenue = event?.location || undefined;
            
            const coupleName = wedding?.partner1Name && wedding?.partner2Name 
              ? `${wedding.partner1Name} & ${wedding.partner2Name}`
              : wedding?.partner1Name || wedding?.partner2Name || 'The Couple';
            
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

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteGuest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Guest not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete guest" });
    }
  });
}
