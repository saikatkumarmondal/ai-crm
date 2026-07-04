// src/lib/ai/contextBuilder.ts

import { dashboardService } from "@/lib/services/dashboard.service";

export async function buildBusinessContext(organizationId: string): Promise<string> {
  const [summary, funnel, pipeline, teamPerformance] = await Promise.all([
    dashboardService.getExecutiveSummary(organizationId),
    dashboardService.getLeadFunnel(organizationId),
    dashboardService.getPipelineByStage(organizationId),
    dashboardService.getTeamPerformance(organizationId),
  ]);

  return `
Business Snapshot:
- Total Revenue (won deals): ${summary.totalRevenue}
- Open Pipeline Value: ${summary.openPipelineValue} (${summary.openDealsCount} open deals)
- Total Customers: ${summary.totalCustomers} (Active: ${summary.activeCustomers}, New in last 30 days: ${summary.newCustomers30d})
- Total Leads: ${summary.totalLeads} (Qualified: ${summary.qualifiedLeads})
- Won Deals: ${summary.wonDeals}, Lost Deals: ${summary.lostDeals}
- Conversion Rate (won/closed): ${summary.conversionRate}%
- Lead-to-Qualified Rate: ${summary.leadToQualifiedRate}%

Lead Funnel:
${funnel.map((f) => `- ${f.status}: ${f.count}`).join("\n")}

Deal Pipeline by Stage:
${pipeline.map((p) => `- ${p.stage}: ${p.count} deals, total value ${p.totalValue}`).join("\n")}

Team Performance (won deals):
${teamPerformance.map((t) => `- ${t.fullName}: ${t.wonDealsCount} won deals, revenue ${t.wonRevenue}`).join("\n") || "No closed deals yet"}
`.trim();
}