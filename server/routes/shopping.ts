import { Router } from "express";
import type { IStorage } from "../storage";
import { insertMeasurementProfileSchema, insertShoppingOrderItemSchema } from "@shared/schema";

export function createMeasurementProfilesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/guests/:guestId", async (req, res) => {
    const { guestId } = req.params;
    const profile = await storage.getMeasurementProfileByGuest(guestId);
    res.json(profile || null);
  });

  router.post("/", async (req, res) => {
    try {
      const profileData = insertMeasurementProfileSchema.parse(req.body);
      const profile = await storage.createMeasurementProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const updates = insertMeasurementProfileSchema.partial().parse(req.body);
      const profile = await storage.updateMeasurementProfile(id, updates);
      if (!profile) {
        return res.status(404).json({ error: "Measurement profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteMeasurementProfile(id);
    if (!success) {
      return res.status(404).json({ error: "Measurement profile not found" });
    }
    res.status(204).send();
  });

  return router;
}

export function createShoppingItemsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const items = await storage.getShoppingOrderItemsByWedding(weddingId);
    res.json(items);
  });

  router.post("/", async (req, res) => {
    try {
      const itemData = insertShoppingOrderItemSchema.parse(req.body);
      const item = await storage.createShoppingOrderItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const updates = insertShoppingOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateShoppingOrderItem(id, updates);
      if (!item) {
        return res.status(404).json({ error: "Shopping item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteShoppingOrderItem(id);
    if (!success) {
      return res.status(404).json({ error: "Shopping item not found" });
    }
    res.status(204).send();
  });

  return router;
}
