// src/app/api/customers/[id]/route.ts

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { customerService, CustomerError } from "@/lib/services/customer.service";
import { updateCustomerSchema } from "@/lib/validators/customer.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

// GET /api/customers/:id
export const GET = withAuth(async (_request, context, auth) => {
  try {
    if (!auth.organizationId) {
      return errorResponse("No organization associated with this user", 400);
    }

    const { id } = await context.params;
    const customer = await customerService.getById(id, auth.organizationId);
    return successResponse(customer);
  } catch (error) {
    if (error instanceof CustomerError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Get customer error:", error);
    return errorResponse("Internal server error", 500);
  }
});

// PATCH /api/customers/:id
export const PATCH = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request, context, auth) => {
    try {
      if (!auth.organizationId) {
        return errorResponse("No organization associated with this user", 400);
      }

      const { id } = await context.params;
      const body = await request.json();
      const parsed = updateCustomerSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validation failed", 422, parsed.error.flatten());
      }

      const customer = await customerService.update(id, auth.organizationId, parsed.data);
      return successResponse(customer);
    } catch (error) {
      if (error instanceof CustomerError) {
        return errorResponse(error.message, error.status);
      }
      console.error("Update customer error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);

// DELETE /api/customers/:id — শুধু ORG_ADMIN, SALES_MANAGER ডিলিট করতে পারবে
export const DELETE = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER],
  async (_request, context, auth) => {
    try {
      if (!auth.organizationId) {
        return errorResponse("No organization associated with this user", 400);
      }

      const { id } = await context.params;
      await customerService.delete(id, auth.organizationId);
      return successResponse({ message: "Customer deleted successfully" });
    } catch (error) {
      if (error instanceof CustomerError) {
        return errorResponse(error.message, error.status);
      }
      console.error("Delete customer error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);