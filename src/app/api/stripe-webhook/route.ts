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
              current_period_start: subscription.current_period_start
                ? new Date(
                    subscription.current_period_start * 1000
                  ).toISOString()
                : now,
              current_period_end: subscription.current_period_end
                ? new Date(
                    subscription.current_period_end * 1000
                  ).toISOString()
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
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const sub = subscription as unknown as Record<string, unknown>;
        const updNow = new Date().toISOString();
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start:
              typeof sub.current_period_start === "number"
                ? new Date(sub.current_period_start * 1000).toISOString()
                : updNow,
            current_period_end:
              typeof sub.current_period_end === "number"
                ? new Date(sub.current_period_end * 1000).toISOString()
                : updNow,
            updated_at: updNow,
          })
          .eq("user_id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
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
