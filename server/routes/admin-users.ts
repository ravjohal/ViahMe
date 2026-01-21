import { Router, Response } from "express";
import { IStorage } from "../storage";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { User } from "@shared/schema";

function sanitizeUser(user: User) {
  const { passwordHash, resetToken, resetTokenExpires, verificationToken, verificationTokenExpires, ...safeUser } = user;
  return safeUser;
}

export async function registerAdminUsersRoutes(router: Router, storage: IStorage) {
  // Get all users with their weddings (site admin only)
  router.get("/", await requireAuth(storage, false), async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Site admin access required" });
      }

      const usersWithWeddings = await storage.getAllUsersWithWeddings();
      const sanitized = usersWithWeddings.map(({ user, wedding }) => ({
        user: sanitizeUser(user),
        wedding,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get single user details with wedding (site admin only)
  router.get("/:userId", await requireAuth(storage, false), async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      if (!user?.isSiteAdmin) {
        return res.status(403).json({ error: "Site admin access required" });
      }

      const { userId } = req.params;
      const userWithWedding = await storage.getUserWithWedding(userId);
      
      if (!userWithWedding) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        user: sanitizeUser(userWithWedding.user),
        wedding: userWithWedding.wedding,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
}
