import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rituals = await storage.getAllTraditionRituals();
    res.json(rituals);
  } catch (error) {
    console.error("Error fetching all rituals:", error);
    res.status(500).json({ message: "Failed to fetch rituals" });
  }
});

router.get("/tradition/:traditionSlug", async (req, res) => {
  try {
    const { traditionSlug } = req.params;
    const rituals = await storage.getTraditionRitualsByTraditionSlug(traditionSlug);
    res.json(rituals);
  } catch (error) {
    console.error("Error fetching rituals by tradition:", error);
    res.status(500).json({ message: "Failed to fetch rituals" });
  }
});

router.get("/ceremony-type/:ceremonyTypeId", async (req, res) => {
  try {
    const { ceremonyTypeId } = req.params;
    const rituals = await storage.getTraditionRitualsByCeremonyTypeId(ceremonyTypeId);
    res.json(rituals);
  } catch (error) {
    console.error("Error fetching rituals by ceremony type:", error);
    res.status(500).json({ message: "Failed to fetch rituals" });
  }
});

router.get("/slug/:slug", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ritual = await storage.getTraditionRitual(id);
    if (!ritual) {
      return res.status(404).json({ message: "Ritual not found" });
    }
    res.json(ritual);
  } catch (error) {
    console.error("Error fetching ritual:", error);
    res.status(500).json({ message: "Failed to fetch ritual" });
  }
});

export default router;
