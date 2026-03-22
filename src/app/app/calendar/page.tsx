"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import BottomSheet from "@/components/BottomSheet";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface SessionRecord {
  date?: string;
  title?: string;
  effort?: number;
  soreness?: number;
  weekNum?: number;
  logs?: Record<string, unknown>;
}

export default function CalendarPage() {
  const router = useRouter();
  const { progressDB } = useKineStore();
  const sessions = progressDB.sessions as SessionRecord[];

  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
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
  const todayStr = new Date().toISOString().split("T")[0];

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
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
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
                className={`rounded-full border px-3 py-1 text-[11px] transition-all ${
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
            <div className="rounded-xl border border-border bg-surface p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text">{selectedLift}</p>
                <p className="text-[11px] text-muted2 font-light">{progressDB.lifts[selectedLift].length} entries</p>
              </div>

              {/* Bar chart */}
              {progressDB.lifts[selectedLift].length >= 2 && (
                <div className="h-24 flex items-end gap-[2px] mb-3">
                  {progressDB.lifts[selectedLift].slice(-16).map((entry, i) => {
                    const maxW = Math.max(...progressDB.lifts[selectedLift].map((e) => e.weight));
                    const h = maxW > 0 ? (entry.weight / maxW) * 100 : 50;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        <div
                          className="w-full rounded-t bg-accent/50 hover:bg-accent/80 transition-colors"
                          style={{ height: `${Math.max(h, 8)}%` }}
                          title={`${entry.weight}kg × ${entry.reps}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent entries */}
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {progressDB.lifts[selectedLift].slice(-8).reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted font-light">{entry.date}</span>
                    <span className="text-text">{entry.weight}kg × {entry.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
