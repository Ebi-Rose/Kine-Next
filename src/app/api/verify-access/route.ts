import { NextRequest } from "next/server";
import { cookies } from "next/headers";

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
  try {
    const { code } = await request.json();
    const trimmed = code?.trim().toLowerCase();

    if (!trimmed) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    const codeMap = getCodeMap();
    const mode = codeMap[trimmed];

    if (!mode) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("kine_access", "granted", {
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
