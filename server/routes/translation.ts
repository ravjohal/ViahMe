import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { 
  translateText, 
  translateBatch, 
  getSupportedLanguages, 
  isLanguageSupported,
  translateInvitationContent,
  type SupportedLanguage 
} from "../services/translation";

export async function registerTranslationRoutes(router: Router, storage: IStorage) {
  router.get("/languages", async (_req, res) => {
    try {
      const languages = getSupportedLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching supported languages:", error);
      res.status(500).json({ error: "Failed to fetch supported languages" });
    }
  });

  router.post("/translate", await requireAuth(storage, false), async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
        return res.status(400).json({ 
          error: "Invalid target language", 
          supportedLanguages: getSupportedLanguages() 
        });
      }

      if (sourceLanguage && !isLanguageSupported(sourceLanguage)) {
        return res.status(400).json({ 
          error: "Invalid source language", 
          supportedLanguages: getSupportedLanguages() 
        });
      }

      const result = await translateText(
        text, 
        targetLanguage as SupportedLanguage, 
        sourceLanguage as SupportedLanguage
      );
      
      res.json(result);
    } catch (error) {
      console.error("Translation error:", error);
      if (error instanceof Error && error.message.includes('API_KEY')) {
        return res.status(503).json({ 
          error: "Translation service not configured", 
          details: "Please configure Google Cloud Translation API key" 
        });
      }
      res.status(500).json({ error: "Translation failed" });
    }
  });

  router.post("/translate-batch", await requireAuth(storage, false), async (req, res) => {
    try {
      const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;

      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "Texts array is required" });
      }

      if (texts.length > 100) {
        return res.status(400).json({ error: "Maximum 100 texts per batch" });
      }

      if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
        return res.status(400).json({ 
          error: "Invalid target language", 
          supportedLanguages: getSupportedLanguages() 
        });
      }

      const results = await translateBatch(
        texts, 
        targetLanguage as SupportedLanguage, 
        sourceLanguage as SupportedLanguage
      );
      
      res.json({ translations: results });
    } catch (error) {
      console.error("Batch translation error:", error);
      if (error instanceof Error && error.message.includes('API_KEY')) {
        return res.status(503).json({ 
          error: "Translation service not configured", 
          details: "Please configure Google Cloud Translation API key" 
        });
      }
      res.status(500).json({ error: "Batch translation failed" });
    }
  });

  router.post("/translate-invitation", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { 
        weddingId, 
        householdId, 
        targetLanguage,
        eventIds,
        personalMessage 
      } = req.body;

      if (!weddingId) {
        return res.status(400).json({ error: "Wedding ID is required" });
      }

      if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
        return res.status(400).json({ 
          error: "Invalid target language", 
          supportedLanguages: getSupportedLanguages() 
        });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      let householdName = 'Guest';
      if (householdId) {
        const household = await storage.getHousehold(householdId);
        if (household) {
          householdName = household.name;
        }
      }

      let eventNames: string[] = [];
      if (eventIds && eventIds.length > 0) {
        const events = await Promise.all(
          eventIds.map((id: string) => storage.getEvent(id))
        );
        eventNames = events.filter(Boolean).map(e => e!.name);
      }

      const coupleName = wedding.partner1Name && wedding.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}`
        : wedding.partner1Name || 'Your Hosts';
      const weddingDate = wedding.weddingDate 
        ? new Date(wedding.weddingDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : undefined;

      const translatedContent = await translateInvitationContent({
        householdName,
        coupleName,
        eventNames,
        weddingDate,
        personalMessage,
        targetLanguage: targetLanguage as SupportedLanguage,
      });

      res.json({
        targetLanguage,
        content: translatedContent,
      });
    } catch (error) {
      console.error("Invitation translation error:", error);
      if (error instanceof Error && error.message.includes('API_KEY')) {
        return res.status(503).json({ 
          error: "Translation service not configured", 
          details: "Please configure Google Cloud Translation API key" 
        });
      }
      res.status(500).json({ error: "Failed to translate invitation" });
    }
  });
}
