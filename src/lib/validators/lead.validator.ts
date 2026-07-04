// src/lib/validators/lead.validator.ts

import { z } from "zod";

export const leadStatusEnum = z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"]);
export const leadSourceEnum = z.enum([
  "WEBSITE",
  "REFERRAL",
  "SOCIAL_MEDIA",
  "EMAIL_CAMPAIGN",
  "COLD_CALL",
  "EVENT",
  "OTHER",
]);

export const createLeadSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(6, "Invalid phone number").optional().or(z.literal("")),
  companyName: z.string().optional(),
  source: leadSourceEnum.optional(),
  notes: z.string().optional(),
  assignedToId: z.string().cuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: leadStatusEnum,
});

export const assignLeadSchema = z.object({
  assignedToId: z.string().cuid("Invalid user id"),
});

export const listLeadQuerySchema = z.object({
  search: z.string().optional(),
  status: leadStatusEnum.optional(),
  assignedToId: z.string().cuid().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadQuery = z.infer<typeof listLeadQuerySchema>;