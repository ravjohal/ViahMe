import type { Request, Response, NextFunction } from "express";
import type { User, PermissionCategory, PermissionLevel } from "@shared/schema";
import { storage } from "./storage";
import type { Session, SessionData } from "express-session";

export interface AuthRequest extends Request {
  user?: User;
  weddingId?: string;
  isWeddingOwner?: boolean;
  userPermissions?: Map<PermissionCategory, PermissionLevel>;
  session: Session & Partial<SessionData> & {
    userId?: string;
    userRole?: string;
    user?: {
      id: string;
      userType: "couple" | "vendor";
    };
  };
}

export async function requireAuth(
  storage: any, // IStorage type
  enforceEmailVerification: boolean = true
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // If email verification is required, check it here
    if (enforceEmailVerification) {
      try {
        const user = await storage.getUser(req.session.userId);
        
        if (!user) {
          req.session.destroy((err) => {
            if (err) console.error("Session destroy error:", err);
          });
          res.status(401).json({ error: "User not found. Please log in again." });
          return;
        }

        if (!user.emailVerified) {
          res.status(403).json({ 
            error: "Email verification required",
            message: "Please verify your email address to access this resource"
          });
          return;
        }

        req.user = user;
      } catch (error) {
        console.error("Auth verification error:", error);
        req.session.destroy((err) => {
          if (err) console.error("Session destroy error:", err);
        });
        res.status(500).json({ error: "Authentication error. Please log in again." });
        return;
      }
    }

    next();
  };
}

export async function requireRole(...allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.session.userRole || !allowedRoles.includes(req.session.userRole)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
}

export async function ensureEmailVerified(
  storage: any, // IStorage type
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const user = await storage.getUser(req.session.userId);
    
    // User not found - destroy session and require re-auth
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      res.status(401).json({ error: "User not found. Please log in again." });
      return;
    }

    // Email not verified - reject but keep session for verification flow
    if (!user.emailVerified) {
      res.status(403).json({ 
        error: "Email verification required",
        message: "Please verify your email address before accessing this resource"
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // Database/storage error - destroy session for security
    console.error("Email verification check error:", error);
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
    });
    res.status(500).json({ error: "Authentication error. Please log in again." });
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  next();
}

export function requireWeddingAccess(
  weddingIdParam: string = "weddingId"
): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session?.user?.id || req.session?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const weddingId = req.params[weddingIdParam] || req.body?.weddingId || (req.query?.weddingId as string);
    
    if (!weddingId) {
      res.status(400).json({ error: "Wedding ID required" });
      return;
    }

    try {
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      
      if (!isOwner && permissions.size === 0) {
        res.status(403).json({ error: "You do not have access to this wedding" });
        return;
      }

      req.weddingId = weddingId;
      req.isWeddingOwner = isOwner;
      req.userPermissions = permissions;
      
      next();
    } catch (error) {
      console.error("Error checking wedding access:", error);
      res.status(500).json({ error: "Error checking permissions" });
    }
  };
}

export function requirePermission(
  category: PermissionCategory,
  requiredLevel: PermissionLevel,
  weddingIdParam: string = "weddingId"
): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session?.user?.id || req.session?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const weddingId = req.params[weddingIdParam] || req.body?.weddingId || (req.query?.weddingId as string);
    
    if (!weddingId) {
      res.status(400).json({ error: "Wedding ID required" });
      return;
    }

    try {
      const hasPermission = await storage.checkUserPermission(
        userId,
        weddingId,
        category,
        requiredLevel
      );

      if (!hasPermission) {
        res.status(403).json({ 
          error: `You do not have ${requiredLevel} permission for ${category}` 
        });
        return;
      }

      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      
      req.weddingId = weddingId;
      req.isWeddingOwner = isOwner;
      req.userPermissions = permissions;
      
      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ error: "Error checking permissions" });
    }
  };
}

export function requireOwner(
  weddingIdParam: string = "weddingId"
): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session?.user?.id || req.session?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const weddingId = req.params[weddingIdParam] || req.body?.weddingId || (req.query?.weddingId as string);
    
    if (!weddingId) {
      res.status(400).json({ error: "Wedding ID required" });
      return;
    }

    try {
      const wedding = await storage.getWedding(weddingId);
      
      if (!wedding) {
        res.status(404).json({ error: "Wedding not found" });
        return;
      }

      if (wedding.userId !== userId) {
        const { isOwner } = await storage.getUserPermissionsForWedding(userId, weddingId);
        if (!isOwner) {
          res.status(403).json({ error: "Only the wedding owner can perform this action" });
          return;
        }
      }

      req.weddingId = weddingId;
      req.isWeddingOwner = true;
      
      next();
    } catch (error) {
      console.error("Error checking owner:", error);
      res.status(500).json({ error: "Error checking permissions" });
    }
  };
}

export function requireManageCollaborators(
  weddingIdParam: string = "weddingId"
): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> {
  return requirePermission("collaborators", "manage", weddingIdParam);
}

export function getPermissionLevel(
  permissions: Map<PermissionCategory, PermissionLevel> | undefined, 
  category: PermissionCategory
): PermissionLevel | null {
  if (!permissions) return null;
  return permissions.get(category) || null;
}

export function canView(
  permissions: Map<PermissionCategory, PermissionLevel> | undefined, 
  category: PermissionCategory, 
  isOwner: boolean = false
): boolean {
  if (isOwner) return true;
  const level = getPermissionLevel(permissions, category);
  return level !== null;
}

export function canEdit(
  permissions: Map<PermissionCategory, PermissionLevel> | undefined, 
  category: PermissionCategory, 
  isOwner: boolean = false
): boolean {
  if (isOwner) return true;
  const level = getPermissionLevel(permissions, category);
  return level === "edit" || level === "manage";
}

export function canManage(
  permissions: Map<PermissionCategory, PermissionLevel> | undefined, 
  category: PermissionCategory, 
  isOwner: boolean = false
): boolean {
  if (isOwner) return true;
  const level = getPermissionLevel(permissions, category);
  return level === "manage";
}
