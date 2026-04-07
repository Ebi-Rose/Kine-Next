// ── Progress Personalization Engine — derive-history ──
//
// Pure functions that project the persisted progressDB into the engine's
// EngineHistory shape. Reuses periodisation helpers and the exercise library
// for muscle-group categorization.

import { findExercise, type MuscleGroup } from "@/data/exercise-library";
import { INJURY_SWAPS } from "@/data/injury-swaps";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import type { LiftEntry, SessionRecord, WeekFeedback } from "@/store/useKineStore";
import type {
  EngineHistory,
  PatternBalance,
  RecentPR,
  TopLiftEntry,
} from "./types";

interface ProgressDBLike {
  sessions: SessionRecord[];
  lifts: Record<string, LiftEntry[]>;
  currentWeek: number;
  weekFeedbackHistory: WeekFeedback[];
  programStartDate: string | null;
  phaseOffset: number;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function isISODate(s: string | undefined): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);
}

/** Count distinct ISO weeks (Sun-anchored) covered by these dates. */
export function countWeeks(dates: string[]): number {
  if (dates.length === 0) return 0;
  const weeks = new Set<string>();
  for (const d of dates) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) continue;
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    weeks.add(start.toISOString().slice(0, 10));
  }
  return weeks.size;
}

/** Mean of a numeric array, or null if empty. */
function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Find the best (heaviest, then most reps) lift entry. */
function bestEntry(entries: LiftEntry[]): LiftEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce(
    (best, e) =>
      e.weight > best.weight ||
      (e.weight === best.weight && e.reps > best.reps)
        ? e
        : best,
    entries[0]
  );
}

/** Mean weight across entries within the last `weeks` weeks. */
function rollingMeanWeight(entries: LiftEntry[], weeks: number): number {
  if (entries.length === 0) return 0;
  const cutoff = Date.now() - weeks * MS_PER_WEEK;
  const recent = entries.filter((e) => {
    const t = new Date(e.date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
  if (recent.length === 0) return entries[0].weight;
  return recent.reduce((a, e) => a + e.weight, 0) / recent.length;
}

/** Compute pattern balance from sessions over the lookback window. */
function computePatternBalance(
  sessions: SessionRecord[],
  windowWeeks: number
): PatternBalance | null {
  const cutoff = Date.now() - windowWeeks * MS_PER_WEEK;
  const baselineCutoff = Date.now() - windowWeeks * 2 * MS_PER_WEEK;
  // Buckets keyed by simple muscle category.
  const recent: Record<"push" | "pull" | "legs", number> = { push: 0, pull: 0, legs: 0 };
  const baseline: Record<"push" | "pull" | "legs", number> = { push: 0, pull: 0, legs: 0 };

  function bucketFor(group: MuscleGroup | undefined): "push" | "pull" | "legs" | null {
    if (group === "push") return "push";
    if (group === "pull") return "pull";
    if (group === "legs" || group === "hinge") return "legs";
    return null;
  }

  for (const s of sessions) {
    if (!isISODate(s.date)) continue;
    const t = new Date(s.date).getTime();
    if (Number.isNaN(t)) continue;
    const inRecent = t >= cutoff;
    const inBaseline = t >= baselineCutoff && t < cutoff;
    if (!inRecent && !inBaseline) continue;
    const logs = s.logs ? Object.values(s.logs) : [];
    for (const raw of logs) {
      const ex = raw as { name?: string; actual?: { reps?: string; weight?: string }[] };
      if (!ex?.name) continue;
      const meta = findExercise(ex.name);
      const bucket = bucketFor(meta?.muscle as MuscleGroup | undefined);
      if (!bucket) continue;
      const sets = (ex.actual ?? []).filter((set) => Number(set?.reps ?? 0) > 0).length;
      if (sets === 0) continue;
      if (inRecent) recent[bucket] += sets;
      else baseline[bucket] += sets;
    }
  }

  const totalRecent = recent.push + recent.pull + recent.legs;
  if (totalRecent === 0) return null;

  function pct(bucket: "push" | "pull" | "legs"): number {
    if (baseline[bucket] === 0) return recent[bucket] > 0 ? 100 : 0;
    return Math.round(((recent[bucket] - baseline[bucket]) / baseline[bucket]) * 100);
  }

  return {
    push: { volume: recent.push, deltaPct: pct("push") },
    pull: { volume: recent.pull, deltaPct: pct("pull") },
    legs: { volume: recent.legs, deltaPct: pct("legs") },
  };
}

/**
 * Compute combined-strength delta as a single percentage.
 * Sum of "best top weight in window" across the top N lifts vs.
 * sum of "best top weight in baseline window".
 */
function computeCombinedStrengthDelta(
  lifts: Record<string, LiftEntry[]>,
  windowWeeks: number
): number | null {
  const cutoff = Date.now() - windowWeeks * MS_PER_WEEK;
  const baselineCutoff = Date.now() - windowWeeks * 2 * MS_PER_WEEK;

  let recentSum = 0;
  let baselineSum = 0;
  let liftsWithData = 0;

  for (const entries of Object.values(lifts)) {
    if (!entries || entries.length === 0) continue;
    const recent = entries.filter((e) => {
      const t = new Date(e.date).getTime();
      return !Number.isNaN(t) && t >= cutoff && e.weight > 0;
    });
    const baseline = entries.filter((e) => {
      const t = new Date(e.date).getTime();
      return !Number.isNaN(t) && t >= baselineCutoff && t < cutoff && e.weight > 0;
    });
    if (recent.length === 0 || baseline.length === 0) continue;
    recentSum += Math.max(...recent.map((e) => e.weight));
    baselineSum += Math.max(...baseline.map((e) => e.weight));
    liftsWithData += 1;
  }

  if (liftsWithData < 2 || baselineSum === 0) return null;
  return Math.round(((recentSum - baselineSum) / baselineSum) * 100);
}

/** Top lifts ranked by absolute delta (then by recency). */
function computeTopLifts(
  lifts: Record<string, LiftEntry[]>,
  windowWeeks: number,
  limit = 4
): TopLiftEntry[] {
  const result: TopLiftEntry[] = [];
  for (const [name, entries] of Object.entries(lifts)) {
    if (!entries || entries.length === 0) continue;
    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latest = sorted[sorted.length - 1];
    const baselineWeight = rollingMeanWeight(sorted, windowWeeks);
    const isBodyweight = (bestEntry(sorted)?.weight ?? 0) === 0;
    const delta = isBodyweight
      ? latest.reps - rollingMeanReps(sorted, windowWeeks)
      : latest.weight - baselineWeight;
    result.push({
      name,
      latestWeight: latest.weight,
      latestReps: latest.reps,
      baselineWeight,
      delta: Math.round(delta * 10) / 10,
      isBodyweight,
    });
  }
  return result
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

function rollingMeanReps(entries: LiftEntry[], weeks: number): number {
  if (entries.length === 0) return 0;
  const cutoff = Date.now() - weeks * MS_PER_WEEK;
  const recent = entries.filter((e) => {
    const t = new Date(e.date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
  const pool = recent.length > 0 ? recent : entries;
  return pool.reduce((a, e) => a + e.reps, 0) / pool.length;
}

/** Recent PRs flattened from sessions, most recent first. */
function computeRecentPRs(sessions: SessionRecord[], limit = 6): RecentPR[] {
  const out: RecentPR[] = [];
  const sorted = [...sessions].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? "")
  );
  for (const s of sorted) {
    if (!s.prs) continue;
    for (const pr of s.prs) {
      out.push({
        liftName: pr.name,
        weight: pr.weight,
        reps: pr.reps,
        date: s.date ?? "",
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Lifts that should be hidden from top_lifts / PR feed because the user
 * has an active injury that contraindicates them. The canonical list lives
 * in INJURY_SWAPS — any lift that is a *key* of a swap for one of the
 * user's active injuries is contraindicated and should be silently dropped.
 */
function computeInjuryHiddenLifts(injuries: string[]): string[] {
  const hidden = new Set<string>();
  for (const injury of injuries) {
    const swaps = INJURY_SWAPS[injury];
    if (!swaps) continue;
    for (const liftName of Object.keys(swaps)) hidden.add(liftName);
  }
  return Array.from(hidden);
}

/**
 * Lifts that were reintroduced recently — their first entry is within the
 * last 14 days AND there was a prior training gap of 4+ weeks before that
 * entry. Used by the post-return archetypes (3, 8) to celebrate comeback work.
 */
function computeReintroducedLifts(lifts: Record<string, LiftEntry[]>): string[] {
  const now = Date.now();
  const recentCutoff = now - 14 * 24 * 60 * 60 * 1000;
  const gapThreshold = 4 * 7 * 24 * 60 * 60 * 1000;
  const out: string[] = [];

  for (const [name, entries] of Object.entries(lifts)) {
    if (!entries || entries.length === 0) continue;
    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = new Date(sorted[0].date).getTime();
    if (Number.isNaN(first)) continue;
    // Only surface if the lift first appears in the recent window.
    if (first < recentCutoff) continue;
    // And only if there was a training gap before it — heuristic: no entries
    // in the 4 weeks prior to the first entry. A brand-new user will match
    // this too, which is fine — we gate by "return" context in the engine.
    const priorCutoff = first - gapThreshold;
    const hasPrior = sorted.some((e) => {
      const t = new Date(e.date).getTime();
      return !Number.isNaN(t) && t < first && t >= priorCutoff;
    });
    if (!hasPrior) out.push(name);
  }
  return out;
}

/**
 * Distinct sessions in the current block where any logged exercise carries
 * the Mobility tag from the exercise library. The Progress page surfaces
 * this count on the mobility_log card for users on maintain / post-menopause
 * / perimenopause goals where mobility work is part of the picture.
 */
function computeMobilitySessionsThisBlock(
  sessions: SessionRecord[],
  currentWeek: number
): number {
  const blockStart = Math.max(1, currentWeek - 2);
  const datesWithMobility = new Set<string>();
  for (const s of sessions) {
    if (typeof s.weekNum !== "number" || s.weekNum < blockStart) continue;
    if (!s.date) continue;
    const logs = s.logs ? Object.values(s.logs) : [];
    const hasMobility = logs.some((raw) => {
      const ex = raw as { name?: string };
      if (!ex?.name) return false;
      const meta = findExercise(ex.name);
      return meta?.tags?.includes("Mobility");
    });
    if (hasMobility) datesWithMobility.add(s.date);
  }
  return datesWithMobility.size;
}

/**
 * Rehab sets logged in the current block, counted from session exercise
 * tags. "Activation", "Stability", "Isometric" tags all count as rehab
 * work for the purposes of the rehab card. Uses exercise-library metadata.
 */
function computeRehabSetsThisBlock(
  sessions: SessionRecord[],
  currentWeek: number
): number {
  const blockStart = Math.max(1, currentWeek - 2); // current 3-week block
  let sets = 0;
  for (const s of sessions) {
    if (typeof s.weekNum !== "number" || s.weekNum < blockStart) continue;
    const logs = s.logs ? Object.values(s.logs) : [];
    for (const raw of logs) {
      const ex = raw as { name?: string; actual?: { reps?: string; weight?: string }[] };
      if (!ex?.name) continue;
      const meta = findExercise(ex.name);
      if (!meta) continue;
      const tags = meta.tags ?? [];
      const isRehab = tags.some((t) =>
        t === "Activation" || t === "Stability" || t === "Isometric"
      );
      if (!isRehab) continue;
      const done = (ex.actual ?? []).filter((set) => Number(set?.reps ?? 0) > 0).length;
      sets += done;
    }
  }
  return sets;
}

function detectReturnToTraining(
  sessions: SessionRecord[],
  injuries: string[]
): number | null {
  // If postpartum is flagged as an injury, anchor to first session after a >= 4 week gap.
  if (!injuries.includes("postpartum")) return null;
  const dated = sessions
    .map((s) => s.date)
    .filter(isISODate)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (dated.length === 0) return null;
  // Find the largest gap; if >= 4 weeks, the first session after it is the return.
  let returnTime: number | null = null;
  for (let i = 1; i < dated.length; i++) {
    if (dated[i] - dated[i - 1] >= 4 * MS_PER_WEEK) {
      returnTime = dated[i];
    }
  }
  if (returnTime === null) returnTime = dated[0];
  return Math.max(1, Math.round((Date.now() - returnTime) / MS_PER_WEEK));
}

/**
 * Build the engine's view of training history from the persisted progressDB.
 * Pure function — no side effects, no store reads.
 */
export function deriveEngineHistory(
  progressDB: ProgressDBLike,
  options: { windowWeeks?: number; injuries?: string[] } = {}
): EngineHistory {
  const windowWeeks = options.windowWeeks ?? 6;
  const injuries = options.injuries ?? [];
  const sessions = progressDB.sessions ?? [];
  const lifts = progressDB.lifts ?? {};

  const sessionDates = sessions.map((s) => s.date).filter(isISODate);
  const sessionCountTotal = sessions.length;
  const sessionsThisWeek = sessions.filter(
    (s) => s.weekNum === progressDB.currentWeek
  ).length;

  // Target this week comes from week feedback or just defaults to 3.
  // (We don't have a hard "planned days" reachable from progressDB; the
  // store has trainingDays at the top level — caller can pass it later.)
  const targetThisWeek = 3;

  const weeksTraining = countWeeks(sessionDates);

  const phaseInfo = sessionCountTotal > 0
    ? getCurrentPhaseInfo(progressDB.currentWeek, progressDB.phaseOffset ?? 0)
    : null;
  const currentPhaseLabel = phaseInfo
    ? `Phase ${phaseInfo.blockNum} · ${phaseInfo.phase.name} · wk ${phaseInfo.blockWeek}`
    : "";
  const currentPhaseShort = phaseInfo
    ? `P${phaseInfo.blockNum} · wk ${phaseInfo.blockWeek}/3`
    : "";

  const recentPRs = computeRecentPRs(sessions);
  const recentPRCount = sessions.reduce((sum, s) => sum + (s.prs?.length ?? 0), 0);

  const topLifts = computeTopLifts(lifts, windowWeeks);
  const patternBalance = computePatternBalance(sessions, windowWeeks);
  const combinedStrengthDeltaPct = computeCombinedStrengthDelta(lifts, windowWeeks);

  const recentSessions = sessions.slice(-windowWeeks * 4); // ~4 sessions/wk
  const avgEffort = mean(
    recentSessions
      .map((s) => s.effort)
      .filter((e): e is number => typeof e === "number" && e > 0)
  );

  const symptomDays = sessions
    .filter((s) => Array.isArray(s.changes) && s.changes.some((c) => c.icon === "🩸" || c.title?.toLowerCase().includes("symptom")))
    .map((s) => s.date)
    .filter(isISODate);

  const weeksSinceReturn = detectReturnToTraining(sessions, injuries);

  const injuryHiddenLifts = computeInjuryHiddenLifts(injuries);
  const reintroducedLifts = computeReintroducedLifts(lifts);
  const rehabSetsThisBlock = computeRehabSetsThisBlock(sessions, progressDB.currentWeek ?? 1);
  const mobilitySessionsThisBlock = computeMobilitySessionsThisBlock(
    sessions,
    progressDB.currentWeek ?? 1
  );

  // Tempo adherence still needs a per-set tempo target field on session
  // logs that doesn't exist yet — surfaced as null until then.
  return {
    sessionCountTotal,
    sessionsThisWeek,
    targetThisWeek,
    weeksTraining,
    weeksSinceReturn,
    currentPhaseLabel,
    currentPhaseShort,
    currentPhaseName: phaseInfo?.phase.name ?? null,
    recentPRCount,
    recentPRs,
    topLifts,
    patternBalance,
    combinedStrengthDeltaPct,
    avgEffort,
    symptomDays,
    injuryHiddenLifts,
    reintroducedLifts,
    rehabSetsThisBlock,
    mobilitySessionsThisBlock,
    tempoAdherence: null,
  };
}
