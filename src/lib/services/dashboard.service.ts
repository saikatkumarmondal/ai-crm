// src/lib/services/dashboard.service.ts

import { dashboardRepository } from "@/lib/repositories/dashboard.repository";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const dashboardService = {
  async getExecutiveSummary(organizationId: string) {
    const kpi = await dashboardRepository.getKpiCounts(organizationId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers30d = await dashboardRepository.getNewCustomersInRange(
      organizationId,
      thirtyDaysAgo
    );

    const totalClosedDeals = kpi.wonDeals + kpi.lostDeals;
    const conversionRate =
      totalClosedDeals > 0 ? round2((kpi.wonDeals / totalClosedDeals) * 100) : 0;

    const leadToQualifiedRate =
      kpi.totalLeads > 0 ? round2((kpi.qualifiedLeads / kpi.totalLeads) * 100) : 0;

    return {
      totalRevenue: Number(kpi.totalRevenue),
      openPipelineValue: Number(kpi.openPipelineValue),
      openDealsCount: kpi.openDealsCount,
      totalCustomers: kpi.totalCustomers,
      activeCustomers: kpi.activeCustomers,
      newCustomers30d,
      totalLeads: kpi.totalLeads,
      qualifiedLeads: kpi.qualifiedLeads,
      wonDeals: kpi.wonDeals,
      lostDeals: kpi.lostDeals,
      conversionRate, // won / (won + lost) %
      leadToQualifiedRate, // qualified / total leads %
    };
  },

  async getRevenueTrend(organizationId: string, months: number) {
    return dashboardRepository.getMonthlyRevenueTrend(organizationId, months);
  },

  async getLeadFunnel(organizationId: string) {
    return dashboardRepository.getLeadConversionFunnel(organizationId);
  },

  async getPipelineByStage(organizationId: string) {
    return dashboardRepository.getDealsByStage(organizationId);
  },

  async getTeamPerformance(organizationId: string) {
    return dashboardRepository.getTeamPerformance(organizationId);
  },

  async getRecentActivity(organizationId: string, limit: number) {
    return dashboardRepository.getRecentActivity(organizationId, limit);
  },
};