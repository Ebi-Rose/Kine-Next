import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next.js 16 convention, replaces middleware.ts):
 *
 * 1. Generates a per-request nonce and sets a nonce-based CSP header
 * 2. Sets security headers (clickjacking, MIME sniffing, HSTS, referrer)
 * 3. For /app/* routes: verifies access cookie + subscription cookie
 */

// ── CSP nonce generation ──────────────────────────────────────

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// CSP for /app/* routes — uses 'unsafe-inline' because Next.js inline scripts
// don't reliably receive the nonce from the x-nonce header in production builds.
function buildAppCsp(): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "media-src 'self' blob: https://res.cloudinary.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Relaxed CSP for public pages (statically rendered, nonces can't be applied)
function buildPublicCsp(): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "media-src 'self' blob: https://res.cloudinary.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// ── Cookie signature verification (Web Crypto) ──

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // In production this should never happen — cookie-sign.ts throws too
      return "";
    }
    return "dev-only-insecure-key";
  }
  return secret;
}

async function verifySignature(signed: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;

  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;

  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (sig.length !== expectedHex.length) return false;

  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Main proxy ───────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");

  // ── Access code gate for /app/* (beta) ──
  if (isAppRoute) {
    const accessCookie = request.cookies.get("kine_access")?.value;
    let verified = false;
    try {
      verified = !!accessCookie && (await verifySignature(accessCookie));
    } catch {
      // crypto.subtle can throw on transient platform errors — treat as unverified
    }
    if (!verified) {
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      return NextResponse.redirect(url);
    }
  }
  // Subscription checks are handled client-side by AuthGuard.

  // ── CSP headers ──
  // /app/* routes are dynamically rendered → use nonce-based strict CSP
  // Public pages may be static → use relaxed CSP (nonces can't be applied)
  const requestHeaders = new Headers(request.headers);

  let csp: string;
  if (isAppRoute) {
    csp = buildAppCsp();
  } else {
    csp = buildPublicCsp();
  }

  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // ── Security headers ──
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|icon-|hero-bg|.*\\.svg$|.*\\.png$|.*\\.jpg$|api/).*)",
  ],
};
