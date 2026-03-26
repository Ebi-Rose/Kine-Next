"use client";

import { useKineStore } from "@/store/useKineStore";
import { getBlockNumber, getBlockWeek, shouldDeload, getEffectiveNextPhase } from "@/lib/periodisation";

interface Props {
  weekNum: number;
}

export default function BlockSummary({ weekNum }: Props) {
  const { progressDB, days } = useKineStore();
  const phaseOffset = progressDB.phaseOffset;
  const blockWeek = getBlockWeek(weekNum, phaseOffset);
  const blockNum = getBlockNumber(weekNum, phaseOffset);
  const plannedDays = parseInt(days || "3");

  // Block ends at week 3 (3-week progressive blocks)
  const isBlockEnd = blockWeek === 3;

  // Autoregulated deload check
  const lastDeloadWeek = (progressDB as { lastDeloadWeek?: number }).lastDeloadWeek || 0;
  const feedbackHistory = progressDB.weekFeedbackHistory as { effort: number; soreness: number }[] | undefined;
  const latestCheckIn = feedbackHistory?.length ? feedbackHistory[feedbackHistory.length - 1] : undefined;
  const needsDeload = shouldDeload(
    weekNum, phaseOffset,
    progressDB.sessions as { weekNum?: number; soreness?: number }[],
    lastDeloadWeek,
    latestCheckIn,
  );

  // Get week sessions stats
  const weekSessions = (progressDB.sessions as { weekNum?: number; effort?: number; soreness?: number }[])
    .filter((s) => s.weekNum === weekNum);
  const avgEffort = weekSessions.length
    ? (weekSessions.reduce((a, s) => a + (s.effort || 2), 0) / weekSessions.length).toFixed(1)
    : "—";
  const avgSoreness = weekSessions.length
    ? (weekSessions.reduce((a, s) => a + (s.soreness || 2), 0) / weekSessions.length).toFixed(1)
    : "—";

  // Next week preview
  const { phase: nextPhase, held, deloading, adherence } = getEffectiveNextPhase(
    weekNum, phaseOffset, plannedDays,
    progressDB.sessions as { weekNum?: number; soreness?: number }[],
    progressDB.skippedSessions as { weekNum?: number; movedTo?: number | null }[],
    lastDeloadWeek,
    latestCheckIn,
  );

  if (!isBlockEnd && !needsDeload) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 mb-4 animate-fade-up">
      {/* Block completion */}
      {isBlockEnd && !deloading && (
        <div className="mb-3">
          <p className="text-[10px] text-accent font-display tracking-wider">BLOCK {blockNum} COMPLETE</p>
          <p className="text-xs text-muted2 font-light mt-1">
            {weekSessions.length} sessions completed. Avg effort: {avgEffort}/4. Avg soreness: {avgSoreness}/4.
          </p>
        </div>
      )}

      {/* Autoregulated deload triggered */}
      {deloading && (
        <div className="mb-3">
          <p className="text-[10px] text-accent font-display tracking-wider">RECOVERY WEEK TRIGGERED</p>
          <p className="text-xs text-muted2 font-light mt-1">
            Your body is asking for recovery — next week is lighter. This is based on your recent effort and soreness, not a fixed schedule.
          </p>
        </div>
      )}

      {/* Next week preview */}
      <div className="border-t border-border pt-3 mt-1">
        <p className="text-[10px] text-muted font-display tracking-wider mb-2">NEXT WEEK</p>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Phase</span>
            <span className="text-text">{nextPhase.name} — {nextPhase.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Rep range</span>
            <span className="text-text">{nextPhase.repRange}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Intensity</span>
            <span className="text-text">{nextPhase.intensity}</span>
          </div>
          {nextPhase.loadMod !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Load change</span>
              <span className="text-text">{nextPhase.loadMod > 0 ? "+" : ""}{nextPhase.loadMod}%</span>
            </div>
          )}
          {held && (
            <div className="mt-1 text-[10px] text-accent/80 font-light">
              Phase held — {adherence.level === "none" ? "no sessions completed" : "not enough sessions to justify progression"}.
              Complete more sessions to advance.
            </div>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted2 font-light leading-relaxed">
          {nextPhase.description}
        </p>
      </div>
    </div>
  );
}
