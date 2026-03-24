"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getSubscriptionStatus } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // 1. Must have a real Supabase session
      const authed = await isAuthenticated();
      if (!authed) {
        router.replace("/login");
        return;
      }

      // 2. Must have an active subscription
      // After checkout, webhook may be slow — retry a few times
      const isPostCheckout = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("checkout") === "success";

      let sub = await getSubscriptionStatus();
      if (!sub.active && isPostCheckout) {
        // Poll for up to 10 seconds waiting for webhook
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          sub = await getSubscriptionStatus();
          if (sub.active) break;
        }
      }

      if (!sub.active) {
        router.replace("/pricing");
        return;
      }

      if (cancelled) return;

      // 3. Check onboarding — if goal is null, user hasn't onboarded
      const { goal } = useKineStore.getState();
      const hasOnboarded = goal !== null;

      if (!hasOnboarded && pathname !== "/app/onboarding") {
        router.replace("/app/onboarding");
        return;
      }

      // Clean up checkout param from URL
      if (isPostCheckout) {
        window.history.replaceState({}, "", pathname);
      }

      setAllowed(true);
      setChecking(false);
    }

    check();
    return () => { cancelled = true; };
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
