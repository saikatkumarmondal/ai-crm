// src/lib/repositories/customer.repository.ts

import { prisma } from "@/lib/prisma";
import { CustomerStatus, Prisma } from "@prisma/client";

interface FindManyParams {
  organizationId: string;
  search?: string;
  status?: CustomerStatus;
  skip: number;
  take: number;
}

export const customerRepository = {
  create(params: {
    organizationId: string;
    createdById: string;
    fullName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    status?: CustomerStatus;
    notes?: string;
  }) {
    return prisma.customer.create({
      data: {
        organizationId: params.organizationId,
        createdById: params.createdById,
        fullName: params.fullName,
        email: params.email || null,
        phone: params.phone || null,
        companyName: params.companyName || null,
        status: params.status ?? CustomerStatus.LEAD,
        notes: params.notes || null,
      },
    });
  },

  createFromLead(params: {
    organizationId: string;
    createdById: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
  }) {
    return prisma.customer.create({
      data: {
        organizationId: params.organizationId,
        createdById: params.createdById,
        fullName: params.fullName,
        email: params.email,
        phone: params.phone,
        companyName: params.companyName,
        status: "ACTIVE",
      },
    });
  },

  findById(id: string, organizationId: string) {
    return prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  },

  findByEmail(email: string, organizationId: string) {
    return prisma.customer.findFirst({
      where: { email, organizationId, deletedAt: null },
    });
  },

  async findMany(params: FindManyParams) {
    const where: Prisma.CustomerWhereInput = {
      organizationId: params.organizationId,
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
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
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, organizationId: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  softDelete(id: string, organizationId: string) {
    return prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};