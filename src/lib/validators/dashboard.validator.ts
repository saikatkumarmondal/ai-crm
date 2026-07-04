// src/lib/validators/dashboard.validator.ts

import { z } from "zod";

export const revenueTrendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});