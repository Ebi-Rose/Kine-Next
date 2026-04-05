import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyValue } from "../_lib/cookie-sign";
import { createRatelimit } from "../_lib/rate-limit";

const ratelimit = createRatelimit("check-access", 60, "60 s");

/**
 * Returns whether the user has a valid access cookie (beta gate).
 * AuthGuard calls this to confirm access before proceeding with auth checks.
 */
export async function GET(request: NextRequest) {
  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ valid: false }, { status: 429 });
    }
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get("kine_access")?.value;

  if (!raw) {
    return Response.json({ valid: false });
  }

  const value = verifyValue(raw);
  if (!value || !value.startsWith("granted")) {
    return Response.json({ valid: false });
  }

  return Response.json({ valid: true });
}
