// src/app/api/ai/risk-analysis/route.ts

import { withAuth } from "@/lib/middleware/withAuth";
import { aiService } from "@/lib/services/ai.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkAiRateLimit } from "@/lib/ai/rateLimiter";

export const GET = withAuth(async (_request, _context, auth) => {
  if (!auth.organizationId) return errorResponse("No organization associated with this user", 400);

  const rateLimit = checkAiRateLimit(auth.userId);
  if (!rateLimit.allowed) {
    return errorResponse(`Too many AI requests. Try again in ${rateLimit.retryAfterSeconds}s`, 429);
  }

  const result = await aiService.getRiskAnalysis(auth.organizationId);
  return successResponse(result);
});