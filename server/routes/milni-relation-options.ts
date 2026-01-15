import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertMilniRelationOptionSchema } from "@shared/schema";

export async function registerMilniRelationOptionsRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const tradition = req.query.tradition as string | undefined;

      if (tradition) {
        const options = await storage.getMilniRelationOptionsByTradition(tradition);
        return res.json(options);
      }

      const options = activeOnly
        ? await storage.getActiveMilniRelationOptions()
        : await storage.getAllMilniRelationOptions();
      res.json(options);
    } catch (error) {
      console.error("Failed to fetch milni relation options:", error);
      res.status(500).json({ error: "Failed to fetch milni relation options" });
    }
  });

  router.get("/slug/:slug", async (req, res) => {
    try {
      const option = await storage.getMilniRelationOptionBySlug(req.params.slug);
      if (!option) {
        return res.status(404).json({ error: "Milni relation option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to fetch milni relation option by slug:", error);
      res.status(500).json({ error: "Failed to fetch milni relation option" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const option = await storage.getMilniRelationOption(req.params.id);
      if (!option) {
        return res.status(404).json({ error: "Milni relation option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to fetch milni relation option:", error);
      res.status(500).json({ error: "Failed to fetch milni relation option" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertMilniRelationOptionSchema.parse(req.body);
      const option = await storage.createMilniRelationOption(validatedData);
      res.status(201).json(option);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("Failed to create milni relation option:", error);
      res.status(500).json({ error: "Failed to create milni relation option" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const option = await storage.updateMilniRelationOption(req.params.id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Milni relation option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Failed to update milni relation option:", error);
      res.status(500).json({ error: "Failed to update milni relation option" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const user = await storage.getUser(authReq.session.userId!);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const option = await storage.getMilniRelationOption(req.params.id);
      if (!option) {
        return res.status(404).json({ error: "Milni relation option not found" });
      }

      if (option.isSystemOption) {
        return res.status(403).json({ error: "Cannot delete system options" });
      }

      await storage.deleteMilniRelationOption(req.params.id);
      res.json({ message: "Milni relation option deleted successfully" });
    } catch (error) {
      console.error("Failed to delete milni relation option:", error);
      res.status(500).json({ error: "Failed to delete milni relation option" });
    }
  });
}
