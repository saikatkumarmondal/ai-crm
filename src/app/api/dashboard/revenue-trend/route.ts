// src/app/api/dashboard/revenue-trend/route.ts

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { dashboardService } from "@/lib/services/dashboard.service";
import { revenueTrendQuerySchema } from "@/lib/validators/dashboard.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (request: NextRequest, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

  const parsed = revenueTrendQuerySchema.safeParse({
    months: request.nextUrl.searchParams.get("months") ?? undefined,
  });
  if (!parsed.success) return errorResponse("Invalid query parameters", 422, parsed.error.flatten());

  const trend = await dashboardService.getRevenueTrend(auth.organizationId, parsed.data.months);
  return successResponse(trend);
});