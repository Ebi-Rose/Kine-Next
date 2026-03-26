import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_lib/auth";

const STRIPE_API = "https://api.stripe.com/v1";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const userId = user.id;

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subError || !sub?.stripe_customer_id) {
      console.error("[portal] No subscription found for user:", userId, subError?.message);
      return Response.json({ error: "No subscription found" }, { status: 404 });
    }

    const siteUrl = process.env.SITE_URL || "https://kinefit.app";
    const body = new URLSearchParams({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/app/profile`,
    }).toString();

    const resp = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("[portal] Stripe error:", data.error?.message);
      return Response.json({ error: "Failed to create portal session" }, { status: 500 });
    }

    return Response.json({ url: data.url });
  } catch (err) {
    console.error("[portal] Error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
