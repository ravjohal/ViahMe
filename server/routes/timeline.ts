import { Router } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";

export function createTimelineRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:weddingId/timeline", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const timeline = await storage.getTimelineWithAcknowledgments(weddingId);
      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.patch("/:weddingId/timeline/reorder", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const { orderedEventIds } = req.body;

      const reorderSchema = z.object({
        orderedEventIds: z.array(z.string().uuid()).min(1),
      });

      const validationResult = reorderSchema.safeParse({ orderedEventIds });
      if (!validationResult.success) {
        return res.status(400).json({ error: "orderedEventIds must be an array of valid UUIDs" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const events = await storage.reorderEvents(weddingId, orderedEventIds, userId);
      
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: 'timeline_reordered',
          events: events.map(e => ({ id: e.id, order: e.order })),
        });
      }

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/timeline-changes", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const changes = await storage.getRecentTimelineChanges(weddingId, limit);
      res.json(changes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/booked-vendors", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const bookings = await storage.getBookingsWithVendorsByWedding(weddingId);
      const bookedVendors = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'pending')
        .map(b => ({
          id: b.vendor.id,
          name: b.vendor.name,
          categories: b.vendor.categories,
          email: b.vendor.email,
          phone: b.vendor.phone,
        }));
      
      res.json(bookedVendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createEventTimeRouter(storage: IStorage): Router {
  const router = Router();

  router.patch("/:eventId/time", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { newTime, note } = req.body;

      const timeChangeSchema = z.object({
        newTime: z.string().min(1, "newTime is required"),
        note: z.string().optional(),
      });

      const validationResult = timeChangeSchema.safeParse({ newTime, note });
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const result = await storage.updateEventTime(eventId, newTime, userId, note);

      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(event.weddingId, {
          type: 'timeline_updated',
          eventId,
          eventName: result.event.name,
          oldTime: result.change.oldValue,
          newTime: result.change.newValue,
          changeId: result.change.id,
          note: result.change.note,
        });
      }

      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || wedding.partner2Name || 'The Couple';
      const weddingTitle = wedding.title || 'Your Wedding';

      const notificationPromises: Promise<void>[] = [];

      result.taggedVendors
        .filter(v => v.email)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeEmail } = await import('../email');
              const baseUrl = process.env.REPL_SLUG 
                ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co`
                : 'http://localhost:5000';
              
              await sendTimelineChangeEmail({
                to: vendor.email!,
                vendorName: vendor.name,
                eventName: result.event.name,
                eventDate: result.event.date || undefined,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
                acknowledgeUrl: `${baseUrl}/vendor-dashboard?ack=${result.change.id}`,
              });
              console.log(`Sent timeline change email to ${vendor.email}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${vendor.email}:`, emailError);
            }
          })());
        });

      result.taggedVendors
        .filter(v => v.phone)
        .forEach((vendor) => {
          notificationPromises.push((async () => {
            try {
              const { sendTimelineChangeSMS } = await import('../twilio');
              await sendTimelineChangeSMS({
                vendorPhone: vendor.phone!,
                vendorName: vendor.name,
                eventName: result.event.name,
                oldTime: result.change.oldValue || '',
                newTime: result.change.newValue,
                weddingTitle,
                coupleName,
                note: note || undefined,
              });
              console.log(`Sent timeline change SMS to ${vendor.phone}`);
            } catch (smsError) {
              console.error(`Failed to send SMS to ${vendor.phone}:`, smsError);
            }
          })());
        });

      Promise.all(notificationPromises).then(() => {
        storage.markNotificationsSent(result.change.id);
      });

      res.json({
        event: result.event,
        change: result.change,
        taggedVendors: result.taggedVendors.map(v => ({ id: v.id, name: v.name, email: v.email })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      const { vendorIds, notifyVia } = req.body;

      if (!vendorIds || !Array.isArray(vendorIds)) {
        return res.status(400).json({ error: "vendorIds array is required" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const wedding = await storage.getWedding(event.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, event.weddingId);
        if (!permissions.isOwner && !permissions.permissions.has('timeline')) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const tags = await storage.tagVendorsToEvent(eventId, event.weddingId, vendorIds, notifyVia || 'email');
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:eventId/tags", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { eventId } = req.params;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(eventId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createTimelineChangesRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/:changeId/acknowledge", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;
      const { status, message } = req.body;

      if (!status || !['acknowledged', 'declined'].includes(status)) {
        return res.status(400).json({ error: "status must be 'acknowledged' or 'declined'" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can acknowledge timeline changes" });
      }

      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      const tags = await storage.getVendorEventTagsByEvent(change.eventId);
      const isTagged = tags.some(t => t.vendorId === vendor.id);
      if (!isTagged) {
        return res.status(403).json({ error: "You are not tagged to this event" });
      }

      const ack = await storage.acknowledgeChange(changeId, vendor.id, status, message);

      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(change.weddingId, {
          type: 'vendor_ack',
          eventId: change.eventId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          changeId,
          status,
          acknowledgedAt: ack.acknowledgedAt,
        });
      }

      res.json(ack);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:changeId/acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { changeId } = req.params;

      const change = await storage.getTimelineChange(changeId);
      if (!change) {
        return res.status(404).json({ error: "Timeline change not found" });
      }

      const wedding = await storage.getWedding(change.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== userId) {
        const permissions = await storage.getUserPermissionsForWedding(userId, change.weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const acks = await storage.getAcknowledgmentsByChange(changeId);
      res.json(acks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createVendorAcknowledgmentsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/pending-acknowledgments", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can access this endpoint" });
      }

      const allVendors = await storage.getAllVendors();
      const vendor = allVendors.find(v => v.userId === userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      const pendingAcks = await storage.getPendingAcknowledgmentsForVendor(vendor.id);
      res.json(pendingAcks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
