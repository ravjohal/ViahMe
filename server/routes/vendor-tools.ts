import { Router } from "express";
import type { IStorage } from "../storage";
import { parseConversationId, generateConversationId } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import {
  insertQuickReplyTemplateSchema,
  insertFollowUpReminderSchema,
} from "@shared/schema";

export async function registerVendorToolsRoutes(router: Router, storage: IStorage): Promise<void> {

  // Get lead inbox data for a vendor (conversations with unread counts and wedding details)
  router.get("/lead-inbox/:vendorId", async (req, res) => {
    try {
      const vendorId = req.params.vendorId;
      const conversationIds = await storage.getConversationsByVendor(vendorId);
      
      const existingConversations = new Set<string>();
      
      const leadsFromConversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const key = parsed.eventId ? `${parsed.weddingId}-${parsed.eventId}` : parsed.weddingId;
          existingConversations.add(key);
          
          const messages = await storage.getConversationMessages(convId);
          const wedding = await storage.getWedding(parsed.weddingId);
          const unreadCount = await storage.getUnreadCount(convId, 'vendor');
          
          let eventName: string | undefined;
          if (parsed.eventId) {
            const event = await storage.getEvent(parsed.eventId);
            eventName = event?.name;
          }
          
          const lastMessage = messages[messages.length - 1];
          const firstMessage = messages[0];
          
          const coupleName = wedding?.partner1Name && wedding?.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding?.partner1Name || wedding?.partner2Name || 'Couple';
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            eventId: parsed.eventId,
            coupleName,
            eventName,
            weddingDate: wedding?.date,
            city: wedding?.city,
            tradition: wedding?.tradition,
            unreadCount,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderType: lastMessage.senderType,
              createdAt: lastMessage.createdAt,
            } : null,
            firstInquiryDate: firstMessage?.createdAt,
            totalMessages: messages.length,
            bookingStatus: undefined as string | undefined,
            bookingId: undefined as string | undefined,
          };
        })
      );
      
      const bookings = await storage.getBookingsByVendor(vendorId);
      
      const leadsFromBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          const key = booking.eventId ? `${booking.weddingId}-${booking.eventId}` : booking.weddingId;
          if (existingConversations.has(key)) {
            return null;
          }
          
          const wedding = await storage.getWedding(booking.weddingId);
          if (!wedding) return null;
          
          let eventName: string | undefined;
          if (booking.eventId) {
            const event = await storage.getEvent(booking.eventId);
            eventName = event?.name;
          }
          
          const coupleName = wedding.partner1Name && wedding.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'Couple';
          
          const convId = generateConversationId(booking.weddingId, vendorId, booking.eventId || undefined);
          
          return {
            conversationId: convId,
            weddingId: booking.weddingId,
            vendorId: vendorId,
            eventId: booking.eventId || undefined,
            coupleName,
            eventName,
            weddingDate: wedding.date,
            city: wedding.city,
            tradition: wedding.tradition,
            unreadCount: 1,
            lastMessage: {
              content: `Booking request: ${booking.status === 'pending' ? 'Awaiting your response' : booking.status}`,
              senderType: 'couple',
              createdAt: booking.requestDate,
            },
            firstInquiryDate: booking.requestDate,
            totalMessages: 0,
            bookingStatus: booking.status,
            bookingId: booking.id,
          };
        })
      );
      
      const allLeads = [...leadsFromConversations, ...leadsFromBookings].filter(Boolean);
      
      const sortedLeads = allLeads.sort((a, b) => {
        if (b!.unreadCount !== a!.unreadCount) return b!.unreadCount - a!.unreadCount;
        const aDate = a!.lastMessage?.createdAt || new Date(0);
        const bDate = b!.lastMessage?.createdAt || new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      
      res.json(sortedLeads);
    } catch (error) {
      console.error("Error fetching lead inbox:", error);
      res.status(500).json({ error: "Failed to fetch lead inbox" });
    }
  });

  // QUICK REPLY TEMPLATES

  router.get("/quick-reply-templates/vendor/:vendorId", async (req, res) => {
    try {
      const templates = await storage.getQuickReplyTemplatesByVendor(req.params.vendorId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  router.post("/quick-reply-templates", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertQuickReplyTemplateSchema.parse(req.body);
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create templates for your own vendor profile" });
      }
      
      const template = await storage.createQuickReplyTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  router.patch("/quick-reply-templates/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertQuickReplyTemplateSchema.partial().parse(req.body);
      
      const existing = await storage.getQuickReplyTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only update your own templates" });
      }
      
      const template = await storage.updateQuickReplyTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  router.delete("/quick-reply-templates/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const existing = await storage.getQuickReplyTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only delete your own templates" });
      }
      
      await storage.deleteQuickReplyTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  router.post("/quick-reply-templates/:id/use", async (req, res) => {
    try {
      const template = await storage.incrementTemplateUsage(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to track template usage" });
    }
  });

  // FOLLOW-UP REMINDERS

  router.get("/follow-up-reminders/vendor/:vendorId", async (req, res) => {
    try {
      const reminders = await storage.getFollowUpRemindersByVendor(req.params.vendorId);
      
      const enrichedReminders = await Promise.all(
        reminders.map(async (reminder) => {
          const wedding = await storage.getWedding(reminder.weddingId);
          return {
            ...reminder,
            coupleName: wedding?.coupleName1 && wedding?.coupleName2 
              ? `${wedding.coupleName1} & ${wedding.coupleName2}`
              : wedding?.coupleName1 || 'Unknown',
          };
        })
      );
      
      res.json(enrichedReminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  router.get("/follow-up-reminders/vendor/:vendorId/pending", async (req, res) => {
    try {
      const reminders = await storage.getPendingRemindersForVendor(req.params.vendorId);
      
      const enrichedReminders = await Promise.all(
        reminders.map(async (reminder) => {
          const wedding = await storage.getWedding(reminder.weddingId);
          return {
            ...reminder,
            coupleName: wedding?.coupleName1 && wedding?.coupleName2 
              ? `${wedding.coupleName1} & ${wedding.coupleName2}`
              : wedding?.coupleName1 || 'Unknown',
          };
        })
      );
      
      res.json(enrichedReminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reminders" });
    }
  });

  router.post("/follow-up-reminders", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertFollowUpReminderSchema.parse(req.body);
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create reminders for your own vendor profile" });
      }
      
      const reminder = await storage.createFollowUpReminder(validatedData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  router.patch("/follow-up-reminders/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertFollowUpReminderSchema.partial().parse(req.body);
      
      const existing = await storage.getFollowUpReminder(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only update your own reminders" });
      }
      
      const reminder = await storage.updateFollowUpReminder(req.params.id, validatedData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  router.delete("/follow-up-reminders/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const existing = await storage.getFollowUpReminder(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.user?.id);
      
      if (!userVendor || userVendor.id !== existing.vendorId) {
        return res.status(403).json({ error: "You can only delete your own reminders" });
      }
      
      await storage.deleteFollowUpReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });
}
