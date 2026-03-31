"use client";

import { useKineStore } from "@/store/useKineStore";

/**
 * Programme-week streak and journey milestones.
 *
 * Principle: "No guilt metrics" — gaps pause the streak, never erase it.
 * A streak counts consecutive completed programme weeks (all training sessions done).
 * Milestones celebrate total weeks completed, regardless of gaps.
 */

const MILESTONES = [
  { weeks: 4, label: "First month", message: "Four weeks of showing up. The hardest part is behind you." },
  { weeks: 8, label: "Two months", message: "Your body has adapted twice over. Strength is becoming a habit." },
  { weeks: 12, label: "Three months", message: "This is where real change lives. You've built something lasting." },
  { weeks: 16, label: "Four months", message: "Most people never get this far. You're not most people." },
  { weeks: 24, label: "Six months", message: "Half a year of consistent training. This isn't a phase — it's who you are." },
  { weeks: 52, label: "One year", message: "A full year. You've proven that strength is a practice, not a project." },
];

export default function StreakMilestone() {
  const { progressDB } = useKineStore();
  const { currentWeek, sessions, weekFeedbackHistory } = progressDB;

  // Calculate total completed weeks (weeks where all training sessions were done)
  // A "completed week" is any week with at least one feedback entry or session records
  const completedWeeks = getCompletedWeekCount(sessions, weekFeedbackHistory, currentWeek);

  // Calculate current streak — consecutive completed weeks ending at the most recent
  const streak = getCurrentStreak(sessions, weekFeedbackHistory, currentWeek);

  // Find the latest milestone reached
  const milestone = MILESTONES.filter((m) => completedWeeks >= m.weeks).pop();

  // Don't show anything in week 1 or if no weeks completed
  if (completedWeeks < 2 && streak < 2) return null;

  return (
    <div className="flex gap-2 mb-3">
      {/* Streak card */}
      {streak >= 2 && (
        <div className="flex-1 rounded-[10px] border border-accent/25 bg-accent-dim/30 p-3 text-center" role="status" aria-label={`${streak} week streak`}>
          <p className="font-display text-lg tracking-wide text-accent">
            {streak}
          </p>
          <p className="text-[9px] tracking-[0.15em] uppercase text-muted mt-0.5">
            week streak
          </p>
        </div>
      )}

      {/* Milestone card */}
      {milestone && (
        <div className="flex-1 rounded-[10px] border border-border bg-surface p-3" role="status" aria-label={`Milestone: ${milestone.label}`}>
          <p className="text-[9px] tracking-[0.15em] uppercase text-muted mb-1">
            {milestone.label}
          </p>
          <p className="text-[11px] text-muted2 font-light leading-relaxed">
            {milestone.message}
          </p>
        </div>
      )}

      {/* Total weeks — only show without milestone to avoid clutter */}
      {!milestone && completedWeeks >= 2 && streak < 2 && (
        <div className="flex-1 rounded-[10px] border border-border bg-surface p-3 text-center" role="status" aria-label={`${completedWeeks} weeks completed`}>
          <p className="font-display text-lg tracking-wide text-text">
            {completedWeeks}
          </p>
          <p className="text-[9px] tracking-[0.15em] uppercase text-muted mt-0.5">
            weeks completed
          </p>
        </div>
      )}
    </div>
  );
}

/** Count how many distinct weeks have been fully completed. */
function getCompletedWeekCount(
  sessions: { weekNum?: number }[],
  feedback: { weekNum?: number }[],
  currentWeek: number
): number {
  let count = 0;
  for (let w = 1; w < currentWeek; w++) {
    const hasSessions = sessions.some((s) => s.weekNum === w);
    const hasFeedback = feedback.some((f) => f.weekNum === w);
    if (hasSessions || hasFeedback) count++;
  }
  return count;
}

/** Count consecutive completed weeks ending at the most recent completed week. */
function getCurrentStreak(
  sessions: { weekNum?: number }[],
  feedback: { weekNum?: number }[],
  currentWeek: number
): number {
  let streak = 0;
  // Walk backwards from the week before current
  for (let w = currentWeek - 1; w >= 1; w--) {
    const hasSessions = sessions.some((s) => s.weekNum === w);
    const hasFeedback = feedback.some((f) => f.weekNum === w);
    if (hasSessions || hasFeedback) {
      streak++;
    } else {
      break; // Gap found — streak pauses here
    }
  }
  return streak;
}
