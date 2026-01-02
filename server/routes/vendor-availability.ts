import { Router } from "express";
import type { IStorage } from "../storage";
import { insertVendorAvailabilitySchema } from "@shared/schema";

export function createVendorAvailabilityRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const availability = await storage.getAvailabilityByVendor(req.params.vendorId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor availability" });
    }
  });

  router.get("/vendor/:vendorId/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      const availability = await storage.getAvailabilityByVendorAndDateRange(
        req.params.vendorId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability by date range" });
    }
  });

  router.get("/vendor/:vendorId/date/:date", async (req, res) => {
    try {
      const availability = await storage.getAvailabilityByDate(
        req.params.vendorId,
        new Date(req.params.date)
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability for date" });
    }
  });

  router.post("/check-conflicts", async (req, res) => {
    try {
      const { vendorId, date, timeSlot, excludeBookingId } = req.body;
      if (!vendorId || !date || !timeSlot) {
        return res.status(400).json({ error: "vendorId, date, and timeSlot are required" });
      }
      const hasConflicts = await storage.checkAvailabilityConflicts(
        vendorId,
        new Date(date),
        timeSlot,
        excludeBookingId
      );
      res.json({ hasConflicts });
    } catch (error) {
      res.status(500).json({ error: "Failed to check conflicts" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const availability = await storage.getVendorAvailability(req.params.id);
      if (!availability) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability slot" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertVendorAvailabilitySchema.parse(req.body);
      
      const hasConflicts = await storage.checkAvailabilityConflicts(
        validatedData.vendorId,
        new Date(validatedData.date),
        validatedData.timeSlot || 'full_day',
        undefined
      );
      
      if (hasConflicts) {
        return res.status(409).json({ error: "Vendor is already booked for this time slot" });
      }
      
      const availability = await storage.createVendorAvailability(validatedData);
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create availability slot" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const validatedData = insertVendorAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateVendorAvailability(req.params.id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update availability slot" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteVendorAvailability(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Availability slot not found" });
      }
      res.json({ message: "Availability slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete availability slot" });
    }
  });

  return router;
}
