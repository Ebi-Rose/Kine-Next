"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { buildWeek, type WeekData } from "@/lib/week-builder";
import { isProgrammeStarted } from "@/lib/date-utils";
import { toast } from "@/components/Toast";
import Button from "@/components/Button";

interface Props {
  /** True while the banner should be visible. The parent controls this. */
  open: boolean;
  /** Called after the user picks a resolution (rebuild / defer / dismiss). */
  onResolve: () => void;
  /** What changed, used in the banner copy. */
  changeLabel?: string;
}

/**
 * Sticky inline banner for profile panels. When a user changes a setting
 * that affects week composition, this slides up from the bottom of the
 * current panel offering:
 *   - Rebuild this week now (runs buildWeek() in place)
 *   - Apply from next week (sets pendingProfileChange flag)
 *   - Dismiss (keep current week unchanged)
 *
 * Replaces the previous full-screen modal in TrainingPanel and the
 * "clear weekData and punt to home" flow in HealthPanel.
 */
export default function RebuildBanner({ open, onResolve, changeLabel }: Props) {
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildSec, setRebuildSec] = useState(0);
  const store = useKineStore();
  const { progressDB, weekData, setWeekData, setProgressDB } = store;
  const started = isProgrammeStarted(progressDB.programStartDate ?? null);

  useEffect(() => {
    if (!rebuilding) { setRebuildSec(0); return; }
    const interval = setInterval(() => setRebuildSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [rebuilding]);

  if (!open) return null;

  // Pre-start — just clear and let the home page build fresh on next visit.
  if (!started) {
    return (
      <div
        role="status"
        className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none"
      >
        <div className="max-w-[var(--container-max)] mx-auto pointer-events-auto rounded-2xl border border-border bg-surface shadow-xl p-4 animate-fade-up">
          <p className="text-xs text-text font-medium mb-2.5">
            {changeLabel ? `${changeLabel} updated.` : "Settings updated."}
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setWeekData(null);
              toast("Saved — your first week will use the new settings", "success");
              onResolve();
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  async function rebuildNow() {
    setRebuilding(true);
    const previousWeek = weekData;
    const currentWeekNum = progressDB.currentWeek || previousWeek?._weekNum || 1;
    const completedDayIdxs = new Set<number>(
      (progressDB.sessions ?? [])
        .filter((s) => s.weekNum === currentWeekNum && typeof s.dayIdx === "number")
        .map((s) => s.dayIdx as number),
    );

    try {
      const result = await buildWeek();
      const next: WeekData | null = result.weekData ?? null;

      if (!next) {
        toast(result.error || "Couldn't rebuild the week", "error");
        if (previousWeek) setWeekData(previousWeek);
        return;
      }

      // Preserve completed days from the previous week.
      if (previousWeek && completedDayIdxs.size > 0) {
        next.days = next.days.map((day, idx) =>
          completedDayIdxs.has(idx) && previousWeek.days[idx]
            ? previousWeek.days[idx]
            : day,
        );
      }

      setWeekData(next);

      if (!result.success && result.error) {
        toast(result.error, "error");
      } else if (completedDayIdxs.size > 0) {
        toast(`Week rebuilt — kept ${completedDayIdxs.size} completed session${completedDayIdxs.size === 1 ? "" : "s"}`, "success");
      } else {
        toast("Week rebuilt with new settings", "success");
      }

      if (result.repairsCount && result.repairsCount > 0) {
        toast(
          result.repairsCount === 1
            ? "1 exercise adapted for your setup"
            : `${result.repairsCount} exercises adapted for your setup`,
          "info",
        );
      }
      onResolve();
    } catch (e) {
      console.error("[RebuildBanner] rebuild failed:", e);
      toast("Couldn't rebuild the week", "error");
      if (previousWeek) setWeekData(previousWeek);
    } finally {
      setRebuilding(false);
    }
  }

  function deferToNextWeek() {
    setProgressDB({
      ...progressDB,
      pendingProfileChange: true,
    });
    toast("Saved — changes apply from next week", "success");
    onResolve();
  }

  return (
    <div
      role="dialog"
      aria-label="Rebuild week with new settings"
      className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none"
    >
      <div className="max-w-[var(--container-max)] mx-auto pointer-events-auto rounded-2xl border border-border bg-surface shadow-xl p-4 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          <p className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium">
            Unsaved changes
          </p>
        </div>
        <p className="text-xs text-text font-medium">
          {changeLabel ? `${changeLabel} updated.` : "Settings updated."}{" "}
          <span className="text-muted2 font-light">When should this take effect?</span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={rebuildNow}
            disabled={rebuilding}
          >
            {rebuilding
              ? rebuildSec < 15
                ? "Rebuilding this week…"
                : rebuildSec < 30
                  ? "Still building — this takes 15–30s"
                  : "Almost there…"
              : "Rebuild this week now"}
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={deferToNextWeek}
            disabled={rebuilding}
          >
            Apply from next week
          </Button>
          <button
            onClick={onResolve}
            disabled={rebuilding}
            className="mt-0.5 text-[11px] text-muted hover:text-text transition-colors text-center disabled:opacity-50"
          >
            Discard changes to this setting
          </button>
        </div>
      </div>
    </div>
  );
}
