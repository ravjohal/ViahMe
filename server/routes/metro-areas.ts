import { Router } from "express";
import { type IStorage } from "../storage";

// Helper function to create a slug from a city name
function createSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}

export function registerMetroAreasRoutes(app: Router, storage: IStorage) {
  const router = Router();

  // GET /api/metro-areas - Get all active metro areas (public)
  router.get("/", async (_req, res) => {
    try {
      const metroAreas = await storage.getActiveMetroAreas();
      res.json(metroAreas);
    } catch (error) {
      console.error("Error fetching metro areas:", error);
      res.status(500).json({ error: "Failed to fetch metro areas" });
    }
  });

  // GET /api/metro-areas/all - Get all metro areas including inactive (admin)
  router.get("/all", async (_req, res) => {
    try {
      const metroAreas = await storage.getAllMetroAreas();
      res.json(metroAreas);
    } catch (error) {
      console.error("Error fetching all metro areas:", error);
      res.status(500).json({ error: "Failed to fetch metro areas" });
    }
  });

  // GET /api/metro-areas/:id - Get a single metro area by ID
  router.get("/:id", async (req, res) => {
    try {
      const metroArea = await storage.getMetroArea(req.params.id);
      if (!metroArea) {
        return res.status(404).json({ error: "Metro area not found" });
      }
      res.json(metroArea);
    } catch (error) {
      console.error("Error fetching metro area:", error);
      res.status(500).json({ error: "Failed to fetch metro area" });
    }
  });

  app.use("/api/metro-areas", router);
}
