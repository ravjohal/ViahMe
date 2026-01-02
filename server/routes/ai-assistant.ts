import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, AuthRequest } from "../auth-middleware";
import { 
  draftContract, 
  reviewContract, 
  generateContractClause, 
  suggestContractImprovements,
  chatWithPlanner,
  generateVendorReplySuggestions,
  generateCoupleMessageSuggestions,
  generateWebsiteContentSuggestions,
  ContractDraftRequest,
  ContractReviewRequest,
  ChatMessage,
  WeddingContext,
  VendorReplySuggestionRequest,
  CoupleMessageSuggestionRequest,
} from "../ai/gemini";

export async function registerAiAssistantRoutes(router: Router, storage: IStorage) {
  router.post("/contract/draft", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const request: ContractDraftRequest = req.body;
      
      if (!request.vendorName || !request.vendorCategory || !request.eventName || !request.servicesDescription) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Vendor name, category, event name, and services description are required" 
        });
      }

      if (typeof request.totalAmount !== 'number' || request.totalAmount <= 0) {
        return res.status(400).json({ 
          error: "Invalid amount",
          message: "Total amount must be a positive number" 
        });
      }

      const contractText = await draftContract(request);
      res.json({ contract: contractText });
    } catch (error) {
      console.error("Error drafting contract:", error);
      res.status(500).json({ 
        error: "Failed to draft contract",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/contract/review", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const request: ContractReviewRequest = req.body;
      
      if (!request.contractText || request.contractText.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract text required",
          message: "Please provide the contract text to review" 
        });
      }

      const review = await reviewContract(request);
      res.json({ review });
    } catch (error) {
      console.error("Error reviewing contract:", error);
      res.status(500).json({ 
        error: "Failed to review contract",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/contract/clause", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { clauseType, vendorCategory, tradition, specificDetails } = req.body;
      
      if (!clauseType || clauseType.trim().length === 0) {
        return res.status(400).json({ 
          error: "Clause type required",
          message: "Please specify the type of clause to generate" 
        });
      }

      const clause = await generateContractClause(clauseType, {
        vendorCategory,
        tradition,
        specificDetails,
      });
      res.json({ clause });
    } catch (error) {
      console.error("Error generating clause:", error);
      res.status(500).json({ 
        error: "Failed to generate clause",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/contract/suggestions", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { currentTerms, vendorCategory } = req.body;
      
      if (!currentTerms || currentTerms.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract terms required",
          message: "Please provide the current contract terms" 
        });
      }

      const suggestions = await suggestContractImprovements(currentTerms, vendorCategory || "General");
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ 
        error: "Failed to get suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/chat", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { message, conversationHistory, weddingContext } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory) ? conversationHistory : [];
      const context: WeddingContext | undefined = weddingContext;

      const response = await chatWithPlanner(message, history, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        error: "Failed to get response",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/vendor-reply-suggestions", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ error: "Only vendors can access this endpoint" });
      }

      const { vendorName, vendorCategory, coupleName, coupleMessage, eventName, weddingDate, tradition, bookingStatus } = req.body;
      
      if (!vendorName || !coupleName || !coupleMessage) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "vendorName, coupleName, and coupleMessage are required" 
        });
      }
      
      const sanitize = (str: string | undefined, maxLen: number) => 
        str ? str.slice(0, maxLen).trim() : undefined;
      
      const request: VendorReplySuggestionRequest = {
        vendorName: sanitize(vendorName, 100)!,
        vendorCategory: sanitize(vendorCategory, 50) || "Wedding Vendor",
        coupleName: sanitize(coupleName, 100)!,
        coupleMessage: sanitize(coupleMessage, 1000)!,
        eventName: sanitize(eventName, 100),
        weddingDate: sanitize(weddingDate, 50),
        tradition: sanitize(tradition, 50),
        bookingStatus: sanitize(bookingStatus, 50),
      };

      const suggestions = await generateVendorReplySuggestions(request);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating vendor reply suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/couple-message-suggestions", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== 'couple') {
        return res.status(403).json({ error: "Only couples can access this endpoint" });
      }

      const { vendorName, vendorCategory, coupleName, eventName, eventDate, tradition, city, guestCount, existingNotes } = req.body;
      
      if (!vendorName || !coupleName) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "vendorName and coupleName are required" 
        });
      }
      
      const sanitize = (str: string | undefined, maxLen: number) => 
        str ? str.slice(0, maxLen).trim() : undefined;

      const request: CoupleMessageSuggestionRequest = {
        vendorName: sanitize(vendorName, 100)!,
        vendorCategory: sanitize(vendorCategory, 50) || "Wedding Vendor",
        coupleName: sanitize(coupleName, 100)!,
        eventName: sanitize(eventName, 200),
        eventDate: sanitize(eventDate, 50),
        tradition: sanitize(tradition, 50),
        city: sanitize(city, 50),
        guestCount: typeof guestCount === 'number' ? Math.min(guestCount, 10000) : undefined,
        existingNotes: sanitize(existingNotes, 500),
      };

      const suggestions = await generateCoupleMessageSuggestions(request);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating couple message suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate suggestions",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/website-suggestions", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== 'couple') {
        return res.status(403).json({ error: "Only couples can access this endpoint" });
      }

      const { weddingId, section, additionalContext } = req.body;
      
      if (!weddingId || !section) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "weddingId and section are required" 
        });
      }

      const validSections = ['welcome', 'travel', 'accommodation', 'faq'];
      if (!validSections.includes(section)) {
        return res.status(400).json({ 
          error: "Invalid section",
          message: `section must be one of: ${validSections.join(', ')}` 
        });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== authReq.session.userId) {
        const collaborator = await storage.getCollaborator(weddingId, authReq.session.userId);
        if (!collaborator) {
          return res.status(403).json({ error: "Access denied to this wedding" });
        }
      }

      const events = await storage.getEventsByWedding(weddingId);

      const eventData = events.map(e => ({
        name: e.name,
        date: e.date?.toString(),
        venue: e.venue || undefined,
        location: e.location || undefined,
      }));

      const content = await generateWebsiteContentSuggestions({
        section: section as 'welcome' | 'travel' | 'accommodation' | 'faq',
        tradition: wedding.tradition || 'General',
        partner1Name: wedding.partner1Name || undefined,
        partner2Name: wedding.partner2Name || undefined,
        weddingDate: wedding.weddingDate?.toString(),
        city: wedding.city || undefined,
        events: eventData,
        additionalContext: additionalContext?.slice(0, 500),
      });

      res.json({ content, section });
    } catch (error) {
      console.error("Error generating website content:", error);
      res.status(500).json({ 
        error: "Failed to generate content",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });
}
