import { Router } from "express";
import type { IStorage } from "../storage";
import { insertReviewSchema } from "@shared/schema";

export function createReviewsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByVendor(req.params.vendorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByWedding(req.params.weddingId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      const vendor = await storage.getVendor(validatedData.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const existingReviews = await storage.getReviewsByWedding(validatedData.weddingId);
      const duplicate = existingReviews.find(r => r.vendorId === validatedData.vendorId);
      if (duplicate) {
        return res.status(400).json({ error: "You have already reviewed this vendor" });
      }
      
      const review = await storage.createReview(validatedData);
      
      const allVendorReviews = await storage.getReviewsByVendor(validatedData.vendorId);
      if (allVendorReviews.length > 0) {
        const totalRating = allVendorReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Math.round((totalRating / allVendorReviews.length) * 10) / 10;
        await storage.updateVendor(validatedData.vendorId, {
          rating: String(avgRating),
          reviewCount: allVendorReviews.length,
        });
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  router.get("/yelp/:vendorId", async (req, res) => {
    try {
      const apiKey = process.env.YELP_API_KEY;
      if (!apiKey) {
        return res.json({ reviews: [], source: "yelp", available: false, message: "Yelp API key not configured" });
      }

      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor || !vendor.yelpBusinessId) {
        return res.json({ reviews: [], source: "yelp", available: false });
      }

      const response = await fetch(`https://api.yelp.com/v3/businesses/${vendor.yelpBusinessId}/reviews`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({
        reviews: data.reviews || [],
        total: data.total || 0,
        source: "yelp",
        available: true,
      });
    } catch (error) {
      console.error("Error fetching Yelp reviews:", error);
      res.json({ reviews: [], source: "yelp", available: false, error: "Failed to fetch Yelp reviews" });
    }
  });

  router.get("/google/:vendorId", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.json({ reviews: [], source: "google", available: false, message: "Google Places API key not configured" });
      }

      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor || !vendor.googlePlaceId) {
        return res.json({ reviews: [], source: "google", available: false });
      }

      const response = await fetch(`https://places.googleapis.com/v1/places/${vendor.googlePlaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'reviews,displayName,rating,userRatingCount',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({
        reviews: data.reviews || [],
        displayName: data.displayName?.text,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        source: "google",
        available: true,
      });
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.json({ reviews: [], source: "google", available: false, error: "Failed to fetch Google reviews" });
    }
  });

  return router;
}
