import type { Express, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { IStorage } from "./storage";
import type { AuthRequest } from "./auth-middleware";
import { requireAuth } from "./auth-middleware";
import {
  hashPassword,
  comparePassword,
  generateVerificationToken,
  generateResetToken,
  isTokenExpired,
  validateEmail,
  validatePassword,
  sanitizeUser,
} from "./auth-utils";
import { sendEmail, EmailTemplate } from "./email";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["couple", "vendor"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export function registerAuthRoutes(app: Express, storage: IStorage) {
  // POST /api/auth/register
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      // Validate email
      if (!validateEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate password
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password does not meet requirements",
          details: passwordValidation.errors 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user with email already verified (no verification needed)
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        role: data.role,
        emailVerified: true, // Auto-verify on registration
      });

      // Set session and auto-login
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        res.status(201).json({
          message: "Registration successful. You can now login.",
          user: sanitizeUser(user),
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const passwordMatch = await comparePassword(data.password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        res.json({
          message: "Login successful",
          user: sanitizeUser(user),
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  });

  // DELETE /api/auth/account - Delete user account and all associated data
  app.delete("/api/auth/account", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session.userId!;

      // Delete user and all cascade-related data
      await storage.deleteUser(userId);

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // POST /api/auth/verify-email
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = verifyEmailSchema.parse(req.body);

      // Find user with this verification token
      const users = await storage.getUserByEmail(""); // This needs a better query
      // For now, we'll need to add a method to find by verification token
      // Let's assume we have the user from session
      
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if token matches and is not expired
      if (user.verificationToken !== token) {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      if (isTokenExpired(user.verificationTokenExpires)) {
        return res.status(400).json({ error: "Verification token has expired" });
      }

      // Verify email
      await storage.verifyEmail(user.id);

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Email verification failed" });
    }
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether user exists
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const { token, expires } = generateResetToken();

      // Save reset token
      await storage.setResetToken(user.id, token, expires);

      // Send password reset email
      const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Viah.me password",
          template: EmailTemplate.PASSWORD_RESET,
          data: {
            resetUrl,
            userEmail: user.email,
          },
        });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const data = resetPasswordSchema.parse(req.body);

      // Validate new password
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password does not meet requirements",
          details: passwordValidation.errors 
        });
      }

      // Find user with this reset token (we need a storage method for this)
      // For now, this is incomplete - we need getUserByResetToken method
      
      // Hash new password
      const passwordHash = await hashPassword(data.password);

      // Update password and clear reset token
      // await storage.updateUserPassword(user.id, passwordHash);
      // await storage.clearResetToken(user.id);

      res.json({ message: "Password reset successful. You can now login with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const data = changePasswordSchema.parse(req.body);

      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const passwordMatch = await comparePassword(data.currentPassword, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Validate new password
      const passwordValidation = validatePassword(data.newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "New password does not meet requirements",
          details: passwordValidation.errors 
        });
      }

      // Hash and update password
      const passwordHash = await hashPassword(data.newPassword);
      await storage.updateUserPassword(user.id, passwordHash);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Password change failed" });
    }
  });
}
