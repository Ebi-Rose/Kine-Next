// ── Periodisation — 3-Week Progressive Block + Autoregulated Deloads ──
// Accumulation → Intensification → Peak (repeat)
// Deloads are triggered by signals, not by a fixed schedule.
// Research: Schoenfeld et al. (2024) found fixed mid-program deloads negatively
// influenced strength. Delphi consensus recommends autoregulation over rigid scheduling.

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

/** The 3 progressive phases that repeat in each block. */
const BLOCK_PHASES: Record<number, BlockPhase> = {
  1: {
    name: "Accumulation",
    label: "VOLUME WEEK",
    description: "Building your base — higher reps, moderate load, more sets. For physique goals, volume is the primary driver of muscle growth — add sets before adding weight.",
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
};

/** Deload phase — used when autoregulated triggers fire, not on a fixed schedule. */
export const DELOAD_PHASE: BlockPhase = {
  name: "Deload",
  label: "DELOAD WEEK",
  description: "Your body is asking for recovery. Same movements, significantly lighter. This is based on your recent effort and soreness — not a fixed schedule.",
  loadMod: -20,
  volMod: "-30-40% sets — recovery priority",
  repRange: "12-15",
  intensity: "low",
};

/** Maximum weeks without a deload before the safety net triggers. */
const MAX_WEEKS_WITHOUT_DELOAD = 6;

/**
 * Get the week number within the current 3-week block (1-3).
 */
export function getBlockWeek(weekNum: number, phaseOffset: number = 0): number {
  const effective = weekNum - phaseOffset;
  return ((Math.max(1, effective) - 1) % 3) + 1;
}

/**
 * Get the block number (1, 2, 3, ...).
 */
export function getBlockNumber(weekNum: number, phaseOffset: number = 0): number {
  const effective = weekNum - phaseOffset;
  return Math.ceil(Math.max(1, effective) / 3);
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
 * Check if a deload should happen — fully autoregulated, no fixed schedule.
 *
 * Triggers:
 * 1. High soreness: avg ≥ 3.8 across the current week's sessions
 * 2. Low energy/motivation: most recent week check-in effort or motivation ≤ 2
 * 3. Safety net: 6+ weeks since last deload (prevents indefinite fatigue accumulation)
 */
export function shouldDeload(
  weekNum: number,
  _phaseOffset: number,
  sessions: { weekNum?: number; soreness?: number }[],
  lastDeloadWeek: number = 0,
  latestCheckIn?: { effort: number; soreness: number },
): boolean {
  // 1. High soreness across the current week
  const weekSessions = sessions.filter((s) => s.weekNum === weekNum);
  if (weekSessions.length > 0) {
    const avgSoreness =
      weekSessions.reduce((a, s) => a + (s.soreness || 2), 0) / weekSessions.length;
    if (avgSoreness >= 3.8) return true;
  }

  // 2. Low energy or motivation from week check-in
  if (latestCheckIn && (latestCheckIn.effort <= 2 || latestCheckIn.soreness <= 2)) {
    // Only trigger if also at least 3 weeks since last deload (avoid back-to-back deloads)
    if (weekNum - lastDeloadWeek >= 3) return true;
  }

  // 3. Safety net — max weeks without a deload
  if (weekNum - lastDeloadWeek >= MAX_WEEKS_WITHOUT_DELOAD) return true;

  return false;
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
 * If a deload was triggered, returns the deload phase instead of the natural next.
 */
export function getEffectiveNextPhase(
  weekNum: number,
  phaseOffset: number,
  plannedDays: number,
  sessions: { weekNum?: number; soreness?: number }[],
  skippedSessions: { weekNum?: number; movedTo?: number | null }[],
  lastDeloadWeek: number = 0,
  latestCheckIn?: { effort: number; soreness: number },
): { phase: BlockPhase; held: boolean; deloading: boolean; adherence: ReturnType<typeof getWeekAdherence> } {
  const adherence = getWeekAdherence(weekNum, plannedDays, sessions, skippedSessions);
  const naturalNext = getNextPhase(weekNum, phaseOffset);
  const currentPhase = getPhase(weekNum, phaseOffset);

  // Check if deload is triggered for next week
  const needsDeload = shouldDeload(weekNum, phaseOffset, sessions, lastDeloadWeek, latestCheckIn);
  if (needsDeload && currentPhase.name !== "Deload") {
    return { phase: DELOAD_PHASE, held: false, deloading: true, adherence };
  }

  // Deload always advances (it's recovery, not training)
  if (currentPhase.name === "Deload") {
    return { phase: naturalNext, held: false, deloading: false, adherence };
  }

  // Full or sufficient → advance
  if (adherence.level === "full" || adherence.level === "sufficient") {
    return { phase: naturalNext, held: false, deloading: false, adherence };
  }

  // Hold at current phase
  return { phase: currentPhase, held: true, deloading: false, adherence };
}

/**
 * Get phase context string for AI prompts.
 */
export function getPhaseContext(weekNum: number, phaseOffset: number): string {
  const phase = getPhase(weekNum, phaseOffset);
  const blockNum = getBlockNumber(weekNum, phaseOffset);
  const blockWeek = getBlockWeek(weekNum, phaseOffset);
  return `Training phase: Block ${blockNum}, Week ${blockWeek}/3 — ${phase.name} (${phase.label}). ${phase.description} Rep range: ${phase.repRange}. Intensity: ${phase.intensity}. Deloads are autoregulated — not on a fixed schedule.`;
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
