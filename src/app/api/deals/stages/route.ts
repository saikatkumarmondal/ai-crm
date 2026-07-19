// src/app/api/deals/stages/route.ts

import { DealStage } from "@prisma/client";
import { withAuth } from "@/lib/middleware/withAuth";
import { successResponse } from "@/lib/utils/apiResponse";

function formatLabel(stage: string): string {
  return stage
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Returns the deal pipeline stages defined in the Prisma schema (DealStage enum),
// in their declared order, with human-friendly labels.
export const GET = withAuth(async () => {
  const stages = Object.values(DealStage).map((value) => ({
    value,
    label: formatLabel(value),
  }));

  return successResponse({ stages });
});