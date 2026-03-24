"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getSubscriptionStatus } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (allowed) return;

    let cancelled = false;

    async function check() {
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
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 2000));
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

      // Wait for store hydration (up to 2s) before checking onboarding
      let goal = useKineStore.getState().goal;
      if (goal === null) {
        await new Promise((r) => setTimeout(r, 500));
        goal = useKineStore.getState().goal;
      }

      if (goal === null && pathname !== "/app/onboarding") {
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
