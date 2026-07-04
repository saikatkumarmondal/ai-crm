// src/app/api/leads/[id]/assign/route.ts

import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/middleware/withRole";
import { leadService, LeadError } from "@/lib/services/lead.service";
import { assignLeadSchema } from "@/lib/validators/lead.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const PATCH = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER],
  async (request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      const body = await request.json();
      const parsed = assignLeadSchema.safeParse(body);

      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const lead = await leadService.assign(id, auth.organizationId, parsed.data.assignedToId);
      return successResponse(lead);
    } catch (error) {
      if (error instanceof LeadError) return errorResponse(error.message, error.status);
      console.error("Assign lead error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);