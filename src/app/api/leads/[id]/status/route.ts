// src/app/api/leads/[id]/status/route.ts

import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/middleware/withRole";
import { leadService, LeadError } from "@/lib/services/lead.service";
import { updateLeadStatusSchema } from "@/lib/validators/lead.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const PATCH = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      const body = await request.json();
      const parsed = updateLeadStatusSchema.safeParse(body);

      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const lead = await leadService.updateStatus(id, auth.organizationId, parsed.data.status);
      return successResponse(lead);
    } catch (error) {
      if (error instanceof LeadError) return errorResponse(error.message, error.status);
      console.error("Update lead status error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);