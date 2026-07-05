// src/lib/api/apiClient.ts

import { useAuthStore } from "@/lib/store/authStore";

const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
  if (!json.success || !json.data) return null;

  localStorage.setItem("refreshToken", json.data.refreshToken);
  const currentUser = useAuthStore.getState().user;
  if (currentUser) {
    useAuthStore.getState().setAuth(currentUser, json.data.accessToken);
  }
  return json.data.accessToken;
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