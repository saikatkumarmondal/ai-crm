// src/app/api/deals/pipeline-summary/route.ts

import { withAuth } from "@/lib/middleware/withAuth";
import { dealService } from "@/lib/services/deal.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (_request, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
  const summary = await dealService.pipelineSummary(auth.organizationId);
  return successResponse(summary);
});