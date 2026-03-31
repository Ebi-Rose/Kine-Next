import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { signValue } from "../_lib/cookie-sign";
import { createRatelimit } from "../_lib/rate-limit";
import { verifyCsrf } from "../_lib/csrf";
import { logAudit, getRequestIp } from "../_lib/audit";
import { checkBodySize } from "../_lib/body-limit";

const MAX_ACCESS_BODY = 4_096; // 4 KB — only a code field
const ratelimit = createRatelimit("access", 5, "900 s");

// Codes and modes from env vars — nothing hardcoded
// ACCESS_CODES: comma-separated "code:mode" pairs
// e.g. "kine2026:real,kinenew:new,kinedemo:demo"
// Codes without a mode default to "real"
function getCodeMap(): Record<string, string> {
  const raw = process.env.ACCESS_CODES || "";
  const map: Record<string, string> = {};
  raw.split(",").forEach((entry) => {
    const [code, mode] = entry.trim().toLowerCase().split(":");
    if (code) map[code] = mode || "real";
  });
  return map;
}

export async function POST(request: NextRequest) {
  const tooLarge = checkBodySize(request, MAX_ACCESS_BODY);
  if (tooLarge) return tooLarge;

  if (!verifyCsrf(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ratelimit) {
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

    const codeMap = getCodeMap();
    const mode = codeMap[trimmed];

    if (!mode) {
      logAudit({ event: "access_code_failure", ip });
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    logAudit({ event: "access_code_success", ip, metadata: { mode } });

    const cookieStore = await cookies();
    cookieStore.set("kine_access", signValue(`granted:${mode}`), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return Response.json({ ok: true, mode: mode || "real" });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
