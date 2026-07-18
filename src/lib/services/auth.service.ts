// src/lib/services/auth.service.ts

import { userRepository } from "@/lib/repositories/user.repository";
import { refreshTokenRepository } from "@/lib/repositories/refreshToken.repository";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { UserRole } from "@prisma/client";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
  verifyRefreshToken,
} from "@/lib/utils/jwt";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import type {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
} from "@/lib/validators/auth.validator";

class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function slugify(name: string): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AuthError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const { user, organization } =
      await userRepository.createWithOrganization({
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        organizationName: input.organizationName,
        organizationSlug: slugify(input.organizationName),
        role: input.role as UserRole, // validated against publicUserRoles by zod
      });

    const tokens = await this.issueTokens(
      user.id,
      organization.id,
      user.role
    );

    return {
      user: this.sanitizeUser(user),
      organization,
      ...tokens,
    };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.isActive) {
      throw new AuthError("Invalid email or password", 401);
    }

    // Google sign-in accounts don't have a password hash
    if (!user.passwordHash) {
      throw new AuthError(
        "This account uses Google sign-in. Please continue with Google.",
        400
      );
    }

    const isPasswordValid = await verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const tokens = await this.issueTokens(
      user.id,
      user.organizationId,
      user.role
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  },

  async googleLogin({ idToken }: GoogleLoginInput) {
    let decoded;

    try {
      decoded = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch {
      throw new AuthError("Invalid or expired Google token", 401);
    }

    const { email, name, uid } = decoded;

    if (!email) {
      throw new AuthError("Google account has no email associated", 400);
    }

    // First try finding the user by Firebase UID
    let user = await userRepository.findByFirebaseUid(uid);

    if (!user) {
      // If not found, check for an existing account with the same email
      const existingByEmail = await userRepository.findByEmail(email);

      if (existingByEmail) {
        // Link Google account to existing email/password account
        user = await userRepository.linkFirebaseUid(existingByEmail.id, uid);
      } else {
        // Brand new Google user (no organization yet)
        // Default role (SALES_EXECUTIVE) applies until onboarding assigns
        // them an organization + proper role.
        user = await userRepository.createGoogleUser({
          fullName: name ?? email.split("@")[0],
          email,
          firebaseUid: uid,
        });
      }
    }

    if (!user.isActive) {
      throw new AuthError("Account is inactive", 401);
    }

    const tokens = await this.issueTokens(
      user.id,
      user.organizationId,
      user.role
    );

    return {
      user: this.sanitizeUser(user),
      needsOnboarding: !user.organizationId,
      ...tokens,
    };
  },

  async refresh(rawRefreshToken: string) {
    let payload: { userId: string };

    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AuthError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashToken(rawRefreshToken);

    const storedToken =
      await refreshTokenRepository.findByTokenHash(tokenHash);

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AuthError("Refresh token revoked or expired", 401);
    }

    const user = await userRepository.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new AuthError("User not found or inactive", 401);
    }

    // Rotate refresh token
    await refreshTokenRepository.revokeByTokenHash(tokenHash);

    const tokens = await this.issueTokens(
      user.id,
      user.organizationId,
      user.role
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  },

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    const storedToken =
      await refreshTokenRepository.findByTokenHash(tokenHash);

    if (storedToken && !storedToken.revokedAt) {
      await refreshTokenRepository.revokeByTokenHash(tokenHash);
    }
  },

  async issueTokens(
    userId: string,
    organizationId: string | null,
    role: string
  ) {
    const accessToken = signAccessToken({
      userId,
      organizationId,
      role,
    });

    const refreshToken = signRefreshToken(userId);

    await refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return {
      accessToken,
      refreshToken,
    };
  },

  sanitizeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    organizationId: string | null;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  },

  // New: seed a system-level Super Admin from environment variables.
  // Call this once on application startup (see prisma/seed.ts below).
  async ensureDefaultAdmin() {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    const defaultName = process.env.DEFAULT_ADMIN_NAME ?? "Super Admin";

    if (!defaultEmail || !defaultPassword) {
      console.warn(
        "DEFAULT_ADMIN_EMAIL/DEFAULT_ADMIN_PASSWORD not set, skipping default admin seed."
      );
      return;
    }

    const existing = await userRepository.findByEmail(defaultEmail);
    if (existing) {
      console.log(`Default admin already exists: ${defaultEmail}`);
      return;
    }

    const passwordHash = await hashPassword(defaultPassword);

    const user = await userRepository.createSuperAdmin({
      fullName: defaultName,
      email: defaultEmail,
      passwordHash,
    });

    console.log(`Default SUPER_ADMIN created: ${user.email}`);
  },
};

export { AuthError };