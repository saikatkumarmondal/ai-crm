// src/lib/validators/customer.validator.ts

import { z } from "zod";

export const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE", "CHURNED"]);

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(6, "Invalid phone number").optional().or(z.literal("")),
  companyName: z.string().optional(),
  status: customerStatusEnum.optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomerQuerySchema = z.object({
  search: z.string().optional(),
  status: customerStatusEnum.optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomerQuery = z.infer<typeof listCustomerQuerySchema>;