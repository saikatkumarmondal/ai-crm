// src/lib/middleware/withRole.ts

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { withAuth, AuthenticatedHandler } from "@/lib/middleware/withAuth";
import { errorResponse } from "@/lib/utils/apiResponse";

export function withRole(allowedRoles: UserRole[], handler: AuthenticatedHandler) {
  return withAuth(
    async (
      request: NextRequest,
      context: { params: Promise<Record<string, string>> },
      auth
    ): Promise<NextResponse> => {
      if (!allowedRoles.includes(auth.role as UserRole)) {
        return errorResponse("You do not have permission to access this resource", 403);
      }
      return handler(request, context, auth);
    }
  );
}