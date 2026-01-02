import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import { insertContractSignatureSchema } from "@shared/schema";

export async function registerContractSignatureRoutes(router: Router, storage: IStorage) {
  router.get("/:contractId/signatures", async (req, res) => {
    try {
      const signatures = await storage.getSignaturesByContract(req.params.contractId);
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract signatures" });
    }
  });

  router.post("/:contractId/sign", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { signatureData, signerName, signerEmail, signerRole } = req.body;

      if (!signatureData || !signerName || !signerEmail || !signerRole) {
        return res.status(400).json({ error: "Missing required signature data" });
      }

      if (typeof signatureData !== 'string' || signatureData.trim().length === 0) {
        return res.status(400).json({ error: "Signature data cannot be empty" });
      }

      if (signerRole !== 'couple' && signerRole !== 'vendor') {
        return res.status(400).json({ error: "Invalid signer role. Must be 'couple' or 'vendor'" });
      }

      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (signerRole === 'couple') {
        const wedding = await storage.getWedding(contract.weddingId);
        if (!wedding || wedding.userId !== authReq.session.userId) {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a couple" });
        }
      } else if (signerRole === 'vendor') {
        const user = await storage.getUserById(authReq.session.userId);
        if (!user || user.role !== 'vendor') {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a vendor" });
        }
        const vendor = await storage.getVendor(contract.vendorId);
        if (!vendor || vendor.userId !== authReq.session.userId) {
          return res.status(403).json({ error: "You are not authorized to sign this contract as a vendor" });
        }
      }

      const alreadySigned = await storage.hasContractBeenSigned(contractId, authReq.session.userId);
      if (alreadySigned) {
        return res.status(400).json({ error: "You have already signed this contract" });
      }

      const signaturePayload = insertContractSignatureSchema.parse({
        contractId,
        signerId: authReq.session.userId,
        signerName,
        signerEmail,
        signerRole,
        signatureData,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      const signature = await storage.createContractSignature(signaturePayload);

      if (contract.status === 'sent' || contract.status === 'draft') {
        await storage.updateContract(contractId, {
          status: 'signed',
          signedDate: new Date(),
        });
      }

      res.json(signature);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      console.error('Error signing contract:', error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });
}
