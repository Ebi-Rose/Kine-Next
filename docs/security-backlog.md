# Security Backlog

Parked items from the March 2026 security audit.

## ~~Distributed rate limiting (Upstash)~~ — DONE (March 2026)

Replaced in-memory `Map`-based rate limiter with Upstash Redis sliding window (10 requests/60s per user). Shared counters across all serverless instances.

- Packages: `@upstash/ratelimit`, `@upstash/redis`
- Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Vercel)
- Falls back to no limiting if env vars missing
- Applied to: `src/app/api/chat/route.ts`

## ~~Error monitoring (Sentry)~~ — DONE (March 2026)

Added Sentry v10 for client-side, server-side, and edge error capture. DSN hardcoded (public ingest URL, not a secret). Source maps uploaded at build time via `withSentryConfig`.

- Config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`
- CSP updated to allow `connect-src https://*.sentry.io`
- Env vars: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (Vercel, build-time only)

## ~~Security response headers~~ — DONE (March 2026)

Added standard security headers to Edge middleware alongside the existing CSP nonce:

- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing attacks
- `X-Frame-Options: DENY` — blocks clickjacking via iframes
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage to third parties
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — enforces HTTPS for 2 years, eligible for browser HSTS preload list

Applied in: `src/middleware.ts`

## ~~AI prompt injection hardening~~ — DONE (March 2026)

User-supplied text fields (injury notes, week feedback notes) are inserted into AI prompts inside `<user_notes>` tags. The system prompt instructs the model to treat these as data, not instructions. However, a user could include a literal `</user_notes>` to escape the boundary.

Fix: `sanitiseUserNotes()` strips `<user_notes>` and `</user_notes>` tags from user input before prompt insertion. Applied to both injection points in `src/lib/week-builder.ts`.

## ~~Request body size limits~~ — DONE (March 2026)

All API routes now check `Content-Length` before reading the request body. Oversized requests are rejected with 413 before any processing.

- Shared helper: `src/app/api/_lib/body-limit.ts`
- Limits: webhook 64KB, checkout 4KB, waitlist 4KB, verify-access 4KB, chat 50KB (existing)
- Note: `Content-Length` is client-supplied and can be spoofed. Serverless function memory limits provide the hard backstop. This check raises the bar and catches accidental large payloads.

## Encrypt sensitive data in localStorage

`localStorage("kine_v2")` stores personal profile data (name, DOB, height, weight) in plaintext. Any browser extension or XSS can read it.

**Options:**
- Minimize what's persisted client-side (move sensitive fields to server-only)
- Encrypt the Zustand persisted state with a key derived from the user's session
- Accept the risk — CSP header now limits XSS surface

**Priority:** Medium. CSP mitigates the main attack vector.

## Old Vite app (`/kine`) cleanup

The legacy Vite app has weaker security than kine-next:
- Localhost bypass without authentication (`isLocalDev()` in `supabase.js`)
- In-memory rate limiting on its own `/api/chat.js`
- No signed cookies or server-side access validation

**Action:** Decommission once kine-next is fully live, or apply the same auth patterns if it stays in production.
