import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const accessCode = process.env.ACCESS_CODE || "kine2026";
    const demoCode = process.env.DEMO_CODE || "kinedemo";
    const trimmed = code?.trim().toLowerCase();

    if (!trimmed) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    const cookieStore = await cookies();

    // Demo code — grants demo access (no login required)
    if (trimmed === demoCode.toLowerCase()) {
      cookieStore.set("kine_access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      return Response.json({ ok: true, mode: "demo" });
    }

    // Full access code — requires login
    if (trimmed === accessCode.toLowerCase()) {
      cookieStore.set("kine_access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return Response.json({ ok: true, mode: "full" });
    }

    return Response.json({ error: "Invalid access code" }, { status: 401 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
