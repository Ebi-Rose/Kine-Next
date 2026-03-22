"use client";

import { useKineStore } from "@/store/useKineStore";

export default function ProgressPage() {
  const { progressDB } = useKineStore();
  const { sessions, currentWeek, lifts } = progressDB;

  const totalSessions = sessions.length;
  const liftNames = Object.keys(lifts).filter(
    (k) => Array.isArray(lifts[k]) && lifts[k].length > 0
  );

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">
        Progress
      </h1>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Sessions" value={String(totalSessions)} />
        <StatCard label="Week" value={String(currentWeek)} />
        <StatCard label="Lifts tracked" value={String(liftNames.length)} />
      </div>

      {/* Recent sessions */}
      <div className="mt-8">
        <h2 className="text-xs tracking-wider text-muted uppercase mb-3">
          Recent sessions
        </h2>

        {totalSessions === 0 ? (
          <div className="rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted2">
              Complete your first session to see progress here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(sessions as SessionRecord[])
              .slice(-10)
              .reverse()
              .map((session, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-default)] border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {session.title || `Session ${totalSessions - i}`}
                      </p>
                      <p className="text-xs text-muted2">
                        Week {session.weekNum} · {session.date}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-muted2">
                      {session.effort && (
                        <span>Effort: {session.effort}/4</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Lift tracking */}
      {liftNames.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs tracking-wider text-muted uppercase mb-3">
            Lift history
          </h2>
          <div className="flex flex-col gap-2">
            {liftNames.map((name) => {
              const entries = lifts[name];
              const latest = entries[entries.length - 1];
              return (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-4"
                >
                  <span className="text-sm text-text">{name}</span>
                  <span className="text-xs text-muted2">
                    {latest.weight}kg × {latest.reps} reps
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4 text-center">
      <p className="font-display text-2xl text-accent">{value}</p>
      <p className="mt-1 text-[10px] tracking-wider text-muted uppercase">
        {label}
      </p>
    </div>
  );
}

interface SessionRecord {
  title?: string;
  date?: string;
  weekNum?: number;
  effort?: number;
  soreness?: number;
}
