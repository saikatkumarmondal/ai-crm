// src/lib/repositories/refreshToken.repository.ts

import { prisma } from "@/lib/prisma";

export const refreshTokenRepository = {
  create(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data: params });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revokeByTokenHash(tokenHash: string) {
    return prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  },
};