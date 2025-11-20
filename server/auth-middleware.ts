import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

export interface AuthRequest extends Request {
  user?: User;
  session: {
    userId?: string;
    userRole?: string;
    save(callback: (err?: any) => void): void;
    destroy(callback: (err?: any) => void): void;
  } & Express.Session;
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
