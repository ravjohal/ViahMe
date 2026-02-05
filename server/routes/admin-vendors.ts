import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { IStorage } from "../storage";
import { AuthRequest } from "../auth-middleware";
import { z } from "zod";
import { coupleSubmitVendorSchema, type InsertVendor } from "@shared/schema";

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
      
      if (vendor.claimTokenExpires && new Date(vendor.claimTokenExpires) > new Date()) {
        const hoursRemaining = Math.ceil((new Date(vendor.claimTokenExpires).getTime() - Date.now()) / (1000 * 60 * 60));
        return res.status(429).json({ 
          error: `A claim invitation was already sent recently. Please wait ${hoursRemaining} hours before sending another.` 
        });
      }
      
      const claimToken = randomUUID();
      const claimTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      await storage.updateVendor(req.params.id, {
        claimToken,
        claimTokenExpires,
      });
      
      const claimLink = `${req.protocol}://${req.get('host')}/claim-profile/${claimToken}`;
      
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
      } as any);
      
      const claimLink = `${req.protocol}://${req.get('host')}/claim-profile/${claimToken}`;
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
        // Check cooldown - skip if a recent invitation was already sent
        const hasRecentInvite = updatedVendor.claimTokenExpires && new Date(updatedVendor.claimTokenExpires) > new Date();
        
        if (hasRecentInvite) {
          claimSkipReason = "A claim invitation was already sent recently";
        } else {
          try {
            const claimToken = randomUUID();
            const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for approval flow
            
            await storage.updateVendor(req.params.id, {
              claimToken,
              claimTokenExpires,
            });
            
            claimLink = `${req.protocol}://${req.get('host')}/claim-profile/${claimToken}`;
            
            await storage.sendClaimEmail(updatedVendor.id, updatedVendor.email, updatedVendor.name, claimLink);
            claimInvitationSent = true;
          } catch (err) {
            console.error("Failed to send claim invitation after approval:", err);
          }
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
          
          // Check cooldown
          if (vendor.claimTokenExpires && new Date(vendor.claimTokenExpires) > new Date()) {
            results.push({ vendorId, success: false, message: "Recent invitation pending" });
            continue;
          }
          
          // Generate token and send invitation (48h expiration, matching single invite)
          const claimToken = randomUUID();
          const claimTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
          
          await storage.updateVendor(vendorId, {
            claimToken,
            claimTokenExpires,
          });
          
          const claimLink = `${req.protocol}://${req.get('host')}/claim-profile/${claimToken}`;
          
          await storage.sendClaimEmail(vendor.id, vendor.email, vendor.name, claimLink);
          results.push({ vendorId, success: true, message: `Sent to ${vendor.email}` });
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

  // Get unclaimed vendors with email for bulk invitation
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
}
