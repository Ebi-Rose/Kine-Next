import { NextRequest } from "next/server";
import { createRatelimit } from "../_lib/rate-limit";
import { checkBodySize } from "../_lib/body-limit";

const ratelimit = createRatelimit("dev-unlock", 5, "60 s");
const MAX_BODY = 1_024; // 1 KB — just a passcode string

/**
 * Verifies a passcode against the server-side DEV_PASSCODE env var.
 * Keeps the real secret out of the client bundle — the browser only
 * submits the user's typed passcode and we answer with {ok: true/false}.
 *
 * This is a visibility gate for beta testers, not an auth boundary.
 * The response sets no cookie and carries no token; the client flips
 * a sessionStorage flag on success. The gate protects the DevOverlay
 * UI only — nothing the dev tool does is server-authenticated separately.
 */
export async function POST(request: NextRequest) {
  const tooLarge = checkBodySize(request, MAX_BODY);
  if (tooLarge) return tooLarge;

  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }
  }

  let body: { passcode?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const passcode = typeof body.passcode === "string" ? body.passcode : "";
  const expected = process.env.DEV_PASSCODE;

  // If the env var is unset the route refuses everything — safer than
  // accidentally shipping an empty-string match.
  if (!expected) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  // Constant-time comparison to avoid trivial timing attacks, even
  // though the threat model here is very low.
  if (passcode.length !== expected.length) {
    return Response.json({ ok: false });
  }
  let diff = 0;
  for (let i = 0; i < passcode.length; i++) {
    diff |= passcode.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return Response.json({ ok: false });
  }

  return Response.json({ ok: true });
}
