import type { LiftEntry, SessionRecord, WeekFeedback } from "@/store/useKineStore";

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
