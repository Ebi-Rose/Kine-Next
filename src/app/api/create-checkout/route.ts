import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../_lib/auth";
import { createRatelimit } from "../_lib/rate-limit";
import { verifyCsrf } from "../_lib/csrf";
import { checkBodySize } from "../_lib/body-limit";

const MAX_CHECKOUT_BODY = 4_096; // 4 KB — only a plan field
const ratelimit = createRatelimit("checkout", 5, "60 s");

const STRIPE_API = "https://api.stripe.com/v1";

// Multi-currency price map: STRIPE_PRICE_{PLAN}_{CURRENCY}
// Falls back to legacy env vars (no currency suffix) for GBP backwards compat.
const PRICES: Record<string, Record<string, string | undefined>> = {
  GBP: {
    monthly: process.env.STRIPE_PRICE_MONTHLY_GBP || process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY_GBP || process.env.STRIPE_PRICE_YEARLY,
  },
  USD: {
    monthly: process.env.STRIPE_PRICE_MONTHLY_USD,
    yearly: process.env.STRIPE_PRICE_YEARLY_USD,
  },
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

  const tooLarge = checkBodySize(request, MAX_CHECKOUT_BODY);
  if (tooLarge) return tooLarge;

  if (!verifyCsrf(request)) {
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

  try {
    const { plan, currency = "GBP" } = await request.json();
    const userId = user.id;
    const email = user.email;

    const currencyPrices = PRICES[currency] || PRICES.GBP;
    if (!plan || !currencyPrices[plan]) {
      return Response.json({ error: "Invalid plan or currency" }, { status: 400 });
    }

    let customerId: string | undefined;
    if (email) {
      const existing = await stripeGet("/customers", { email, limit: "1" });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;

        // Block checkout if user already has an active/trialing subscription
        const activeSubs = await stripeGet("/subscriptions", {
          customer: customerId,
          status: "active",
          limit: "1",
        });
        const trialingSubs = await stripeGet("/subscriptions", {
          customer: customerId,
          status: "trialing",
          limit: "1",
        });
        if (activeSubs.data.length > 0 || trialingSubs.data.length > 0) {
          return Response.json(
            { error: "You already have an active subscription" },
            { status: 409 },
          );
        }
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
      "line_items[0][price]": currencyPrices[plan]!,
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
    console.error("Checkout error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
