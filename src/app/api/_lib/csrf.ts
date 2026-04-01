import { NextRequest } from "next/server";

/**
 * Verify the request origin matches our site to prevent CSRF.
 * Checks both Origin and Referer headers against the expected hostname.
 * Returns true if the request is safe (same-origin or server-to-server).
 */
export function verifyCsrf(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Server-to-server requests (e.g., Stripe webhooks) have no Origin/Referer.
  // For browser requests, at least one header should be present —
  // block if both are missing (non-browser clients can still call APIs via auth tokens).
  if (!origin && !referer) return false;

  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const vercelUrl = process.env.VERCEL_URL; // auto-provided by Vercel
  const allowedHosts = new Set<string>();

  // Add known hosts
  if (siteUrl) {
    try { allowedHosts.add(new URL(siteUrl).host); } catch {}
  }
  if (vercelUrl) {
    // VERCEL_URL is a bare hostname (no protocol), e.g. "my-app-xxx.vercel.app"
    allowedHosts.add(vercelUrl);
  }
  allowedHosts.add("kinefit.app");
  allowedHosts.add("www.kinefit.app");

  // In development, allow localhost on any port
  if (process.env.NODE_ENV === "development") {
    if (origin) {
      try { const u = new URL(origin); if (u.hostname === "localhost") return true; } catch {}
    }
    if (referer) {
      try { const u = new URL(referer); if (u.hostname === "localhost") return true; } catch {}
    }
  }

  if (origin) {
    try {
      if (allowedHosts.has(new URL(origin).host)) return true;
    } catch {}
  }

  if (referer) {
    try {
      if (allowedHosts.has(new URL(referer).host)) return true;
    } catch {}
  }

  return false;
}
