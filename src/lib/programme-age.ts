// ── Programme Age & Detraining Detection ──

import { useKineStore } from "@/store/useKineStore";

/**
 * Get days since last session for any exercise.
 */
export function getDaysSinceLastSession(): number | null {
  const store = useKineStore.getState();
  const sessions = store.progressDB.sessions as { date?: string }[];
  if (sessions.length === 0) return null;

  const lastDate = sessions[sessions.length - 1].date;
  if (!lastDate) return null;

  return Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Get how many weeks an exercise has stalled (same or decreasing weight).
 */
export function getExerciseStallWeeks(exerciseName: string): number {
  const store = useKineStore.getState();
  const history = store.progressDB.lifts[exerciseName];
  if (!history || history.length < 3) return 0;

  let stallWeeks = 0;
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].weight <= history[i - 1].weight) {
      stallWeeks++;
    } else {
      break;
    }
  }

  return stallWeeks;
}

/**
 * Get programme maturity level.
 */
export function getProgrammeMaturity(): "early" | "developing" | "established" | "mature" {
  const store = useKineStore.getState();
  const totalSessions = store.progressDB.sessions.length;
  const weeks = store.progressDB.currentWeek;

  if (totalSessions < 6 || weeks < 3) return "early";
  if (totalSessions < 18 || weeks < 6) return "developing";
  if (totalSessions < 40 || weeks < 12) return "established";
  return "mature";
}

/**
 * Check if user is potentially detrained (long gap between sessions).
 */
export function isDetrained(): boolean {
  const days = getDaysSinceLastSession();
  return days !== null && days > 14;
}
