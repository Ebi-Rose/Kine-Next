"use client";

import { useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { syncToSupabase, syncFromSupabase, syncNow, hasPendingSync } from "@/lib/sync";
import { reconcileState } from "@/lib/state-reconciliation";

/**
 * Invisible component that:
 * 1. Runs state reconciliation on mount
 * 2. Restores from Supabase on mount
 * 3. Subscribes to store changes and triggers debounced cloud sync
 * 4. Flushes pending syncs on page unload to prevent data loss
 */
export default function SyncProvider() {
  useEffect(() => {
    // Run reconciliation on mount
    reconcileState();

    // Restore from Supabase
    syncFromSupabase();

    // Subscribe to store changes for cloud sync
    const unsub = useKineStore.subscribe(() => {
      syncToSupabase();
    });

    // Flush pending sync before page unload to prevent data loss
    const handleBeforeUnload = () => {
      if (!hasPendingSync()) return;
      // Use syncNow() — fire the async request. The browser may not wait for it,
      // but modern browsers give ~2 seconds for beforeunload handlers.
      syncNow();
    };

    // visibilitychange is more reliable on mobile (beforeunload doesn't always fire)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasPendingSync()) {
        syncNow();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsub();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
