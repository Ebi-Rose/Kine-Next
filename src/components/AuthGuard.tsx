"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, isDemoMode } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (!ok) {
        router.replace("/");
        return;
      }

      if (isDemoMode()) {
        const store = useKineStore.getState();
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");

        if (mode === "demo") {
          // kinedemo: reset and seed with 5 weeks of data
          store.resetOnboarding();
          localStorage.removeItem("kine_v2");
          import("@/lib/demo-seed").then(({ seedDemoStore }) => {
            seedDemoStore(store);
            setAllowed(true);
            setChecking(false);
          });
          return;
        }

        if (mode === "new") {
          // kinenew: clear data and redirect to onboarding
          store.resetOnboarding();
          localStorage.removeItem("kine_v2");
          window.location.href = "/app/onboarding?demo=true";
          return;
        }

        // Already on onboarding or returning demo user — allow through
      }

      setAllowed(true);
      setChecking(false);
    });
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
