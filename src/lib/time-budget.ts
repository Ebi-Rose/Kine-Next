// ── Time Budget System ──
// Trims exercises from a session to fit within a time constraint.

import type { Exercise } from "@/lib/week-builder";

// Average time per exercise type (in minutes)
const TIME_ESTIMATES: Record<string, number> = {
  compound_heavy: 12,    // Squat, deadlift, bench (warmup sets + working sets)
  compound_light: 8,     // Lunges, rows, presses
  isolation: 5,          // Curls, extensions, raises
  timed: 4,              // Planks, holds
  cardio: 10,            // Cardio blocks
  bodyweight: 5,         // Push-ups, pull-ups
};

function estimateExerciseTime(exercise: Exercise): number {
  const name = exercise.name.toLowerCase();
  const sets = parseInt(exercise.sets) || 3;

  // Heavy compounds
  if (name.includes("squat") || name.includes("deadlift") || name.includes("bench press")) {
    return TIME_ESTIMATES.compound_heavy;
  }
  // Light compounds
  if (name.includes("row") || name.includes("press") || name.includes("lunge") || name.includes("thrust")) {
    return TIME_ESTIMATES.compound_light;
  }
  // Cardio
  if (name.includes("treadmill") || name.includes("bike") || name.includes("rowing machine")) {
    return TIME_ESTIMATES.cardio;
  }
  // Timed
  if (name.includes("plank") || name.includes("hold") || name.includes("hang")) {
    return TIME_ESTIMATES.timed;
  }
  // Isolation (fewer sets = less time)
  if (sets <= 3) return TIME_ESTIMATES.isolation;

  return TIME_ESTIMATES.compound_light;
}

/**
 * Estimate total session time for a list of exercises (in minutes).
 */
export function estimateSessionTime(exercises: Exercise[]): number {
  return exercises.reduce((total, ex) => total + estimateExerciseTime(ex), 0) + 5; // +5 for warmup
}

/**
 * Trim exercises from a session to fit within a time budget.
 * Removes from the end (accessories) first, preserving compound movements.
 */
export function applyTimeBudget(
  exercises: Exercise[],
  budgetMinutes: number
): Exercise[] {
  if (budgetMinutes <= 0) return exercises;

  const result = [...exercises];
  let totalTime = estimateSessionTime(result);

  // Remove exercises from the end until we fit
  while (totalTime > budgetMinutes && result.length > 2) {
    result.pop();
    totalTime = estimateSessionTime(result);
  }

  return result;
}

/**
 * Get a human-readable time estimate string.
 */
export function formatTimeEstimate(exercises: Exercise[]): string {
  const mins = estimateSessionTime(exercises);
  if (mins < 45) return "Under 45 min";
  if (mins < 60) return "~45-60 min";
  if (mins < 75) return "~60-75 min";
  if (mins < 90) return "~75-90 min";
  return "90+ min";
}
