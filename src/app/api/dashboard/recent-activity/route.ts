// src/app/api/dashboard/recent-activity/route.ts

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { dashboardService } from "@/lib/services/dashboard.service";
import { recentActivityQuerySchema } from "@/lib/validators/dashboard.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (request: NextRequest, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

  const parsed = recentActivityQuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return errorResponse("Invalid query parameters", 422, parsed.error.flatten());

  const activity = await dashboardService.getRecentActivity(auth.organizationId, parsed.data.limit);
  return successResponse(activity);
});