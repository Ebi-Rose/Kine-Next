import { useKineStore } from "@/store/useKineStore";
import { findExercise } from "@/data/exercise-library";
import { SKILL_PATHS } from "@/data/skill-paths";
import { getPhase } from "./periodisation";
import { kgToDisplay, formatWeight, weightUnit, getIncrementForEquip, calculatePlatesForSystem, type MeasurementSystem } from "./format";
import { appNow } from "./dev-time";
import { getEffectiveWeek } from "./date-utils";

// ── Progression Suggestion System ──
// Returns a structured suggestion the user can accept, adjust, or dismiss.
// Uses total volume trending, phase-aware rep ranges, and equipment-specific
// increments. The user always has the final say.

export type ProgressionConfidence = "ready" | "hold" | "deload";

export interface ProgressionSuggestion {
  currentWeight: number;
  suggestedWeight: number;
  increment: number;
  confidence: ProgressionConfidence;
  reason: string;
  lastSession: { weight: number; reps: number; date: string };
  volume: { current: number; previous: number | null };
  unit: string;
}

/**
 * Get a structured progression suggestion for an exercise.
 *
 * Logic:
 * 1. Read the current phase's rep range to set the progression threshold
 *    (top of prescribed range, not a hardcoded number)
 * 2. Track total volume (sets × reps × weight) trending across sessions
 * 3. Require the user to hit the top of their rep range in 2 consecutive
 *    sessions at the same weight before suggesting an increase
 * 4. Detect detraining (>14 day gap) and suggest a conservative restart
 * 5. Look up equipment type from exercise library, not name guessing
 *
 * Returns null if there's no history to base a suggestion on.
 */
export function getProgressionSuggestion(exerciseName: string): ProgressionSuggestion | null {
  const store = useKineStore.getState();
  const history = store.progressDB.lifts[exerciseName];
  const system = store.measurementSystem || "metric";
  const unit = weightUnit(system);

  if (!history || history.length === 0) return null;

  const latest = history[history.length - 1];
  if (!latest.weight) return null;

  // Get display-unit increment for this equipment type
  const equipType = getEquipTypeFromLibrary(exerciseName);
  const increment = getIncrementForEquip(equipType, system);
  const effectiveWeek = getEffectiveWeek(store.progressDB.sessions as { weekNum?: number }[], store.progressDB.currentWeek);
  const topOfRange = getTopOfRange(effectiveWeek, store.progressDB.phaseOffset);
  const latestReps = latest.reps || 0;

  // Display weights (stored in kg, convert for display)
  const displayWeight = kgToDisplay(latest.weight, system);

  // Relative time label for the last entry
  const daysSinceLast = getDaysSinceLastSession(exerciseName) ?? 0;
  const timeLabel = daysSinceLast <= 3 ? "last session"
    : daysSinceLast <= 9 ? "last week"
    : daysSinceLast <= 16 ? "2 weeks ago"
    : `${Math.round(daysSinceLast / 7)} weeks ago`;

  // Volume tracking (use raw kg for consistency)
  const currentVolume = latest.weight * latestReps;
  const previousVolume = history.length >= 2
    ? history[history.length - 2].weight * (history[history.length - 2].reps || 0)
    : null;

  const base = {
    currentWeight: displayWeight,
    increment,
    lastSession: { weight: displayWeight, reps: latestReps, date: latest.date },
    volume: { current: currentVolume, previous: previousVolume },
    unit,
  };

  // Detraining check — suggest conservative restart
  const daysSince = getDaysSinceLastSession(exerciseName);
  if (daysSince !== null && daysSince > 14) {
    const deloadWeight = roundToIncrement(displayWeight * 0.85, increment);
    return {
      ...base,
      suggestedWeight: deloadWeight,
      confidence: "deload",
      reason: `Set to ${deloadWeight}${unit} — it's been ${daysSince} days, starting lighter to rebuild`,
    };
  }

  // Check if user hit top of rep range in last 2 sessions at the same weight
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const prevReps = prev.reps || 0;
    const sameWeight = latest.weight === prev.weight;

    if (sameWeight && latestReps >= topOfRange && prevReps >= topOfRange) {
      const next = displayWeight + increment;
      return {
        ...base,
        suggestedWeight: next,
        confidence: "ready",
        reason: `Increased to ${next}${unit} — you hit ${topOfRange}+ reps at ${displayWeight}${unit} for two sessions straight`,
      };
    }
  }

  // Clearly exceeded the rep range — weight is too light, increase now
  if (latestReps >= topOfRange + 2) {
    const next = displayWeight + increment;
    return {
      ...base,
      suggestedWeight: next,
      confidence: "ready",
      reason: `Increased to ${next}${unit} — you hit ${latestReps} reps at ${displayWeight}${unit} ${timeLabel}`,
    };
  }

  // Single session at top of range — hold at current weight
  if (latestReps >= topOfRange) {
    return {
      ...base,
      suggestedWeight: displayWeight,
      confidence: "hold",
      reason: `Staying at ${displayWeight}${unit} — you hit ${latestReps} reps ${timeLabel}, one more to confirm`,
    };
  }

  // Building — not at top of range yet
  return {
    ...base,
    suggestedWeight: displayWeight,
    confidence: "hold",
    reason: `Staying at ${displayWeight}${unit} — target ${topOfRange} reps before increasing`,
  };
}

/**
 * Backwards-compatible wrapper — returns a simple string for contexts
 * that don't need the full suggestion object.
 * @deprecated Use getProgressionSuggestion() for new code.
 */
export function suggestNextWeight(exerciseName: string): string | null {
  const suggestion = getProgressionSuggestion(exerciseName);
  if (!suggestion) return null;
  return `${suggestion.suggestedWeight}${suggestion.unit}`;
}

/** Round a weight down to the nearest valid increment. */
function roundToIncrement(weight: number, increment: number): number {
  return Math.floor(weight / increment) * increment;
}

/**
 * Get the top of the current phase's rep range.
 * Falls back to 10 if phase data is unavailable.
 */
function getTopOfRange(currentWeek: number, phaseOffset: number): number {
  try {
    const phase = getPhase(currentWeek, phaseOffset);
    // repRange is "10-12", "6-8", "4-6", etc.
    const top = parseInt(phase.repRange.split("-")[1]) || 10;
    return top;
  } catch {
    return 10;
  }
}

/**
 * Get the weight increment for an exercise based on its equipment.
 * Uses the user's measurement system for correct increments.
 */
export function getIncrement(exerciseName: string): number {
  const system = useKineStore.getState().measurementSystem || "metric";
  const equipType = getEquipTypeFromLibrary(exerciseName);
  return getIncrementForEquip(equipType, system);
}

/**
 * Determine equipment type from exercise library, with name-based fallback.
 */
function getEquipTypeFromLibrary(exerciseName: string): string {
  const lib = findExercise(exerciseName);
  if (lib && lib.equip.length > 0) {
    const equip = lib.equip[0];
    if (equip === "dumbbells") return "dumbbell";
    if (equip === "barbell") return "barbell";
    if (equip === "machines") return "machine";
    if (equip === "bodyweight" || equip === "bands") return "bodyweight";
    // Check for kettlebell in tags or name
    if (exerciseName.toLowerCase().includes("kettlebell")) return "kettlebell";
    return equip;
  }
  // Fallback to name-based detection
  return getEquipType(exerciseName, []);
}

export function getLastSessionData(
  exerciseName: string
): { weight: number; reps: number; date: string } | null {
  const store = useKineStore.getState();
  const history = store.progressDB.lifts[exerciseName];

  if (!history || history.length === 0) return null;
  return history[history.length - 1];
}

/** Estimated 1RM via Brzycki formula. */
export function calculateORM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

/** Plates per side for a target weight. Uses the user's measurement system. */
export function calculatePlates(
  targetWeight: number,
  barWeight?: number,
): { plate: number; count: number }[] {
  const system = useKineStore.getState().measurementSystem || "metric";
  return calculatePlatesForSystem(targetWeight, system, barWeight);
}

export function getDaysSinceLastSession(exerciseName: string): number | null {
  const last = getLastSessionData(exerciseName);
  if (!last) return null;

  const lastDate = new Date(last.date);
  const today = appNow();
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function isDetrained(exerciseName: string): boolean {
  const days = getDaysSinceLastSession(exerciseName);
  return days !== null && days > 14;
}

// ── Exercise Progression Signals ──────────────────────────────────────
//
// Detects when a user is ready to advance to the next exercise in a
// skill-path chain, based on session log data. This is distinct from
// weight progression — it's about switching exercises entirely.
//
// Uses a rep-count heuristic for bodyweight exercises:
//   - "ready"      → logged ≥ REP_THRESHOLD reps per set in 2+ of last 3 sessions
//   - "approaching" → logged ≥ REP_THRESHOLD reps per set in 1 of last 3 sessions
//
// For weighted cross-equipment chains (e.g. Goblet Squat → Barbell Back Squat),
// relies on the user's equipment list — prompts advancement when they have
// the next exercise's equipment already.
//
// Called by week-builder to inform the LLM prompt and to auto-advance
// exercises after validation.

/** Minimum reps per set that signals readiness to advance to the next chain step. */
const REP_THRESHOLD = 12;

/** Number of recent sessions to scan for each exercise. */
const LOOK_BACK_SESSIONS = 6;

export interface ProgressionSignal {
  exerciseName: string;
  nextExercise: string;
  chainId: string;
  confidence: "ready" | "approaching";
  reason: string;
}

/**
 * Scan recent session logs and return progression signals for any
 * exercises that are in a SKILL_PATH chain and ready to advance.
 */
export function detectProgressionSignals(
  sessions: Array<{ logs?: Record<string, unknown> }>,
  userEquip: string[],
): ProgressionSignal[] {
  const signals: ProgressionSignal[] = [];

  // Flatten all chains for fast lookup
  const allFlat = (chainTiers: (string | string[])[]) =>
    chainTiers.flatMap((t) => (Array.isArray(t) ? t : [t]));

  // Collect per-exercise occurrences in recent sessions
  // key: exerciseName, value: array of { highReps: boolean } per session
  const exerciseOccurrences = new Map<string, boolean[]>();

  for (const session of sessions.slice(-LOOK_BACK_SESSIONS)) {
    if (!session.logs || typeof session.logs !== "object") continue;

    // Track which exercises appeared in this session
    const seenInSession = new Set<string>();

    for (const entry of Object.values(session.logs)) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const name = typeof e.name === "string" ? e.name : null;
      if (!name || seenInSession.has(name)) continue;
      seenInSession.add(name);

      // Check if in any chain
      const inChain = SKILL_PATHS.some((path) => allFlat(path.chain).includes(name));
      if (!inChain) continue;

      // Determine if this session hit the rep threshold
      const actual = Array.isArray(e.actual) ? e.actual : [];
      let highReps = false;

      if (actual.length > 0) {
        // High reps = ALL completed sets hit REP_THRESHOLD or more
        const completedSets = actual.filter((s: Record<string, unknown>) => {
          const reps = parseInt(String(s.reps || "0"));
          return reps > 0;
        });
        if (completedSets.length > 0) {
          highReps = completedSets.every((s: Record<string, unknown>) => {
            return parseInt(String(s.reps || "0")) >= REP_THRESHOLD;
          });
        }
      }

      if (!exerciseOccurrences.has(name)) exerciseOccurrences.set(name, []);
      exerciseOccurrences.get(name)!.push(highReps);
    }
  }

  // Evaluate each exercise against its chain
  for (const [exerciseName, occurrences] of exerciseOccurrences) {
    // Only look at the last 3 occurrences
    const recent = occurrences.slice(-3);
    const highRepCount = recent.filter(Boolean).length;
    if (highRepCount === 0) continue;

    const confidence: "ready" | "approaching" = highRepCount >= 2 ? "ready" : "approaching";

    // Find the chain and next step
    for (const path of SKILL_PATHS) {
      const flat = allFlat(path.chain);
      if (!flat.includes(exerciseName)) continue;

      // Find tier index
      const tiers = path.chain.map((t) => (Array.isArray(t) ? t : [t]));
      const currentTierIdx = tiers.findIndex((t) => t.includes(exerciseName));
      if (currentTierIdx < 0 || currentTierIdx >= tiers.length - 1) continue; // at end

      // Find the next tier — pick the first exercise the user has equipment for
      const nextTier = tiers[currentTierIdx + 1];
      const nextExercise = nextTier.find((candidate) => {
        const lib = findExercise(candidate);
        if (!lib) return false;
        return lib.equip.some((e) => userEquip.includes(e));
      });

      if (!nextExercise) continue; // user doesn't have equipment for next step

      const reason =
        confidence === "ready"
          ? `You've been consistently hitting ${REP_THRESHOLD}+ reps on ${exerciseName} — time to try ${nextExercise}.`
          : `You're approaching ${REP_THRESHOLD} reps on ${exerciseName} — ${nextExercise} will be in range soon.`;

      signals.push({
        exerciseName,
        nextExercise,
        chainId: path.id,
        confidence,
        reason,
      });
      break; // one signal per exercise
    }
  }

  return signals;
}

function getEquipType(exerciseName: string, userEquip: string[]): string {
  const name = exerciseName.toLowerCase();
  // Order matters: check specific equipment words before generic ones
  if (name.includes("kettlebell") || name.includes("kb ")) return "kettlebell";
  if (name.includes("dumbbell") || name.includes("goblet") || name.includes("db ")) return "dumbbell";
  if (name.includes("machine") || name.includes("cable") || name.includes("lat pulldown") || name.includes("leg press") || name.includes("leg curl") || name.includes("leg extension")) return "machine";
  if (name.includes("barbell") || (name.includes("deadlift") && !name.includes("single"))) return "barbell";
  if (name.includes("squat") && userEquip.includes("barbell")) return "barbell";
  return "barbell";
}
