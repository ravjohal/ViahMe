import { Router, Request, Response, NextFunction } from "express";
import type { IStorage } from "../storage";
import { insertCeremonyTypeSchema, insertRegionalPricingSchema, insertCeremonyBudgetCategorySchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

async function requireSiteAdmin(req: Request, res: Response, next: NextFunction, storage: IStorage) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUser(userId);
  if (!user || !user.isSiteAdmin) {
    return res.status(403).json({ error: "Site admin access required" });
  }
  
  next();
}

export function createCeremonyTypesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const types = await storage.getAllCeremonyTypes();
      res.json(types);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching all:", error);
      res.status(500).json({ error: "Failed to fetch ceremony types" });
    }
  });

  router.get("/tradition/:tradition", async (req, res) => {
    try {
      const { tradition } = req.params;
      // Resolve tradition slug to UUID and use FK-based query
      const traditionRecord = await storage.getWeddingTraditionBySlug(tradition);
      if (traditionRecord) {
        const types = await storage.getCeremonyTypesByTraditionId(traditionRecord.id);
        res.json(types);
      } else {
        // Fallback to legacy query for backward compatibility
        const types = await storage.getCeremonyTypesByTradition(tradition);
        res.json(types);
      }
    } catch (error) {
      console.error("[Ceremony Types] Error fetching by tradition:", error);
      res.status(500).json({ error: "Failed to fetch ceremony types" });
    }
  });

  // New UUID-based endpoint for direct traditionId lookups
  router.get("/tradition-id/:traditionId", async (req, res) => {
    try {
      const { traditionId } = req.params;
      const types = await storage.getCeremonyTypesByTraditionId(traditionId);
      res.json(types);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching by traditionId:", error);
      res.status(500).json({ error: "Failed to fetch ceremony types" });
    }
  });

  // Library endpoint - returns all unique system budget items for the library picker
  // Used when couples want to add items from other ceremonies to their ceremony
  router.get("/library", async (req, res) => {
    try {
      // Get all system items (weddingId is NULL)
      const allSystemItems = await storage.getAllCeremonyBudgetCategories();
      
      // Get all ceremony types for enriching items with ceremony names
      // Create maps by both UUID and slug for backward compatibility
      const ceremonyTypes = await storage.getAllCeremonyTypes();
      const ceremonyTypeMapByUuid = new Map(ceremonyTypes.map(t => [t.id, t]));
      const ceremonyTypeMapBySlug = new Map(ceremonyTypes.map(t => [t.ceremonyId, t]));
      
      // Dedupe by itemName + budgetBucketId to get unique items across all ceremonies
      // Track which ceremonies each item appears in
      const uniqueItemsMap = new Map<string, {
        id: string;
        itemName: string;
        budgetBucketId: string;
        lowCost: number;
        highCost: number;
        unit: string;
        hoursLow?: number;
        hoursHigh?: number;
        notes?: string;
        ceremonies: Array<{ ceremonyId: string; ceremonyTypeId: string; ceremonyName: string; tradition: string }>;
      }>();
      
      for (const item of allSystemItems) {
        // Use itemName + budgetBucketId as composite key for deduplication
        const key = `${item.itemName.toLowerCase().trim()}|${item.budgetBucketId}`;
        
        // ceremonyTypeId is now the UUID FK (after column rename)
        const ceremonyType = ceremonyTypeMapByUuid.get(item.ceremonyTypeId) 
          || ceremonyTypeMapBySlug.get(item.ceremonyTypeId);
        const ceremonyInfo = {
          ceremonyId: ceremonyType?.ceremonyId || item.ceremonyTypeId,
          ceremonyTypeId: ceremonyType?.id || item.ceremonyTypeId,
          ceremonyName: ceremonyType?.name || item.ceremonyTypeId,
          tradition: ceremonyType?.tradition || 'general',
        };
        
        if (uniqueItemsMap.has(key)) {
          // Add ceremony to existing item's ceremony list
          const existing = uniqueItemsMap.get(key)!;
          const alreadyHasCeremony = existing.ceremonies.some(c => c.ceremonyId === ceremonyInfo.ceremonyId);
          if (!alreadyHasCeremony) {
            existing.ceremonies.push(ceremonyInfo);
          }
        } else {
          // Create new unique item entry
          uniqueItemsMap.set(key, {
            id: item.id,
            itemName: item.itemName,
            budgetBucketId: item.budgetBucketId,
            lowCost: parseFloat(item.lowCost),
            highCost: parseFloat(item.highCost),
            unit: item.unit,
            hoursLow: item.hoursLow ? parseFloat(item.hoursLow) : undefined,
            hoursHigh: item.hoursHigh ? parseFloat(item.hoursHigh) : undefined,
            notes: item.notes ?? undefined,
            ceremonies: [ceremonyInfo],
          });
        }
      }
      
      // Convert to array and group by budget bucket
      const items = Array.from(uniqueItemsMap.values());
      
      // Group by bucket for frontend convenience
      const groupedByBucket: Record<string, typeof items> = {};
      for (const item of items) {
        const bucket = item.budgetBucketId || 'other';
        if (!groupedByBucket[bucket]) {
          groupedByBucket[bucket] = [];
        }
        groupedByBucket[bucket].push(item);
      }
      
      // Sort items within each bucket alphabetically
      for (const bucket of Object.keys(groupedByBucket)) {
        groupedByBucket[bucket].sort((a, b) => a.itemName.localeCompare(b.itemName));
      }
      
      res.json({
        items,
        groupedByBucket,
        totalCount: items.length,
      });
    } catch (error) {
      console.error("[Ceremony Types] Error fetching library:", error);
      res.status(500).json({ error: "Failed to fetch budget item library" });
    }
  });

  // Line items endpoint - optionally accepts weddingId to include wedding-specific custom items
  // Returns a map of ceremonyTypeId -> line items[] 
  router.get("/all/line-items", async (req, res) => {
    try {
      const { weddingId } = req.query;
      const userId = req.session?.userId;
      
      // Get all system items first
      const allItems = await storage.getAllCeremonyBudgetCategories();
      
      // If weddingId provided, also fetch wedding-specific custom items
      let customItems: typeof allItems = [];
      if (weddingId && typeof weddingId === 'string') {
        // Validate wedding access
        if (!userId) {
          return res.status(401).json({ error: "Authentication required to view custom items" });
        }
        
        const wedding = await storage.getWedding(weddingId);
        if (!wedding) {
          return res.status(404).json({ error: "Wedding not found" });
        }
        
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "You don't have access to this wedding" });
        }
        
        // Fetch wedding-specific items (weddingId column is set)
        const allWeddingItems = await storage.getAllCeremonyBudgetCategoriesForWedding(weddingId);
        customItems = allWeddingItems;
      }
      
      // Combine system items + custom items
      const combinedItems = [...allItems, ...customItems];
      
      const grouped: Record<string, Array<{
        id: string;
        category: string;
        lowCost: number;
        highCost: number;
        unit: 'fixed' | 'per_person' | 'per_hour';
        hoursLow?: number;
        hoursHigh?: number;
        notes?: string;
        budgetBucket?: string;
        budgetBucketId?: string;
        isCustom?: boolean;
      }>> = {};
      
      for (const item of combinedItems) {
        const key = item.ceremonyTypeId;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        const bucketId = item.budgetBucketId ?? 'other';
        grouped[key].push({
          id: item.id, // Include id so custom items can be deleted
          category: item.itemName,
          lowCost: parseFloat(item.lowCost),
          highCost: parseFloat(item.highCost),
          unit: item.unit as 'fixed' | 'per_person' | 'per_hour',
          hoursLow: item.hoursLow ? parseFloat(item.hoursLow) : undefined,
          hoursHigh: item.hoursHigh ? parseFloat(item.hoursHigh) : undefined,
          notes: item.notes ?? undefined,
          budgetBucket: bucketId,
          budgetBucketId: bucketId,
          isCustom: !!item.weddingId,
        });
      }
      
      res.json(grouped);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching all line items:", error);
      res.status(500).json({ error: "Failed to fetch all ceremony line items" });
    }
  });

  router.get("/:ceremonyId", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }
      res.json(type);
    } catch (error) {
      console.error("[Ceremony Types] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch ceremony type" });
    }
  });

  router.get("/:ceremonyId/line-items", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const { weddingId } = req.query; // Optional: include wedding-specific items
      const userId = req.session?.userId;
      
      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }
      
      // If weddingId is provided, verify the user has access to that wedding
      let validatedWeddingId: string | undefined = undefined;
      if (typeof weddingId === 'string' && weddingId) {
        if (!userId) {
          return res.status(401).json({ error: "Authentication required to view wedding-specific items" });
        }
        
        const wedding = await storage.getWedding(weddingId);
        if (!wedding) {
          return res.status(404).json({ error: "Wedding not found" });
        }
        
        const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!permissions.isOwner && permissions.permissions.size === 0) {
          return res.status(403).json({ error: "You don't have access to this wedding" });
        }
        
        validatedWeddingId = weddingId;
      }
      
      // Pass validated weddingId to get system templates + wedding-specific custom items
      // type.id is the UUID FK (ceremony_type_id column)
      const budgetCategories = await storage.getCeremonyBudgetCategoriesByCeremonyTypeId(
        type.id, 
        validatedWeddingId
      );
      
      const lineItems = budgetCategories.map(item => ({
        id: item.id,
        name: item.itemName,
        budgetBucketId: item.budgetBucketId || 'other',
        lowCost: parseFloat(item.lowCost),
        highCost: parseFloat(item.highCost),
        unit: item.unit,
        hoursLow: item.hoursLow ? parseFloat(item.hoursLow) : undefined,
        hoursHigh: item.hoursHigh ? parseFloat(item.hoursHigh) : undefined,
        notes: item.notes,
        weddingId: item.weddingId, // Include to identify custom vs system items
        isCustom: !!item.weddingId, // Convenience flag for frontend
      }));
      
      res.json({
        ceremonyId: type.ceremonyId,
        ceremonyName: type.name,
        tradition: type.tradition,
        lineItems,
      });
    } catch (error) {
      console.error("[Ceremony Types] Error fetching line items:", error);
      res.status(500).json({ error: "Failed to fetch ceremony line items" });
    }
  });

  // Create a custom ceremony budget category for a specific wedding
  // Two modes: 
  // 1. Clone from library: provide sourceCategoryId to clone an existing system item
  // 2. Create new: provide itemName, budgetBucketId, amount for fully custom item
  router.post("/:ceremonyId/line-items", async (req, res) => {
    try {
      const { ceremonyId } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }
      
      // Validate request body - weddingId is required for custom items
      const { weddingId, amount, itemName, budgetBucketId, notes, sourceCategoryId } = req.body;
      if (!weddingId) {
        return res.status(400).json({ error: "weddingId is required for custom items" });
      }
      
      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!permissions.isOwner && permissions.permissions.size === 0) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      let finalItemName: string;
      let finalBudgetBucketId: string;
      let finalSourceCategoryId: string | null = null;
      let finalLowCost: string;
      let finalHighCost: string;
      let finalUnit: string = 'fixed';
      let finalHoursLow: string | null = null;
      let finalHoursHigh: string | null = null;
      let finalNotes: string | null = notes || null;
      
      // Mode 1: Import from library item (with optional overrides)
      // If sourceCategoryId is provided, start with source data then apply any overrides
      if (sourceCategoryId && typeof sourceCategoryId === 'string') {
        // Fetch the source library item
        const sourceItem = await storage.getCeremonyBudgetCategory(sourceCategoryId);
        if (!sourceItem) {
          return res.status(404).json({ error: "Source library item not found" });
        }
        if (sourceItem.weddingId) {
          return res.status(400).json({ error: "Can only import from system library items" });
        }
        
        // Check if this item already exists for this wedding+ceremony combination
        const existingItems = await storage.getAllCeremonyBudgetCategoriesForWedding(weddingId);
        const duplicate = existingItems.find(
          item => item.ceremonyTypeId === type.id && 
                  item.sourceCategoryId === sourceCategoryId
        );
        if (duplicate) {
          return res.status(409).json({ 
            error: "This item already exists for this ceremony",
            existingItemId: duplicate.id 
          });
        }
        
        // Start with source data
        finalSourceCategoryId = sourceCategoryId;
        finalHoursLow = sourceItem.hoursLow;
        finalHoursHigh = sourceItem.hoursHigh;
        
        // Allow user overrides for name, bucket, and amount
        // If user provides values, use those; otherwise use source values
        finalItemName = (itemName && typeof itemName === 'string' && itemName.trim()) 
          ? itemName.trim() 
          : sourceItem.itemName;
        finalBudgetBucketId = (budgetBucketId && typeof budgetBucketId === 'string') 
          ? budgetBucketId 
          : sourceItem.budgetBucketId;
        
        // For amount: if user provides, use as fixed low=high; otherwise inherit source range
        if (amount && !isNaN(parseFloat(amount))) {
          finalLowCost = amount.toString();
          finalHighCost = amount.toString();
          finalUnit = 'fixed';
        } else {
          finalLowCost = sourceItem.lowCost;
          finalHighCost = sourceItem.highCost;
          finalUnit = sourceItem.unit;
        }
        
        finalNotes = notes || sourceItem.notes || null;
      } else {
        // Mode 2: Create fully custom item - requires all fields
        if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
          return res.status(400).json({ error: "itemName is required for custom items" });
        }
        if (!budgetBucketId || typeof budgetBucketId !== 'string') {
          return res.status(400).json({ error: "budgetBucketId is required for custom items" });
        }
        if (!amount || isNaN(parseFloat(amount))) {
          return res.status(400).json({ error: "amount is required for custom items" });
        }
        finalItemName = itemName.trim();
        finalBudgetBucketId = budgetBucketId;
        // Custom items: store amount as both lowCost and highCost with unit='fixed'
        finalLowCost = amount.toString();
        finalHighCost = amount.toString();
      }
      
      // Build the data object, only including hours if they have values
      const insertData: Record<string, any> = {
        itemName: finalItemName,
        budgetBucketId: finalBudgetBucketId,
        lowCost: finalLowCost,
        highCost: finalHighCost,
        unit: finalUnit,
        notes: finalNotes,
        ceremonyTypeId: type.id, // UUID FK to ceremony_types.id
        weddingId,
        sourceCategoryId: finalSourceCategoryId,
      };
      
      // Only include hours fields if they have actual values (not null/undefined)
      if (finalHoursLow !== null && finalHoursLow !== undefined) {
        insertData.hoursLow = finalHoursLow;
      }
      if (finalHoursHigh !== null && finalHoursHigh !== undefined) {
        insertData.hoursHigh = finalHoursHigh;
      }
      
      const validatedData = insertCeremonyBudgetCategorySchema.parse(insertData);
      
      const newItem = await storage.createCeremonyBudgetCategory(validatedData);
      
      res.status(201).json({
        id: newItem.id,
        name: newItem.itemName,
        budgetBucketId: newItem.budgetBucketId || 'other',
        lowCost: parseFloat(newItem.lowCost),
        highCost: parseFloat(newItem.highCost),
        unit: newItem.unit,
        notes: newItem.notes,
        weddingId: newItem.weddingId,
        sourceCategoryId: newItem.sourceCategoryId,
        isCustom: true,
        isFromLibrary: !!newItem.sourceCategoryId,
      });
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error("[Ceremony Types] Error creating custom line item:", error);
      res.status(500).json({ error: "Failed to create custom line item" });
    }
  });

  // Delete a custom ceremony budget category (wedding-specific items only)
  router.delete("/:ceremonyId/line-items/:itemId", async (req, res) => {
    try {
      const { ceremonyId, itemId } = req.params;
      const userId = req.session?.userId;
      const { weddingId } = req.query;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!weddingId || typeof weddingId !== 'string') {
        return res.status(400).json({ error: "weddingId query parameter is required" });
      }
      
      // Verify user has access to this wedding
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const permissions = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!permissions.isOwner && permissions.permissions.size === 0) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      // Get the item to verify it belongs to this wedding
      const item = await storage.getCeremonyBudgetCategory(itemId);
      if (!item) {
        return res.status(404).json({ error: "Budget item not found" });
      }
      
      // Only allow deleting wedding-specific custom items
      if (!item.weddingId) {
        return res.status(403).json({ error: "Cannot delete system library items" });
      }
      
      // Verify the item belongs to the specified wedding
      if (item.weddingId !== weddingId) {
        return res.status(403).json({ error: "Budget item does not belong to this wedding" });
      }
      
      // Verify the item belongs to the specified ceremony
      if (item.ceremonyTypeId !== ceremonyId) {
        return res.status(400).json({ error: "Budget item does not belong to this ceremony" });
      }
      
      // Delete the item
      await storage.deleteCeremonyBudgetCategory(itemId);
      
      res.json({ success: true, deletedId: itemId });
    } catch (error) {
      console.error("[Ceremony Types] Error deleting custom line item:", error);
      res.status(500).json({ error: "Failed to delete custom line item" });
    }
  });

  router.post("/", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const validatedData = insertCeremonyTypeSchema.parse(req.body);
        const type = await storage.createCeremonyType(validatedData);
        res.json(type);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Ceremony Types] Error creating:", error);
        res.status(500).json({ error: "Failed to create ceremony type" });
      }
    }, storage);
  });

  router.patch("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        const type = await storage.updateCeremonyType(ceremonyId, req.body);
        if (!type) {
          return res.status(404).json({ error: "Ceremony type not found" });
        }
        res.json(type);
      } catch (error) {
        console.error("[Ceremony Types] Error updating:", error);
        res.status(500).json({ error: "Failed to update ceremony type" });
      }
    }, storage);
  });

  router.delete("/:ceremonyId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        await storage.deleteCeremonyType(ceremonyId);
        res.json({ success: true });
      } catch (error) {
        console.error("[Ceremony Types] Error deleting:", error);
        res.status(500).json({ error: "Failed to delete ceremony type" });
      }
    }, storage);
  });

  // ADMIN: Create system-level ceremony budget category (weddingId = null)
  router.post("/:ceremonyId/budget-categories", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId } = req.params;
        
        // Verify ceremony type exists
        const type = await storage.getCeremonyType(ceremonyId);
        if (!type) {
          return res.status(404).json({ error: "Ceremony type not found" });
        }
        
        const { itemName, budgetBucketId, lowCost, highCost, unit, hoursLow, hoursHigh, notes, displayOrder } = req.body;
        
        if (!itemName || !budgetBucketId || !lowCost || !highCost || !unit) {
          return res.status(400).json({ error: "itemName, budgetBucketId, lowCost, highCost, and unit are required" });
        }
        
        const insertData = {
          weddingId: null, // System template (not wedding-specific)
          ceremonyTypeId: ceremonyId,
          budgetBucketId,
          itemName,
          lowCost: lowCost.toString(),
          highCost: highCost.toString(),
          unit,
          hoursLow: hoursLow?.toString() || null,
          hoursHigh: hoursHigh?.toString() || null,
          notes: notes || null,
          displayOrder: displayOrder || 0,
        };
        
        const validatedData = insertCeremonyBudgetCategorySchema.parse(insertData);
        const newItem = await storage.createCeremonyBudgetCategory(validatedData);
        
        res.status(201).json(newItem);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Ceremony Types] Error creating budget category:", error);
        res.status(500).json({ error: "Failed to create ceremony budget category" });
      }
    }, storage);
  });

  // ADMIN: Update system-level ceremony budget category
  router.patch("/:ceremonyId/budget-categories/:categoryId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId, categoryId } = req.params;
        
        // Verify the item exists and is a system template
        const item = await storage.getCeremonyBudgetCategory(categoryId);
        if (!item) {
          return res.status(404).json({ error: "Budget category not found" });
        }
        if (item.weddingId) {
          return res.status(403).json({ error: "Cannot edit wedding-specific items through admin route" });
        }
        if (item.ceremonyTypeId !== ceremonyId) {
          return res.status(400).json({ error: "Budget category does not belong to this ceremony" });
        }
        
        const updatedItem = await storage.updateCeremonyBudgetCategory(categoryId, req.body);
        res.json(updatedItem);
      } catch (error) {
        console.error("[Ceremony Types] Error updating budget category:", error);
        res.status(500).json({ error: "Failed to update ceremony budget category" });
      }
    }, storage);
  });

  // ADMIN: Delete system-level ceremony budget category
  router.delete("/:ceremonyId/budget-categories/:categoryId", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { ceremonyId, categoryId } = req.params;
        
        // Verify the item exists and is a system template
        const item = await storage.getCeremonyBudgetCategory(categoryId);
        if (!item) {
          return res.status(404).json({ error: "Budget category not found" });
        }
        if (item.weddingId) {
          return res.status(403).json({ error: "Cannot delete wedding-specific items through admin route" });
        }
        if (item.ceremonyTypeId !== ceremonyId) {
          return res.status(400).json({ error: "Budget category does not belong to this ceremony" });
        }
        
        await storage.deleteCeremonyBudgetCategory(categoryId);
        res.json({ success: true });
      } catch (error) {
        console.error("[Ceremony Types] Error deleting budget category:", error);
        res.status(500).json({ error: "Failed to delete ceremony budget category" });
      }
    }, storage);
  });

  return router;
}


export function createRegionalPricingRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const pricing = await storage.getAllRegionalPricing();
      res.json(pricing);
    } catch (error) {
      console.error("[Regional Pricing] Error fetching all:", error);
      res.status(500).json({ error: "Failed to fetch regional pricing" });
    }
  });

  router.get("/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const pricing = await storage.getRegionalPricing(city);
      if (!pricing) {
        return res.status(404).json({ error: "Regional pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("[Regional Pricing] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch regional pricing" });
    }
  });

  router.post("/", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const validatedData = insertRegionalPricingSchema.parse(req.body);
        const pricing = await storage.createRegionalPricing(validatedData);
        res.json(pricing);
      } catch (error) {
        if (error instanceof Error && "issues" in error) {
          return res.status(400).json({ error: "Validation failed", details: error });
        }
        console.error("[Regional Pricing] Error creating:", error);
        res.status(500).json({ error: "Failed to create regional pricing" });
      }
    }, storage);
  });

  router.patch("/:city", async (req, res, next) => {
    await requireSiteAdmin(req, res, async () => {
      try {
        const { city } = req.params;
        const pricing = await storage.updateRegionalPricing(city, req.body);
        if (!pricing) {
          return res.status(404).json({ error: "Regional pricing not found" });
        }
        res.json(pricing);
      } catch (error) {
        console.error("[Regional Pricing] Error updating:", error);
        res.status(500).json({ error: "Failed to update regional pricing" });
      }
    }, storage);
  });

  return router;
}

export function createCeremonyEstimateRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { tradition, ceremonyId, guestCount, city } = req.body;

      if (!tradition || !ceremonyId || !guestCount) {
        return res.status(400).json({ error: "tradition, ceremonyId, and guestCount are required" });
      }

      const type = await storage.getCeremonyType(ceremonyId);
      if (!type) {
        return res.status(404).json({ error: "Ceremony type not found" });
      }

      let multiplier = 1.0;
      if (city) {
        const pricing = await storage.getRegionalPricing(city);
        if (pricing) {
          multiplier = parseFloat(pricing.multiplier);
        }
      }

      const typeItems = await storage.getCeremonyTypeItems(ceremonyId);

      let totalLow = 0;
      let totalHigh = 0;
      const categoryEstimates: Array<{
        category: string;
        lowCost: number;
        highCost: number;
        notes?: string;
        budgetBucket?: string;
      }> = [];

      for (const item of typeItems) {
        let itemLow = parseFloat(item.lowCost);
        let itemHigh = parseFloat(item.highCost);

        if (item.unit === 'per_person') {
          itemLow *= guestCount;
          itemHigh *= guestCount;
        } else if (item.unit === 'per_hour') {
          const hoursLow = item.hoursLow ? parseFloat(item.hoursLow) : 1;
          const hoursHigh = item.hoursHigh ? parseFloat(item.hoursHigh) : hoursLow;
          itemLow *= hoursLow;
          itemHigh *= hoursHigh;
        }

        itemLow *= multiplier;
        itemHigh *= multiplier;

        totalLow += itemLow;
        totalHigh += itemHigh;

        categoryEstimates.push({
          category: item.itemName,
          lowCost: Math.round(itemLow),
          highCost: Math.round(itemHigh),
          notes: item.notes || undefined,
          budgetBucket: item.budgetBucket,
        });
      }

      res.json({
        ceremonyId,
        ceremonyName: type.name,
        tradition,
        guestCount,
        city: city || 'default',
        multiplier,
        totalLow: Math.round(totalLow),
        totalHigh: Math.round(totalHigh),
        costPerGuestLow: Math.round(totalLow / guestCount),
        costPerGuestHigh: Math.round(totalHigh / guestCount),
        breakdown: categoryEstimates,
      });
    } catch (error) {
      console.error("[Ceremony Estimate] Error:", error);
      res.status(500).json({ error: "Failed to calculate ceremony estimate" });
    }
  });

  return router;
}
