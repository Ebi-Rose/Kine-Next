"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore, type SessionRecord } from "@/store/useKineStore";
import { kgToDisplay, weightUnit, formatDateLong, formatDateShortLocale, detectLocale } from "@/lib/format";
import { appNow, appTodayISO } from "@/lib/dev-time";
import BottomSheet from "@/components/BottomSheet";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function CalendarPage() {
  const router = useRouter();
  const { progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const sessions = progressDB.sessions;

  const [viewMonth, setViewMonth] = useState(() => appNow().getMonth());
  const [viewYear, setViewYear] = useState(() => appNow().getFullYear());
  const [selectedLift, setSelectedLift] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Session dates for the month
  const sessionsByDate: Record<string, SessionRecord[]> = {};
  sessions.forEach((s) => {
    if (s.date) {
      if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
      sessionsByDate[s.date].push(s);
    }
  });

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const todayStr = appTodayISO();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  // Pad to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function getDateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Stats for month
  const monthSessions = sessions.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  // Lift history
  const liftNames = Object.keys(progressDB.lifts).filter(
    (k) => Array.isArray(progressDB.lifts[k]) && progressDB.lifts[k].length > 0
  );

  // Selected day sessions
  const daySessionList = selectedDay ? sessionsByDate[selectedDay] || [] : [];

  return (
    <div>
      <button onClick={() => router.back()} className="text-[13px] text-muted hover:text-text transition-colors mb-2">
        ← Back
      </button>
      <h1 className="font-display text-2xl tracking-wide text-accent">Calendar</h1>

      {sessions.length === 0 && (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text mb-1">No sessions yet</p>
          <p className="text-xs text-muted2">Complete your first workout and it will appear here.</p>
        </div>
      )}

      {/* Month nav */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={prevMonth} className="text-muted2 hover:text-text px-3 py-1 rounded-lg hover:bg-surface2 transition-all">←</button>
        <span className="text-sm font-medium text-text">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="text-muted2 hover:text-text px-3 py-1 rounded-lg hover:bg-surface2 transition-all">→</button>
      </div>

      {/* Month stats */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted2 font-light">
        <span>{monthSessions.length} session{monthSessions.length !== 1 ? "s" : ""}</span>
        {monthSessions.length > 0 && (
          <span>Avg effort: {(monthSessions.reduce((s, m) => s + (m.effort || 0), 0) / monthSessions.length).toFixed(1)}/4</span>
        )}
      </div>

      {/* Day headers */}
      <div className="mt-4 grid grid-cols-7 gap-0 text-center">
        {DAYS_SHORT.map((d) => (
          <span key={d} className="text-[10px] text-muted font-light py-1">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />;
          const dateStr = getDateStr(day);
          const daySessions = sessionsByDate[dateStr] || [];
          const hasSession = daySessions.length > 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all relative ${
                isSelected
                  ? "bg-accent text-bg font-medium"
                  : hasSession
                    ? "text-text"
                    : isToday
                      ? "text-accent"
                      : "text-muted2 hover:text-text"
              }`}
            >
              <span className={isToday && !isSelected ? "underline underline-offset-2 decoration-accent" : ""}>
                {day}
              </span>
              {hasSession && !isSelected && (
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {daySessions.slice(0, 3).map((_, j) => (
                    <div key={j} className="h-1 w-1 rounded-full bg-accent" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 animate-fade-up">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            {formatDateLong(selectedDay)}
          </p>
          {daySessionList.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-muted2">No sessions on this day</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {daySessionList.map((session, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-sm font-medium text-text">{session.title || "Session"}</p>
                  <div className="flex gap-3 mt-1 text-[11px] text-muted2 font-light">
                    {session.weekNum && <span>Week {session.weekNum}</span>}
                    {session.effort && <span>Effort: {session.effort}/4</span>}
                    {session.soreness && <span>Soreness: {session.soreness}/4</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lift progression */}
      {liftNames.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs tracking-wider text-muted uppercase">Lift progression</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {liftNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedLift(selectedLift === name ? null : name)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                  selectedLift === name
                    ? "border-accent bg-accent-dim text-text"
                    : "border-border text-muted2 hover:border-border-active"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {selectedLift && (() => {
            const entries = progressDB.lifts[selectedLift];
            const isBodyweight = entries.every((e) => e.weight === 0);
            // Use reps as the charted metric for bodyweight exercises
            const metricFn = (e: { weight: number; reps: number }) => isBodyweight ? e.reps : e.weight;
            const metricLabel = (e: { weight: number; reps: number }) =>
              isBodyweight
                ? `${e.reps} reps`
                : `${kgToDisplay(e.weight, system)}${unit} × ${e.reps}`;

            // Group entries by date for the history view
            const byDate = new Map<string, typeof entries>();
            for (const e of entries) {
              const list = byDate.get(e.date) || [];
              list.push(e);
              byDate.set(e.date, list);
            }
            const dates = [...byDate.keys()].sort().reverse().slice(0, 6);

            // Best set per date for the chart (use max metric value)
            const chartPoints = [...byDate.entries()]
              .map(([date, sets]) => ({
                date,
                best: sets.reduce((a, b) => metricFn(a) >= metricFn(b) ? a : b),
              }))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-12);

            const chartValues = chartPoints.map((p) => metricFn(p.best));
            const chartMax = Math.max(...chartValues);
            const chartMin = Math.min(...chartValues);
            const chartRange = chartMax - chartMin || 1;

            // Overall best
            const best = entries.reduce((a, b) => metricFn(a) >= metricFn(b) ? a : b, entries[0]);
            // Trend
            const trend = chartPoints.length >= 2
              ? metricFn(chartPoints[chartPoints.length - 1].best) - metricFn(chartPoints[chartPoints.length - 2].best)
              : 0;

            return (
              <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4 animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-text">{selectedLift}</p>
                  <div className="flex items-center gap-1.5">
                    {trend > 0 && <span className="text-[10px] text-success">↑</span>}
                    {trend < 0 && <span className="text-[10px] text-accent">↓</span>}
                    <span className="text-[10px] text-muted2">{byDate.size} session{byDate.size !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="flex gap-4 text-[11px] text-muted2 mb-4">
                  <span>Best: {metricLabel(best)}</span>
                  <span>Latest: {metricLabel(entries[entries.length - 1])}</span>
                </div>

                {/* Chart */}
                {chartPoints.length >= 2 && (
                  <div className="mb-4">
                    <div className="h-28 flex items-end gap-1">
                      {chartPoints.map((point, i) => {
                        const val = metricFn(point.best);
                        const h = ((val - chartMin) / chartRange) * 100;
                        const isLatest = i === chartPoints.length - 1;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className={`text-[8px] ${isLatest ? "text-text" : "text-muted"}`}>
                              {isBodyweight ? val : kgToDisplay(val, system)}
                            </span>
                            <div
                              className={`w-full rounded-t transition-colors ${
                                isLatest ? "bg-accent" : "bg-accent/30"
                              }`}
                              style={{ height: `${Math.max(h, 10)}%` }}
                            />
                            <span className="text-[7px] text-muted">
                              {formatDateShortLocale(point.date).split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* History grouped by date */}
                <div className="flex flex-col gap-2">
                  {dates.map((date) => {
                    const sets = byDate.get(date)!;
                    return (
                      <div key={date} className="flex items-start gap-3">
                        <span className="text-[11px] text-muted w-12 shrink-0 pt-0.5">
                          {formatDateShortLocale(date)}
                        </span>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {sets.map((s, j) => (
                            <span key={j} className="text-[11px] text-text">
                              {metricLabel(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
