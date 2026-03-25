import { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Code → mode mapping
// kine2026: real flow (auth + stripe + onboarding)
// kinenew:  skip auth/stripe, fresh user → onboarding
// kinedemo: skip auth/stripe, seed data → app
const CODE_MODES: Record<string, string> = {
  kine2026: "real",
  kinenew: "new",
  kinedemo: "demo",
};

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const trimmed = code?.trim().toLowerCase();

    if (!trimmed) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    // Check built-in codes first
    const mode = CODE_MODES[trimmed];

    // Also check env var for additional real-flow codes
    const extraCodes = (process.env.ACCESS_CODES || "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    if (!mode && !extraCodes.includes(trimmed)) {
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
