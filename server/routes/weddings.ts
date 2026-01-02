import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertWeddingSchema } from "@shared/schema";

function calculateDueDate(weddingDate: Date, daysBeforeWedding: number): Date {
  const dueDate = new Date(weddingDate);
  dueDate.setDate(dueDate.getDate() - daysBeforeWedding);
  return dueDate;
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
          
          await storage.createEvent({
            weddingId: wedding.id,
            name: eventName,
            type: eventType as any,
            description: eventDescription,
            order: i + 1,
            guestCount: guestCount,
          });
        }
      } else if (wedding.tradition === "sikh") {
        const sikhEvents = [
          {
            weddingId: wedding.id,
            name: "Paath",
            type: "paath" as const,
            description: "3-day prayer ceremony at home or Gurdwara",
            order: 1,
          },
          {
            weddingId: wedding.id,
            name: "Mehndi",
            type: "mehndi" as const,
            description: "Henna ceremony with close family and friends",
            order: 2,
          },
          {
            weddingId: wedding.id,
            name: "Maiyan",
            type: "maiyan" as const,
            description: "Traditional turmeric ceremony",
            order: 3,
          },
          {
            weddingId: wedding.id,
            name: "Lady Sangeet",
            type: "sangeet" as const,
            description: "Grand celebration with music and dance",
            order: 4,
          },
          {
            weddingId: wedding.id,
            name: "Anand Karaj",
            type: "anand_karaj" as const,
            description: "Sacred Sikh wedding ceremony at Gurdwara",
            order: 5,
          },
          {
            weddingId: wedding.id,
            name: "Reception",
            type: "reception" as const,
            description: "Grand celebration with all guests",
            order: 6,
          },
        ];

        const eventsWithDates = sikhEvents.map((event) => {
          if (wedding.weddingDate) {
            const weddingDate = new Date(wedding.weddingDate);
            let eventDate = new Date(weddingDate);
            
            if (event.type === "paath") {
              eventDate.setDate(weddingDate.getDate() - 7);
            } else if (event.type === "mehndi") {
              eventDate.setDate(weddingDate.getDate() - 3);
            } else if (event.type === "maiyan") {
              eventDate.setDate(weddingDate.getDate() - 3);
            } else if (event.type === "sangeet") {
              eventDate.setDate(weddingDate.getDate() - 2);
            } else if (event.type === "anand_karaj") {
              eventDate = weddingDate;
            } else if (event.type === "reception") {
              eventDate = weddingDate;
            }
            
            return { ...event, date: eventDate };
          }
          return event;
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
