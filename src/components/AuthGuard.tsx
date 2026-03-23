"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isDemoMode } from "@/lib/auth";
import { useKineStore } from "@/store/useKineStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (!ok) {
        router.replace("/");
      } else {
        if (isDemoMode()) {
          const store = useKineStore.getState();
          const params = new URLSearchParams(window.location.search);
          const mode = params.get("mode");

          if (mode === "demo") {
            // kinedemo: always reset and seed with 5 weeks of data
            store.resetOnboarding();
            localStorage.removeItem("kine_v2");
            import("@/lib/demo-seed").then(({ seedDemoStore }) => {
              seedDemoStore(store);
              setAllowed(true);
              setChecking(false);
            });
            return;
          } else if (mode === "new") {
            // kinenew: clear data and go to onboarding
            store.resetOnboarding();
            localStorage.removeItem("kine_v2");
            router.replace("/app/onboarding?demo=true");
            return;
          }
        }
        setAllowed(true);
      }
      setChecking(false);
    });
  }, [router]);

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
