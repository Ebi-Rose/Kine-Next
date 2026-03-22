"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import Button from "@/components/Button";
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

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const { weekData, sessionLogs, setSessionLogs, feedbackState, setFeedbackState } =
    useKineStore();

  const [logs, setLogs] = useState<Record<number, ExerciseLog>>({});
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [showFeedback, setShowFeedback] = useState(false);

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
        actual: Array.from({ length: numSets }, () => ({
          reps: "",
          weight: "",
        })),
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

        // Auto-fill weight across sets when first set weight entered
        if (field === "weight" && setIdx === 0 && val) {
          sets.forEach((s, i) => {
            if (i > 0 && !s.weight) {
              sets[i] = { ...s, weight: val };
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
    setLogs((prev) => ({
      ...prev,
      [exIdx]: { ...prev[exIdx], note },
    }));
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

  function completeSession() {
    const hasAnyData = Object.values(logs).some((ex) =>
      ex.actual.some((s) => s.reps || s.weight)
    );

    if (!hasAnyData) {
      toast("Log at least one exercise before completing", "error");
      return;
    }

    // Save logs to store
    setSessionLogs(logs as unknown as typeof sessionLogs);
    setFeedbackState({
      ...feedbackState,
      sessionStartTime: feedbackState.sessionStartTime || new Date().toISOString(),
    });
    setShowFeedback(true);
  }

  function submitFeedback(effort: number, soreness: number) {
    // Save feedback
    setFeedbackState({
      effort,
      soreness,
      tsDay: new Date().toLocaleDateString("en-GB", { weekday: "long" }),
      tsTime: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening",
      sessionStartTime: feedbackState.sessionStartTime,
    });

    // Save session to progressDB
    const store = useKineStore.getState();
    const sessionRecord = {
      dayIdx,
      date: new Date().toISOString().split("T")[0],
      weekNum: store.progressDB.currentWeek,
      title: day?.sessionTitle || "",
      logs,
      effort,
      soreness,
    };

    store.setProgressDB({
      ...store.progressDB,
      sessions: [...store.progressDB.sessions, sessionRecord],
    });

    // Clear session state
    setSessionLogs({});
    setFeedbackState({
      effort: null,
      soreness: null,
      tsDay: null,
      tsTime: null,
      sessionStartTime: null,
    });

    toast("Session saved", "success");
    router.push("/app");
  }

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

  if (showFeedback) {
    return <FeedbackScreen onSubmit={submitFeedback} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/app")}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          ← Back to week
        </button>
        <h1 className="mt-2 font-display text-2xl tracking-wide text-text">
          {day.sessionTitle}
        </h1>
        {day.coachNote && (
          <p className="mt-1 text-xs text-muted2">{day.coachNote}</p>
        )}
        <p className="mt-1 text-[10px] text-muted">{day.sessionDuration}</p>
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {day.exercises.map((ex, i) => (
          <ExerciseCard
            key={i}
            index={i}
            exercise={ex}
            log={logs[i]}
            expanded={expandedEx === i}
            onToggle={() => setExpandedEx(expandedEx === i ? null : i)}
            onUpdateSet={updateSet}
            onUpdateNote={updateNote}
            onSave={saveExercise}
          />
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-8 pb-4">
        <Button className="w-full" size="lg" onClick={completeSession}>
          Complete session ✓
        </Button>
      </div>
    </div>
  );
}

// ── Exercise Card ──

function ExerciseCard({
  index,
  exercise,
  log,
  expanded,
  onToggle,
  onUpdateSet,
  onUpdateNote,
  onSave,
}: {
  index: number;
  exercise: { name: string; sets: string; reps: string; rest: string };
  log: ExerciseLog | undefined;
  expanded: boolean;
  onToggle: () => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: "reps" | "weight", val: string) => void;
  onUpdateNote: (exIdx: number, note: string) => void;
  onSave: (exIdx: number) => void;
}) {
  if (!log) return null;

  return (
    <div
      className={`rounded-[var(--radius-default)] border transition-all ${
        log.saved
          ? "border-accent/30 bg-accent-dim/50"
          : expanded
            ? "border-border-active bg-surface"
            : "border-border bg-surface"
      }`}
    >
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">
              {exercise.name}
            </span>
            {log.saved && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
                ✓ saved
              </span>
            )}
          </div>
          <span className="text-xs text-muted2">
            {exercise.sets}×{exercise.reps}
            {exercise.rest !== "-" && ` · ${exercise.rest} rest`}
          </span>
        </div>
        <span className="text-muted2 text-sm">{expanded ? "▾" : "▸"}</span>
      </button>

      {/* Expanded: set logging */}
      {expanded && !log.saved && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="mb-3 text-[10px] tracking-wider text-muted uppercase">
            Log your sets
          </p>

          <div className="flex flex-col gap-2">
            {log.actual.map((set, setIdx) => (
              <div
                key={setIdx}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-12 text-xs text-muted">Set {setIdx + 1}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) =>
                    onUpdateSet(index, setIdx, "reps", e.target.value)
                  }
                  className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent"
                />
                <span className="text-muted">×</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="kg"
                  value={set.weight}
                  onChange={(e) =>
                    onUpdateSet(index, setIdx, "weight", e.target.value)
                  }
                  className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">kg</span>
              </div>
            ))}
          </div>

          <textarea
            placeholder="Notes (optional)"
            value={log.note}
            onChange={(e) => onUpdateNote(index, e.target.value)}
            rows={2}
            className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent resize-none"
          />

          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => onSave(index)}
          >
            Save exercise
          </Button>
        </div>
      )}

      {/* Expanded: saved summary */}
      {expanded && log.saved && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1 text-xs text-muted2">
            {log.actual
              .filter((s) => s.reps || s.weight)
              .map((s, i) => (
                <span key={i}>
                  Set {i + 1}: {s.reps} reps × {s.weight || "BW"} kg
                </span>
              ))}
          </div>
          {log.note && (
            <p className="mt-2 text-xs text-muted italic">{log.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Feedback Screen ──

function FeedbackScreen({
  onSubmit,
}: {
  onSubmit: (effort: number, soreness: number) => void;
}) {
  const [effort, setEffort] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);

  const effortLabels = ["Too easy", "Moderate", "Hard", "Max effort"];
  const sorenessLabels = ["Fresh", "A little sore", "Pretty sore", "Beat up"];

  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wide text-accent">
          Session complete
        </h2>
        <p className="mt-2 text-sm text-muted2">How did it go?</p>
      </div>

      {/* Effort */}
      <div className="mb-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">
          Effort
        </p>
        <div className="grid grid-cols-4 gap-2">
          {effortLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setEffort(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                effort === i + 1
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Soreness */}
      <div className="mb-8">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">
          How does your body feel?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {sorenessLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setSoreness(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                soreness === i + 1
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={effort === null || soreness === null}
        onClick={() => onSubmit(effort!, soreness!)}
      >
        Save & return to week
      </Button>
    </div>
  );
}
