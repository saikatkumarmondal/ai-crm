// src/app/api/ai/deal-insights/route.ts

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { dealService } from "@/lib/services/deal.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const POST = withAuth(async (_request: NextRequest, _context, auth) => {
  if (!auth.organizationId) {
    return errorResponse("No organization associated with this user", 400);
  }

  try {
    // DB-level aggregated summary (stage অনুযায়ী count + total value)
    const stageSummary = await dealService.pipelineSummary(auth.organizationId);

    const totalDeals = stageSummary.reduce((sum, s) => sum + s.count, 0);

    if (totalDeals === 0) {
      return successResponse({
        insight:
          "No deals yet. Create your first deal to unlock AI-powered insights for your sales pipeline.",
      });
    }

    // Detail context এর জন্য সাম্প্রতিক কিছু deal
    const { items: recentDeals } = await dealService.list(
      auth.organizationId,
      {},
      { skip: 0, take: 30 }
    );

    const dealDetails = recentDeals.map((d: any) => ({
      title: d.title,
      stage: d.stage,
      value: d.value,
      currency: d.currency,
      probability: d.probability,
      expectedCloseDate: d.expectedCloseDate,
    }));

    // FIX: summary object
    const summary = {
      totalDeals,
      stageSummary,
      dealDetails,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return errorResponse("AI insights is not configured on the server", 500);
    }

    const prompt = `You are an experienced Sales Operations Analyst reviewing a CRM sales pipeline.

Analyze the following CRM pipeline summary (JSON):

${JSON.stringify(summary, null, 2)}

Provide a concise executive summary as exactly 4–6 bullet points. Begin every bullet with "-".

Your analysis should include:
1. Overall pipeline health, including total pipeline value, number of deals, and general performance.
2. Bottlenecks, stalled stages, or unusual pipeline distribution that may impact revenue.
3. High-priority deals requiring immediate attention (e.g., high-value, aging, low-probability, or overdue opportunities).
4. Notable risks or trends affecting pipeline quality or forecast accuracy.
5. One clear, practical, and actionable recommendation to improve pipeline performance.

Guidelines:
- Keep the entire response under 150 words.
- Be data-driven and reference the provided information only.
- Prioritize business impact over description.
- Do not invent or assume missing data.
- Do not repeat metrics unnecessarily.
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
    console.error("Deal insights error:", error);

    // Prisma connection pool timeout হলে user কে বুঝিয়ে বলা
    if (error?.code === "P2024") {
      return errorResponse(
        "Database is busy right now. Please wait a few seconds and try again.",
        503
      );
    }

    return errorResponse("Internal server error", 500);
  }
});