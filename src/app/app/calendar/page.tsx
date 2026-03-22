"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface SessionRecord {
  date?: string;
  title?: string;
  effort?: number;
}

export default function CalendarPage() {
  const router = useRouter();
  const { progressDB } = useKineStore();
  const sessions = progressDB.sessions as SessionRecord[];

  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [selectedLift, setSelectedLift] = useState<string | null>(null);

  // Get session dates for the month
  const sessionDates = new Set(sessions.map((s) => s.date).filter(Boolean));

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  // Lift history
  const liftNames = Object.keys(progressDB.lifts).filter(
    (k) => Array.isArray(progressDB.lifts[k]) && progressDB.lifts[k].length > 0
  );

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Calendar</h1>

      {/* Month nav */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={prevMonth} className="text-muted2 hover:text-text px-2 py-1">←</button>
        <span className="text-sm font-medium text-text">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="text-muted2 hover:text-text px-2 py-1">→</button>
      </div>

      {/* Day headers */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {DAYS_SHORT.map((d) => (
          <span key={d} className="text-[10px] text-muted">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasSession = sessionDates.has(dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];

          return (
            <div
              key={i}
              className={`flex h-9 items-center justify-center rounded-lg text-xs transition-all ${
                hasSession
                  ? "bg-accent text-bg font-medium"
                  : isToday
                    ? "border border-accent text-accent"
                    : "text-muted2"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Lift chart */}
      {liftNames.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs tracking-wider text-muted uppercase">Lift progression</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {liftNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedLift(selectedLift === name ? null : name)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  selectedLift === name
                    ? "border-accent bg-accent-dim text-text"
                    : "border-border text-muted2 hover:border-border-active"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {selectedLift && (
            <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text mb-3">{selectedLift}</p>
              <div className="flex flex-col gap-1">
                {progressDB.lifts[selectedLift].map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{entry.date}</span>
                    <span className="text-text">{entry.weight}kg × {entry.reps}</span>
                  </div>
                ))}
              </div>
              {progressDB.lifts[selectedLift].length >= 2 && (
                <div className="mt-3 h-20 flex items-end gap-1">
                  {progressDB.lifts[selectedLift].map((entry, i) => {
                    const maxW = Math.max(...progressDB.lifts[selectedLift].map((e) => e.weight));
                    const height = maxW > 0 ? (entry.weight / maxW) * 100 : 50;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-accent/60"
                        style={{ height: `${Math.max(height, 10)}%` }}
                        title={`${entry.weight}kg × ${entry.reps}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
