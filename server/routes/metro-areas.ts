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

  // POST /api/metro-areas/ensure - Check if city exists, create if not
  router.post("/ensure", async (req, res) => {
    try {
      const { cityName } = req.body;
      if (!cityName || typeof cityName !== 'string' || !cityName.trim()) {
        return res.status(400).json({ error: "City name is required" });
      }
      
      const trimmedName = cityName.trim();
      
      // Check if metro area already exists by value (case-insensitive search)
      const allAreas = await storage.getAllMetroAreas();
      const existingArea = allAreas.find(
        area => area.value.toLowerCase() === trimmedName.toLowerCase() ||
                area.label.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (existingArea) {
        return res.json({ metroArea: existingArea, created: false });
      }
      
      // Create a new metro area
      const slug = createSlugFromName(trimmedName);
      const newArea = await storage.createMetroArea({
        slug,
        value: trimmedName,
        label: trimmedName,
        isActive: true,
        displayOrder: 999, // Put at the end
      });
      
      res.json({ metroArea: newArea, created: true });
    } catch (error) {
      console.error("Error ensuring metro area:", error);
      res.status(500).json({ error: "Failed to ensure metro area" });
    }
  });

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
