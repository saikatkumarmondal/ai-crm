// src/app/api/auth/refresh/route.ts

import { NextRequest } from "next/server";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      return errorResponse("refreshToken is required", 422);
    }

    const result = await authService.refresh(refreshToken);
    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Refresh error:", error);
    return errorResponse("Internal server error", 500);
  }
}