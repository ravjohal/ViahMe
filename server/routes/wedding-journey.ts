import { Router } from "express";
import { storage } from "../storage";
import type { TraditionRitual, WeddingJourneyItem } from "@shared/schema";

const router = Router();

router.get("/rituals", async (req, res) => {
  try {
    const rituals = await storage.getAllTraditionRituals();
    res.json(rituals);
  } catch (error) {
    console.error("Error fetching all rituals:", error);
    res.status(500).json({ message: "Failed to fetch rituals" });
  }
});

router.get("/rituals/tradition/:traditionSlug", async (req, res) => {
  try {
    const { traditionSlug } = req.params;
    const rituals = await storage.getTraditionRitualsByTraditionSlug(traditionSlug);
    res.json(rituals);
  } catch (error) {
    console.error("Error fetching rituals by tradition:", error);
    res.status(500).json({ message: "Failed to fetch rituals" });
  }
});

router.get("/rituals/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const ritual = await storage.getTraditionRitualBySlug(slug);
    if (!ritual) {
      return res.status(404).json({ message: "Ritual not found" });
    }
    res.json(ritual);
  } catch (error) {
    console.error("Error fetching ritual:", error);
    res.status(500).json({ message: "Failed to fetch ritual" });
  }
});

router.get("/wedding/:weddingId", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const journeyItems = await storage.getWeddingJourneyItemsByWedding(weddingId);
    res.json(journeyItems);
  } catch (error) {
    console.error("Error fetching wedding journey:", error);
    res.status(500).json({ message: "Failed to fetch wedding journey" });
  }
});

router.get("/wedding/:weddingId/with-rituals", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const wedding = await storage.getWedding(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: "Wedding not found" });
    }

    const journeyItems = await storage.getWeddingJourneyItemsByWedding(weddingId);
    const rituals = wedding.traditionId 
      ? await storage.getTraditionRitualsByTradition(wedding.traditionId)
      : [];

    const journeyWithRituals = journeyItems.map(item => {
      const ritual = rituals.find(r => r.id === item.ritualId);
      return { ...item, ritual };
    });

    const includedRitualIds = new Set(journeyItems.map(item => item.ritualId));
    const availableRituals = rituals.filter(r => !includedRitualIds.has(r.id));

    res.json({
      journeyItems: journeyWithRituals,
      availableRituals,
      allRituals: rituals
    });
  } catch (error) {
    console.error("Error fetching wedding journey with rituals:", error);
    res.status(500).json({ message: "Failed to fetch wedding journey" });
  }
});

router.post("/wedding/:weddingId/initialize", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const wedding = await storage.getWedding(weddingId);
    if (!wedding || !wedding.traditionId) {
      return res.status(400).json({ message: "Wedding not found or has no tradition set" });
    }

    const existingItems = await storage.getWeddingJourneyItemsByWedding(weddingId);
    if (existingItems.length > 0) {
      return res.status(400).json({ message: "Wedding journey already initialized" });
    }

    const items = await storage.initializeWeddingJourney(weddingId, wedding.traditionId);
    res.json(items);
  } catch (error) {
    console.error("Error initializing wedding journey:", error);
    res.status(500).json({ message: "Failed to initialize wedding journey" });
  }
});

router.post("/wedding/:weddingId/items", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const item = await storage.createWeddingJourneyItem({
      ...req.body,
      weddingId
    });
    res.json(item);
  } catch (error) {
    console.error("Error creating journey item:", error);
    res.status(500).json({ message: "Failed to create journey item" });
  }
});

router.patch("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await storage.updateWeddingJourneyItem(id, req.body);
    if (!item) {
      return res.status(404).json({ message: "Journey item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error updating journey item:", error);
    res.status(500).json({ message: "Failed to update journey item" });
  }
});

router.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteWeddingJourneyItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting journey item:", error);
    res.status(500).json({ message: "Failed to delete journey item" });
  }
});

export default router;
