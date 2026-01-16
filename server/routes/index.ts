import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Router } from "express";
import { storage as defaultStorage, type IStorage } from "../storage";
import { registerAuthRoutes } from "./auth";
import { registerAiRoutes } from "./ai";
import { registerBudgetRoutes } from "./budget";
import { registerDashboardRoutes } from "./dashboard";
import { registerGuestRoutes } from "./guests";
import { registerVendorRoutes } from "./vendors";
import { registerCommunicationRoutes } from "./communications";
import { registerCollectorRoutes } from "./collector-submissions";
import { registerWeddingRoutes } from "./weddings";
import { registerEventRoutes, registerEventCostItemRoutes, registerWeddingCostSummaryRoute } from "./events";
import { registerTaskRoutes, registerTaskReminderRoutes, registerTaskCommentRoutes } from "./tasks";
import { registerBudgetBucketCategoryRoutes } from "./budget-bucket-categories";
import { registerExpenseRoutes } from "./expenses";
import { registerHouseholdRoutes } from "./households";
import { registerInvitationRoutes } from "./invitations";
import { registerGuestPublicRoutes } from "./guests-public";
import { registerVendorFavoriteRoutes } from "./vendor-favorites";
import { registerContractRoutes } from "./contracts";
import { registerContractTemplateRoutes } from "./contract-templates";
import { registerNotificationRoutes } from "./notifications";
import { registerServicePackageRoutes } from "./service-packages";
import { registerContractSignatureRoutes } from "./contract-signatures";
import { registerContractDocumentRoutes } from "./contract-documents";
import { registerContractPaymentRoutes } from "./contract-payments";
import { registerQuoteRequestRoutes } from "./quote-requests";
import { registerBookingRoutes } from "./bookings";
import { registerAiAssistantRoutes } from "./ai-assistant";
import { registerMessageRoutes, registerConversationRoutes } from "./messages";
import { registerAdminVendorRoutes } from "./admin-vendors";
import { registerVendorToolsRoutes } from "./vendor-tools";
import { createReviewsRouter } from "./reviews";
import { createPlaylistsRouter, createSongsRouter, createVotesRouter } from "./playlists";
import { createDocumentsRouter, createObjectStorageRouter, createObjectDownloadRouter } from "./documents";
import { createWeddingWebsitesRouter, createRegistriesRouter, createPublicWeddingRouter } from "./wedding-websites";
import { createGalleriesRouter, createPhotosRouter } from "./galleries";
import { createVendorAvailabilityRouter } from "./vendor-availability";
import { createVendorCalendarAccountsRouter, createVendorCalendarsRouter } from "./vendor-calendars";
import { createAnalyticsRouter } from "./analytics";
import { createInvitationCardsRouter, createOrdersRouter, createPaymentsRouter, createDepositPaymentsRouter } from "./orders-payments";
import { createMeasurementProfilesRouter, createShoppingItemsRouter } from "./shopping";
import { createGapWindowsRouter, createGapRecommendationsRouter } from "./gap-concierge";
import { createRitualStagesRouter, createRitualStageUpdatesRouter, createGuestNotificationsRouter, createLiveWeddingRouter, createPublicLiveRouter } from "./live-wedding";
import { createRolesRouter, createWeddingRolesRouter, createCollaboratorsRouter, createWeddingCollaboratorsRouter, createCollaboratorInvitesRouter, createCollaboratorActivityRouter, createPermissionsRouter, createMyCollaborationsRouter } from "./collaborators";
import { createGuestSourcesRouter } from "./guest-sources";
import { createGuestSideRouter, createGuestConsensusRouter, createScenariosRouter, createGuestBudgetRouter, createHouseholdPriorityRouter } from "./guest-planning";
import { createTimelineRouter, createEventTimeRouter, createTimelineChangesRouter, createVendorAcknowledgmentsRouter } from "./timeline";
import { createCeremonyTypesRouter, createRegionalPricingRouter, createCeremonyEstimateRouter } from "./ceremony-types";
import { registerRitualRoleRoutes } from "./ritual-roles";
import { registerMilniRoutes } from "./milni";
import { registerDecorRoutes } from "./decor";
import { createDayOfTimelineRouter } from "./day-of-timeline";
import { createHoneymoonRouter } from "./honeymoon";
import { createFavoursRouter } from "./favours";
import { registerTraditionsRoutes } from "./traditions";
import { registerVendorCategoriesRoutes } from "./vendor-categories";
import { registerPricingRegionsRoutes } from "./pricing-regions";
import { registerFavourCategoriesRoutes } from "./favour-categories";
import { registerDecorCategoriesRoutes } from "./decor-categories";
import { registerDecorItemTemplatesRoutes } from "./decor-item-templates";
import { registerHoneymoonBudgetCategoriesRoutes } from "./honeymoon-budget-categories";
import { registerDietaryOptionsRoutes } from "./dietary-options";
import { registerWeddingTraditionsRoutes } from "./wedding-traditions";
import { registerMilniRelationOptionsRoutes } from "./milni-relation-options";
import { registerMilniPairTemplatesRoutes } from "./milni-pair-templates";
import { registerTimelineTemplatesRoutes } from "./timeline-templates";
import { registerVendorTaskCategoriesRoutes } from "./vendor-task-categories";
import { createVendorAccessPassesRouter, createVendorCollaborationViewRouter } from "./vendor-access-passes";
import { createCeremonyExplainersRouter, createPublicCeremonyExplainersRouter } from "./ceremony-explainers";
import traditionRitualsRouter from "./tradition-rituals";
import { registerTranslationRoutes } from "./translation";
import { seedVendors } from "../seed-data";

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
    
    defaultStorageSeeded = true;
  }
  
  registerAuthRoutes(app, storage);

  // Public ceremony types and regional pricing (public read, admin write)
  const ceremonyTypesRouter = createCeremonyTypesRouter(storage);
  app.use("/api/ceremony-types", ceremonyTypesRouter);
  app.use("/api/ceremony-templates", ceremonyTypesRouter); // Backward compatibility
  app.use("/api/regional-pricing", createRegionalPricingRouter(storage));
  app.use("/api/ceremony-estimate", createCeremonyEstimateRouter(storage));
  

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

  const dashboardRouter = Router();
  await registerDashboardRoutes(dashboardRouter, storage);
  app.use("/api/dashboard", dashboardRouter);

  // Guest routes (authenticated) - includes households, plus-ones, etc.
  const guestRouter = Router();
  await registerGuestRoutes(guestRouter, storage);
  app.use("/api/guests", guestRouter);

  const vendorRouter = Router();
  await registerVendorRoutes(vendorRouter, storage);
  app.use("/api/vendors", vendorRouter);

  const communicationRouter = Router();
  await registerCommunicationRoutes(communicationRouter, storage);
  app.use("/api", communicationRouter);

  // Translation routes for Punjabi/Gurmukhi and other South Asian languages
  const translationRouter = Router();
  await registerTranslationRoutes(translationRouter, storage);
  app.use("/api/translation", translationRouter);

  const ritualRoleRouter = Router();
  await registerRitualRoleRoutes(ritualRoleRouter, storage);
  app.use("/api", ritualRoleRouter);

  const milniRouter = Router();
  await registerMilniRoutes(milniRouter, storage);
  app.use("/api", milniRouter);

  const decorRouter = Router();
  await registerDecorRoutes(decorRouter, storage);
  app.use("/api", decorRouter);

  // Day-of Timeline routes
  app.use("/api", await createDayOfTimelineRouter(storage));

  // Honeymoon Planner routes
  app.use("/api", await createHoneymoonRouter(storage));

  // Favours tracking routes
  app.use("/api", await createFavoursRouter(storage));

  app.use("/api/vendor-access-passes", await createVendorAccessPassesRouter(storage));
  app.use("/api/vendor-collaboration", createVendorCollaborationViewRouter(storage));

  app.use("/api/ceremony-explainers", await createCeremonyExplainersRouter(storage));
  app.use("/api/public/ceremony-explainers", createPublicCeremonyExplainersRouter(storage));

  // Tradition Rituals - Educational content about wedding rituals (read-only)
  app.use("/api/tradition-rituals", traditionRitualsRouter);

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

  const budgetBucketCategoryRouter = Router();
  await registerBudgetBucketCategoryRoutes(budgetBucketCategoryRouter, storage);
  app.use("/api/budget-bucket-categories", budgetBucketCategoryRouter);

  const traditionsRouter = Router();
  await registerTraditionsRoutes(traditionsRouter, storage);
  app.use("/api/traditions", traditionsRouter);

  const vendorCategoriesRouter = Router();
  await registerVendorCategoriesRoutes(vendorCategoriesRouter, storage);
  app.use("/api/vendor-categories", vendorCategoriesRouter);

  const pricingRegionsRouter = Router();
  await registerPricingRegionsRoutes(pricingRegionsRouter, storage);
  app.use("/api/pricing-regions", pricingRegionsRouter);

  const favourCategoriesRouter = Router();
  await registerFavourCategoriesRoutes(favourCategoriesRouter, storage);
  app.use("/api/favour-categories", favourCategoriesRouter);

  const decorCategoriesRouter = Router();
  await registerDecorCategoriesRoutes(decorCategoriesRouter, storage);
  app.use("/api/decor-categories", decorCategoriesRouter);

  const decorItemTemplatesRouter = Router();
  await registerDecorItemTemplatesRoutes(decorItemTemplatesRouter, storage);
  app.use("/api/decor-item-templates", decorItemTemplatesRouter);

  const honeymoonBudgetCategoriesRouter = Router();
  await registerHoneymoonBudgetCategoriesRoutes(honeymoonBudgetCategoriesRouter, storage);
  app.use("/api/honeymoon-budget-categories", honeymoonBudgetCategoriesRouter);

  const dietaryOptionsRouter = Router();
  await registerDietaryOptionsRoutes(dietaryOptionsRouter, storage);
  app.use("/api/dietary-options", dietaryOptionsRouter);

  const weddingTraditionsRouter = Router();
  await registerWeddingTraditionsRoutes(weddingTraditionsRouter, storage);
  app.use("/api/wedding-traditions", weddingTraditionsRouter);

  const milniRelationOptionsRouter = Router();
  await registerMilniRelationOptionsRoutes(milniRelationOptionsRouter, storage);
  app.use("/api/milni-relation-options", milniRelationOptionsRouter);

  const milniPairTemplatesRouter = Router();
  await registerMilniPairTemplatesRoutes(milniPairTemplatesRouter, storage);
  app.use("/api/milni-pair-templates", milniPairTemplatesRouter);

  const timelineTemplatesRouter = Router();
  await registerTimelineTemplatesRoutes(timelineTemplatesRouter, storage);
  app.use("/api/timeline-templates", timelineTemplatesRouter);

  const vendorTaskCategoriesRouter = Router();
  await registerVendorTaskCategoriesRoutes(vendorTaskCategoriesRouter, storage);
  app.use("/api/vendor-task-categories", vendorTaskCategoriesRouter);

  const expenseRouter = Router();
  await registerExpenseRoutes(expenseRouter, storage);
  app.use("/api/expenses", expenseRouter);

  const householdRouter = Router();
  await registerHouseholdRoutes(householdRouter, storage);
  app.use("/api/households", householdRouter);

  const invitationRouter = Router();
  await registerInvitationRoutes(invitationRouter, storage);
  app.use("/api/invitations", invitationRouter);

  const guestPublicRouter = Router();
  await registerGuestPublicRoutes(guestPublicRouter, storage);
  app.use("/api/guests", guestPublicRouter);

  const vendorFavoriteRouter = Router();
  await registerVendorFavoriteRoutes(vendorFavoriteRouter, storage);
  app.use("/api/vendor-favorites", vendorFavoriteRouter);

  const contractRouter = Router();
  await registerContractRoutes(contractRouter, storage);
  app.use("/api/contracts", contractRouter);

  const contractTemplateRouter = Router();
  await registerContractTemplateRoutes(contractTemplateRouter, storage);
  app.use("/api/contract-templates", contractTemplateRouter);

  const notificationRouter = Router();
  await registerNotificationRoutes(notificationRouter, storage);
  app.use("/api/notifications", notificationRouter);

  const servicePackageRouter = Router();
  await registerServicePackageRoutes(servicePackageRouter, storage);
  app.use("/api/service-packages", servicePackageRouter);

  const contractSignatureRouter = Router();
  await registerContractSignatureRoutes(contractSignatureRouter, storage);
  app.use("/api/contracts", contractSignatureRouter);

  const contractDocumentRouter = Router();
  await registerContractDocumentRoutes(contractDocumentRouter, storage);
  app.use("/api/contracts", contractDocumentRouter);

  const contractPaymentRouter = Router();
  await registerContractPaymentRoutes(contractPaymentRouter, storage);
  app.use("/api/contracts", contractPaymentRouter);

  const quoteRequestRouter = Router();
  await registerQuoteRequestRoutes(quoteRequestRouter, storage);
  app.use("/api", quoteRequestRouter);

  const bookingRouter = Router();
  await registerBookingRoutes(bookingRouter, storage);
  app.use("/api/bookings", bookingRouter);

  const aiAssistantRouter = Router();
  await registerAiAssistantRoutes(aiAssistantRouter, storage);
  app.use("/api/ai", aiAssistantRouter);

  const messageRouter = Router();
  await registerMessageRoutes(messageRouter, storage);
  app.use("/api/messages", messageRouter);

  const conversationRouter = Router();
  await registerConversationRoutes(conversationRouter, storage);
  app.use("/api/conversations", conversationRouter);

  const adminVendorRouter = Router();
  await registerAdminVendorRoutes(adminVendorRouter, storage);
  app.use("/api/admin", adminVendorRouter);

  // Vendor tools (lead inbox, quick reply templates, follow-up reminders)
  const vendorToolsRouter = Router();
  await registerVendorToolsRoutes(vendorToolsRouter, storage);
  app.use("/api", vendorToolsRouter);

  // Reviews
  app.use("/api/reviews", createReviewsRouter(storage));

  // Playlists, songs, and votes
  app.use("/api/playlists", createPlaylistsRouter(storage));
  app.use("/api/songs", createSongsRouter(storage));
  app.use("/api/votes", createVotesRouter(storage));

  // Documents and object storage
  app.use("/api/documents", createDocumentsRouter(storage));
  app.use("/api/objects", createObjectStorageRouter());
  app.use("/objects", createObjectDownloadRouter());

  // Wedding websites and registries
  app.use("/api/wedding-websites", createWeddingWebsitesRouter(storage));
  app.use("/api/registry-retailers", createRegistriesRouter(storage));
  app.use("/api/weddings", createRegistriesRouter(storage));
  app.use("/api/registries", createRegistriesRouter(storage));
  app.use("/api/public", createPublicWeddingRouter(storage));

  // Galleries and photos
  app.use("/api/galleries", createGalleriesRouter(storage));
  app.use("/api/photos", createPhotosRouter(storage));

  // Vendor availability and calendars
  app.use("/api/vendor-availability", createVendorAvailabilityRouter(storage));
  app.use("/api/vendor-calendar-accounts", createVendorCalendarAccountsRouter(storage));
  app.use("/api/vendor-calendars", createVendorCalendarsRouter(storage));

  // Analytics
  app.use("/api/analytics", createAnalyticsRouter(storage));

  // Orders and payments
  app.use("/api/invitation-cards", createInvitationCardsRouter(storage));
  app.use("/api/orders", createOrdersRouter(storage));
  app.use("/api", createPaymentsRouter(storage));
  app.use("/api/bookings", createDepositPaymentsRouter(storage));

  // Shopping and measurements
  app.use("/api/measurement-profiles", createMeasurementProfilesRouter(storage));
  app.use("/api/guests", createMeasurementProfilesRouter(storage));
  app.use("/api/shopping-items", createShoppingItemsRouter(storage));
  app.use("/api/weddings", createShoppingItemsRouter(storage));

  // Gap concierge
  app.use("/api/gap-windows", createGapWindowsRouter(storage));
  app.use("/api/weddings", createGapWindowsRouter(storage));
  app.use("/api/gap-recommendations", createGapRecommendationsRouter(storage));

  // Live wedding
  app.use("/api/ritual-stages", createRitualStagesRouter(storage));
  app.use("/api/events", createRitualStagesRouter(storage));
  app.use("/api/ritual-stage-updates", createRitualStageUpdatesRouter(storage));
  app.use("/api/guest-notifications", createGuestNotificationsRouter(storage));
  app.use("/api/weddings", createGuestNotificationsRouter(storage));
  app.use("/api/weddings", createLiveWeddingRouter(storage, { activeViewers, getViewerCount }));
  app.use("/api/public/weddings", createPublicLiveRouter(storage, { activeViewers, getViewerCount }));

  // Collaborators and roles
  // Wedding-scoped roles: /api/weddings/:weddingId/roles
  app.use("/api/weddings", createWeddingRolesRouter(storage));
  // Role-by-ID operations: /api/roles/:roleId
  app.use("/api/roles", createRolesRouter(storage));
  // Wedding-scoped collaborators: /api/weddings/:weddingId/collaborators
  app.use("/api/weddings", createWeddingCollaboratorsRouter(storage));
  // Collaborator-by-ID operations: /api/collaborators/:collaboratorId
  app.use("/api/collaborators", createCollaboratorsRouter(storage));
  app.use("/api/collaborator-invites", createCollaboratorInvitesRouter(storage));
  app.use("/api/collaborator-activity", createCollaboratorActivityRouter(storage));
  app.use("/api/weddings", createCollaboratorActivityRouter(storage));
  app.use("/api", createPermissionsRouter(storage));
  app.use("/api/my-collaborations", createMyCollaborationsRouter(storage));

  // Guest sources
  app.use("/api/guest-sources", createGuestSourcesRouter(storage));
  app.use("/api", createGuestSourcesRouter(storage));

  // Guest planning
  app.use("/api/weddings", createGuestSideRouter(storage));
  app.use("/api/guests", createGuestConsensusRouter(storage));
  app.use("/api/scenarios", createScenariosRouter(storage));
  app.use("/api", createScenariosRouter(storage));
  app.use("/api/weddings", createGuestBudgetRouter(storage));
  app.use("/api/households", createHouseholdPriorityRouter(storage));

  // Timeline routes
  app.use("/api/weddings", createTimelineRouter(storage));
  app.use("/api/events", createEventTimeRouter(storage));
  app.use("/api/timeline-changes", createTimelineChangesRouter(storage));
  app.use("/api/vendor", createVendorAcknowledgmentsRouter(storage));

  // Guest engagement games
  const gamesRouter = Router();
  const { registerGameRoutes } = await import('./games');
  await registerGameRoutes(gamesRouter, storage);
  app.use("/api", gamesRouter);
  
  // Guest-facing game routes (accessed via household magic link)
  const gamesGuestRouter = Router();
  const { registerGuestGameRoutes } = await import('./games-guest');
  await registerGuestGameRoutes(gamesGuestRouter, storage);
  app.use("/api", gamesGuestRouter);

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
