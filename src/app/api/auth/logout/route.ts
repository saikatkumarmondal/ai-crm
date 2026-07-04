// src/app/api/auth/logout/route.ts

import { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      return errorResponse("refreshToken is required", 422);
    }

    await authService.logout(refreshToken);
    return successResponse({ message: "Logged out successfully" }, 200);
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}