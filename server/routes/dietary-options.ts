import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertDietaryOptionSchema } from "@shared/schema";

export async function registerDietaryOptionsRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const tradition = req.query.tradition as string | undefined;

      if (tradition) {
        const options = await storage.getDietaryOptionsByTradition(tradition);
        return res.json(options);
      }

      const options = activeOnly
        ? await storage.getActiveDietaryOptions()
        : await storage.getAllDietaryOptions();
      res.json(options);
    } catch (error) {
      console.error("Failed to fetch dietary options:", error);
      res.status(500).json({ error: "Failed to fetch dietary options" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const option = await storage.getDietaryOptionBySlug(req.params.slug);
      if (!option) {
        return res.status(404).json({ error: "Dietary option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to fetch dietary option by slug:", error);
      res.status(500).json({ error: "Failed to fetch dietary option" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const option = await storage.getDietaryOption(req.params.id);
      if (!option) {
        return res.status(404).json({ error: "Dietary option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to fetch dietary option:", error);
      res.status(500).json({ error: "Failed to fetch dietary option" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertDietaryOptionSchema.parse(req.body);
      const option = await storage.createDietaryOption(validatedData);
      res.status(201).json(option);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create dietary option:", error);
      res.status(500).json({ error: "Failed to create dietary option" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const option = await storage.updateDietaryOption(req.params.id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Dietary option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to update dietary option:", error);
      res.status(500).json({ error: "Failed to update dietary option" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const option = await storage.getDietaryOption(req.params.id);
      if (!option) {
        return res.status(404).json({ error: "Dietary option not found" });
      }

      if (option.isSystemOption) {
        return res.status(403).json({ error: "Cannot delete system options" });
      }

      await storage.deleteDietaryOption(req.params.id);
      res.json({ message: "Dietary option deleted successfully" });
    } catch (error) {
      console.error("Failed to delete dietary option:", error);
      res.status(500).json({ error: "Failed to delete dietary option" });
    }
  });
}
