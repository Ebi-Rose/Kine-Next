"use client";

import { useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { syncToSupabase, syncFromSupabase } from "@/lib/sync";
import { reconcileState } from "@/lib/state-reconciliation";

/**
 * Invisible component that:
 * 1. Runs state reconciliation on mount
 * 2. Restores from Supabase on mount
 * 3. Subscribes to store changes and triggers debounced cloud sync
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

    return () => unsub();
  }, []);

  return null;
}
