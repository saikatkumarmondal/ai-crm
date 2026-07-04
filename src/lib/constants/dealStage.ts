// src/lib/constants/dealStage.ts

import { DealStage } from "@prisma/client";

// প্রতিটা stage এর ডিফল্ট win-probability — hardcode না করে এখানে কেন্দ্রীভূত রাখা হলো
export const DEAL_STAGE_DEFAULT_PROBABILITY: Record<DealStage, number> = {
  QUALIFICATION: 10,
  NEEDS_ANALYSIS: 30,
  PROPOSAL: 50,
  NEGOTIATION: 70,
  WON: 100,
  LOST: 0,
};

export const DEAL_CLOSED_STAGES: DealStage[] = [DealStage.WON, DealStage.LOST];