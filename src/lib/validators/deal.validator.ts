// src/lib/validators/deal.validator.ts

import { z } from "zod";

export const dealStageEnum = z.enum([
  "QUALIFICATION",
  "NEEDS_ANALYSIS",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const createDealSchema = z.object({
  customerId: z.string().cuid("Invalid customer id"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  value: z.number().positive("Value must be greater than 0"),
  currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
  expectedCloseDate: z.string().datetime().optional(),
  ownerId: z.string().cuid().optional(),
  notes: z.string().optional(),
});

export const updateDealSchema = createDealSchema
  .omit({ customerId: true })
  .partial();

export const updateDealStageSchema = z
  .object({
    stage: dealStageEnum,
    lostReason: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
  })
  .refine((data) => data.stage !== "LOST" || !!data.lostReason, {
    message: "lostReason is required when stage is LOST",
    path: ["lostReason"],
  });

export const listDealQuerySchema = z.object({
  search: z.string().optional(),
  stage: dealStageEnum.optional(),
  ownerId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStageInput = z.infer<typeof updateDealStageSchema>;