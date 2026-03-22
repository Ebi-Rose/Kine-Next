// ── Periodisation — Block Phase Management ──

export type Phase = "build" | "peak" | "deload";

export interface PhaseInfo {
  phase: Phase;
  label: string;
  weekInPhase: number;
  totalWeeksInPhase: number;
  description: string;
}

/**
 * Standard periodisation: 3 weeks build, 1 week peak, 1 week deload (5-week cycle).
 * Adjusted by phaseOffset for held phases.
 */
export function getCurrentPhase(
  currentWeek: number,
  phaseOffset: number = 0
): PhaseInfo {
  const adjustedWeek = currentWeek - phaseOffset;
  const cycleWeek = ((adjustedWeek - 1) % 5) + 1; // 1-5

  if (cycleWeek <= 3) {
    return {
      phase: "build",
      label: "Build",
      weekInPhase: cycleWeek,
      totalWeeksInPhase: 3,
      description: "Progressive loading. Add weight or reps each week.",
    };
  }

  if (cycleWeek === 4) {
    return {
      phase: "peak",
      label: "Peak",
      weekInPhase: 1,
      totalWeeksInPhase: 1,
      description: "Test your progress. Heavier loads, fewer reps.",
    };
  }

  return {
    phase: "deload",
    label: "Deload",
    weekInPhase: 1,
    totalWeeksInPhase: 1,
    description: "Recovery week. Same movements, 50-60% of normal load. This is not a rest week — it's how your body absorbs the training.",
  };
}

/**
 * Check if a deload should be triggered based on feedback patterns.
 * If average effort is consistently high (3.5+) for 3+ sessions, suggest deload.
 */
export function shouldSuggestDeload(
  sessions: { effort?: number }[],
  lastNSessions: number = 6
): boolean {
  const recent = sessions.slice(-lastNSessions);
  if (recent.length < 3) return false;

  const avgEffort =
    recent.reduce((sum, s) => sum + (s.effort || 0), 0) / recent.length;

  return avgEffort >= 3.5;
}

/**
 * Get phase context for AI prompts.
 */
export function getPhaseContext(currentWeek: number, phaseOffset: number): string {
  const phase = getCurrentPhase(currentWeek, phaseOffset);
  return `Training phase: ${phase.label} (week ${phase.weekInPhase}/${phase.totalWeeksInPhase}). ${phase.description}`;
}
