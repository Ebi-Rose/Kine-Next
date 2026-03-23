"use client";

import { useState } from "react";

export default function PricingPage() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const { getUser } = await import("@/lib/auth");
      const user = await getUser();
      if (!user) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.id, email: user.email }),
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
        <a href="/login" className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </a>

        <p className="mt-6 text-[10px] tracking-[0.3em] text-accent uppercase">Choose your plan</p>
        <p className="mt-1 text-xs text-muted2">Full access to everything. 14-day money-back guarantee.</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => setPlan("monthly")}
            className={`rounded-[var(--radius-default)] border p-4 text-left transition-all ${
              plan === "monthly" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Monthly</p>
                <p className="text-xs text-muted2">Flexible, cancel anytime</p>
              </div>
              <p className="text-lg font-display text-accent">£29.99<span className="text-xs text-muted2">/mo</span></p>
            </div>
          </button>

          <button
            onClick={() => setPlan("yearly")}
            className={`rounded-[var(--radius-default)] border p-4 text-left transition-all relative ${
              plan === "yearly" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
            }`}
          >
            <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[9px] font-medium text-bg">SAVE 17%</span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Yearly</p>
                <p className="text-xs text-muted2">£25/mo · Best value</p>
              </div>
              <p className="text-lg font-display text-accent">£300<span className="text-xs text-muted2">/yr</span></p>
            </div>
          </button>
        </div>

        <ul className="mt-6 flex flex-col gap-2 text-xs text-muted2">
          <li>✓ Personalized weekly programs</li>
          <li>✓ AI-powered session coaching</li>
          <li>✓ Progress tracking & analytics</li>
          <li>✓ Cycle-aware adjustments</li>
          <li>✓ Works offline as a PWA</li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-6 w-full rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Loading..." : "SUBSCRIBE →"}
        </button>

        {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

        <p className="mt-3 text-center text-[10px] text-muted">
          14-day money-back guarantee. Cancel anytime from your profile.
        </p>
      </div>
    </div>
  );
}
