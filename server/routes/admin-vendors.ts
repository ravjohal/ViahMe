import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { IStorage } from "../storage";
import { AuthRequest } from "../auth-middleware";
import { z } from "zod";
import { coupleSubmitVendorSchema, insertDiscoveryJobSchema, type InsertVendor } from "@shared/schema";
import { discoverVendors, type DiscoveredVendor } from "../ai/gemini";
import { VendorDiscoveryScheduler } from "../services/vendor-discovery-scheduler";
import { METRO_CITY_MAP, detectMetroFromLocation, extractCityFromLocation } from "../utils/metro-detection";

async function requireAdminAuth(req: Request, storage: IStorage): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authReq = req as AuthRequest;
  if (!authReq.session?.userId) {
    return null;
  }
  const user = await storage.getUser(authReq.session.userId);
  if (!user) {
    return null;
  }
  return { userId: user.id, isAdmin: user.isSiteAdmin === true };
}

function checkAdminAccess(req: Request, storage: IStorage): Promise<boolean> {
  return (async () => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey && adminKey === process.env.ADMIN_API_KEY) {
      return true;
    }
    const authReq = req as AuthRequest;
    if (authReq.session?.userId) {
      const user = await storage.getUser(authReq.session.userId);
      if (user?.isSiteAdmin) return true;
    }
    return false;
  })();
}

export async function registerAdminVendorRoutes(router: Router, storage: IStorage) {
  router.get("/vendors/unclaimed", async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== "couple") {
        return res.status(403).json({ error: "Access denied. Admin features are for platform operators only." });
      }
      
      const searchQuery = (req.query.search as string || "").trim().toLowerCase();
      
      if (searchQuery.length < 2) {
        return res.json([]);
      }
      
      const allVendors = await storage.getAllVendors();
      let unclaimedVendors = allVendors
        .filter(v => v.claimed === false)
        .filter(v => v.email || v.phone)
        .filter(v => 
          v.name.toLowerCase().includes(searchQuery) ||
          (v.location && v.location.toLowerCase().includes(searchQuery)) ||
          (v.category && v.category.toLowerCase().includes(searchQuery))
        );
      
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
      
      const maskedVendors = unclaimedVendors.slice(0, 20).map(v => ({
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
      
      res.json(maskedVendors);
    } catch (error) {
      console.error("Error fetching unclaimed vendors:", error);
      res.status(500).json({ error: "Failed to fetch unclaimed vendors" });
    }
  });

  router.post("/vendors/:id/send-claim-invitation", async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(authReq.session.userId);
      if (!user || user.role !== "couple") {
        return res.status(403).json({ error: "Access denied. Admin features are for platform operators only." });
      }
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        return res.status(400).json({ error: "This profile has already been claimed" });
      }
      
      if (!vendor.email && !vendor.phone) {
        return res.status(400).json({ error: "Vendor has no email or phone to send invitation to" });
      }
      
      const claimToken = randomUUID();
      const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await storage.updateVendor(req.params.id, {
        claimToken,
        claimTokenExpires,
        claimInviteCount: (vendor.claimInviteCount || 0) + 1,
      } as any);
      
      const baseUrl = process.env.REPLIT_DEPLOYMENT_URL
        ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
        : `${req.protocol}://${req.get('host')}`;
      const claimLink = `${baseUrl}/claim-profile/${claimToken}`;
      
      if (vendor.email) {
        try {
          await storage.sendClaimEmail(vendor.id, vendor.email, vendor.name, claimLink);
        } catch (err) {
          console.error("Failed to send claim email:", err);
        }
      }
      
      res.json({ 
        success: true,
        message: `Claim invitation sent to ${vendor.email || vendor.phone}`,
        claimLink: process.env.NODE_ENV === 'development' ? claimLink : undefined,
      });
    } catch (error) {
      console.error("Error sending claim invitation:", error);
      res.status(500).json({ error: "Failed to send claim invitation" });
    }
  });

  router.post("/seed-google-places", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { region, category, apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Google Places API key is required" });
      }
      
      if (!region || !category) {
        return res.status(400).json({ error: "Region and category are required" });
      }
      
      const searchQueries = [
        `Indian ${category} ${region}`,
        `South Asian ${category} ${region}`,
        `Desi ${category} ${region}`,
      ];
      
      const results: any[] = [];
      
      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
          );
          const data = await response.json();
          
          if (data.results) {
            results.push(...data.results);
          }
        } catch (err) {
          console.error(`Failed to search: ${query}`, err);
        }
      }
      
      const uniquePlaces = new Map();
      for (const place of results) {
        if (!uniquePlaces.has(place.place_id)) {
          uniquePlaces.set(place.place_id, place);
        }
      }
      
      const created: any[] = [];
      const skipped: any[] = [];
      
      for (const place of uniquePlaces.values()) {
        const existing = await storage.getVendorByGooglePlaceId(place.place_id);
        if (existing) {
          skipped.push({ name: place.name, reason: "Already exists" });
          continue;
        }
        
        let phone = null;
        let website = null;
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${apiKey}`
          );
          const detailsData = await detailsResponse.json();
          phone = detailsData.result?.formatted_phone_number || null;
          website = detailsData.result?.website || null;
        } catch (err) {
          console.error(`Failed to get details for ${place.name}`, err);
        }
        
        const categoryMapping: Record<string, string> = {
          'dj': 'DJ & Music',
          'photographer': 'Photography',
          'videographer': 'Photography',
          'caterer': 'Catering',
          'decorator': 'Decor & Rentals',
          'florist': 'Florist',
          'makeup': 'Makeup Artist',
          'mehndi': 'Mehndi Artist',
          'venue': 'Venues',
          'planner': 'Event Planning',
        };
        
        const mappedCategory = categoryMapping[category.toLowerCase()] || category;
        
        const vendor = await storage.createVendor({
          name: place.name,
          category: mappedCategory,
          categories: [category.toLowerCase() as any],
          location: place.formatted_address || region,
          city: region,
          priceRange: '$$',
          phone: phone,
          website: website,
          googlePlaceId: place.place_id,
          rating: place.rating?.toString() || null,
          claimed: false,
          source: 'google_places',
          isPublished: true,
          description: `${place.name} - Indian wedding ${category} serving ${region}. Contact us to learn more about our services.`,
        });
        
        created.push({ name: place.name, id: vendor.id });
      }
      
      res.json({
        message: `Seeded ${created.length} vendors, skipped ${skipped.length}`,
        created,
        skipped,
      });
    } catch (error) {
      console.error("Error seeding from Google Places:", error);
      res.status(500).json({ error: "Failed to seed vendors from Google Places" });
    }
  });

  router.get("/vendor-claims/history", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const claims = await storage.getAllVendorClaimHistory();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claim history:", error);
      res.status(500).json({ error: "Failed to fetch claim history" });
    }
  });

  router.get("/vendor-claims", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const claims = await storage.getAllPendingVendorClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching pending claims:", error);
      res.status(500).json({ error: "Failed to fetch pending claims" });
    }
  });

  router.get("/vendor-claims/:id", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const vendor = await storage.getVendor(claim.vendorId);
      
      res.json({ claim, vendor });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  router.post("/vendor-claims/:id/approve", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { adminNotes } = req.body;
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ error: "This claim has already been processed" });
      }
      
      const vendor = await storage.getVendor(claim.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      if (vendor.claimed) {
        await storage.updateVendorClaimStaging(req.params.id, {
          status: 'denied',
          adminNotes: adminNotes || 'Vendor was already claimed by another user',
          reviewedBy: auth.userId,
          reviewedAt: new Date(),
        });
        return res.status(400).json({ error: "This vendor has already been claimed" });
      }
      
      const claimToken = randomUUID();
      const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await storage.updateVendor(claim.vendorId, {
        email: claim.claimantEmail,
        claimToken,
        claimTokenExpires,
        claimInviteCount: (vendor.claimInviteCount || 0) + 1,
      } as any);
      
      const baseUrl = process.env.REPLIT_DEPLOYMENT_URL
        ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
        : `${req.protocol}://${req.get('host')}`;
      const claimLink = `${baseUrl}/claim-profile/${claimToken}`;
      try {
        await storage.sendClaimEmail(vendor.id, claim.claimantEmail, vendor.name, claimLink);
      } catch (err) {
        console.error("Failed to send claim approval email:", err);
      }
      
      await storage.updateVendorClaimStaging(req.params.id, {
        status: 'approved',
        adminNotes: adminNotes || null,
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      });
      
      res.json({ 
        message: "Claim approved! A verification link has been sent to the claimant.",
        claimLink: process.env.NODE_ENV === 'development' ? claimLink : undefined,
      });
    } catch (error) {
      console.error("Error approving claim:", error);
      res.status(500).json({ error: "Failed to approve claim" });
    }
  });

  router.post("/vendor-claims/:id/deny", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { adminNotes, reason, sendEmail: shouldSendEmail } = req.body;
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ error: "This claim has already been processed" });
      }
      
      await storage.updateVendorClaimStaging(req.params.id, {
        status: 'denied',
        adminNotes: adminNotes || reason || null,
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      });
      
      // Send denial email if requested
      let emailSent = false;
      if (shouldSendEmail && claim.claimantEmail) {
        try {
          const { sendClaimDenialEmail } = await import('../email');
          await sendClaimDenialEmail({
            to: claim.claimantEmail,
            vendorName: claim.vendorName || 'your business',
            reason: reason || undefined,
          });
          emailSent = true;
          console.log(`[ClaimDeny] Denial email sent to ${claim.claimantEmail} for ${claim.vendorName}`);
        } catch (emailError) {
          console.error(`[ClaimDeny] Failed to send denial email:`, emailError);
        }
      }
      
      res.json({ 
        message: emailSent ? "Claim denied and notification email sent." : "Claim denied.",
        emailSent,
      });
    } catch (error) {
      console.error("Error denying claim:", error);
      res.status(500).json({ error: "Failed to deny claim" });
    }
  });

  router.get("/vendors/pending-approval", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const vendors = await storage.getPendingApprovalVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching pending approval vendors:", error);
      res.status(500).json({ error: "Failed to fetch pending approval vendors" });
    }
  });

  router.post("/vendors/:id/approve", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { notes } = req.body;
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const updatedVendor = await storage.approveVendor(req.params.id, auth.userId, notes);
      
      // Auto-send claim invitation for unclaimed vendors with email
      // Use updatedVendor for most current state after approval
      let claimInvitationSent = false;
      let claimLink: string | undefined;
      let claimSkipReason: string | undefined;
      
      if (updatedVendor && !updatedVendor.claimed && updatedVendor.email) {
        try {
          const claimToken = randomUUID();
          const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          await storage.updateVendor(req.params.id, {
            claimToken,
            claimTokenExpires,
            claimInviteCount: (updatedVendor.claimInviteCount || 0) + 1,
          } as any);
          
          const baseUrl = process.env.REPLIT_DEPLOYMENT_URL
            ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
            : `${req.protocol}://${req.get('host')}`;
          claimLink = `${baseUrl}/claim-profile/${claimToken}`;
          
          await storage.sendClaimEmail(updatedVendor.id, updatedVendor.email, updatedVendor.name, claimLink);
          claimInvitationSent = true;
        } catch (err) {
          console.error("Failed to send claim invitation after approval:", err);
        }
      } else if (updatedVendor && !updatedVendor.claimed && !updatedVendor.email) {
        claimSkipReason = "Vendor has no email address for claim invitation";
      }
      
      let message = "Vendor approved!";
      if (claimInvitationSent && updatedVendor) {
        message = `Vendor approved and claim invitation sent to ${updatedVendor.email}!`;
      } else if (claimSkipReason) {
        message = `Vendor approved! Note: ${claimSkipReason}`;
      }
      
      res.json({ 
        message, 
        vendor: updatedVendor,
        claimInvitationSent,
        claimLink: process.env.NODE_ENV === 'development' ? claimLink : undefined,
      });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ error: "Failed to approve vendor" });
    }
  });

  router.post("/vendors/:id/reject", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { notes } = req.body;
      
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const updatedVendor = await storage.rejectVendor(req.params.id, auth.userId, notes);
      res.json({ message: "Vendor rejected.", vendor: updatedVendor });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ error: "Failed to reject vendor" });
    }
  });

  // Bulk send claim invitations to multiple vendors
  router.post("/vendors/bulk-claim-invitations", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const bulkInviteSchema = z.object({
        vendorIds: z.array(z.string().uuid()).min(1, "At least one vendor ID is required"),
      });
      
      const parseResult = bulkInviteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "vendorIds array of valid UUIDs is required" });
      }
      
      const { vendorIds } = parseResult.data;
      
      const results: { vendorId: string; success: boolean; message: string }[] = [];
      
      for (const vendorId of vendorIds) {
        try {
          const vendor = await storage.getVendor(vendorId);
          
          if (!vendor) {
            results.push({ vendorId, success: false, message: "Vendor not found" });
            continue;
          }
          
          if (vendor.claimed) {
            results.push({ vendorId, success: false, message: "Already claimed" });
            continue;
          }
          
          if (!vendor.email) {
            results.push({ vendorId, success: false, message: "No email address" });
            continue;
          }
          
          const claimToken = randomUUID();
          const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          await storage.updateVendor(vendorId, {
            claimToken,
            claimTokenExpires,
            claimInviteCount: (vendor.claimInviteCount || 0) + 1,
          } as any);
          
          const baseUrl = process.env.REPLIT_DEPLOYMENT_URL
            ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
            : `${req.protocol}://${req.get('host')}`;
          const claimLink = `${baseUrl}/claim-profile/${claimToken}`;
          
          await storage.sendClaimEmail(vendor.id, vendor.email, vendor.name, claimLink);
          results.push({ vendorId, success: true, message: `Sent to ${vendor.email} (#${(vendor.claimInviteCount || 0) + 1})` });
        } catch (err) {
          console.error(`Failed to send claim invitation to vendor ${vendorId}:`, err);
          results.push({ vendorId, success: false, message: "Failed to send" });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      res.json({
        message: `Sent ${successCount} invitations, ${failCount} failed`,
        results,
        successCount,
        failCount,
      });
    } catch (error) {
      console.error("Error sending bulk claim invitations:", error);
      res.status(500).json({ error: "Failed to send bulk claim invitations" });
    }
  });

  router.get("/vendors/unclaimed-with-email", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!auth.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const allVendors = await storage.getAllVendors();
      const unclaimedWithEmail = allVendors.filter(v => 
        !v.claimed && 
        v.email && 
        v.approvalStatus === 'approved'
      );
      
      res.json(unclaimedWithEmail);
    } catch (error) {
      console.error("Error fetching unclaimed vendors:", error);
      res.status(500).json({ error: "Failed to fetch unclaimed vendors" });
    }
  });

  const validCategories = ['makeup_artist', 'dj', 'dhol_player', 'turban_tier', 'mehndi_artist', 'photographer', 'videographer', 'caterer', 'banquet_hall', 'gurdwara', 'temple', 'decorator', 'florist', 'wedding_planner', 'invitation_designer', 'jeweler', 'bridal_wear', 'groom_wear', 'hair_stylist', 'henna_artist', 'lighting', 'transportation', 'officiant', 'priest', 'pandit', 'imam', 'mosque', 'church', 'event_venue', 'bartender', 'cake_baker', 'sangeet_choreographer', 'granthi', 'travel_agent', 'hotel', 'kolam_artist'] as const;
  const validPriceRanges = ['$', '$$', '$$$', '$$$$'] as const;
  const validTraditions = ['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general'] as const;

  const bulkVendorSchema = z.object({
    name: z.string().min(1),
    location: z.string().optional(),
    contact: z.object({
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      specialty: z.string().optional(),
    }).optional(),
    categories: z.array(z.enum(validCategories)).optional(),
    city: z.string().optional(),
    price_range: z.enum(validPriceRanges).optional(),
    cultural_specialties: z.array(z.string()).optional(),
    preferred_wedding_traditions: z.array(z.enum(validTraditions)).optional(),
  });

  const bulkImportSchema = z.object({
    vendors: z.array(bulkVendorSchema).min(1).max(100),
    default_city: z.string().optional(),
    default_categories: z.array(z.enum(validCategories)).optional(),
  });

  router.post("/vendors/bulk-import", async (req: Request, res: Response) => {
    try {
      const adminKey = req.headers["x-admin-key"];
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Invalid or missing admin API key" });
      }

      const parsed = bulkImportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parsed.error.issues 
        });
      }

      const { vendors, default_city, default_categories } = parsed.data;
      const results: { name: string; id: string; status: string }[] = [];
      const errors: { name: string; error: string }[] = [];

      const existingVendors = await storage.getAllVendors();

      for (const vendor of vendors) {
        try {
          const vendorCity = (vendor.city || default_city || 'Vancouver').toLowerCase().trim();
          const vendorName = vendor.name.toLowerCase().trim();
          
          const duplicate = existingVendors.find(
            v => v.name.toLowerCase().trim() === vendorName && 
                 v.city.toLowerCase().trim() === vendorCity
          );

          if (duplicate) {
            results.push({ name: vendor.name, id: duplicate.id, status: "skipped_duplicate" });
            continue;
          }

          const newVendor: InsertVendor = {
            id: randomUUID(),
            name: vendor.name,
            location: vendor.location || null,
            city: vendor.city || default_city || 'Vancouver',
            categories: vendor.categories || default_categories || ['photographer'],
            priceRange: vendor.price_range || '$$$',
            description: vendor.contact?.specialty || null,
            phone: vendor.contact?.phone || null,
            email: vendor.contact?.email || null,
            website: vendor.contact?.website || null,
            culturalSpecialties: vendor.cultural_specialties || ['south_asian'],
            preferredWeddingTraditions: vendor.preferred_wedding_traditions || ['sikh', 'hindu'],
            isPublished: true,
            approvalStatus: 'approved',
            source: 'manual',
            claimed: false,
          };

          const created = await storage.createVendor(newVendor);
          existingVendors.push(created);
          results.push({ name: vendor.name, id: created.id, status: "created" });
        } catch (err) {
          errors.push({ name: vendor.name, error: String(err) });
        }
      }

      res.json({
        success: true,
        summary: {
          total: vendors.length,
          created: results.filter(r => r.status === "created").length,
          skipped: results.filter(r => r.status === "skipped_duplicate").length,
          errors: errors.length,
        },
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error in bulk vendor import:", error);
      res.status(500).json({ error: "Failed to import vendors" });
    }
  });

  const discoverySchema = z.object({
    area: z.string().min(1),
    specialty: z.string().min(1),
    count: z.number().min(1).max(20).optional(),
  });

  router.post("/vendors/discover", async (req: Request, res: Response) => {
    try {
      const adminKey = req.headers["x-admin-key"];
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Invalid or missing admin API key" });
      }

      const parsed = discoverySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { area, specialty, count } = parsed.data;

      const discovered = await discoverVendors(area, specialty, count || 10);

      const existingVendors = await storage.getAllVendors();

      const staged = discovered.map((vendor) => {
        const vendorName = vendor.name.toLowerCase().trim();
        const duplicate = existingVendors.find(
          (v) => v.name.toLowerCase().trim() === vendorName
        );

        return {
          ...vendor,
          isDuplicate: !!duplicate,
          existingVendorId: duplicate?.id || null,
          suggested: !duplicate,
        };
      });

      res.json({
        success: true,
        area,
        specialty,
        total: staged.length,
        duplicates: staged.filter((s) => s.isDuplicate).length,
        newVendors: staged.filter((s) => !s.isDuplicate).length,
        vendors: staged,
      });
    } catch (error) {
      console.error("Error in vendor discovery:", error);
      res.status(500).json({ error: "Failed to discover vendors" });
    }
  });

  // ============================================================
  // Discovery Jobs CRUD
  // ============================================================

  router.get("/discovery-jobs", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const jobs = await storage.getAllDiscoveryJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching discovery jobs:", error);
      res.status(500).json({ error: "Failed to fetch discovery jobs" });
    }
  });

  router.post("/discovery-jobs", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const parsed = insertDiscoveryJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid job data", details: parsed.error.format() });
      }
      const job = await storage.createDiscoveryJob(parsed.data);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating discovery job:", error);
      res.status(500).json({ error: "Failed to create discovery job" });
    }
  });

  const bulkCreateJobsSchema = z.object({
    areas: z.array(z.string().min(1)).min(1, "At least one area is required"),
    specialties: z.array(z.string().min(1)).min(1, "At least one specialty is required"),
    countPerRun: z.number().min(1).max(50).default(20),
    maxTotal: z.number().min(1).default(100),
    notes: z.string().optional(),
    skipExisting: z.boolean().default(true),
  });

  router.post("/discovery-jobs/bulk", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const parsed = bulkCreateJobsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bulk job data", details: parsed.error.format() });
      }

      const { areas, specialties, countPerRun, maxTotal, notes, skipExisting } = parsed.data;

      let existingJobs: { area: string; specialty: string }[] = [];
      if (skipExisting) {
        const allJobs = await storage.getAllDiscoveryJobs();
        existingJobs = allJobs.map(j => ({ area: j.area, specialty: j.specialty }));
      }

      const results: { area: string; specialty: string; status: 'created' | 'skipped_existing' | 'error'; id?: string; error?: string }[] = [];

      for (const area of areas) {
        for (const specialty of specialties) {
          if (skipExisting) {
            const exists = existingJobs.some(j => j.area === area && j.specialty === specialty);
            if (exists) {
              results.push({ area, specialty, status: 'skipped_existing' });
              continue;
            }
          }

          try {
            const job = await storage.createDiscoveryJob({
              area,
              specialty,
              countPerRun,
              maxTotal,
              notes: notes || null,
              isActive: true,
              paused: false,
            });
            results.push({ area, specialty, status: 'created', id: job.id });
          } catch (err: any) {
            results.push({ area, specialty, status: 'error', error: err.message });
          }
        }
      }

      res.status(201).json({
        summary: {
          total: results.length,
          created: results.filter(r => r.status === 'created').length,
          skipped: results.filter(r => r.status === 'skipped_existing').length,
          errors: results.filter(r => r.status === 'error').length,
        },
        results,
      });
    } catch (error) {
      console.error("Error in bulk create discovery jobs:", error);
      res.status(500).json({ error: "Failed to bulk create discovery jobs" });
    }
  });

  router.patch("/discovery-jobs/:id", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const allowedFields = ["area", "specialty", "countPerRun", "maxTotal", "isActive", "paused", "endDate", "notes"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const job = await storage.updateDiscoveryJob(req.params.id, updates);
      if (!job) {
        return res.status(404).json({ error: "Discovery job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating discovery job:", error);
      res.status(500).json({ error: "Failed to update discovery job" });
    }
  });

  router.delete("/discovery-jobs/:id", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const job = await storage.getDiscoveryJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Discovery job not found" });
      }
      if (!job.retired) {
        return res.status(400).json({ error: "Only retired jobs can be permanently deleted. Retire the job first." });
      }
      const deleted = await storage.deleteDiscoveryJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Discovery job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting discovery job:", error);
      res.status(500).json({ error: "Failed to delete discovery job" });
    }
  });

  router.post("/discovery-jobs/:id/retire", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const retired = await storage.retireDiscoveryJob(req.params.id);
      if (!retired) {
        return res.status(404).json({ error: "Discovery job not found" });
      }
      res.json(retired);
    } catch (error) {
      console.error("Error retiring discovery job:", error);
      res.status(500).json({ error: "Failed to retire discovery job" });
    }
  });

  router.post("/discovery-jobs/:id/run-now", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const scheduler: VendorDiscoveryScheduler = (req.app as any).vendorDiscoveryScheduler;
      if (!scheduler) {
        return res.status(500).json({ error: "Scheduler not initialized" });
      }
      console.log(`[AdminAPI] Manual run triggered for job ${req.params.id}`);
      const { runId } = await scheduler.runJobNow(req.params.id);
      console.log(`[AdminAPI] Manual run queued with runId: ${runId}`);
      res.json({ runId, status: 'queued', message: 'Discovery run started in background' });
    } catch (error: any) {
      console.error("[AdminAPI] Error running discovery job:", error);
      res.status(500).json({ error: error.message || "Failed to run discovery job" });
    }
  });

  router.get("/discovery-runs/:id", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const run = await storage.getDiscoveryRun(req.params.id);
      if (!run) {
        return res.status(404).json({ error: "Discovery run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching discovery run:", error);
      res.status(500).json({ error: "Failed to fetch discovery run" });
    }
  });

  router.get("/discovery-runs", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const jobId = req.query.jobId as string | undefined;
      const runDate = req.query.runDate as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      let runs;
      if (jobId) {
        runs = await storage.getDiscoveryRunsByJob(jobId, runDate);
      } else if (runDate) {
        runs = await storage.getDiscoveryRunsByDate(runDate);
      } else {
        runs = await storage.getAllDiscoveryRuns(limit || 100);
      }
      res.json(runs);
    } catch (error) {
      console.error("Error fetching discovery runs:", error);
      res.status(500).json({ error: "Failed to fetch discovery runs" });
    }
  });

  router.post("/discovery-runs/:id/cancel", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const scheduler: VendorDiscoveryScheduler = (req.app as any).vendorDiscoveryScheduler;
      if (!scheduler) {
        return res.status(500).json({ error: "Scheduler not initialized" });
      }
      const cancelled = await scheduler.cancelRun(req.params.id);
      if (cancelled) {
        res.json({ status: 'cancelled', message: 'Run cancelled successfully' });
      } else {
        res.status(409).json({ error: 'Run is not active or already finished' });
      }
    } catch (error: any) {
      console.error("Error cancelling discovery run:", error);
      res.status(500).json({ error: error.message || "Failed to cancel run" });
    }
  });

  router.get("/scheduler-config", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const scheduler: VendorDiscoveryScheduler = (req.app as any).vendorDiscoveryScheduler;
      if (!scheduler) {
        return res.status(500).json({ error: "Scheduler not initialized" });
      }
      const config = scheduler.getConfig();
      res.json({ ...config, timezone: "PST" });
    } catch (error) {
      console.error("Error fetching scheduler config:", error);
      res.status(500).json({ error: "Failed to fetch scheduler config" });
    }
  });

  router.put("/scheduler-config", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const scheduler: VendorDiscoveryScheduler = (req.app as any).vendorDiscoveryScheduler;
      if (!scheduler) {
        return res.status(500).json({ error: "Scheduler not initialized" });
      }
      const { runHour, dailyCap } = req.body;
      const updates: Record<string, number> = {};
      if (runHour !== undefined) {
        const h = Number(runHour);
        if (isNaN(h) || h < 0 || h > 23) {
          return res.status(400).json({ error: "runHour must be between 0 and 23" });
        }
        updates.runHour = h;
      }
      if (dailyCap !== undefined) {
        const c = Number(dailyCap);
        if (isNaN(c) || c < 1) {
          return res.status(400).json({ error: "dailyCap must be at least 1" });
        }
        updates.dailyCap = c;
      }
      await scheduler.updateConfig(updates);
      const config = scheduler.getConfig();
      res.json({ ...config, timezone: "PST" });
    } catch (error) {
      console.error("Error updating scheduler config:", error);
      res.status(500).json({ error: "Failed to update scheduler config" });
    }
  });

  router.delete("/discovery-chat-history", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const { area, specialty } = req.query;
      if (!area || !specialty) {
        return res.status(400).json({ error: "area and specialty query params required" });
      }
      const deleted = await storage.deleteDiscoveryChatHistory(area as string, specialty as string);
      res.json({ deleted, area, specialty });
    } catch (error) {
      console.error("Error deleting chat history:", error);
      res.status(500).json({ error: "Failed to delete chat history" });
    }
  });

  // ============================================================
  // Staged Vendors Review / Approval
  // ============================================================

  router.get("/staged-vendors", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const status = req.query.status as string | undefined;
      let vendors;
      if (status) {
        vendors = await storage.getStagedVendorsByStatus(status);
      } else {
        vendors = await storage.getAllStagedVendors();
      }
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching staged vendors:", error);
      res.status(500).json({ error: "Failed to fetch staged vendors" });
    }
  });

  router.post("/staged-vendors/:id/approve", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const staged = await storage.getStagedVendor(req.params.id);
      if (!staged) {
        return res.status(404).json({ error: "Staged vendor not found" });
      }
      if (staged.status !== "staged") {
        return res.status(400).json({ error: `Cannot approve vendor with status "${staged.status}"` });
      }

      const overrides = req.body || {};
      const slug = (overrides.name || staged.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        + "-" + randomUUID().slice(0, 6);

      const newVendor: InsertVendor = {
        name: overrides.name || staged.name,
        slug,
        location: overrides.location || staged.location || "",
        city: overrides.city || "",
        phone: overrides.phone || staged.phone || "",
        email: overrides.email || staged.email || "",
        website: overrides.website || staged.website || "",
        category: (staged.categories && staged.categories[0]) || "photographer",
        categories: staged.categories || ["photographer"],
        culturalSpecialties: staged.culturalSpecialties || [],
        preferredWeddingTraditions: staged.preferredWeddingTraditions || [],
        priceRange: staged.priceRange || "$$$",
        description: overrides.description || staged.notes || "",
        claimed: false,
        isGhostProfile: true,
        verified: false,
        isPublished: true,
        approvalStatus: 'approved',
      };

      const vendor = await storage.createVendor(newVendor);

      await storage.updateStagedVendor(req.params.id, {
        status: "approved",
        reviewedAt: new Date(),
      });

      res.json({ success: true, vendor });
    } catch (error) {
      console.error("Error approving staged vendor:", error);
      res.status(500).json({ error: "Failed to approve staged vendor" });
    }
  });

  router.post("/staged-vendors/:id/reject", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const staged = await storage.getStagedVendor(req.params.id);
      if (!staged) {
        return res.status(404).json({ error: "Staged vendor not found" });
      }

      await storage.updateStagedVendor(req.params.id, {
        status: "rejected",
        reviewedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting staged vendor:", error);
      res.status(500).json({ error: "Failed to reject staged vendor" });
    }
  });

  router.post("/staged-vendors/bulk-approve", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids must be a non-empty array" });
      }

      const results: { id: string; success: boolean; vendorId?: string; error?: string }[] = [];
      for (const id of ids) {
        try {
          const staged = await storage.getStagedVendor(id);
          if (!staged || staged.status !== "staged") {
            results.push({ id, success: false, error: staged ? `Status is ${staged.status}` : "Not found" });
            continue;
          }

          const slug = staged.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + randomUUID().slice(0, 6);

          const newVendor: InsertVendor = {
            name: staged.name,
            slug,
            location: staged.location || "",
            city: "",
            phone: staged.phone || "",
            email: staged.email || "",
            website: staged.website || "",
            category: (staged.categories && staged.categories[0]) || "photographer",
            categories: staged.categories || ["photographer"],
            culturalSpecialties: staged.culturalSpecialties || [],
            preferredWeddingTraditions: staged.preferredWeddingTraditions || [],
            priceRange: staged.priceRange || "$$$",
            description: staged.notes || "",
            claimed: false,
            isGhostProfile: true,
            verified: false,
            isPublished: true,
            approvalStatus: 'approved',
          };

          const vendor = await storage.createVendor(newVendor);
          await storage.updateStagedVendor(id, { status: "approved", reviewedAt: new Date() });
          results.push({ id, success: true, vendorId: vendor.id });
        } catch (err: any) {
          results.push({ id, success: false, error: err.message });
        }
      }

      res.json({
        approved: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });
    } catch (error) {
      console.error("Error in bulk approve:", error);
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });

  router.post("/staged-vendors/bulk-reject", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids must be a non-empty array" });
      }

      let rejected = 0;
      for (const id of ids) {
        await storage.updateStagedVendor(id, { status: "rejected", reviewedAt: new Date() });
        rejected++;
      }

      res.json({ rejected });
    } catch (error) {
      console.error("Error in bulk reject:", error);
      res.status(500).json({ error: "Failed to bulk reject" });
    }
  });

  router.delete("/staged-vendors/:id", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(401).json({ error: "Admin access required" });
      }
      const deleted = await storage.deleteStagedVendor(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Staged vendor not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staged vendor:", error);
      res.status(500).json({ error: "Failed to delete staged vendor" });
    }
  });

  router.get("/email-templates/:key", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const template = await storage.getEmailTemplate(req.params.key);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ error: "Failed to fetch email template" });
    }
  });

  router.put("/email-templates/:key", async (req: Request, res: Response) => {
    try {
      const auth = await requireAdminAuth(req, storage);
      if (!auth?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const templateSchema = z.object({
        subject: z.string().min(1),
        heading: z.string().min(1),
        bodyHtml: z.string().min(1),
        ctaText: z.string().min(1).optional(),
        footerHtml: z.string().optional(),
      });

      const parsed = templateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid template data", details: parsed.error.issues });
      }

      const result = await storage.upsertEmailTemplate({
        templateKey: req.params.key,
        ...parsed.data,
      });
      res.json(result);
    } catch (error) {
      console.error("Error saving email template:", error);
      res.status(500).json({ error: "Failed to save email template" });
    }
  });

  router.post("/vendors/fix-data", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allVendors = await storage.getAllVendors();
      const unpublished = allVendors.filter(v => v.approvalStatus === 'approved' && !v.isPublished);
      const missingCity = allVendors.filter(v => v.approvalStatus === 'approved' && !v.city);
      const wrongCity = allVendors.filter(v => v.approvalStatus === 'approved' && v.city && !METRO_CITY_MAP[v.city]);

      let publishedCount = 0;
      let cityFixedCount = 0;
      const unmapped: string[] = [];

      for (const vendor of unpublished) {
        await storage.updateVendor(vendor.id, { isPublished: true } as any);
        publishedCount++;
      }

      for (const vendor of [...missingCity, ...wrongCity]) {
        const detectedMetro = detectMetroFromLocation(vendor.location || '');
        if (detectedMetro) {
          await storage.updateVendor(vendor.id, { city: detectedMetro } as any);
          cityFixedCount++;
        } else if (vendor.location) {
          unmapped.push(`${vendor.name}: ${vendor.location}`);
        }
      }

      res.json({
        published: publishedCount,
        cityFixed: cityFixedCount,
        totalUnmapped: unmapped.length,
        unmappedSamples: unmapped.slice(0, 20),
      });
    } catch (error) {
      console.error("Error fixing vendor data:", error);
      res.status(500).json({ error: "Failed to fix vendor data" });
    }
  });

  router.post("/vendors/preview-filter", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { criteria, mode } = req.body;
      if (!criteria || !mode || !["publish", "unpublish"].includes(mode)) {
        return res.status(400).json({ error: "Provide 'criteria' and 'mode' ('publish' or 'unpublish')" });
      }

      const allVendors = await storage.getAllVendors();
      let matched: typeof allVendors = [];

      const matchCity = (v: any) => {
        if (!criteria.city) return true;
        if (criteria.city === "Unknown") return !v.city;
        return v.city === criteria.city;
      };
      const matchCategory = (v: any) => {
        if (!criteria.category) return true;
        if (criteria.category === "Unknown") return !v.category;
        return v.category === criteria.category || (v.categories || []).includes(criteria.category);
      };

      if (mode === "publish") {
        matched = allVendors.filter(v => {
          if (v.isPublished) return false;
          if (criteria.approvalStatus && v.approvalStatus !== criteria.approvalStatus) return false;
          if (!matchCity(v)) return false;
          if (!matchCategory(v)) return false;
          if (criteria.claimed !== undefined && v.claimed !== criteria.claimed) return false;
          if (criteria.websiteVerified && !v.website) return false;
          return true;
        });
      } else {
        matched = allVendors.filter(v => {
          if (!v.isPublished) return false;
          if (!matchCity(v)) return false;
          if (!matchCategory(v)) return false;
          if (criteria.claimed !== undefined && v.claimed !== criteria.claimed) return false;
          if (criteria.noEmail && !v.email) return true;
          if (criteria.noWebsite && !v.website) return true;
          if (criteria.noPhone && !v.phone) return true;
          return !criteria.noEmail && !criteria.noWebsite && !criteria.noPhone;
        });
      }

      const preview = matched.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        categories: v.categories,
        city: v.city,
        location: v.location,
        email: v.email ? "Yes" : "No",
        phone: v.phone ? "Yes" : "No",
        website: v.website ? "Yes" : "No",
        approvalStatus: v.approvalStatus,
        isPublished: v.isPublished,
        claimed: v.claimed,
      }));

      res.json({ total: preview.length, vendors: preview });
    } catch (error) {
      console.error("Error previewing vendor filter:", error);
      res.status(500).json({ error: "Failed to preview filter" });
    }
  });

  router.post("/vendors/bulk-publish", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { ids, criteria } = req.body;

      const allVendors = await storage.getAllVendors();
      let targetVendors: typeof allVendors = [];

      if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        targetVendors = allVendors.filter(v => idSet.has(v.id) && !v.isPublished);
      } else if (criteria) {
        targetVendors = allVendors.filter(v => {
          if (v.isPublished) return false;
          if (criteria.approvalStatus && v.approvalStatus !== criteria.approvalStatus) return false;
          if (criteria.city && v.city !== criteria.city) return false;
          if (criteria.category && v.category !== criteria.category && !(v.categories || []).includes(criteria.category)) return false;
          if (criteria.claimed !== undefined && v.claimed !== criteria.claimed) return false;
          if (criteria.websiteVerified && !v.website) return false;
          return true;
        });
      } else {
        return res.status(400).json({ error: "Provide 'ids' array or 'criteria' object" });
      }

      let publishedCount = 0;
      for (const vendor of targetVendors) {
        await storage.updateVendor(vendor.id, { isPublished: true } as any);
        publishedCount++;
      }

      res.json({
        published: publishedCount,
        total: targetVendors.length,
      });
    } catch (error) {
      console.error("Error bulk publishing vendors:", error);
      res.status(500).json({ error: "Failed to bulk publish vendors" });
    }
  });

  router.post("/vendors/bulk-unpublish", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { ids, criteria } = req.body;

      const allVendors = await storage.getAllVendors();
      let targetVendors: typeof allVendors = [];

      if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        targetVendors = allVendors.filter(v => idSet.has(v.id) && v.isPublished);
      } else if (criteria) {
        targetVendors = allVendors.filter(v => {
          if (!v.isPublished) return false;
          if (criteria.city && v.city !== criteria.city) return false;
          if (criteria.category && v.category !== criteria.category && !(v.categories || []).includes(criteria.category)) return false;
          if (criteria.claimed !== undefined && v.claimed !== criteria.claimed) return false;
          if (criteria.noEmail && !v.email) return true;
          if (criteria.noWebsite && !v.website) return true;
          if (criteria.noPhone && !v.phone) return true;
          return !criteria.noEmail && !criteria.noWebsite && !criteria.noPhone;
        });
      } else {
        return res.status(400).json({ error: "Provide 'ids' array or 'criteria' object" });
      }

      let unpublishedCount = 0;
      for (const vendor of targetVendors) {
        await storage.updateVendor(vendor.id, { isPublished: false } as any);
        unpublishedCount++;
      }

      res.json({
        unpublished: unpublishedCount,
        total: targetVendors.length,
      });
    } catch (error) {
      console.error("Error bulk unpublishing vendors:", error);
      res.status(500).json({ error: "Failed to bulk unpublish vendors" });
    }
  });

  router.get("/vendors/publish-stats", async (req: Request, res: Response) => {
    try {
      if (!(await checkAdminAccess(req, storage))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allVendors = await storage.getAllVendors();
      const published = allVendors.filter(v => v.isPublished);
      const unpublished = allVendors.filter(v => !v.isPublished);
      const approved = allVendors.filter(v => v.approvalStatus === 'approved');
      const approvedUnpublished = approved.filter(v => !v.isPublished);

      const byCity: Record<string, { published: number; unpublished: number }> = {};
      const byCategory: Record<string, { published: number; unpublished: number }> = {};

      for (const v of allVendors) {
        const city = v.city || 'Unknown';
        if (!byCity[city]) byCity[city] = { published: 0, unpublished: 0 };
        byCity[city][v.isPublished ? 'published' : 'unpublished']++;

        const cat = v.category || 'Unknown';
        if (!byCategory[cat]) byCategory[cat] = { published: 0, unpublished: 0 };
        byCategory[cat][v.isPublished ? 'published' : 'unpublished']++;
      }

      res.json({
        total: allVendors.length,
        published: published.length,
        unpublished: unpublished.length,
        approved: approved.length,
        approvedUnpublished: approvedUnpublished.length,
        byCity: Object.entries(byCity)
          .map(([city, counts]) => ({ city, ...counts }))
          .sort((a, b) => (b.published + b.unpublished) - (a.published + a.unpublished)),
        byCategory: Object.entries(byCategory)
          .map(([category, counts]) => ({ category, ...counts }))
          .sort((a, b) => (b.published + b.unpublished) - (a.published + a.unpublished)),
      });
    } catch (error) {
      console.error("Error fetching publish stats:", error);
      res.status(500).json({ error: "Failed to fetch publish stats" });
    }
  });

  router.get("/vendors/metro-city-stats", async (req: Request, res: Response) => {
    try {
      const allVendors = await storage.getAllVendors();
      const published = allVendors.filter(v => v.approvalStatus === 'approved' && v.isPublished);

      const stats: Record<string, { total: number; cities: Record<string, number> }> = {};

      for (const vendor of published) {
        const metro = vendor.city || detectMetroFromLocation(vendor.location || '') || 'Other';
        if (!stats[metro]) {
          stats[metro] = { total: 0, cities: {} };
        }
        stats[metro].total++;

        const extractedCity = extractCityFromLocation(vendor.location || '');
        if (extractedCity) {
          const cleanCity = extractedCity.replace(/\s+(BC|ON|CA|NY|NJ|IL|WA|TX|MA|GA|PA|MI|AZ|FL|DC)$/i, '').trim();
          stats[metro].cities[cleanCity] = (stats[metro].cities[cleanCity] || 0) + 1;
        }
      }

      const result = Object.entries(stats)
        .map(([metro, data]) => ({
          metro,
          total: data.total,
          cities: Object.entries(data.cities)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 30),
        }))
        .sort((a, b) => b.total - a.total);

      res.json(result);
    } catch (error) {
      console.error("Error fetching metro city stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}
