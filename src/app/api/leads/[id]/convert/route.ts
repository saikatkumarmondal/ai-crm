// src/app/api/leads/[id]/convert/route.ts

import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/middleware/withRole";
import { leadService, LeadError } from "@/lib/services/lead.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const POST = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (_request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      const customer = await leadService.convertToCustomer(id, auth.organizationId, auth.userId);
      return successResponse(customer, 201);
    } catch (error) {
      if (error instanceof LeadError) return errorResponse(error.message, error.status);
      console.error("Convert lead error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);