import { Router } from "express";
import type { IStorage } from "../storage";

export async function registerWeddingTraditionsRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const traditions = await storage.getAllWeddingTraditions();
      res.json(traditions);
    } catch (error) {
      console.error("Failed to fetch wedding traditions:", error);
      res.status(500).json({ error: "Failed to fetch wedding traditions" });
    }
  });

  router.get("/hierarchy", async (req, res) => {
    try {
      const traditions = await storage.getAllWeddingTraditions();
      const subTraditions = await storage.getAllWeddingSubTraditions();

      const hierarchy = traditions.map(tradition => ({
        id: tradition.id,
        value: tradition.slug,
        label: tradition.displayName,
        description: tradition.description || "",
        subTraditions: subTraditions
          .filter(sub => sub.traditionId === tradition.id)
          .map(sub => ({
            id: sub.id,
            value: sub.slug,
            label: sub.displayName,
          })),
      }));

      res.json(hierarchy);
    } catch (error) {
      console.error("Failed to fetch tradition hierarchy:", error);
      res.status(500).json({ error: "Failed to fetch tradition hierarchy" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const tradition = await storage.getWeddingTradition(req.params.id);
      if (!tradition) {
        return res.status(404).json({ error: "Wedding tradition not found" });
      }
      res.json(tradition);
    } catch (error) {
      console.error("Failed to fetch wedding tradition:", error);
      res.status(500).json({ error: "Failed to fetch wedding tradition" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const tradition = await storage.getWeddingTraditionBySlug(req.params.slug);
      if (!tradition) {
        return res.status(404).json({ error: "Wedding tradition not found" });
      }
      res.json(tradition);
    } catch (error) {
      console.error("Failed to fetch wedding tradition by slug:", error);
      res.status(500).json({ error: "Failed to fetch wedding tradition" });
    }
  });

  router.get("/:id/sub-traditions", async (req, res) => {
    try {
      const subTraditions = await storage.getWeddingSubTraditionsByTradition(req.params.id);
      res.json(subTraditions);
    } catch (error) {
      console.error("Failed to fetch sub-traditions:", error);
      res.status(500).json({ error: "Failed to fetch sub-traditions" });
    }
  });
}
