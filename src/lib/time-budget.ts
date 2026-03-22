// ── Time Budget System ──
// Smart session trimming: removes isolations first, then least-important compounds, then reduces sets.

import { findExercise } from "@/data/exercise-library";

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

export interface TrimResult {
  exercises: Exercise[];
  trimmed: boolean;
  removedNames: { name: string; isIsolation: boolean }[];
  estimatedMin: number;
}

function isCompound(ex: Exercise): boolean {
  const lib = findExercise(ex.name);
  if (!lib) return true; // unknown → treat as compound to avoid over-cutting
  return !lib.tags.includes("Isolation");
}

function estimateExerciseMinutes(ex: Exercise): number {
  const sets = parseInt(ex.sets) || 3;
  const reps = parseInt(ex.reps) || 8;
  const lib = findExercise(ex.name);
  const logType = lib?.logType || "weighted";
  const isIso = !isCompound(ex);

  let setTimeSec: number;
  if (logType === "timed") setTimeSec = reps; // reps field holds seconds
  else if (logType === "cardio") setTimeSec = reps * 60; // reps field holds minutes
  else if (logType === "bodyweight" || logType === "bodyweight_unilateral") setTimeSec = reps * 4;
  else if (isIso) setTimeSec = reps * 4;
  else setTimeSec = reps * 5 + 8; // compounds: ~5s/rep + rack/unrack/brace

  const restSec = isIso ? 75 : 150;
  const transitionSec = isIso ? 60 : 90;
  return Math.ceil((sets * (setTimeSec + restSec) + transitionSec) / 60);
}

/**
 * Estimate total session time (in minutes).
 */
export function estimateSessionTime(exercises: Exercise[]): number {
  return exercises.reduce((total, ex) => total + estimateExerciseMinutes(ex), 0);
}

/**
 * Smart session trimming:
 * 1. Remove isolation exercises from the end
 * 2. If still over, remove least-important compounds from the end
 * 3. If still over, reduce sets on remaining exercises
 */
export function trimSessionToTime(exercises: Exercise[], budgetMinutes: number): TrimResult {
  if (!exercises.length || !budgetMinutes) {
    return { exercises, trimmed: false, removedNames: [], estimatedMin: estimateSessionTime(exercises) };
  }

  let totalMin = estimateSessionTime(exercises);

  if (totalMin <= budgetMinutes) {
    return { exercises, trimmed: false, removedNames: [], estimatedMin: totalMin };
  }

  // Step 1: Separate compounds and isolations
  const compounds = exercises.filter((ex) => isCompound(ex));
  const isolations = exercises.filter((ex) => !isCompound(ex));
  const removedNames: { name: string; isIsolation: boolean }[] = [];

  // Remove isolations from the end
  const isoList = [...isolations];
  while (isoList.length > 0 && totalMin > budgetMinutes) {
    const removed = isoList.pop()!;
    removedNames.push({ name: removed.name, isIsolation: true });
    totalMin -= estimateExerciseMinutes(removed);
  }

  let trimmed = [...compounds, ...isoList];

  // Step 2: Remove least-important compounds from the end
  while (trimmed.length > 1 && totalMin > budgetMinutes) {
    const removed = trimmed.pop()!;
    removedNames.push({ name: removed.name, isIsolation: false });
    totalMin -= estimateExerciseMinutes(removed);
  }

  // Step 3: Reduce sets on remaining exercises
  if (totalMin > budgetMinutes) {
    trimmed = trimmed.map((ex) => {
      if (totalMin <= budgetMinutes) return ex;
      const currentSets = parseInt(ex.sets) || 3;
      if (currentSets <= 2) return ex;
      const newSets = currentSets - 1;
      const timeSaved = estimateExerciseMinutes(ex) - estimateExerciseMinutes({ ...ex, sets: String(newSets) });
      totalMin -= timeSaved;
      return { ...ex, sets: String(newSets) };
    });
  }

  return {
    exercises: trimmed,
    trimmed: true,
    removedNames,
    estimatedMin: Math.round(totalMin),
  };
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
