import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_lib/auth";
import { createRatelimit } from "../_lib/rate-limit";
import { verifyCsrf } from "../_lib/csrf";
import { logAudit, getRequestIp } from "../_lib/audit";

const ratelimit = createRatelimit("delete-account", 3, "3600 s");

const STRIPE_API = "https://api.stripe.com/v1";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request.headers);

  if (!verifyCsrf(request)) {
    logAudit({ event: "csrf_rejected", ip, metadata: { route: "/api/delete-account" } });
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Cancel Stripe subscription if active
    if (process.env.STRIPE_SECRET_KEY) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

      if (sub?.stripe_subscription_id) {
        await fetch(`${STRIPE_API}/subscriptions/${sub.stripe_subscription_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        }).catch(() => {});
      }
    }

    // 2. Delete user data (training_data, subscriptions cascade via ON DELETE CASCADE on profiles)
    // Delete training_data explicitly since it references auth.users, not profiles
    await supabase.from("training_data").delete().eq("user_id", user.id);
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // 3. Delete the Supabase auth user (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error("[delete-account] auth deletion failed:", authError.message);
    }

    // 4. Clear server-side cookies
    const cookieStore = await cookies();
    cookieStore.delete("kine_access");
    cookieStore.delete("kine_sub");

    logAudit({ event: "account_deleted", user_id: user.id, ip });

    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[delete-account] error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
