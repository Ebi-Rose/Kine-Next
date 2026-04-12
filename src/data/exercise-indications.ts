// ── Exercise Indications ──
//
// Implements docs/specs/exercise-indications.md (v0.2).
//
// Model: every exercise in the library gets a structured "indication
// profile" that tells the engine WHEN it should be prescribed, WHEN it
// should be avoided, and HOW its prescription should be modulated
// across the user's cycle.
//
// Authorship:
//   Pass 1 — Category templates.           (see TEMPLATES below)
//   Pass 2 — Auto-fill from templates.     (see resolveTemplate() + builder)
//   Pass 3 — Manual overrides for ~50 lifts that deviate from their
//            template in meaningful ways.  (see OVERRIDES below)
//
// EXERCISE_INDICATIONS is computed deterministically at module load
// by merging templates with overrides — no runtime randomness, no
// codegen step. If you want a static snapshot for diff review, run
// scripts/dump-indications.ts (not included in initial ship).

import { EXERCISE_LIBRARY, type Exercise } from "./exercise-library";
import type { CyclePhase } from "@/lib/cycle";

// ── Types ──────────────────────────────────────────────────────────

export type MovementPattern =
  // Compound patterns
  | "squat"
  | "hinge"
  | "horizontalPush"
  | "verticalPush"
  | "horizontalPull"
  | "verticalPull"
  | "lunge"
  | "carry"
  | "rotation"
  // Lower-body isolation
  | "isolation_quad"
  | "isolation_hamstring"
  | "isolation_glute"
  | "isolation_calf"
  | "isolation_adductor_abductor"
  // Upper-body isolation
  | "isolation_lateral_delt"
  | "isolation_rear_delt"
  | "isolation_chest_fly"
  | "isolation_bicep"
  | "isolation_tricep"
  | "isolation_trap"
  // Core
  | "core_anti_extension"
  | "core_anti_rotation"
  | "core_anti_lateral_flexion"
  | "core_flexion"
  // Utility
  | "mobility"
  | "activation"
  | "cardio"
  | "skill"
  /** @deprecated Prefer a specific isolation_* or core_* sub-type.
   *  Retained so legacy data not yet re-categorised still typechecks.
   *  Remove once no call sites remain. */
  | "isolation";

export type StimulusProfile =
  | "hypertrophy"
  | "strength"
  | "power"
  | "endurance"
  | "stability"
  | "mobility";

export type SessionRole =
  | "primary"
  | "secondary"
  | "accessory"
  | "finisher"
  | "activation";

export type InjuryId =
  | "knees"
  | "lower_back"
  | "shoulder"
  | "wrist"
  | "hip"
  | "neck"
  | "ankle"
  | "postpartum"
  | "chronic_pain"
  | "limited_mobility";

export type ConditionId =
  | "pcos"
  | "fibroids"
  | "endometriosis"
  | "pelvic_floor"
  | "hypermobility";

export type LifeStageKey = "perimenopause" | "post_menopause";

export type ExperienceLevel = "new" | "developing" | "intermediate";

export interface PhaseEnvelope {
  volumeMultiplier?: number; // 0.6–1.1, default 1.0
  workingLoadCap?: number; // 0.6–1.0 multiplier on prescribed load, default 1.0
  heavyTopSetsAllowed?: boolean; // default true
  framing?: string; // UI copy template
}

export interface ExerciseIndication {
  // Prescription
  goal: Array<"muscle" | "strength" | "general">;
  experience: { min: ExperienceLevel; ideal?: ExperienceLevel };
  sessionRole: SessionRole[];
  movementPattern: MovementPattern;
  stimulusProfile: StimulusProfile[];
  unilateral: boolean;
  technicalDemand: 1 | 2 | 3 | 4 | 5;
  fatigueCost: 1 | 2 | 3 | 4 | 5;
  loadability: "low" | "medium" | "high";

  // Cycle modulation (envelope applied after selection)
  cycleModulation?: Partial<Record<CyclePhase, PhaseEnvelope>>;

  // Life stage & contra-indications
  lifeStage?: Partial<Record<LifeStageKey, "preferred" | "modified" | "neutral">>;
  injuryAvoid: InjuryId[];
  conditionAvoid: ConditionId[];
  conditionModify?: Partial<Record<ConditionId, string>>;
  requiresEquipment?: string[];

  // UI / rationale
  whyForYou: string;
  whySwapped?: string;
  badges: string[];
}

// ── Default cycle envelopes ────────────────────────────────────────
//
// The rule of thumb: only HIGH-fatigue compound lifts carry a cycle
// envelope. Low-fatigue accessory, isolation, and mobility work run
// neutral across all phases (default 1.0 volume, 1.0 working-load cap,
// heavy top sets allowed).
//
// If a category template doesn't include cycleModulation, the engine
// applies the neutral envelope by default.

const HEAVY_COMPOUND_ENVELOPE: Partial<Record<CyclePhase, PhaseEnvelope>> = {
  follicular: {
    volumeMultiplier: 1.0,
    workingLoadCap: 1.0,
    heavyTopSetsAllowed: true,
    framing: "You'll likely feel strong here — push if it's there.",
  },
  ovulatory: {
    volumeMultiplier: 1.0,
    workingLoadCap: 1.0,
    heavyTopSetsAllowed: true,
    framing: "Peak output phase. A good day for a heavy top set.",
  },
  luteal: {
    volumeMultiplier: 0.9,
    workingLoadCap: 0.9,
    heavyTopSetsAllowed: false,
    framing: "Keep it tight and controlled — save the heavy top set for next week.",
  },
  menstrual: {
    volumeMultiplier: 0.8,
    workingLoadCap: 0.85,
    heavyTopSetsAllowed: false,
    framing: "Back off the top end today. Volume over load.",
  },
};

const MODERATE_COMPOUND_ENVELOPE: Partial<Record<CyclePhase, PhaseEnvelope>> = {
  luteal: {
    volumeMultiplier: 0.95,
    workingLoadCap: 0.95,
    heavyTopSetsAllowed: true,
  },
  menstrual: {
    volumeMultiplier: 0.9,
    workingLoadCap: 0.9,
    heavyTopSetsAllowed: false,
    framing: "Controlled effort today.",
  },
};

// ── Pass 1: Category templates ─────────────────────────────────────
//
// Each template is a partial indication that gets merged into a
// default baseline when building the final profile. Matching order
// runs most-specific → least-specific; the first match wins.

type TemplateKey =
  | "legs_compound_heavy"
  | "legs_compound_unilateral"
  | "legs_compound_light"
  | "legs_iso_quad"
  | "legs_iso_hamstring"
  | "legs_iso_glute"
  | "legs_iso_calf"
  | "legs_iso_adductor_abductor"
  | "hinge_compound_heavy"
  | "hinge_compound_light"
  | "hinge_isolation"
  | "push_compound_heavy"
  | "push_compound_light"
  | "push_iso_lateral_delt"
  | "push_iso_tricep"
  | "push_iso_chest_fly"
  | "pull_compound_heavy"
  | "pull_compound_bodyweight"
  | "pull_iso_bicep"
  | "pull_iso_rear_delt"
  | "pull_iso_trap"
  | "core_stability"
  | "core_iso_flexion"
  | "core_iso_rotation"
  | "cardio"
  | "mobility"
  | "activation"
  | "calisthenics_skill";

type Template = Omit<ExerciseIndication, "whyForYou" | "whySwapped" | "badges"> & {
  whyForYou: string;
  whySwapped?: string;
  badgesBase: string[];
};

const TEMPLATES: Record<TemplateKey, Template> = {
  // ── LEGS ─────────────────────────────────────────────────────────
  legs_compound_heavy: {
    goal: ["muscle", "strength"],
    experience: { min: "new", ideal: "developing" },
    sessionRole: ["primary"],
    movementPattern: "squat",
    stimulusProfile: ["strength", "hypertrophy"],
    unilateral: false,
    technicalDemand: 3,
    fatigueCost: 5,
    loadability: "high",
    cycleModulation: HEAVY_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: ["knees", "lower_back"],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "cue exhale on exertion, avoid valsalva",
      hypermobility: "cap depth to parallel, tempo 3-1-1",
      fibroids: "reduce intra-abdominal pressure",
    },
    whyForYou:
      "A heavy compound squat pattern — one of the highest-ROI lifts we have for building lower-body strength.",
    whySwapped:
      "Picked because your primary slot needs a loaded squat and your equipment supports it.",
    badgesBase: ["compound", "high-fatigue"],
  },

  legs_compound_unilateral: {
    goal: ["muscle", "strength", "general"],
    experience: { min: "new", ideal: "developing" },
    sessionRole: ["secondary", "accessory"],
    movementPattern: "lunge",
    stimulusProfile: ["hypertrophy", "stability"],
    unilateral: true,
    technicalDemand: 3,
    fatigueCost: 4,
    loadability: "medium",
    cycleModulation: MODERATE_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: ["knees", "ankle"],
    conditionAvoid: [],
    conditionModify: {
      hypermobility: "shorter range, slower tempo",
    },
    whyForYou: "Unilateral work corrects side-to-side imbalances and builds real-world strength.",
    badgesBase: ["unilateral", "compound"],
  },

  legs_compound_light: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "squat",
    stimulusProfile: ["hypertrophy", "endurance"],
    unilateral: false,
    technicalDemand: 2,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: ["knees"],
    conditionAvoid: [],
    whyForYou: "Accessible, low-skill, and easy to progress — a great movement to build volume.",
    badgesBase: ["compound", "home-friendly"],
  },

  legs_iso_quad: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_quad",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: ["knees"],
    conditionAvoid: [],
    whyForYou: "Direct quad work — isolates the front of your thigh so you can build it without loading the spine.",
    badgesBase: ["isolation", "quads"],
  },

  legs_iso_hamstring: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_hamstring",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Isolates the hamstrings through knee flexion — complements hinge work which trains them via the hip.",
    badgesBase: ["isolation", "hamstrings"],
  },

  legs_iso_glute: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_glute",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Direct glute work — minimal lower-back involvement, easy to feel, easy to progress.",
    badgesBase: ["isolation", "glutes"],
  },

  legs_iso_calf: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_calf",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: ["ankle"],
    conditionAvoid: [],
    whyForYou: "Calf work — small muscle, but critical for ankle health and long-term knee resilience.",
    badgesBase: ["isolation", "calves"],
  },

  legs_iso_adductor_abductor: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_adductor_abductor",
    stimulusProfile: ["hypertrophy", "stability"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Hip abductors and adductors — small muscles that stabilise every squat, lunge, and step you take.",
    badgesBase: ["isolation", "stability"],
  },

  // ── HINGE ────────────────────────────────────────────────────────
  hinge_compound_heavy: {
    goal: ["muscle", "strength"],
    experience: { min: "developing", ideal: "intermediate" },
    sessionRole: ["primary"],
    movementPattern: "hinge",
    stimulusProfile: ["strength", "hypertrophy"],
    unilateral: false,
    technicalDemand: 4,
    fatigueCost: 5,
    loadability: "high",
    cycleModulation: HEAVY_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: ["lower_back", "hip"],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "cue exhale on exertion, avoid valsalva",
      hypermobility: "cap range at neutral spine",
      fibroids: "reduce intra-abdominal pressure",
    },
    whyForYou: "The most productive hinge pattern we have — heavy and progressable.",
    badgesBase: ["compound", "high-fatigue"],
  },

  hinge_compound_light: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["secondary", "accessory"],
    movementPattern: "hinge",
    stimulusProfile: ["hypertrophy", "stability"],
    unilateral: false,
    technicalDemand: 2,
    fatigueCost: 3,
    loadability: "medium",
    cycleModulation: MODERATE_COMPOUND_ENVELOPE,
    injuryAvoid: ["lower_back"],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "exhale on lift",
    },
    whyForYou: "A safer, lower-fatigue hinge pattern that still builds real posterior-chain strength.",
    badgesBase: ["compound", "home-friendly"],
  },

  hinge_isolation: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_hamstring",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: ["lower_back"],
    conditionAvoid: [],
    whyForYou: "Targeted glute work without loading the spine.",
    badgesBase: ["isolation"],
  },

  // ── PUSH ─────────────────────────────────────────────────────────
  push_compound_heavy: {
    goal: ["muscle", "strength"],
    experience: { min: "new", ideal: "developing" },
    sessionRole: ["primary", "secondary"],
    movementPattern: "horizontalPush",
    stimulusProfile: ["strength", "hypertrophy"],
    unilateral: false,
    technicalDemand: 3,
    fatigueCost: 4,
    loadability: "high",
    cycleModulation: HEAVY_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: ["shoulder", "wrist"],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "exhale on the press",
    },
    whyForYou: "A loaded upper-body press — builds real pushing strength and shoulder health.",
    badgesBase: ["compound"],
  },

  push_compound_light: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["secondary", "accessory"],
    movementPattern: "horizontalPush",
    stimulusProfile: ["hypertrophy", "endurance"],
    unilateral: false,
    technicalDemand: 2,
    fatigueCost: 3,
    loadability: "medium",
    injuryAvoid: ["shoulder", "wrist"],
    conditionAvoid: [],
    whyForYou: "Accessible upper-body pushing — scales to any level.",
    badgesBase: ["compound", "home-friendly"],
  },

  push_iso_lateral_delt: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_lateral_delt",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: ["shoulder"],
    conditionAvoid: [],
    whyForYou: "Side-delt work — the shoulder head pressing doesn't hit directly. Builds the rounded-shoulder line.",
    badgesBase: ["isolation", "shoulders"],
  },

  push_iso_tricep: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_tricep",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "medium",
    injuryAvoid: ["shoulder", "wrist"],
    conditionAvoid: [],
    whyForYou: "Direct triceps work — the muscle that makes up two-thirds of your upper arm. Pressing alone isn't enough.",
    badgesBase: ["isolation", "triceps"],
  },

  push_iso_chest_fly: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_chest_fly",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "medium",
    injuryAvoid: ["shoulder"],
    conditionAvoid: [],
    whyForYou: "Chest fly — isolates the chest through a stretched range without loading the triceps or shoulders.",
    badgesBase: ["isolation", "chest"],
  },

  // ── PULL ─────────────────────────────────────────────────────────
  pull_compound_heavy: {
    goal: ["muscle", "strength"],
    experience: { min: "new", ideal: "developing" },
    sessionRole: ["primary", "secondary"],
    movementPattern: "horizontalPull",
    stimulusProfile: ["strength", "hypertrophy"],
    unilateral: false,
    technicalDemand: 3,
    fatigueCost: 4,
    loadability: "high",
    cycleModulation: HEAVY_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: ["lower_back", "shoulder"],
    conditionAvoid: [],
    whyForYou: "Builds a strong back — critical for posture, pressing, and overall strength.",
    badgesBase: ["compound"],
  },

  pull_compound_bodyweight: {
    goal: ["muscle", "strength"],
    experience: { min: "developing" },
    sessionRole: ["primary", "secondary"],
    movementPattern: "verticalPull",
    stimulusProfile: ["strength", "hypertrophy"],
    unilateral: false,
    technicalDemand: 3,
    fatigueCost: 3,
    loadability: "medium",
    cycleModulation: MODERATE_COMPOUND_ENVELOPE,
    lifeStage: { perimenopause: "preferred" },
    injuryAvoid: ["shoulder"],
    conditionAvoid: [],
    whyForYou: "Bodyweight pulling is the gold standard for upper-body strength. Worth the climb.",
    badgesBase: ["compound", "home-friendly"],
  },

  pull_iso_bicep: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_bicep",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "medium",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Direct biceps work — your pulling lifts train them indirectly, this finishes the job.",
    badgesBase: ["isolation", "biceps"],
  },

  pull_iso_rear_delt: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_rear_delt",
    stimulusProfile: ["hypertrophy", "stability"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Rear-delt work — the shoulder head pressing and rowing miss. Key for posture and shoulder health.",
    badgesBase: ["isolation", "rear delts", "posture"],
  },

  pull_iso_trap: {
    goal: ["muscle"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "isolation_trap",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "medium",
    injuryAvoid: ["neck"],
    conditionAvoid: [],
    whyForYou: "Upper trap work — adds width to the upper back and directly supports heavy pressing and carrying.",
    badgesBase: ["isolation", "traps"],
  },

  // ── CORE ─────────────────────────────────────────────────────────
  core_stability: {
    goal: ["muscle", "strength", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "activation"],
    movementPattern: "core_anti_extension",
    stimulusProfile: ["stability"],
    unilateral: false,
    technicalDemand: 2,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "maintain neutral bracing, exhale through effort",
    },
    whyForYou: "Builds the deep stability that protects your spine under every other lift.",
    badgesBase: ["stability", "home-friendly"],
  },

  core_iso_flexion: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "core_flexion",
    stimulusProfile: ["hypertrophy"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: ["lower_back"],
    conditionAvoid: [],
    conditionModify: {
      pelvic_floor: "avoid sit-up-style flexion; prefer anti-extension",
    },
    whyForYou: "Direct abdominal flexion — works the six-pack muscles through their full range.",
    badgesBase: ["isolation", "abs"],
  },

  core_iso_rotation: {
    goal: ["muscle", "general"],
    experience: { min: "new" },
    sessionRole: ["accessory", "finisher"],
    movementPattern: "core_anti_rotation",
    stimulusProfile: ["hypertrophy", "stability"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: ["lower_back"],
    conditionAvoid: [],
    whyForYou: "Rotational core work — builds the obliques and trains the trunk to resist twist under load.",
    badgesBase: ["isolation", "obliques"],
  },

  // ── CARDIO ───────────────────────────────────────────────────────
  cardio: {
    goal: ["general"],
    experience: { min: "new" },
    sessionRole: ["finisher"],
    movementPattern: "cardio",
    stimulusProfile: ["endurance"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Keeps your conditioning sharp and supports recovery between lifting sessions.",
    badgesBase: ["conditioning"],
  },

  // ── MOBILITY ─────────────────────────────────────────────────────
  mobility: {
    goal: ["general"],
    experience: { min: "new" },
    sessionRole: ["activation"],
    movementPattern: "mobility",
    stimulusProfile: ["mobility"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    lifeStage: { perimenopause: "preferred", post_menopause: "preferred" },
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Keeps joints happy and movements feeling fluid — ten minutes now, fewer problems later.",
    badgesBase: ["mobility", "home-friendly"],
  },

  // ── ACTIVATION ───────────────────────────────────────────────────
  activation: {
    goal: ["muscle", "strength", "general"],
    experience: { min: "new" },
    sessionRole: ["activation"],
    movementPattern: "activation",
    stimulusProfile: ["stability"],
    unilateral: false,
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou: "Primes the right muscles before your main lifts — small effort, big payoff.",
    badgesBase: ["activation", "home-friendly"],
  },

  // ── CALISTHENICS SKILL ───────────────────────────────────────────
  calisthenics_skill: {
    goal: ["strength", "general"],
    experience: { min: "developing", ideal: "intermediate" },
    sessionRole: ["primary", "secondary"],
    movementPattern: "skill",
    stimulusProfile: ["strength", "stability"],
    unilateral: false,
    technicalDemand: 5,
    fatigueCost: 3,
    loadability: "low",
    lifeStage: { perimenopause: "neutral" },
    injuryAvoid: ["shoulder", "wrist", "lower_back"],
    conditionAvoid: ["hypermobility"],
    whyForYou: "A bodyweight skill — patience pays off. Progress is measured in inches, not pounds.",
    badgesBase: ["skill", "home-friendly"],
  },
};

// ── Template matching ──────────────────────────────────────────────

// Name-based sub-category matchers. These only run for isolation lifts
// (muscle === legs/push/pull/core with Isolation tag) so we can pick a
// granular template key instead of a single catch-all.
function matchLegsIsoSubcategory(name: string): TemplateKey {
  const n = name.toLowerCase();
  if (/leg extension/.test(n)) return "legs_iso_quad";
  if (/leg curl|hamstring curl|nordic/.test(n)) return "legs_iso_hamstring";
  if (/glute|kickback|hip thrust|bridge/.test(n)) return "legs_iso_glute";
  if (/calf/.test(n)) return "legs_iso_calf";
  if (/adduct|abduct|clamshell|lateral band walk/.test(n)) return "legs_iso_adductor_abductor";
  return "legs_iso_quad"; // safe fallback
}
function matchPushIsoSubcategory(name: string): TemplateKey {
  const n = name.toLowerCase();
  if (/fly|pec deck/.test(n)) return "push_iso_chest_fly";
  if (/tricep|pushdown|skull crusher|kickback|overhead extension/.test(n)) return "push_iso_tricep";
  if (/lateral raise|side raise|delt/.test(n)) return "push_iso_lateral_delt";
  return "push_iso_tricep"; // safe fallback
}
function matchPullIsoSubcategory(name: string): TemplateKey {
  const n = name.toLowerCase();
  if (/curl|preacher/.test(n)) return "pull_iso_bicep";
  if (/face pull|rear delt|reverse fly|band pull-apart/.test(n)) return "pull_iso_rear_delt";
  if (/shrug|trap/.test(n)) return "pull_iso_trap";
  return "pull_iso_bicep"; // safe fallback
}
function matchCoreDynamicSubcategory(name: string): TemplateKey {
  const n = name.toLowerCase();
  if (/russian twist|woodchop|bicycle|rotation/.test(n)) return "core_iso_rotation";
  return "core_iso_flexion";
}

function resolveTemplate(ex: Exercise): TemplateKey {
  const { muscle, equip, tags, logType, name } = ex;
  const hasTag = (t: string) => tags.includes(t);
  const onlyBW = equip.length === 1 && equip[0] === "bodyweight";
  const hasBB = equip.includes("barbell");
  const hasDB = equip.includes("dumbbells");
  const hasKB = equip.includes("kettlebell");
  const hasMachines = equip.includes("machines");
  const isUnilateral =
    logType === "weighted_unilateral" || logType === "bodyweight_unilateral";

  // MOBILITY — tag-first (lives under various muscle groups in the library)
  if (hasTag("Mobility")) return "mobility";
  // ACTIVATION
  if (hasTag("Activation")) return "activation";
  // CALISTHENICS SKILL — any calisthenics Skill-tagged lift
  if (hasTag("Skill") && hasTag("Calisthenics")) return "calisthenics_skill";

  // CARDIO
  if (muscle === "cardio") return "cardio";

  // LEGS
  if (muscle === "legs") {
    if (hasTag("Isolation")) return matchLegsIsoSubcategory(name);
    if (isUnilateral) return "legs_compound_unilateral";
    if (hasBB || hasMachines || hasKB) return "legs_compound_heavy";
    return "legs_compound_light";
  }

  // HINGE
  if (muscle === "hinge") {
    if (hasTag("Isolation")) return "hinge_isolation";
    // Cable Pull-Through, Back Extension → isolation-ish glute/ham work
    if (/glute kickback|back extension|pull-through/.test(name.toLowerCase())) return "legs_iso_glute";
    if (hasBB || (hasKB && hasTag("Compound"))) return "hinge_compound_heavy";
    if (hasDB || hasMachines) return "hinge_compound_heavy";
    return "hinge_compound_light";
  }

  // PUSH
  if (muscle === "push") {
    if (hasTag("Isolation")) return matchPushIsoSubcategory(name);
    if (hasBB || hasDB || hasMachines || hasKB) return "push_compound_heavy";
    return "push_compound_light";
  }

  // PULL
  if (muscle === "pull") {
    if (hasTag("Isolation")) return matchPullIsoSubcategory(name);
    if (onlyBW || hasTag("Calisthenics")) return "pull_compound_bodyweight";
    if (hasBB || hasDB || hasMachines || hasKB) return "pull_compound_heavy";
    return "pull_compound_bodyweight";
  }

  // CORE
  if (muscle === "core") {
    if (
      hasTag("Stability") ||
      hasTag("Isometric") ||
      hasTag("Anti-Rotation")
    ) {
      return "core_stability";
    }
    return matchCoreDynamicSubcategory(name);
  }

  // CALISTHENICS fallback (non-skill ones end up here; treat as BW pull/push by default)
  if (muscle === "calisthenics") return "calisthenics_skill";

  // Shouldn't reach here — fall back to mobility (safest zero-fatigue template)
  return "mobility";
}

// ── Pass 3: Manual overrides ───────────────────────────────────────
//
// These are the ~40 lifts that meaningfully deviate from their
// category template. Only the fields that differ need to be listed —
// everything else inherits from the template.

type OverridePatch = Partial<ExerciseIndication> & {
  whyForYou?: string;
  whySwapped?: string;
};

const OVERRIDES: Record<string, OverridePatch> = {
  // ── LEGS overrides ─────────────────────────────────────────────
  "Barbell Back Squat": {
    technicalDemand: 4,
    conditionModify: {
      hypermobility: "cap depth to parallel, tempo 3-1-1",
      fibroids: "reduce intra-abdominal pressure; use belt sparingly",
      pelvic_floor: "exhale through exertion, consider lower loads",
    },
    whyForYou:
      "One of the highest-ROI lifts for {goal}. At your level, it's the best lower-body strength builder we have.",
  },
  "Front Squat": {
    experience: { min: "developing", ideal: "intermediate" },
    technicalDemand: 4,
    injuryAvoid: ["knees", "lower_back", "wrist", "shoulder"],
    whyForYou:
      "A more upright squat that keeps the load off your lower back and challenges your core.",
  },
  "Conventional Deadlift": {
    experience: { min: "developing", ideal: "intermediate" },
    movementPattern: "hinge",
    technicalDemand: 4,
    fatigueCost: 5,
    loadability: "high",
    conditionAvoid: ["pelvic_floor"],
    conditionModify: {
      hypermobility: "stop short of lockout, cue rib-down",
      fibroids: "reduce intra-abdominal pressure; lighter loads",
    },
    whyForYou:
      "The single most productive strength exercise in the library. At your level, it's worth the technical investment.",
  },
  "Sumo Deadlift": {
    experience: { min: "developing" },
    technicalDemand: 4,
    fatigueCost: 5,
    loadability: "high",
    conditionAvoid: ["pelvic_floor"],
    whyForYou:
      "A more upright deadlift variation that often feels better on the lower back than conventional.",
  },
  "Romanian Deadlift": {
    experience: { min: "new", ideal: "developing" },
    technicalDemand: 3,
    fatigueCost: 4,
    whyForYou:
      "The best posterior-chain builder we have — targets hamstrings and glutes without the setup of a full deadlift.",
  },
  "Hip Thrust": {
    technicalDemand: 2,
    fatigueCost: 3,
    loadability: "high",
    injuryAvoid: [],
    whyForYou:
      "The most direct loaded glute exercise we have — easy to learn, extremely progressable, low injury risk.",
  },
  "Good Morning": {
    experience: { min: "developing" },
    technicalDemand: 4,
    injuryAvoid: ["lower_back", "hip"],
    conditionAvoid: ["pelvic_floor"],
    whyForYou:
      "A technical hinge that hammers the posterior chain — not for beginners.",
  },
  "Nordic Curl": {
    experience: { min: "intermediate" },
    technicalDemand: 5,
    fatigueCost: 4,
    loadability: "low",
    injuryAvoid: ["knees", "lower_back"],
    whyForYou:
      "One of the best hamstring exercises in existence — and one of the hardest.",
  },
  "Bulgarian Split Squat": {
    technicalDemand: 3,
    fatigueCost: 4,
    whyForYou:
      "Brutal and effective. Unilateral loading exposes weakness you can't hide with a barbell.",
  },
  "Pistol Squat": {
    experience: { min: "developing" },
    technicalDemand: 5,
    fatigueCost: 3,
    loadability: "low",
    injuryAvoid: ["knees", "ankle"],
    whyForYou:
      "A bodyweight unilateral squat that demands strength, mobility, and balance all at once.",
  },
  "Shrimp Squat": {
    experience: { min: "developing" },
    technicalDemand: 5,
    fatigueCost: 3,
    injuryAvoid: ["knees"],
    whyForYou: "An even more demanding single-leg squat variation.",
  },
  "Wall Sit": {
    experience: { min: "new" },
    sessionRole: ["finisher", "accessory"],
    movementPattern: "isolation_quad",
    stimulusProfile: ["endurance", "stability"],
    technicalDemand: 1,
    fatigueCost: 2,
    loadability: "low",
    injuryAvoid: ["knees"],
    conditionAvoid: [],
    whyForYou:
      "A low-skill isometric burner — builds endurance in the quads with zero equipment.",
    badges: ["isometric", "home-friendly"],
  },

  // ── HINGE overrides ────────────────────────────────────────────
  "Kettlebell Swing": {
    experience: { min: "developing" },
    sessionRole: ["secondary", "finisher"],
    movementPattern: "hinge",
    stimulusProfile: ["power", "endurance"],
    technicalDemand: 3,
    fatigueCost: 4,
    loadability: "medium",
    injuryAvoid: ["lower_back", "shoulder"],
    conditionAvoid: ["pelvic_floor"],
    whyForYou:
      "A high-power hinge that builds conditioning and explosive hip drive in one movement.",
    badges: ["compound", "power", "conditioning"],
  },
  "Trap Bar Deadlift": {
    experience: { min: "new", ideal: "developing" },
    technicalDemand: 2,
    whyForYou:
      "The most forgiving deadlift variation — an excellent first loaded hinge.",
  },
  "Single-Leg Deadlift": {
    technicalDemand: 3,
    unilateral: true,
    whyForYou:
      "A unilateral hinge that builds balance, ankle control, and glute strength simultaneously.",
  },

  // ── PUSH overrides ─────────────────────────────────────────────
  "Barbell Bench Press": {
    technicalDemand: 3,
    fatigueCost: 4,
    loadability: "high",
    whyForYou:
      "The classic horizontal press — the strongest, most progressable upper-body push we have.",
  },
  "Overhead Press": {
    technicalDemand: 3,
    fatigueCost: 4,
    movementPattern: "verticalPush",
    injuryAvoid: ["shoulder", "lower_back", "wrist"],
    whyForYou:
      "A standing overhead press — builds shoulder strength, trunk stability, and real-world pressing ability.",
  },
  "Push-Up": {
    experience: { min: "developing", ideal: "developing" },
    goal: ["muscle", "strength", "general"],
    sessionRole: ["secondary", "accessory"],
    loadability: "low",
    whyForYou:
      "The most scalable upper-body pushing movement that exists. Works at every level.",
    badges: ["compound", "home-friendly", "no-equipment"],
  },
  "Knee Push-Up": {
    experience: { min: "new" },
    sessionRole: ["accessory"],
    technicalDemand: 1,
    fatigueCost: 2,
    whyForYou:
      "A regression of the push-up — builds the pattern safely while you develop the strength for full push-ups.",
  },
  "Dips": {
    experience: { min: "developing" },
    sessionRole: ["primary", "secondary"],
    movementPattern: "verticalPush",
    stimulusProfile: ["strength", "hypertrophy"],
    technicalDemand: 3,
    fatigueCost: 3,
    loadability: "medium",
    injuryAvoid: ["shoulder", "wrist"],
    whyForYou:
      "One of the hardest bodyweight pushes — builds serious upper-body strength if you can do them.",
    badges: ["compound", "home-friendly"],
  },
  "Handstand Push-Up": {
    experience: { min: "intermediate" },
    movementPattern: "verticalPush",
    technicalDemand: 5,
    fatigueCost: 4,
    loadability: "low",
    injuryAvoid: ["shoulder", "wrist", "neck"],
    whyForYou:
      "A vertical bodyweight press that demands real shoulder strength and stability.",
  },
  "Pike Push-Up": {
    technicalDemand: 3,
    movementPattern: "verticalPush",
    whyForYou:
      "A progression toward handstand push-ups and a great shoulder builder in its own right.",
  },
  "Machine Chest Press": {
    technicalDemand: 1,
    fatigueCost: 3,
    injuryAvoid: [],
    whyForYou:
      "Loaded pressing with minimal technical risk — a great way to build volume when you're tired or returning from injury.",
  },

  // ── PULL overrides ─────────────────────────────────────────────
  "Pull-Up": {
    experience: { min: "developing" },
    sessionRole: ["primary", "secondary"],
    technicalDemand: 3,
    fatigueCost: 3,
    loadability: "medium",
    whyForYou:
      "The best upper-body pulling movement we have. Worth building toward for anyone at any level.",
    badges: ["compound", "home-friendly"],
  },
  "Chin-Up": {
    experience: { min: "developing" },
    sessionRole: ["primary", "secondary"],
    technicalDemand: 3,
    whyForYou:
      "Often easier than pull-ups — hits lats and biceps hard, and translates directly to stronger pressing.",
    badges: ["compound", "home-friendly"],
  },
  "Band-Assisted Pull-Up": {
    experience: { min: "new" },
    sessionRole: ["secondary", "accessory"],
    technicalDemand: 2,
    whyForYou:
      "A stepping stone toward unassisted pull-ups — lets you practice the pattern with progressively less help.",
  },
  "Barbell Row": {
    experience: { min: "developing" },
    technicalDemand: 3,
    injuryAvoid: ["lower_back"],
    whyForYou:
      "A heavy horizontal pull that builds real back strength — demanding on the lower back so form matters.",
  },
  "Dead Hang": {
    experience: { min: "new" },
    sessionRole: ["accessory", "activation"],
    movementPattern: "isolation",
    stimulusProfile: ["stability", "mobility"],
    technicalDemand: 1,
    fatigueCost: 1,
    loadability: "low",
    injuryAvoid: [],
    conditionAvoid: [],
    whyForYou:
      "Looks simple, builds grip and decompresses the spine. An underrated pre-pull primer.",
    badges: ["isometric", "home-friendly"],
  },

  // ── CORE overrides ─────────────────────────────────────────────
  "Plank": {
    experience: { min: "new" },
    technicalDemand: 1,
    fatigueCost: 1,
    whyForYou:
      "The baseline core exercise — if you can hold a good plank, most lifts will feel more stable.",
    badges: ["isometric", "home-friendly", "no-equipment"],
  },
  "Dead Bug": {
    experience: { min: "new" },
    technicalDemand: 2,
    whyForYou:
      "Teaches your core to stay tight while your limbs move independently — which is what core work is actually for.",
    badges: ["stability", "home-friendly", "no-equipment"],
  },
  "Bird Dog": {
    experience: { min: "new" },
    technicalDemand: 2,
    whyForYou:
      "Trains cross-body coordination and deep spinal stabilisers — a staple of back-friendly programming.",
    badges: ["stability", "home-friendly", "no-equipment"],
  },
  "Pallof Press": {
    experience: { min: "new" },
    stimulusProfile: ["stability"],
    technicalDemand: 2,
    whyForYou:
      "The best anti-rotation exercise we have — teaches your core to resist force rather than create it.",
    badges: ["stability"],
  },
  "Farmers Carry": {
    sessionRole: ["finisher", "accessory"],
    movementPattern: "carry",
    stimulusProfile: ["stability", "endurance"],
    technicalDemand: 1,
    fatigueCost: 3,
    loadability: "high",
    injuryAvoid: [],
    whyForYou:
      "Loaded carries build full-body stiffness, grip, and conditioning in one exercise. Underrated and underused.",
    badges: ["compound", "carry"],
  },
  "Ab Wheel Rollout": {
    experience: { min: "developing" },
    technicalDemand: 4,
    fatigueCost: 2,
    loadability: "low",
    injuryAvoid: ["lower_back"],
    whyForYou:
      "Brutally effective anti-extension work — not for beginners, but transformative once you can do it well.",
  },
  "Hanging Leg Raise": {
    experience: { min: "developing" },
    technicalDemand: 3,
    fatigueCost: 2,
    whyForYou:
      "Builds real hip-flexor and lower-ab strength — and grip as a bonus.",
  },
  "Hollow Body Hold": {
    experience: { min: "developing" },
    technicalDemand: 3,
    whyForYou:
      "A gymnastics-grade isometric that teaches whole-body tension — foundational for any bodyweight work.",
  },

  // ── CALISTHENICS SKILL overrides ───────────────────────────────
  "Muscle-Up": {
    experience: { min: "intermediate" },
    technicalDemand: 5,
    whyForYou:
      "The benchmark calisthenics skill — marks the transition from 'strong' to 'elite bodyweight'.",
  },
  "Front Lever": {
    experience: { min: "intermediate" },
    technicalDemand: 5,
    whyForYou:
      "A full-body lat and core isometric — months of progression from tuck to full, but extraordinary payoff.",
  },
  "Back Lever": {
    experience: { min: "intermediate" },
    technicalDemand: 5,
    whyForYou:
      "A straight-body inverted isometric that builds serious anterior-chain strength.",
  },
  "Human Flag": {
    experience: { min: "intermediate" },
    technicalDemand: 5,
    whyForYou:
      "A side-lever that requires obliques, lats, and shoulders all working at once.",
  },
  "Dragon Flag": {
    experience: { min: "intermediate" },
    movementPattern: "core_anti_extension",
    stimulusProfile: ["strength", "stability"],
    technicalDemand: 5,
    whyForYou:
      "Bruce Lee's go-to core exercise — a straight-line lowering drill that builds abs like nothing else.",
  },
  "L-Sit": {
    experience: { min: "developing" },
    technicalDemand: 4,
    whyForYou:
      "An isometric compression hold — builds incredible hip-flexor, core, and shoulder strength.",
  },

  // ── Additional compound overrides (functional tone) ──────────────

  // LEGS
  "Goblet Squat": {
    whyForYou:
      "A front-loaded squat that teaches upright posture and depth — the best squat pattern to build from before progressing to a barbell.",
  },
  "Leg Press": {
    whyForYou:
      "Loaded quad work with the spine supported — lets you push high volume without stressing the lower back.",
  },
  "Hack Squat": {
    whyForYou:
      "Quad-focused machine squat — similar stimulus to a front squat with less technical demand and better knee tracking.",
  },
  "Walking Lunges": {
    whyForYou:
      "Unilateral squat pattern with real balance demand — exposes side-to-side imbalances and builds stability under load.",
  },
  "Reverse Lunges": {
    whyForYou:
      "A kinder unilateral squat than forward lunges — easier on the knees and still trains each leg independently.",
  },
  "Step-Ups": {
    whyForYou:
      "Single-leg loaded knee extension — strong quad and glute carry-over with very low injury risk.",
  },
  "Box Squat": {
    whyForYou:
      "Squatting to a box sets depth and builds starting strength out of the hole — useful for learning the pattern or managing knee load.",
  },
  "Sumo Squat": {
    whyForYou:
      "A wider stance squat that shifts more work to the inner thighs and glutes.",
  },
  "Bodyweight Squat": {
    whyForYou:
      "The entry point to every squat variation — zero equipment, unlimited reps, builds the pattern before load is added.",
  },
  "Smith Machine Squat": {
    whyForYou:
      "A fixed-bar-path squat — less stability demand than free-weight, useful for progressively loading the quads without worrying about balance.",
  },

  // HINGE
  "Glute Bridge": {
    whyForYou:
      "A low-skill glute exercise you can do anywhere — the foundation for hip thrust progression and a reliable warm-up for bigger hinges.",
  },
  "Cable Pull-Through": {
    whyForYou:
      "Loaded hip hinge with the spine unloaded — teaches the hinge pattern and isolates glutes without the fatigue of a deadlift.",
  },
  "Back Extension": {
    whyForYou:
      "Direct work for the posterior chain at a low technical demand — builds glute and hamstring endurance without heavy barbell loading.",
  },

  // PUSH
  "Incline Barbell Press": {
    whyForYou:
      "An upper-chest-biased barbell press — loads the shoulder in a stretched position the flat bench misses.",
  },
  "Dumbbell Bench Press": {
    whyForYou:
      "Pressing with dumbbells lets each arm move independently — builds real pressing strength while gently exposing left/right imbalances.",
  },
  "Incline Dumbbell Press": {
    whyForYou:
      "Upper-chest and front-delt focus with free-moving arms — the dumbbell alternative to an incline barbell press.",
  },
  "Dumbbell Shoulder Press": {
    whyForYou:
      "A free-weight overhead press that scales gently and doesn't require the shoulder mobility a barbell demands.",
  },
  "Arnold Press": {
    whyForYou:
      "A rotating dumbbell press that hits all three deltoid heads in one movement — trades a little load for more range.",
  },
  "Landmine Press": {
    whyForYou:
      "An angled press with a shoulder-friendly bar path — the best overhead press option if direct overhead work is uncomfortable.",
  },
  "Machine Shoulder Press": {
    whyForYou:
      "Machine pressing with a fixed path — lets you push the shoulders hard with very low skill demand.",
  },

  // PULL
  "Dumbbell Row": {
    whyForYou:
      "A unilateral horizontal pull — trains each side independently and gives a longer range than a barbell row.",
  },
  "Chest-Supported Row": {
    whyForYou:
      "A horizontal row with the torso fully supported — takes the lower back out of the movement so you can drive the lats hard.",
  },
  "Seated Cable Row": {
    whyForYou:
      "A controlled horizontal pull with continuous tension throughout the range — lets you push volume on the mid-back with low injury risk.",
  },
  "Lat Pulldown": {
    whyForYou:
      "A scalable vertical pull — trains the same pattern as a pull-up at any strength level, in any bodyweight.",
  },
  "T-Bar Row": {
    whyForYou:
      "A heavy horizontal row loaded at one end of a bar — kinder to the lower back than a bent-over barbell row.",
  },
  "Machine Row": {
    whyForYou:
      "Machine-guided horizontal pulling — lets you isolate the mid-back without stability limiting the load.",
  },
  "Face Pulls": {
    whyForYou:
      "The best single exercise for shoulder health — trains the rear delts and external rotators that heavy pressing misses.",
  },
};

// ── Builder: merge template + override → final indication ─────────

function buildIndication(ex: Exercise): ExerciseIndication {
  const templateKey = resolveTemplate(ex);
  const template = TEMPLATES[templateKey];
  const override = OVERRIDES[ex.name] ?? {};

  // Respect minExp from library if set (it's our existing source of truth)
  const libMinExp = ex.minExp as ExperienceLevel | undefined;
  const baseExperience = libMinExp
    ? { min: libMinExp, ideal: template.experience.ideal }
    : template.experience;

  return {
    goal: override.goal ?? template.goal,
    experience: override.experience ?? baseExperience,
    sessionRole: override.sessionRole ?? template.sessionRole,
    movementPattern: override.movementPattern ?? template.movementPattern,
    stimulusProfile: override.stimulusProfile ?? template.stimulusProfile,
    unilateral:
      override.unilateral ??
      (ex.logType === "weighted_unilateral" ||
        ex.logType === "bodyweight_unilateral" ||
        template.unilateral),
    technicalDemand: override.technicalDemand ?? template.technicalDemand,
    fatigueCost: override.fatigueCost ?? template.fatigueCost,
    loadability: override.loadability ?? template.loadability,
    cycleModulation: override.cycleModulation ?? template.cycleModulation,
    lifeStage: override.lifeStage ?? template.lifeStage,
    injuryAvoid: override.injuryAvoid ?? template.injuryAvoid,
    conditionAvoid: override.conditionAvoid ?? template.conditionAvoid,
    conditionModify: override.conditionModify ?? template.conditionModify,
    requiresEquipment: override.requiresEquipment ?? template.requiresEquipment,
    whyForYou: override.whyForYou ?? template.whyForYou,
    whySwapped: override.whySwapped ?? template.whySwapped,
    badges: override.badges ?? template.badgesBase,
  };
}

// ── Final map ──────────────────────────────────────────────────────

export const EXERCISE_INDICATIONS: Record<string, ExerciseIndication> =
  Object.fromEntries(EXERCISE_LIBRARY.map((ex) => [ex.name, buildIndication(ex)]));

/** Look up an indication profile by exercise name. */
export function findIndication(name: string): ExerciseIndication | undefined {
  return EXERCISE_INDICATIONS[name];
}

// ── Validation helpers (for tests) ─────────────────────────────────

export function validateIndications(): string[] {
  const errors: string[] = [];
  for (const ex of EXERCISE_LIBRARY) {
    const ind = EXERCISE_INDICATIONS[ex.name];
    if (!ind) {
      errors.push(`Missing indication for exercise: ${ex.name}`);
      continue;
    }
    if (ind.cycleModulation) {
      for (const phase of Object.keys(ind.cycleModulation) as CyclePhase[]) {
        if (!["menstrual", "follicular", "ovulatory", "luteal"].includes(phase)) {
          errors.push(`${ex.name}: invalid cycle phase "${phase}"`);
        }
        const env = ind.cycleModulation[phase];
        if (env?.volumeMultiplier !== undefined) {
          if (env.volumeMultiplier < 0.6 || env.volumeMultiplier > 1.1) {
            errors.push(
              `${ex.name}.${phase}: volumeMultiplier ${env.volumeMultiplier} out of range (0.6–1.1)`
            );
          }
        }
        if (env?.workingLoadCap !== undefined) {
          if (env.workingLoadCap < 0.6 || env.workingLoadCap > 1.0) {
            errors.push(
              `${ex.name}.${phase}: workingLoadCap ${env.workingLoadCap} out of range (0.6–1.0)`
            );
          }
        }
      }
    }
  }
  return errors;
}
