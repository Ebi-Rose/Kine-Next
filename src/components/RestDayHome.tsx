"use client";

import { findExercise } from "@/data/exercise-library";
import type { WeekData } from "@/lib/week-builder";

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
  // Find next training day
  const nextTrainingDay = week.days.findIndex(
    (d, i) => i > todayIdx && !d.isRest
  );
  const nextDay = nextTrainingDay >= 0 ? week.days[nextTrainingDay] : null;

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
    </div>
  );
}
