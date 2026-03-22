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
import ExerciseSwapSheet from "@/components/ExerciseSwapSheet";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";

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

  const { weekData, sessionLogs, setSessionLogs, feedbackState, setFeedbackState, progressDB } =
    useKineStore();

  const [logs, setLogs] = useState<Record<number, ExerciseLog>>({});
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [sessionStep, setSessionStep] = useState<SessionStep>("workout");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapSheetIdx, setSwapSheetIdx] = useState<number | null>(null);
  const [showWarmup, setShowWarmup] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  // Initialize logs from exercises
  useEffect(() => {
    if (!day || day.isRest) return;
    const initial: Record<number, ExerciseLog> = {};
    day.exercises.forEach((ex, i) => {
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
  }, [day]);

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
        onDone={() => {
          setSessionLogs({});
          setFeedbackState({ effort: null, soreness: null, tsDay: null, tsTime: null, sessionStartTime: null });
          router.push("/app");
        }}
      />
    );
  }

  const warmupExercises = getWarmupForSession(day.sessionTitle);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </button>
        <h1 className="mt-2 font-display text-2xl tracking-wide text-text">{day.sessionTitle}</h1>
        {day.coachNote && <p className="mt-1 text-xs text-muted2">{day.coachNote}</p>}
        <p className="mt-1 text-[10px] text-muted">{day.sessionDuration} · {day.exercises.length} exercises</p>
      </div>

      {/* Inline warmup */}
      {showWarmup && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs tracking-wider text-muted uppercase">Warm up</p>
            <button onClick={() => setShowWarmup(false)} className="text-[10px] text-muted2 hover:text-text">
              Hide
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {warmupExercises.map((wu, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text">{wu.name}</span>
                <span className="text-muted">{wu.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {day.exercises.map((ex, i) => (
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
          currentExercise={day.exercises[swapSheetIdx].name}
          sessionTitle={day.sessionTitle}
          sessionExercises={day.exercises.map((e) => e.name)}
          onSwap={(newName) => {
            // Update weekData
            const store = useKineStore.getState();
            const updatedWeek = { ...week! };
            const updatedDays = [...updatedWeek.days];
            const updatedDay = { ...updatedDays[dayIdx] };
            const updatedExercises = [...updatedDay.exercises];
            updatedExercises[swapSheetIdx] = { ...updatedExercises[swapSheetIdx], name: newName };
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

      {/* Video player */}
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
  index, exercise, log, expanded, onToggle, onUpdateSet, onUpdateNote, onSave, onSkip, onSwap, swapLoading, onVideoPlay,
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
}) {
  if (!log) return null;
  const skipped = log.saved && log.actual.length === 0;
  const exInfo = findExercise(exercise.name);
  const muscleTags = getMuscleTags(exercise.name);
  const videoThumb = getVideoThumb(exercise.name);
  const vidUrl = getVideoUrl(exercise.name);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      skipped ? "border-border/50 bg-surface/50 opacity-50"
        : log.saved ? "border-accent/30 bg-accent-dim/50"
        : expanded ? "border-border-active bg-surface"
        : "border-border bg-surface"
    }`}>
      {/* Header */}
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        {/* Video thumbnail or muscle dot */}
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
          <div className={`h-2 w-2 shrink-0 rounded-full ${
            exInfo?.muscle === "push" ? "bg-cat-push"
            : exInfo?.muscle === "pull" ? "bg-cat-pull"
            : exInfo?.muscle === "legs" ? "bg-cat-legs"
            : exInfo?.muscle === "hinge" ? "bg-cat-hinge"
            : exInfo?.muscle === "core" ? "bg-cat-core"
            : exInfo?.muscle === "cardio" ? "bg-cat-cardio"
            : "bg-muted"
          }`} />
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
        </div>
        <span className="text-muted text-[10px] shrink-0">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && !log.saved && (() => {
        const exInfo = findExercise(exercise.name);
        const logType = exInfo?.logType || "weighted";
        const breathCue = getBreathingCue(exercise.name);
        const weightSuggestion = suggestNextWeight(exercise.name);
        const skillPath = hasSkillPath(exercise.name) ? getSkillPath(exercise.name, []) : null;

        return (
          <div className="border-t border-border px-4 pb-4 pt-3">
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

            {/* Skill path hint */}
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

  const effortLabels = ["Too easy", "Moderate", "Hard", "Max effort"];
  const sorenessLabels = ["Fresh", "A little sore", "Pretty sore", "Beat up"];

  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wide text-accent">Session complete</h2>
        <p className="mt-2 text-sm text-muted2">How did it go?</p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Effort</p>
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

function AnalysisScreen({ analysis, onDone }: { analysis: AnalysisResult | null; onDone: () => void }) {
  const verdictColors: Record<string, string> = {
    strong: "text-green-400",
    solid: "text-muted2",
    building: "text-yellow-400",
    adjust: "text-accent",
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-accent">Session review</h2>

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
