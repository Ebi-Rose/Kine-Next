import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const accessCode = process.env.ACCESS_CODE || "kine2026";
    const trimmed = code?.trim().toLowerCase();

    if (!trimmed) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }

    if (trimmed === accessCode.toLowerCase()) {
      const cookieStore = await cookies();
      cookieStore.set("kine_access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Invalid access code" }, { status: 401 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
