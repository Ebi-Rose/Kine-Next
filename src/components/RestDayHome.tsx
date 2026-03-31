"use client";

import { useKineStore } from "@/store/useKineStore";
import { getCurrentPhase } from "@/lib/cycle";
import { findExercise } from "@/data/exercise-library";
import { ANATOMY_CUES } from "@/data/anatomy-cues";
import type { WeekData } from "@/lib/week-builder";

const PHASE_INSIGHTS: Record<string, string> = {
  menstrual:
    "Your body is in its natural recovery window. Energy may be lower — that's your physiology working as designed, not a setback.",
  follicular:
    "Rising oestrogen is boosting your recovery capacity. Tomorrow's session lands in a great adaptation window.",
  ovulatory:
    "You're near your peak energy phase. Rest today sets you up to make the most of it tomorrow.",
  luteal:
    "Your body is prioritising recovery right now. That's normal, not a setback.",
};

const REST_COPY = [
  "Your body is adapting even now.",
  "Recovery is where the work becomes results.",
  "Adaptation happens during rest, not during training.",
  "Rest is part of the programme, not a gap in it.",
];

export default function RestDayHome({
  week,
  todayIdx,
}: {
  week: WeekData;
  todayIdx: number;
}) {
  const { cycleType, cycle, eduMode } = useKineStore();

  // Cycle phase
  const phase =
    cycleType === "regular"
      ? getCurrentPhase(cycle.periodLog, cycle.avgLength)
      : null;

  // Find next training day
  const nextTrainingDay = week.days.findIndex(
    (d, i) => i > todayIdx && !d.isRest
  );
  const nextDay = nextTrainingDay >= 0 ? week.days[nextTrainingDay] : null;

  // Get a form tip for the first exercise of the next session
  const firstExercise = nextDay?.exercises?.[0];
  const formTip = getFormTip(firstExercise?.name);
  const showFormTip = eduMode !== "silent" && formTip;

  // Rest day copy — rotate by week day
  const restMessage = REST_COPY[todayIdx % REST_COPY.length];

  return (
    <div>
      {/* Rest day hero */}
      <div className="text-center py-5 mb-4">
        <h2 className="font-display text-xl tracking-[0.08em] text-text">
          REST DAY
        </h2>
        <p className="mt-1 text-sm text-muted2 font-light">{restMessage}</p>
      </div>

      {/* Cycle insight — only for regular cycle with phase data */}
      {phase && (
        <div className="rounded-[10px] border border-border bg-surface p-4 mb-3">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted font-normal mb-2">
            Cycle insight
          </p>
          <p className="text-[13px] text-text font-light leading-relaxed">
            You&apos;re on{" "}
            <strong className="text-accent font-medium">
              day {phase.day}
            </strong>{" "}
            of your cycle — {phase.label.toLowerCase()} phase.{" "}
            {PHASE_INSIGHTS[phase.phase] || ""}
          </p>
        </div>
      )}

      {/* Tomorrow's session preview */}
      {nextDay && (
        <div className="rounded-[10px] border border-border bg-surface p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.15em] uppercase text-muted">
              {nextTrainingDay === todayIdx + 1 ? "Tomorrow" : "Next session"}
            </span>
            <span className="text-[13px] font-medium text-text">
              {nextDay.sessionTitle} · {nextDay.sessionDuration}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {nextDay.exercises.map((ex, i) => {
              const lib = findExercise(ex.name);
              const color = lib
                ? `var(--color-cat-${lib.muscle})`
                : "var(--color-muted)";
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted2 font-light"
                >
                  <span
                    className="inline-block w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  {ex.name} · {ex.sets} × {ex.reps}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form tip — revelation voice, gated by eduMode */}
      {showFormTip && (
        <div className="rounded-[10px] border border-border bg-surface p-4 mb-3">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted font-normal mb-2">
            Something to know for{" "}
            {nextTrainingDay === todayIdx + 1 ? "tomorrow" : "next session"}
          </p>
          <p className="text-sm font-medium text-text mb-1.5">
            {firstExercise?.name}
          </p>
          <p className="text-xs text-muted2 font-light leading-relaxed">
            {formTip}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get a revelation-voiced form tip for an exercise.
 * Uses anatomy cues if available, falls back to null.
 */
function getFormTip(exerciseName: string | undefined): string | null {
  if (!exerciseName) return null;

  // Check anatomy cues first
  const cues =
    (ANATOMY_CUES as Record<string, { sign: string; note: string }[]>)[
      exerciseName
    ];
  if (cues && cues.length > 0) {
    // Pick the first cue's note — these are already in revelation voice
    return cues[0].note;
  }

  return null;
}
