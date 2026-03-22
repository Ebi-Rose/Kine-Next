// ── State Reconciliation & Validation ──

import { useKineStore } from "@/store/useKineStore";

/**
 * Run consistency checks on the Zustand store.
 * Fixes known issues silently.
 */
export function reconcileState() {
  const store = useKineStore.getState();

  // Ensure trainingDays matches days count
  if (store.trainingDays.length > 0 && store.days !== String(store.trainingDays.length)) {
    store.setDays(String(store.trainingDays.length));
  }

  // Clear stale session logs if no active session
  if (store.currentDayIdx === null && Object.keys(store.sessionLogs).length > 0) {
    store.setSessionLogs({});
  }

  // Clear stale feedback state
  if (store.feedbackState.effort !== null && store.currentDayIdx === null) {
    store.setFeedbackState({
      effort: null,
      soreness: null,
      tsDay: null,
      tsTime: null,
      sessionStartTime: null,
    });
  }

  // Ensure progressDB has required fields
  const db = store.progressDB;
  let needsUpdate = false;
  const updated = { ...db };

  if (!Array.isArray(updated.sessions)) {
    updated.sessions = [];
    needsUpdate = true;
  }
  if (typeof updated.lifts !== "object" || updated.lifts === null) {
    updated.lifts = {};
    needsUpdate = true;
  }
  if (typeof updated.currentWeek !== "number" || updated.currentWeek < 1) {
    updated.currentWeek = 1;
    needsUpdate = true;
  }
  if (!Array.isArray(updated.weekFeedbackHistory)) {
    updated.weekFeedbackHistory = [];
    needsUpdate = true;
  }
  if (!Array.isArray(updated.skippedSessions)) {
    updated.skippedSessions = [];
    needsUpdate = true;
  }

  if (needsUpdate) {
    store.setProgressDB(updated);
  }
}

/**
 * Validate state integrity. Returns array of issues found.
 */
export function auditConsistency(): string[] {
  const store = useKineStore.getState();
  const issues: string[] = [];

  // Check goal is valid
  if (store.goal && !["muscle", "strength", "general"].includes(store.goal)) {
    issues.push(`Invalid goal: ${store.goal}`);
  }

  // Check exp is valid
  if (store.exp && !["new", "developing", "intermediate"].includes(store.exp)) {
    issues.push(`Invalid experience: ${store.exp}`);
  }

  // Check training days are valid (0-6)
  if (store.trainingDays.some((d) => d < 0 || d > 6)) {
    issues.push("Invalid training day indices");
  }

  // Check for duplicate training days
  if (new Set(store.trainingDays).size !== store.trainingDays.length) {
    issues.push("Duplicate training days");
  }

  // Check weekData structure
  if (store.weekData) {
    const week = store.weekData as { days?: unknown[] };
    if (!week.days || !Array.isArray(week.days)) {
      issues.push("weekData missing days array");
    } else if (week.days.length !== 7) {
      issues.push(`weekData has ${week.days.length} days, expected 7`);
    }
  }

  return issues;
}
