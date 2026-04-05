import type { LiftEntry, SessionRecord, WeekFeedback } from "@/store/useKineStore";
import type { WeekData, WeekDay } from "@/lib/week-builder";

/** Date string N days ago (YYYY-MM-DD) */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N weeks ago (YYYY-MM-DD) */
export function weeksAgo(n: number): string {
  return daysAgo(n * 7);
}

/** Build a session record */
export function makeSession(opts: {
  title: string;
  weekNum: number;
  dayIdx: number;
  date: string;
  effort: number;
  soreness: number;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
}): SessionRecord {
  const logs: Record<string, unknown> = {};
  for (const ex of opts.exercises) {
    logs[ex.name] = {
      name: ex.name,
      prescribed: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
      actual: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
    };
  }
  return {
    title: opts.title,
    date: opts.date,
    weekNum: opts.weekNum,
    dayIdx: opts.dayIdx,
    effort: opts.effort,
    soreness: opts.soreness,
    logs,
  };
}

/** Build lift entries from sessions */
export function buildLifts(sessions: SessionRecord[]): Record<string, LiftEntry[]> {
  const lifts: Record<string, LiftEntry[]> = {};
  for (const s of sessions) {
    if (!s.logs) continue;
    for (const log of Object.values(s.logs) as { name: string; actual: { weight: number; reps: number }[] }[]) {
      if (!lifts[log.name]) lifts[log.name] = [];
      for (const set of log.actual) {
        lifts[log.name].push({ weight: set.weight, reps: set.reps, date: s.date! });
      }
    }
  }
  return lifts;
}

/** Build week feedback history */
export function buildFeedback(weeks: number, baseEffort = 3, baseSoreness = 2): WeekFeedback[] {
  return Array.from({ length: weeks }, (_, i) => ({
    weekNum: i + 1,
    effort: baseEffort,
    soreness: baseSoreness,
  }));
}

/**
 * Build weekHistory from seeded sessions.
 * Groups sessions by weekNum, builds a WeekData per week with backdated dates.
 * Excludes the current week (that's the live weekData, not history).
 */
export function buildWeekHistory(
  sessions: SessionRecord[],
  currentWeek: number,
  trainingDays: number[],
): WeekData[] {
  // Group sessions by weekNum
  const byWeek = new Map<number, SessionRecord[]>();
  for (const s of sessions) {
    if (!s.weekNum || s.weekNum >= currentWeek) continue;
    const existing = byWeek.get(s.weekNum) || [];
    existing.push(s);
    byWeek.set(s.weekNum, existing);
  }

  // Build a WeekData for each historical week
  const history: WeekData[] = [];
  const sortedWeeks = [...byWeek.keys()].sort((a, b) => a - b);

  for (const weekNum of sortedWeeks) {
    const weekSessions = byWeek.get(weekNum)!;

    // Build 7 days (Mon-Sun), filling in sessions where we have them
    const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
      const session = weekSessions.find((s) => s.dayIdx === i);
      const isTrainingDay = trainingDays.includes(i);

      if (session && session.logs) {
        const exercises = Object.values(session.logs as Record<string, { name: string; actual?: { weight: number; reps: number }[] }>)
          .map((log) => ({
            name: log.name,
            sets: String(log.actual?.length || 3),
            reps: String(log.actual?.[0]?.reps || 8),
            rest: "90",
          }));

        return {
          dayNumber: i + 1,
          isRest: false,
          sessionTitle: session.title || "Session",
          sessionDuration: "50",
          coachNote: "",
          exercises,
        };
      }

      return {
        dayNumber: i + 1,
        isRest: !isTrainingDay,
        sessionTitle: isTrainingDay ? "Session" : "",
        sessionDuration: "50",
        coachNote: "",
        exercises: [],
      };
    });

    history.push({
      programName: `Week ${weekNum}`,
      weekCoachNote: "",
      days,
      _weekNum: weekNum,
    });
  }

  return history;
}

/** Compute Monday ISO date string for a given week number relative to now */
export function weekStartDate(weeksBack: number): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - weeksBack * 7);
  return monday.toISOString().slice(0, 10);
}
