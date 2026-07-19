// src/app/api/ai/pipeline-insights/route.ts

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { dealService } from "@/lib/services/deal.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

const PIPELINE_STAGE_META = [
  { value: "QUALIFICATION", label: "Qualify" },
  { value: "NEEDS_ANALYSIS", label: "Analyze" },
  { value: "PROPOSAL", label: "Propose" },
  { value: "NEGOTIATION", label: "Negotiate" },
  { value: "WON", label: "Won" },
] as const;

export const POST = withAuth(async (_request: NextRequest, _context, auth) => {
  if (!auth.organizationId) {
    return errorResponse("No organization associated with this user", 400);
  }

  try {
    const stageSummary = await dealService.pipelineSummary(auth.organizationId);

    const totalDeals = stageSummary.reduce((sum, s) => sum + s.count, 0);

    if (totalDeals === 0) {
      return successResponse({
        insight:
          "No deals yet. Create your first deal to unlock AI-powered pipeline insights.",
      });
    }

    const summaryMap = new Map(
      stageSummary.map((s) => [s.stage, { count: s.count, totalValue: Number(s.totalValue) }])
    );

    const pipelineText = PIPELINE_STAGE_META.map((meta) => {
      const data = summaryMap.get(meta.value) ?? { count: 0, totalValue: 0 };
      return `${meta.label}: ${data.count} deal(s), total value ${data.totalValue}`;
    }).join("\n");

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return errorResponse("AI insights is not configured on the server", 500);
    }

    const prompt = `You are an experienced Sales Operations Analyst reviewing a CRM sales pipeline funnel (Qualify → Analyze → Propose → Negotiate → Won).

Current pipeline stage breakdown:
${pipelineText}

Provide 3-4 short, actionable bullet points (each under 20 words) about bottlenecks, risks, or opportunities in this pipeline.

Guidelines:
- Begin every bullet with "-".
- Be data-driven and reference only the provided information.
- No markdown headings, tables, or bold formatting.
- Output only the bullet points.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return errorResponse("Failed to generate AI insights", 502);
    }

    const geminiJson = await geminiRes.json();

    const insight: string =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "AI could not generate insights right now. Please try again.";

    return successResponse({ insight });
  } catch (error: any) {
    console.error("Pipeline AI insights error:", error);

    if (error?.code === "P2024") {
      return errorResponse(
        "Database is busy right now. Please wait a few seconds and try again.",
        503
      );
    }

    return errorResponse("Internal server error", 500);
  }
});