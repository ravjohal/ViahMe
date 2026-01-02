import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import { checkContractAccess } from "./contract-documents";

export async function registerContractPaymentRoutes(router: Router, storage: IStorage) {
  router.get("/:contractId/payments", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payments = await storage.getPaymentsByContract(contractId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract payments" });
    }
  });

  router.get("/:contractId/payment-summary", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payments = await storage.getPaymentsByContract(contractId);
      const contract = access.contract!;

      const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalPending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const contractTotal = parseFloat(contract.totalAmount);
      const remaining = contractTotal - totalPaid;

      res.json({
        contractTotal,
        totalPaid,
        totalPending,
        remaining,
        paymentCount: payments.length,
        completedCount: payments.filter(p => p.status === 'completed').length,
        pendingCount: payments.filter(p => p.status === 'pending').length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment summary" });
    }
  });

  router.post("/:contractId/payments", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { amount, paymentMethod, paymentType, dueDate, notes, milestoneId } = req.body;

      if (!amount || !paymentMethod || !paymentType) {
        return res.status(400).json({ error: "Missing required fields: amount, paymentMethod, paymentType" });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      const validMethods = ['cash', 'check', 'credit_card', 'bank_transfer', 'venmo', 'zelle', 'paypal', 'other'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      const validTypes = ['deposit', 'milestone', 'final', 'tip', 'refund', 'other'];
      if (!validTypes.includes(paymentType)) {
        return res.status(400).json({ error: "Invalid payment type" });
      }

      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.createContractPayment({
        contractId,
        amount: parsedAmount.toFixed(2),
        paymentMethod,
        paymentType,
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ? notes.substring(0, 1000) : null,
        milestoneId: milestoneId || null,
        recordedBy: authReq.session.userId,
      });

      res.json(payment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  router.patch("/:contractId/payments/:paymentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, paymentId } = req.params;
      const { status, paidDate, transactionId, notes } = req.body;

      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.getContractPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.contractId !== contractId) {
        return res.status(403).json({ error: "Payment does not belong to this contract" });
      }

      if (status) {
        const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: "Invalid payment status" });
        }
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (paidDate) updateData.paidDate = new Date(paidDate);
      if (transactionId !== undefined) updateData.transactionId = transactionId ? transactionId.substring(0, 255) : null;
      if (notes !== undefined) updateData.notes = notes ? notes.substring(0, 1000) : null;

      const updated = await storage.updateContractPayment(paymentId, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  router.delete("/:contractId/payments/:paymentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, paymentId } = req.params;
      
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const payment = await storage.getContractPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.contractId !== contractId) {
        return res.status(403).json({ error: "Payment does not belong to this contract" });
      }

      if (payment.recordedBy !== authReq.session.userId) {
        const vendor = await storage.getVendor(access.contract!.vendorId);
        const wedding = await storage.getWedding(access.contract!.weddingId);
        const isOwner = (vendor && vendor.userId === authReq.session.userId) || 
                       (wedding && wedding.userId === authReq.session.userId);
        if (!isOwner) {
          return res.status(403).json({ error: "Not authorized to delete this payment" });
        }
      }

      await storage.deleteContractPayment(paymentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });
}
