// ── Progressive Overload — Weight suggestion system ──

import { useKineStore } from "@/store/useKineStore";

/**
 * Suggest next weight for an exercise based on history and goal.
 *
 * Strength goal: load progression is primary — add weight when target reps are hit.
 * Muscle/body comp goal: volume progression is primary — hold weight longer,
 *   prioritise completing more sets/reps before increasing load.
 * General/habit goal: hold weight until movement is comfortable, then small increases.
 *
 * Returns a string like "40kg" or "BW" or null if no history.
 */
export function suggestNextWeight(exerciseName: string): string | null {
  const store = useKineStore.getState();
  const history = store.progressDB.lifts[exerciseName];
  const goal = store.goal || "general";

  if (!history || history.length === 0) return null;

  const latest = history[history.length - 1];
  if (!latest.weight) return null;

  const targetReps = parseInt(String(latest.reps)) || 8;
  const equipType = getEquipType(exerciseName, store.equip);

  let increment = 2.5; // default barbell
  if (equipType === "dumbbell") increment = 2;
  else if (equipType === "kettlebell") increment = 4;
  else if (equipType === "machine") increment = 2.5;

  if (goal === "strength") {
    // Strength: load progression is primary
    // If they hit the top of their rep range, increase weight
    if (targetReps >= 6) {
      return `${latest.weight + increment}kg`;
    }
    return `${latest.weight}kg`;
  }

  if (goal === "muscle") {
    // Muscle/body comp: volume progression is primary
    // Hold weight longer — only increase after consistently hitting top of range
    // across multiple sessions (the AI handles set progression across the block)
    if (targetReps >= 12 && history.length >= 2) {
      const prev = history[history.length - 2];
      const prevReps = parseInt(String(prev.reps)) || 0;
      // Only increase if they hit top-of-range in BOTH recent sessions
      if (prevReps >= 12) {
        return `${latest.weight + increment}kg`;
      }
    }
    return `${latest.weight}kg`;
  }

  // General/habit: conservative progression — comfort first
  if (targetReps >= 15 && history.length >= 2) {
    return `${latest.weight + increment}kg`;
  }
  return `${latest.weight}kg`;
}

/**
 * Get the last session data for an exercise.
 */
export function getLastSessionData(
  exerciseName: string
): { weight: number; reps: number; date: string } | null {
  const store = useKineStore.getState();
  const history = store.progressDB.lifts[exerciseName];

  if (!history || history.length === 0) return null;
  return history[history.length - 1];
}

/**
 * Calculate estimated 1RM using Brzycki formula.
 */
export function calculateORM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

/**
 * Calculate plates needed for a barbell weight.
 * Assumes 20kg barbell.
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number = 20
): { plate: number; count: number }[] {
  const available = [20, 15, 10, 5, 2.5, 1.25];
  let remaining = (targetWeight - barWeight) / 2; // per side

  if (remaining <= 0) return [];

  const plates: { plate: number; count: number }[] = [];

  for (const plate of available) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      plates.push({ plate, count });
      remaining -= plate * count;
    }
  }

  return plates;
}

/**
 * Get days since last session for an exercise.
 * Returns null if never done.
 */
export function getDaysSinceLastSession(exerciseName: string): number | null {
  const last = getLastSessionData(exerciseName);
  if (!last) return null;

  const lastDate = new Date(last.date);
  const today = new Date();
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if an exercise is potentially detrained (>14 days gap).
 */
export function isDetrained(exerciseName: string): boolean {
  const days = getDaysSinceLastSession(exerciseName);
  return days !== null && days > 14;
}

function getEquipType(exerciseName: string, userEquip: string[]): string {
  const name = exerciseName.toLowerCase();
  if (name.includes("barbell") || name.includes("deadlift") || name.includes("squat") && userEquip.includes("barbell"))
    return "barbell";
  if (name.includes("dumbbell") || name.includes("goblet"))
    return "dumbbell";
  if (name.includes("kettlebell"))
    return "kettlebell";
  if (name.includes("machine") || name.includes("cable") || name.includes("lat pulldown"))
    return "machine";
  return "barbell";
}
