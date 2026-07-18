// src/app/api/auth/refresh/route.ts

import { NextRequest } from "next/server";
import { refreshSchema } from "@/lib/validators/auth.validator";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.flatten());
    }

    const result = await authService.refresh(parsed.data.refreshToken);
    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Refresh error:", error);
    return errorResponse("Internal server error", 500);
  }
}