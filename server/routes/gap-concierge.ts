import { Router } from "express";
import type { IStorage } from "../storage";
import { insertGapWindowSchema, insertGapRecommendationSchema } from "@shared/schema";

export function createGapWindowsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const gapWindows = await storage.getGapWindowsByWedding(weddingId);
      
      const gapsWithRecommendations = await Promise.all(
        gapWindows.map(async (gap) => {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          return { ...gap, recommendations };
        })
      );
      
      res.json(gapsWithRecommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const gap = await storage.getGapWindow(id);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      const recommendations = await storage.getRecommendationsByGapWindow(id);
      res.json({ ...gap, recommendations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const gapData = insertGapWindowSchema.parse(req.body);
      const gap = await storage.createGapWindow(gapData);
      res.status(201).json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertGapWindowSchema.partial().parse(req.body);
      const gap = await storage.updateGapWindow(id, updates);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGapWindow(id);
      if (!success) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.patch("/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const gap = await storage.activateGapWindow(id, isActive === true);
      if (!gap) {
        return res.status(404).json({ error: "Gap window not found" });
      }
      res.json(gap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/:gapWindowId/recommendations", async (req, res) => {
    try {
      const { gapWindowId } = req.params;
      const recommendations = await storage.getRecommendationsByGapWindow(gapWindowId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createGapRecommendationsRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const recData = insertGapRecommendationSchema.parse(req.body);
      const rec = await storage.createGapRecommendation(recData);
      res.status(201).json(rec);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertGapRecommendationSchema.partial().parse(req.body);
      const rec = await storage.updateGapRecommendation(id, updates);
      if (!rec) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.json(rec);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGapRecommendation(id);
      if (!success) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
