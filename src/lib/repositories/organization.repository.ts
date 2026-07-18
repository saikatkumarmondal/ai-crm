import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const organizationRepository = {
  async createForUser(userId: string, name: string, slug: string) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name, slug },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: organization.id,
          role: UserRole.ORG_ADMIN,
        },
      });

      return { user, organization };
    });
  },
};