// src/app/api/auth/google/route.ts

import { NextRequest } from "next/server";
import { googleLoginSchema } from "@/lib/validators/auth.validator";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = googleLoginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.flatten());
    }

    const result = await authService.googleLogin(parsed.data);
    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Google login error:", error);
    return errorResponse("Internal server error", 500);
  }
}