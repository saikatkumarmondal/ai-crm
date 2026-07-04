// src/app/api/auth/login/route.ts

import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validators/auth.validator";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.flatten());
    }

    const result = await authService.login(parsed.data);
    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}