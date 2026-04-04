"use client";

import { useKineStore } from "@/store/useKineStore";
import { weightUnit } from "@/lib/format";
import { getCurrentPhase } from "@/lib/cycle";
import { isProgrammeStarted } from "@/lib/date-utils";
import { GOAL_OPTIONS, EQUIP_LABELS } from "@/data/constants";
import { NavCard, type Panel } from "./_helpers";

export default function OverviewPanel({ onNavigate }: { onNavigate: (p: Panel) => void }) {
  const store = useKineStore();
  const { personalProfile, progressDB, cycleType, cycle, goal, equip, eduMode, restConfig, measurementSystem } = store;
  const unit = weightUnit(measurementSystem || "metric");

  const phase = cycleType === "regular"
    ? getCurrentPhase(cycle.periodLog, cycle.avgLength)
    : null;

  const name = personalProfile.name || "You";
  const initial = name.charAt(0).toUpperCase();

  // Build subtitle for training
  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label || "";
  const dayCount = store.trainingDays.length;
  const equipSummary = equip.slice(0, 3).map((e) => EQUIP_LABELS[e] || e).join(", ");
  const trainingSub = [goalLabel, dayCount ? `${dayCount} days` : "", equipSummary].filter(Boolean).join(" · ");

  // Build subtitle for lifts
  const lifts = personalProfile.currentLifts || {};
  const liftEntries = Object.entries(lifts).filter(([, v]) => v > 0);
  const liftsSub = liftEntries.length > 0
    ? liftEntries.map(([k, v]) => `${k} ${v}${unit}`).join(" · ")
    : "Not set";

  // Rest config display
  const restSummary = `${restConfig.compound}s / ${restConfig.isolation}s`;

  return (
    <div className="mt-4">
      {/* Identity card */}
      <button
        onClick={() => onNavigate("personal")}
        className="w-full flex items-center gap-3 rounded-[10px] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
      >
        <div className="w-11 h-11 rounded-full bg-accent-dim border border-accent flex items-center justify-center shrink-0">
          <span className="font-display text-lg text-accent">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="rounded-full bg-accent-dim px-2 py-0.5 text-[9px] text-accent">
              {isProgrammeStarted(progressDB.programStartDate ?? null) ? `Week ${progressDB.currentWeek}` : "Not started"}
            </span>
            <span className="rounded-full bg-[rgba(106,154,122,0.15)] px-2 py-0.5 text-[9px] text-[#8aba9a]">
              {progressDB.sessions.length} sessions
            </span>
            {phase && (
              <span className="rounded-full bg-[rgba(138,122,90,0.15)] px-2 py-0.5 text-[9px] text-[#c4a872]">
                {phase.label} · Day {phase.day}
              </span>
            )}
          </div>
        </div>
        <span className="text-muted2 text-xs">▸</span>
      </button>

      {/* Programme section */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted font-medium">Programme</p>

      <NavCard label="Training" subtitle={trainingSub} onClick={() => onNavigate("training")} />
      <NavCard label="Health" subtitle="Cycle, conditions, comfort" onClick={() => onNavigate("health")} />
      <NavCard
        label="Session preferences"
        subtitle={`Coaching: ${eduMode} · Rest: ${restSummary}`}
        onClick={() => onNavigate("session")}
      />
      <NavCard label="Current lifts" subtitle={liftsSub} onClick={() => onNavigate("lifts")} />

      {/* Account section */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted font-medium">Account</p>

      <NavCard label="Subscription" subtitle="" onClick={() => onNavigate("subscription")} />
      <NavCard label="Settings & data" subtitle="Units, export, sync" onClick={() => onNavigate("settings")} />
      <NavCard label="Privacy" subtitle="Consent, data controls" onClick={() => onNavigate("privacy")} />
    </div>
  );
}
