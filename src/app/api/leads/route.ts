// src/app/api/leads/route.ts

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { leadService, LeadError } from "@/lib/services/lead.service";
import { createLeadSchema, listLeadQuerySchema } from "@/lib/validators/lead.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { parsePagination, buildPaginationMeta } from "@/lib/utils/pagination";

export const GET = withAuth(async (request: NextRequest, _context, auth) => {
  if (!auth.organizationId) {
    return errorResponse("No organization associated with this user", 400);
  }

  const searchParams = request.nextUrl.searchParams;
  const parsedQuery = listLeadQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    assignedToId: searchParams.get("assignedToId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return errorResponse("Invalid query parameters", 422, parsedQuery.error.flatten());
  }

  const { page, limit, skip } = parsePagination(searchParams);

  const { items, total } = await leadService.list(auth.organizationId, parsedQuery.data, {
    skip,
    take: limit,
  });

  return successResponse({ items, meta: buildPaginationMeta(total, page, limit) });
});

export const POST = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request: NextRequest, _context, auth) => {
    try {
      if (!auth.organizationId) {
        return errorResponse("No organization associated with this user", 400);
      }

      const body = await request.json();
      const parsed = createLeadSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validation failed", 422, parsed.error.flatten());
      }

      const lead = await leadService.create(auth.organizationId, auth.userId, parsed.data);
      return successResponse(lead, 201);
    } catch (error) {
      if (error instanceof LeadError) {
        return errorResponse(error.message, error.status);
      }
      console.error("Create lead error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);