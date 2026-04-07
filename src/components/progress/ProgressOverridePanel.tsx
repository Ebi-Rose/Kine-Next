// ── Progress page override panel ──
//
// "What I want to see" — the user-facing surface for principle #20
// (The User Is the Authority). The personalization engine personalizes
// silently; this panel is how the user reverses any of those decisions.
//
// What it offers:
//   1. Time window override (4wk / 6wk / 12wk / engine default)
//   2. Per-card "show this anyway" toggles for cards the engine hid
//   3. Per-card "hide this for me" toggles for cards the engine showed
//   4. Reset to engine defaults
//
// Design decision: we never explain *why* the engine hid something. The
// override panel just lists every available card with its current state
// and lets the user flip it. No judgement, no justification.

"use client";

import { useMemo } from "react";
import BottomSheet from "@/components/BottomSheet";
import { useKineStore } from "@/store/useKineStore";
import type { CardId, ProgressLayout, TimeWindow } from "@/lib/progress-engine";

const ALL_CARDS: { id: CardId; label: string; description: string }[] = [
  { id: "strength_trend", label: "Strength trend", description: "Combined strength vs. your baseline" },
  { id: "top_lifts", label: "Top lifts", description: "Per-lift change vs. your average" },
  { id: "pr_feed", label: "Recent PRs", description: "New personal records" },
  { id: "pattern_balance", label: "Pattern balance", description: "Push / pull / legs distribution" },
  { id: "phase_position", label: "Phase position", description: "Where you are in the program block" },
  { id: "effort_observation", label: "Effort", description: "Average effort across the block" },
  { id: "effort_control", label: "Control & tempo", description: "Effort steadiness + tempo adherence" },
  { id: "rehab_work", label: "Rehab work", description: "Rehab-tagged exercises and reintroductions" },
  { id: "exercises_learned", label: "Exercises practiced", description: "New movements you're learning" },
  { id: "mobility_log", label: "Mobility log", description: "Mobility sessions logged" },
  { id: "symptom_context", label: "Symptom context", description: "Pain / symptom days flagged on the calendar" },
];

const WINDOW_OPTIONS: { value: TimeWindow | "default"; label: string }[] = [
  { value: "default", label: "Use engine default" },
  { value: "4wk", label: "4 weeks" },
  { value: "6wk", label: "6 weeks" },
  { value: "12wk", label: "12 weeks" },
];

export default function ProgressOverridePanel({
  open,
  onClose,
  layout,
}: {
  open: boolean;
  onClose: () => void;
  layout: ProgressLayout;
}) {
  const {
    progressPreferences,
    setProgressPreference,
    setProgressTimeWindow,
    resetProgressPreferences,
  } = useKineStore();

  // Build a quick lookup of which cards the engine currently shows.
  const visibleCardIds = useMemo(() => {
    const ids = new Set<CardId>();
    for (const c of layout.strengthCards) ids.add(c.id);
    for (const c of layout.bodyCards) ids.add(c.id);
    ids.add(layout.hero.id);
    return ids;
  }, [layout]);

  const currentWindow = progressPreferences.timeWindowOverride ?? "default";
  const hasOverrides =
    Object.keys(progressPreferences.overrides).length > 0 ||
    progressPreferences.timeWindowOverride !== null;

  return (
    <BottomSheet open={open} onClose={onClose} title="What I want to see">
      <p className="text-xs text-muted2 leading-relaxed mb-5">
        Kinē decides what&apos;s most useful to surface based on your profile. Anything you turn on here will always show. Anything you turn off will never show.
      </p>

      {/* Time window */}
      <div className="mb-5">
        <p className="text-[10px] tracking-[1.5px] uppercase text-muted mb-2 font-light">
          Time window
        </p>
        <div className="grid grid-cols-2 gap-2">
          {WINDOW_OPTIONS.map((opt) => {
            const isActive = currentWindow === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() =>
                  setProgressTimeWindow(opt.value === "default" ? null : opt.value)
                }
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                  isActive
                    ? "border-accent bg-accent-dim text-text"
                    : "border-border text-muted2 hover:border-border-active"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {currentWindow === "default" && (
          <p className="text-[10px] text-muted mt-2 font-light">
            Engine default: {layout.window}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="mb-5">
        <p className="text-[10px] tracking-[1.5px] uppercase text-muted mb-2 font-light">
          Cards
        </p>
        <div className="flex flex-col gap-1.5">
          {ALL_CARDS.map((card) => {
            const override = progressPreferences.overrides[card.id];
            const engineVisible = visibleCardIds.has(card.id);
            const effective =
              override === "force_show"
                ? true
                : override === "force_hide"
                  ? false
                  : engineVisible;

            return (
              <CardRow
                key={card.id}
                label={card.label}
                description={card.description}
                isOn={effective}
                isOverridden={override !== undefined}
                onToggle={() => {
                  // Tri-state toggle: default → opposite of engine → other override → default
                  if (override === undefined) {
                    setProgressPreference(card.id, engineVisible ? "force_hide" : "force_show");
                  } else if (override === "force_show") {
                    setProgressPreference(card.id, "force_hide");
                  } else {
                    setProgressPreference(card.id, null);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Reset */}
      {hasOverrides && (
        <button
          onClick={() => {
            resetProgressPreferences();
            onClose();
          }}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted2 hover:border-border-active transition-colors"
        >
          Reset to engine defaults
        </button>
      )}

      <p className="text-[10px] text-muted mt-4 font-light leading-relaxed">
        Changes apply immediately. Your overrides stay even after Kinē changes its defaults — you stay in control.
      </p>
    </BottomSheet>
  );
}

function CardRow({
  label,
  description,
  isOn,
  isOverridden,
  onToggle,
}: {
  label: string;
  description: string;
  isOn: boolean;
  isOverridden: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-active"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text">{label}</div>
        <div className="text-[10px] text-muted font-light mt-0.5">{description}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          aria-label={isOn ? "Showing" : "Hidden"}
          className={`inline-block w-9 h-5 rounded-full relative transition-colors ${
            isOn ? "bg-accent" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              isOn ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
        {isOverridden && (
          <span className="text-[8px] text-accent uppercase tracking-wider font-medium">
            override
          </span>
        )}
      </div>
    </button>
  );
}
