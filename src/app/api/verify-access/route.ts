import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { signValue } from "../_lib/cookie-sign";
import { createRatelimit } from "../_lib/rate-limit";
import { verifyCsrf } from "../_lib/csrf";
import { logAudit, getRequestIp } from "../_lib/audit";
import { checkBodySize } from "../_lib/body-limit";

const MAX_ACCESS_BODY = 4_096; // 4 KB — only a code field
const ratelimit = createRatelimit("access", 5, "900 s");

// Valid codes from env var — nothing hardcoded
// ACCESS_CODES: comma-separated list of valid codes (e.g. "kine2026,kinebeta")
function getValidCodes(): Set<string> {
  const raw = process.env.ACCESS_CODES || "";
  return new Set(
    raw.split(",").map((c) => c.trim().toLowerCase().split(":")[0]).filter(Boolean)
  );
}

export async function POST(request: NextRequest) {
  const tooLarge = checkBodySize(request, MAX_ACCESS_BODY);
  if (tooLarge) return tooLarge;

  if (!verifyCsrf(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ratelimit && process.env.NODE_ENV !== "development") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      logAudit({ event: "access_code_rate_limited", ip });
      return Response.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  const ip = getRequestIp(request.headers);

  try {
    const { code } = await request.json();
    const trimmed = code?.trim().toLowerCase();

    if (!trimmed) {
      logAudit({ event: "access_code_failure", ip });
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    const validCodes = getValidCodes();

    if (!validCodes.has(trimmed)) {
      logAudit({ event: "access_code_failure", ip });
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    logAudit({ event: "access_code_success", ip });

    const cookieStore = await cookies();
    cookieStore.set("kine_access", signValue("granted"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
