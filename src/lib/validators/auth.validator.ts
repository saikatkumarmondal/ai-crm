// src/lib/validators/auth.validator.ts

import { z } from "zod";

// Public-facing roles only — SUPER_ADMIN is intentionally excluded.
// SUPER_ADMIN can only be created via the server-side seed script.
export const publicUserRoles = [
  "ORG_ADMIN",
  "SALES_MANAGER",
  "SALES_EXECUTIVE",
  "SUPPORT_AGENT",
] as const;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name is required"),
  role: z.enum(publicUserRoles).default("ORG_ADMIN"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;