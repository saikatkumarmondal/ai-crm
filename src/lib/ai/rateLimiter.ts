// src/lib/ai/rateLimiter.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestLog = new Map<string, RateLimitEntry>();
const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkAiRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = requestLog.get(userId);

  if (!entry || entry.resetAt < now) {
    requestLog.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}