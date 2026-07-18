// src/lib/repositories/user.repository.ts

import { prisma } from "@/lib/prisma";
import { UserRole, AuthProvider } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByFirebaseUid(firebaseUid: string) {
    return prisma.user.findUnique({ where: { firebaseUid } });
  },

  createWithOrganization(params: {
    fullName: string;
    email: string;
    passwordHash: string;
    organizationName: string;
    organizationSlug: string;
    role: UserRole;
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
          role: params.role,
        },
      });

      return { user, organization };
    });
  },

  createGoogleUser(data: { fullName: string; email: string; firebaseUid: string }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        firebaseUid: data.firebaseUid,
        provider: AuthProvider.GOOGLE,
        isActive: true,
      },
    });
  },

  linkFirebaseUid(userId: string, firebaseUid: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { firebaseUid, provider: AuthProvider.GOOGLE },
    });
  },

  createSuperAdmin(data: {
    fullName: string;
    email: string;
    passwordHash: string;
  }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: UserRole.SUPER_ADMIN,
        provider: AuthProvider.LOCAL,
        organizationId: null,
        isActive: true,
      },
    });
  },
};