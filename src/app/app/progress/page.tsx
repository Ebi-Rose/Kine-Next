"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { calculateORM } from "@/lib/progression";
import { formatRelativeDate } from "@/lib/date-utils";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import Link from "next/link";

interface SessionRecord {
  title?: string;
  date?: string;
  weekNum?: number;
  effort?: number;
  soreness?: number;
  prs?: { name: string; weight: number; reps: number }[];
  logs?: Record<string, unknown>;
}

export default function ProgressPage() {
  const { progressDB } = useKineStore();
  const { sessions, currentWeek, lifts, programStartDate } = progressDB;
  const [selectedLift, setSelectedLift] = useState<string | null>(null);
  const [showORM, setShowORM] = useState(false);
  const [ormWeight, setOrmWeight] = useState("");
  const [ormReps, setOrmReps] = useState("");
  const [replaySession, setReplaySession] = useState<SessionRecord | null>(null);

  const totalSessions = sessions.length;
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
        <StatCard label="Week" value={String(currentWeek)} />
        <StatCard label="PRs" value={String(totalPRs)} />
        <StatCard label="Avg effort" value={avgEffort} />
      </div>

      {/* Journey summary */}
      {totalSessions > 0 && programStartDate && (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <p className="text-xs text-muted2">
            {totalSessions} session{totalSessions > 1 ? "s" : ""} completed across {currentWeek} week{currentWeek > 1 ? "s" : ""}.
            {totalPRs > 0 && ` ${totalPRs} personal record${totalPRs > 1 ? "s" : ""} set.`}
          </p>
        </div>
      )}

      {/* Tools */}
      <div className="mt-6 flex gap-2 flex-wrap">
        <Link href="/app/photos"
          className="inline-flex items-center rounded-[var(--radius-default)] border border-border bg-surface px-3 py-1.5 text-xs text-muted2 hover:border-border-active transition-all">
          Photos
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setShowORM(true)}>
          1RM Calculator
        </Button>
      </div>

      {/* Lift tracking */}
      {liftNames.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs tracking-wider text-muted uppercase">Lift history</h2>
          <div className="flex flex-col gap-2">
            {liftNames.map((name) => {
              const entries = lifts[name];
              const latest = entries[entries.length - 1];
              const best = entries.reduce((b, e) => e.weight > b.weight ? e : b, entries[0]);
              const orm = calculateORM(best.weight, best.reps);

              return (
                <button
                  key={name}
                  onClick={() => setSelectedLift(selectedLift === name ? null : name)}
                  className={`rounded-[var(--radius-default)] border p-4 text-left transition-all ${
                    selectedLift === name ? "border-accent bg-surface" : "border-border bg-surface hover:border-border-active"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">{name}</span>
                    <span className="text-xs text-muted2">{latest.weight}kg × {latest.reps}</span>
                  </div>
                  {selectedLift === name && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="flex gap-4 text-xs text-muted2 mb-2">
                        <span>Best: {best.weight}kg × {best.reps}</span>
                        <span>Est 1RM: {orm}kg</span>
                        <span>{entries.length} entries</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {entries.slice(-8).map((entry, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted">{entry.date}</span>
                            <span className="text-text">{entry.weight}kg × {entry.reps}</span>
                          </div>
                        ))}
                      </div>
                      {entries.length >= 2 && (
                        <div className="mt-3 h-16 flex items-end gap-1">
                          {entries.slice(-12).map((entry, i) => {
                            const maxW = Math.max(...entries.map((e) => e.weight));
                            const h = maxW > 0 ? (entry.weight / maxW) * 100 : 50;
                            return (
                              <div key={i} className="flex-1 rounded-t bg-accent/60" style={{ height: `${Math.max(h, 10)}%` }}
                                title={`${entry.weight}kg × ${entry.reps}`} />
                            );
                          })}
                        </div>
                      )}
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
          <input type="number" placeholder="Weight (kg)" value={ormWeight} onChange={(e) => setOrmWeight(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
          <input type="number" placeholder="Reps" value={ormReps} onChange={(e) => setOrmReps(e.target.value)}
            className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
        </div>
        {ormWeight && ormReps && (
          <div className="rounded-lg border border-accent bg-accent-dim p-4 text-center">
            <p className="text-xs text-muted2">Estimated 1RM</p>
            <p className="font-display text-3xl text-accent">
              {calculateORM(parseFloat(ormWeight), parseInt(ormReps))}kg
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
                    <p key={j} className="text-xs text-muted2">Set {j + 1}: {s.reps} × {s.weight || "BW"}kg</p>
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
