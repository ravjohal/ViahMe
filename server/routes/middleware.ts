import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";

export function ensureCoupleAccess(
  storage: IStorage,
  getWeddingId: (req: AuthRequest) => string | undefined | Promise<string | undefined>
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const weddingId = await getWeddingId(req);
      if (!weddingId) {
        return res.status(400).json({ error: "Wedding ID required" });
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }

      if (wedding.userId !== userId) {
        const roles = await storage.getWeddingRoles(weddingId);
        const hasAccess = roles.some(role => role.userId === userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied: You do not have permission for this wedding" });
        }
      }

      (req as any).wedding = wedding;
      next();
    } catch (error) {
      console.error("Error verifying couple access:", error);
      res.status(500).json({ error: "Failed to verify access" });
    }
  };
}

export function ensureVendorAccess(
  storage: IStorage,
  getVendorId: (req: AuthRequest) => string | undefined | Promise<string | undefined>
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const vendorId = await getVendorId(req);
      if (!vendorId) {
        return res.status(400).json({ error: "Vendor ID required" });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      if (vendor.userId !== userId) {
        const teammates = await storage.getVendorTeammates(vendorId);
        const isTeammate = teammates.some(t => t.userId === userId);
        if (!isTeammate) {
          return res.status(403).json({ error: "Access denied: You do not have permission for this vendor" });
        }
      }

      (req as any).vendor = vendor;
      next();
    } catch (error) {
      console.error("Error verifying vendor access:", error);
      res.status(500).json({ error: "Failed to verify access" });
    }
  };
}
