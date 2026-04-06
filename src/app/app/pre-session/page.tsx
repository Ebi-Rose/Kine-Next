"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { appNow, appTimestamp } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";
import { findExercise } from "@/data/exercise-library";
import { getCurrentPhase, type CyclePhase } from "@/lib/cycle";
import CollapsibleSection from "@/components/CollapsibleSection";
import { trimSessionToTime, estimateSessionTime, estimateSessionTimeWithRest } from "@/lib/time-budget";
import { EXERCISE_LIBRARY } from "@/data/exercise-library";
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
    weekData, goal, injuries, injuryNotes, conditions, cycleType, cycle,
    eduMode, setEduMode, sessionMode, setSessionMode,
    restConfig, setRestConfig,
    progressDB, sessionTimeBudgets,
    setSessionTimeBudgets, setCurrentDayIdx,
    personalProfile, setPersonalProfile,
    measurementSystem,
  } = useKineStore();

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  // ── Local state ──
  const [mounted, setMounted] = useState(false);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState<number | null>(null);
  const [coaching, setCoaching] = useState<CoachLevel>(eduMode);
  const [energy, setEnergy] = useState<"low" | "normal" | "good" | "great" | null>(null);
  const [timing, setTiming] = useState<"timed" | "stopwatch" | "off">(sessionMode);
  const [compoundRest, setCompoundRest] = useState(restConfig.compound);
  const [isolationRest, setIsolationRest] = useState(restConfig.isolation);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Wait for client-side hydration
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && week && (!day || day.isRest)) {
      router.replace("/app");
    }
  }, [mounted, week, day, router]);

  const exercises = day?.exercises || [];

  // Is this a future day that hasn't arrived yet?
  const now = appNow();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0..Sun=6
  const isFuture = dayIdx > todayIdx;

  // ── Derived data ──
  const estimatedDuration = estimateSessionTime(exercises);
  const defaultDuration = Math.ceil(estimatedDuration / 5) * 5 || 50;
  const currentDuration = duration ?? defaultDuration;

  // Compute trim result when duration is reduced
  const trimResult = useMemo(() => {
    if (duration === null || duration >= defaultDuration) return null;
    return trimSessionToTime(exercises, duration);
  }, [exercises, duration, defaultDuration]);

  // Set of exercise names removed by time trimming
  const trimmedNames = useMemo(() => {
    if (!trimResult) return new Set<string>();
    return new Set(trimResult.removedNames.map((r) => r.name));
  }, [trimResult]);

  const activeExercises = exercises.filter((_, i) => !skipped.has(i) && !trimmedNames.has(exercises[i].name));

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
    return Math.floor((appTimestamp() - new Date(last.date).getTime()) / 86400000);
  }, [progressDB.sessions]);

  // Context description
  const contextDesc = useMemo(() => {
    const parts: string[] = [];
    if (energy) {
      const labels = { low: "Low energy", normal: "Normal", good: "Feeling good", great: "Feeling great" };
      parts.push(labels[energy]);
    }
    if (phaseInfo) parts.push(phaseInfo.phase.charAt(0).toUpperCase() + phaseInfo.phase.slice(1) + " phase");
    if (conditions.length) parts.push(conditions.length + " condition" + (conditions.length > 1 ? "s" : ""));
    if (injuries.length || injuryNotes) parts.push(injuries.join(", ") || "injury note");
    if (daysSinceLastSession !== null) parts.push(`${daysSinceLastSession} day${daysSinceLastSession !== 1 ? "s" : ""} rest`);
    return parts.length ? parts.join(" · ") : "Tap to check in";
  }, [energy, phaseInfo, conditions, injuries, injuryNotes, daysSinceLastSession]);

  // Settings description
  const settingsDesc = useMemo(() => {
    const coachLabels: Record<CoachLevel, string> = { full: "Full coaching", feel: "Feel only", silent: "Coaching off" };
    const timingLabels: Record<string, string> = { timed: "Timed", stopwatch: "Stopwatch", off: "No timing" };
    return [coachLabels[coaching], timingLabels[timing]].join(" · ");
  }, [coaching, timing]);

  // Has changes
  const hasChanges = useMemo(() => {
    return skipped.size > 0 ||
      (duration !== null && duration !== defaultDuration) ||
      coaching !== eduMode ||
      timing !== sessionMode ||
      compoundRest !== restConfig.compound ||
      isolationRest !== restConfig.isolation;
  }, [skipped, duration, defaultDuration, coaching, eduMode, timing, sessionMode, compoundRest, isolationRest, restConfig]);

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

  const addExercise = useCallback((exerciseName: string) => {
    if (!week?.days?.[dayIdx]) return;
    const lib = findExercise(exerciseName);
    const newEx: import("@/lib/week-builder").Exercise = {
      name: exerciseName,
      sets: lib?.tags.includes("Compound") ? "3" : "3",
      reps: lib?.tags.includes("Compound") ? "8" : "12",
      rest: lib?.tags.includes("Compound") ? "120" : "90",
    };
    const updated = { ...week };
    const updatedDay = { ...updated.days[dayIdx] };
    updatedDay.exercises = [...updatedDay.exercises, newEx];
    updated.days[dayIdx] = updatedDay;
    useKineStore.getState().setWeekData(updated);
  }, [week, dayIdx]);

  const startSession = useCallback(() => {
    // Apply settings
    if (coaching !== eduMode) setEduMode(coaching);
    if (timing !== sessionMode) setSessionMode(timing);
    if (compoundRest !== restConfig.compound || isolationRest !== restConfig.isolation) {
      setRestConfig({ compound: compoundRest, isolation: isolationRest });
    }
    if (duration !== null && duration !== defaultDuration) {
      setSessionTimeBudgets({ ...sessionTimeBudgets, [dayIdx]: duration });
    }
    setCurrentDayIdx(dayIdx);
    // Small delay to ensure Zustand persist writes to localStorage before navigation
    setTimeout(() => {
      router.push(`/app/session?day=${dayIdx}`);
    }, 50);
  }, [coaching, eduMode, setEduMode, timing, sessionMode, setSessionMode, compoundRest, isolationRest, restConfig, setRestConfig, duration, defaultDuration, dayIdx, sessionTimeBudgets, setSessionTimeBudgets, setCurrentDayIdx, router]);

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

  // ── First session lifts prompt ──
  const isFirstSession = progressDB.sessions.length === 0 && Object.keys(personalProfile.currentLifts || {}).length === 0;
  const [showLiftPrompt, setShowLiftPrompt] = useState(isFirstSession);
  const [liftInputs, setLiftInputs] = useState<Record<string, string>>({});
  const unit = (measurementSystem || "metric") === "metric" ? "kg" : "lbs";

  function saveLiftInputs() {
    const currentLifts: Record<string, number> = { ...personalProfile.currentLifts };
    Object.entries(liftInputs).forEach(([name, val]) => {
      const num = parseFloat(val);
      if (num > 0) currentLifts[name] = num;
    });
    setPersonalProfile({ ...personalProfile, currentLifts });
    setShowLiftPrompt(false);
  }

  // ── Loading guard (after all hooks) ──
  if (!mounted || !week || !day || day.isRest) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // ── First session lift prompt popup ──
  if (showLiftPrompt && day) {
    return (
      <div className="pb-10">
        <button
          onClick={() => setShowLiftPrompt(false)}
          className="text-[13px] text-muted hover:text-text transition-colors mb-3"
        >
          ← Skip
        </button>

        <h2 className="font-display text-xl tracking-wide text-text">
          Done these before?
        </h2>
        <p className="mt-2 text-xs text-muted2 font-light leading-relaxed">
          Adding your current weights helps Kinē suggest the right starting point. Leave blank if you&apos;re not sure.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {day.exercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5">
              <span className="text-xs text-text">{ex.name}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  aria-label={`${ex.name} weight in ${unit}`}
                  value={liftInputs[ex.name] || ""}
                  onChange={(e) => setLiftInputs({ ...liftInputs, [ex.name]: e.target.value })}
                  className="w-16 rounded border border-border bg-bg px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
                />
                <span className="text-[10px] text-muted">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={saveLiftInputs}
            className="w-full rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:opacity-90"
          >
            Save and continue
          </button>
          <button
            onClick={() => setShowLiftPrompt(false)}
            className="text-xs text-muted2 hover:text-text transition-colors text-center"
          >
            I&apos;ll figure it out as I go
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-[13px] text-muted hover:text-text transition-colors mb-3 flex items-center gap-1.5"
      >
        ← Back
      </button>

      {/* Hero header card */}
      <div
        className="rounded-2xl p-5 mb-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(196,144,152,0.12) 0%, rgba(196,144,152,0.04) 50%, var(--color-surface) 100%)",
          border: "1px solid rgba(196,144,152,0.15)",
        }}
      >
        <div className="text-[10px] tracking-[0.5px] text-accent/70 font-light mb-1.5 uppercase">
          {(dayNames[dayIdx] || "")} — {sessionNum}
        </div>
        <h1 className="font-display text-[clamp(22px,6vw,30px)] tracking-wide text-text leading-[1.1] mb-1">
          {day.sessionTitle || "Session"}
        </h1>
        <div className="flex items-center gap-2 text-[11px] text-muted2 font-light">
          <span>~{estimateSessionTime(activeExercises)} min{trimmedNames.size > 0 && <> <span className="text-muted">(was ~{estimateSessionTime(exercises)} min)</span></>}</span>
          <span className="text-border">·</span>
          <span>{activeExercises.length} exercise{activeExercises.length !== 1 ? "s" : ""}</span>
          <span className="text-border">·</span>
          <span>Week {weekNum}</span>
        </div>
        {phaseInfo && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] text-accent/80 font-light">
              {phaseInfo.phase.charAt(0).toUpperCase() + phaseInfo.phase.slice(1)} phase · Day {phaseInfo.day}
            </span>
          </div>
        )}
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      </div>

      {/* ── Last session's changes ── */}
      {(() => {
        const sessions = progressDB.sessions as import("@/store/useKineStore").SessionRecord[];
        const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
        if (!lastSession?.changes?.length) return null;
        return (
          <div className="mb-4 rounded-xl border border-white/[0.06] bg-surface/50 p-4">
            <p className="text-[8px] tracking-widest text-accent/60 uppercase mb-2">From last session</p>
            <div className="flex flex-col gap-1.5">
              {lastSession.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs shrink-0 mt-0.5">{c.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-text">{c.title}</p>
                    <p className="text-[10px] text-muted2 font-light">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Section 0: Your notes ── */}
      <CollapsibleSection title="Your notes" description={contextDesc}>
        {/* Energy check-in */}
        <div className="pb-3 mb-1">
          <div className="text-xs font-medium mb-2">How are you feeling?</div>
          <div className="flex gap-2">
            {(["low", "normal", "good", "great"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setEnergy(energy === level ? null : level)}
                className={`flex-1 text-[11px] py-2 rounded-lg border transition-all ${
                  energy === level
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/[0.06] bg-white/[0.03] text-muted hover:text-text hover:border-white/[0.12]"
                }`}
              >
                {level === "low" ? "Low" : level === "normal" ? "Normal" : level === "good" ? "Good" : "Great"}
              </button>
            ))}
          </div>
          {energy === "low" && (
            <p className="text-[10px] text-muted2 font-light mt-2 leading-relaxed">
              Lighter effort is still progress. Drop a set or two if you need to — consistency beats intensity.
            </p>
          )}
          {energy === "great" && (
            <p className="text-[10px] text-muted2 font-light mt-2 leading-relaxed">
              Good window to push if it feels right. Trust the energy.
            </p>
          )}
        </div>

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

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="flex items-start gap-2 py-2 border-t border-border">
            <span className="text-xs shrink-0 mt-px">ℹ</span>
            <div className="text-xs text-muted2 font-light leading-snug">
              <strong className="text-text font-medium">{conditions.map(c => {
                const labels: Record<string, string> = { pcos: "PCOS", fibroids: "Fibroids", endometriosis: "Endometriosis", pelvic_floor: "Pelvic floor" };
                return labels[c] || c;
              }).join(", ")}</strong>
              <span> — programme adapted</span>
            </div>
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
        <div className="pt-2.5 border-t border-border mt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              Session length
              <span className="text-muted font-light text-[11px]">
                {" "}· ~{estimateSessionTime(activeExercises)} min estimated
                {currentDuration !== defaultDuration && <> / {currentDuration} min target</>}
              </span>
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
          {/* Duration change context */}
          {duration !== null && duration !== defaultDuration && (() => {
            return (
              <div className="mt-2 animate-fade-up">
                {duration < defaultDuration ? (
                  trimResult && trimResult.removedNames.length > 0 ? (
                    <div className="text-[10px] leading-snug">
                      <span className="text-accent/80 font-display tracking-wider">TRIMMED TO ~{duration} MIN</span>
                      <p className="text-muted2 font-light mt-1">
                        {trimResult.removedNames.length} exercise{trimResult.removedNames.length !== 1 ? "s" : ""} removed — see list below.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted2 font-light">
                      Session fits {duration} min — nothing cut.
                    </p>
                  )
                ) : (() => {
                  // Check if there's significant extra time beyond the full programme
                  const fullTime = estimateSessionTime(exercises);
                  const extraMin = duration - fullTime;

                  if (extraMin >= 8) {
                    // Suggest additional exercises that fit the session focus
                    const sessionMuscles = analysis.muscleGroups;
                    const existingNames = new Set(exercises.map(e => e.name.toLowerCase()));
                    const suggestions = (EXERCISE_LIBRARY || [])
                      .filter(ex => {
                        if (existingNames.has(ex.name.toLowerCase())) return false;
                        if (!ex.equip.some(e => useKineStore.getState().equip.includes(e))) return false;
                        if (!sessionMuscles.includes(ex.muscle)) return false;
                        return true;
                      })
                      .slice(0, 3);

                    return (
                      <div className="text-[10px] leading-snug">
                        <span className="text-accent/80 font-display tracking-wider">~{extraMin} MIN SPARE</span>
                        <p className="text-muted2 font-light mt-1">
                          Full programme loaded.
                          {suggestions.length > 0 && <> Tap to add:</>}
                        </p>
                        {suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {suggestions.map((s) => (
                              <button
                                key={s.name}
                                onClick={() => addExercise(s.name)}
                                className="text-[11px] text-accent bg-accent/10 border border-accent/30 rounded-lg px-2.5 py-1.5 hover:bg-accent/20 active:scale-[0.97] transition-all"
                              >
                                + {s.name} <span className="text-accent/60 font-light">({s.muscle})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="text-[10px] leading-snug">
                      <span className="text-accent/80 font-display tracking-wider">EXTENDED TO ~{duration} MIN</span>
                      <p className="text-muted2 font-light mt-1">
                        More time for rest between heavy sets and additional volume.
                      </p>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
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
            const isTrimmed = trimmedNames.has(ex.name);
            const trimInfo = trimResult?.removedNames.find((r) => r.name === ex.name);
            const muscleColor = MUSCLE_COLORS[lib?.muscle || ""] || "bg-muted";

            if (isTrimmed) {
              return (
                <div
                  key={i}
                  className="py-2 px-3 mb-1.5 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted line-through truncate flex-1">{ex.name}</span>
                    <span className="text-[9px] tracking-wider text-red-400/80 font-display shrink-0">REMOVED</span>
                    <button
                      onClick={() => setDuration(null)}
                      className="text-[10px] text-accent bg-accent/10 border border-accent/40 rounded px-1.5 py-0.5 shrink-0"
                    >
                      restore
                    </button>
                  </div>
                  <div className="text-[10px] text-muted font-light mt-0.5">
                    {trimInfo?.isIsolation
                      ? "Isolation cut first to protect compounds"
                      : "Cut to fit time budget — compounds trimmed after isolations"}
                  </div>
                </div>
              );
            }

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

            // Colour map for left borders
            const borderColors: Record<string, string> = {
              push: "border-l-cat-push", pull: "border-l-cat-pull",
              legs: "border-l-cat-legs", hinge: "border-l-cat-hinge",
              core: "border-l-cat-core", cardio: "border-l-cat-cardio",
            };
            const bgColors: Record<string, string> = {
              push: "bg-cat-push/[0.05]", pull: "bg-cat-pull/[0.05]",
              legs: "bg-cat-legs/[0.05]", hinge: "bg-cat-hinge/[0.05]",
              core: "bg-cat-core/[0.05]", cardio: "bg-cat-cardio/[0.05]",
            };
            const labelColors: Record<string, string> = {
              push: "text-cat-push", pull: "text-cat-pull",
              legs: "text-cat-legs", hinge: "text-cat-hinge",
              core: "text-cat-core", cardio: "text-cat-cardio",
            };
            const muscle = lib?.muscle || "";
            const borderColor = borderColors[muscle] || "border-l-muted";
            const bgColor = bgColors[muscle] || "";
            const labelColor = labelColors[muscle] || "text-muted";

            return (
              <div
                key={i}
                className={`flex items-center gap-3 py-2.5 px-3 mb-1.5 rounded-lg border-l-[3px] ${borderColor} ${bgColor}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate text-text">
                    {ex.name}
                  </div>
                  <div className={`text-[9px] tracking-wider uppercase font-light ${labelColor}`}>
                    {muscle.toUpperCase()} · {lib?.tags.includes("Compound") ? "Compound" : "Isolation"}
                  </div>
                </div>
                <span className="font-display text-[13px] tracking-wider text-muted2 shrink-0">
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

        {(skipped.size > 0 || trimmedNames.size > 0) && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-accent tracking-wider font-display">
              {trimmedNames.size > 0 && <>{trimmedNames.size} CUT FOR TIME</>}
              {trimmedNames.size > 0 && skipped.size > 0 && <> · </>}
              {skipped.size > 0 && <>{skipped.size} SKIPPED</>}
              {" "}· {activeExercises.length} REMAINING
            </div>
            {trimmedNames.size > 0 && (
              <button
                onClick={() => setDuration(null)}
                className="text-[10px] text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors"
              >
                Restore all
              </button>
            )}
          </div>
        )}

        {/* Add exercise */}
        <AddExerciseRow
          sessionMuscles={analysis.muscleGroups}
          existingNames={exercises.map(e => e.name)}
          onAdd={addExercise}
        />
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

        {/* Session timing */}
        <div className="py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs font-medium mb-px">Session timing</div>
              <div className="text-[10px] text-muted font-light leading-tight">
                {timing === "timed" ? "Rest countdown after each set" : timing === "stopwatch" ? "Running clock, self-paced rest" : "No timers"}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-4">
              {(["timed", "stopwatch", "off"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setTiming(level)}
                  className={`text-[11px] px-2 py-1 border-b-2 transition-all ${
                    timing === level
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {level === "timed" ? "Timed" : level === "stopwatch" ? "Stopwatch" : "Off"}
                </button>
              ))}
            </div>
          </div>

          {/* Rest config — timed mode only */}
          {timing === "timed" && (
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Compound rest */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-muted2 font-light">Compounds</span>
                <div className="flex items-center gap-2">
                  <button
                    className="w-[24px] h-[24px] rounded-full bg-white/[0.06] text-muted2 text-xs flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
                    onClick={() => setCompoundRest(Math.max(30, compoundRest - 15))}
                  >−</button>
                  <span className="font-display text-[13px] tracking-wider min-w-[40px] text-center">
                    {Math.floor(compoundRest / 60)}:{String(compoundRest % 60).padStart(2, "0")}
                  </span>
                  <button
                    className="w-[24px] h-[24px] rounded-full bg-white/[0.06] text-muted2 text-xs flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
                    onClick={() => setCompoundRest(Math.min(300, compoundRest + 15))}
                  >+</button>
                </div>
              </div>

              {/* Isolation rest */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-muted2 font-light">Isolations</span>
                <div className="flex items-center gap-2">
                  <button
                    className="w-[24px] h-[24px] rounded-full bg-white/[0.06] text-muted2 text-xs flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
                    onClick={() => setIsolationRest(Math.max(30, isolationRest - 15))}
                  >−</button>
                  <span className="font-display text-[13px] tracking-wider min-w-[40px] text-center">
                    {Math.floor(isolationRest / 60)}:{String(isolationRest % 60).padStart(2, "0")}
                  </span>
                  <button
                    className="w-[24px] h-[24px] rounded-full bg-white/[0.06] text-muted2 text-xs flex items-center justify-center hover:bg-accent/15 hover:text-accent transition-all"
                    onClick={() => setIsolationRest(Math.min(300, isolationRest + 15))}
                  >+</button>
                </div>
              </div>

              {/* Time impact estimate */}
              <div className="text-[10px] text-muted font-light mt-1.5 pt-1.5 border-t border-white/[0.04]">
                ~{estimateSessionTimeWithRest(activeExercises, compoundRest, isolationRest)} min with rest
                {currentDuration > 0 && (
                  <span>
                    {" "}· {estimateSessionTimeWithRest(activeExercises, compoundRest, isolationRest) <= currentDuration
                      ? <span className="text-accent/70">fits your {currentDuration} min budget</span>
                      : <span className="text-[#c49098]/70">exceeds your {currentDuration} min budget</span>
                    }
                  </span>
                )}
              </div>
            </div>
          )}
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
              {trimmedNames.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">✕</span>
                  <span>Cut for time: <span className="text-red-400/80">{[...trimmedNames].join(", ")}</span></span>
                </div>
              )}
              {skipped.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">✕</span>
                  <span>Skipping: <span className="text-[#6a9a7a]">{[...skipped].map(i => exercises[i]?.name).join(", ")}</span></span>
                </div>
              )}
              {duration !== null && duration !== defaultDuration && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">⏱</span>
                  <span>Duration: <span className="line-through text-muted">{defaultDuration} min</span> → <span className="text-[#6a9a7a]">{duration} min</span> <span className="text-muted">(~{estimateSessionTime(activeExercises)} min estimated)</span></span>
                </div>
              )}
              {coaching !== eduMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">⚙</span>
                  <span>Coaching: <span className="line-through text-muted">{eduMode}</span> → <span className="text-[#6a9a7a]">{coaching}</span></span>
                </div>
              )}
              {timing !== sessionMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                  <span className="text-xs shrink-0">⏱</span>
                  <span>Timing: <span className="line-through text-muted">{sessionMode}</span> → <span className="text-[#6a9a7a]">{timing}</span></span>
                </div>
              )}
              {(compoundRest !== restConfig.compound || isolationRest !== restConfig.isolation) && (() => {
                const oldTime = estimateSessionTimeWithRest(activeExercises, restConfig.compound, restConfig.isolation);
                const newTime = estimateSessionTimeWithRest(activeExercises, compoundRest, isolationRest);
                const diff = newTime - oldTime;
                return (
                  <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1">
                    <span className="text-xs shrink-0">⏱</span>
                    <span>
                      Rest adjusted{" "}
                      <span className={diff > 0 ? "text-[#c49098]/70" : "text-[#6a9a7a]"}>
                        {diff > 0 ? "+" : ""}{diff} min
                      </span>
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {isFuture ? (
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-text mb-1">This session hasn&apos;t arrived yet</p>
              <p className="text-[10px] text-muted2 font-light leading-relaxed">
                You can review and edit exercises above, but you&apos;ll need to wait until the day arrives to start training.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
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
              {trimmedNames.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-red-400/80">✕</span>
                  <span>Cut for time: <span className="text-red-400/80">{[...trimmedNames].join(", ")}</span></span>
                </div>
              )}
              {skipped.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-accent">✕</span>
                  <span>Skipping {[...skipped].map(i => exercises[i]?.name).join(", ")}</span>
                </div>
              )}
              {duration !== null && duration !== defaultDuration && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-[#7a8aaa]">⏱</span>
                  <span>Duration → <span className="text-[#6a9a7a]">{duration} min</span> <span className="text-muted">(~{estimateSessionTime(activeExercises)} min estimated)</span></span>
                </div>
              )}
              {coaching !== eduMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-[#7a8aaa]">⚙</span>
                  <span>Coaching → <span className="text-[#7a8aaa]">{coaching === "full" ? "Full" : coaching === "feel" ? "Feel only" : "Off"}</span></span>
                </div>
              )}
              {timing !== sessionMode && (
                <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5 border-b border-border">
                  <span className="text-[#7a8aaa]">⏱</span>
                  <span>Timing → <span className="text-[#7a8aaa]">{timing === "timed" ? "Timed" : timing === "stopwatch" ? "Stopwatch" : "Off"}</span></span>
                </div>
              )}
              {(compoundRest !== restConfig.compound || isolationRest !== restConfig.isolation) && (() => {
                const oldTime = estimateSessionTimeWithRest(activeExercises, restConfig.compound, restConfig.isolation);
                const newTime = estimateSessionTimeWithRest(activeExercises, compoundRest, isolationRest);
                const diff = newTime - oldTime;
                return (
                  <div className="flex items-center gap-2 text-xs text-muted2 font-light py-1.5">
                    <span className="text-[#7a8aaa]">⏱</span>
                    <span>Rest adjusted <span className={diff > 0 ? "text-[#c49098]/70" : "text-[#6a9a7a]"}>{diff > 0 ? "+" : ""}{diff} min</span></span>
                  </div>
                );
              })()}
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

// ── Add Exercise Row ──

function AddExerciseRow({
  sessionMuscles,
  existingNames,
  onAdd,
}: {
  sessionMuscles: string[];
  existingNames: string[];
  onAdd: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const equip = useKineStore((s) => s.equip);
  const lifts = useKineStore((s) => s.progressDB.lifts);
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));

  const suggestions = useMemo(() => {
    return (EXERCISE_LIBRARY || [])
      .filter((ex) => {
        if (existing.has(ex.name.toLowerCase())) return false;
        if (!ex.equip.some((e) => equip.includes(e))) return false;
        if (!sessionMuscles.includes(ex.muscle)) return false;
        return true;
      })
      .slice(0, 6);
  }, [equip, sessionMuscles, existing]);

  // Check if exercise fits session (same muscle group = good fit)
  function getFitLabel(ex: typeof EXERCISE_LIBRARY[number]): string | null {
    if (sessionMuscles.includes(ex.muscle)) return null; // good fit, no warning
    return `Different focus (${ex.muscle})`;
  }

  // Get last performed info
  function getLastPerformed(name: string): string | null {
    const history = (lifts as Record<string, { date: string; weight: number; reps: number }[]>)[name];
    if (!history || history.length === 0) return null;
    const last = history[history.length - 1];
    return `Last: ${last.weight}×${last.reps}`;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full text-[11px] text-accent border border-accent/20 rounded-lg py-2 hover:bg-accent/5 transition-all"
      >
        + Add exercise
      </button>
    );
  }

  return (
    <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted2 font-medium">Add to session</span>
        <button onClick={() => setOpen(false)} className="text-[10px] text-muted hover:text-text">
          close
        </button>
      </div>
      <p className="text-[10px] text-muted font-light mb-2">
        Showing exercises that match this session&apos;s focus and your equipment.
      </p>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((s) => {
          const fitWarning = getFitLabel(s);
          const lastInfo = getLastPerformed(s.name);
          return (
            <button
              key={s.name}
              onClick={() => { onAdd(s.name); setOpen(false); }}
              className="flex items-center justify-between text-left text-[11px] text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 hover:bg-accent/20 active:scale-[0.97] transition-all"
            >
              <div>
                <span>+ {s.name}</span>
                <span className="text-accent/50 font-light ml-1">({s.muscle} · {s.tags.includes("Compound") ? "compound" : "isolation"})</span>
                {lastInfo && <span className="block text-[9px] text-muted2 mt-0.5">{lastInfo}</span>}
              </div>
              {fitWarning && <span className="text-[9px] text-muted shrink-0 ml-2">{fitWarning}</span>}
            </button>
          );
        })}
        {suggestions.length === 0 && (
          <p className="text-[10px] text-muted2">No matching exercises available</p>
        )}
      </div>
    </div>
  );
}
