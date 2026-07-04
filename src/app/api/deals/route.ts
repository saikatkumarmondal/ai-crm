// src/app/api/deals/route.ts

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { dealService, DealError } from "@/lib/services/deal.service";
import { createDealSchema, listDealQuerySchema } from "@/lib/validators/deal.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { parsePagination, buildPaginationMeta } from "@/lib/utils/pagination";

export const GET = withAuth(async (request: NextRequest, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

  const searchParams = request.nextUrl.searchParams;
  const parsedQuery = listDealQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
    ownerId: searchParams.get("ownerId") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return errorResponse("Invalid query parameters", 422, parsedQuery.error.flatten());
  }

  const { page, limit, skip } = parsePagination(searchParams);
  const { items, total } = await dealService.list(auth.organizationId, parsedQuery.data, {
    skip,
    take: limit,
  });

  return successResponse({ items, meta: buildPaginationMeta(total, page, limit) });
});

export const POST = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request: NextRequest, _context, auth) => {
    try {
      if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

      const body = await request.json();
      const parsed = createDealSchema.safeParse(body);
      if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

      const deal = await dealService.create(auth.organizationId, auth.userId, parsed.data);
      return successResponse(deal, 201);
    } catch (error) {
      if (error instanceof DealError) return errorResponse(error.message, error.status);
      console.error("Create deal error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);