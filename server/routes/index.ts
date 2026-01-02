import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Router } from "express";
import { storage as defaultStorage, type IStorage } from "../storage";
import { registerAuthRoutes } from "./auth";
import { registerAiRoutes } from "./ai";
import { registerBudgetRoutes } from "./budget";
import { registerGuestRoutes } from "./guests";
import { registerVendorRoutes } from "./vendors";
import { registerCommunicationRoutes } from "./communications";
import { registerCollectorRoutes } from "./collector-submissions";
import { registerWeddingRoutes } from "./weddings";
import { registerEventRoutes, registerEventCostItemRoutes, registerWeddingCostSummaryRoute } from "./events";
import { registerTaskRoutes, registerTaskReminderRoutes, registerTaskCommentRoutes } from "./tasks";
import { seedVendors, seedBudgetBenchmarks } from "../seed-data";

let defaultStorageSeeded = false;

interface ViewerSession {
  viewerId: string;
  weddingId: string;
  lastHeartbeat: number;
}

const activeViewers = new Map<string, ViewerSession>();
const VIEWER_TIMEOUT_MS = 60000;

function cleanupStaleViewers() {
  const now = Date.now();
  for (const [viewerId, session] of activeViewers.entries()) {
    if (now - session.lastHeartbeat > VIEWER_TIMEOUT_MS) {
      activeViewers.delete(viewerId);
    }
  }
}

function getViewerCount(weddingId: string): number {
  cleanupStaleViewers();
  let count = 0;
  for (const session of activeViewers.values()) {
    if (session.weddingId === weddingId) {
      count++;
    }
  }
  return count;
}

setInterval(cleanupStaleViewers, 30000);

export async function registerRoutes(app: Express, injectedStorage?: IStorage): Promise<Server> {
  const storage = injectedStorage || defaultStorage;
  
  if (!injectedStorage && !defaultStorageSeeded) {
    const existingVendors = await storage.getAllVendors();
    if (existingVendors.length === 0) {
      await seedVendors(storage);
    }
    
    const existingBenchmarks = await storage.getAllBudgetBenchmarks();
    if (existingBenchmarks.length === 0) {
      await seedBudgetBenchmarks(storage);
    }
    defaultStorageSeeded = true;
  }
  
  registerAuthRoutes(app, storage);

  // Public endpoint - Address autocomplete using Geoapify (no auth required for collector)
  app.get("/api/address-autocomplete", async (req, res) => {
    const query = req.query.q as string;
    
    if (!query || query.length < 3) {
      return res.json({ features: [] });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    
    if (!apiKey) {
      return res.json({ features: [], error: "Address autocomplete not configured" });
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Geoapify returns 'results' with format=json, 'features' with GeoJSON format
      if (data.results) {
        // Convert results format to features format for frontend compatibility
        const features = data.results.map((result: any) => ({
          properties: {
            formatted: result.formatted,
            street: result.street,
            housenumber: result.housenumber,
            address_line1: result.address_line1,
            city: result.city,
            town: result.town,
            village: result.village,
            state: result.state,
            postcode: result.postcode,
            country: result.country,
            place_id: result.place_id,
          }
        }));
        return res.json({ features });
      }
      
      res.json(data);
    } catch (error: any) {
      res.json({ features: [], error: "Failed to fetch address suggestions" });
    }
  });

  const aiRouter = Router();
  await registerAiRoutes(aiRouter, storage);
  app.use("/api/ai", aiRouter);

  const budgetRouter = Router();
  await registerBudgetRoutes(budgetRouter, storage);
  app.use("/api/budget", budgetRouter);

  const guestRouter = Router();
  await registerGuestRoutes(guestRouter, storage);
  app.use("/api/guest", guestRouter);

  const vendorRouter = Router();
  await registerVendorRoutes(vendorRouter, storage);
  app.use("/api/vendor", vendorRouter);

  const communicationRouter = Router();
  await registerCommunicationRoutes(communicationRouter, storage);
  app.use("/api", communicationRouter);

  const collectorRouter = Router();
  await registerCollectorRoutes(collectorRouter, storage);
  app.use("/api", collectorRouter);

  const weddingRouter = Router();
  await registerWeddingCostSummaryRoute(weddingRouter, storage);
  await registerWeddingRoutes(weddingRouter, storage);
  app.use("/api/weddings", weddingRouter);

  const eventRouter = Router();
  await registerEventRoutes(eventRouter, storage);
  app.use("/api/events", eventRouter);

  const eventCostItemRouter = Router();
  await registerEventCostItemRoutes(eventCostItemRouter, storage);
  app.use("/api/event-cost-items", eventCostItemRouter);

  const taskRouter = Router();
  await registerTaskRoutes(taskRouter, storage);
  app.use("/api/tasks", taskRouter);

  const taskReminderRouter = Router();
  await registerTaskReminderRoutes(taskReminderRouter, storage);
  app.use("/api/task-reminders", taskReminderRouter);

  const taskCommentRouter = Router();
  await registerTaskCommentRoutes(taskCommentRouter, storage);
  app.use("/api/task-comments", taskCommentRouter);

  const { registerLegacyRoutes } = await import("../routes-legacy");
  await registerLegacyRoutes(app, storage, { activeViewers, getViewerCount, cleanupStaleViewers });

  const httpServer = createServer(app);

  // WebSocket Server for live feed (guest updates)
  const liveFeedWss = new WebSocketServer({ noServer: true });
  const weddingConnections = new Map<string, Set<WebSocket>>();

  liveFeedWss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const weddingId = url.searchParams.get('weddingId');
    
    if (!weddingId) {
      ws.close(1008, 'weddingId required');
      return;
    }
    
    if (!weddingConnections.has(weddingId)) {
      weddingConnections.set(weddingId, new Set());
    }
    weddingConnections.get(weddingId)!.add(ws);
    
    ws.on('close', () => {
      weddingConnections.get(weddingId)?.delete(ws);
      if (weddingConnections.get(weddingId)?.size === 0) {
        weddingConnections.delete(weddingId);
      }
    });
    
    ws.send(JSON.stringify({ type: 'connected', weddingId }));
  });

  // Global broadcast function for wedding updates
  (global as any).broadcastToWedding = (weddingId: string, data: any) => {
    const connections = weddingConnections.get(weddingId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };

  // WebSocket Server for messaging
  const messageWss = new WebSocketServer({ noServer: true });
  const messageConnections = new Map<string, Set<WebSocket>>();

  messageWss.on('error', (error) => {
    console.error('[WebSocket] Message server error:', error);
  });

  messageWss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      ws.close(1008, 'conversationId required');
      return;
    }
    
    if (!messageConnections.has(conversationId)) {
      messageConnections.set(conversationId, new Set());
    }
    messageConnections.get(conversationId)!.add(ws);
    
    ws.on('error', (error) => {
      console.error('[WebSocket] Client connection error:', error);
    });
    
    ws.on('close', () => {
      messageConnections.get(conversationId)?.delete(ws);
      if (messageConnections.get(conversationId)?.size === 0) {
        messageConnections.delete(conversationId);
      }
    });
    
    ws.send(JSON.stringify({ type: 'connected', conversationId }));
  });

  // Global broadcast function for new messages
  (global as any).broadcastNewMessage = (conversationId: string, message: any) => {
    const connections = messageConnections.get(conversationId);
    if (connections) {
      const payload = JSON.stringify({ type: 'message:new', conversationId, message });
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  };

  // Manual WebSocket upgrade handler - route to correct server
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (pathname === '/ws/live-feed') {
      liveFeedWss.handleUpgrade(request, socket, head, (ws) => {
        liveFeedWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/messages') {
      messageWss.handleUpgrade(request, socket, head, (ws) => {
        messageWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  return httpServer;
}

export { activeViewers, getViewerCount, cleanupStaleViewers };
