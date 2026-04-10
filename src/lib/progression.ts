import { useKineStore } from "@/store/useKineStore";
import { findExercise } from "@/data/exercise-library";
import { getPhase } from "./periodisation";
import { kgToDisplay, formatWeight, weightUnit, getIncrementForEquip, calculatePlatesForSystem, type MeasurementSystem } from "./format";
import { appNow } from "./dev-time";

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
  const topOfRange = getTopOfRange(store.progressDB.currentWeek, store.progressDB.phaseOffset);
  const latestReps = latest.reps || 0;

  // Display weights (stored in kg, convert for display)
  const displayWeight = kgToDisplay(latest.weight, system);

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
        reason: `Increased to ${next}${unit} — you hit ${topOfRange}+ reps twice at ${displayWeight}${unit}`,
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
      reason: `Increased to ${next}${unit} — you hit ${latestReps} reps at ${displayWeight}${unit}`,
    };
  }

  // Single session at top of range — hold at current weight
  if (latestReps >= topOfRange) {
    return {
      ...base,
      suggestedWeight: displayWeight,
      confidence: "hold",
      reason: `Staying at ${displayWeight}${unit} — hit ${latestReps} reps, one more session to confirm`,
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
