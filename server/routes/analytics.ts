import { Router } from "express";
import type { IStorage } from "../storage";

export function createAnalyticsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/vendor/:vendorId/summary", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const summary = await storage.getVendorAnalyticsSummary(vendorId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching vendor analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch vendor analytics" });
    }
  });

  router.get("/vendor/:vendorId/booking-trends", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      const trends = await storage.getVendorBookingTrends(
        vendorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(trends);
    } catch (error) {
      console.error("Error fetching vendor booking trends:", error);
      res.status(500).json({ error: "Failed to fetch booking trends" });
    }
  });

  router.get("/vendor/:vendorId/revenue-trends", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      const trends = await storage.getVendorRevenueTrends(
        vendorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(trends);
    } catch (error) {
      console.error("Error fetching vendor revenue trends:", error);
      res.status(500).json({ error: "Failed to fetch revenue trends" });
    }
  });

  router.get("/wedding/:weddingId/summary", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const summary = await storage.getWeddingAnalyticsSummary(weddingId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching wedding analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch wedding analytics" });
    }
  });

  router.get("/wedding/:weddingId/budget-breakdown", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const breakdown = await storage.getWeddingBudgetBreakdown(weddingId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching wedding budget breakdown:", error);
      res.status(500).json({ error: "Failed to fetch budget breakdown" });
    }
  });

  router.get("/wedding/:weddingId/spending-trends", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const trends = await storage.getWeddingSpendingTrends(weddingId);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching wedding spending trends:", error);
      res.status(500).json({ error: "Failed to fetch spending trends" });
    }
  });

  return router;
}
