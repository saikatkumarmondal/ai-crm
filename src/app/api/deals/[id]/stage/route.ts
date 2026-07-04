// src/app/api/deals/[id]/stage/route.ts

import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/middleware/withRole";
import { dealService } from "@/lib/services/deal.service";
import { updateDealStageSchema } from "@/lib/validators/deal.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const PATCH = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request, context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
      const { id } = await context.params;
      const body = await request.json();
      const parsed = updateDealStageSchema.safeParse(body);

      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const deal = await dealService.updateStage(id, auth.organizationId, parsed.data.stage);
      return successResponse(deal);
    } catch (error: any) {
      if (error.status) return errorResponse(error.message, error.status);
      console.error("Update deal stage error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);
