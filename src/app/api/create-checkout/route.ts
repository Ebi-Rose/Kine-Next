import { NextRequest } from "next/server";

const STRIPE_API = "https://api.stripe.com/v1";
const PRICES: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

async function stripeRequest(endpoint: string, params: Record<string, string>) {
  const body = new URLSearchParams(params).toString();
  const resp = await fetch(`${STRIPE_API}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Stripe API error");
  return data;
}

async function stripeGet(endpoint: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const resp = await fetch(`${STRIPE_API}${endpoint}?${qs}`, {
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Stripe API error");
  return data;
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const { plan, userId, email } = await request.json();

    if (!plan || !PRICES[plan]) {
      return Response.json({ error: "Invalid plan: " + plan }, { status: 400 });
    }

    let customerId: string | undefined;
    if (email) {
      const existing = await stripeGet("/customers", { email, limit: "1" });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripeRequest("/customers", {
          email,
          "metadata[supabase_user_id]": userId || "",
        });
        customerId = customer.id;
      }
    }

    const siteUrl = process.env.SITE_URL || "https://kinefit.app";
    const sessionParams: Record<string, string> = {
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": PRICES[plan]!,
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl}/app/onboarding?checkout=success`,
      cancel_url: `${siteUrl}/pricing`,
      "metadata[supabase_user_id]": userId || "",
      "metadata[plan]": plan,
      "subscription_data[metadata][supabase_user_id]": userId || "",
      "subscription_data[metadata][plan]": plan,
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripeRequest("/checkout/sessions", sessionParams);
    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
