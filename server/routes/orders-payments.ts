import { Router } from "express";
import type { IStorage } from "../storage";

export function createInvitationCardsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { tradition, ceremony, featured } = req.query;
      
      let cards;
      if (featured === 'true') {
        cards = await storage.getFeaturedInvitationCards();
      } else if (tradition) {
        cards = await storage.getInvitationCardsByTradition(tradition as string);
      } else if (ceremony) {
        cards = await storage.getInvitationCardsByCeremony(ceremony as string);
      } else {
        cards = await storage.getAllInvitationCards();
      }
      
      res.json(cards);
    } catch (error) {
      console.error("Error fetching invitation cards:", error);
      res.status(500).json({ error: "Failed to fetch invitation cards" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const card = await storage.getInvitationCard(req.params.id);
      if (!card) {
        return res.status(404).json({ error: "Invitation card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error fetching invitation card:", error);
      res.status(500).json({ error: "Failed to fetch invitation card" });
    }
  });

  return router;
}

export function createOrdersRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { weddingId, userId, cartItems, shippingInfo } = req.body;
      
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: "Cart items are required" });
      }
      
      if (!shippingInfo || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
        return res.status(400).json({ error: "Complete shipping information is required" });
      }
      
      let totalAmount = 0;
      const validatedItems = [];
      
      for (const item of cartItems) {
        const card = await storage.getInvitationCard(item.cardId);
        if (!card) {
          return res.status(400).json({ error: `Invalid card ID: ${item.cardId}` });
        }
        
        if (!item.quantity || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid quantity" });
        }
        
        const price = parseFloat(card.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;
        
        validatedItems.push({
          cardId: card.id,
          quantity: item.quantity,
          pricePerItem: price.toFixed(2),
          subtotal: subtotal.toFixed(2),
        });
      }
      
      const order = await storage.createOrder({
        weddingId: weddingId || '',
        userId: userId || '',
        totalAmount: totalAmount.toFixed(2),
        shippingName: shippingInfo.name,
        shippingEmail: shippingInfo.email,
        shippingPhone: shippingInfo.phone || '',
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingState: shippingInfo.state,
        shippingZip: shippingInfo.zip,
        shippingCountry: shippingInfo.country || 'USA',
      });
      
      for (const item of validatedItems) {
        await storage.createOrderItem({
          orderId: order.id,
          cardId: item.cardId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          subtotal: item.subtotal,
        });
      }
      
      res.status(201).json({ order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  router.get("/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByWedding(req.params.weddingId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching wedding orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  router.get("/:orderId/items", async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  router.post("/:orderId/confirm-payment", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentIntentId, paymentStatus } = req.body;
      
      const order = await storage.updateOrderPaymentInfo(
        orderId,
        paymentIntentId,
        paymentStatus
      );
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  return router;
}

export function createPaymentsRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/create-payment-intent", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const totalAmount = parseFloat(order.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({ error: "Invalid order total amount" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      const amountInCents = Math.round(totalAmount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          orderId: order.id,
        },
      });
      
      await storage.updateOrderPaymentInfo(
        orderId,
        paymentIntent.id,
        'pending'
      );
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  router.post("/stripe-webhook", async (req, res) => {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-11-17.clover",
      });
      
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;
        
        if (orderId) {
          const order = await storage.getOrder(orderId);
          if (!order) {
            console.error(`Order ${orderId} not found for payment verification`);
            return res.status(404).json({ error: 'Order not found' });
          }
          
          const expectedAmountInCents = Math.round(parseFloat(order.totalAmount) * 100);
          
          if (paymentIntent.amount !== expectedAmountInCents) {
            console.error(
              `SECURITY ALERT: Payment amount mismatch for order ${orderId}: ` +
              `expected ${expectedAmountInCents}, got ${paymentIntent.amount}`
            );
            
            await storage.updateOrderPaymentInfo(
              orderId,
              paymentIntent.id,
              'failed'
            );
            
            return res.status(400).json({ 
              error: 'Payment amount mismatch detected - order marked as failed' 
            });
          }
          
          await storage.updateOrderPaymentInfo(
            orderId,
            paymentIntent.id,
            'paid'
          );
          console.log(`Order ${orderId} marked as paid (verified ${paymentIntent.amount} cents)`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  return router;
}

export function createDepositPaymentsRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/:bookingId/create-deposit-intent", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.depositPaid) {
        return res.status(400).json({ error: "Deposit has already been paid for this booking" });
      }
      
      const vendor = await storage.getVendor(booking.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      let depositAmount: number;
      if (booking.depositAmount) {
        depositAmount = parseFloat(booking.depositAmount);
      } else if (booking.estimatedCost) {
        const percentage = booking.depositPercentage || 25;
        depositAmount = parseFloat(booking.estimatedCost) * (percentage / 100);
      } else {
        return res.status(400).json({ 
          error: "Cannot calculate deposit - booking has no estimated cost or deposit amount set" 
        });
      }
      
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      const amountInCents = Math.round(depositAmount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          bookingId: booking.id,
          vendorId: vendor.id,
          vendorName: vendor.name,
          weddingId: booking.weddingId,
          type: 'vendor_deposit',
        },
        description: `Deposit for ${vendor.name} - Booking confirmation`,
      });
      
      await storage.updateBooking(bookingId, {
        depositAmount: depositAmount.toString(),
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: 'pending',
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        depositAmount,
        vendorName: vendor.name,
      });
    } catch (error: any) {
      console.error("Error creating deposit payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  router.post("/:bookingId/confirm-deposit", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.depositPaid) {
        return res.status(400).json({ error: "Deposit has already been paid" });
      }
      
      if (!booking.stripePaymentIntentId) {
        console.error(`SECURITY ALERT: Booking ${bookingId} has no stored stripePaymentIntentId`);
        return res.status(400).json({ error: "No payment intent exists for this booking. Please start the payment process again." });
      }
      
      if (booking.stripePaymentIntentId !== paymentIntentId) {
        console.error(`SECURITY ALERT: Payment intent mismatch for booking ${bookingId}`);
        return res.status(400).json({ error: "Payment intent mismatch" });
      }
      
      if (!booking.depositAmount) {
        console.error(`SECURITY ALERT: Booking ${bookingId} has no stored depositAmount`);
        return res.status(400).json({ error: "No deposit amount recorded for this booking" });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-11-17.clover",
      });
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.id !== booking.stripePaymentIntentId) {
        console.error(`SECURITY ALERT: Retrieved PaymentIntent ID mismatch`);
        return res.status(400).json({ error: "Payment intent verification failed" });
      }
      
      if (paymentIntent.metadata?.bookingId !== bookingId) {
        console.error(`SECURITY ALERT: Payment intent metadata bookingId mismatch`);
        return res.status(400).json({ error: "Payment intent does not match this booking" });
      }
      
      if (paymentIntent.metadata?.weddingId !== booking.weddingId) {
        console.error(`SECURITY ALERT: Payment intent weddingId mismatch`);
        return res.status(400).json({ error: "Payment intent does not belong to this wedding" });
      }
      
      if (paymentIntent.currency !== 'usd') {
        console.error(`SECURITY ALERT: Payment intent currency is not USD`);
        return res.status(400).json({ error: "Invalid payment currency" });
      }
      
      const expectedDepositAmount = parseFloat(booking.depositAmount);
      const expectedAmountInCents = Math.round(expectedDepositAmount * 100);
      if (paymentIntent.amount !== expectedAmountInCents) {
        console.error(`SECURITY ALERT: Payment amount mismatch for booking ${bookingId}`);
        return res.status(400).json({ error: "Payment amount mismatch" });
      }
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: "Payment has not succeeded",
          paymentStatus: paymentIntent.status 
        });
      }
      
      const freshBooking = await storage.getBooking(bookingId);
      if (!freshBooking) {
        return res.status(404).json({ error: "Booking no longer exists" });
      }
      if (freshBooking.depositPaid) {
        console.log(`Booking ${bookingId} deposit already marked paid by concurrent request`);
        return res.status(400).json({ error: "Deposit has already been paid" });
      }
      if (freshBooking.stripePaymentIntentId !== paymentIntentId) {
        console.error(`SECURITY ALERT: Booking stripePaymentIntentId changed during confirmation`);
        return res.status(400).json({ error: "Payment intent changed during confirmation" });
      }
      
      const updatedBooking = await storage.updateBooking(bookingId, {
        stripePaymentStatus: 'succeeded',
        depositPaid: true,
        depositPaidDate: new Date(),
        status: 'confirmed',
        confirmedDate: new Date(),
        stripePaymentIntentId: null,
      });
      
      console.log(`Booking ${bookingId} deposit confirmed: ${paymentIntent.amount} cents paid`);
      
      res.json(updatedBooking);
    } catch (error: any) {
      console.error("Error confirming deposit payment:", error);
      res.status(500).json({ error: "Failed to confirm deposit payment: " + error.message });
    }
  });

  router.get("/:bookingId/deposit-status", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      let depositAmount = booking.depositAmount ? parseFloat(booking.depositAmount) : null;
      if (!depositAmount && booking.estimatedCost) {
        const percentage = booking.depositPercentage || 25;
        depositAmount = parseFloat(booking.estimatedCost) * (percentage / 100);
      }
      
      res.json({
        bookingId: booking.id,
        depositAmount,
        depositPercentage: booking.depositPercentage || 25,
        depositPaid: booking.depositPaid || false,
        depositPaidDate: booking.depositPaidDate,
        stripePaymentStatus: booking.stripePaymentStatus,
        estimatedCost: booking.estimatedCost ? parseFloat(booking.estimatedCost) : null,
      });
    } catch (error) {
      console.error("Error fetching deposit status:", error);
      res.status(500).json({ error: "Failed to fetch deposit status" });
    }
  });

  return router;
}
