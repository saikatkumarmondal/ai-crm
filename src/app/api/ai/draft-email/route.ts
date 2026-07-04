// src/app/api/ai/draft-email/route.ts

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { aiService, AiError } from "@/lib/services/ai.service";
import { aiEmailDraftSchema } from "@/lib/validators/ai.validator";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkAiRateLimit } from "@/lib/ai/rateLimiter";

export const POST = withAuth(async (request: NextRequest, _context, auth) => {
  try {
    if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

    const rateLimit = checkAiRateLimit(auth.userId);
    if (!rateLimit.allowed) {
      return errorResponse(`Too many AI requests. Try again in ${rateLimit.retryAfterSeconds}s`, 429);
    }

    const body = await request.json();
    const parsed = aiEmailDraftSchema.safeParse(body);
    if (!parsed.success) return errorResponse("Validation failed", 422, parsed.error.flatten());

    const result = await aiService.draftFollowUpEmail(
      auth.organizationId,
      parsed.data.customerId,
      parsed.data.purpose,
      parsed.data.tone
    );
    return successResponse(result);
  } catch (error) {
    if (error instanceof AiError) return errorResponse(error.message, error.status);
    console.error("AI draft email error:", error);
    return errorResponse("AI service error", 500);
  }
});