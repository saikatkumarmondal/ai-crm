// src/app/api/dashboard/team-performance/route.ts

import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/middleware/withRole";
import { dashboardService } from "@/lib/services/dashboard.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

// শুধু ORG_ADMIN ও SALES_MANAGER পুরো টিমের performance দেখতে পারবে
export const GET = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER],
  async (_request, _context, auth) => {
    if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);
    const performance = await dashboardService.getTeamPerformance(auth.organizationId);
    return successResponse(performance);
  }
);