// src/lib/services/auth.service.ts

import { userRepository } from "@/lib/repositories/user.repository";
import { refreshTokenRepository } from "@/lib/repositories/refreshToken.repository";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
  verifyRefreshToken,
} from "@/lib/utils/jwt";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth.validator";

class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AuthError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const { user, organization } = await userRepository.createWithOrganization({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      organizationName: input.organizationName,
      organizationSlug: slugify(input.organizationName),
    });

    const tokens = await this.issueTokens(user.id, organization.id, user.role);
    return { user: this.sanitizeUser(user), organization, ...tokens };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new AuthError("Invalid email or password", 401);
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const tokens = await this.issueTokens(user.id, user.organizationId, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  },

  async refresh(rawRefreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AuthError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AuthError("Refresh token revoked or expired", 401);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthError("User not found or inactive", 401);
    }

    // Rotate: revoke old, issue new
    await refreshTokenRepository.revokeByTokenHash(tokenHash);
    const tokens = await this.issueTokens(user.id, user.organizationId, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  },

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (storedToken && !storedToken.revokedAt) {
      await refreshTokenRepository.revokeByTokenHash(tokenHash);
    }
  },

  async issueTokens(userId: string, organizationId: string | null, role: string) {
    const accessToken = signAccessToken({ userId, organizationId, role });
    const refreshToken = signRefreshToken(userId);

    await refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return { accessToken, refreshToken };
  },

  sanitizeUser(user: { id: string; fullName: string; email: string; role: string; organizationId: string | null }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  },
};

export { AuthError };