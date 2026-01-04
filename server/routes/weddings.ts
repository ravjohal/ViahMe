import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertWeddingSchema } from "@shared/schema";

function calculateDueDate(weddingDate: Date, daysBeforeWedding: number): Date {
  const dueDate = new Date(weddingDate);
  dueDate.setDate(dueDate.getDate() - daysBeforeWedding);
  return dueDate;
}

// Calculate event date relative to the main wedding ceremony date
// Main ceremonies (anand_karaj, wedding, nikah, etc.) get the wedding date
// Pre-wedding ceremonies are scheduled before, reception is same day or after
function calculateEventDate(weddingDate: Date, ceremonyId: string, eventType: string): Date {
  const eventDate = new Date(weddingDate);
  
  // Main wedding ceremonies - use the wedding date
  const mainCeremonies = [
    'anand_karaj', 'wedding', 'hindu_wedding', 'sikh_anand_karaj', 
    'nikah', 'muslim_nikah', 'gujarati_wedding', 'south_indian_muhurtham',
    'christian_ceremony', 'jain_wedding', 'parsi_lagan'
  ];
  
  if (mainCeremonies.includes(ceremonyId) || mainCeremonies.includes(eventType)) {
    return eventDate;
  }
  
  // Reception - same day as wedding (could be evening)
  if (eventType === 'reception' || ceremonyId.includes('reception')) {
    return eventDate;
  }
  
  // Walima - day after wedding for Muslim weddings
  if (eventType === 'walima' || ceremonyId.includes('walima')) {
    eventDate.setDate(weddingDate.getDate() + 1);
    return eventDate;
  }
  
  // Pre-wedding ceremonies with typical scheduling
  const preWeddingOffsets: Record<string, number> = {
    // 60 days before (engagement typically months before)
    'engagement': 60,
    'sikh_engagement_roka': 60,
    'roka': 60,
    
    // 7 days before
    'paath': 7,
    'sikh_paath': 7,
    'sagai': 7,
    
    // 3-4 days before
    'mehndi': 3,
    'hindu_mehndi': 3,
    'sikh_mehndi': 3,
    'muslim_mehndi': 3,
    'maiyan': 3,
    'sikh_maiyan': 3,
    'haldi': 2,
    'hindu_haldi': 2,
    'pithi': 3,
    'gujarati_pithi': 3,
    'dholki': 4,
    'muslim_dholki': 4,
    
    // 2 days before
    'sangeet': 2,
    'hindu_sangeet': 2,
    'sikh_sangeet': 2,
    'garba': 2,
    'gujarati_garba': 2,
    
    // 1 day before
    'baraat': 1,
    'hindu_baraat': 1,
    'milni': 1,
    'cocktail': 1,
    
    // Day after
    'day_after': -1, // Negative means after wedding
    'sikh_day_after': -1,
  };
  
  const offset = preWeddingOffsets[eventType] || preWeddingOffsets[ceremonyId] || 1;
  eventDate.setDate(weddingDate.getDate() - offset);
  return eventDate;
}

export async function registerWeddingRoutes(router: Router, storage: IStorage) {
  router.get("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const [ownedWeddings, collaboratorWeddings] = await Promise.all([
        storage.getWeddingsByUser(authReq.session.userId),
        storage.getWeddingsForCollaborator(authReq.session.userId),
      ]);
      
      const weddingMap = new Map();
      [...ownedWeddings, ...collaboratorWeddings].forEach((w) => {
        weddingMap.set(w.id, w);
      });
      
      res.json(Array.from(weddingMap.values()));
    } catch (error) {
      console.error("Error fetching weddings:", error);
      res.status(500).json({ error: "Failed to fetch weddings" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const wedding = await storage.getWedding(req.params.id);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json(wedding);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wedding" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const updateData: any = { ...req.body };
      
      if (updateData.weddingDate && typeof updateData.weddingDate === 'string') {
        updateData.weddingDate = new Date(updateData.weddingDate);
      }
      
      if (updateData.guestCountEstimate !== undefined) {
        updateData.guestCountEstimate = typeof updateData.guestCountEstimate === 'string' 
          ? parseInt(updateData.guestCountEstimate) 
          : updateData.guestCountEstimate;
      }
      
      const wedding = await storage.updateWedding(req.params.id, updateData);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      res.json(wedding);
    } catch (error) {
      console.error("Failed to update wedding:", error);
      res.status(500).json({ error: "Failed to update wedding" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertWeddingSchema.parse(req.body);
      const wedding = await storage.createWedding(validatedData);

      const { CEREMONY_CATALOG } = await import("../../shared/ceremonies");

      const customEvents = req.body.customEvents as Array<{
        ceremonyId: string;
        customName?: string;
        guestCount?: string;
      }> | undefined;

      if (customEvents && customEvents.length > 0) {
        for (let i = 0; i < customEvents.length; i++) {
          const customEvent = customEvents[i];
          const ceremony = CEREMONY_CATALOG.find(c => c.id === customEvent.ceremonyId);
          
          let eventName: string;
          let eventDescription: string;
          let eventType: string;
          
          if (customEvent.ceremonyId === "custom" && customEvent.customName) {
            eventName = customEvent.customName;
            eventDescription = "Custom event";
            eventType = "other";
          } else if (ceremony) {
            eventName = ceremony.name;
            eventDescription = ceremony.description;
            eventType = customEvent.ceremonyId.replace(/^(hindu_|sikh_|muslim_|gujarati_|south_indian_)/, "");
          } else {
            continue;
          }
          
          const guestCount = customEvent.guestCount && customEvent.guestCount !== "" 
            ? parseInt(customEvent.guestCount) 
            : (ceremony?.defaultGuests || undefined);
          
          // Calculate event date based on wedding date
          let eventDate: Date | undefined = undefined;
          if (wedding.weddingDate) {
            eventDate = calculateEventDate(
              new Date(wedding.weddingDate), 
              customEvent.ceremonyId, 
              eventType
            );
          }
          
          await storage.createEvent({
            weddingId: wedding.id,
            name: eventName,
            type: eventType as any,
            description: eventDescription,
            order: i + 1,
            guestCount: guestCount,
            date: eventDate,
          });
        }
      } else if (wedding.tradition === "sikh") {
        // Full Sikh wedding ceremony lineup with cost breakdown-matching names
        const sikhEvents = [
          {
            weddingId: wedding.id,
            name: "Engagement / Roka",
            type: "engagement" as const,
            description: "Formal engagement ceremony with gift exchange between families",
            order: 1,
            daysOffset: -60, // 2 months before
          },
          {
            weddingId: wedding.id,
            name: "Paath (Akhand Paath / Sehaj Paath)",
            type: "paath" as const,
            description: "Sacred prayer reading at Gurdwara or home",
            order: 2,
            daysOffset: -7,
          },
          {
            weddingId: wedding.id,
            name: "Mehndi",
            type: "mehndi" as const,
            description: "Henna application ceremony for the bride",
            order: 3,
            daysOffset: -3,
          },
          {
            weddingId: wedding.id,
            name: "Maiyan (Choora / Vatna)",
            type: "maiyan" as const,
            description: "Turmeric ceremony with choora (red bangles) for the bride",
            order: 4,
            daysOffset: -2,
          },
          {
            weddingId: wedding.id,
            name: "Sangeet",
            type: "sangeet" as const,
            description: "Musical night with performances and Bhangra dancing",
            order: 5,
            daysOffset: -1,
          },
          {
            weddingId: wedding.id,
            name: "Anand Karaj",
            type: "anand_karaj" as const,
            description: "Sikh wedding ceremony at the Gurdwara",
            order: 6,
            daysOffset: 0,
          },
          {
            weddingId: wedding.id,
            name: "Reception",
            type: "reception" as const,
            description: "Post-wedding celebration with dinner and entertainment",
            order: 7,
            daysOffset: 0,
          },
          {
            weddingId: wedding.id,
            name: "Day After Visit",
            type: "day_after" as const,
            description: "Post-wedding family visit and brunch",
            order: 8,
            daysOffset: 1,
          },
        ];

        const eventsWithDates = sikhEvents.map((event) => {
          const { daysOffset, ...eventData } = event;
          if (wedding.weddingDate) {
            const weddingDate = new Date(wedding.weddingDate);
            const eventDate = new Date(weddingDate);
            eventDate.setDate(weddingDate.getDate() + daysOffset);
            return { ...eventData, date: eventDate };
          }
          return eventData;
        });

        for (const eventData of eventsWithDates) {
          await storage.createEvent(eventData as any);
        }
      }

      if (wedding.totalBudget && parseFloat(wedding.totalBudget) > 0) {
        const totalBudget = parseFloat(wedding.totalBudget);
        const budgetAllocations = [
          { category: "catering", percentage: 40 },
          { category: "venue", percentage: 15 },
          { category: "entertainment", percentage: 12 },
          { category: "photography", percentage: 10 },
          { category: "decoration", percentage: 8 },
          { category: "attire", percentage: 8 },
          { category: "transportation", percentage: 4 },
          { category: "other", percentage: 3 },
        ];

        for (const allocation of budgetAllocations) {
          const allocatedAmount = ((totalBudget * allocation.percentage) / 100).toFixed(2);
          await storage.createBudgetCategory({
            weddingId: wedding.id,
            category: allocation.category,
            allocatedAmount,
            spentAmount: "0",
            percentage: allocation.percentage,
          });
        }
      }

      if (wedding.tradition) {
        const templates = await storage.getTaskTemplatesByTradition(wedding.tradition);
        
        for (const template of templates) {
          let dueDate: Date | undefined = undefined;
          
          if (wedding.weddingDate && template.daysBeforeWedding) {
            dueDate = calculateDueDate(new Date(wedding.weddingDate), template.daysBeforeWedding);
          }
          
          await storage.createTask({
            weddingId: wedding.id,
            title: template.title,
            description: template.description,
            category: template.category,
            priority: (template.priority as 'high' | 'medium' | 'low') || 'medium',
            dueDate: dueDate,
            phase: template.phase,
            completed: false,
            isAiRecommended: true,
            aiCategory: template.ceremony || template.category,
            aiReason: `Auto-generated task for ${wedding.tradition} wedding tradition`,
          });
        }
      }

      res.json(wedding);
    } catch (error) {
      console.error("Error creating wedding:", error);
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create wedding", message: error instanceof Error ? error.message : String(error) });
    }
  });

  // Duplicate household detection
  router.get("/:id/duplicate-households", await requireAuth(storage, false), async (req, res) => {
    try {
      const weddingId = req.params.id;
      const duplicates = await storage.detectDuplicateHouseholds(weddingId);
      res.json(duplicates);
    } catch (error) {
      console.error("Error detecting duplicate households:", error);
      res.status(500).json({ error: "Failed to detect duplicates" });
    }
  });
}
