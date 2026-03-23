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
          const seedMode = params.get("seed");

          if (seedMode === "full" && !store.progressDB.programStartDate) {
            // kinedemo: seed with 5 weeks of data
            import("@/lib/demo-seed").then(({ seedDemoStore }) => {
              seedDemoStore(store);
            });
          } else if (!store.goal) {
            // kinenew: go through onboarding
            router.replace("/app/onboarding?demo=true");
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
