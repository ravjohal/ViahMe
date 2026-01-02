import { Router } from "express";
import type { IStorage } from "../storage";
import { insertRitualStageSchema, insertRitualStageUpdateSchema, insertGuestNotificationSchema, insertLiveWeddingStatusSchema } from "@shared/schema";

interface ViewerUtils {
  activeViewers: Map<string, { viewerId: string; weddingId: string; lastHeartbeat: number }>;
  getViewerCount: (weddingId: string) => number;
}

export function createRitualStagesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/events/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      const stages = await storage.getRitualStagesByEvent(eventId);
      
      const stagesWithStatus = await Promise.all(
        stages.map(async (stage) => {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          return { 
            ...stage, 
            currentStatus: latestUpdate?.status || 'pending',
            lastMessage: latestUpdate?.message,
            delayMinutes: latestUpdate?.delayMinutes || 0
          };
        })
      );
      
      res.json(stagesWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await storage.getRitualStage(id);
      if (!stage) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      const updates = await storage.getRitualStageUpdates(id);
      res.json({ ...stage, updates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const stageData = insertRitualStageSchema.parse(req.body);
      const stage = await storage.createRitualStage(stageData);
      res.status(201).json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertRitualStageSchema.partial().parse(req.body);
      const stage = await storage.updateRitualStage(id, updates);
      if (!stage) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRitualStage(id);
      if (!success) {
        return res.status(404).json({ error: "Ritual stage not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id/updates", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getRitualStageUpdates(id);
      res.json(updates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createRitualStageUpdatesRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const updateData = insertRitualStageUpdateSchema.parse(req.body);
      const update = await storage.createRitualStageUpdate(updateData);
      res.status(201).json(update);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export function createGuestNotificationsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const notifications = await storage.getNotificationsByWedding(weddingId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const notificationData = insertGuestNotificationSchema.parse(req.body);
      const notification = await storage.createGuestNotification(notificationData);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export function createLiveWeddingRouter(storage: IStorage, viewerUtils: ViewerUtils): Router {
  const router = Router();
  const { activeViewers, getViewerCount } = viewerUtils;

  router.get("/:weddingId/live-status", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const status = await storage.getLiveWeddingStatus(weddingId);
      const viewerCount = getViewerCount(weddingId);
      
      if (!status) {
        return res.json({
          weddingId,
          isLive: false,
          currentEventId: null,
          currentStageId: null,
          currentGapId: null,
          lastBroadcastMessage: null,
          lastUpdatedAt: new Date(),
          viewerCount
        });
      }
      
      let enrichedStatus: any = { ...status, viewerCount };
      
      if (status.currentEventId) {
        const event = await storage.getEvent(status.currentEventId);
        enrichedStatus.currentEvent = event;
      }
      
      if (status.currentStageId) {
        const stage = await storage.getRitualStage(status.currentStageId);
        if (stage) {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          enrichedStatus.currentStage = {
            ...stage,
            currentStatus: latestUpdate?.status || 'pending',
            lastMessage: latestUpdate?.message,
            delayMinutes: latestUpdate?.delayMinutes || 0
          };
        }
      }
      
      if (status.currentGapId) {
        const gap = await storage.getGapWindow(status.currentGapId);
        if (gap) {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          enrichedStatus.currentGap = { ...gap, recommendations };
        }
      }
      
      res.json(enrichedStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.patch("/:weddingId/live-status", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const statusData = insertLiveWeddingStatusSchema.partial().parse(req.body);
      
      const status = await storage.createOrUpdateLiveWeddingStatus({
        weddingId,
        ...statusData
      });
      
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: 'status_update',
          data: status
        });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/:weddingId/go-live", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const { isLive, currentEventId, lastBroadcastMessage } = req.body;
      
      const status = await storage.createOrUpdateLiveWeddingStatus({
        weddingId,
        isLive: isLive === true,
        currentEventId: currentEventId || null,
        lastBroadcastMessage: lastBroadcastMessage || (isLive ? "Wedding is now live!" : "Wedding broadcast has ended.")
      });
      
      if ((global as any).broadcastToWedding) {
        (global as any).broadcastToWedding(weddingId, {
          type: isLive ? 'went_live' : 'went_offline',
          data: status
        });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export function createPublicLiveRouter(storage: IStorage, viewerUtils: ViewerUtils): Router {
  const router = Router();
  const { activeViewers, getViewerCount } = viewerUtils;

  router.post("/:weddingId/viewer-heartbeat", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const viewerId = req.body.viewerId || req.headers['x-viewer-id'] as string;
      
      if (!viewerId) {
        return res.status(400).json({ error: "viewerId is required" });
      }
      
      activeViewers.set(viewerId, {
        viewerId,
        weddingId,
        lastHeartbeat: Date.now()
      });
      
      const viewerCount = getViewerCount(weddingId);
      res.json({ success: true, viewerCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/viewer-count", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const viewerCount = getViewerCount(weddingId);
      res.json({ viewerCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:weddingId/live-feed", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const status = await storage.getLiveWeddingStatus(weddingId);
      
      if (!status || !status.isLive) {
        return res.json({
          isLive: false,
          message: "The wedding broadcast hasn't started yet. Check back soon!"
        });
      }
      
      const publicFeed: any = {
        isLive: true,
        lastUpdatedAt: status.lastUpdatedAt,
        lastBroadcastMessage: status.lastBroadcastMessage
      };
      
      if (status.currentEventId) {
        const event = await storage.getEvent(status.currentEventId);
        if (event) {
          publicFeed.currentEvent = {
            name: event.name,
            eventType: event.type,
            date: event.date,
            time: event.time,
            location: event.location
          };
        }
      }
      
      if (status.currentStageId) {
        const stage = await storage.getRitualStage(status.currentStageId);
        if (stage) {
          const latestUpdate = await storage.getLatestRitualStageUpdate(stage.id);
          const allStages = await storage.getRitualStagesByEvent(stage.eventId);
          const stagesWithStatus = await Promise.all(
            allStages.map(async (s) => {
              const update = await storage.getLatestRitualStageUpdate(s.id);
              return {
                id: s.id,
                displayName: s.displayName,
                description: s.description,
                displayOrder: s.displayOrder,
                guestInstructions: s.guestInstructions,
                status: update?.status || 'pending',
                delayMinutes: update?.delayMinutes || 0
              };
            })
          );
          
          publicFeed.currentStage = {
            id: stage.id,
            displayName: stage.displayName,
            description: stage.description,
            guestInstructions: stage.guestInstructions,
            status: latestUpdate?.status || 'pending',
            message: latestUpdate?.message,
            delayMinutes: latestUpdate?.delayMinutes || 0
          };
          publicFeed.allStages = stagesWithStatus.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      }
      
      if (status.currentGapId) {
        const gap = await storage.getGapWindow(status.currentGapId);
        if (gap) {
          const recommendations = await storage.getRecommendationsByGapWindow(gap.id);
          publicFeed.currentGap = {
            label: gap.label,
            startTime: gap.startTime,
            endTime: gap.endTime,
            shuttleSchedule: gap.shuttleSchedule,
            specialInstructions: gap.specialInstructions,
            recommendations: recommendations.map(r => ({
              name: r.name,
              type: r.type,
              description: r.description,
              address: r.address,
              mapUrl: r.mapUrl,
              estimatedTravelTime: r.estimatedTravelTime,
              priceLevel: r.priceLevel,
              photoUrl: r.photoUrl
            }))
          };
        }
      }
      
      res.json(publicFeed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
