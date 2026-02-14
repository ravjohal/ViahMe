import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertVendorSchema, insertBookingSchema, insertServicePackageSchema, insertReviewSchema, coupleSubmitVendorSchema, type Vendor, type InsertVendor } from "@shared/schema";
import { ensureVendorAccess } from "./middleware";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "../email";
import { detectVendorDuplicates } from "../services/duplicate-detector";

import { METRO_CITY_MAP, extractCityFromLocation } from "../utils/metro-detection";
import { resolveMetroFromLocationSync } from "../utils/metro-resolver";

export async function registerVendorRoutes(router: Router, storage: IStorage) {
  router.get("/metro-city-stats", async (req, res) => {
    try {
      const allVendors = await storage.getAllVendors();
      const published = allVendors.filter(v => v.approvalStatus === 'approved' && v.isPublished);

      const stats: Record<string, { total: number; cities: Record<string, number> }> = {};

      for (const vendor of published) {
        const metro = vendor.city || resolveMetroFromLocationSync(vendor.location || '') || 'Other';
        if (!stats[metro]) stats[metro] = { total: 0, cities: {} };
        stats[metro].total++;

        const extractedCity = extractCityFromLocation(vendor.location || '');
        if (extractedCity) {
          const cleanCity = extractedCity.replace(/\s+(BC|ON|CA|NY|NJ|IL|WA|TX|MA|GA|PA|MI|AZ|FL|DC)$/i, '').trim();
          if (cleanCity && cleanCity !== metro) {
            stats[metro].cities[cleanCity] = (stats[metro].cities[cleanCity] || 0) + 1;
          }
        }
      }

      const result = Object.entries(stats)
        .map(([metro, data]) => ({
          metro,
          total: data.total,
          cities: Object.entries(data.cities)
            .map(([city, count]) => ({ city, count }))
            .filter(c => c.count >= 2)
            .sort((a, b) => b.count - a.count)
            .slice(0, 20),
        }))
        .sort((a, b) => b.total - a.total);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const { category, location, includeUnpublished, includeAllApproval, page, pageSize } = req.query;

      // Check if user is authenticated via express-session
      const isAuthenticated = !!(req.session as any)?.userId;

      let vendors = await storage.getAllVendors();

      if (includeAllApproval !== "true") {
        vendors = vendors.filter((v) => v.approvalStatus === 'approved');
      }

      if (includeUnpublished !== "true") {
        vendors = vendors.filter((v) => v.isPublished === true);
      }

      vendors = vendors.map(v => {
        if (!v.city || !METRO_CITY_MAP[v.city]) {
          const resolved = resolveMetroFromLocationSync(v.location || '');
          if (resolved) return { ...v, city: resolved };
        }
        return v;
      });

      if (category && typeof category === "string") {
        vendors = vendors.filter((v) => v.categories?.includes(category));
      }

      if (location && typeof location === "string") {
        vendors = vendors.filter((v) =>
          v.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      const totalInSystem = vendors.length;

      // For unauthenticated users, limit to 3 vendors per metro area
      if (!isAuthenticated) {
        const VENDORS_PER_METRO_UNAUTHENTICATED = 3;
        const vendorsByMetro = new Map<string, typeof vendors>();
        
        for (const vendor of vendors) {
          const metro = vendor.city || 'Other';
          if (!vendorsByMetro.has(metro)) {
            vendorsByMetro.set(metro, []);
          }
          const metroVendors = vendorsByMetro.get(metro)!;
          if (metroVendors.length < VENDORS_PER_METRO_UNAUTHENTICATED) {
            metroVendors.push(vendor);
          }
        }
        
        vendors = Array.from(vendorsByMetro.values()).flat();
      }

      // If pagination params provided, return paginated response
      if (page && pageSize) {
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const size = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
        const total = vendors.length;
        const totalPages = Math.ceil(total / size);
        const startIndex = (pageNum - 1) * size;
        const paginatedVendors = vendors.slice(startIndex, startIndex + size);

        return res.json({
          data: paginatedVendors,
          page: pageNum,
          pageSize: size,
          total,
          totalPages,
          limitedPreview: !isAuthenticated,
          totalInSystem: !isAuthenticated ? totalInSystem : undefined,
        });
      }

      // Default: return all vendors (backward compatible)
      if (!isAuthenticated) {
        res.json({ data: vendors, totalInSystem, limitedPreview: true });
      } else {
        res.json(vendors);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  router.get("/me", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === authReq.session.userId);
      
      if (!userVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      res.json(userVendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor profile" });
    }
  });

  router.get("/unclaimed", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (!search || typeof search !== "string" || search.length < 2) {
        return res.json([]);
      }
      
      const allVendors = await storage.getAllVendors();
      
      const unclaimedVendors = allVendors.filter(v => {
        if (v.claimed !== false) return false;
        if (!v.email && !v.phone) return false;
        
        const searchLower = search.toLowerCase();
        const categoryMatch = v.categories?.some(cat => cat.toLowerCase().includes(searchLower)) || false;
        return (
          v.name.toLowerCase().includes(searchLower) ||
          v.location.toLowerCase().includes(searchLower) ||
          categoryMatch
        );
      });
      
      const maskEmail = (email: string | null): string | null => {
        if (!email) return null;
        const [local, domain] = email.split('@');
        if (!domain) return '***@***.***';
        const maskedLocal = local.length > 2 ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : '***';
        return `${maskedLocal}@${domain}`;
      };
      
      const maskPhone = (phone: string | null): string | null => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 4) return '***-***-****';
        return `***-***-${digits.slice(-4)}`;
      };
      
      const sanitizedVendors = unclaimedVendors.slice(0, 20).map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        categories: v.categories,
        location: v.location,
        city: v.city,
        priceRange: v.priceRange,
        rating: v.rating,
        claimed: v.claimed,
        email: maskEmail(v.email),
        phone: maskPhone(v.phone),
        hasEmail: !!v.email,
        hasPhone: !!v.phone,
      }));
      
      res.json(sanitizedVendors);
    } catch (error) {
      console.error("Error searching unclaimed vendors:", error);
      res.status(500).json({ error: "Failed to search vendors" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      await storage.incrementVendorViewCount(req.params.id);
      
      if (!vendor.claimed && vendor.phone && !vendor.optedOutOfNotifications) {
        const now = new Date();
        const cooldownUntil = vendor.notifyCooldownUntil ? new Date(vendor.notifyCooldownUntil) : null;
        
        if (!cooldownUntil || now > cooldownUntil) {
          storage.queueClaimNotification(req.params.id).catch(err => {
            console.error("Failed to queue claim notification:", err);
          });
        }
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertVendorSchema.parse({
        ...req.body,
        userId: authReq.session.userId,
      });
      
      const vendor = await storage.createVendor(validatedData);
      res.json(vendor);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      if (vendor.userId !== authReq.session.userId) {
        const teammates = await storage.getVendorTeammates(req.params.id);
        const isTeammate = teammates.some(t => t.userId === authReq.session.userId);
        if (!isTeammate) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const updateData = { ...req.body };
      if (updateData.areasServed && Array.isArray(updateData.areasServed)) {
        const { resolveAreasServed } = await import("../utils/metro-resolver");
        updateData.areasServed = await resolveAreasServed(storage, updateData.areasServed, updateData.customCity);
        if (updateData.areasServed.length > 0) {
          updateData.city = updateData.areasServed[0];
        }
      }
      delete updateData.customCity;
      const updatedVendor = await storage.updateVendor(req.params.id, updateData);
      res.json(updatedVendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  router.get("/favorites/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const weddingId = req.params.weddingId;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding's favorites" });
      }
      
      const favorites = await storage.getVendorFavoritesByWedding(weddingId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching vendor favorites:", error);
      res.status(500).json({ error: "Failed to fetch vendor favorites" });
    }
  });

  router.post("/favorites", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { weddingId, vendorId, notes } = req.body;
      
      if (!weddingId || !vendorId) {
        return res.status(400).json({ error: "Wedding ID and Vendor ID are required" });
      }
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      const existing = await storage.getVendorFavorite(weddingId, vendorId);
      if (existing) {
        return res.status(400).json({ error: "Vendor is already in favorites" });
      }
      
      const favorite = await storage.addVendorFavorite({ weddingId, vendorId, notes });
      res.json(favorite);
    } catch (error) {
      console.error("Error adding vendor favorite:", error);
      res.status(500).json({ error: "Failed to add vendor to favorites" });
    }
  });

  router.delete("/favorites/:weddingId/:vendorId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { weddingId, vendorId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const isOwner = wedding.userId === authReq.user?.id;
      const isCollaborator = authReq.user ? await storage.isWeddingCollaborator(weddingId, authReq.user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "You don't have access to this wedding" });
      }
      
      await storage.removeVendorFavorite(weddingId, vendorId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing vendor favorite:", error);
      res.status(500).json({ error: "Failed to remove vendor from favorites" });
    }
  });

  router.get("/bookings/wedding/:weddingId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const weddingId = req.params.weddingId;

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const bookings = await storage.getBookingsByWedding(weddingId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  router.get("/bookings/vendor/:vendorId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      if (authReq.user?.role === 'vendor') {
        const vendors = await storage.getAllVendors();
        const userVendor = vendors.find((v: Vendor) => v.userId === authReq.user?.id);
        if (!userVendor || userVendor.id !== req.params.vendorId) {
          return res.status(403).json({ error: "You can only view bookings for your own vendor profile" });
        }
      }
      
      const bookings = await storage.getBookingsByVendor(req.params.vendorId);
      res.json(bookings || []);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ error: "Failed to fetch vendor bookings" });
    }
  });

  router.post("/bookings", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertBookingSchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(validatedData.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const booking = await storage.createBooking(validatedData);
      res.json(booking);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  router.patch("/bookings/:id", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingBooking = await storage.getBooking(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const wedding = await storage.getWedding(existingBooking.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      if (wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(existingBooking.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const booking = await storage.updateBooking(req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  router.get("/packages/:vendorId", async (req, res) => {
    try {
      const packages = await storage.getServicePackagesByVendor(req.params.vendorId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service packages" });
    }
  });

  router.post("/packages", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertServicePackageSchema.parse(req.body);
      
      const vendor = await storage.getVendor(validatedData.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      if (vendor.userId !== authReq.session.userId) {
        const teammates = await storage.getVendorTeammates(validatedData.vendorId);
        const isTeammate = teammates.some(t => t.userId === authReq.session.userId);
        if (!isTeammate) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const pkg = await storage.createServicePackage(validatedData);
      res.json(pkg);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create service package" });
    }
  });

  router.get("/reviews/:vendorId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByVendor(req.params.vendorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  router.post("/reviews", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertReviewSchema.parse({
        ...req.body,
        createdById: authReq.session.userId,
      });
      
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  router.get("/availability/:vendorId", async (req, res) => {
    try {
      const availability = await storage.getVendorAvailability(req.params.vendorId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor availability" });
    }
  });

  router.post("/submit", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (authReq.user.role !== "couple") {
        return res.status(403).json({ error: "Only couples can submit vendor profiles" });
      }
      
      const validatedData = coupleSubmitVendorSchema.parse(req.body);
      
      // Fetch the couple's wedding to get their tradition
      const weddings = await storage.getWeddingsByUser(authReq.user.id);
      const coupleWedding = weddings[0]; // Get first wedding
      const coupleTradition = coupleWedding?.tradition || null;
      
      // Check for forced creation (user chose to create despite potential matches)
      const forceCreate = req.body.forceCreate === true;
      
      if (!forceCreate) {
        // Check for duplicates against approved vendors only
        const allVendors = await storage.getAllVendors();
        const existingVendors = allVendors.filter(v => v.approvalStatus === 'approved');
        const duplicateCheck = detectVendorDuplicates(
          {
            name: validatedData.name,
            categories: validatedData.categories,
            email: validatedData.email || null,
          },
          existingVendors
        );
        
        // Case A: Exact match - hard stop
        if (duplicateCheck.hasExactMatch && duplicateCheck.exactMatch) {
          return res.status(409).json({
            error: "This vendor is already in our system",
            duplicateType: "exact",
            exactMatch: duplicateCheck.exactMatch,
            potentialMatches: [],
          });
        }
        
        // Case B: Potential matches - soft stop
        if (duplicateCheck.potentialMatches.length > 0) {
          return res.status(409).json({
            error: "Potential duplicate vendors found",
            duplicateType: "potential",
            exactMatch: null,
            potentialMatches: duplicateCheck.potentialMatches,
          });
        }
      }
      
      const { resolveAreasServed } = await import("../utils/metro-resolver");
      const resolvedAreas = await resolveAreasServed(storage, validatedData.areasServed);
      
      const vendorData: InsertVendor = {
        name: validatedData.name,
        categories: validatedData.categories,
        city: resolvedAreas[0] || 'San Francisco Bay Area',
        areasServed: resolvedAreas,
        location: validatedData.location || null,
        priceRange: validatedData.priceRange,
        culturalSpecialties: validatedData.culturalSpecialties && validatedData.culturalSpecialties.length > 0 
          ? validatedData.culturalSpecialties 
          : (coupleTradition ? [coupleTradition] : []),
        description: validatedData.description || null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        website: validatedData.website || null,
        instagram: validatedData.instagram,
        isPublished: false,
        claimed: false,
        source: "couple_submitted",
        createdByUserId: authReq.user.id,
        createdByUserType: "couple",
        calendarShared: false,
        calendarSource: "local",
        featured: false,
      };
      
      const vendor = await storage.createVendor(vendorData);
      
      const updatedVendor = await storage.updateVendor(vendor.id, {
        approvalStatus: "pending",
      });
      
      res.json({ message: "Vendor submitted for review", vendor: updatedVendor });
    } catch (error) {
      console.error("Error submitting vendor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit vendor" });
    }
  });

  router.post("/:id/request-claim", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        return res.status(400).json({ error: "This profile has already been claimed" });
      }
      
      const { claimantEmail, claimantName, claimantPhone, notes } = req.body;
      
      if (!claimantEmail) {
        return res.status(400).json({ 
          error: "Please provide your business email for verification.",
          requiresEmail: true
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(claimantEmail)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
      }
      
      const existingClaims = await storage.getVendorClaimStagingByVendor(req.params.id);
      const pendingClaim = existingClaims.find(c => c.status === 'pending');
      if (pendingClaim) {
        return res.status(400).json({ 
          error: "There is already a pending claim for this vendor. Please wait for admin review." 
        });
      }
      
      // Check if provided email matches the email on file
      const emailOnFile = vendor.email?.toLowerCase().trim();
      const providedEmail = claimantEmail.toLowerCase().trim();
      const emailMismatch = emailOnFile && emailOnFile !== providedEmail;
      
      // Build notes with email mismatch info if applicable
      let claimNotes = notes || "";
      if (emailMismatch) {
        const mismatchNote = `[EMAIL MISMATCH] Email on file: ${vendor.email} | Claimant provided: ${claimantEmail}`;
        claimNotes = claimNotes ? `${mismatchNote}\n\n${claimNotes}` : mismatchNote;
      } else if (emailOnFile && emailOnFile === providedEmail) {
        claimNotes = claimNotes ? `[EMAIL MATCH] Email matches file\n\n${claimNotes}` : "[EMAIL MATCH] Email matches file";
      }
      
      await storage.createVendorClaimStaging({
        vendorId: req.params.id,
        vendorName: vendor.name,
        vendorCategories: vendor.categories,
        vendorLocation: vendor.location,
        vendorCity: vendor.city,
        claimantEmail,
        claimantName: claimantName || null,
        claimantPhone: claimantPhone || null,
        notes: claimNotes || null,
      });
      
      res.json({
        message: "Claim request submitted for admin review. We'll contact you at the provided email once approved.",
        requiresEmail: false,
        pendingAdminReview: true,
        emailMismatch,
      });
    } catch (error) {
      console.error("Error requesting claim:", error);
      res.status(500).json({ error: "Failed to request profile claim" });
    }
  });

  router.get("/claim/verify", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ error: "Claim token is required", valid: false });
      }
      
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token", valid: false });
      }
      
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired", valid: false, expired: true });
      }
      
      if (!vendor.claimLinkClickedAt) {
        await storage.updateVendor(vendor.id, {
          claimLinkClickedAt: new Date(),
        } as any);
      }
      
      // Get the approved claim staging record to retrieve the claimant email
      const claimStagingRecords = await storage.getVendorClaimStagingByVendor(vendor.id);
      const approvedClaim = claimStagingRecords.find(c => c.status === 'approved');
      const claimantEmail = approvedClaim?.claimantEmail || vendor.email || '';
      
      res.json({
        valid: true,
        claimantEmail, // The email the claimant submitted when requesting the claim
        vendor: {
          id: vendor.id,
          name: vendor.name,
          categories: vendor.categories,
          location: vendor.location,
          phone: vendor.phone,
          website: vendor.website,
          description: vendor.description,
          priceRange: vendor.priceRange,
          email: vendor.email, // The business email on file (may differ from claimant email)
          areasServed: vendor.areasServed || [], // Areas this vendor serves
        },
      });
    } catch (error) {
      console.error("Error verifying claim token:", error);
      res.status(500).json({ error: "Failed to verify claim token", valid: false });
    }
  });

  router.post("/claim/complete", async (req, res) => {
    try {
      const { token, usernameEmail, businessEmail, password, phone, description, website, priceRange, areasServed } = req.body;
      
      // Support both old 'email' field and new 'usernameEmail' field for backward compatibility
      const loginEmail = usernameEmail || req.body.email;
      const vendorBusinessEmail = businessEmail || loginEmail;
      
      if (!token || !loginEmail || !password) {
        return res.status(400).json({ error: "Token, email, and password are required" });
      }
      
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token" });
      }
      
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired. Please request a new one." });
      }
      
      const existingUser = await storage.getUserByEmail(loginEmail);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use. Please login instead." });
      }
      
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        email: loginEmail,
        passwordHash,
        role: 'vendor',
        emailVerified: true,
      });
      
      await storage.updateVendor(vendor.id, {
        claimed: true,
        userId: newUser.id,
        claimToken: null,
        claimTokenExpires: null,
        email: vendorBusinessEmail, // Business email for vendor profile
        phone: phone || vendor.phone,
        description: description || vendor.description,
        website: website || vendor.website,
        priceRange: priceRange || vendor.priceRange,
        areasServed: areasServed || vendor.areasServed, // Areas this vendor serves
        approvalStatus: 'approved', // Keep vendor approved after claiming - no re-approval needed
        isPublished: true, // Ensure vendor remains published
      } as any);
      
      res.json({
        message: "Profile claimed successfully! You can now login to manage your profile.",
        vendorId: vendor.id,
      });
    } catch (error) {
      console.error("Error completing claim:", error);
      res.status(500).json({ error: "Failed to complete claim" });
    }
  });

  router.post("/claim/verify", async (req, res) => {
    try {
      const { token, email, password } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Claim token is required" });
      }
      
      const vendor = await storage.getVendorByClaimToken(token);
      if (!vendor) {
        return res.status(404).json({ error: "Invalid or expired claim token" });
      }
      
      if (vendor.claimTokenExpires && new Date() > new Date(vendor.claimTokenExpires)) {
        return res.status(400).json({ error: "Claim token has expired. Please request a new one." });
      }
      
      let userId = vendor.userId;
      if (email && password) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use. Please login instead." });
        }
        
        const bcrypt = await import('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await storage.createUser({
          email,
          passwordHash,
          role: 'vendor',
          emailVerified: true,
        });
        userId = newUser.id;
      }
      
      await storage.updateVendor(vendor.id, {
        claimed: true,
        userId: userId,
        claimToken: null,
        claimTokenExpires: null,
        email: email || vendor.email,
      } as any);
      
      res.json({
        message: "Profile claimed successfully! You can now login to manage your profile.",
        vendorId: vendor.id,
      });
    } catch (error) {
      console.error("Error verifying claim:", error);
      res.status(500).json({ error: "Failed to verify claim" });
    }
  });

  router.post("/:id/opt-out", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      await storage.updateVendor(req.params.id, {
        optedOutOfNotifications: true,
      } as any);
      
      res.json({ message: "You have been opted out of future notifications." });
    } catch (error) {
      console.error("Error opting out:", error);
      res.status(500).json({ error: "Failed to opt out" });
    }
  });

  return router;
}
