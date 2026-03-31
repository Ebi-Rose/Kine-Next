import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Create a distributed rate limiter via Upstash Redis.
 * In production, throws if Upstash env vars are missing (rate limiting is mandatory).
 * In development, falls back to permissive (no limiting).
 */
export function createRatelimit(prefix: string, requests: number, window: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[security] Upstash env vars missing — rate limiting is mandatory in production (${prefix})`);
    }
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: `ratelimit:${prefix}`,
  });
}
