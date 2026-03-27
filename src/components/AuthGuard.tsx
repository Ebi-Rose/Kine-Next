"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getSubscriptionStatus } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

/** Fetches the validated access mode from the server-side httpOnly cookie */
async function getAccessMode(): Promise<string | null> {
  try {
    const res = await fetch("/api/check-access");
    const { mode } = await res.json();
    return mode || null; // "new" | "demo" | "real" | null
  } catch {
    return null;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (allowed) return;

    let cancelled = false;

    async function check() {
      const mode = await getAccessMode();

      // ── Demo / New mode: skip auth and subscription checks ──
      if (mode === "demo" || mode === "new") {
        // Brief wait for store hydration
        await new Promise((r) => setTimeout(r, 300));
        if (cancelled) return;

        if (mode === "new") {
          const { progressDB } = useKineStore.getState();
          if (!progressDB.programStartDate && pathname !== "/app/onboarding") {
            router.replace("/app/onboarding");
            return;
          }
        }

        setAllowed(true);
        return;
      }

      // ── Real mode: full auth + subscription checks ──
      const authed = await isAuthenticated();
      if (cancelled) return;
      if (!authed) {
        router.replace("/login");
        return;
      }

      const isPostCheckout = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("checkout") === "success";

      let sub = await getSubscriptionStatus();
      if (!sub.active && isPostCheckout) {
        setLoadingMsg("Activating your subscription…");
        // Stripe webhook may not have fired yet — poll with backoff
        const delays = [1000, 1500, 2000, 2500, 3000];
        for (const delay of delays) {
          await new Promise((r) => setTimeout(r, delay));
          if (cancelled) return;
          sub = await getSubscriptionStatus();
          if (sub.active) break;
        }
      }

      if (cancelled) return;
      if (!sub.active) {
        router.replace("/pricing");
        return;
      }

      // Brief wait for store hydration from localStorage
      await new Promise((r) => setTimeout(r, 300));
      const { progressDB } = useKineStore.getState();

      if (!progressDB.programStartDate && pathname !== "/app/onboarding") {
        router.replace("/app/onboarding");
        return;
      }

      if (cancelled) return;

      if (isPostCheckout) {
        window.history.replaceState({}, "", pathname);
      }

      setAllowed(true);
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
