import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_lib/auth";
import { signValue } from "../_lib/cookie-sign";
import { verifyCsrf } from "../_lib/csrf";
import { createRatelimit } from "../_lib/rate-limit";

const ratelimit = createRatelimit("verify-subscription", 30, "60 s");

/**
 * Verifies auth + active subscription, then sets a signed httpOnly
 * `kine_sub` cookie so middleware can gate /app/* routes server-side.
 * Cookie has a 1-hour TTL — AuthGuard refreshes it on each visit.
 */
export async function POST(request: NextRequest) {
  if (!verifyCsrf(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ active: false }, { status: 401 });
  }

  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = await ratelimit.limit(`${ip}:${user.id}`);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  const isActive =
    !error && data && (data.status === "active" || data.status === "trialing");

  const cookieStore = await cookies();

  if (isActive) {
    cookieStore.set("kine_sub", signValue("active"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
  } else {
    cookieStore.delete("kine_sub");
  }

  return Response.json({ active: isActive });
}
