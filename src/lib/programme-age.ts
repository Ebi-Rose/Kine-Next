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

const MATURITY_LEVELS = ["early", "developing", "established", "mature"] as const;

/**
 * Get programme maturity level.
 *
 * Uses the *more conservative* of two signals — session count and calendar
 * weeks — so both volume and time must justify the level. This prevents a
 * power-user who logs 40 sessions in 2 weeks from being classified as
 * "established", and equally prevents a low-frequency user from advancing
 * on calendar time alone.
 */
export function getProgrammeMaturity(): "early" | "developing" | "established" | "mature" {
  const store = useKineStore.getState();
  const totalSessions = store.progressDB.sessions.length;
  const weeks = store.progressDB.currentWeek;

  const sessionLevel = totalSessions < 6 ? 0 : totalSessions < 18 ? 1 : totalSessions < 40 ? 2 : 3;
  const weekLevel = weeks < 3 ? 0 : weeks < 6 ? 1 : weeks < 12 ? 2 : 3;

  return MATURITY_LEVELS[Math.min(sessionLevel, weekLevel)];
}

/**
 * Check if user is potentially detrained (long gap between sessions).
 */
export function isDetrained(): boolean {
  const days = getDaysSinceLastSession();
  return days !== null && days > 14;
}
