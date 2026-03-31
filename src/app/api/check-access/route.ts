import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyValue } from "../_lib/cookie-sign";
import { createRatelimit } from "../_lib/rate-limit";

const ratelimit = createRatelimit("check-access", 60, "60 s");

/**
 * Returns the validated access mode from the signed httpOnly cookie.
 * AuthGuard calls this instead of trusting localStorage.
 */
export async function GET(request: NextRequest) {
  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ mode: null }, { status: 429 });
    }
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get("kine_access")?.value;

  if (!raw) {
    return Response.json({ mode: null });
  }

  const value = verifyValue(raw);
  if (!value || !value.startsWith("granted")) {
    return Response.json({ mode: null });
  }

  // Format: "granted:mode" (e.g. "granted:demo", "granted:new", "granted:real")
  const mode = value.split(":")[1] || "real";
  return Response.json({ mode });
}
