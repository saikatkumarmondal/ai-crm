// src/app/api/dashboard/pipeline-by-stage/route.ts

import { withAuth } from "@/lib/middleware/withAuth";
import { dashboardService } from "@/lib/services/dashboard.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (_request, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
  const pipeline = await dashboardService.getPipelineByStage(auth.organizationId);
  return successResponse(pipeline);
});