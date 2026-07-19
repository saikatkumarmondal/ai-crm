// src/app/api/ai/pipeline-insights/route.ts

import { GoogleGenAI } from "@google/genai";
import { withAuth } from "@/lib/middleware/withAuth";
import { dealService } from "@/lib/services/deal.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

// ⚠️ অনুমান: env variable নাম "GEMINI_API_KEY" এবং model "gemini-2.5-flash"।
// আপনার বিদ্যমান /api/ai/deal-insights route শেয়ার করলে এই দুটো
// ঠিকমতো মিলিয়ে দেব।
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PIPELINE_STAGE_META = [
  { value: "QUALIFICATION", label: "Qualify" },
  { value: "NEEDS_ANALYSIS", label: "Analyze" },
  { value: "PROPOSAL", label: "Propose" },
  { value: "NEGOTIATION", label: "Negotiate" },
  { value: "WON", label: "Won" },
] as const;

export const POST = withAuth(async (_request, _context, auth) => {
  try {
    if (!auth.organizationId) {
      return errorResponse("No organization associated with this user", 400);
    }

    const summary = await dealService.pipelineSummary(auth.organizationId);
    const summaryMap = new Map(
      summary.map((s) => [s.stage, { count: s.count, totalValue: Number(s.totalValue) }])
    );

    const pipelineText = PIPELINE_STAGE_META.map((meta) => {
      const data = summaryMap.get(meta.value) ?? { count: 0, totalValue: 0 };
      return `${meta.label}: ${data.count} deal(s), total value ${data.totalValue}`;
    }).join("\n");

    const prompt = `You are a sales pipeline analyst. Here is the current deal pipeline for this organization:

${pipelineText}

Give 3-4 short, actionable bullet points (each under 20 words) about bottlenecks, risks, or opportunities in this pipeline. Format as a plain list, one point per line, starting each with "- ".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const insight = response.text ?? "No insight generated.";

    return successResponse({ insight });
  } catch (error) {
    console.error("Pipeline AI insights error:", error);
    return errorResponse("Could not generate pipeline insights right now.", 500);
  }
});