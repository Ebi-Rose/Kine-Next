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
      console.log("[AuthGuard] starting check, pathname:", pathname);

      const authed = await isAuthenticated();
      console.log("[AuthGuard] authed:", authed);
      if (cancelled) return;
      if (!authed) {
        router.replace("/login");
        return;
      }

      const isPostCheckout = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("checkout") === "success";

      let sub = await getSubscriptionStatus();
      console.log("[AuthGuard] sub:", sub.active);
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
        console.log("[AuthGuard] no subscription, redirecting to /pricing");
        router.replace("/pricing");
        return;
      }

      // Brief wait for store hydration from localStorage
      await new Promise((r) => setTimeout(r, 300));
      const goal = useKineStore.getState().goal;
      console.log("[AuthGuard] goal:", goal, "pathname:", pathname);

      if (goal === null && pathname !== "/app/onboarding") {
        console.log("[AuthGuard] no onboarding, redirecting");
        router.replace("/app/onboarding");
        return;
      }

      if (cancelled) return;

      if (isPostCheckout) {
        window.history.replaceState({}, "", pathname);
      }

      console.log("[AuthGuard] allowed!");
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
