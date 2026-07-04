// src/lib/repositories/user.repository.ts

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  createWithOrganization(params: {
    fullName: string;
    email: string;
    passwordHash: string;
    organizationName: string;
    organizationSlug: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: params.organizationName, slug: params.organizationSlug },
      });

      const user = await tx.user.create({
        data: {
          fullName: params.fullName,
          email: params.email,
          passwordHash: params.passwordHash,
          organizationId: organization.id,
          role: UserRole.ORG_ADMIN,
        },
      });

      return { user, organization };
    });
  },
};