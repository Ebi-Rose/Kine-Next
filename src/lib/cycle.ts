// ── Cycle Phase Tracking ──
// Calculates current menstrual cycle phase from period log

import type { PeriodLog } from "@/store/useKineStore";

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface PhaseInfo {
  phase: CyclePhase;
  day: number;
  label: string;
  description: string;
  trainingNote: string;
}

const PHASE_CONFIG: Record<CyclePhase, { label: string; description: string; trainingNote: string }> = {
  menstrual: {
    label: "Menstrual",
    description: "Days 1–5. Energy may be lower. Listen to your body.",
    trainingNote: "Reduce intensity if needed. Lighter loads, focus on movement quality. This is not a setback — it's part of the cycle.",
  },
  follicular: {
    label: "Follicular",
    description: "Days 6–13. Rising energy and strength potential.",
    trainingNote: "Great window for pushing intensity. Your body is primed for strength gains and new movements.",
  },
  ovulatory: {
    label: "Ovulatory",
    description: "Days 14–16. Peak energy and coordination.",
    trainingNote: "Your strongest phase. Go for PRs, test heavier loads, push compound movements.",
  },
  luteal: {
    label: "Luteal",
    description: "Days 17–28. Gradual energy decline, increased recovery needs.",
    trainingNote: "Maintain volume but consider reducing intensity in the later days. Focus on technique and consistency.",
  },
};

/**
 * Calculate current cycle phase from period log.
 * Returns null if no tracking data available.
 */
export function getCurrentPhase(
  periodLog: PeriodLog[],
  avgLength: number | null
): PhaseInfo | null {
  if (periodLog.length === 0) return null;

  // Find the most recent period start
  const starts = periodLog
    .filter((p) => p.type === "start")
    .map((p) => new Date(p.date))
    .sort((a, b) => b.getTime() - a.getTime());

  if (starts.length === 0) return null;

  const lastStart = starts[0];
  const cycleLength = avgLength || 28;
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Wrap around if past cycle length
  const cycleDay = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength + 1;

  let phase: CyclePhase;
  if (cycleDay <= 5) {
    phase = "menstrual";
  } else if (cycleDay <= 13) {
    phase = "follicular";
  } else if (cycleDay <= 16) {
    phase = "ovulatory";
  } else {
    phase = "luteal";
  }

  const config = PHASE_CONFIG[phase];

  return {
    phase,
    day: cycleDay,
    label: config.label,
    description: config.description,
    trainingNote: config.trainingNote,
  };
}

/**
 * Get cycle context string for AI prompts.
 */
export function getCycleContext(
  cycleType: string | null,
  periodLog: PeriodLog[],
  avgLength: number | null
): string {
  if (!cycleType || cycleType === "na") return "";
  if (cycleType === "hormonal") return "Cycle: hormonal contraception. Programme consistently.";
  if (cycleType === "irregular") return "Cycle: irregular. Adapt based on session feedback.";
  if (cycleType === "perimenopause") return "Cycle: perimenopause. Prioritise recovery and joint care.";

  const phase = getCurrentPhase(periodLog, avgLength);
  if (!phase) return "Cycle: regular but no tracking data yet.";

  return `Cycle: ${phase.label} phase (day ${phase.day}). ${phase.trainingNote}`;
}
