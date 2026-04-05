"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getSession, getSubscriptionStatus } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (allowed) return;

    let cancelled = false;

    async function check() {
      try {
        // ── Auth check ──
        const authed = await isAuthenticated();
        if (cancelled) return;
        if (!authed) {
          router.replace("/login");
          return;
        }

        // ── Subscription check ──
        const isPostCheckout = typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("checkout") === "success";

        let sub = await getSubscriptionStatus();
        if (!sub.active && isPostCheckout) {
          setLoadingMsg("Activating your subscription…");
          // Stripe webhook may not have fired yet — exponential backoff
          for (let attempt = 0; attempt < 8; attempt++) {
            await new Promise((r) => setTimeout(r, 1500 * Math.pow(1.3, attempt)));
            if (cancelled) return;
            sub = await getSubscriptionStatus();
            if (sub.active) break;
          }
        }

        if (cancelled) return;
        if (!sub.active) {
          window.location.href = "/pricing";
          return;
        }

        // Set server-side subscription cookie so proxy allows /app/* routes
        const session = await getSession();
        if (session?.access_token) {
          try {
            await fetch("/api/verify-subscription", {
              method: "POST",
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
          } catch {
            // Cookie not set — proxy will redirect to /pricing on next navigation
          }
        }

        // Post-checkout: clear any stale data so onboarding starts fresh
        if (isPostCheckout) {
          const storeState = useKineStore.getState();
          storeState.resetOnboarding();
          storeState.setWeekData(null);
          storeState.setProgressDB({
            sessions: [],
            lifts: { squat: [], bench: [], deadlift: [] },
            currentWeek: 1,
            weekFeedbackHistory: [],
            programStartDate: null,
            skippedSessions: [],
            phaseOffset: 0,
          });
          window.history.replaceState({}, "", pathname);
          if (pathname !== "/app/onboarding") {
            router.replace("/app/onboarding");
            return;
          }
        } else {
          // Brief wait for store hydration from localStorage
          await new Promise((r) => setTimeout(r, 300));
          const { progressDB, goal } = useKineStore.getState();

          // Onboarding not complete unless both goal and programStartDate are set
          if ((!progressDB.programStartDate || !goal) && pathname !== "/app/onboarding") {
            router.replace("/app/onboarding");
            return;
          }
        }

        setAllowed(true);
      } catch (err) {
        console.error("[AuthGuard] check failed:", err);
        router.replace("/login");
      }
    }

    check();
    return () => { cancelled = true; };
  }, [allowed, router, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg gap-5">
        <p className="font-display text-2xl tracking-wide text-text">
          <span style={{ color: "var(--color-accent)" }}>K</span>INĒ
        </p>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {loadingMsg && (
          <p className="text-xs text-muted2 animate-pulse">{loadingMsg}</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
