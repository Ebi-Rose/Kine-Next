"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { appNow, appTodayISO } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";
import { analyseSession } from "@/lib/session-analysis";
import type { AnalysisResult } from "@/lib/session-analysis";
import { apiFetchStreaming } from "@/lib/api";
import { findExercise, EXERCISE_LIBRARY } from "@/data/exercise-library";
import { buildWarmup } from "@/lib/warmup-engine";
import { trimSessionToTime, estimateSessionTime } from "@/lib/time-budget";
import { toast } from "@/components/Toast";
import Button from "@/components/Button";
import MuscleDiagram from "@/components/MuscleDiagram";
import ExerciseSwapSheet from "@/components/ExerciseSwapSheet";
import ExerciseEduSheet from "@/components/ExerciseEduSheet";
import VideoSheet from "@/components/VideoSheet";
import SkillPathSheet from "@/components/SkillPathSheet";
import SessionTimer from "@/components/SessionTimer";

import type { ExerciseLog, SessionStep } from "./types";
import { detectPRs } from "./detect-prs";
import ExerciseCard from "./ExerciseCard";
import FeedbackScreen from "./FeedbackScreen";
import AnalysisScreen from "./AnalysisScreen";
import SessionSummarySheet from "./SessionSummarySheet";
import WarmupSection from "./WarmupSection";

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const { weekData, sessionLogs, setSessionLogs, feedbackState, setFeedbackState, progressDB, sessionTimeBudgets, eduMode, sessionMode, restConfig, injuries, conditions, comfortFlags, exp, skillPreferences, setSkillPreferences } =
    useKineStore();
  // Store is ready if goal exists (set during onboarding)
  const hydrated = useKineStore((s) => s.goal !== null);

  const [logs, setLogs] = useState<Record<number, ExerciseLog>>({});
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [sessionStep, setSessionStep] = useState<SessionStep>("workout");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionStartTime] = useState(() => appNow().toISOString());
  const [swapSheetIdx, setSwapSheetIdx] = useState<number | null>(null);
  const [eduSheetIdx, setEduSheetIdx] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sessionPRs, setSessionPRs] = useState<{ name: string; weight: number; reps: number }[]>([]);
  const [videoSheetEx, setVideoSheetEx] = useState<string | null>(null);
  const [skillPathEx, setSkillPathEx] = useState<string | null>(null);
  const [restActive, setRestActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(restConfig.compound);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  // Apply time budget trimming to exercises
  const trimResult = (() => {
    if (!day || day.isRest) return null;
    const budget = sessionTimeBudgets[dayIdx];
    if (budget && budget < estimateSessionTime(day.exercises)) {
      return trimSessionToTime(day.exercises, budget);
    }
    return null;
  })();
  const effectiveExercises = trimResult?.exercises ?? (day?.exercises || []);

  // Initialize logs from exercises (using time-budget-trimmed list)
  // Pre-fills weight from last session history when available
  useEffect(() => {
    if (!day || day.isRest || effectiveExercises.length === 0) return;
    const lifts = progressDB.lifts;
    const system = useKineStore.getState().measurementSystem || "metric";
    const initial: Record<number, ExerciseLog> = {};
    effectiveExercises.forEach((ex, i) => {
      const numSets = parseInt(ex.sets) || 3;
      const history = lifts[ex.name];
      const lastLift = history && history.length > 0 ? history[history.length - 1] : null;
      // Convert stored kg to display unit
      const prefillWeight = lastLift?.weight
        ? String(system === "imperial" ? Math.round(lastLift.weight * 2.205 * 2) / 2 : lastLift.weight)
        : "";
      initial[i] = {
        name: ex.name,
        planned: { sets: ex.sets, reps: ex.reps },
        actual: Array.from({ length: numSets }, () => {
          const repMatch = ex.reps?.match(/^(\d+)/);
          return { reps: repMatch ? repMatch[1] : "", weight: prefillWeight };
        }),
        note: "",
        saved: false,
        prefilled: !!prefillWeight,
      };
    });
    setLogs(initial);
  }, [day, effectiveExercises.length]);

  // ── Auto-save logs to localStorage every 30s to prevent data loss on crash ──
  const AUTOSAVE_KEY = `kine_session_draft_${dayIdx}`;

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as Record<number, ExerciseLog>;
        // Only restore if we have matching exercises and no data yet
        const hasExistingData = Object.values(logs).some((l) => l.actual.some((s) => s.reps || s.weight));
        if (!hasExistingData && Object.keys(parsed).length > 0) {
          setLogs(parsed);
          toast("Restored your previous session draft", "success");
        }
      }
    } catch { /* ignore corrupt drafts */ }
  }, [AUTOSAVE_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic auto-save
  useEffect(() => {
    if (sessionStep !== "workout") return;
    const interval = setInterval(() => {
      try {
        const hasData = Object.values(logs).some((l) => l.actual.some((s) => s.reps || s.weight));
        if (hasData) localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(logs));
      } catch { /* quota exceeded — silent */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, [logs, sessionStep, AUTOSAVE_KEY]);

  // Clear draft when session completes
  useEffect(() => {
    if (sessionStep === "feedback" || sessionStep === "results") {
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
    }
  }, [sessionStep, AUTOSAVE_KEY]);

  // ── Multi-tab detection ──
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("kine_session");
    channel.postMessage({ type: "session_active", dayIdx });
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "session_active") {
        toast("Session is open in another tab — data may not sync correctly", "error");
      }
    };
    channel.addEventListener("message", handler);
    return () => { channel.removeEventListener("message", handler); channel.close(); };
  }, [dayIdx]);

  const updateSet = useCallback(
    (exIdx: number, setIdx: number, field: "reps" | "weight", val: string) => {
      setLogs((prev) => {
        const updated = { ...prev };
        const ex = { ...updated[exIdx] };
        const sets = [...ex.actual];
        const prevVal = sets[setIdx][field];
        sets[setIdx] = { ...sets[setIdx], [field]: val };
        // Auto-fill subsequent sets: copy if empty or still matching the old value
        if (setIdx === 0 && val) {
          sets.forEach((s, i) => {
            if (i > 0 && (!s[field] || s[field] === prevVal)) {
              sets[i] = { ...s, [field]: val };
            }
          });
        }
        ex.actual = sets;
        updated[exIdx] = ex;
        return updated;
      });
    },
    []
  );

  const updateNote = useCallback((exIdx: number, note: string) => {
    setLogs((prev) => ({ ...prev, [exIdx]: { ...prev[exIdx], note } }));
  }, []);

  const saveExercise = useCallback((exIdx: number) => {
    setLogs((prev) => {
      const ex = prev[exIdx];
      const hasData = ex.actual.some((s) => s.reps || s.weight);
      if (!hasData) {
        toast("Log at least one set before saving", "error");
        return prev;
      }
      // Stamp each logged set with wall-clock time (intentionally real time)
      const stamped = ex.actual.map((s) =>
        (s.reps || s.weight) && !s.timestamp
          ? { ...s, timestamp: new Date().toISOString() } // eslint-disable-line no-restricted-syntax
          : s
      );
      return { ...prev, [exIdx]: { ...ex, actual: stamped, saved: true } };
    });

    // Trigger rest timer in timed mode
    if (sessionMode === "timed") {
      const exName = effectiveExercises[exIdx]?.name;
      const lib = exName ? findExercise(exName) : null;
      const isIso = lib?.tags.includes("Isolation");
      setCurrentRestDuration(isIso ? restConfig.isolation : restConfig.compound);
      setRestActive(true);
    }
  }, [sessionMode, restConfig, effectiveExercises]);

  const unskipExercise = useCallback((exIdx: number) => {
    const ex = effectiveExercises[exIdx];
    if (!ex) return;
    const numSets = parseInt(ex.sets) || 3;
    setLogs((prev) => ({
      ...prev,
      [exIdx]: {
        ...prev[exIdx],
        saved: false,
        actual: Array.from({ length: numSets }, () => ({ reps: "", weight: "" })),
      },
    }));
    setExpandedEx(exIdx);
  }, [effectiveExercises]);

  const skipExercise = useCallback((exIdx: number) => {
    setLogs((prev) => ({
      ...prev,
      [exIdx]: { ...prev[exIdx], saved: true, actual: [] },
    }));
    setExpandedEx((prev) => {
      const nextIdx = (exIdx + 1);
      return logs[nextIdx] ? nextIdx : prev;
    });
  }, [logs]);

  const addExerciseToSession = useCallback((exerciseName: string) => {
    if (!week?.days?.[dayIdx]) return;
    const lib = findExercise(exerciseName);
    const newEx: import("@/lib/week-builder").Exercise = {
      name: exerciseName,
      sets: lib?.tags.includes("Compound") ? "3" : "3",
      reps: lib?.tags.includes("Compound") ? "8" : "12",
      rest: lib?.tags.includes("Compound") ? "120" : "90",
    };
    const store = useKineStore.getState();
    const updatedWeek = { ...week! };
    const updatedDays = [...updatedWeek.days];
    const updatedDay = { ...updatedDays[dayIdx] };
    updatedDay.exercises = [...updatedDay.exercises, newEx];
    updatedDays[dayIdx] = updatedDay;
    updatedWeek.days = updatedDays;
    store.setWeekData(updatedWeek);

    // Add log entry for the new exercise
    const newIdx = effectiveExercises.length;
    const numSets = parseInt(newEx.sets) || 3;
    const repMatch = newEx.reps?.match(/^(\d+)/);
    setLogs((prev) => ({
      ...prev,
      [newIdx]: {
        name: exerciseName,
        planned: { sets: newEx.sets, reps: newEx.reps },
        actual: Array.from({ length: numSets }, () => ({
          reps: repMatch ? repMatch[1] : "",
          weight: "",
        })),
        note: "",
        saved: false,
      },
    }));
    setExpandedEx(newIdx);
    setShowAddExercise(false);
    toast(`Added ${exerciseName}`, "success");
  }, [week, dayIdx, effectiveExercises.length]);

  // ── Complete Session ──
  function completeSession() {
    const incomplete: string[] = [];
    Object.entries(logs).forEach(([idx, ex]) => {
      const isSkipped = ex.saved && ex.actual.length === 0;
      if (isSkipped) return;

      const exInfo = findExercise(ex.name);
      const logType = exInfo?.logType || "weighted";
      const isWeighted = logType === "weighted" || logType === "weighted_unilateral";

      const hasValidSet = ex.actual.some((s) =>
        isWeighted ? (s.reps && s.weight) : !!s.reps
      );

      if (!hasValidSet) {
        incomplete.push(ex.name);
      }
    });

    if (incomplete.length > 0) {
      const names = incomplete.length <= 3
        ? incomplete.join(", ")
        : `${incomplete.slice(0, 2).join(", ")} +${incomplete.length - 2} more`;
      toast(`Log or skip: ${names}`, "error");
      const firstIdx = Object.entries(logs).find(([, ex]) => {
        const isSkipped = ex.saved && ex.actual.length === 0;
        const hasData = ex.actual.some((s) => s.reps || s.weight);
        return !isSkipped && !hasData;
      });
      if (firstIdx) setExpandedEx(Number(firstIdx[0]));
      return;
    }

    setShowConfirm(true);
  }

  function confirmComplete() {
    setShowConfirm(false);
    setSessionLogs(logs as unknown as typeof sessionLogs);
    setSessionStep("feedback");
  }

  // ── Submit Feedback + Analysis ──
  async function submitFeedback(effort: number, soreness: number) {
    setFeedbackState({
      effort,
      soreness,
      tsDay: appNow().toLocaleDateString(undefined, { weekday: "long" }),
      tsTime: appNow().getHours() < 12 ? "morning" : appNow().getHours() < 17 ? "afternoon" : "evening",
      sessionStartTime,
    });

    // Detect PRs
    const prs = detectPRs(logs);
    setSessionPRs(prs);

    // Save session
    const store = useKineStore.getState();

    if (prs.length > 0) {
      const unit = store.measurementSystem === "imperial" ? "lbs" : "kg";
      prs.forEach((pr) => toast(`PR: ${pr.name} — ${pr.weight}${unit} × ${pr.reps}`, "success"));
    }
    const sessionRecord = {
      dayIdx,
      date: appTodayISO(),
      weekNum: store.progressDB.currentWeek,
      title: day?.sessionTitle || "",
      logs,
      effort,
      soreness,
      prs,
    };

    // Extract lift records
    const updatedLifts = { ...store.progressDB.lifts };
    Object.values(logs).forEach((ex) => {
      const bestSet = ex.actual.reduce(
        (best, s) => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (w * r > (best.w * best.r)) return { w, r };
          return best;
        },
        { w: 0, r: 0 }
      );
      if (bestSet.w > 0) {
        if (!updatedLifts[ex.name]) updatedLifts[ex.name] = [];
        updatedLifts[ex.name].push({
          date: appTodayISO(),
          weight: bestSet.w,
          reps: bestSet.r,
        });
      }
    });

    store.setProgressDB({
      ...store.progressDB,
      sessions: [...store.progressDB.sessions, sessionRecord],
      lifts: updatedLifts,
    });

    // Run AI analysis
    setSessionStep("analysing");
    const result = await analyseSession(logs, day?.sessionTitle || "", effort, soreness);
    setAnalysis(result);

    // Persist analysis changes to the saved session record
    if (result?.changes?.length) {
      const latestStore = useKineStore.getState();
      const sessions = [...latestStore.progressDB.sessions] as import("@/store/useKineStore").SessionRecord[];
      if (sessions.length > 0) {
        sessions[sessions.length - 1] = { ...sessions[sessions.length - 1], changes: result.changes };
        latestStore.setProgressDB({ ...latestStore.progressDB, sessions });
      }
    }

    setSessionStep("results");
  }

  // ── Render ──
  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!week || !day || dayIdx < 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-muted2">No session found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/app")}>
          Back to week
        </Button>
      </div>
    );
  }

  if (day.isRest) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="font-display text-2xl text-text">Rest Day</h2>
        <p className="mt-2 text-sm text-muted2">Recovery is training.</p>
        <Button variant="secondary" className="mt-6" onClick={() => router.push("/app")}>
          Back to week
        </Button>
      </div>
    );
  }

  if (sessionStep === "feedback") {
    return <FeedbackScreen onSubmit={submitFeedback} />;
  }

  if (sessionStep === "analysing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-muted2 animate-pulse">Analysing your session...</p>
      </div>
    );
  }

  if (sessionStep === "results") {
    return (
      <AnalysisScreen
        analysis={analysis}
        prs={sessionPRs}
        onDone={() => {
          setSessionLogs({});
          setFeedbackState({ effort: null, soreness: null, tsDay: null, tsTime: null, sessionStartTime: null });
          router.push("/app");
        }}
      />
    );
  }

  const warmup = buildWarmup(day.sessionTitle, effectiveExercises, injuries, exp || "developing", conditions, comfortFlags);
  const timeBudget = sessionTimeBudgets[dayIdx];
  const isTrimmed = timeBudget && effectiveExercises.length < day.exercises.length;

  return (
    <div>
      {/* Session Timer */}
      <SessionTimer
        mode={sessionMode}
        restDuration={currentRestDuration}
        restActive={restActive}
        onRestDismiss={() => setRestActive(false)}
      />

      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </button>
        <h1 className="mt-2 font-display text-2xl tracking-wide text-text">{day.sessionTitle}</h1>
        {day.coachNote && <p className="mt-1 text-xs text-muted2">{day.coachNote}</p>}
        <p className="mt-1 text-[10px] text-muted">
          {isTrimmed ? `~${timeBudget} min (trimmed)` : day.sessionDuration} · {effectiveExercises.length} exercises
        </p>
      </div>

      {/* Set notation education — first encounter, not in silent mode */}
      {eduMode !== "silent" && !useKineStore.getState().eduFlags.seen_set_notation && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] text-accent font-display tracking-wider mb-2">TRAINING SHORTHAND</p>
          <div className="flex flex-col gap-1 text-[11px]">
            <div><span className="text-text font-medium">3×8</span> <span className="text-muted2 font-light">— 3 sets of 8 reps</span></div>
            <div><span className="text-text font-medium">3×8-10</span> <span className="text-muted2 font-light">— start at 8, add weight when you hit 10 for all sets</span></div>
            <div><span className="text-text font-medium">RPE 7</span> <span className="text-muted2 font-light">— could have done 3 more reps</span></div>
            <div><span className="text-text font-medium">RIR 2</span> <span className="text-muted2 font-light">— stopped 2 reps short of failure</span></div>
          </div>
          <button
            onClick={() => {
              const store = useKineStore.getState();
              store.setGoal(store.goal); // trigger re-render
              const flags = { ...store.eduFlags, seen_set_notation: true };
              useKineStore.setState({ eduFlags: flags } as Partial<typeof store>);
            }}
            className="mt-2 text-[10px] text-accent hover:underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Time budget notice */}
      {isTrimmed && (
        <div className="mb-4 rounded-lg border border-accent/20 bg-accent-dim/30 p-3">
          <p className="text-[10px] text-accent font-display tracking-wider">TRIMMED TO ~{timeBudget} MIN</p>
          <p className="text-[10px] text-muted2 font-light mt-0.5">
            {trimResult?.removedNames.length
              ? `Removed: ${trimResult.removedNames.map((r) => r.name).join(", ")}.`
              : `${day.exercises.length - effectiveExercises.length} exercise${day.exercises.length - effectiveExercises.length > 1 ? "s" : ""} removed.`
            }{" "}Compounds kept.
          </p>
        </div>
      )}

      {/* Warmup */}
      <WarmupSection warmup={warmup} />

      {/* Muscle diagram */}
      <div className="mb-4">
        <MuscleDiagram
          sessionMuscleGroups={(() => {
            const groups = new Set<string>();
            effectiveExercises.forEach((ex) => {
              const lib = findExercise(ex.name);
              if (lib) groups.add(lib.muscle);
            });
            return [...groups];
          })()}
          collapsed={true}
        />
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {effectiveExercises.map((ex, i) => (
          <ExerciseCard
            key={`${ex.name}-${i}`}
            index={i}
            exercise={ex}
            log={logs[i]}
            expanded={expandedEx === i}
            onToggle={() => setExpandedEx(expandedEx === i ? null : i)}
            onUpdateSet={updateSet}
            onUpdateNote={updateNote}
            onSave={saveExercise}
            onSkip={skipExercise}
            onUnskip={unskipExercise}
            onSwap={(idx) => setSwapSheetIdx(idx)}
            swapLoading={false}
            onVideoPlay={(url) => setVideoUrl(url)}
            onVideoSheet={(name) => setVideoSheetEx(name)}
            onSkillPath={(name) => setSkillPathEx(name)}
            onEduSheet={(idx) => setEduSheetIdx(idx)}
            onClearPrefill={(idx) => {
              setLogs((prev) => {
                const ex = { ...prev[idx] };
                ex.actual = ex.actual.map((s) => ({ ...s, weight: "" }));
                ex.prefilled = false;
                return { ...prev, [idx]: ex };
              });
            }}
            eduMode={eduMode}
            conditions={conditions}
          />
        ))}
      </div>

      {/* Add exercise */}
      {!showAddExercise ? (
        <button
          onClick={() => setShowAddExercise(true)}
          className="mt-3 w-full text-[11px] text-accent border border-accent/20 rounded-lg py-2 hover:bg-accent/5 transition-all"
        >
          + Add exercise
        </button>
      ) : (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted2 font-medium">Add to session</span>
            <button onClick={() => setShowAddExercise(false)} className="text-[10px] text-muted hover:text-text">
              close
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(() => {
              const existingNames = new Set(effectiveExercises.map(e => e.name.toLowerCase()));
              const sessionMuscles = new Set<string>();
              effectiveExercises.forEach((ex) => {
                const lib = findExercise(ex.name);
                if (lib) sessionMuscles.add(lib.muscle);
              });
              const equip = useKineStore.getState().equip;
              const suggestions = (EXERCISE_LIBRARY || [])
                .filter((ex) => {
                  if (existingNames.has(ex.name.toLowerCase())) return false;
                  if (!ex.equip.some((e) => equip.includes(e))) return false;
                  if (!sessionMuscles.has(ex.muscle)) return false;
                  return true;
                })
                .slice(0, 6);
              if (suggestions.length === 0) return <p className="text-[10px] text-muted2">No matching exercises available</p>;
              return suggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addExerciseToSession(s.name)}
                  className="text-[11px] text-accent bg-accent/10 border border-accent/30 rounded-lg px-2.5 py-1.5 hover:bg-accent/20 active:scale-[0.97] transition-all"
                >
                  + {s.name} <span className="text-accent/60 font-light">({s.muscle})</span>
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Complete button */}
      <div className="mt-8 pb-4">
        <Button className="w-full" size="lg" onClick={completeSession}>
          Complete session ✓
        </Button>
      </div>

      {/* Confirmation popup */}
      {showConfirm && (
        <SessionSummarySheet
          logs={logs}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmComplete}
        />
      )}

      {/* Swap sheet */}
      {swapSheetIdx !== null && (
        <ExerciseSwapSheet
          open={true}
          onClose={() => setSwapSheetIdx(null)}
          currentExercise={effectiveExercises[swapSheetIdx].name}
          sessionTitle={day.sessionTitle}
          sessionExercises={effectiveExercises.map((e) => e.name)}
          onSwap={(newName) => {
            const store = useKineStore.getState();
            const updatedWeek = { ...week! };
            const updatedDays = [...updatedWeek.days];
            const updatedDay = { ...updatedDays[dayIdx] };
            const updatedExercises = [...updatedDay.exercises];
            const origIdx = updatedExercises.findIndex(e => e.name === effectiveExercises[swapSheetIdx].name);
            if (origIdx >= 0) {
              updatedExercises[origIdx] = { ...updatedExercises[origIdx], name: newName };
            }
            updatedDay.exercises = updatedExercises;
            updatedDays[dayIdx] = updatedDay;
            updatedWeek.days = updatedDays;
            store.setWeekData(updatedWeek);
            setLogs((prev) => ({
              ...prev,
              [swapSheetIdx]: { ...prev[swapSheetIdx], name: newName, saved: false, actual: prev[swapSheetIdx].actual.map(() => ({ reps: "", weight: "" })) },
            }));
            toast(`Swapped to ${newName}`, "success");
            setSwapSheetIdx(null);
          }}
        />
      )}

      {/* Video sheet */}
      {videoSheetEx && (
        <VideoSheet
          open={true}
          onClose={() => setVideoSheetEx(null)}
          exerciseName={videoSheetEx}
        />
      )}

      {/* Skill path sheet */}
      {skillPathEx && (
        <SkillPathSheet
          open={true}
          onClose={() => setSkillPathEx(null)}
          exerciseName={skillPathEx}
          onSelect={(newName) => {
            const idx = effectiveExercises.findIndex(e => e.name === skillPathEx);
            if (idx < 0) return;

            const store = useKineStore.getState();
            const updatedWeek = { ...week! };
            const updatedDays = [...updatedWeek.days];
            const updatedDay = { ...updatedDays[dayIdx] };
            const updatedExercises = [...updatedDay.exercises];
            const origIdx = updatedExercises.findIndex(e => e.name === skillPathEx);
            if (origIdx >= 0) {
              updatedExercises[origIdx] = { ...updatedExercises[origIdx], name: newName };
            }
            updatedDay.exercises = updatedExercises;
            updatedDays[dayIdx] = updatedDay;
            updatedWeek.days = updatedDays;
            store.setWeekData(updatedWeek);

            // Persist skill preference for future weeks
            setSkillPreferences({ ...skillPreferences, [skillPathEx]: newName });

            setLogs((prev) => ({
              ...prev,
              [idx]: { ...prev[idx], name: newName, saved: false, actual: prev[idx].actual.map(() => ({ reps: "", weight: "" })) },
            }));

            toast(`Switched to ${newName}`, "success");
            setSkillPathEx(null);
          }}
        />
      )}

      {/* Exercise education sheet */}
      {eduSheetIdx !== null && effectiveExercises[eduSheetIdx] && (
        <ExerciseEduSheet
          open={true}
          onClose={() => setEduSheetIdx(null)}
          exerciseName={effectiveExercises[eduSheetIdx].name}
          why={(effectiveExercises[eduSheetIdx] as { why?: string }).why}
          feel={(effectiveExercises[eduSheetIdx] as { feel?: string }).feel}
          context={(effectiveExercises[eduSheetIdx] as { context?: string }).context}
          cues={(effectiveExercises[eduSheetIdx] as { cues?: string[] }).cues}
          conditions={conditions}
        />
      )}

      {/* Video player (inline) */}
      {videoUrl && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoUrl(null)}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <video src={videoUrl} controls autoPlay loop muted playsInline className="w-full rounded-xl" style={{ maxHeight: "60vh" }} />
            <button onClick={() => setVideoUrl(null)} className="mt-3 w-full text-center text-xs text-muted2 hover:text-text">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
