"use client";

import { useEffect, useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { signOut } from "@/lib/auth";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import { appNow } from "@/lib/dev-time";
import { syncNow } from "@/lib/sync";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { BackButton } from "./_helpers";

export default function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { measurementSystem, setMeasurementSystem, resetOnboarding } = useKineStore();
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [restoring, setRestoring] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => { setThemeState(getTheme()); }, []);
  function applyTheme(t: Theme) { setTheme(t); setThemeState(t); }

  async function handleSync() {
    await syncNow();
    toast("Synced to cloud", "success");
  }

  function handleExportData() {
    const store = useKineStore.getState();
    const exportData = {
      exportedAt: appNow().toISOString(),
      version: "1.0",
      profile: store.personalProfile,
      preferences: {
        goal: store.goal,
        experience: store.exp,
        equipment: store.equip,
        trainingDays: store.trainingDays,
        duration: store.duration,
        dayDurations: store.dayDurations,
        measurementSystem: store.measurementSystem,
        currency: store.currency,
        eduMode: store.eduMode,
        sessionMode: store.sessionMode,
        restConfig: store.restConfig,
      },
      healthData: {
        injuries: store.injuries,
        injuryNotes: store.injuryNotes,
        conditions: store.conditions,
        comfortFlags: store.comfortFlags,
        cycleType: store.cycleType,
        cycle: store.cycle,
      },
      training: {
        progressDB: store.progressDB,
        weekData: store.weekData,
        weekHistory: store.weekHistory,
        sessionLogs: store.sessionLogs,
        feedbackState: store.feedbackState,
        sessionTimeBudgets: store.sessionTimeBudgets,
      },
      education: {
        eduFlags: store.eduFlags,
        skillPreferences: store.skillPreferences,
      },
      consents: store.consents,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kine-data-${appNow().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported", "success");
  }

  async function handleRestoreSubscription() {
    setRestoring(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setRestoring(false); return; }

      const res = await fetch("/api/verify-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.active) {
        toast("Subscription restored", "success");
      } else {
        toast("No active subscription found", "error");
      }
    } catch {
      toast("Could not verify subscription", "error");
    }
    setRestoring(false);
  }

  async function handleDeleteAccount() {
    setDeleteStep("deleting");
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setDeleteStep("idle"); return; }

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.deleted) {
        localStorage.removeItem("kine_v2");
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        try { indexedDB.deleteDatabase("kine_photos"); } catch {}
        window.location.href = "/";
      } else {
        toast(data.error || "Failed to delete account", "error");
        setDeleteStep("idle");
      }
    } catch {
      toast("Something went wrong", "error");
      setDeleteStep("idle");
    }
  }

  function handleReset() {
    if (confirm("This will reset all your data. Are you sure?")) {
      resetOnboarding();
      localStorage.removeItem("kine_v2");
      window.location.href = "/app/onboarding";
    }
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Settings & data</h2>

      {/* Preferences */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Preferences</p>
      <div className="rounded-[10px] border border-border bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Units</span>
          <div className="flex gap-1">
            {(["metric", "imperial"] as const).map((s) => (
              <button key={s} onClick={() => setMeasurementSystem(s)}
                className={`rounded-lg px-3 py-1 text-xs transition-all ${
                  (measurementSystem || "metric") === s ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
                }`}>{s === "metric" ? "kg" : "lbs"}</button>
            ))}
          </div>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Theme</span>
          <div className="flex gap-1">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => applyTheme(t)}
                className={`rounded-lg px-3 py-1 text-xs transition-all capitalize ${
                  theme === t ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
                }`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Data */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Your data</p>
      <div className="rounded-[10px] border border-border bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Sync to cloud</span>
          <button onClick={handleSync} className="text-xs text-accent hover:underline">Sync now</button>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Export data</span>
          <button onClick={handleExportData} className="text-xs text-accent hover:underline">Export my data</button>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Restore subscription</span>
          <button onClick={handleRestoreSubscription} disabled={restoring} className="text-xs text-accent hover:underline disabled:opacity-50">
            {restoring ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {/* Account */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Account</p>
      <button onClick={() => signOut()}
        className="w-full rounded-[10px] border border-border bg-surface p-3 text-center text-xs text-muted2 hover:text-text transition-colors">
        Sign out
      </button>

      {/* Danger zone */}
      <div className="mt-6 rounded-[10px] border border-red-500/20 p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-red-400 mb-3">Danger zone</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text font-light">Reset all data</p>
            <p className="text-[9px] text-muted">Clears everything. Restarts onboarding.</p>
          </div>
          <button onClick={handleReset} className="text-[10px] text-red-400 hover:underline">Reset</button>
        </div>

        <div className="h-px bg-red-500/10" />

        {deleteStep === "idle" && (
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-text font-light">Delete account</p>
              <p className="text-[9px] text-muted">Permanent. Removes all data and subscription.</p>
            </div>
            <button onClick={() => setDeleteStep("confirm")} className="text-[10px] text-red-400 hover:underline">Delete</button>
          </div>
        )}
        {deleteStep === "confirm" && (
          <div className="mt-3 rounded-lg bg-red-500/10 p-3">
            <p className="text-xs text-red-400 font-medium">Are you sure?</p>
            <p className="mt-1 text-[10px] text-muted2">
              This permanently deletes your account, training history, and subscription. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteStep("idle")}>Cancel</Button>
              <button onClick={handleDeleteAccount}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-red-600">
                Yes, delete everything
              </button>
            </div>
          </div>
        )}
        {deleteStep === "deleting" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            Deleting account...
          </div>
        )}
      </div>
    </div>
  );
}
