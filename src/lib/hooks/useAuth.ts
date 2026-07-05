// src/lib/hooks/useAuth.ts

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/apiClient";
import { useAuthStore } from "@/lib/store/authStore";
import type { LoginFormValues, RegisterFormValues } from "@/lib/validators/authForm.validator";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationId: string | null;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (values: Omit<RegisterFormValues, "confirmPassword">) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem("refreshToken");
      return apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    },
    onSuccess: () => {
      localStorage.removeItem("refreshToken");
      clearAuth();
      router.push("/login");
    },
  });
}