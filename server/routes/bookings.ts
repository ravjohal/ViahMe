import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, AuthRequest } from "../auth-middleware";
import { insertBookingSchema, Vendor } from "@shared/schema";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "../email";

export async function registerBookingRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookingsByWedding(req.params.weddingId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  router.get("/with-vendors/:weddingId", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookingsWithVendorsByWedding(req.params.weddingId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings with vendor details" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.session.userId;
      
      const validatedData = insertBookingSchema.parse(req.body);
      
      const wedding = await storage.getWedding(validatedData.weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const user = await storage.getUser(userId);
      const isOwner = wedding.userId === userId;
      const isCollaborator = user ? await storage.isWeddingCollaborator(validatedData.weddingId, user.email) : false;
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: "Access denied to this wedding" });
      }
      
      const vendor = await storage.getVendor(validatedData.vendorId);
      const event = validatedData.eventId ? await storage.getEvent(validatedData.eventId) : null;
      
      console.log('=== BOOKING REQUEST DETAILS ===');
      console.log('To Vendor:', vendor?.name || 'Unknown', vendor?.email ? `(${vendor.email})` : '');
      console.log('Wedding:', wedding?.partner1Name && wedding?.partner2Name 
        ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
        : wedding?.title || 'Unknown');
      console.log('Event:', event?.name || 'No specific event');
      console.log('Event Date:', event?.date ? new Date(event.date).toLocaleDateString() : 'Not specified');
      console.log('Event Time:', event?.time || 'Not specified');
      console.log('Event Location:', event?.location || 'Not specified');
      console.log('Guest Count:', event?.guestCount || 'Not specified');
      console.log('Couple Notes:', validatedData.coupleNotes || 'None');
      console.log('Status:', validatedData.status);
      console.log('================================');
      
      const booking = await storage.createBooking(validatedData);
      
      if (wedding && vendor) {
        const eventName = event?.name || 'General Inquiry';
        const coupleName = wedding.partner1Name && wedding.partner2Name 
          ? `${wedding.partner1Name} & ${wedding.partner2Name}`
          : wedding.partner1Name || wedding.partner2Name || 'The Couple';
        
        const systemMessageContent = `📩 **Booking Request Sent**\n\n${coupleName} has requested a booking for **${eventName}**${event?.date ? ` on ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.\n\n${validatedData.coupleNotes ? `**Notes from couple:**\n${validatedData.coupleNotes}` : ''}`;
        
        await storage.createMessage({
          weddingId: booking.weddingId,
          vendorId: booking.vendorId,
          eventId: booking.eventId || null,
          bookingId: booking.id,
          senderId: 'system',
          senderType: 'system',
          content: systemMessageContent,
          messageType: 'booking_request',
          attachments: null,
        });

        try {
          let urgencyScore = 50;
          let budgetFitScore = 50;
          let qualificationScore = 25;

          if (event?.date) {
            const eventDate = new Date(event.date);
            const now = new Date();
            const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilEvent > 0 && daysUntilEvent <= 30) urgencyScore = 100;
            else if (daysUntilEvent <= 90) urgencyScore = 85;
            else if (daysUntilEvent <= 180) urgencyScore = 70;
            else if (daysUntilEvent <= 365) urgencyScore = 50;
            else urgencyScore = 30;
            qualificationScore += 25;
          }

          if (wedding.totalBudget) {
            const budget = parseFloat(wedding.totalBudget);
            if (budget >= 50000) budgetFitScore = 100;
            else if (budget >= 30000) budgetFitScore = 85;
            else if (budget >= 20000) budgetFitScore = 70;
            else if (budget >= 10000) budgetFitScore = 50;
            else budgetFitScore = 30;
            qualificationScore += 25;
          }

          if (event?.guestCount) qualificationScore += 25;

          const overallScore = Math.round((urgencyScore * 0.4) + (budgetFitScore * 0.3) + (qualificationScore * 0.3));
          let priority: 'hot' | 'warm' | 'medium' | 'cold' = 'medium';
          if (overallScore >= 80) priority = 'hot';
          else if (overallScore >= 60) priority = 'warm';
          else if (overallScore >= 40) priority = 'medium';
          else priority = 'cold';

          await storage.createVendorLead({
            vendorId: vendor.id,
            weddingId: wedding.id,
            bookingId: booking.id,
            coupleName,
            coupleEmail: wedding.coupleEmail || undefined,
            couplePhone: undefined,
            sourceType: 'booking_request',
            status: 'new',
            priority,
            eventDate: event?.date ? new Date(event.date) : undefined,
            estimatedBudget: wedding.totalBudget ? `$${parseFloat(wedding.totalBudget).toLocaleString()}` : undefined,
            guestCount: event?.guestCount || undefined,
            tradition: wedding.tradition || undefined,
            city: wedding.location || undefined,
            notes: validatedData.coupleNotes || undefined,
            urgencyScore,
            budgetFitScore,
            engagementScore: 50,
            qualificationScore,
            overallScore,
          });

          console.log(`Lead created for vendor ${vendor.name} from booking request`);
        } catch (leadError) {
          console.error('Failed to create lead from booking:', leadError);
        }
      }
      
      (async () => {
        try {
          const vendor = await storage.getVendor(booking.vendorId);
          const event = booking.eventId ? await storage.getEvent(booking.eventId) : null;
          const wedding = await storage.getWedding(booking.weddingId);
          
          if (!vendor || !wedding) return;
          
          const eventName = event?.name || 'Your Event';
          const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Date TBD';
          
          const coupleName = wedding.partner1Name && wedding.partner2Name 
            ? `${wedding.partner1Name} & ${wedding.partner2Name}`
            : wedding.partner1Name || wedding.partner2Name || 'The Couple';
          
          const timeSlot = booking.timeSlot === 'full_day' || !booking.timeSlot ? 'Full Day' :
                          booking.timeSlot === 'morning' ? 'Morning' :
                          booking.timeSlot === 'afternoon' ? 'Afternoon' :
                          booking.timeSlot === 'evening' ? 'Evening' : 'Full Day';
          
          if (wedding.coupleEmail) {
            await sendBookingConfirmationEmail({
              to: wedding.coupleEmail,
              coupleName,
              vendorName: vendor.name,
              vendorCategory: vendor.categories?.[0] || 'vendor',
              eventName,
              eventDate,
              timeSlot,
              bookingId: booking.id,
            });
          }
          
          const vendorEmail = vendor.contact && vendor.contact.includes('@') ? vendor.contact : null;
          if (vendorEmail) {
            await sendVendorNotificationEmail({
              to: vendorEmail,
              vendorName: vendor.name,
              coupleName,
              eventName,
              eventDate,
              timeSlot,
              bookingId: booking.id,
              coupleEmail: wedding.coupleEmail || undefined,
              couplePhone: wedding.couplePhone || undefined,
            });
          }
        } catch (emailError) {
          console.error('Failed to send booking emails:', emailError);
        }
      })();
      
      res.json(booking);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  router.patch("/:id", await requireAuth(storage, false), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const existingBooking = await storage.getBooking(req.params.id);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (authReq.user?.role === 'vendor') {
        const vendors = await storage.getAllVendors();
        const userVendor = vendors.find((v: Vendor) => v.userId === authReq.user?.id);
        if (!userVendor || userVendor.id !== existingBooking.vendorId) {
          return res.status(403).json({ error: "You can only update bookings for your own vendor profile" });
        }
      } else if (authReq.user?.role === 'couple') {
        const allowedFields = ['notes', 'coupleNotes'];
        const updateFields = Object.keys(req.body);
        const hasDisallowedFields = updateFields.some(f => !allowedFields.includes(f));
        if (hasDisallowedFields) {
          return res.status(403).json({ error: "Couples can only update notes, not booking status" });
        }
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const booking = await storage.updateBooking(req.params.id, req.body);
      
      if (booking && req.body.status && req.body.status !== existingBooking.status) {
        const vendor = await storage.getVendor(booking.vendorId);
        const event = booking.eventId ? await storage.getEvent(booking.eventId) : null;
        
        let messageContent = '';
        let messageType: 'booking_confirmed' | 'booking_declined' | 'status_update' = 'status_update';
        
        if (req.body.status === 'confirmed') {
          messageType = 'booking_confirmed';
          messageContent = `✅ **Booking Confirmed**\n\n${vendor?.name || 'The vendor'} has confirmed the booking request for **${event?.name || 'your event'}**.${req.body.vendorNotes ? `\n\n**Vendor notes:**\n${req.body.vendorNotes}` : ''}`;
          
          if (vendor && vendor.categories) {
            try {
              const tasks = await storage.getTasksByWedding(booking.weddingId);
              const vendorCategories = vendor.categories.map((c: string) => c.toLowerCase());
              
              for (const task of tasks) {
                if (task.completed) continue;
                
                const taskTitle = task.title.toLowerCase();
                const taskCategory = (task.category || '').toLowerCase();
                
                const matchesCategory = vendorCategories.some((vc: string) => {
                  if (taskCategory.includes(vc) || vc.includes(taskCategory)) return true;
                  
                  if (taskTitle.includes('book') && (taskTitle.includes(vc) || vc.includes(taskTitle.split(' ').pop() || ''))) return true;
                  
                  const categoryMappings: Record<string, string[]> = {
                    'photography': ['photographer', 'photo', 'photography'],
                    'videography': ['videographer', 'video', 'videography'],
                    'catering': ['caterer', 'catering', 'food'],
                    'florist': ['florist', 'flowers', 'floral', 'decor'],
                    'decorator': ['decorator', 'decor', 'decoration', 'mandap'],
                    'dj': ['dj', 'music', 'entertainment', 'dhol'],
                    'venue': ['venue', 'hall', 'banquet', 'temple', 'gurdwara', 'church'],
                    'makeup': ['makeup', 'hair', 'mehndi', 'henna', 'beauty'],
                    'officiant': ['priest', 'pandit', 'officiant', 'granthi', 'ragi'],
                    'attire': ['attire', 'lehenga', 'sherwani', 'dress', 'clothing'],
                    'jewelry': ['jewelry', 'jewellery'],
                    'invitation': ['invitation', 'stationery', 'cards'],
                    'transportation': ['transport', 'baraat', 'car', 'limo'],
                    'cake': ['cake', 'bakery', 'dessert'],
                    'band': ['band', 'orchestra', 'kirtan', 'sangeet'],
                  };
                  
                  for (const [key, aliases] of Object.entries(categoryMappings)) {
                    if (aliases.some(a => vc.includes(a) || a.includes(vc))) {
                      if (aliases.some(a => taskTitle.includes(a) || taskCategory.includes(a))) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                });
                
                if (matchesCategory) {
                  await storage.updateTask(task.id, { 
                    completed: true, 
                    completedAt: new Date() 
                  });
                  console.log(`Auto-completed task "${task.title}" after booking vendor ${vendor.name}`);
                }
              }
            } catch (taskError) {
              console.error("Error auto-completing tasks:", taskError);
            }
          }
        } else if (req.body.status === 'declined') {
          messageType = 'booking_declined';
          messageContent = `❌ **Booking Declined**\n\n${vendor?.name || 'The vendor'} has declined the booking request for **${event?.name || 'your event'}**.${req.body.vendorNotes ? `\n\n**Vendor notes:**\n${req.body.vendorNotes}` : ''}`;
        }
        
        if (messageContent) {
          await storage.createMessage({
            weddingId: booking.weddingId,
            vendorId: booking.vendorId,
            eventId: booking.eventId || null,
            bookingId: booking.id,
            senderId: 'system',
            senderType: 'system',
            content: messageContent,
            messageType,
            attachments: null,
          });
        }
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  router.get("/vendor/:vendorId", await requireAuth(storage, false), async (req: Request, res: Response) => {
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
      res.status(500).json({ error: "Failed to fetch vendor bookings", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}
