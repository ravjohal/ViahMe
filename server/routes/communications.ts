import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertGuestCommunicationSchema } from "@shared/schema";
import { ensureCoupleAccess } from "./middleware";
import { sendInvitationEmail } from "../email";
import { sendSMS } from "../twilio";

export async function registerCommunicationRoutes(router: Router, storage: IStorage) {
  router.get("/communications/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const communications = await storage.getGuestCommunicationsByWedding(req.params.weddingId);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  router.get("/communications/:weddingId/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const communication = await storage.getGuestCommunication(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      const wedding = await storage.getWedding(communication.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const recipients = await storage.getCommunicationRecipientsByCommunication(req.params.id);
      res.json({ ...communication, recipients });
    } catch (error) {
      console.error("Error fetching communication details:", error);
      res.status(500).json({ error: "Failed to fetch communication details" });
    }
  });

  router.get("/rsvp-stats/:weddingId", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const stats = await storage.getRsvpStatsByWedding(req.params.weddingId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching RSVP stats:", error);
      res.status(500).json({ error: "Failed to fetch RSVP statistics" });
    }
  });

  router.post("/communications/send-invitations", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, householdIds, eventIds, subject, message, channel } = req.body;

      if (!weddingId || !householdIds || householdIds.length === 0) {
        return res.status(400).json({ error: "Wedding ID and household IDs are required" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const coupleName = user?.name || "Your hosts";

      const households = await Promise.all(
        householdIds.map((id: string) => storage.getHousehold(id))
      );
      const validHouseholds = households.filter(Boolean);

      const communication = await storage.createGuestCommunication({
        weddingId,
        type: "invitation",
        subject: subject || "You're Invited!",
        message: message || "We would be honored to have you celebrate with us.",
        channel: channel || "email",
        recipientCount: validHouseholds.length,
        sentById: authReq.session.userId,
        eventIds: eventIds || [],
        householdIds,
      });

      const events = eventIds ? await Promise.all(
        eventIds.map((id: string) => storage.getEvent(id))
      ) : [];
      const eventNames = events.filter(Boolean).map(e => e!.name);

      let deliveredCount = 0;
      let failedCount = 0;
      const recipientRecords = [];

      for (const household of validHouseholds) {
        if (!household) continue;

        let token = household.magicLinkToken;
        if (!token) {
          token = await storage.generateHouseholdMagicToken(household.id, 365);
        }

        const commsBaseUrl = process.env.REPLIT_DEPLOYMENT_URL
          ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
          : `${req.protocol}://${req.get('host')}`;
        const magicLink = `${commsBaseUrl}/rsvp/${token}`;

        if (channel === "email" || channel === "both") {
          const guests = await storage.getGuestsByHousehold(household.id);
          const mainContact = guests.find(g => g.isMainHouseholdContact) || guests[0];
          const contactEmail = mainContact?.email;
          if (contactEmail) {
            try {
              await sendInvitationEmail({
                to: contactEmail,
                householdName: household.name,
                coupleName,
                magicLink,
                eventNames,
                weddingDate: wedding.date?.toISOString().split("T")[0],
                personalMessage: message,
              });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                email: contactEmail,
                channel: "email" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send email to ${contactEmail}:`, error);
              failedCount++;
            }
          }
        }

        if (channel === "sms" || channel === "both") {
          const guests = await storage.getGuestsByHousehold(household.id);
          const guestWithPhone = guests.find(g => g.phone);
          if (guestWithPhone?.phone) {
            try {
              await sendSMS({
                to: guestWithPhone.phone,
                message: `You're invited to ${coupleName}'s wedding! RSVP here: ${magicLink}`
              });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                phone: guestWithPhone.phone,
                channel: "sms" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send SMS to ${guestWithPhone.phone}:`, error);
              failedCount++;
            }
          }
        }
      }

      if (recipientRecords.length > 0) {
        await storage.createCommunicationRecipientsBulk(recipientRecords);
      }

      const updatedComm = await storage.updateGuestCommunication(communication.id, {
        status: "completed",
        sentAt: new Date(),
        deliveredCount,
        failedCount,
      });

      res.json({
        success: true,
        communication: updatedComm,
        deliveredCount,
        failedCount,
      });
    } catch (error) {
      console.error("Error sending invitations:", error);
      res.status(500).json({ error: "Failed to send invitations" });
    }
  });

  router.post("/communications/send-update", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, householdIds, subject, message, channel, type } = req.body;

      if (!weddingId || !subject || !message) {
        return res.status(400).json({ error: "Wedding ID, subject, and message are required" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const targetHouseholdIds = householdIds || (await storage.getHouseholdsByWedding(weddingId)).map(h => h.id);
      const households = await Promise.all(
        targetHouseholdIds.map((id: string) => storage.getHousehold(id))
      );
      const validHouseholds = households.filter(Boolean);

      const communication = await storage.createGuestCommunication({
        weddingId,
        type: type || "update",
        subject,
        message,
        channel: channel || "email",
        recipientCount: validHouseholds.length,
        sentById: authReq.session.userId,
        householdIds: targetHouseholdIds,
      });

      let deliveredCount = 0;
      let failedCount = 0;
      const recipientRecords = [];

      for (const household of validHouseholds) {
        if (!household) continue;

        if (channel === "email" || channel === "both" || !channel) {
          const guests = await storage.getGuestsByHousehold(household.id);
          const mainContact = guests.find(g => g.isMainHouseholdContact) || guests[0];
          const contactEmail = mainContact?.email;
          if (contactEmail) {
            try {
              const { sendUpdateEmail } = await import("../email");
              await sendUpdateEmail({
                to: contactEmail,
                householdName: household.name,
                subject,
                message,
                weddingName: wedding.coupleName || "Your hosts",
              });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                email: contactEmail,
                channel: "email" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send email to ${contactEmail}:`, error);
              failedCount++;
            }
          }
        }

        if (channel === "sms" || channel === "both") {
          const guests = await storage.getGuestsByHousehold(household.id);
          const guestWithPhone = guests.find(g => g.phone);
          if (guestWithPhone?.phone) {
            try {
              await sendSMS({ to: guestWithPhone.phone, message: `${subject}: ${message.substring(0, 140)}` });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                phone: guestWithPhone.phone,
                channel: "sms" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send SMS to ${guestWithPhone.phone}:`, error);
              failedCount++;
            }
          }
        }
      }

      if (recipientRecords.length > 0) {
        await storage.createCommunicationRecipientsBulk(recipientRecords);
      }

      const updatedComm = await storage.updateGuestCommunication(communication.id, {
        status: "completed",
        sentAt: new Date(),
        deliveredCount,
        failedCount,
      });

      res.json({
        success: true,
        communication: updatedComm,
        deliveredCount,
        failedCount,
      });
    } catch (error) {
      console.error("Error sending update:", error);
      res.status(500).json({ error: "Failed to send update" });
    }
  });

  router.post("/communications/send-rsvp-reminder", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId, eventIds, channel } = req.body;

      if (!weddingId) {
        return res.status(400).json({ error: "Wedding ID is required" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const coupleName = user?.name || "Your hosts";

      const households = await storage.getHouseholdsByWedding(weddingId);
      const pendingHouseholds = [];

      for (const household of households) {
        const guests = await storage.getGuestsByHousehold(household.id);
        let hasPending = false;

        for (const guest of guests) {
          const invitations = await storage.getInvitationsByGuest(guest.id);
          const pendingInvitations = eventIds 
            ? invitations.filter(i => eventIds.includes(i.eventId) && i.rsvpStatus === "pending")
            : invitations.filter(i => i.rsvpStatus === "pending");
          
          if (pendingInvitations.length > 0) {
            hasPending = true;
            break;
          }
        }

        if (hasPending) {
          pendingHouseholds.push(household);
        }
      }

      if (pendingHouseholds.length === 0) {
        return res.json({
          success: true,
          message: "No pending RSVPs found to remind",
          deliveredCount: 0,
          failedCount: 0,
        });
      }

      const communication = await storage.createGuestCommunication({
        weddingId,
        type: "rsvp_reminder",
        subject: "Friendly RSVP Reminder",
        message: "We haven't heard back from you yet. Please let us know if you can join us!",
        channel: channel || "email",
        recipientCount: pendingHouseholds.length,
        sentById: authReq.session.userId,
        eventIds: eventIds || [],
        householdIds: pendingHouseholds.map(h => h.id),
      });

      let deliveredCount = 0;
      let failedCount = 0;
      const recipientRecords = [];

      for (const household of pendingHouseholds) {
        let token = household.magicLinkToken;
        if (!token) {
          token = await storage.generateHouseholdMagicToken(household.id, 365);
        }

        const commsBaseUrl2 = process.env.REPLIT_DEPLOYMENT_URL
          ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
          : `${req.protocol}://${req.get('host')}`;
        const magicLink = `${commsBaseUrl2}/rsvp/${token}`;

        if (channel === "email" || channel === "both" || !channel) {
          const guests = await storage.getGuestsByHousehold(household.id);
          const mainContact = guests.find(g => g.isMainHouseholdContact) || guests[0];
          const contactEmail = mainContact?.email;
          if (contactEmail) {
            try {
              const { sendRsvpReminderEmail } = await import("../email");
              await sendRsvpReminderEmail({
                to: contactEmail,
                householdName: household.name,
                coupleName,
                magicLink,
                weddingDate: wedding.date?.toISOString().split("T")[0],
              });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                email: contactEmail,
                channel: "email" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send reminder email to ${contactEmail}:`, error);
              failedCount++;
            }
          }
        }

        if (channel === "sms" || channel === "both") {
          const guests = await storage.getGuestsByHousehold(household.id);
          const guestWithPhone = guests.find(g => g.phone);
          if (guestWithPhone?.phone) {
            try {
              await sendSMS({
                to: guestWithPhone.phone,
                message: `RSVP Reminder from ${coupleName}: We'd love to hear from you! RSVP here: ${magicLink}`
              });

              recipientRecords.push({
                communicationId: communication.id,
                householdId: household.id,
                phone: guestWithPhone.phone,
                channel: "sms" as const,
              });
              deliveredCount++;
            } catch (error) {
              console.error(`Failed to send reminder SMS to ${guestWithPhone.phone}:`, error);
              failedCount++;
            }
          }
        }
      }

      if (recipientRecords.length > 0) {
        await storage.createCommunicationRecipientsBulk(recipientRecords);
      }

      const updatedComm = await storage.updateGuestCommunication(communication.id, {
        status: "completed",
        sentAt: new Date(),
        deliveredCount,
        failedCount,
      });

      res.json({
        success: true,
        communication: updatedComm,
        deliveredCount,
        failedCount,
        pendingCount: pendingHouseholds.length,
      });
    } catch (error) {
      console.error("Error sending RSVP reminders:", error);
      res.status(500).json({ error: "Failed to send RSVP reminders" });
    }
  });

  router.delete("/communications/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const communication = await storage.getGuestCommunication(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      const wedding = await storage.getWedding(communication.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteGuestCommunication(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting communication:", error);
      res.status(500).json({ error: "Failed to delete communication" });
    }
  });
}
