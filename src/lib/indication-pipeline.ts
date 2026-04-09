// ── Indication Pipeline ──
//
// Implements the resolution pipeline from
// docs/specs/exercise-indications.md §3.
//
//   candidate pool → hard filters → soft scoring → modifiers
//     → pick winner → apply cycle envelope
//
// This module is the single source of truth for turning an
// ExerciseIndication + user context into (a) a filtered pool the LLM
// can pick from, (b) a deterministic winner when the LLM is offline,
// and (c) a modulated prescription per cycle phase.
//
// Consumers:
//   - week-builder.ts — pool filtering, cycle envelope post-processing
//   - fallback builder — deterministic picks when the LLM fails
//   - exercise swap sheet — ranked alternatives for a slot

import {
  EXERCISE_INDICATIONS,
  type ExerciseIndication,
  type InjuryId,
  type ConditionId,
  type LifeStageKey,
  type SessionRole,
  type PhaseEnvelope,
} from "@/data/exercise-indications";
import { EXERCISE_LIBRARY, type Exercise } from "@/data/exercise-library";
import type { CyclePhase } from "./cycle";

// ── Context types ──────────────────────────────────────────────────

export interface UserContext {
  goal: "muscle" | "strength" | "general";
  experience: "new" | "developing" | "intermediate";
  equipment: string[];
  injuries: string[]; // free-text ids — we treat anything matching InjuryId as a hard filter
  conditions: string[];
  lifeStage?: LifeStageKey;
  cyclePhase?: CyclePhase;
  /** Exercises programmed in the last 7 days — used for variety bonus. */
  recentlyProgrammed?: Set<string>;
}

export interface SlotRequirement {
  /** Which muscle group(s) are acceptable for this slot. */
  muscles: Array<"legs" | "hinge" | "push" | "pull" | "core" | "cardio" | "calisthenics">;
  /** Session role this slot is filling (primary / accessory / etc.) */
  role: SessionRole;
  /** Optional: which movement pattern this slot needs to hit for weekly balance. */
  pattern?: ExerciseIndication["movementPattern"];
}

export interface ScoredCandidate {
  exercise: Exercise;
  indication: ExerciseIndication;
  score: number;
  factors: string[]; // top-N reason strings, highest first
}

// ── Hard filters (§3 step 1) ───────────────────────────────────────

const EXPERIENCE_RANK: Record<string, number> = {
  new: 0,
  developing: 1,
  intermediate: 2,
};

export function passesHardFilters(
  ex: Exercise,
  ind: ExerciseIndication,
  ctx: UserContext,
): { ok: true } | { ok: false; reason: string } {
  // Equipment: the exercise must be doable with at least one kit item the user has
  const hasKit = ex.equip.some((e) => ctx.equipment.includes(e));
  if (!hasKit) return { ok: false, reason: `equipment (${ex.equip.join("/")})` };

  // Extra required equipment beyond ex.equip[]
  if (ind.requiresEquipment && ind.requiresEquipment.length > 0) {
    const hasExtra = ind.requiresEquipment.every((e) => ctx.equipment.includes(e));
    if (!hasExtra) return { ok: false, reason: `needs ${ind.requiresEquipment.join(", ")}` };
  }

  // Experience minimum
  const userExpRank = EXPERIENCE_RANK[ctx.experience] ?? 0;
  const minExpRank = EXPERIENCE_RANK[ind.experience.min] ?? 0;
  if (userExpRank < minExpRank) {
    return { ok: false, reason: `experience < ${ind.experience.min}` };
  }

  // Injury avoidance
  for (const injury of ctx.injuries) {
    if (ind.injuryAvoid.includes(injury as InjuryId)) {
      return { ok: false, reason: `injury (${injury})` };
    }
  }

  // Condition avoidance (hard drop)
  for (const cond of ctx.conditions) {
    if (ind.conditionAvoid.includes(cond as ConditionId)) {
      return { ok: false, reason: `condition (${cond})` };
    }
  }

  // Life stage: "neutral" / "modified" / "preferred" do not drop; only explicit "avoid" would,
  // and we deliberately keep pregnancy/postpartum out of the schema per spec §9.
  // So there's nothing to filter here yet.

  return { ok: true };
}

// ── Soft scoring (§3 step 2) ───────────────────────────────────────

export function scoreExercise(
  ex: Exercise,
  ind: ExerciseIndication,
  ctx: UserContext,
  slot?: SlotRequirement,
): ScoredCandidate {
  let score = 0;
  const factors: Array<{ pts: number; label: string }> = [];

  // +30 goal alignment
  if (ind.goal.includes(ctx.goal)) {
    score += 30;
    factors.push({ pts: 30, label: `matches your ${ctx.goal} goal` });
  }

  // +20 sessionRole matches slot requirement
  if (slot && ind.sessionRole.includes(slot.role)) {
    score += 20;
    factors.push({ pts: 20, label: `fits a ${slot.role} slot` });
  }

  // +15 stimulusProfile carries the right stimulus for the goal
  const stimulusMatch =
    (ctx.goal === "strength" && ind.stimulusProfile.includes("strength")) ||
    (ctx.goal === "muscle" && ind.stimulusProfile.includes("hypertrophy")) ||
    (ctx.goal === "general" && ind.stimulusProfile.includes("endurance"));
  if (stimulusMatch) {
    score += 15;
    factors.push({ pts: 15, label: `the right stimulus for ${ctx.goal}` });
  }

  // +15 movementPattern fills a weekly-balance gap
  if (slot?.pattern && ind.movementPattern === slot.pattern) {
    score += 15;
    factors.push({ pts: 15, label: `fills the ${slot.pattern} pattern` });
  }

  // +10 loadability matches progression need (high for strength/muscle, low is fine for general)
  const loadabilityMatch =
    (ctx.goal !== "general" && ind.loadability === "high") ||
    (ctx.goal === "general" && ind.loadability !== "low");
  if (loadabilityMatch) {
    score += 10;
    factors.push({ pts: 10, label: "highly progressable" });
  }

  // +5 experience sweet spot (ideal matches user)
  if (ind.experience.ideal === ctx.experience) {
    score += 5;
    factors.push({ pts: 5, label: "matches your experience exactly" });
  }

  // +5 variety bonus (not recently programmed)
  if (ctx.recentlyProgrammed && !ctx.recentlyProgrammed.has(ex.name)) {
    score += 5;
    factors.push({ pts: 5, label: "fresh — not recently used" });
  }

  // ── Modifiers (§3 step 3) ──
  // −10 lifeStage marks as "modified" (still usable, lower priority)
  if (ctx.lifeStage && ind.lifeStage?.[ctx.lifeStage] === "modified") {
    score -= 10;
    factors.push({ pts: -10, label: `modified for ${ctx.lifeStage}` });
  }
  // +5 if explicitly preferred for this life stage
  if (ctx.lifeStage && ind.lifeStage?.[ctx.lifeStage] === "preferred") {
    score += 5;
    factors.push({ pts: 5, label: `preferred for ${ctx.lifeStage}` });
  }

  // −5 technicalDemand > user experience comfort zone (new → cap at 2, developing → cap at 4)
  const comfortCap = ctx.experience === "new" ? 2 : ctx.experience === "developing" ? 4 : 5;
  if (ind.technicalDemand > comfortCap) {
    score -= 5;
    factors.push({ pts: -5, label: "technically demanding for your level" });
  }

  // Sort factors highest-absolute first for the "Why this?" reveal
  factors.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));

  return {
    exercise: ex,
    indication: ind,
    score,
    factors: factors.slice(0, 3).map((f) => f.label),
  };
}

// ── Pool filtering (§3 step 1) ─────────────────────────────────────

/**
 * Return every library exercise that passes hard filters for the user.
 * This is the "selectable pool" — the LLM should pick exclusively from here.
 */
export function filterPool(ctx: UserContext): ScoredCandidate[] {
  const out: ScoredCandidate[] = [];
  for (const ex of EXERCISE_LIBRARY) {
    const ind = EXERCISE_INDICATIONS[ex.name];
    if (!ind) continue;
    const check = passesHardFilters(ex, ind, ctx);
    if (!check.ok) continue;
    out.push(scoreExercise(ex, ind, ctx));
  }
  return out.sort((a, b) => b.score - a.score);
}

// ── Pick winner for a specific slot (§3 step 4) ────────────────────

export function pickForSlot(
  slot: SlotRequirement,
  ctx: UserContext,
): ScoredCandidate | null {
  const candidates: ScoredCandidate[] = [];
  for (const ex of EXERCISE_LIBRARY) {
    if (!slot.muscles.includes(ex.muscle)) continue;
    const ind = EXERCISE_INDICATIONS[ex.name];
    if (!ind) continue;
    const check = passesHardFilters(ex, ind, ctx);
    if (!check.ok) continue;
    candidates.push(scoreExercise(ex, ind, ctx, slot));
  }

  if (candidates.length === 0) return null;

  // Sort by score desc. Ties broken by variety (not recently programmed)
  // then alphabetical (deterministic).
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aRecent = ctx.recentlyProgrammed?.has(a.exercise.name) ? 1 : 0;
    const bRecent = ctx.recentlyProgrammed?.has(b.exercise.name) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent; // non-recent first
    return a.exercise.name.localeCompare(b.exercise.name);
  });

  return candidates[0];
}

/**
 * Rank top-N alternatives for a slot.
 * Used by the exercise swap sheet to show "other options you could do here".
 */
export function rankAlternatives(
  slot: SlotRequirement,
  ctx: UserContext,
  n = 5,
): ScoredCandidate[] {
  const candidates: ScoredCandidate[] = [];
  for (const ex of EXERCISE_LIBRARY) {
    if (!slot.muscles.includes(ex.muscle)) continue;
    const ind = EXERCISE_INDICATIONS[ex.name];
    if (!ind) continue;
    const check = passesHardFilters(ex, ind, ctx);
    if (!check.ok) continue;
    candidates.push(scoreExercise(ex, ind, ctx, slot));
  }
  candidates.sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));
  return candidates.slice(0, n);
}

// ── Cycle envelope application (§3 step 5) ─────────────────────────

export interface CycleModulatedPrescription {
  /** Scaled set count. Integer. */
  setMultiplier: number;
  /** Working-load cap: 0–1 multiplier on prescribed load for this phase. */
  workingLoadCap: number;
  /** Whether a heavy 3–6 rep top set is appropriate in this phase for this lift. */
  heavyTopSetsAllowed: boolean;
  /** UI copy to surface on the session card, or null if neutral. */
  framing: string | null;
}

const NEUTRAL_ENVELOPE: CycleModulatedPrescription = {
  setMultiplier: 1.0,
  workingLoadCap: 1.0,
  heavyTopSetsAllowed: true,
  framing: null,
};

/**
 * Compute the cycle-modulated prescription envelope for an exercise.
 * Always returns a usable envelope (falling back to neutral for
 * exercises with no modulation or users not in a tracked cycle).
 */
export function getCycleEnvelope(
  exerciseName: string,
  phase: CyclePhase | null | undefined,
): CycleModulatedPrescription {
  if (!phase) return NEUTRAL_ENVELOPE;
  const ind = EXERCISE_INDICATIONS[exerciseName];
  if (!ind?.cycleModulation) return NEUTRAL_ENVELOPE;
  const env: PhaseEnvelope | undefined = ind.cycleModulation[phase];
  if (!env) return NEUTRAL_ENVELOPE;
  return {
    setMultiplier: env.volumeMultiplier ?? 1.0,
    workingLoadCap: env.workingLoadCap ?? 1.0,
    heavyTopSetsAllowed: env.heavyTopSetsAllowed ?? true,
    framing: env.framing ?? null,
  };
}

/**
 * Apply the cycle envelope to a prescribed set count string.
 * Handles integers ("3"), ranges ("3-4"), and timed values ("30 sec") safely.
 */
export function modulateSetCount(
  setsStr: string,
  multiplier: number,
): string {
  if (multiplier === 1.0) return setsStr;

  // Range like "3-4"
  const rangeMatch = setsStr.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const lo = Math.max(1, Math.round(Number(rangeMatch[1]) * multiplier));
    const hi = Math.max(lo, Math.round(Number(rangeMatch[2]) * multiplier));
    return lo === hi ? String(lo) : `${lo}-${hi}`;
  }

  // Plain integer
  const intMatch = setsStr.match(/^(\d+)$/);
  if (intMatch) {
    const n = Math.max(1, Math.round(Number(intMatch[1]) * multiplier));
    return String(n);
  }

  // Anything else — return as-is (timed durations, etc.)
  return setsStr;
}

// ── Template swap (replaces injury-swaps + condition-swaps + equip-swaps) ─
//
// Given a list of exercise names from a hand-curated session template,
// keep each exercise if it passes the user's hard filters; otherwise
// find the highest-scoring alternative in the same muscle group.
// Returns parallel arrays of (final name, original name when swapped,
// reason key) so the UI can show the "↻ adapted" chip.

export interface SwappedTemplateExercise {
  name: string;
  swappedFrom?: string;
  swappedReason?: string;
}

export function swapTemplateExercises(
  names: string[],
  ctx: UserContext,
): SwappedTemplateExercise[] {
  return names.map((name) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.name === name);
    if (!ex) return { name };
    const ind = EXERCISE_INDICATIONS[name];
    if (!ind) return { name };

    const check = passesHardFilters(ex, ind, ctx);
    if (check.ok) return { name };

    // Find a replacement in the same muscle group
    const replacement = pickForSlot(
      { muscles: [ex.muscle], role: ind.sessionRole[0] ?? "accessory" },
      ctx,
    );
    if (!replacement || replacement.exercise.name === name) {
      // No safe alternative found — return the original. The user will
      // see the indication-pipeline rationale and can swap manually.
      return { name };
    }

    return {
      name: replacement.exercise.name,
      swappedFrom: name,
      swappedReason: check.reason,
    };
  });
}

// ── Generic full-body picker (replaces hardcoded fallback names) ────
//
// Builds a balanced full-body session by picking the highest-scoring
// candidate for each pattern slot in turn. Slots run in this order:
// squat → hinge → push → pull → core → finisher. We stop once we hit
// `count` exercises.

export function pickGenericFullBody(
  ctx: UserContext,
  count: number,
): ScoredCandidate[] {
  const slots: SlotRequirement[] = [
    { muscles: ["legs"], role: "primary", pattern: "squat" },
    { muscles: ["hinge"], role: "primary", pattern: "hinge" },
    { muscles: ["push"], role: "primary", pattern: "horizontalPush" },
    { muscles: ["pull"], role: "primary", pattern: "horizontalPull" },
    { muscles: ["core"], role: "accessory" },
    { muscles: ["legs", "hinge"], role: "accessory" },
    { muscles: ["push", "pull"], role: "accessory" },
  ];
  const picked: ScoredCandidate[] = [];
  const used = new Set<string>();
  for (const slot of slots) {
    if (picked.length >= count) break;
    // Avoid picking the same exercise twice in one session
    const ctxWithUsed: UserContext = {
      ...ctx,
      recentlyProgrammed: new Set([...(ctx.recentlyProgrammed ?? []), ...used]),
    };
    const winner = pickForSlot(slot, ctxWithUsed);
    if (winner && !used.has(winner.exercise.name)) {
      picked.push(winner);
      used.add(winner.exercise.name);
    }
  }
  return picked;
}

// ── Utility: pool as prompt-friendly metadata ──────────────────────

/**
 * Format the filtered pool for an LLM prompt, bucketed by muscle
 * group, with lightweight metadata (session role, fatigue cost,
 * loadability) so the model can pick intelligently.
 */
export function formatPoolForPrompt(pool: ScoredCandidate[]): string {
  const byMuscle: Record<string, string[]> = {};
  for (const c of pool) {
    const muscle = c.exercise.muscle;
    const ind = c.indication;
    const role = ind.sessionRole[0]; // primary role for brevity
    const tag = `${c.exercise.name} [${role}, f${ind.fatigueCost}, L:${ind.loadability[0]}]`;
    (byMuscle[muscle] ||= []).push(tag);
  }
  return Object.entries(byMuscle)
    .map(([muscle, names]) => `${muscle}: ${names.join(", ")}`)
    .join("\n");
}
