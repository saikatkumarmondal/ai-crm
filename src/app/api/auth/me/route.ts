// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { userRepository } from "@/lib/repositories/user.repository";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const GET = withAuth(async (_request: NextRequest, _context, auth) => {
  const user = await userRepository.findById(auth.userId);

  if (!user) {
    return errorResponse("User not found", 404);
  }

  return successResponse({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
});