import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { insertVendorSchema, insertBookingSchema, insertServicePackageSchema, insertReviewSchema, type Vendor } from "@shared/schema";
import { ensureVendorAccess } from "./middleware";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "../email";

export async function registerVendorRoutes(router: Router, storage: IStorage) {
  router.get("/", async (req, res) => {
    try {
      const { category, location, includeUnpublished, includeAllApproval } = req.query;

      let vendors = await storage.getAllVendors();

      if (includeAllApproval !== "true") {
        vendors = vendors.filter((v) => v.approvalStatus === 'approved');
      }

      if (includeUnpublished !== "true") {
        vendors = vendors.filter((v) => v.isPublished === true);
      }

      if (category && typeof category === "string") {
        vendors = vendors.filter((v) => v.categories?.includes(category));
      }

      if (location && typeof location === "string") {
        vendors = vendors.filter((v) =>
          v.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      res.json(vendors);
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
      
      const sanitizedVendors = unclaimedVendors.slice(0, 20).map(v => ({
        ...v,
        email: v.email ? v.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
        phone: v.phone ? v.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) ***-$3") : null,
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

      const updatedVendor = await storage.updateVendor(req.params.id, req.body);
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
      
      if (wedding.coupleId !== authReq.session.userId) {
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
      if (wedding.coupleId !== authReq.session.userId) {
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
      if (wedding.coupleId !== authReq.session.userId) {
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
        coupleId: authReq.session.userId,
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

  return router;
}
