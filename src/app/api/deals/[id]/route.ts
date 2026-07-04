// src/app/api/deals/[id]/route.ts

import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { dealService } from "@/lib/services/deal.service";
import { updateDealSchema } from "@/lib/validators/deal.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (_request, context, auth) => {
  try {
    if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
    const { id } = await context.params;
    const deal = await dealService.getById(id, auth.organizationId);
    return successResponse(deal);
  } catch (error: any) {
    if (error.status) return errorResponse(error.message, error.status);
    console.error("Get deal error:", error);
    return errorResponse("Internal server error", 500);
  }
});

export const PATCH = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      const body = await request.json();
      const parsed = updateDealSchema.safeParse(body);

      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const deal = await dealService.update(id, auth.organizationId, parsed.data);
      return successResponse(deal);
    } catch (error: any) {
      if (error.status) return errorResponse(error.message, error.status);
      console.error("Update deal error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);

export const DELETE = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER],
  async (_request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      await dealService.delete(id, auth.organizationId);
      return successResponse({ message: "Deal deleted successfully" });
    } catch (error: any) {
      if (error.status) return errorResponse(error.message, error.status);
      console.error("Delete deal error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);
