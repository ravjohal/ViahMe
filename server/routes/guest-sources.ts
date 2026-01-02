import { Router } from "express";
import type { IStorage } from "../storage";
import { insertGuestSourceSchema } from "@shared/schema";

export function createGuestSourcesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/weddings/:weddingId/stats", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const stats = await storage.getGuestSourceStats(weddingId);
      const sources = await storage.getGuestSourcesByWedding(weddingId);
      
      const enrichedStats = stats.map(stat => {
        const source = sources.find(s => s.id === stat.sourceId);
        return {
          ...stat,
          source,
        };
      });
      
      res.json(enrichedStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { weddingId } = req.params;
      const validatedData = insertGuestSourceSchema.parse({
        ...req.body,
        weddingId,
      });
      const source = await storage.createGuestSource(validatedData);
      res.status(201).json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const source = await storage.updateGuestSource(req.params.id, req.body);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const deleted = await storage.deleteGuestSource(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
