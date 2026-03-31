"use client";

import { useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { syncToSupabase, syncFromSupabase, flushSync } from "@/lib/sync";
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

    // Flush pending sync when user leaves the page
    const handleUnload = () => flushSync();

    // visibilitychange is more reliable on mobile (beforeunload doesn't always fire)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSync();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsub();
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
