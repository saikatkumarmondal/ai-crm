// src/lib/repositories/deal.repository.ts

import { prisma } from "@/lib/prisma";
import { DealStage, Prisma } from "@prisma/client";

interface FindManyParams {
  organizationId: string;
  search?: string;
  stage?: DealStage;
  ownerId?: string;
  customerId?: string;
  skip: number;
  take: number;
}

export const dealRepository = {
  create(data: Prisma.DealUncheckedCreateInput) {
    return prisma.deal.create({
      data,
      include: {
        customer: { select: { id: true, fullName: true } },
        owner: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  },

  findById(id: string, organizationId: string) {
    return prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, fullName: true, email: true, companyName: true } },
        owner: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async findMany(params: FindManyParams) {
    const where: Prisma.DealWhereInput = {
      organizationId: params.organizationId,
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.ownerId ? { ownerId: params.ownerId } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { customer: { fullName: { contains: params.search, mode: "insensitive" } } },
              { customer: { companyName: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, fullName: true, companyName: true } },
          owner: { select: { id: true, fullName: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, organizationId: string, data: Prisma.DealUpdateInput) {
    return prisma.deal.updateMany({
      where: { id, organizationId },
      data,
    });
  },

  async delete(id: string, organizationId: string) {
    return prisma.deal.deleteMany({
      where: { id, organizationId },
    });
  },

  // Get deals by stage for pipeline view
  async getDealsByStage(organizationId: string) {
    return prisma.deal.groupBy({
      by: ["stage"],
      where: { organizationId },
      _count: {
        id: true,
      },
      _sum: {
        value: true,
        probability: true,
      },
    });
  },
};
