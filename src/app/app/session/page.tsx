"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { analyseSession } from "@/lib/session-analysis";
import type { AnalysisResult, ExerciseFeedback } from "@/lib/session-analysis";
import { apiFetchStreaming } from "@/lib/api";
import { findExercise } from "@/data/exercise-library";
import { getBreathingCue, getMuscleTags, KNEE_TRACKING_CUE, NEUTRAL_SPINE_CUE, HIP_HINGE_FIRST, isSquat, isHinge, isCompound } from "@/data/education";
import { getSkillPath, hasSkillPath, SKILL_HINTS } from "@/data/skill-paths";
import { getVideoThumb, hasVideo, getVideoUrl } from "@/data/exercise-videos";
import { suggestNextWeight } from "@/lib/progression";
import { getWarmupForSession } from "@/data/warmup-data";
import { trimSessionToTime } from "@/lib/time-budget";
import { getExerciseStallWeeks } from "@/lib/programme-age";
import ExerciseSwapSheet from "@/components/ExerciseSwapSheet";
import ExerciseEduSheet from "@/components/ExerciseEduSheet";
import MuscleDiagram from "@/components/MuscleDiagram";
import SkillPathSheet from "@/components/SkillPathSheet";
import VideoSheet from "@/components/VideoSheet";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";
import { sharePR } from "@/lib/share-card";

interface SetLog {
  reps: string;
  weight: string;
}

interface ExerciseLog {
  name: string;
  planned: { sets: string; reps: string };
  actual: SetLog[];
  note: string;
  saved: boolean;
}

type SessionStep = "workout" | "feedback" | "analysing" | "results";

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const { weekData, sessionLogs, setSessionLogs, feedbackState, setFeedbackState, progressDB, sessionTimeBudgets } =
    useKineStore();

  const [logs, setLogs] = useState<Record<number, ExerciseLog>>({});
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [sessionStep, setSessionStep] = useState<SessionStep>("workout");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapSheetIdx, setSwapSheetIdx] = useState<number | null>(null);
  const [eduSheetIdx, setEduSheetIdx] = useState<number | null>(null);
  const [showWarmup, setShowWarmup] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sessionPRs, setSessionPRs] = useState<{ name: string; weight: number; reps: number }[]>([]);
  // #14/#15: Video and skill path sheet state
  const [videoSheetEx, setVideoSheetEx] = useState<string | null>(null);
  const [skillPathEx, setSkillPathEx] = useState<string | null>(null);

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  // #12: Apply time budget trimming to exercises
  const effectiveExercises = (() => {
    if (!day || day.isRest) return [];
    const budget = sessionTimeBudgets[dayIdx];
    if (budget && budget < (parseInt(day.sessionDuration) || 50)) {
      const trimmed = trimSessionToTime(day.exercises, budget);
      return trimmed.exercises;
    }
    return day.exercises;
  })();

  // Initialize logs from exercises (using time-budget-trimmed list)
  useEffect(() => {
    if (!day || day.isRest || effectiveExercises.length === 0) return;
    const initial: Record<number, ExerciseLog> = {};
    effectiveExercises.forEach((ex, i) => {
      const numSets = parseInt(ex.sets) || 3;
      initial[i] = {
        name: ex.name,
        planned: { sets: ex.sets, reps: ex.reps },
        actual: Array.from({ length: numSets }, () => ({ reps: "", weight: "" })),
        note: "",
        saved: false,
      };
    });
    setLogs(initial);
  }, [day, effectiveExercises.length]);

  const updateSet = useCallback(
    (exIdx: number, setIdx: number, field: "reps" | "weight", val: string) => {
      setLogs((prev) => {
        const updated = { ...prev };
        const ex = { ...updated[exIdx] };
        const sets = [...ex.actual];
        sets[setIdx] = { ...sets[setIdx], [field]: val };
        if (field === "weight" && setIdx === 0 && val) {
          sets.forEach((s, i) => {
            if (i > 0 && !s.weight) sets[i] = { ...s, weight: val };
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
      return { ...prev, [exIdx]: { ...ex, saved: true } };
    });
  }, []);

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

  // ── Exercise Swap ──
  async function handleSwap(exIdx: number) {
    if (!day) return;
    setSwapLoading(true);
    setSwappingIdx(exIdx);

    const store = useKineStore.getState();
    const currentEx = day.exercises[exIdx];
    const otherExercises = day.exercises.map((e) => e.name).filter((n) => n !== currentEx.name);

    try {
      const data = await apiFetchStreaming({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: "You are Kine. Suggest ONE alternative exercise. Return ONLY JSON: {\"name\":\"Exercise Name\",\"reason\":\"1 sentence why\"}",
        messages: [{
          role: "user",
          content: `Replace "${currentEx.name}" in a ${day.sessionTitle} session. Equipment: ${store.equip.join(", ")}. Injuries: ${store.injuries.join(", ") || "none"}. Already in session: ${otherExercises.join(", ")}. Same muscle group, different movement pattern.`,
        }],
      }, { timeoutMs: 15000 });

      const text = data.content.map((b) => b.text || "").join("").trim();
      const j = text.indexOf("{");
      const k = text.lastIndexOf("}");
      if (j >= 0 && k >= 0) {
        const swap = JSON.parse(text.slice(j, k + 1));
        if (swap.name) {
          // Update the exercise in weekData
          const updatedWeek = { ...week! };
          const updatedDays = [...updatedWeek.days];
          const updatedDay = { ...updatedDays[dayIdx] };
          const updatedExercises = [...updatedDay.exercises];
          updatedExercises[exIdx] = {
            ...updatedExercises[exIdx],
            name: swap.name,
          };
          updatedDay.exercises = updatedExercises;
          updatedDays[dayIdx] = updatedDay;
          updatedWeek.days = updatedDays;
          store.setWeekData(updatedWeek);

          // Update logs
          setLogs((prev) => ({
            ...prev,
            [exIdx]: { ...prev[exIdx], name: swap.name, saved: false, actual: prev[exIdx].actual.map(() => ({ reps: "", weight: "" })) },
          }));

          toast(`Swapped to ${swap.name}`, "success");
        }
      }
    } catch {
      toast("Swap unavailable — try a different exercise manually", "error");
    }

    setSwapLoading(false);
    setSwappingIdx(null);
  }

  // ── Complete Session ──
  function completeSession() {
    const hasAnyData = Object.values(logs).some((ex) =>
      ex.actual.some((s) => s.reps || s.weight)
    );
    if (!hasAnyData) {
      toast("Log at least one exercise before completing", "error");
      return;
    }
    setSessionLogs(logs as unknown as typeof sessionLogs);
    setSessionStep("feedback");
  }

  // ── Submit Feedback + Analysis ──
  async function submitFeedback(effort: number, soreness: number) {
    setFeedbackState({
      effort,
      soreness,
      tsDay: new Date().toLocaleDateString("en-GB", { weekday: "long" }),
      tsTime: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening",
      sessionStartTime,
    });

    // Detect PRs
    const prs = detectPRs(logs);
    setSessionPRs(prs);
    if (prs.length > 0) {
      prs.forEach((pr) => toast(`PR: ${pr.name} — ${pr.weight}kg × ${pr.reps}`, "success"));
    }

    // Save session
    const store = useKineStore.getState();
    const sessionRecord = {
      dayIdx,
      date: new Date().toISOString().split("T")[0],
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
          date: new Date().toISOString().split("T")[0],
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
    setSessionStep("results");
  }

  // ── Render ──
  if (!week || !day || dayIdx < 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted2">No session found</p>
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

  const warmupExercises = getWarmupForSession(day.sessionTitle);
  const timeBudget = sessionTimeBudgets[dayIdx];
  const isTrimmed = timeBudget && effectiveExercises.length < day.exercises.length;

  return (
    <div>
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

      {/* Set notation education — first encounter */}
      {!useKineStore.getState().eduFlags.seen_set_notation && (
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
              // Mark as seen
              const flags = { ...store.eduFlags, seen_set_notation: true };
              useKineStore.setState({ eduFlags: flags } as Partial<typeof store>);
            }}
            className="mt-2 text-[10px] text-accent hover:underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* #12: Time budget notice */}
      {isTrimmed && (
        <div className="mb-4 rounded-lg border border-accent/20 bg-accent-dim/30 p-3">
          <p className="text-[10px] text-accent font-display tracking-wider">TRIMMED TO ~{timeBudget} MIN</p>
          <p className="text-[10px] text-muted2 font-light mt-0.5">
            {day.exercises.length - effectiveExercises.length} exercise{day.exercises.length - effectiveExercises.length > 1 ? "s" : ""} removed to fit your time budget. Compounds kept.
          </p>
        </div>
      )}

      {/* Inline warmup */}
      {showWarmup && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs tracking-wider text-muted uppercase">Warm up</p>
            <button onClick={() => setShowWarmup(false)} className="text-[10px] text-muted2 hover:text-text">
              Hide
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {warmupExercises.map((wu, i) => (
              <WarmupItem key={i} name={wu.name} duration={wu.duration} cue={wu.cue} category={wu.category} />
            ))}
          </div>
        </div>
      )}

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
            onSwap={(idx) => setSwapSheetIdx(idx)}
            swapLoading={false}
            onVideoPlay={(url) => setVideoUrl(url)}
            onVideoSheet={(name) => setVideoSheetEx(name)}
            onSkillPath={(name) => setSkillPathEx(name)}
            onEduSheet={(idx) => setEduSheetIdx(idx)}
          />
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-8 pb-4">
        <Button className="w-full" size="lg" onClick={completeSession}>
          Complete session ✓
        </Button>
      </div>

      {/* Swap sheet */}
      {swapSheetIdx !== null && (
        <ExerciseSwapSheet
          open={true}
          onClose={() => setSwapSheetIdx(null)}
          currentExercise={effectiveExercises[swapSheetIdx].name}
          sessionTitle={day.sessionTitle}
          sessionExercises={effectiveExercises.map((e) => e.name)}
          onSwap={(newName) => {
            // Update weekData
            const store = useKineStore.getState();
            const updatedWeek = { ...week! };
            const updatedDays = [...updatedWeek.days];
            const updatedDay = { ...updatedDays[dayIdx] };
            const updatedExercises = [...updatedDay.exercises];
            // Find the index in the original exercises array
            const origIdx = updatedExercises.findIndex(e => e.name === effectiveExercises[swapSheetIdx].name);
            if (origIdx >= 0) {
              updatedExercises[origIdx] = { ...updatedExercises[origIdx], name: newName };
            }
            updatedDay.exercises = updatedExercises;
            updatedDays[dayIdx] = updatedDay;
            updatedWeek.days = updatedDays;
            store.setWeekData(updatedWeek);
            // Update logs
            setLogs((prev) => ({
              ...prev,
              [swapSheetIdx]: { ...prev[swapSheetIdx], name: newName, saved: false, actual: prev[swapSheetIdx].actual.map(() => ({ reps: "", weight: "" })) },
            }));
            toast(`Swapped to ${newName}`, "success");
            setSwapSheetIdx(null);
          }}
        />
      )}

      {/* #14: Video sheet */}
      {videoSheetEx && (
        <VideoSheet
          open={true}
          onClose={() => setVideoSheetEx(null)}
          exerciseName={videoSheetEx}
        />
      )}

      {/* #15: Skill path sheet */}
      {skillPathEx && (
        <SkillPathSheet
          open={true}
          onClose={() => setSkillPathEx(null)}
          exerciseName={skillPathEx}
          onSelect={(newName) => {
            // Find which exercise index this is
            const idx = effectiveExercises.findIndex(e => e.name === skillPathEx);
            if (idx < 0) return;

            // Update weekData
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

            // Update logs
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

// ── Exercise Card ──

function ExerciseCard({
  index, exercise, log, expanded, onToggle, onUpdateSet, onUpdateNote, onSave, onSkip, onSwap, swapLoading, onVideoPlay, onVideoSheet, onSkillPath, onEduSheet,
}: {
  index: number;
  exercise: { name: string; sets: string; reps: string; rest: string };
  log: ExerciseLog | undefined;
  expanded: boolean;
  onToggle: () => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: "reps" | "weight", val: string) => void;
  onUpdateNote: (exIdx: number, note: string) => void;
  onSave: (exIdx: number) => void;
  onSkip: (exIdx: number) => void;
  onSwap: (exIdx: number) => void;
  swapLoading: boolean;
  onVideoPlay?: (url: string) => void;
  onVideoSheet?: (name: string) => void;
  onSkillPath?: (name: string) => void;
  onEduSheet?: (exIdx: number) => void;
}) {
  if (!log) return null;
  const skipped = log.saved && log.actual.length === 0;
  const exInfo = findExercise(exercise.name);
  const muscleTags = getMuscleTags(exercise.name);
  const videoThumb = getVideoThumb(exercise.name);
  const vidUrl = getVideoUrl(exercise.name);

  // Category color for left border accent
  const catColor = exInfo?.muscle
    ? { push: "var(--color-cat-push)", pull: "var(--color-cat-pull)", legs: "var(--color-cat-legs)", hinge: "var(--color-cat-hinge)", core: "var(--color-cat-core)", cardio: "var(--color-cat-cardio)" }[exInfo.muscle] || "var(--color-border)"
    : "var(--color-border)";

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        skipped ? "border-border/50 bg-surface/50 opacity-50"
          : log.saved ? "border-accent/30 bg-accent-dim/50"
          : expanded ? "border-border-active bg-surface"
          : "border-border bg-surface"
      }`}
      style={{ borderLeftWidth: "3px", borderLeftColor: skipped ? "var(--color-border)" : catColor }}
    >
      {/* Skip/Swap row at top (when expanded and not saved) */}
      {expanded && !log.saved && !skipped && (
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-0">
          <button onClick={(e) => { e.stopPropagation(); onSkip(index); }}
            className="text-[10px] text-muted hover:text-text transition-colors px-2 py-1">Skip</button>
          <button onClick={(e) => { e.stopPropagation(); onSwap(index); }}
            className="text-[10px] text-muted border border-border rounded px-2 py-1 hover:border-border-active transition-all">Swap</button>
          {hasSkillPath(exercise.name) && onSkillPath && (
            <button onClick={(e) => { e.stopPropagation(); onSkillPath(exercise.name); }}
              className="text-[10px] text-muted border border-border rounded px-2 py-1 hover:border-border-active transition-all">Easier/Harder</button>
          )}
        </div>
      )}

      {/* Header */}
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 pt-2 text-left">
        {/* Thumbnail placeholder */}
        {videoThumb ? (
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border"
            onClick={(e) => { e.stopPropagation(); if (vidUrl && onVideoPlay) onVideoPlay(vidUrl); }}
          >
            <img src={videoThumb} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-white text-[10px]">▶</span>
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-lg border border-border flex items-center justify-center"
            style={{ background: `${catColor}10` }}>
            <div className="h-3 w-3 rounded-full" style={{ background: catColor }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-medium truncate ${skipped ? "line-through text-muted" : "text-text"}`}>{exercise.name}</span>
            {log.saved && !skipped && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] text-accent shrink-0">✓ saved</span>
            )}
            {skipped && (
              <span className="rounded-full bg-border px-2 py-0.5 text-[9px] text-muted shrink-0">skipped</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted2 font-light">
              {exercise.sets}×{exercise.reps}
              {exercise.rest !== "-" && ` · ${exercise.rest}`}
            </span>
            {exInfo && (
              <span className="text-[10px] text-muted font-light">
                · {exInfo.tags.includes("Compound") ? "Compound" : "Isolation"}
              </span>
            )}
          </div>
          {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {[...muscleTags.primary, ...muscleTags.secondary].slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-surface2/60 px-1.5 py-0.5 text-[9px] text-muted2 font-light">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {/* Education "?" button */}
        {onEduSheet && (
          <button
            onClick={(e) => { e.stopPropagation(); onEduSheet(index); }}
            className="shrink-0 w-6 h-6 rounded-full bg-accent/8 border border-accent/25 text-accent text-[11px] flex items-center justify-center hover:bg-accent/15 transition-all"
          >
            ?
          </button>
        )}
        <span className="text-muted text-[10px] shrink-0">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && !log.saved && (() => {
        const exInfo = findExercise(exercise.name);
        const logType = exInfo?.logType || "weighted";
        const breathCue = getBreathingCue(exercise.name);
        const weightSuggestion = suggestNextWeight(exercise.name);
        const skillPath = hasSkillPath(exercise.name) ? getSkillPath(exercise.name, []) : null;

        return (
          <div className="border-t border-border/50 px-4 pb-4 pt-3">
            {/* Breathing cue */}
            {breathCue && (
              <p className="mb-3 text-[10px] text-accent italic">{breathCue}</p>
            )}

            {/* Weight suggestion */}
            {weightSuggestion && logType.startsWith("weighted") && (
              <p className="mb-2 text-[10px] text-muted2">Last time: {weightSuggestion}</p>
            )}

            <p className="mb-3 text-[10px] tracking-wider text-muted uppercase">Log your sets</p>
            <div className="flex flex-col gap-2">
              {log.actual.map((set, setIdx) => (
                <div key={setIdx} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-xs text-muted">Set {setIdx + 1}</span>

                  {/* Weighted: reps × weight */}
                  {(logType === "weighted" || logType === "weighted_unilateral") && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="reps" value={set.reps}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-muted">×</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => {
                          const cur = parseFloat(set.weight) || 0;
                          const inc = logType.includes("unilateral") ? 2 : 2.5;
                          if (cur >= inc) onUpdateSet(index, setIdx, "weight", String(cur - inc));
                        }} className="rounded bg-surface2 px-1.5 py-0.5 text-xs text-muted2 hover:text-text">−</button>
                        <input type="number" inputMode="decimal" placeholder="kg" value={set.weight}
                          onChange={(e) => onUpdateSet(index, setIdx, "weight", e.target.value)}
                          className="w-14 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                        <button onClick={() => {
                          const cur = parseFloat(set.weight) || 0;
                          const inc = logType.includes("unilateral") ? 2 : 2.5;
                          onUpdateSet(index, setIdx, "weight", String(cur + inc));
                        }} className="rounded bg-surface2 px-1.5 py-0.5 text-xs text-muted2 hover:text-text">+</button>
                      </div>
                      <span className="text-[10px] text-muted">{logType === "weighted_unilateral" ? "kg/side" : "kg"}</span>
                    </>
                  )}

                  {/* Bodyweight: reps only */}
                  {(logType === "bodyweight" || logType === "bodyweight_unilateral") && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="reps" value={set.reps}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">{logType === "bodyweight_unilateral" ? "reps/side" : "reps"}</span>
                    </>
                  )}

                  {/* Timed: seconds */}
                  {logType === "timed" && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="sec" value={set.reps}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">sec</span>
                    </>
                  )}

                  {/* Cardio: minutes + distance */}
                  {logType === "cardio" && setIdx === 0 && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="min" value={set.reps}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">min</span>
                      <input type="number" inputMode="numeric" placeholder="m" value={set.weight}
                        onChange={(e) => onUpdateSet(index, setIdx, "weight", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">m</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <textarea placeholder="Notes (optional)" value={log.note}
              onChange={(e) => onUpdateNote(index, e.target.value)} rows={2}
              className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent resize-none" />

            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onSave(index)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => onSkip(index)}>Skip</Button>
              <Button size="sm" variant="ghost" onClick={() => onSwap(index)} disabled={swapLoading}>
                {swapLoading ? "..." : "Swap"}
              </Button>
            </div>

            {/* #14: Video + #15: Skill path action buttons */}
            <div className="mt-3 flex gap-2">
              {hasVideo(exercise.name) && onVideoSheet && (
                <button
                  onClick={() => onVideoSheet(exercise.name)}
                  className="flex items-center gap-1.5 rounded-lg bg-surface2/50 px-2.5 py-1.5 text-[10px] text-muted2 hover:text-accent transition-colors"
                >
                  <span>▶</span> Watch form
                </button>
              )}
              {skillPath && (skillPath.easier.length > 0 || skillPath.harder.length > 0) && onSkillPath && (
                <button
                  onClick={() => onSkillPath(exercise.name)}
                  className="flex items-center gap-1.5 rounded-lg bg-surface2/50 px-2.5 py-1.5 text-[10px] text-muted2 hover:text-accent transition-colors"
                >
                  ↕ Adjust difficulty
                </button>
              )}
            </div>

            {/* #17: Exercise stall detection */}
            {(() => {
              const stallWeeks = getExerciseStallWeeks(exercise.name);
              if (stallWeeks >= 3) {
                return (
                  <div className="mt-3 rounded-lg border border-accent/20 bg-accent-dim/30 px-3 py-2">
                    <p className="text-[10px] text-accent font-medium">
                      Weight hasn&apos;t increased in {stallWeeks} sessions
                    </p>
                    <p className="text-[10px] text-muted2 font-light mt-0.5">
                      {stallWeeks >= 5
                        ? "Consider swapping to a variation, adjusting rep range, or taking a deload."
                        : "This is normal — focus on form and rep quality. The weight will follow."}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Muscle tags */}
            {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {muscleTags.primary.map((m) => (
                  <span key={m} className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] text-accent">{m}</span>
                ))}
                {muscleTags.secondary.map((m) => (
                  <span key={m} className="rounded-full bg-surface2 px-2 py-0.5 text-[9px] text-muted2">{m}</span>
                ))}
              </div>
            )}

            {/* Education cues */}
            {isSquat(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{KNEE_TRACKING_CUE}</p>
            )}
            {isHinge(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{HIP_HINGE_FIRST}</p>
            )}
            {isCompound(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{NEUTRAL_SPINE_CUE}</p>
            )}

            {/* Skill path hint (inline preview) */}
            {skillPath && (skillPath.easier.length > 0 || skillPath.harder.length > 0) && (
              <div className="mt-3 rounded-lg bg-surface2/50 px-3 py-2">
                <p className="text-[9px] tracking-wider text-muted uppercase mb-1">Difficulty</p>
                {skillPath.hint && <p className="text-[10px] text-muted2 mb-1.5">{skillPath.hint}</p>}
                <div className="flex gap-3 text-[10px]">
                  {skillPath.easier.length > 0 && (
                    <span className="text-green-400">← Easier: {skillPath.easier.slice(-1)[0]}</span>
                  )}
                  {skillPath.harder.length > 0 && (
                    <span className="text-accent">Harder: {skillPath.harder[0]} →</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {expanded && log.saved && !skipped && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1 text-xs text-muted2">
            {log.actual.filter((s) => s.reps || s.weight).map((s, i) => (
              <span key={i}>Set {i + 1}: {s.reps} reps × {s.weight || "BW"} kg</span>
            ))}
          </div>
          {log.note && <p className="mt-2 text-xs text-muted italic">{log.note}</p>}
        </div>
      )}
    </div>
  );
}

// ── Feedback Screen ──

function FeedbackScreen({ onSubmit }: { onSubmit: (effort: number, soreness: number) => void }) {
  const [effort, setEffort] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const { goal } = useKineStore();

  // Goal-aware labels
  const effortLabels = goal === "strength"
    ? ["Light", "Moderate", "Heavy", "Maximal"]
    : goal === "muscle"
      ? ["Easy", "Working", "Intense", "Failure"]
      : ["Too easy", "Moderate", "Hard", "Max effort"];

  const effortQuestion = goal === "strength"
    ? "How heavy did it feel?"
    : goal === "muscle"
      ? "How hard did you push?"
      : "How was the effort?";

  const sorenessLabels = ["Fresh", "A little sore", "Pretty sore", "Beat up"];

  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wide text-accent">Session complete</h2>
        <p className="mt-2 text-sm text-muted2">
          {goal === "strength" ? "How did the bar move?"
           : goal === "muscle" ? "Did you feel the muscles working?"
           : "How did it go?"}
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">{effortQuestion}</p>
        <div className="grid grid-cols-4 gap-2">
          {effortLabels.map((label, i) => (
            <button key={i} onClick={() => setEffort(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                effort === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">How does your body feel?</p>
        <div className="grid grid-cols-4 gap-2">
          {sorenessLabels.map((label, i) => (
            <button key={i} onClick={() => setSoreness(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                soreness === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={effort === null || soreness === null}
        onClick={() => onSubmit(effort!, soreness!)}>
        Save & get feedback
      </Button>
    </div>
  );
}

// ── Analysis Results Screen ──

function AnalysisScreen({ analysis, prs = [], onDone }: { analysis: AnalysisResult | null; prs?: { name: string; weight: number; reps: number }[]; onDone: () => void }) {
  const { progressDB } = useKineStore();
  const verdictColors: Record<string, string> = {
    strong: "text-green-400",
    solid: "text-muted2",
    building: "text-yellow-400",
    adjust: "text-accent",
  };

  function handleSharePR(pr: { name: string; weight: number; reps: number }) {
    const history = progressDB.lifts[pr.name] || [];
    const prevBest = history.length > 1
      ? history.slice(0, -1).reduce((best: number, entry: { weight: number }) => Math.max(best, entry.weight), 0)
      : undefined;

    sharePR({
      name: pr.name,
      weight: pr.weight,
      reps: pr.reps,
      prev: prevBest,
      weekNum: progressDB.currentWeek || 1,
      totalSessions: progressDB.sessions.length,
    });
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-accent">Session review</h2>

      {/* PR cards with share */}
      {prs.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {prs.map((pr, i) => (
            <div key={i} className="rounded-[14px] border border-accent/30 bg-accent-dim p-4 flex items-center justify-between">
              <div>
                <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-0.5">New PR</p>
                <p className="text-sm font-medium text-text">{pr.name}</p>
                <p className="text-xs text-muted2">{pr.weight}kg x {pr.reps} reps</p>
              </div>
              <button
                onClick={() => handleSharePR(pr)}
                className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10px] text-accent hover:bg-accent/20 transition-colors"
              >
                Share
              </button>
            </div>
          ))}
        </div>
      )}

      {analysis ? (
        <>
          <div className="mt-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <p className="text-sm leading-relaxed text-text">{analysis.overallAssessment}</p>
          </div>

          {analysis.exerciseFeedback?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs tracking-wider text-muted uppercase">Exercise breakdown</p>
              <div className="flex flex-col gap-2">
                {analysis.exerciseFeedback.map((ef, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-[var(--radius-default)] border border-border bg-surface p-3">
                    <span className={`mt-0.5 text-xs font-medium uppercase ${verdictColors[ef.verdict] || "text-muted2"}`}>
                      {ef.verdict}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{ef.name}</p>
                      <p className="text-xs text-muted2">{ef.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.changes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs tracking-wider text-muted uppercase">Changes for next time</p>
              <div className="flex flex-col gap-2">
                {analysis.changes.map((c, i) => (
                  <div key={i} className="rounded-[var(--radius-default)] border border-border bg-surface p-3">
                    <p className="text-sm font-medium text-text">{c.icon} {c.title}</p>
                    <p className="text-xs text-muted2">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <p className="text-sm text-muted2">
            AI analysis unavailable. Your session has been saved — great work.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={onDone}>
          Back to week →
        </Button>
      </div>
    </div>
  );
}

// ── Warmup Item with "how to" popup ──

function WarmupItem({ name, duration, cue, category }: { name: string; duration: string; cue: string; category: string }) {
  const [showHow, setShowHow] = useState(false);
  const steps = cue.split(/,\s+|;\s+/).filter(Boolean).map(s => s.trim());

  return (
    <div>
      <button
        onClick={() => setShowHow(!showHow)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-surface2/50 transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 rounded px-1 py-0.5 text-[7px] tracking-wider uppercase ${
            category === "activation" ? "bg-accent/10 text-accent"
            : category === "mobility" ? "bg-cat-pull/10 text-cat-pull"
            : category === "dynamic" ? "bg-cat-legs/10 text-cat-legs"
            : "bg-surface2 text-muted2"
          }`}>{category.slice(0, 3)}</div>
          <span className="text-xs text-text truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted">{duration}</span>
          <span className={`text-[9px] rounded-full w-4 h-4 flex items-center justify-center ${
            showHow ? "bg-accent/20 text-accent" : "bg-surface2 text-muted2"
          }`}>{showHow ? "▾" : "?"}</span>
        </div>
      </button>
      {showHow && (
        <div className="ml-8 mr-2 mb-1.5 px-3 py-2 rounded-lg bg-surface2/30 animate-fade-up">
          <p className="text-[9px] text-accent font-display tracking-wider mb-1.5">HOW TO</p>
          <div className="flex flex-col gap-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className="text-accent shrink-0 font-medium">{i + 1}.</span>
                <span className="text-muted2 font-light leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PR Detection ──

function detectPRs(logs: Record<number, ExerciseLog>): { name: string; weight: number; reps: number }[] {
  const store = useKineStore.getState();
  const prs: { name: string; weight: number; reps: number }[] = [];

  Object.values(logs).forEach((ex) => {
    if (!ex.saved || ex.actual.length === 0) return;

    const bestSet = ex.actual.reduce(
      (best, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        if (w > best.w || (w === best.w && r > best.r)) return { w, r };
        return best;
      },
      { w: 0, r: 0 }
    );

    if (bestSet.w <= 0) return;

    const history = store.progressDB.lifts[ex.name] || [];
    const previousBest = history.reduce(
      (best, entry) => {
        if (entry.weight > best.w || (entry.weight === best.w && entry.reps > best.r))
          return { w: entry.weight, r: entry.reps };
        return best;
      },
      { w: 0, r: 0 }
    );

    if (bestSet.w > previousBest.w || (bestSet.w === previousBest.w && bestSet.r > previousBest.r)) {
      if (history.length > 0) {
        prs.push({ name: ex.name, weight: bestSet.w, reps: bestSet.r });
      }
    }
  });

  return prs;
}
