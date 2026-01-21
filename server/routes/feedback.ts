import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { AuthRequest } from "../auth-middleware";
import { z } from "zod";

const feedbackSchema = z.object({
  feedbackType: z.enum(['bug', 'feature', 'general']).default('bug'),
  description: z.string().min(1, "Description is required"),
  pageUrl: z.string().min(1, "Page URL is required"),
  userEmail: z.string().email().optional().or(z.literal("")),
  screenshotUrl: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
    platform: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
});

export async function registerFeedbackRoutes(router: Router, storage: IStorage) {
  // Submit feedback (works for both authenticated and anonymous users)
  router.post("/", async (req: Request, res: Response) => {
    try {
      const validatedData = feedbackSchema.parse(req.body);
      
      const authReq = req as AuthRequest;
      const userId = authReq.session?.userId || null;
      
      const feedback = await storage.createUserFeedback({
        userId,
        userEmail: validatedData.userEmail || null,
        feedbackType: validatedData.feedbackType,
        description: validatedData.description,
        pageUrl: validatedData.pageUrl,
        screenshotUrl: validatedData.screenshotUrl || null,
        deviceInfo: validatedData.deviceInfo || null,
      });
      
      res.status(201).json({ 
        success: true, 
        message: "Thank you for your feedback!",
        id: feedback.id 
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Get all feedback (admin only)
  router.get("/", async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(authReq.session.userId);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const status = req.query.status as string | undefined;
      const feedback = status 
        ? await storage.getUserFeedbackByStatus(status)
        : await storage.getAllUserFeedback();
      
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // Update feedback status (admin only)
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(authReq.session.userId);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { status, adminNotes } = req.body;
      
      const updated = await storage.updateUserFeedback(req.params.id, {
        status,
        adminNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });
}
