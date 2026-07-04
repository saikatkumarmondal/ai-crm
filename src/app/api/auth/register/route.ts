// src/app/api/auth/register/route.ts

import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validators/auth.validator";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.flatten());
    }

    const result = await authService.register(parsed.data);
    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Register error:", error);
    return errorResponse("Internal server error", 500);
  }
}