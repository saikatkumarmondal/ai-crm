// src/app/api/deals/pipeline/route.ts

import { withAuth } from "@/lib/middleware/withAuth";
import { dealService } from "@/lib/services/deal.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

// Pipeline funnel-এর ক্রম ও readable label (LOST বাদ দেওয়া হয়েছে —
// funnel-এ শুধু forward-moving stage গুলো দেখানো হয়)
const PIPELINE_STAGE_META = [
  { value: "QUALIFICATION", label: "Qualify" },
  { value: "NEEDS_ANALYSIS", label: "Analyze" },
  { value: "PROPOSAL", label: "Propose" },
  { value: "NEGOTIATION", label: "Negotiate" },
  { value: "WON", label: "Won" },
] as const;

export const GET = withAuth(async (_request, _context, auth) => {
  try {
    if (!auth.organizationId) {
      return errorResponse("No organization associated with this user", 400);
    }

    const summary = await dealService.pipelineSummary(auth.organizationId);

    const summaryMap = new Map(
      summary.map((s) => [s.stage, { count: s.count, totalValue: Number(s.totalValue) }])
    );

    const pipeline = PIPELINE_STAGE_META.map((meta) => ({
      stage: meta.value,
      label: meta.label,
      count: summaryMap.get(meta.value)?.count ?? 0,
      totalValue: summaryMap.get(meta.value)?.totalValue ?? 0,
    }));

    return successResponse({ pipeline });
  } catch (error) {
    console.error("Pipeline summary error:", error);
    return errorResponse("Internal server error", 500);
  }
});