"use client";

import Link from "next/link";
import { findExercise } from "@/data/exercise-library";
import { CATEGORY_COLORS } from "@/data/constants";
import { DAY_LABELS } from "@/data/constants";
import { appNow } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";

function getCategoryColor(exerciseName: string): string {
  const ex = findExercise(exerciseName);
  return ex ? CATEGORY_COLORS[ex.muscle] : "var(--color-muted)";
}

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
      <div className="relative overflow-hidden rounded-2xl mb-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg-opt.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        <div className="relative z-10 text-center py-12 px-6">
          <h2 className="font-display text-xl tracking-[0.08em] text-text">
            REST DAY
          </h2>
          <p className="mt-2 text-sm text-muted2 font-light max-w-xs mx-auto">{restMessage}</p>
        </div>
      </div>

      {/* Tomorrow's session preview — same look as a regular DayCard */}
      {nextDay && (() => {
        const daysAhead = nextTrainingDay - todayIdx;
        const date = new Date(appNow());
        date.setDate(date.getDate() + daysAhead);
        const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-GB";
        const dateStr = date.toLocaleDateString(locale, { day: "numeric", month: "short" });
        const dayLabel = DAY_LABELS[(nextDay.dayNumber - 1) % 7];

        return (
          <div className="rounded-[10px] border border-border bg-surface p-4 hover:border-border-active transition-colors">
            {/* Day header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted2">
                {dayLabel}
                <span className="text-muted font-light ml-1">{dateStr}</span>
              </span>
              <span className="font-display text-[9px] tracking-[2px] text-muted uppercase">
                {nextDay.sessionDuration}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-2 font-display text-lg tracking-wide text-text" style={{ fontSize: "clamp(18px, 5vw, 22px)" }}>
              {nextDay.sessionTitle}
            </h3>

            {/* Summary row */}
            <div className="mt-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted2 font-light truncate flex-1">
                  {nextDay.exercises.length} exercises · {nextDay.sessionDuration}
                </p>
                <Link
                  href={`/app/pre-session?day=${nextTrainingDay}`}
                  className="text-[10px] text-accent hover:underline shrink-0 ml-2"
                >
                  View →
                </Link>
              </div>
              {nextDay.coachNote && (
                <p className="mt-1.5 text-[10px] text-muted font-light leading-relaxed truncate">
                  {nextDay.coachNote}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {nextDay.exercises.slice(0, 3).map((ex, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[9px] text-muted2 bg-surface2/50 rounded px-1.5 py-0.5"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: getCategoryColor(ex.name) }}
                    />
                    {ex.name}
                  </span>
                ))}
                {nextDay.exercises.length > 3 && (
                  <span className="text-[9px] text-muted">+{nextDay.exercises.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
