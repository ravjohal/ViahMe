import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import {
  draftContract,
  reviewContract,
  chatWithPlanner,
  chatWithPlannerStream,
  chatWithGuestAssistant,
  generateContractClause,
  suggestContractImprovements,
  generateVendorReplySuggestions,
  generateCoupleMessageSuggestions,
  generateWebsiteContentSuggestions,
  generateWeddingSpeech,
  type ContractDraftRequest,
  type ContractReviewRequest,
  type ChatMessage,
  type WeddingContext,
  type GuestAssistantContext,
  type VendorReplySuggestionRequest,
  type CoupleMessageSuggestionRequest,
  type SpeechGeneratorRequest,
} from "../ai/gemini";

// Condensed AI context - only essential feature knowledge (much smaller than full replit.md)
const AI_FEATURE_CONTEXT = `Viah.me Features:
- Budget: Ceremony-based tracking, vendor payments, expense splitting between families
- Vendors: 32 categories, culturally-specialized, comparison tools, contracts with e-signatures
- Guests: Bulk import, household grouping, per-event RSVPs, dietary tracking
- Events: Multi-day timeline, ceremony templates (Sikh/Hindu/Muslim/Gujarati/South Indian)
- Tasks: Checklist with reminders, assignable to partners/family
- Communication: Vendor messaging, AI reply suggestions
- Documents: Contract storage, photo galleries
- Website: Guest-facing site with RSVP, livestream support
- Cultural Info: Ceremony explanations, attire guides, ritual roles
Navigate: Dashboard, Budget, Vendors, Guests, Events, Tasks, AI Planner, Settings`;


// Normalize message for cache/database lookup
function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export async function registerAiRoutes(router: Router, storage: IStorage) {
  router.post("/contract/draft", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/contract/review", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/contract/clause", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/contract/suggestions", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/chat", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { message, conversationHistory, weddingContext, weddingId, persistHistory } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory) ? conversationHistory : [];
      
      // Enhance context with condensed feature knowledge
      const context: WeddingContext | undefined = weddingContext ? {
        ...weddingContext,
        appDocumentation: AI_FEATURE_CONTEXT,
      } : { appDocumentation: AI_FEATURE_CONTEXT };

      let response: string;
      let fromCache = false;

      // Check database chat history for cached response (same question asked before)
      if (weddingId && history.length === 0) {
        const normalizedQuery = normalizeMessage(message);
        
        try {
          // Get all chat messages for this wedding to find matching Q&A pairs
          const chatHistory = await storage.getAiChatMessages(weddingId, authReq.session.userId);
          
          // Look for a matching user question and its subsequent assistant response
          for (let i = 0; i < chatHistory.length - 1; i++) {
            const userMsg = chatHistory[i];
            const assistantMsg = chatHistory[i + 1];
            
            if (userMsg.role === 'user' && assistantMsg.role === 'assistant') {
              const normalizedHistoryQuestion = normalizeMessage(userMsg.content);
              
              if (normalizedHistoryQuestion === normalizedQuery) {
                response = assistantMsg.content;
                fromCache = true;
                console.log(`AI chat DB cache hit for wedding ${weddingId}`);
                break;
              }
            }
          }
        } catch (dbError) {
          console.error("Error checking chat history cache:", dbError);
          // Continue to LLM if DB lookup fails
        }
      }

      // If not found in cache, call LLM
      if (!fromCache) {
        response = await chatWithPlanner(message, history, context);
      }

      // If persistHistory is true and weddingId is provided, save both user message and AI response
      // Only persist if not from cache (to avoid duplicate entries)
      if (persistHistory && weddingId && !fromCache) {
        try {
          await storage.createAiChatMessage({
            weddingId,
            userId: authReq.session.userId,
            role: 'user',
            content: message
          });
          await storage.createAiChatMessage({
            weddingId,
            userId: authReq.session.userId,
            role: 'assistant',
            content: response!
          });
        } catch (persistError) {
          console.error("Error persisting chat history:", persistError);
          // Don't fail the request if persistence fails
        }
      }

      res.json({ response: response!, cached: fromCache });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        error: "Failed to get response",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Streaming chat endpoint for real-time responses
  router.post("/chat/stream", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { message, conversationHistory, weddingContext, weddingId, persistHistory } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory) ? conversationHistory : [];
      
      // Fetch real guest count from database if weddingId is provided
      let actualGuestCount: number | undefined;
      let hasNoGuests = false;
      
      let ceremonyGuestBreakdown: string | undefined;
      
      if (weddingId) {
        try {
          // Fetch all events/ceremonies with their individual guest counts
          const events = await storage.getEventsByWedding(weddingId);
          
          if (events.length > 0) {
            const eventsWithGuests = events
              .filter(event => event.guestCount && event.guestCount > 0)
              .map(event => `${event.name}: ${event.guestCount} guests`);
            
            if (eventsWithGuests.length > 0) {
              ceremonyGuestBreakdown = `Ceremonies planned:\n${eventsWithGuests.join('\n')}`;
              hasNoGuests = false;
              // Use max guest count as the primary reference
              actualGuestCount = Math.max(...events.map(e => e.guestCount || 0));
            } else {
              // Events exist but no guest counts set
              ceremonyGuestBreakdown = `Ceremonies planned: ${events.map(e => e.name).join(', ')} (no guest counts set yet)`;
              hasNoGuests = true;
            }
          } else {
            // No events planned yet
            hasNoGuests = true;
          }
        } catch (guestError) {
          console.error("Error fetching events for AI context:", guestError);
        }
      }
      
      // Enhance context with condensed feature knowledge and ceremony guest data
      const context: WeddingContext | undefined = weddingContext ? {
        ...weddingContext,
        // Override estimate with actual count if available
        guestCount: actualGuestCount !== undefined ? actualGuestCount : weddingContext.guestCount,
        hasNoGuests,
        guestDataNote: ceremonyGuestBreakdown 
          ? ceremonyGuestBreakdown
          : hasNoGuests 
            ? "No ceremonies or guest counts have been added yet. Suggest they add events in the Events section."
            : undefined,
        appDocumentation: AI_FEATURE_CONTEXT,
      } : { appDocumentation: AI_FEATURE_CONTEXT };

      // Check FAQ cache first for instant responses
      const normalizedQuery = normalizeMessage(message);
      let faqResponse: string | null = null;
      
      try {
        const faqMatch = await storage.findFaqByNormalizedQuestion(normalizedQuery);
        if (faqMatch) {
          faqResponse = faqMatch.answer;
          console.log(`FAQ cache hit for: "${message.substring(0, 50)}..."`);
        }
      } catch (faqError) {
        console.error("Error checking FAQ cache:", faqError);
      }

      // Check database chat history for cached response (always check regardless of current history length)
      let cachedResponse: string | null = null;
      if (!faqResponse && weddingId) {
        try {
          const chatHistory = await storage.getAiChatMessages(weddingId, authReq.session.userId);
          
          // Search from newest to oldest for the most recent answer to this question
          for (let i = chatHistory.length - 1; i >= 1; i--) {
            const assistantMsg = chatHistory[i];
            const userMsg = chatHistory[i - 1];
            
            if (userMsg.role === 'user' && assistantMsg.role === 'assistant') {
              const normalizedHistoryQuestion = normalizeMessage(userMsg.content);
              
              if (normalizedHistoryQuestion === normalizedQuery) {
                cachedResponse = assistantMsg.content;
                console.log(`AI chat DB cache hit for wedding ${weddingId}: "${message.substring(0, 30)}..."`);
                break;
              }
            }
          }
        } catch (dbError) {
          console.error("Error checking chat history cache:", dbError);
        }
      }

      // Set up SSE headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Track if client disconnected
      let clientDisconnected = false;
      req.on('close', () => {
        clientDisconnected = true;
      });

      // If we have a cached response (FAQ or DB), stream it quickly
      if (faqResponse || cachedResponse) {
        const cachedContent = faqResponse || cachedResponse!;
        
        // Stream cached content in chunks for consistent UX
        const chunkSize = 50;
        for (let i = 0; i < cachedContent.length && !clientDisconnected; i += chunkSize) {
          const chunk = cachedContent.slice(i, i + chunkSize);
          res.write(`data: ${JSON.stringify({ text: chunk, cached: true })}\n\n`);
        }
        
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true, cached: true })}\n\n`);
        }
        res.end();
        return;
      }

      // Stream from LLM
      let fullResponse = "";
      
      try {
        const stream = chatWithPlannerStream(message, history, context);
        
        for await (const chunk of stream) {
          if (clientDisconnected) break;
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
        res.end();

        // Persist history after streaming completes (even if client disconnected)
        if (persistHistory && weddingId && fullResponse.length > 0) {
          try {
            await storage.createAiChatMessage({
              weddingId,
              userId: authReq.session.userId,
              role: 'user',
              content: message
            });
            await storage.createAiChatMessage({
              weddingId,
              userId: authReq.session.userId,
              role: 'assistant',
              content: fullResponse
            });
          } catch (persistError) {
            console.error("Error persisting chat history:", persistError);
          }
        }
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        }
        res.end();
      }
    } catch (error) {
      console.error("Error in streaming chat:", error);
      // Check if headers have been sent (SSE already started)
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Failed to get response",
          message: error instanceof Error ? error.message : "Please try again later"
        });
      } else {
        // Headers already sent, send SSE error event
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      }
    }
  });

  // Get chat history for a wedding
  router.get("/chat/history/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      const messages = await storage.getAiChatMessages(weddingId, authReq.session.userId);
      
      // Transform to the format expected by the chat component
      const history = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      res.json({ history });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ 
        error: "Failed to fetch chat history",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Clear chat history for a wedding
  router.delete("/chat/history/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { weddingId } = req.params;
      await storage.clearAiChatHistory(weddingId, authReq.session.userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ 
        error: "Failed to clear chat history",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  router.post("/vendor-reply-suggestions", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/couple-message-suggestions", await requireAuth(storage, false), async (req, res) => {
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

  router.post("/website-suggestions", await requireAuth(storage, false), async (req, res) => {
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

  // Speech Generator - Generate personalized wedding speeches
  router.post("/speech/generate", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const requestBody = req.body;
      
      // Validate required fields
      if (!requestBody.speakerRole || !requestBody.recipientFocus || !requestBody.partner1Name || !requestBody.partner2Name) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Speaker role, recipient focus, and partner names are required" 
        });
      }

      // Build request with defaults (don't mutate original)
      const request: SpeechGeneratorRequest = {
        ...requestBody,
        tone: requestBody.tone || "mix",
        length: requestBody.length || "medium",
      };

      const result = await generateWeddingSpeech(request);
      res.json(result);
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ 
        error: "Failed to generate speech",
        message: error instanceof Error ? error.message : "Please try again later"
      });
    }
  });

  // Guest Assistant - public endpoint for family members on guest collector page
  // No auth required since this is accessed via public collector links
  router.post("/guest-assistant", async (req, res) => {
    try {
      const { message, conversationHistory, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      // Sanitize and validate input
      const sanitizedMessage = message.slice(0, 1000).trim();
      if (sanitizedMessage.length === 0) {
        return res.status(400).json({ 
          error: "Message required",
          message: "Please provide a message" 
        });
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory) 
        ? conversationHistory.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: String(msg.content || '').slice(0, 500),
          }))
        : [];

      const sanitizedContext: GuestAssistantContext | undefined = context ? {
        coupleName: context.coupleName?.slice(0, 100),
        weddingDate: context.weddingDate?.slice(0, 50),
        submitterName: context.submitterName?.slice(0, 100),
        currentStep: context.currentStep?.slice(0, 50),
      } : undefined;

      const response = await chatWithGuestAssistant(sanitizedMessage, history, sanitizedContext);
      res.json({ response });
    } catch (error) {
      console.error("Error in guest assistant chat:", error);
      res.status(500).json({ 
        error: "Failed to get response",
        message: "Sorry, I'm having trouble right now. Please try again."
      });
    }
  });

  return router;
}
