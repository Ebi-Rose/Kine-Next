import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan || "monthly";

        if (!userId) {
          console.warn("No supabase_user_id in checkout metadata");
          break;
        }

        const subResp = await fetch(
          `https://api.stripe.com/v1/subscriptions/${session.subscription}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          }
        );
        const subscription = await subResp.json();
        if (!subResp.ok)
          throw new Error(
            subscription.error?.message || "Failed to retrieve subscription"
          );

        // Period dates: top-level on older API versions, items-level on newer
        const item = subscription.items?.data?.[0];
        const periodStart = subscription.current_period_start
          || item?.current_period_start;
        const periodEnd = subscription.current_period_end
          || item?.current_period_end;

        const now = new Date().toISOString();
        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              status: subscription.status || "active",
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : now,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : now,
              updated_at: now,
            },
            { onConflict: "user_id" }
          );
        if (subError)
          console.error("[webhook] subscription upsert failed:", subError);

        const { error: profError } = await supabase.from("profiles").upsert(
          {
            id: userId,
            email: session.customer_details?.email || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        if (profError)
          console.error("[webhook] profile upsert failed:", profError);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id;

        const rawSub = event.data.object as unknown as Record<string, unknown>;

        // Fallback: look up user by stripe_customer_id if metadata is missing
        if (!userId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();
          userId = existing?.user_id;
        }
        if (!userId) break;

        const updNow = new Date().toISOString();

        // Determine plan from price if available
        const updItem = subscription.items?.data?.[0];
        const priceId = updItem?.price?.id;
        const plan = priceId === process.env.STRIPE_PRICE_YEARLY ? "yearly"
          : priceId === process.env.STRIPE_PRICE_MONTHLY ? "monthly"
          : undefined;

        // Period dates: top-level or item-level depending on Stripe API version
        const sub = subscription as unknown as Record<string, unknown>;
        const updStart = (typeof sub.current_period_start === "number" ? sub.current_period_start : null)
          || (updItem as unknown as Record<string, unknown>)?.current_period_start;
        const updEnd = (typeof sub.current_period_end === "number" ? sub.current_period_end : null)
          || (updItem as unknown as Record<string, unknown>)?.current_period_end;

        // Detect cancellation: cancel_at_period_end OR cancellation_details.reason
        const cancellationDetails = rawSub.cancellation_details as Record<string, unknown> | null;
        const isCancelling = subscription.cancel_at_period_end
          || (cancellationDetails?.reason === "cancellation_requested");

        const { error: updError } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at_period_end: isCancelling,
            ...(plan && { plan }),
            current_period_start: typeof updStart === "number"
              ? new Date(updStart * 1000).toISOString()
              : updNow,
            current_period_end: typeof updEnd === "number"
              ? new Date(updEnd * 1000).toISOString()
              : updNow,
            updated_at: updNow,
          })
          .eq("user_id", userId);

        if (updError) {
          console.error("[webhook] subscription update failed:", updError);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();
          userId = existing?.user_id;
        }
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", invoice.customer as string)
          .single();

        if (sub?.user_id) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", sub.user_id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook processing error:", message);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
