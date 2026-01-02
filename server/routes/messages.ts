import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, AuthRequest } from "../auth-middleware";
import { insertMessageSchema } from "@shared/schema";
import { generateConversationId, parseConversationId } from "../storage";

export async function registerMessageRoutes(router: Router, storage: IStorage) {
  router.get("/:conversationId", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getConversationMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  router.post("/", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      const conversationId = generateConversationId(
        validatedData.weddingId,
        validatedData.vendorId,
        validatedData.eventId
      );
      const conversationStatus = await storage.getConversationStatus(conversationId);
      if (conversationStatus?.status === 'closed') {
        return res.status(403).json({ 
          error: "Conversation closed", 
          message: "This inquiry has been closed and no new messages can be sent." 
        });
      }
      
      const message = await storage.createMessage(validatedData);
      
      if (message.conversationId && (global as any).broadcastNewMessage) {
        (global as any).broadcastNewMessage(message.conversationId, message);
      }
      
      res.json(message);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  router.patch("/:id/read", async (req: Request, res: Response) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  router.get("/:conversationId/unread/:recipientType", async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadCount(
        req.params.conversationId,
        req.params.recipientType as 'couple' | 'vendor'
      );
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
}

export async function registerConversationRoutes(router: Router, storage: IStorage) {
  router.get("/wedding/:weddingId", async (req: Request, res: Response) => {
    try {
      const weddingId = req.params.weddingId;
      
      const [conversationIds, bookings, events] = await Promise.all([
        storage.getConversationsByWedding(weddingId),
        storage.getBookingsByWedding(weddingId),
        storage.getEventsByWedding(weddingId),
      ]);
      
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      const existingConversations = new Set<string>();
      
      const conversationsWithMetadata = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const vendor = await storage.getVendor(parsed.vendorId);
          const event = parsed.eventId ? eventMap.get(parsed.eventId) : null;
          
          const key = `${parsed.vendorId}:${parsed.eventId || 'general'}`;
          existingConversations.add(key);
          
          const parsedEventId = parsed.eventId || null;
          const booking = bookings.find(b => 
            b.vendorId === parsed.vendorId && 
            (b.eventId || null) === parsedEventId
          );
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            vendorCategory: vendor?.categories?.[0] || '',
            eventId: parsed.eventId,
            eventName: event?.name,
            bookingId: booking?.id,
            bookingStatus: booking?.status,
          };
        })
      );
      
      const syntheticConversations = await Promise.all(
        bookings
          .filter(booking => {
            const key = `${booking.vendorId}:${booking.eventId || 'general'}`;
            return !existingConversations.has(key);
          })
          .map(async (booking) => {
            const vendor = await storage.getVendor(booking.vendorId);
            const event = booking.eventId ? eventMap.get(booking.eventId) : null;
            const convId = generateConversationId(weddingId, booking.vendorId, booking.eventId || undefined);
            
            return {
              conversationId: convId,
              weddingId: weddingId,
              vendorId: booking.vendorId,
              vendorName: vendor?.name || 'Unknown Vendor',
              vendorCategory: vendor?.categories?.[0] || '',
              eventId: booking.eventId,
              eventName: event?.name,
              bookingId: booking.id,
              bookingStatus: booking.status,
            };
          })
      );
      
      const allConversations = [...conversationsWithMetadata.filter(Boolean), ...syntheticConversations];
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching wedding conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  router.get("/vendor/:vendorId", async (req: Request, res: Response) => {
    try {
      const conversationIds = await storage.getConversationsByVendor(req.params.vendorId);
      
      const conversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const parsed = parseConversationId(convId);
          if (!parsed) return null;
          
          const vendor = await storage.getVendor(req.params.vendorId);
          
          return {
            conversationId: convId,
            weddingId: parsed.weddingId,
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            vendorCategory: vendor?.categories?.[0] || '',
          };
        })
      );
      
      res.json(conversations.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  router.get("/:conversationId/status", async (req: Request, res: Response) => {
    try {
      const status = await storage.getConversationStatus(decodeURIComponent(req.params.conversationId));
      if (!status) {
        return res.json({ status: 'open' });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation status" });
    }
  });

  router.patch("/:conversationId/close", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const conversationId = decodeURIComponent(req.params.conversationId);
      const { reason } = req.body;
      
      const parsed = parseConversationId(conversationId);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const wedding = await storage.getWedding(parsed.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "You can only close inquiries for your own wedding" });
      }
      
      const status = await storage.closeConversation(
        conversationId,
        authReq.session.userId,
        'couple',
        reason
      );
      
      try {
        const vendor = await storage.getVendor(parsed.vendorId);
        const user = vendor?.userId ? await storage.getUser(vendor.userId) : null;
        
        if (user?.email && vendor) {
          const coupleName = wedding.partner1Name && wedding.partner2Name
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'A couple';
          
          const { sendInquiryClosedEmail } = await import("../email");
          await sendInquiryClosedEmail(
            user.email,
            vendor.name,
            coupleName,
            reason || undefined
          );
        }
      } catch (emailError) {
        console.error("Failed to send inquiry closed email:", emailError);
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error closing conversation:", error);
      res.status(500).json({ error: "Failed to close conversation" });
    }
  });
}
