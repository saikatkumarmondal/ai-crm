// src/app/api/leads/[id]/route.ts

import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { leadService, LeadError } from "@/lib/services/lead.service";
import { updateLeadSchema } from "@/lib/validators/lead.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (_request, context, auth) => {
  try {
    if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
    const { id } = await context.params;
    const lead = await leadService.getById(id, auth.organizationId);
    return successResponse(lead);
  } catch (error) {
    if (error instanceof LeadError) return errorResponse(error.message, error.status);
    console.error("Get lead error:", error);
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
      const parsed = updateLeadSchema.safeParse(body);

      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const lead = await leadService.update(id, auth.organizationId, parsed.data);
      return successResponse(lead);
    } catch (error) {
      if (error instanceof LeadError) return errorResponse(error.message, error.status);
      console.error("Update lead error:", error);
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
      await leadService.delete(id, auth.organizationId);
      return successResponse({ message: "Lead deleted successfully" });
    } catch (error) {
      if (error instanceof LeadError) return errorResponse(error.message, error.status);
      console.error("Delete lead error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);