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
    // 1. Cancel Stripe subscription (best-effort — external service)
    if (process.env.STRIPE_SECRET_KEY) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

      if (sub?.stripe_subscription_id) {
        try {
          const res = await fetch(`${STRIPE_API}/subscriptions/${sub.stripe_subscription_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          });
          if (!res.ok) console.warn("[delete-account] stripe cancel returned", res.status);
        } catch (e) {
          console.warn("[delete-account] stripe cancel failed (best-effort):", e);
        }
      }
    }

    // 2. Delete user data atomically via RPC transaction
    const { error: rpcError } = await supabase.rpc("delete_user_data", {
      target_user_id: user.id,
    });

    if (rpcError) {
      // Fallback: sequential deletes if RPC not yet deployed
      if (rpcError.message.includes("does not exist")) {
        console.warn("[delete-account] RPC not found, using sequential deletes");
        const { error: e1 } = await supabase.from("training_data").delete().eq("user_id", user.id);
        if (e1) throw new Error(`training_data delete failed: ${e1.message}`);
        const { error: e2 } = await supabase.from("subscriptions").delete().eq("user_id", user.id);
        if (e2) throw new Error(`subscriptions delete failed: ${e2.message}`);
        const { error: e3 } = await supabase.from("profiles").delete().eq("id", user.id);
        if (e3) throw new Error(`profiles delete failed: ${e3.message}`);
      } else {
        throw new Error(`delete_user_data RPC failed: ${rpcError.message}`);
      }
    }

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
