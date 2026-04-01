import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCsrf } from "../_lib/csrf";
import { createRatelimit } from "../_lib/rate-limit";
import { checkBodySize } from "../_lib/body-limit";

const MAX_WAITLIST_BODY = 4_096; // 4 KB — only an email field
const ratelimit = createRatelimit("waitlist", 3, "60 s");

export async function POST(request: NextRequest) {
  const tooLarge = checkBodySize(request, MAX_WAITLIST_BODY);
  if (tooLarge) return tooLarge;

  if (!verifyCsrf(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email;
  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Waitlist: missing Supabase env vars");
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("waitlist")
    .insert(
      { email: email.toLowerCase().trim() },
      { ignoreDuplicates: true }
    );

  if (error) {
    console.error("Waitlist insert error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
