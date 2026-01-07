import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, AuthRequest } from "../auth-middleware";
import { insertVendorAccessPassSchema } from "@shared/schema";

export async function createVendorAccessPassesRouter(storage: IStorage): Promise<Router> {
  const router = Router();

  router.get("/wedding/:weddingId", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const weddingId = req.params.weddingId;

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const isOwner = wedding.userId === authReq.session.userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(weddingId, user.email) : false;

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const passes = await storage.getVendorAccessPassesByWedding(weddingId);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching vendor access passes:", error);
      res.status(500).json({ error: "Failed to fetch access passes" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const validatedData = insertVendorAccessPassSchema.parse(req.body);

      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const isOwner = wedding.userId === authReq.session.userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(validatedData.weddingId, user.email) : false;

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const vendor = await storage.getVendor(validatedData.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const pass = await storage.createVendorAccessPass(validatedData);
      res.status(201).json(pass);
    } catch (error) {
      console.error("Error creating vendor access pass:", error);
      res.status(500).json({ error: "Failed to create access pass" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const passId = req.params.id;

      const existingPass = await storage.getVendorAccessPass(passId);
      if (!existingPass) {
        return res.status(404).json({ error: "Access pass not found" });
      }

      const wedding = await storage.getWedding(existingPass.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const isOwner = wedding.userId === authReq.session.userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(existingPass.weddingId, user.email) : false;

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const partialSchema = insertVendorAccessPassSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      
      const updated = await storage.updateVendorAccessPass(passId, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor access pass:", error);
      res.status(500).json({ error: "Failed to update access pass" });
    }
  });

  router.post("/:id/revoke", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const passId = req.params.id;

      const existingPass = await storage.getVendorAccessPass(passId);
      if (!existingPass) {
        return res.status(404).json({ error: "Access pass not found" });
      }

      const wedding = await storage.getWedding(existingPass.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const isOwner = wedding.userId === authReq.session.userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(existingPass.weddingId, user.email) : false;

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const revoked = await storage.revokeVendorAccessPass(passId);
      res.json(revoked);
    } catch (error) {
      console.error("Error revoking vendor access pass:", error);
      res.status(500).json({ error: "Failed to revoke access pass" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const passId = req.params.id;

      const existingPass = await storage.getVendorAccessPass(passId);
      if (!existingPass) {
        return res.status(404).json({ error: "Access pass not found" });
      }

      const wedding = await storage.getWedding(existingPass.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = await storage.getUser(authReq.session.userId);
      const isOwner = wedding.userId === authReq.session.userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(existingPass.weddingId, user.email) : false;

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteVendorAccessPass(passId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor access pass:", error);
      res.status(500).json({ error: "Failed to delete access pass" });
    }
  });

  return router;
}

export function createVendorCollaborationViewRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:token", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;

      const pass = await storage.getVendorAccessPassByToken(token);
      if (!pass) {
        return res.status(404).json({ error: "Access pass not found" });
      }

      if (pass.status === "revoked") {
        return res.status(403).json({ error: "This access pass has been revoked" });
      }

      if (pass.status === "expired" || (pass.expiresAt && new Date(pass.expiresAt) < new Date())) {
        return res.status(403).json({ error: "This access pass has expired" });
      }

      await storage.recordVendorAccessPassUsage(token);

      const wedding = await storage.getWedding(pass.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const vendor = await storage.getVendor(pass.vendorId);
      const allEvents = await storage.getEventsByWedding(pass.weddingId);

      let filteredEvents = allEvents;
      if (pass.eventIds && pass.eventIds.length > 0) {
        filteredEvents = allEvents.filter(e => pass.eventIds!.includes(e.id));
      }

      const response: any = {
        pass: {
          id: pass.id,
          name: pass.name,
          timelineViewType: pass.timelineViewType,
          canViewGuestCount: pass.canViewGuestCount,
          canViewVendorDetails: pass.canViewVendorDetails,
        },
        wedding: {
          id: wedding.id,
          title: wedding.title,
          partner1Name: wedding.partner1Name,
          partner2Name: wedding.partner2Name,
          city: wedding.city,
        },
        vendor: vendor ? {
          id: vendor.id,
          name: vendor.name,
          categories: vendor.categories,
        } : null,
        events: filteredEvents.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          date: e.date,
          time: e.time,
          location: e.location,
          description: e.description,
          dressCode: e.dressCode,
          locationDetails: e.locationDetails,
          ...(pass.canViewGuestCount ? { guestCount: e.guestCount } : {}),
        })),
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching collaboration view:", error);
      res.status(500).json({ error: "Failed to load timeline" });
    }
  });

  return router;
}
