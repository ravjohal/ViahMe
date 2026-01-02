import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { Contract } from "@shared/schema";

async function checkContractAccess(storage: IStorage, contractId: string, userId: string): Promise<{ authorized: boolean; contract?: Contract; reason?: string }> {
  const contract = await storage.getContract(contractId);
  if (!contract) {
    return { authorized: false, reason: "Contract not found" };
  }

  const vendor = await storage.getVendor(contract.vendorId);
  if (vendor && vendor.userId === userId) {
    return { authorized: true, contract };
  }

  const wedding = await storage.getWedding(contract.weddingId);
  if (wedding && wedding.userId === userId) {
    return { authorized: true, contract };
  }

  const teamMembers = await storage.getTeamMembersByWedding(contract.weddingId);
  const isMember = teamMembers.some(m => m.userId === userId && m.status === 'active');
  if (isMember) {
    return { authorized: true, contract };
  }

  return { authorized: false, reason: "Not authorized to access this contract" };
}

export async function registerContractDocumentRoutes(router: Router, storage: IStorage) {
  router.get("/:contractId/documents", await requireAuth(storage, false), async (req, res) => {
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

      const documents = await storage.getDocumentsByContract(contractId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract documents" });
    }
  });

  router.post("/:contractId/documents", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId } = req.params;
      const { fileName, fileUrl, fileType, fileSize, documentType, description } = req.body;

      if (!fileName || !fileUrl || !documentType) {
        return res.status(400).json({ error: "Missing required fields: fileName, fileUrl, documentType" });
      }

      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({ error: "Invalid file name" });
      }

      try {
        new URL(fileUrl);
      } catch {
        return res.status(400).json({ error: "Invalid file URL" });
      }

      const validDocTypes = ['contract', 'amendment', 'invoice', 'receipt', 'proposal', 'other'];
      if (!validDocTypes.includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const document = await storage.createContractDocument({
        contractId,
        fileName: fileName.substring(0, 255),
        fileUrl,
        fileType: fileType || 'application/octet-stream',
        fileSize: Math.max(0, parseInt(fileSize) || 0),
        documentType,
        description: description ? description.substring(0, 1000) : null,
        uploadedBy: authReq.session.userId,
      });

      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  router.delete("/:contractId/documents/:documentId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { contractId, documentId } = req.params;
      
      const access = await checkContractAccess(storage, contractId, authReq.session.userId);
      if (!access.authorized) {
        return res.status(access.reason === "Contract not found" ? 404 : 403).json({ error: access.reason });
      }

      const document = await storage.getContractDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (document.uploadedBy !== authReq.session.userId) {
        const vendor = await storage.getVendor(access.contract!.vendorId);
        const wedding = await storage.getWedding(access.contract!.weddingId);
        const isOwner = (vendor && vendor.userId === authReq.session.userId) || 
                       (wedding && wedding.userId === authReq.session.userId);
        if (!isOwner) {
          return res.status(403).json({ error: "Not authorized to delete this document" });
        }
      }

      await storage.deleteContractDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });
}

export { checkContractAccess };
