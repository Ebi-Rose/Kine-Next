import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logAudit, getRequestIp } from "../_lib/audit";
import { checkBodySize } from "../_lib/body-limit";

const MAX_WEBHOOK_BODY = 65_536; // 64 KB — Stripe events are typically <10 KB

export async function POST(request: NextRequest) {
  const tooLarge = checkBodySize(request, MAX_WEBHOOK_BODY);
  if (tooLarge) return tooLarge;

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
    logAudit({ event: "webhook_signature_failed", ip: getRequestIp(request.headers) });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  logAudit({ event: "webhook_received", ip: getRequestIp(request.headers), metadata: { type: event.type } });

  // Idempotency: skip if we've already processed this event
  const { data: existing } = await supabase
    .from("audit_log")
    .select("id")
    .eq("metadata->>stripe_event_id", event.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json({ received: true, duplicate: true });
  }

  logAudit({ event: "webhook_processing", ip: getRequestIp(request.headers), metadata: { type: event.type, stripe_event_id: event.id } });

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

        // Fetch the subscription details. Use raw fetch (no SDK retry layer).
        let subscription: Record<string, unknown> = {};
        try {
          const subResp = await fetch(
            `https://api.stripe.com/v1/subscriptions/${session.subscription}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              },
            }
          );
          const parsed = await subResp.json();
          if (subResp.ok) {
            subscription = parsed;
          } else {
            console.error("[webhook] subscription fetch failed:", parsed.error?.message);
          }
        } catch (err) {
          console.error("[webhook] subscription fetch threw:", err instanceof Error ? err.message : err);
        }

        // Period dates: top-level on older API versions, items-level on newer
        const item = (subscription.items as { data?: Array<Record<string, number | undefined>> } | undefined)?.data?.[0];
        const periodStart = (subscription.current_period_start as number | undefined)
          || item?.current_period_start;
        const periodEnd = (subscription.current_period_end as number | undefined)
          || item?.current_period_end;

        const now = new Date().toISOString();
        // CRITICAL: write the subscription row FIRST, before any other Stripe
        // calls. A failure in the duplicate-cancel guard below must never
        // prevent the user's subscription from being recorded.
        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              status: (subscription.status as string) || "active",
              cancel_at_period_end: (subscription.cancel_at_period_end as boolean) || false,
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
        if (subError) {
          console.error("[webhook] subscription upsert failed:", subError);
          // Re-throw so Stripe retries — without the row, the user has no access.
          throw new Error(`subscription upsert failed: ${subError.message}`);
        }

        // Best-effort: cancel any other active subscriptions for this customer.
        // Wrapped so a transient Stripe SDK error doesn't undo the upsert above.
        try {
          const customerId = session.customer as string;
          const allActiveSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 10,
          });
          const duplicates = allActiveSubs.data.filter(
            (s) => s.id !== session.subscription
          );
          for (const dup of duplicates) {
            console.warn(`[webhook] cancelling duplicate subscription ${dup.id} for user ${userId}`);
            await stripe.subscriptions.cancel(dup.id, { prorate: true });
            logAudit({ event: "duplicate_subscription_cancelled", user_id: userId, ip: getRequestIp(request.headers), metadata: { cancelled_sub: dup.id, kept_sub: session.subscription as string } });
          }
        } catch (err) {
          console.error("[webhook] duplicate-cancel guard failed (non-fatal):", err instanceof Error ? err.message : err);
        }

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

      case "customer.subscription.created": {
        // Safety net: if checkout.session.completed didn't write the row
        // (transient failure, missing metadata, etc.), this catches it.
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const createdItem = subscription.items?.data?.[0];
        const priceId = createdItem?.price?.id;
        const plan = priceId === process.env.STRIPE_PRICE_YEARLY ? "yearly"
          : priceId === process.env.STRIPE_PRICE_MONTHLY ? "monthly"
          : subscription.metadata?.plan || "monthly";

        const subAny = subscription as unknown as Record<string, unknown>;
        const itemAny = createdItem as unknown as Record<string, unknown> | undefined;
        const cStart = (typeof subAny.current_period_start === "number" ? subAny.current_period_start : null)
          || (itemAny?.current_period_start as number | undefined);
        const cEnd = (typeof subAny.current_period_end === "number" ? subAny.current_period_end : null)
          || (itemAny?.current_period_end as number | undefined);

        const cNow = new Date().toISOString();
        const { error: createdError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              plan,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              current_period_start: typeof cStart === "number"
                ? new Date(cStart * 1000).toISOString()
                : cNow,
              current_period_end: typeof cEnd === "number"
                ? new Date(cEnd * 1000).toISOString()
                : cNow,
              updated_at: cNow,
            },
            { onConflict: "user_id" }
          );
        if (createdError) {
          console.error("[webhook] subscription.created upsert failed:", createdError);
          throw new Error(`subscription.created upsert failed: ${createdError.message}`);
        }
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id, status")
          .eq("stripe_customer_id", invoice.customer as string)
          .single();

        if (sub?.user_id && sub.status === "past_due") {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
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
