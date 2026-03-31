"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { getSubscriptionStatus } from "@/lib/auth";
import { formatCurrency, formatDateWithYear, formatDateShortLocale, detectCurrency, PRICE_TABLE } from "@/lib/format";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { BackButton, Row } from "./_helpers";

export default function SubscriptionPanel({ onBack }: { onBack: () => void }) {
  const currency = useKineStore((s) => s.currency) || detectCurrency();
  const prices = PRICE_TABLE[currency];
  const [status, setStatus] = useState<{
    active: boolean;
    status?: string;
    plan?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getSubscriptionStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setPortalLoading(false); return; }

      const res = await fetch("/api/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Could not open portal", "error");
    } catch {
      toast("Something went wrong", "error");
    }
    setPortalLoading(false);
  }

  async function handleResubscribe(plan: "monthly" | "yearly") {
    setCheckoutLoading(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setCheckoutLoading(false); return; }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, currency }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Could not start checkout", "error");
    } catch {
      toast("Something went wrong", "error");
    }
    setCheckoutLoading(false);
  }

  const isCancelling = status?.active && status?.cancelAtPeriodEnd;
  const isCanceled = !status?.active && (status?.status === "canceled" || status?.status === "inactive");
  const isPastDue = status?.status === "past_due";

  const statusLabel = isCancelling
    ? "Cancelling"
    : isPastDue
      ? "Past due"
      : status?.active
        ? "Active"
        : "Inactive";

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Subscription</h2>

      {loading ? (
        <div className="mt-4 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-2">
              <Row label="Status" value={statusLabel} />
              {status?.plan && <Row label="Plan" value={status.plan} />}
              {status?.currentPeriodEnd && (
                <Row
                  label={isCancelling ? "Access until" : "Renews"}
                  value={formatDateWithYear(status.currentPeriodEnd)}
                />
              )}
            </div>

            {isCancelling && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <p className="text-xs text-amber-400">
                  Your subscription will end on {formatDateShortLocale(status.currentPeriodEnd!)}. You can reactivate from the portal below.
                </p>
              </div>
            )}

            {isPastDue && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400">
                  Your last payment failed. Update your payment method to keep access.
                </p>
              </div>
            )}
          </div>

          {(status?.active || isPastDue) && (
            <div>
              <Button variant="secondary" size="sm" className="w-full" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? "Loading..." : "Manage subscription"}
              </Button>
              <p className="mt-2 text-[10px] text-muted text-center">
                {isCancelling ? "Reactivate, change plan, or update payment." : "Change plan, update payment, or cancel."}
              </p>
            </div>
          )}

          {isCanceled && (
            <div>
              <p className="text-xs text-muted2 mb-3">Choose a plan to resubscribe.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleResubscribe("monthly")}
                  disabled={checkoutLoading}
                  className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-3 text-left hover:border-border-active transition-all disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-text">Monthly</p>
                    <p className="text-xs text-muted2">Cancel anytime</p>
                  </div>
                  <p className="text-sm font-display text-accent">{formatCurrency(prices.monthly, currency)}<span className="text-xs text-muted2">/mo</span></p>
                </button>
                <button
                  onClick={() => handleResubscribe("yearly")}
                  disabled={checkoutLoading}
                  className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-3 text-left hover:border-border-active transition-all disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-text">Yearly</p>
                    <p className="text-xs text-muted2">Save 17%</p>
                  </div>
                  <p className="text-sm font-display text-accent">{formatCurrency(prices.yearly, currency)}<span className="text-xs text-muted2">/yr</span></p>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
