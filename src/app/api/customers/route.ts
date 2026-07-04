// src/app/api/customers/route.ts

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";
import { customerService, CustomerError } from "@/lib/services/customer.service";
import { createCustomerSchema, listCustomerQuerySchema } from "@/lib/validators/customer.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { parsePagination, buildPaginationMeta } from "@/lib/utils/pagination";

// GET /api/customers — সব roles নিজের organization এর customer দেখতে পারবে
export const GET = withAuth(async (request: NextRequest, _context, auth) => {
  if (!auth.organizationId) {
    return errorResponse("No organization associated with this user", 400);
  }

  const searchParams = request.nextUrl.searchParams;
  const parsedQuery = listCustomerQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsedQuery.success) {
    return errorResponse("Invalid query parameters", 422, parsedQuery.error.flatten());
  }

  const { page, limit, skip } = parsePagination(searchParams);

  const { items, total } = await customerService.list(
    auth.organizationId,
    parsedQuery.data,
    { skip, take: limit }
  );

  return successResponse({
    items,
    meta: buildPaginationMeta(total, page, limit),
  });
});

// POST /api/customers — শুধু ORG_ADMIN, SALES_MANAGER, SALES_EXECUTIVE তৈরি করতে পারবে
export const POST = withRole(
  [UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE],
  async (request: NextRequest, _context, auth) => {
    try {
      if (!auth.organizationId) {
        return errorResponse("No organization associated with this user", 400);
      }

      const body = await request.json();
      const parsed = createCustomerSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validation failed", 422, parsed.error.flatten());
      }

      const customer = await customerService.create(auth.organizationId, auth.userId, parsed.data);
      return successResponse(customer, 201);
    } catch (error) {
      if (error instanceof CustomerError) {
        return errorResponse(error.message, error.status);
      }
      console.error("Create customer error:", error);
      return errorResponse("Internal server error", 500);
    }
  }
);