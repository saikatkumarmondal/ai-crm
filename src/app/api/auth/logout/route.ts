// src/app/api/auth/logout/route.ts

import { NextRequest } from "next/server";
import { logoutSchema } from "@/lib/validators/auth.validator";
import { authService, AuthError } from "@/lib/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    // Body খালি/অনুপস্থিত হলেও crash না করে {} ধরে নেওয়া হচ্ছে
    let body: unknown = {};
    const rawText = await request.text();
    if (rawText) {
      try {
        body = JSON.parse(rawText);
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    const parsed = logoutSchema.safeParse(body);

    // refreshToken না থাকলে বা invalid হলে সার্ভার-সাইডে কিছু invalidate করার
    // দরকার নেই — client-side এ token cleared হচ্ছেই, তাই gracefully success দিন
    if (!parsed.success || !parsed.data.refreshToken) {
      return successResponse({ message: "Logged out successfully" }, 200);
    }

    await authService.logout(parsed.data.refreshToken);
    return successResponse({ message: "Logged out successfully" }, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      // Auth এরর (যেমন already-invalid token) হলেও logout ব্যর্থ দেখানোর দরকার নেই
      return successResponse({ message: "Logged out successfully" }, 200);
    }
    console.error("Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}