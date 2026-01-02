import { Router } from "express";
import type { IStorage } from "../storage";
import { insertEventSchema, insertEventCostItemSchema } from "@shared/schema";

export async function registerEventRoutes(router: Router, storage: IStorage) {
  // ============================================================================
  // EVENTS
  // ============================================================================

  router.get("/:weddingId", async (req, res) => {
    try {
      const events = await storage.getEventsByWedding(req.params.weddingId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  router.get("/by-id/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }
      const event = await storage.updateEvent(req.params.id, updateData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event", details: error instanceof Error ? error.message : String(error) });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ============================================================================
  // EVENT COST ITEMS
  // ============================================================================

  router.get("/:eventId/cost-items", async (req, res) => {
    try {
      const costItems = await storage.getEventCostItemsByEvent(req.params.eventId);
      res.json(costItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event cost items" });
    }
  });

  router.post("/:eventId/cost-items", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const validatedData = insertEventCostItemSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const costItem = await storage.createEventCostItem(validatedData);
      res.json(costItem);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create event cost item" });
    }
  });
}

export async function registerEventCostItemRoutes(router: Router, storage: IStorage) {
  router.patch("/:id", async (req, res) => {
    try {
      const costItem = await storage.updateEventCostItem(req.params.id, req.body);
      if (!costItem) {
        return res.status(404).json({ error: "Event cost item not found" });
      }
      res.json(costItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event cost item" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteEventCostItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event cost item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event cost item" });
    }
  });
}

export async function registerWeddingCostSummaryRoute(router: Router, storage: IStorage) {
  router.get("/:weddingId/cost-summary", async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      const events = await storage.getEventsByWedding(weddingId);
      
      const allCostItems: Array<{ eventId: string; eventName: string; categoryId: string | null; name: string; costType: string; amount: string; guestCount: number | null }> = [];
      
      for (const event of events) {
        const costItems = await storage.getEventCostItemsByEvent(event.id);
        costItems.forEach(item => {
          allCostItems.push({
            eventId: event.id,
            eventName: event.name,
            categoryId: item.categoryId,
            name: item.name,
            costType: item.costType,
            amount: item.amount,
            guestCount: event.guestCount,
          });
        });
      }
      
      const categoryTotals: Record<string, { fixed: number; perHead: number; total: number; items: typeof allCostItems }> = {};
      let grandTotalFixed = 0;
      let grandTotalPerHead = 0;
      
      for (const item of allCostItems) {
        const catId = item.categoryId || 'uncategorized';
        if (!categoryTotals[catId]) {
          categoryTotals[catId] = { fixed: 0, perHead: 0, total: 0, items: [] };
        }
        
        const amount = parseFloat(item.amount) || 0;
        if (item.costType === 'fixed') {
          categoryTotals[catId].fixed += amount;
          grandTotalFixed += amount;
        } else {
          const guestCount = item.guestCount || 0;
          const totalCost = amount * guestCount;
          categoryTotals[catId].perHead += totalCost;
          grandTotalPerHead += totalCost;
        }
        categoryTotals[catId].items.push(item);
      }
      
      Object.keys(categoryTotals).forEach(catId => {
        categoryTotals[catId].total = categoryTotals[catId].fixed + categoryTotals[catId].perHead;
      });
      
      res.json({
        categories: categoryTotals,
        grandTotal: grandTotalFixed + grandTotalPerHead,
        grandTotalFixed,
        grandTotalPerHead,
        eventCount: events.length,
        itemCount: allCostItems.length,
      });
    } catch (error) {
      console.error("Error fetching cost summary:", error);
      res.status(500).json({ error: "Failed to fetch cost summary" });
    }
  });
}
