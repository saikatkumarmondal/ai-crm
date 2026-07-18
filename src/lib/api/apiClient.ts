// src/lib/api/apiClient.ts

import { useAuthStore } from "@/lib/store/authStore";

const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

// Multiple 401 একসাথে এলে যাতে একাধিক refresh call না ছোটে,
// তার জন্য চলমান refresh call এর promise টা এখানে ধরে রাখা হচ্ছে।
// সব caller একই promise await করবে — refresh token শুধু একবারই ব্যবহার হবে।
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const json: ApiResponse<{ accessToken: string; refreshToken: string }> =
        await res.json();

      if (!json.success || !json.data) {
        // refresh token নিজেই invalid/expired — এখানে auth state clear করে দেওয়া ভালো
        localStorage.removeItem("refreshToken");
        useAuthStore.getState().clearAuth();
        return null;
      }

      localStorage.setItem("refreshToken", json.data.refreshToken);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, json.data.accessToken);
      }
      return json.data.accessToken;
    } finally {
      // refresh শেষ হওয়ার পর promise clear করে দিচ্ছি,
      // যাতে পরবর্তী 401 এলে আবার নতুন refresh call করতে পারে।
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  const doFetch = async (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? "Request failed");
  }

  return json.data as T;
}