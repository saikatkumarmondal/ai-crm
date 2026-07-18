// src/lib/api/auth.ts

import { apiFetch } from "@/lib/api/apiClient";
import { useAuthStore } from "@/lib/store/authStore";

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationId: string | null;
};

type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export const authApi = {
  login(email: string, password: string) {
    return apiFetch<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  googleLogin(idToken: string) {
    return apiFetch<AuthResult>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await apiFetch<null>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      localStorage.removeItem("refreshToken");
      useAuthStore.getState().clearAuth();
    }
  },
};

export type { AuthUser, AuthResult };