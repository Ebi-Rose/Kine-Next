// ── Periodisation — 4-Week Block Structure ──
// Accumulation → Intensification → Peak → Deload

export type PhaseName = "Accumulation" | "Intensification" | "Peak" | "Deload";

export interface BlockPhase {
  name: PhaseName;
  label: string;
  description: string;
  loadMod: number;
  volMod: string;
  repRange: string;
  intensity: string;
}

const BLOCK_PHASES: Record<number, BlockPhase> = {
  1: {
    name: "Accumulation",
    label: "VOLUME WEEK",
    description: "Building your base — higher reps, moderate load, more sets. The goal is muscle adaptation through volume.",
    loadMod: 0,
    volMod: "+1 set on main lifts",
    repRange: "10-12",
    intensity: "moderate",
  },
  2: {
    name: "Intensification",
    label: "STRENGTH WEEK",
    description: "Load goes up, reps come down. Same movements, heavier. This is where strength is built on the volume base.",
    loadMod: 7.5,
    volMod: "Volume maintained — heavier focus",
    repRange: "6-8",
    intensity: "high",
  },
  3: {
    name: "Peak",
    label: "PEAK WEEK",
    description: "Your strongest week of the block. Push your main lifts hard. This is what the previous two weeks were building toward.",
    loadMod: 12.5,
    volMod: "Reduced accessories — focus on compounds",
    repRange: "4-6",
    intensity: "very high",
  },
  4: {
    name: "Deload",
    label: "DELOAD WEEK",
    description: "Planned recovery. Same movements, significantly lighter. Your body needs this to consolidate gains before the next block.",
    loadMod: -20,
    volMod: "-30-40% sets — recovery priority",
    repRange: "12-15",
    intensity: "low",
  },
};

/**
 * Get the week number within the current 4-week block (1-4).
 */
export function getBlockWeek(weekNum: number, phaseOffset: number = 0): number {
  const effective = weekNum - phaseOffset;
  return ((Math.max(1, effective) - 1) % 4) + 1;
}

/**
 * Get the block number (1, 2, 3, ...).
 */
export function getBlockNumber(weekNum: number, phaseOffset: number = 0): number {
  const effective = weekNum - phaseOffset;
  return Math.ceil(Math.max(1, effective) / 4);
}

/**
 * Get the current phase for a given week.
 */
export function getPhase(weekNum: number, phaseOffset: number = 0): BlockPhase {
  return BLOCK_PHASES[getBlockWeek(weekNum, phaseOffset)];
}

/**
 * Get the next week's phase.
 */
export function getNextPhase(weekNum: number, phaseOffset: number = 0): BlockPhase {
  return BLOCK_PHASES[getBlockWeek(weekNum + 1, phaseOffset)];
}

/**
 * Check if a deload should happen.
 * - Structured: week 4 of every block
 * - Emergency: avg soreness >= 3.8 over the current week
 */
export function shouldDeload(
  weekNum: number,
  phaseOffset: number,
  sessions: { weekNum?: number; soreness?: number }[]
): boolean {
  // Structured deload at week 4
  if (getBlockWeek(weekNum + 1, phaseOffset) === 4) return true;

  // Emergency deload
  const weekSessions = sessions.filter((s) => s.weekNum === weekNum);
  if (weekSessions.length === 0) return false;
  const avgSoreness =
    weekSessions.reduce((a, s) => a + (s.soreness || 2), 0) / weekSessions.length;
  return avgSoreness >= 3.8;
}

/**
 * Week adherence check — determines if user completed enough to justify phase advancement.
 */
export function getWeekAdherence(
  weekNum: number,
  plannedDays: number,
  sessions: { weekNum?: number }[],
  skippedSessions: { weekNum?: number; movedTo?: number | null }[]
): { planned: number; done: number; skipped: number; ratio: number; level: "none" | "partial" | "sufficient" | "full" } {
  const done = sessions.filter((s) => s.weekNum === weekNum).length;
  const skipped = skippedSessions.filter(
    (s) => s.weekNum === weekNum && s.movedTo === null
  ).length;
  const ratio = plannedDays > 0 ? done / plannedDays : 0;
  const level =
    done === 0 ? "none" :
    ratio < 0.5 ? "partial" :
    done >= plannedDays ? "full" :
    "sufficient";
  return { planned: plannedDays, done, skipped, ratio, level };
}

/**
 * Get the effective next phase, holding current if adherence too low.
 */
export function getEffectiveNextPhase(
  weekNum: number,
  phaseOffset: number,
  plannedDays: number,
  sessions: { weekNum?: number }[],
  skippedSessions: { weekNum?: number; movedTo?: number | null }[]
): { phase: BlockPhase; held: boolean; adherence: ReturnType<typeof getWeekAdherence> } {
  const adherence = getWeekAdherence(weekNum, plannedDays, sessions, skippedSessions);
  const naturalNext = getNextPhase(weekNum, phaseOffset);
  const currentPhase = getPhase(weekNum, phaseOffset);

  // Full or sufficient → advance
  if (adherence.level === "full" || adherence.level === "sufficient") {
    return { phase: naturalNext, held: false, adherence };
  }

  // Deload always advances (it's recovery, not training)
  if (currentPhase.name === "Deload") {
    return { phase: naturalNext, held: false, adherence };
  }

  // Hold at current phase
  return { phase: currentPhase, held: true, adherence };
}

/**
 * Get phase context string for AI prompts.
 */
export function getPhaseContext(weekNum: number, phaseOffset: number): string {
  const phase = getPhase(weekNum, phaseOffset);
  const blockNum = getBlockNumber(weekNum, phaseOffset);
  const blockWeek = getBlockWeek(weekNum, phaseOffset);
  return `Training phase: Block ${blockNum}, Week ${blockWeek}/4 — ${phase.name} (${phase.label}). ${phase.description} Rep range: ${phase.repRange}. Intensity: ${phase.intensity}.`;
}

/**
 * Get phase info for UI display.
 */
export interface PhaseInfo {
  phase: BlockPhase;
  blockNum: number;
  blockWeek: number;
  label: string;
  description: string;
}

export function getCurrentPhaseInfo(weekNum: number, phaseOffset: number): PhaseInfo {
  const phase = getPhase(weekNum, phaseOffset);
  return {
    phase,
    blockNum: getBlockNumber(weekNum, phaseOffset),
    blockWeek: getBlockWeek(weekNum, phaseOffset),
    label: phase.label,
    description: phase.description,
  };
}
