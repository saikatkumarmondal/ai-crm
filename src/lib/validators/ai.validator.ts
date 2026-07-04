// src/lib/validators/ai.validator.ts

import { z } from "zod";

export const aiQuerySchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(1000),
});

export const aiEmailDraftSchema = z.object({
  customerId: z.string().cuid("Invalid customer id"),
  purpose: z.string().min(3, "Purpose is required").max(500),
  tone: z.enum(["FORMAL", "FRIENDLY", "PERSUASIVE"]).optional(),
});

export const aiSummaryDraftSchema = z.object({
  entityType: z.enum(["CUSTOMER", "LEAD", "DEAL"]),
  entityId: z.string().cuid("Invalid entity id"),
});