"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore, useStoreHydrated } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { findExercise } from "@/data/exercise-library";
import { getCurrentPhase, type CyclePhase } from "@/lib/cycle";
import CollapsibleSection from "@/components/CollapsibleSection";
import ExerciseSwapSheet from "@/components/ExerciseSwapSheet";

// ── Phase coaching notes ──
const PHASE_NOTES: Record<string, Record<CyclePhase, { body: string }>> = {
  muscle: {
    menstrual: { body: "Recovery tends to be slower right now. The same weight might feel heavier — that's hormonal, not a step backward." },
    follicular: { body: "Oestrogen is rising — your body responds to training most effectively right now. Most people find the bar feels lighter this week." },
    ovulatory: { body: "Your body is primed and recovers faster right now. Load tolerance and training response tend to be at their highest." },
    luteal: { body: "Recovery is slower this week. Form tends to hold better than load — the development continues, it just follows a different path." },
  },
  strength: {
    menstrual: { body: "Power output tends to be lower this week. Last week's weights are a solid baseline — a good window for technique work." },
    follicular: { body: "Peak adaptation window. The body responds most to training stimulus right now — this is when load tends to move best." },
    ovulatory: { body: "Strength and recovery are at their highest. A thorough warm-up unlocks what's available today." },
    luteal: { body: "Peak strength dips slightly this week. Bar speed and technique tend to matter more than adding weight right now." },
  },
  general: {
    menstrual: { body: "Energy tends to be lower. A lighter session still counts — showing up is the work." },
    follicular: { body: "Most people feel more energised than usual right now. The habit matters more than any single session." },
    ovulatory: { body: "Your body is in a good place right now. Sessions tend to feel easier this week." },
    luteal: { body: "Energy dips are completely normal right now. A completed session at any effort level counts." },
  },
};

// ── Muscle group colors ──
const MUSCLE_COLORS: Record<string, string> = {
  push: "bg-cat-push", pull: "bg-cat-pull",
  legs: "bg-cat-legs", hinge: "bg-cat-hinge",
  core: "bg-cat-core", cardio: "bg-cat-cardio",
};

type CoachLevel = "full" | "feel" | "silent";

export default function PreSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const {
    weekData, goal, injuries, injuryNotes, cycleType, cycle,
    eduMode, setEduMode, progressDB, sessionTimeBudgets,
    setSessionTimeBudgets, setCurrentDayIdx,
  } = useKineStore();

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  const hydrated = useStoreHydrated();

  // ── Local state ──
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState<number | null>(null);
  const [coaching, setCoaching] = useState<CoachLevel>(eduMode);
  const [timings, setTimings] = useState(true);
  const [restAlerts, setRestAlerts] = useState(false);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (hydrated && (!day || day.isRest)) {
      router.replace("/app");
    }
  }, [hydrated, day, router]);

  if (!hydrated || !day || day.isRest) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const exercises = day.exercises || [];

  // ── Derived data ──
  const activeExercises = exercises.filter((_, i) => !skipped.has(i));
  const defaultDuration = parseInt(day.sessionDuration) || 50;
  const currentDuration = duration ?? defaultDuration;

  // Session number
  const sessionNum = useMemo(() => {
    if (!week?.days) return "";
    let count = 0, total = 0;
    for (let i = 0; i < week.days.length; i++) {
      if (!week.days[i].isRest) { total++; if (i <= dayIdx) count++; }
    }
    return `Session ${count} of ${total}`;
  }, [week, dayIdx]);

  // Cycle phase
  const phaseInfo = useMemo(() => {
    if (!cycleType || cycleType === "na" || cycleType === "hormonal") return null;
    return getCurrentPhase(cycle.periodLog, cycle.avgLength);
  }, [cycleType, cycle]);

  // Exercise analysis
  const analysis = useMemo(() => {
    let totalSets = 0;
    let compounds = 0, isolations = 0;
    const muscleSetMap: Record<string, number> = {};
    const muscleGroups = new Set<string>();

    exercises.forEach((ex) => {
      const sets = parseInt(ex.sets) || 3;
      totalSets += sets;
      const lib = findExercise(ex.name);
      if (lib) {
        muscleGroups.add(lib.muscle);
        muscleSetMap[lib.muscle] = (muscleSetMap[lib.muscle] || 0) + sets;
        if (lib.tags.includes("Compound")) compounds++;
        else isolations++;
      }
    });

    const muscleSorted = Object.entries(muscleSetMap).sort((a, b) => b[1] - a[1]);
    const maxSets = muscleSorted[0]?.[1] || 1;
    const primaryMuscles = muscleSorted.filter(([, s]) => s >= maxSets * 0.5).map(([m]) => m);
    const secondaryMuscles = muscleSorted.filter(([, s]) => s < maxSets * 0.5).map(([m]) => m);

    return {
      totalSets, compounds, isolations, muscleSetMap,
      muscleGroups: [...muscleGroups], primaryMuscles, secondaryMuscles,
    };
  }, [exercises]);

  // Days since last session
  const daysSinceLastSession = useMemo(() => {
    const sessions = progressDB.sessions as Array<{ date?: string }>;
    const last = sessions[sessions.length - 1];
    if (!last?.date) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  }, [progressDB.sessions]);

  // Context description
  const contextDesc = useMemo(() => {
    const parts: string[] = [];
    if (phaseInfo) parts.push(phaseInfo.phase.charAt(0).toUpperCase() + phaseInfo.phase.slice(1) + " phase");
    if (injuries.length || injuryNotes) parts.push(injuries.join(", ") || "injury note");
    if (daysSinceLastSession !== null) parts.push(`${daysSinceLastSession} day${daysSinceLastSession !== 1 ? "s" : ""} rest`);
    return parts.length ? parts.join(" · ") : "No context notes";
  }, [phaseInfo, injuries, injuryNotes, daysSinceLastSession]);

  // Settings description
  const settingsDesc = useMemo(() => {
    const labels: Record<CoachLevel, string> = { full: "Full coaching", feel: "Feel only", silent: "Coaching off" };
    const parts = [labels[coaching], timings ? "timings on" : "timings off"];
    if (restAlerts) parts.push("rest alerts");
    return parts.join(" · ");
  }, [coaching, timings, restAlerts]);

  // Has changes
  const hasChanges = useMemo(() => {
    return skipped.size > 0 ||
      (duration !== null && duration !== defaultDuration) ||
      coaching !== eduMode ||
      !timings || restAlerts;
  }, [skipped, duration, defaultDuration, coaching, eduMode, timings, restAlerts]);

  // ── Actions ──
  const toggleSkip = useCallback((idx: number) => {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleSwap = useCallback((newName: string) => {
    if (swapIdx === null || !week?.days?.[dayIdx]) return;
    const updated = { ...week };
    const updatedDay = { ...updated.days[dayIdx] };
    const updatedExercises = [...updatedDay.exercises];
    updatedExercises[swapIdx] = { ...updatedExercises[swapIdx], name: newName };
    updatedDay.exercises = updatedExercises;
    updated.days[dayIdx] = updatedDay;
    useKineStore.getState().setWeekData(updated);
    setSwapIdx(null);
  }, [swapIdx, week, dayIdx]);

  const adjustDuration = useCallback((delta: number) => {
    setDuration((prev) => {
      const current = prev ?? defaultDuration;
      return Math.max(20, Math.min(90, current + delta));
    });
  }, [defaultDuration]);

  const startSession = useCallback(() => {
    // Apply settings
    if (coaching !== eduMode) setEduMode(coaching);
    if (duration !== null && duration !== defaultDuration) {
      setSessionTimeBudgets({ ...sessionTimeBudgets, [dayIdx]: duration });
    }
    setCurrentDayIdx(dayIdx);
    router.push(`/app/warmup?day=${dayIdx}`);
  }, [coaching, eduMode, setEduMode, duration, defaultDuration, dayIdx, sessionTimeBudgets, setSessionTimeBudgets, setCurrentDayIdx, router]);

  const handleStart = useCallback(() => {
    if (hasChanges) {
      setConfirmOpen(true);
    } else {
      startSession();
    }
  }, [hasChanges, startSession]);

  // ── Phase note ──
  const phaseNote = phaseInfo
    ? (PHASE_NOTES[goal || "muscle"] || PHASE_NOTES.muscle)[phaseInfo.phase]
    : null;

  // ── Day label ──
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekNum = progressDB.currentWeek || 1;

  return (
    <div className="pb-28">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-[13px] text-muted hover:text-text transition-colors mb-2.5 flex items-center gap-1.5"
      >
        ← Back to week
      </button>

      {/* Header */}
      <div className="text-[11px] tracking-[0.5px] text-muted font-light mb-1">
        {(dayNames[dayIdx] || "").toUpperCase()} — {sessionNum.toUpperCase()}
      </div>
      <h1 className="text-[clamp(20px,5.5vw,26px)] font-semibold leading-[1.15] -tracking-[0.3px] mb-0.5">
        {day.sessionTitle || "Session"}
      </h1>
      <div className="text-xs text-muted font-light mb-2">
        ~{currentDuration} min · {activeExercises.length} exercise{activeExercises.length !== 1 ? "s" : ""} · Week {weekNum}
      </div>

      {/* ── Section 0: Your notes ── */}
      <CollapsibleSection title="Your notes" description={contextDesc}>
        {/* Cycle */}
        {phaseNote && phaseInfo && (
          <div className="text-xs text-muted2 font-light leading-relaxed pb-2.5">
            You&apos;re likely in your{" "}
            <strong className="text-accent font-normal">{phaseInfo.phase} phase</strong> —{" "}
            {phaseNote.body.charAt(0).toLowerCase() + phaseNote.body.slice(1)}
          </div>
        )}
        {cycleType === null && (
          <div
            className="text-xs text-muted font-light pb-2.5 cursor-pointer"
            onClick={() => router.push("/app/profile")}
          >
            Add cycle data for smarter coaching{" "}
            <span className="text-accent text-[11px]">SET UP →</span>
          </div>
        )}

        {/* Injuries */}
        {(injuries.length > 0 || injuryNotes) && (
          <div className="flex items-start gap-2 py-2 border-t border-border">
            <span className="text-xs shrink-0 mt-px">⚠</span>
            <div className="text-xs text-muted2 font-light leading-snug">
              <strong className="text-text font-medium">{injuries.join(", ") || "Note"}</strong>
              {injuryNotes && <span> — {injuryNotes}</span>}
            </div>
          </div>
        )}

        {/* Recovery */}
        {daysSinceLastSession !== null && (
          <div className="flex items-start gap-2 py-2 border-t border-border">
            <span className="text-xs shrink-0 mt-px">💤</span>
            <div className="text-xs text-muted2 font-light leading-snug">
              <strong className="text-text font-medium">Recovery note</strong>
              <span> — {daysSinceLastSession} day{daysSinceLastSession !== 1 ? "s" : ""} since last session.</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ── Section 1: About this session ── */}
      <CollapsibleSection
        title="About this session"
        description={`${analysis.muscleGroups.join(", ")} · ${analysis.totalSets} sets`}
      >
        {/* Summary rows */}
        <div className="mb-2">
          <div className="text-xs mb-1.5 pb-1.5 border-b border-white/[0.04]">
            <strong className="font-medium text-text mr-0.5">Focus —</strong>
            <span className="text-muted2 font-light">{day.sessionTitle || analysis.muscleGroups.join(", ")}</span>
          </div>
          <div className="text-xs mb-1.5 pb-1.5 border-b border-white/[0.04]">
            <strong className="font-medium text-text mr-0.5">Structure —</strong>
            <span className="text-muted2 font-light">
              {analysis.compounds > 0 && `${analysis.compounds} compound${analysis.compounds > 1 ? "s" : ""}`}
              {analysis.compounds > 0 && analysis.isolations > 0 && " → "}
              {analysis.isolations > 0 && `${analysis.isolations} isolation`}
              . Heavy first.
            </span>
          </div>
          <div className="text-xs">
            <strong className="font-medium text-text mr-0.5">Volume —</strong>
            <span className="text-muted2 font-light">
              {analysis.totalSets} sets
              {Object.entries(analysis.muscleSetMap).length > 0 && ": "}
              {Object.entries(analysis.muscleSetMap).map(([m, s]) => `${s} ${m}`).join(", ")}
            </span>
          </div>
        </div>

        {/* Why */}
        {(day.sessionWhy || day.sessionContext) && (
          <div className="border-l-2 border-accent/30 pl-3 my-2 text-xs text-muted2 font-light leading-relaxed">
            {day.sessionWhy || day.sessionContext}
          </div>
        )}

        {/* Muscle tags */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {analysis.primaryMuscles.map((m) => (
            <span key={m} className="text-[11px] text-muted2 font-normal">
              {m.charAt(0).toUpperCase() + m.slice(1)}
              {analysis.primaryMuscles.indexOf(m) < analysis.primaryMuscles.length - 1 || analysis.secondaryMuscles.length > 0 ? " ·" : ""}
            </span>
          ))}
          {analysis.secondaryMuscles.map((m) => (
            <span key={m} className="text-[11px] text-muted font-light">
              {m.charAt(0).toUpperCase() + m.slice(1)}
              {analysis.secondaryMuscles.indexOf(m) < analysis.secondaryMuscles.length - 1 ? " ·" : ""}
            </span>
          ))}
        </div>

        {/* Duration control */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border mt-2">
          <div className="text-xs">
            Session length <span className="text-muted font-light text-[11px]">· adjusts exercises</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-[26px] h-[26px] rounded-full bg-white/[0.06] text-muted2 text-sm flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
              onClick={() => adjustDuration(-5)}
            >
              −
            </button>
            <span className="font-display text-base tracking-wider min-w-[50px] text-center">
              {currentDuration} MIN
            </span>
            <button
              className="w-[26px] h-[26px] rounded-full bg-white/[0.06] text-muted2 text-sm flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
              onClick={() => adjustDuration(5)}
            >
              +
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 2: Your exercises ── */}
      <CollapsibleSection
        title="Your exercises"
        description={`${activeExercises.length} exercise${activeExercises.length !== 1 ? "s" : ""} · review or swap`}
      >
        <div className="flex flex-col">
          {exercises.map((ex, i) => {
            const lib = findExercise(ex.name);
            const isSkipped = skipped.has(i);
            const muscleColor = MUSCLE_COLORS[lib?.muscle || ""] || "bg-muted";

            if (isSkipped) {
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1.5 px-2.5 opacity-40 border-b border-white/[0.04] last:border-b-0"
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted line-through truncate">{ex.name}</span>
                    <span className="text-[9px] tracking-wider text-accent font-display shrink-0">SKIPPED</span>
                  </div>
                  <button
                    onClick={() => toggleSkip(i)}
                    className="text-[10px] text-accent bg-accent/10 border border-accent/40 rounded px-1.5 py-0.5 shrink-0"
                  >
                    restore
                  </button>
                </div>
              );
            }

            return (
              <div
                key={i}
                className="flex items-center gap-2 py-2.5 border-b border-white/[0.04] last:border-b-0"
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${muscleColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">
                    {ex.name}
                    <span className="text-[10px] text-muted font-light ml-1">
                      · {lib?.tags.includes("Compound") ? "Compound" : "Isolation"}
                    </span>
                  </div>
                </div>
                <span className="font-display text-xs tracking-wider text-muted2 shrink-0">
                  {ex.sets}×{ex.reps}
                </span>
                <button
                  onClick={() => setSwapIdx(i)}
                  className="text-[11px] text-muted underline underline-offset-2 decoration-muted/30 hover:text-accent hover:decoration-accent transition-colors shrink-0"
                >
                  Swap
                </button>
                <button
                  onClick={() => toggleSkip(i)}
                  className="text-[10px] text-muted opacity-50 hover:opacity-100 hover:text-text transition-all shrink-0 px-1"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {skipped.size > 0 && (
          <div className="text-[11px] text-accent tracking-wider font-display mt-2">
            {skipped.size} SKIPPED · {exercises.length - skipped.size} REMAINING
          </div>
        )}
      </CollapsibleSection>

      {/* ── Section 3: Settings ── */}
      <CollapsibleSection title="Settings" description={settingsDesc}>
        {/* Coaching level */}
        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
          <div className="flex-1">
            <div className="text-xs font-medium mb-px">Coaching level</div>
            <div className="text-[10px] text-muted font-light leading-tight">Cues, tips and context during your session</div>
          </div>
          <div className="flex gap-1.5 shrink-0 ml-4">
            {(["full", "feel", "silent"] as CoachLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setCoaching(level)}
                className={`text-[11px] px-2 py-1 border-b-2 transition-all ${
                  coaching === level
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-text"
                }`}
              >
                {level === "full" ? "Full" : level === "feel" ? "Feel" : "Off"}
              </button>
            ))}
          </div>
        </div>

        {/* Timings */}
        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
          <div className="flex-1">
            <div className="text-xs font-medium mb-px">Record timings</div>
            <div className="text-[10px] text-muted font-light leading-tight">Track set durations and rest periods</div>
          </div>
          <label className="relative w-[38px] h-[22px] cursor-pointer inline-block shrink-0 ml-4">
            <input
              type="checkbox"
              checked={timings}
              onChange={(e) => setTimings(e.target.checked)}
              className="sr-only peer"
            />
            <div className="absolute inset-0 bg-white/[0.06] rounded-full transition-all peer-checked:bg-accent/20" />
            <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-muted rounded-full transition-all peer-checked:left-[19px] peer-checked:bg-accent" />
          </label>
        </div>

        {/* Rest alerts */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex-1">
            <div className="text-xs font-medium mb-px">Rest alerts</div>
            <div className="text-[10px] text-muted font-light leading-tight">Nudge when suggested rest is up</div>
          </div>
          <label className="relative w-[38px] h-[22px] cursor-pointer inline-block shrink-0 ml-4">
            <input
              type="checkbox"
              checked={restAlerts}
              onChange={(e) => setRestAlerts(e.target.checked)}
              className="sr-only peer"
            />
            <div className="absolute inset-0 bg-white/[0.06] rounded-full transition-all peer-checked:bg-accent/20" />
            <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-muted rounded-full transition-all peer-checked:left-[19px] peer-checked:bg-accent" />
          </label>
        </div>

        <div className="text-[11px] text-muted font-light leading-snug pt-2 border-t border-border mt-1">
          These are your current defaults. Change anytime in{" "}
          <span
            className="text-accent cursor-pointer hover:underline"
            onClick={() => router.push("/app/profile")}
          >
            Profile → Coaching ↗
          </span>
        </div>
      </CollapsibleSection>

      {/* Coach note */}
      {day.coachNote && (
        <div className="text-xs text-muted2 font-light italic leading-relaxed py-2.5">
          {day.coachNote}
        </div>
      )}

      {/* ── Fixed bottom: Start button ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pb-6 pt-2.5 px-4" style={{ background: "linear-gradient(transparent, var(--color-bg) 20%)" }}>
        <div className="max-w-[var(--container-max)] mx-auto">
          {/* Changes summary */}
          {hasChanges && (
            <div className="border-t border-white/[0.06] pt-2.5 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="text-[11px] font-medium text-muted2 mb-1.5">Changes from plan</div>
              {skipped.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">✕</span>
                  <span>Skipping: <span className="text-[#6a9a7a]">{[...skipped].map(i => exercises[i]?.name).join(", ")}</span></span>
                </div>
              )}
              {duration !== null && duration !== defaultDuration && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">⏱</span>
                  <span>Duration: <span className="line-through text-muted">{defaultDuration} min</span> → <span className="text-[#6a9a7a]">{duration} min</span></span>
                </div>
              )}
              {coaching !== eduMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">⚙</span>
                  <span>Coaching: <span className="line-through text-muted">{eduMode}</span> → <span className="text-[#6a9a7a]">{coaching}</span></span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStart}
            className="w-full bg-accent text-bg rounded-xl py-3.5 px-4 font-semibold text-[15px] tracking-[0.3px] transition-all hover:opacity-90 active:scale-[0.97] active:opacity-85"
          >
            Start session
          </button>

          <button
            onClick={() => router.back()}
            className="w-full py-2 text-xs text-muted mt-1"
          >
            Skip this session
          </button>
        </div>
      </div>

      {/* ── Confirm overlay ── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/75 flex items-center justify-center p-5"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-border rounded-2xl p-6 max-w-[380px] w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold -tracking-[0.2px] mb-4">Ready to go?</h3>

            <div className="text-left mb-5">
              {skipped.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-accent">✕</span>
                  <span>Skipping {[...skipped].map(i => exercises[i]?.name).join(", ")}</span>
                </div>
              )}
              {duration !== null && duration !== defaultDuration && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-[#7a8aaa]">⏱</span>
                  <span>Duration → <span className="text-[#6a9a7a]">{duration} min</span></span>
                </div>
              )}
              {coaching !== eduMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5">
                  <span className="text-[#7a8aaa]">⚙</span>
                  <span>Coaching → <span className="text-[#7a8aaa]">{coaching === "full" ? "Full" : coaching === "feel" ? "Feel only" : "Off"}</span></span>
                </div>
              )}
            </div>

            <button
              onClick={() => { setConfirmOpen(false); startSession(); }}
              className="w-full bg-accent text-bg rounded-xl py-3.5 font-semibold text-[15px] hover:opacity-90 transition-opacity"
            >
              Let&apos;s go
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="w-full py-2 text-[13px] text-muted mt-2 hover:text-text transition-colors"
            >
              Go back and adjust
            </button>
          </div>
        </div>
      )}

      {/* ── Swap sheet ── */}
      {swapIdx !== null && (
        <ExerciseSwapSheet
          open={true}
          onClose={() => setSwapIdx(null)}
          currentExercise={exercises[swapIdx].name}
          sessionTitle={day.sessionTitle}
          sessionExercises={exercises.map(e => e.name)}
          onSwap={handleSwap}
        />
      )}
    </div>
  );
}
