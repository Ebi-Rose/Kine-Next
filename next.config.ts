import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ── Build-time safety checks ──
if (process.env.VERCEL_ENV === "production") {
  // Block dev bypass in production
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === "true") {
    throw new Error("NEXT_PUBLIC_DEV_BYPASS=true is set in production. Remove it before deploying.");
  }
  // Require critical env vars
  const required = ["SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ANTHROPIC_API_KEY", "COOKIE_SECRET"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missing.join(", ")}`);
  }
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CSP is set dynamically in middleware.ts with per-request nonces
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
