"use client";

import { useState } from "react";
import { useKineStore, type SessionRecord } from "@/store/useKineStore";
import { calculateORM } from "@/lib/progression";
import { formatRelativeDate } from "@/lib/date-utils";
import { kgToDisplay, weightUnit } from "@/lib/format";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import Link from "next/link";
import StrengthTrend from "@/components/StrengthTrend";

export default function ProgressPage() {
  const { progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const { sessions, currentWeek, lifts, programStartDate } = progressDB;
  const [selectedLift, setSelectedLift] = useState<string | null>(null);
  const [showORM, setShowORM] = useState(false);
  const [ormWeight, setOrmWeight] = useState("");
  const [ormReps, setOrmReps] = useState("");
  const [replaySession, setReplaySession] = useState<SessionRecord | null>(null);

  const totalSessions = sessions.length;

  // Compute actual weeks from session dates (more reliable than currentWeek counter)
  const weeksActive = (() => {
    if (totalSessions === 0 || !programStartDate) return currentWeek || 1;
    const sessionDates = (sessions as SessionRecord[]).map((s) => s.date).filter(Boolean);
    if (sessionDates.length === 0) return currentWeek || 1;
    const weeks = new Set(sessionDates.map((d) => {
      const date = new Date(d);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      return startOfWeek.toISOString().slice(0, 10);
    }));
    return Math.max(weeks.size, 1);
  })();
  const liftNames = Object.keys(lifts).filter(
    (k) => Array.isArray(lifts[k]) && lifts[k].length > 0
  );

  // PR count
  const totalPRs = (sessions as SessionRecord[]).reduce(
    (sum, s) => sum + (s.prs?.length || 0), 0
  );

  // Average effort
  const avgEffort = totalSessions > 0
    ? ((sessions as SessionRecord[]).reduce((sum, s) => sum + (s.effort || 0), 0) / totalSessions).toFixed(1)
    : "—";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-accent">Progress</h1>
        <Link href="/app/calendar" className="text-xs text-muted2 hover:text-accent transition-colors">
          Calendar →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <StatCard label="Sessions" value={String(totalSessions)} />
        <StatCard label="Week" value={String(weeksActive)} />
        <StatCard label="PRs" value={String(totalPRs)} />
        <StatCard label="Avg effort" value={avgEffort} />
      </div>

      {/* Journey summary */}
      {totalSessions > 0 && programStartDate && (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <p className="text-xs text-muted2">
            {totalSessions} session{totalSessions > 1 ? "s" : ""} completed across {weeksActive} week{weeksActive > 1 ? "s" : ""}.
            {totalPRs > 0 && ` ${totalPRs} personal record${totalPRs > 1 ? "s" : ""} set.`}
          </p>
        </div>
      )}

      {/* Strength trend — capability tracking with phase overlay */}
      <StrengthTrend />

      {/* Tools */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <Link href="/app/trends"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center hover:border-border-active transition-all">
          <span className="text-lg">📈</span>
          <span className="text-[10px] text-muted2 font-light">Trends</span>
        </Link>
        <Link href="/app/photos"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center hover:border-border-active transition-all">
          <span className="text-lg">📸</span>
          <span className="text-[10px] text-muted2 font-light">Photos</span>
        </Link>
        <button onClick={() => setShowORM(true)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center hover:border-border-active transition-all">
          <span className="text-lg">🏋️</span>
          <span className="text-[10px] text-muted2 font-light">1RM Calc</span>
        </button>
        <Link href="/app/calendar"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center hover:border-border-active transition-all">
          <span className="text-lg">📅</span>
          <span className="text-[10px] text-muted2 font-light">Calendar</span>
        </Link>
      </div>

      {/* Lift tracking */}
      {liftNames.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs tracking-wider text-muted uppercase">Lift history</h2>
          <div className="flex flex-col gap-2">
            {liftNames
              .sort((a, b) => {
                const aMax = lifts[a].reduce((m, e) => Math.max(m, e.weight), 0);
                const bMax = lifts[b].reduce((m, e) => Math.max(m, e.weight), 0);
                return bMax - aMax;
              })
              .map((name) => {
              const entries = lifts[name];
              const latest = entries[entries.length - 1];
              const best = entries.reduce((b, e) => e.weight > b.weight ? e : b, entries[0]);
              const orm = calculateORM(best.weight, best.reps);

              // Trend: compare last entry to 2nd-to-last
              const prev = entries.length >= 2 ? entries[entries.length - 2] : null;
              const trend = prev
                ? latest.weight > prev.weight ? "up" : latest.weight < prev.weight ? "down" : "flat"
                : "new";
              const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "flat" ? "→" : "✦";
              const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-accent" : "text-muted2";

              // Sparkline data (last 8 entries)
              const sparkData = entries.slice(-8);
              const sparkMax = Math.max(...sparkData.map(e => e.weight));
              const sparkMin = Math.min(...sparkData.map(e => e.weight));
              const sparkRange = sparkMax - sparkMin || 1;

              return (
                <button
                  key={name}
                  onClick={() => setSelectedLift(selectedLift === name ? null : name)}
                  className={`rounded-[var(--radius-default)] border p-4 text-left transition-all ${
                    selectedLift === name ? "border-accent bg-surface" : "border-border bg-surface hover:border-border-active"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Trend indicator */}
                    <span className={`text-sm font-medium ${trendColor}`}>{trendIcon}</span>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text">{name}</span>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-muted2">{kgToDisplay(latest.weight, system)}{unit} × {latest.reps}</span>
                        {best.weight > latest.weight && (
                          <span className="text-[10px] text-muted">Best: {kgToDisplay(best.weight, system)}{unit}</span>
                        )}
                      </div>
                    </div>

                    {/* Mini sparkline */}
                    {sparkData.length >= 2 && (
                      <div className="flex items-end gap-[2px] h-6 w-16 shrink-0">
                        {sparkData.map((entry, i) => {
                          const h = ((entry.weight - sparkMin) / sparkRange) * 100;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${i === sparkData.length - 1 ? "bg-accent" : "bg-accent/30"}`}
                              style={{ height: `${Math.max(h, 12)}%` }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedLift === name && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="flex gap-4 text-xs text-muted2 mb-3">
                        <span>Best: {kgToDisplay(best.weight, system)}{unit} × {best.reps}</span>
                        <span>Est 1RM: {kgToDisplay(orm, system)}{unit}</span>
                        <span>{entries.length} entries</span>
                      </div>

                      {/* Bigger chart */}
                      {entries.length >= 2 && (
                        <div className="mb-3 h-20 flex items-end gap-1">
                          {entries.slice(-12).map((entry, i) => {
                            const maxW = Math.max(...entries.map((e) => e.weight));
                            const minW = Math.min(...entries.map((e) => e.weight));
                            const range = maxW - minW || 1;
                            const h = ((entry.weight - minW) / range) * 100;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className="w-full rounded-t bg-accent/60" style={{ height: `${Math.max(h, 8)}%` }} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        {entries.slice(-8).reverse().map((entry, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted">{entry.date}</span>
                            <span className="text-text">{kgToDisplay(entry.weight, system)}{unit} × {entry.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className="mt-6">
        <h2 className="mb-3 text-xs tracking-wider text-muted uppercase">Recent sessions</h2>
        {totalSessions === 0 ? (
          <div className="rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted2">Complete your first session to see progress here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(sessions as SessionRecord[]).slice(-10).reverse().map((session, i) => (
              <button
                key={i}
                onClick={() => setReplaySession(session)}
                className="rounded-[var(--radius-default)] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{session.title || `Session`}</p>
                    <p className="text-xs text-muted2">
                      Week {session.weekNum} · {session.date ? formatRelativeDate(session.date) : ""}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted2">
                    {session.effort && <span>Effort {session.effort}/4</span>}
                    {session.prs && session.prs.length > 0 && (
                      <span className="text-accent">{session.prs.length} PR{session.prs.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ORM Calculator */}
      <BottomSheet open={showORM} onClose={() => setShowORM(false)} title="1RM Calculator">
        <p className="text-xs text-muted2 mb-4">Enter a weight and reps to estimate your one-rep max (Brzycki formula).</p>
        <div className="flex gap-3 mb-4">
          <input type="number" placeholder={`Weight (${unit})`} aria-label={`Weight in ${unit}`} value={ormWeight} onChange={(e) => setOrmWeight(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
          <input type="number" placeholder="Reps" aria-label="Number of reps" value={ormReps} onChange={(e) => setOrmReps(e.target.value)}
            className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
        </div>
        {ormWeight && ormReps && (
          <div className="rounded-lg border border-accent bg-accent-dim p-4 text-center">
            <p className="text-xs text-muted2">Estimated 1RM</p>
            <p className="font-display text-3xl text-accent">
              {calculateORM(parseFloat(ormWeight), parseInt(ormReps))}{unit}
            </p>
          </div>
        )}
      </BottomSheet>

      {/* Session Replay */}
      <BottomSheet open={!!replaySession} onClose={() => setReplaySession(null)} title={replaySession?.title || "Session"}>
        {replaySession && (
          <div>
            <p className="text-xs text-muted2 mb-4">
              {replaySession.date} · Week {replaySession.weekNum} · Effort: {replaySession.effort}/4
            </p>
            {replaySession.logs && Object.values(replaySession.logs).map((ex: unknown, i) => {
              const e = ex as { name: string; actual: { reps: string; weight: string }[]; note?: string };
              if (!e.name) return null;
              return (
                <div key={i} className="mb-3 rounded-lg border border-border bg-bg p-3">
                  <p className="text-sm font-medium text-text">{e.name}</p>
                  {e.actual?.filter(s => s.reps || s.weight).map((s, j) => (
                    <p key={j} className="text-xs text-muted2">Set {j + 1}: {s.reps} × {s.weight || "BW"}{unit}</p>
                  ))}
                  {e.note && <p className="mt-1 text-xs text-muted italic">{e.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border bg-surface p-3 text-center">
      <p className="font-display text-xl text-accent">{value}</p>
      <p className="mt-0.5 text-[9px] tracking-wider text-muted uppercase">{label}</p>
    </div>
  );
}
