// src/lib/repositories/lead.repository.ts

import { prisma } from "@/lib/prisma";
import { LeadStatus, Prisma } from "@prisma/client";

interface FindManyParams {
  organizationId: string;
  search?: string;
  status?: LeadStatus;
  assignedToId?: string;
  skip: number;
  take: number;
}

export const leadRepository = {
  create(data: Prisma.LeadUncheckedCreateInput) {
    return prisma.lead.create({ data });
  },

  findById(id: string, organizationId: string) {
    return prisma.lead.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { assignedTo: { select: { id: true, fullName: true, email: true } } },
    });
  },

  findByEmail(email: string, organizationId: string) {
    return prisma.lead.findFirst({
      where: { email, organizationId, deletedAt: null },
    });
  },

  async findMany(params: FindManyParams) {
    const where: Prisma.LeadWhereInput = {
      organizationId: params.organizationId,
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.search
        ? {
            OR: [
              { fullName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { companyName: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: { assignedTo: { select: { id: true, fullName: true, email: true } } },
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, organizationId: string, data: Prisma.LeadUpdateInput) {
    return prisma.lead.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  softDelete(id: string, organizationId: string) {
    return prisma.lead.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};