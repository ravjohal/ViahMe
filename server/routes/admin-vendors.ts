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
      
      const claimLink = `${req.protocol}://${req.get('host')}/claim-profile?token=${claimToken}`;
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
      
      const { adminNotes } = req.body;
      
      const claim = await storage.getVendorClaimStaging(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ error: "This claim has already been processed" });
      }
      
      await storage.updateVendorClaimStaging(req.params.id, {
        status: 'denied',
        adminNotes: adminNotes || null,
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      });
      
      res.json({ message: "Claim denied." });
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
      res.json({ message: "Vendor approved!", vendor: updatedVendor });
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
}
