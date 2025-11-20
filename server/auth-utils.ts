import bcrypt from "bcrypt";
import crypto from "crypto";
import type { User } from "@shared/schema";

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateTokenExpiry(hours: number = TOKEN_EXPIRY_HOURS): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

export function generateVerificationToken(): {
  token: string;
  expires: Date;
} {
  return {
    token: generateSecureToken(),
    expires: generateTokenExpiry(TOKEN_EXPIRY_HOURS),
  };
}

export function generateResetToken(): {
  token: string;
  expires: Date;
} {
  return {
    token: generateSecureToken(),
    expires: generateTokenExpiry(RESET_TOKEN_EXPIRY_HOURS),
  };
}

export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeUser(user: User): Omit<User, "passwordHash" | "verificationToken" | "resetToken" | "password" | "username"> {
  const { passwordHash, verificationToken, resetToken, password, username, ...sanitized } = user;
  return sanitized;
}
