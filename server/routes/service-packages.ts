import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import { insertServicePackageSchema } from "@shared/schema";

export async function registerServicePackageRoutes(router: Router, storage: IStorage) {
  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const packages = await storage.getServicePackagesByVendor(req.params.vendorId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service packages" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const pkg = await storage.getServicePackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service package" });
    }
  });

  router.post("/", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertServicePackageSchema.parse(req.body);
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== validatedData.vendorId) {
        return res.status(403).json({ error: "You can only create packages for your own vendor profile" });
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

  router.patch("/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertServicePackageSchema.partial().parse(req.body);
      
      const existingPkg = await storage.getServicePackage(req.params.id);
      if (!existingPkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existingPkg.vendorId) {
        return res.status(403).json({ error: "You can only update your own packages" });
      }
      
      const pkg = await storage.updateServicePackage(req.params.id, validatedData);
      res.json(pkg);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update service package" });
    }
  });

  router.delete("/:id", await requireAuth(storage, false), async (req: AuthRequest, res) => {
    try {
      const existingPkg = await storage.getServicePackage(req.params.id);
      if (!existingPkg) {
        return res.status(404).json({ error: "Service package not found" });
      }
      
      const vendors = await storage.getAllVendors();
      const userVendor = vendors.find(v => v.userId === req.user?.id);
      
      if (!userVendor || userVendor.id !== existingPkg.vendorId) {
        return res.status(403).json({ error: "You can only delete your own packages" });
      }
      
      const success = await storage.deleteServicePackage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service package not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service package" });
    }
  });
}
