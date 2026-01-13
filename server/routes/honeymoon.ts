import { Router } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import {
  insertHoneymoonFlightSchema,
  insertHoneymoonHotelSchema,
  insertHoneymoonActivitySchema,
  insertHoneymoonBudgetItemSchema,
} from "@shared/schema";

async function ensureCoupleAccess(storage: IStorage, userId: string, weddingId: string): Promise<boolean> {
  const wedding = await storage.getWedding(weddingId);
  if (!wedding) return false;
  
  if (wedding.coupleUserId === userId || wedding.partnerUserId === userId) {
    return true;
  }
  
  const collaborator = await storage.getWeddingCollaborator(weddingId, userId);
  if (collaborator && collaborator.status === 'accepted') {
    const role = await storage.getWeddingRole(collaborator.roleId);
    if (role) {
      const permissions = await storage.getRolePermissions(role.id);
      const hasPermission = permissions.some(p => 
        (p.category === 'planning' || p.category === 'all') && 
        (p.level === 'edit' || p.level === 'full')
      );
      if (hasPermission) return true;
    }
  }
  
  return false;
}

export async function createHoneymoonRouter(storage: IStorage): Promise<Router> {
  const router = Router();

  // ============================================================================
  // FLIGHTS
  // ============================================================================

  router.get("/honeymoon/flights/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const flights = await storage.getHoneymoonFlightsByWedding(weddingId);
      res.json(flights);
    } catch (error) {
      console.error("Failed to get honeymoon flights:", error);
      res.status(500).json({ error: "Failed to get honeymoon flights" });
    }
  });

  router.post("/honeymoon/flights", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertHoneymoonFlightSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const flight = await storage.createHoneymoonFlight(validatedData);
      res.status(201).json(flight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create honeymoon flight:", error);
      res.status(500).json({ error: "Failed to create honeymoon flight" });
    }
  });

  router.patch("/honeymoon/flights/:flightId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { flightId } = req.params;
      const flight = await storage.getHoneymoonFlight(flightId);
      
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, flight.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertHoneymoonFlightSchema
        .pick({
          airline: true,
          flightNumber: true,
          departureAirport: true,
          arrivalAirport: true,
          departureDate: true,
          departureTime: true,
          arrivalDate: true,
          arrivalTime: true,
          confirmationNumber: true,
          cost: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedFlight = await storage.updateHoneymoonFlight(flightId, validatedData);
      res.json(updatedFlight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update honeymoon flight:", error);
      res.status(500).json({ error: "Failed to update honeymoon flight" });
    }
  });

  router.delete("/honeymoon/flights/:flightId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { flightId } = req.params;
      const flight = await storage.getHoneymoonFlight(flightId);
      
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, flight.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHoneymoonFlight(flightId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete honeymoon flight:", error);
      res.status(500).json({ error: "Failed to delete honeymoon flight" });
    }
  });

  // ============================================================================
  // HOTELS
  // ============================================================================

  router.get("/honeymoon/hotels/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const hotels = await storage.getHoneymoonHotelsByWedding(weddingId);
      res.json(hotels);
    } catch (error) {
      console.error("Failed to get honeymoon hotels:", error);
      res.status(500).json({ error: "Failed to get honeymoon hotels" });
    }
  });

  router.post("/honeymoon/hotels", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertHoneymoonHotelSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const hotel = await storage.createHoneymoonHotel(validatedData);
      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create honeymoon hotel:", error);
      res.status(500).json({ error: "Failed to create honeymoon hotel" });
    }
  });

  router.patch("/honeymoon/hotels/:hotelId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { hotelId } = req.params;
      const hotel = await storage.getHoneymoonHotel(hotelId);
      
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, hotel.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertHoneymoonHotelSchema
        .pick({
          name: true,
          address: true,
          city: true,
          country: true,
          checkInDate: true,
          checkOutDate: true,
          confirmationNumber: true,
          costPerNight: true,
          totalCost: true,
          roomType: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedHotel = await storage.updateHoneymoonHotel(hotelId, validatedData);
      res.json(updatedHotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update honeymoon hotel:", error);
      res.status(500).json({ error: "Failed to update honeymoon hotel" });
    }
  });

  router.delete("/honeymoon/hotels/:hotelId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { hotelId } = req.params;
      const hotel = await storage.getHoneymoonHotel(hotelId);
      
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, hotel.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHoneymoonHotel(hotelId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete honeymoon hotel:", error);
      res.status(500).json({ error: "Failed to delete honeymoon hotel" });
    }
  });

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  router.get("/honeymoon/activities/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const activities = await storage.getHoneymoonActivitiesByWedding(weddingId);
      res.json(activities);
    } catch (error) {
      console.error("Failed to get honeymoon activities:", error);
      res.status(500).json({ error: "Failed to get honeymoon activities" });
    }
  });

  router.post("/honeymoon/activities", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertHoneymoonActivitySchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const activity = await storage.createHoneymoonActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create honeymoon activity:", error);
      res.status(500).json({ error: "Failed to create honeymoon activity" });
    }
  });

  router.patch("/honeymoon/activities/:activityId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { activityId } = req.params;
      const activity = await storage.getHoneymoonActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, activity.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertHoneymoonActivitySchema
        .pick({
          name: true,
          description: true,
          location: true,
          date: true,
          time: true,
          duration: true,
          cost: true,
          confirmationNumber: true,
          completed: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedActivity = await storage.updateHoneymoonActivity(activityId, validatedData);
      res.json(updatedActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update honeymoon activity:", error);
      res.status(500).json({ error: "Failed to update honeymoon activity" });
    }
  });

  router.post("/honeymoon/activities/:activityId/toggle-completed", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { activityId } = req.params;
      const activity = await storage.getHoneymoonActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, activity.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedActivity = await storage.toggleHoneymoonActivityCompleted(activityId);
      res.json(updatedActivity);
    } catch (error) {
      console.error("Failed to toggle honeymoon activity completed:", error);
      res.status(500).json({ error: "Failed to toggle activity completed" });
    }
  });

  router.delete("/honeymoon/activities/:activityId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { activityId } = req.params;
      const activity = await storage.getHoneymoonActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, activity.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHoneymoonActivity(activityId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete honeymoon activity:", error);
      res.status(500).json({ error: "Failed to delete honeymoon activity" });
    }
  });

  // ============================================================================
  // BUDGET
  // ============================================================================

  router.get("/honeymoon/budget/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const budgetItems = await storage.getHoneymoonBudgetItemsByWedding(weddingId);
      res.json(budgetItems);
    } catch (error) {
      console.error("Failed to get honeymoon budget items:", error);
      res.status(500).json({ error: "Failed to get honeymoon budget items" });
    }
  });

  router.post("/honeymoon/budget", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertHoneymoonBudgetItemSchema.parse(req.body);
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, validatedData.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const budgetItem = await storage.createHoneymoonBudgetItem(validatedData);
      res.status(201).json(budgetItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create honeymoon budget item:", error);
      res.status(500).json({ error: "Failed to create honeymoon budget item" });
    }
  });

  router.patch("/honeymoon/budget/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getHoneymoonBudgetItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Budget item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateSchema = insertHoneymoonBudgetItemSchema
        .pick({
          name: true,
          category: true,
          estimatedCost: true,
          actualCost: true,
          isPaid: true,
          dueDate: true,
          notes: true,
        })
        .partial()
        .strict();

      const validatedData = updateSchema.parse(req.body);
      const updatedItem = await storage.updateHoneymoonBudgetItem(itemId, validatedData);
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update honeymoon budget item:", error);
      res.status(500).json({ error: "Failed to update honeymoon budget item" });
    }
  });

  router.post("/honeymoon/budget/:itemId/toggle-paid", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getHoneymoonBudgetItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Budget item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedItem = await storage.toggleHoneymoonBudgetItemPaid(itemId);
      res.json(updatedItem);
    } catch (error) {
      console.error("Failed to toggle honeymoon budget item paid:", error);
      res.status(500).json({ error: "Failed to toggle budget item paid" });
    }
  });

  router.delete("/honeymoon/budget/:itemId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { itemId } = req.params;
      const item = await storage.getHoneymoonBudgetItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Budget item not found" });
      }

      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, item.weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHoneymoonBudgetItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete honeymoon budget item:", error);
      res.status(500).json({ error: "Failed to delete honeymoon budget item" });
    }
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================

  router.get("/honeymoon/summary/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const hasAccess = await ensureCoupleAccess(storage, authReq.session.userId, weddingId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [flights, hotels, activities, budgetItems] = await Promise.all([
        storage.getHoneymoonFlightsByWedding(weddingId),
        storage.getHoneymoonHotelsByWedding(weddingId),
        storage.getHoneymoonActivitiesByWedding(weddingId),
        storage.getHoneymoonBudgetItemsByWedding(weddingId),
      ]);

      const flightCost = flights.reduce((sum, f) => sum + Number(f.cost || 0), 0);
      const hotelCost = hotels.reduce((sum, h) => sum + Number(h.totalCost || 0), 0);
      const activityCost = activities.reduce((sum, a) => sum + Number(a.cost || 0), 0);
      const budgetEstimated = budgetItems.reduce((sum, b) => sum + Number(b.estimatedCost || 0), 0);
      const budgetActual = budgetItems.reduce((sum, b) => sum + Number(b.actualCost || 0), 0);
      const budgetPaid = budgetItems.filter(b => b.isPaid).reduce((sum, b) => sum + Number(b.actualCost || 0), 0);

      res.json({
        flights: {
          count: flights.length,
          totalCost: flightCost,
        },
        hotels: {
          count: hotels.length,
          totalCost: hotelCost,
        },
        activities: {
          total: activities.length,
          completed: activities.filter(a => a.completed).length,
          totalCost: activityCost,
        },
        budget: {
          itemCount: budgetItems.length,
          estimated: budgetEstimated,
          actual: budgetActual,
          paid: budgetPaid,
          remaining: budgetActual - budgetPaid,
        },
        totalCost: flightCost + hotelCost + activityCost + budgetActual,
      });
    } catch (error) {
      console.error("Failed to get honeymoon summary:", error);
      res.status(500).json({ error: "Failed to get honeymoon summary" });
    }
  });

  return router;
}
