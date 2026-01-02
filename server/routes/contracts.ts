import { Router } from "express";
import type { IStorage } from "../storage";
import { insertContractSchema } from "@shared/schema";

export async function registerContractRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const contracts = await storage.getContractsByWedding(req.params.weddingId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const contracts = await storage.getContractsByVendor(req.params.vendorId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor contracts" });
    }
  });

  router.get("/booking/:bookingId", async (req, res) => {
    try {
      const contract = await storage.getContractByBooking(req.params.bookingId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      
      if (!validatedData.eventId || validatedData.eventId.trim().length === 0) {
        return res.status(400).json({ 
          error: "Event is required",
          message: "Please select an event for this contract." 
        });
      }
      
      if (!validatedData.vendorId || validatedData.vendorId.trim().length === 0) {
        return res.status(400).json({ 
          error: "Vendor is required",
          message: "Please select a vendor for this contract." 
        });
      }
      
      if (!validatedData.contractTerms || validatedData.contractTerms.trim().length === 0) {
        return res.status(400).json({ 
          error: "Contract terms are required",
          message: "Please add contract terms before creating the contract." 
        });
      }
      
      if (!validatedData.totalAmount || parseFloat(validatedData.totalAmount) <= 0) {
        return res.status(400).json({ 
          error: "Invalid total amount",
          message: "Please enter a valid contract amount greater than zero." 
        });
      }
      
      const contract = await storage.createContract(validatedData);
      res.json(contract);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      if (req.body.contractTerms !== undefined && 
          (req.body.contractTerms === null || req.body.contractTerms.trim().length === 0)) {
        return res.status(400).json({ 
          error: "Contract terms cannot be empty",
          message: "Contract terms are required and cannot be removed." 
        });
      }
      
      const contract = await storage.updateContract(req.params.id, req.body);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteContract(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });
}
