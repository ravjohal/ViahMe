import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, AuthRequest } from "../auth-middleware";

export async function registerQuoteRequestRoutes(router: Router, storage: IStorage) {
  router.post("/vendors/:vendorId/quote-request", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { vendorId } = req.params;
      const { 
        weddingId,
        eventId,
        eventName,
        eventDate,
        eventLocation,
        guestCount,
        budgetRange,
        additionalNotes,
      } = req.body;

      if (!weddingId || !eventId || !eventName) {
        return res.status(400).json({ error: "Wedding ID, event ID, and event name are required" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      if (!vendor.email) {
        return res.status(400).json({ error: "Vendor does not have an email address configured" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      const user = authReq.user;
      if (!user?.email) {
        return res.status(400).json({ error: "User email is required to send quote request" });
      }

      const senderName = user.email.split('@')[0];
      const weddingTitle = wedding.title || `${wedding.partner1Name} & ${wedding.partner2Name || 'Partner'}'s Wedding`;

      console.log('=== QUOTE REQUEST DETAILS ===');
      console.log('To Vendor:', vendor.name, `(${vendor.email})`);
      console.log('From:', senderName, `(${user.email})`);
      console.log('Wedding:', weddingTitle);
      console.log('Event:', eventName);
      console.log('Event Date:', eventDate || 'Not specified');
      console.log('Event Location:', eventLocation || 'Not specified');
      console.log('Guest Count:', guestCount || 'Not specified');
      console.log('Budget Range:', budgetRange || 'Not specified');
      console.log('Additional Notes:', additionalNotes || 'None');
      console.log('=============================');

      const quoteRequest = await storage.createQuoteRequest({
        weddingId,
        vendorId,
        eventId,
        senderEmail: user.email,
        senderName,
        eventName,
        eventDate: eventDate || null,
        eventLocation: eventLocation || null,
        guestCount: guestCount || null,
        budgetRange: budgetRange || null,
        additionalNotes: additionalNotes || null,
      });

      try {
        const { sendQuoteRequestEmail } = await import('../email');
        await sendQuoteRequestEmail({
          to: vendor.email,
          vendorName: vendor.name,
          senderName,
          senderEmail: user.email,
          eventName,
          eventDate,
          eventLocation,
          guestCount,
          budgetRange,
          additionalNotes,
          weddingTitle,
        });
      } catch (emailError) {
        console.error('Failed to send quote request email:', emailError);
      }

      res.json({ 
        message: "Quote request sent successfully",
        quoteRequest 
      });
    } catch (error) {
      console.error("Error sending quote request:", error);
      res.status(500).json({ error: "Failed to send quote request" });
    }
  });

  router.get("/quote-requests/wedding/:weddingId", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const quoteRequests = await storage.getQuoteRequestsByWedding(req.params.weddingId);
      res.json(quoteRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });
}
