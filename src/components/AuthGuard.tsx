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
        // Seed demo data if in demo mode and no goal set
        if (isDemoMode()) {
          const store = useKineStore.getState();
          if (!store.goal) {
            store.setGoal("muscle");
            store.setExp("developing");
            store.setEquip(["barbell", "dumbbells", "machines"]);
            store.setDays("4");
            store.setTrainingDays([0, 1, 3, 4]);
            store.setDuration("medium");
            store.setCycleType("na");
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
