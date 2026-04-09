// ── Condition Context ──────────────────────────────────────────────
//
// Thin consumer over src/data/condition-rules.ts. Provides the
// stacking primitive `mergeConditionRules` and a small set of
// projection functions that other modules use.
//
// SPEC: docs/specs/condition-context-contract.md
// DATA: src/data/condition-rules.ts
//
// This file holds NO content. Every cue, cap, modifier, and
// framing string lives in the authored data library. All edits
// to condition content go there, reviewed in PRs.
//
// Exports:
//   - mergeConditionRules(ids)   — core stacking primitive
//   - getConditionRule(id)       — single-condition lookup
//   - getConditionContext(ids)   — LLM framing string (back-compat
//                                   signature; used by week-builder)
//   - getConditionCoachNote(ids) — user-facing plain-language note
//   - getConditionRedFlags(ids)  — list of safety phrases
//   - getConditionRedFlagKeywords(ids) — scan index for note matching

import {
  CONDITION_RULES,
  type ConditionRule,
  type ConditionExerciseRules,
  type ConditionWarmupMods,
  type WarmupBlockRef,
} from "@/data/condition-rules";
import type {
  ConditionId,
  MovementPattern,
} from "@/data/exercise-indications";
import type { CyclePhase } from "./cycle";

// ── Utility primitives ─────────────────────────────────────────────

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items));
}

function uniquePatterns(items: MovementPattern[]): MovementPattern[] {
  return Array.from(new Set(items));
}

function uniqueBlocksById(blocks: WarmupBlockRef[]): WarmupBlockRef[] {
  const seen = new Set<string>();
  const out: WarmupBlockRef[] = [];
  for (const b of blocks) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    out.push(b);
  }
  return out;
}

/**
 * Merge per-pattern modifier cues. Multiple conditions that cue the
 * same pattern get their cues concatenated with "; ". Substring
 * dedupe prevents near-duplicates piling up.
 */
function mergeModifiers(
  modLists: Array<Partial<Record<MovementPattern, string>>>,
): Partial<Record<MovementPattern, string>> {
  const merged: Partial<Record<MovementPattern, string>> = {};
  for (const mods of modLists) {
    for (const [pattern, cue] of Object.entries(mods)) {
      if (!cue) continue;
      const key = pattern as MovementPattern;
      const existing = merged[key];
      if (!existing) {
        merged[key] = cue;
      } else {
        // Dedupe on the first 20-char substring to catch near-duplicates.
        const head = cue.slice(0, 20).toLowerCase();
        if (!existing.toLowerCase().includes(head)) {
          merged[key] = existing + "; " + cue;
        }
      }
    }
  }
  return merged;
}

/**
 * Merge per-phase volume multipliers. Multiplicative across
 * conditions for each phase. Missing phases in a given condition
 * default to 1.0 (no dampening from that condition).
 */
function mergePhaseMultipliers(
  rules: ConditionRule[],
): Partial<Record<CyclePhase, number>> {
  const phases: CyclePhase[] = [
    "menstrual",
    "follicular",
    "ovulatory",
    "luteal",
  ];
  const out: Partial<Record<CyclePhase, number>> = {};
  for (const phase of phases) {
    let multiplier = 1.0;
    let anySet = false;
    for (const r of rules) {
      const p = r.exerciseRules.volumeMultiplier?.phases?.[phase];
      if (typeof p === "number") {
        multiplier *= p;
        anySet = true;
      }
    }
    if (anySet) out[phase] = multiplier;
  }
  return out;
}

// ── Empty / identity rule ──────────────────────────────────────────

const EMPTY_EXERCISE_RULES: ConditionExerciseRules = {
  avoidPatterns: [],
  cautionPatterns: [],
  modifiers: {},
  volumeMultiplier: { default: 1.0 },
  workingLoadCap: 1.0,
  heavyTopSetsAllowed: true,
};

const EMPTY_WARMUP_MODS: ConditionWarmupMods = {
  addBlocks: [],
  removeBlocks: [],
  cues: [],
};

function emptyRule(): ConditionRule {
  return {
    // "none" is deliberately not a ConditionId — this object is only
    // ever returned by mergeConditionRules for empty input and
    // consumers should treat the id as opaque.
    id: "none" as ConditionId,
    displayName: "None",
    summary: "",
    globalFraming: "",
    coachNote: "",
    exerciseRules: {
      avoidPatterns: [],
      cautionPatterns: [],
      modifiers: {},
      volumeMultiplier: { default: 1.0 },
      workingLoadCap: 1.0,
      heavyTopSetsAllowed: true,
    },
    warmupMods: {
      addBlocks: [],
      removeBlocks: [],
      cues: [],
    },
    educationTags: [],
    redFlags: [],
    redFlagKeywords: [],
  };
}

// ── Single-rule lookup ─────────────────────────────────────────────

/** Look up a single condition rule. Returns undefined for unknown ids. */
export function getConditionRule(
  id: ConditionId,
): ConditionRule | undefined {
  return CONDITION_RULES[id];
}

// ── Core stacking primitive ────────────────────────────────────────

/**
 * Merge multiple conditions into a single ConditionRule. Stacking
 * rules per docs/specs/condition-rules.md §"Stacking rules":
 *
 *   - avoidPatterns / cautionPatterns → union
 *   - modifiers → concatenated per pattern, substring-deduped
 *   - volumeMultiplier.default → multiplicative
 *   - volumeMultiplier.phases → multiplicative per phase
 *   - workingLoadCap → minimum wins
 *   - repRangeFloor → maximum wins
 *   - heavyTopSetsAllowed → AND (any false wins)
 *   - warmupMods.addBlocks → union, dedupe by id
 *   - warmupMods.removeBlocks / cues → union
 *   - redFlags → union
 *   - redFlagKeywords → union, deduped by phrase
 *   - educationTags → union
 *
 * Unknown ids are silently dropped. Empty input returns the
 * identity rule.
 */
export function mergeConditionRules(ids: ConditionId[]): ConditionRule {
  if (!ids || ids.length === 0) return emptyRule();

  const rules: ConditionRule[] = [];
  for (const id of ids) {
    const r = CONDITION_RULES[id];
    if (r) rules.push(r);
  }

  if (rules.length === 0) return emptyRule();
  if (rules.length === 1) return rules[0];

  const workingLoadCap = Math.min(
    ...rules.map((r) => r.exerciseRules.workingLoadCap ?? 1),
  );
  const repRangeFloorValues = rules
    .map((r) => r.exerciseRules.repRangeFloor)
    .filter((v): v is number => typeof v === "number");
  const repRangeFloor =
    repRangeFloorValues.length > 0 ? Math.max(...repRangeFloorValues) : undefined;

  const defaultVolumeMult = rules.reduce(
    (acc, r) => acc * (r.exerciseRules.volumeMultiplier?.default ?? 1),
    1,
  );

  return {
    id: ("merged:" + ids.join("+")) as ConditionId,
    displayName: rules.map((r) => r.displayName).join(" + "),
    summary: rules.map((r) => r.summary).filter(Boolean).join(" "),
    globalFraming: rules
      .map((r) => r.globalFraming)
      .filter(Boolean)
      .join("\n\n"),
    coachNote: rules.map((r) => r.coachNote).filter(Boolean).join(" "),
    exerciseRules: {
      avoidPatterns: uniquePatterns(
        rules.flatMap((r) => r.exerciseRules.avoidPatterns),
      ),
      cautionPatterns: uniquePatterns(
        rules.flatMap((r) => r.exerciseRules.cautionPatterns),
      ),
      modifiers: mergeModifiers(rules.map((r) => r.exerciseRules.modifiers)),
      volumeMultiplier: {
        default: defaultVolumeMult,
        phases: mergePhaseMultipliers(rules),
      },
      workingLoadCap,
      ...(repRangeFloor !== undefined ? { repRangeFloor } : {}),
      heavyTopSetsAllowed: rules.every(
        (r) => r.exerciseRules.heavyTopSetsAllowed !== false,
      ),
    },
    warmupMods: {
      addBlocks: uniqueBlocksById(
        rules.flatMap((r) => r.warmupMods.addBlocks),
      ),
      removeBlocks: uniqueStrings(
        rules.flatMap((r) => r.warmupMods.removeBlocks),
      ),
      cues: uniqueStrings(rules.flatMap((r) => r.warmupMods.cues)),
    },
    educationTags: uniqueStrings(rules.flatMap((r) => r.educationTags)),
    redFlags: uniqueStrings(rules.flatMap((r) => r.redFlags)),
    redFlagKeywords: (() => {
      const seen = new Set<string>();
      const out: { phrase: string; keywords: string[] }[] = [];
      for (const r of rules) {
        for (const entry of r.redFlagKeywords) {
          if (seen.has(entry.phrase)) continue;
          seen.add(entry.phrase);
          out.push(entry);
        }
      }
      return out;
    })(),
  };
}

// ── Projection: LLM framing ────────────────────────────────────────

/**
 * Build the condition-context string injected into the week-builder
 * system prompt. Preserves the legacy "- Health conditions: ..."
 * format for backward compatibility with the existing prompt layout.
 *
 * Returns empty string when no conditions apply.
 */
export function getConditionContext(
  conditions: string[] | null | undefined,
): string {
  if (!conditions || conditions.length === 0) return "";

  const parts: string[] = [];
  for (const id of conditions) {
    const rule = CONDITION_RULES[id as ConditionId];
    if (!rule) continue;
    parts.push(rule.displayName + " — " + rule.globalFraming);
  }

  if (parts.length === 0) return "";
  return "\n- Health conditions: " + parts.join("; ");
}

// ── Projection: user-facing coach note ─────────────────────────────

/**
 * User-facing plain-language note describing how the programme is
 * adapting for the user's conditions. Rendered on the week card.
 *
 * Returns empty string when no conditions apply.
 */
export function getConditionCoachNote(
  conditions: string[] | null | undefined,
): string {
  if (!conditions || conditions.length === 0) return "";
  const notes: string[] = [];
  for (const id of conditions) {
    const rule = CONDITION_RULES[id as ConditionId];
    if (rule?.coachNote) notes.push(rule.coachNote);
  }
  return notes.join(" ");
}

// ── Projection: red flags ──────────────────────────────────────────

/**
 * List of red-flag symptom phrases across all the user's conditions.
 * Consumed by session-analysis to surface "talk to your clinician"
 * prompts when logged notes mention any of these patterns.
 *
 * Returns empty array when no conditions apply.
 */
export function getConditionRedFlags(
  conditions: string[] | null | undefined,
): string[] {
  if (!conditions || conditions.length === 0) return [];
  const flags: string[] = [];
  for (const id of conditions) {
    const rule = CONDITION_RULES[id as ConditionId];
    if (rule) flags.push(...rule.redFlags);
  }
  return uniqueStrings(flags);
}

// ── Projection: red-flag keyword scan index ────────────────────────

/**
 * Scan index for session-analysis: each entry pairs a user-facing
 * phrase with the curated keywords that should trigger it. Deduped
 * by phrase across conditions.
 *
 * Returns empty array when no conditions apply.
 */
export function getConditionRedFlagKeywords(
  conditions: string[] | null | undefined,
): { phrase: string; keywords: string[] }[] {
  if (!conditions || conditions.length === 0) return [];
  const seen = new Set<string>();
  const out: { phrase: string; keywords: string[] }[] = [];
  for (const id of conditions) {
    const rule = CONDITION_RULES[id as ConditionId];
    if (!rule) continue;
    for (const entry of rule.redFlagKeywords) {
      if (seen.has(entry.phrase)) continue;
      seen.add(entry.phrase);
      out.push(entry);
    }
  }
  return out;
}
