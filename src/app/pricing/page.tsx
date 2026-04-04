"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { detectCurrency, formatCurrency, PRICE_TABLE, yearlySavingsPercent, yearlyPerMonth, type SupportedCurrency } from "@/lib/format";

export default function PricingPage() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const currency = useMemo(() => detectCurrency(), []) as SupportedCurrency;

  // Redirect to app if user already has an active subscription
  useEffect(() => {
    (async () => {
      try {
        const { getSubscriptionStatus } = await import("@/lib/auth");
        const sub = await getSubscriptionStatus();
        if (sub.active) {
          window.location.href = "/app";
        }
      } catch { /* not logged in — stay on pricing */ }
    })();
  }, []);
  const prices = PRICE_TABLE[currency];
  const savings = yearlySavingsPercent(currency);
  const perMonth = yearlyPerMonth(currency);

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, currency }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg font-body">
      <div className="w-full max-w-sm">
        <a href="/app" className="text-xs text-muted2 hover:text-text transition-colors">
          &larr; Back
        </a>

        <div className="mt-6 font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>

        <h2 className="mt-4 text-[10px] tracking-[0.3em] text-accent uppercase font-normal m-0">Choose your plan</h2>
        <p className="mt-1 text-xs text-muted2 leading-relaxed">
          Structured, periodised training that adapts to your body. Not a chatbot &mdash; a coach.
        </p>

        <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Subscription plan">
          <button
            onClick={() => setPlan("monthly")}
            role="radio"
            aria-checked={plan === "monthly"}
            className={`rounded-[var(--radius-default)] border p-4 text-left transition-all ${
              plan === "monthly" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Monthly</p>
                <p className="text-xs text-muted2">Flexible, cancel anytime</p>
              </div>
              <p className="text-lg font-display text-accent">{formatCurrency(prices.monthly, currency)}<span className="text-xs text-muted2">/mo</span></p>
            </div>
          </button>

          <button
            onClick={() => setPlan("yearly")}
            role="radio"
            aria-checked={plan === "yearly"}
            className={`rounded-[var(--radius-default)] border p-4 text-left transition-all relative ${
              plan === "yearly" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
            }`}
          >
            <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[9px] font-medium text-bg">SAVE {savings}%</span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Yearly</p>
                <p className="text-xs text-muted2">{formatCurrency(perMonth, currency)}/mo &middot; Best value</p>
              </div>
              <p className="text-lg font-display text-accent">{formatCurrency(prices.yearly, currency)}<span className="text-xs text-muted2">/yr</span></p>
            </div>
          </button>
        </div>

        {/* Differentiators */}
        <div className="mt-6">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase mb-2">What makes Kin&#x0113; different</p>
          <ul className="flex flex-col gap-2 text-xs text-muted2">
            <li>&#10003; 3-week periodised blocks &mdash; volume, intensity, deload</li>
            <li>&#10003; Cycle-aware programming &mdash; adapts to your body, not against it</li>
            <li>&#10003; Transparent AI &mdash; see why every exercise was chosen</li>
            <li>&#10003; No streaks, no guilt &mdash; rest days are real rest days</li>
          </ul>
        </div>

        {/* Supporting features */}
        <div className="mt-4">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase mb-2">Everything included</p>
          <ul className="flex flex-col gap-2 text-xs text-muted2">
            <li>&#10003; AI-built weekly programmes, personalised to you</li>
            <li>&#10003; Adapts to your equipment, injuries &amp; experience</li>
            <li>&#10003; Smart warm-ups &amp; cooldowns</li>
            <li>&#10003; Weekly check-ins that shape your next week</li>
            <li>&#10003; Progress tracking &amp; photos</li>
            <li>&#10003; 170+ exercise library with coaching cues</li>
          </ul>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-6 w-full rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Loading..." : "SUBSCRIBE \u2192"}
        </button>

        {error && (
          <div className="mt-3 text-center" role="alert">
            <p className="text-xs text-[#ff8a80]">{error}</p>
            {error.toLowerCase().includes("active subscription") && (
              <a href="/app" className="mt-2 inline-block text-xs text-accent hover:underline">
                Go to your dashboard &rarr;
              </a>
            )}
          </div>
        )}

        <p className="mt-3 text-center text-[10px] text-muted">
          14-day money-back guarantee. Cancel anytime from your profile.
        </p>

        <p className="mt-4 text-center text-[10px] text-muted">
          Built by lifters, for lifters. Your data stays yours &mdash; no ads, no selling, GDPR compliant.
        </p>
      </div>
    </div>
  );
}
