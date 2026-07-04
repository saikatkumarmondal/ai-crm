// src/lib/repositories/dashboard.repository.ts

import { prisma } from "@/lib/prisma";
import { DealStage, LeadStatus, CustomerStatus } from "@prisma/client";

export const dashboardRepository = {
  async getKpiCounts(organizationId: string) {
    const [
      totalCustomers,
      activeCustomers,
      totalLeads,
      qualifiedLeads,
      wonDeals,
      lostDeals,
      openDealsAgg,
      wonDealsAgg,
    ] = await Promise.all([
      prisma.customer.count({ where: { organizationId, deletedAt: null } }),
      prisma.customer.count({
        where: { organizationId, deletedAt: null, status: CustomerStatus.ACTIVE },
      }),
      prisma.lead.count({ where: { organizationId, deletedAt: null } }),
      prisma.lead.count({
        where: { organizationId, deletedAt: null, status: LeadStatus.QUALIFIED },
      }),
      prisma.deal.count({ where: { organizationId, deletedAt: null, stage: DealStage.WON } }),
      prisma.deal.count({ where: { organizationId, deletedAt: null, stage: DealStage.LOST } }),
      prisma.deal.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          stage: { notIn: [DealStage.WON, DealStage.LOST] },
        },
        _sum: { value: true },
        _count: { _all: true },
      }),
      prisma.deal.aggregate({
        where: { organizationId, deletedAt: null, stage: DealStage.WON },
        _sum: { value: true },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      totalLeads,
      qualifiedLeads,
      wonDeals,
      lostDeals,
      openDealsCount: openDealsAgg._count._all,
      openPipelineValue: openDealsAgg._sum.value ?? 0,
      totalRevenue: wonDealsAgg._sum.value ?? 0,
    };
  },

  async getNewCustomersInRange(organizationId: string, since: Date) {
    return prisma.customer.count({
      where: { organizationId, deletedAt: null, createdAt: { gte: since } },
    });
  },

  // মাসভিত্তিক জেতা (WON) deal থেকে revenue trend (গত N মাস)
  async getMonthlyRevenueTrend(organizationId: string, months: number) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const wonDeals = await prisma.deal.findMany({
      where: {
        organizationId,
        deletedAt: null,
        stage: DealStage.WON,
        closedAt: { gte: since },
      },
      select: { value: true, closedAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(since);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, 0);
    }

    for (const deal of wonDeals) {
      if (!deal.closedAt) continue;
      const key = `${deal.closedAt.getFullYear()}-${String(deal.closedAt.getMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) {
        buckets.set(key, buckets.get(key)! + Number(deal.value));
      }
    }

    return Array.from(buckets.entries()).map(([month, revenue]) => ({ month, revenue }));
  },

  async getLeadConversionFunnel(organizationId: string) {
    const statuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"];
    const counts = await Promise.all(
      statuses.map((status) =>
        prisma.lead.count({ where: { organizationId, deletedAt: null, status } })
      )
    );
    return statuses.map((status, i) => ({ status, count: counts[i] }));
  },

  async getDealsByStage(organizationId: string) {
    const grouped = await prisma.deal.groupBy({
      by: ["stage"],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
      _sum: { value: true },
    });
    return grouped.map((g) => ({
      stage: g.stage,
      count: g._count._all,
      totalValue: g._sum.value ?? 0,
    }));
  },

  // Sales executive-wise performance (won deal count + value)
  async getTeamPerformance(organizationId: string) {
    const grouped = await prisma.deal.groupBy({
      by: ["ownerId"],
      where: { organizationId, deletedAt: null, stage: DealStage.WON },
      _count: { _all: true },
      _sum: { value: true },
    });

    const ownerIds = grouped.map((g) => g.ownerId).filter((id): id is string => !!id);
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, fullName: true },
    });
    const ownerMap = new Map(owners.map((o) => [o.id, o.fullName]));

    return grouped
      .filter((g) => g.ownerId)
      .map((g) => ({
        userId: g.ownerId,
        fullName: ownerMap.get(g.ownerId as string) ?? "Unknown",
        wonDealsCount: g._count._all,
        wonRevenue: g._sum.value ?? 0,
      }));
  },

  async getRecentActivity(organizationId: string, limit: number) {
    const [recentCustomers, recentLeads, recentDeals] = await Promise.all([
      prisma.customer.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, fullName: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, fullName: true, status: true, createdAt: true },
      }),
      prisma.deal.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: { id: true, title: true, stage: true, updatedAt: true },
      }),
    ]);

    const activity = [
      ...recentCustomers.map((c) => ({
        type: "CUSTOMER_CREATED" as const,
        id: c.id,
        label: c.fullName,
        timestamp: c.createdAt,
      })),
      ...recentLeads.map((l) => ({
        type: "LEAD_UPDATED" as const,
        id: l.id,
        label: `${l.fullName} (${l.status})`,
        timestamp: l.createdAt,
      })),
      ...recentDeals.map((d) => ({
        type: "DEAL_UPDATED" as const,
        id: d.id,
        label: `${d.title} (${d.stage})`,
        timestamp: d.updatedAt,
      })),
    ];

    return activity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  },
};