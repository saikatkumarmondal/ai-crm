// src/components/auth/GoogleLoginButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";

export function GoogleLoginButton() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log("1. Starting signInWithPopup...");
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    console.log("2. Popup completed, got user:", result.user.email);
    const idToken = await result.user.getIdToken();
    console.log("3. Got idToken, calling backend...");
    const data = await authApi.googleLogin(idToken);
    console.log("4. Backend responded:", data);
    localStorage.setItem("refreshToken", data.refreshToken);
    setAuth(data.user, data.accessToken);
    if (data.needsOnboarding) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  } catch (err) {
    console.error("Google login error caught:", err);
    setError(err instanceof Error ? err.message : "Google login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon />
        {loading ? "Signing in..." : "Continue with Google"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}