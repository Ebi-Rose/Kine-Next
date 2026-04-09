// ── Condition Rules ─────────────────────────────────────────────────
//
// Authored data library for Kine's supported conditions. Single
// source of truth for condition-specific framing, caps, modifiers,
// warmup adjustments, red flags, and education tags.
//
// SPEC: docs/specs/condition-rules.md
//
// Authoring discipline:
//   - Hand-authored. No LLM generates content into this file.
//     LLMs may READ it at runtime but never WRITE it.
//   - Every entry is PR-reviewable and versioned.
//   - Reviewer expectations documented in the spec.
//
// Consumed by:
//   - src/lib/condition-context.ts (merge + projections)
//   - (future) indication-pipeline, periodisation, warmup-engine,
//     session-analysis, education-engine — see contract spec.
//
// Note on vocabulary drift: the spec's MovementPattern names were
// drafted before the real enum was finalised. This file uses the
// REAL enum names from exercise-indications.ts (camelCase
// horizontalPush, verticalPush, etc.). `jump`/`sprint`/`throw` are
// not real patterns in the indication system and are therefore
// omitted from avoidPatterns; plyometric handling is pending
// a separate cataloguing pass.

import type {
  ConditionId,
  MovementPattern,
} from "./exercise-indications";
import type { CyclePhase } from "@/lib/cycle";

// ── Types ───────────────────────────────────────────────────────────

export interface WarmupBlockRef {
  id: string;
  reps: string;
  note: string;
}

export interface ConditionExerciseRules {
  /** Hard no. The indication pipeline removes exercises matching these patterns. */
  avoidPatterns: MovementPattern[];
  /** Soft caution. Pipeline allows the exercise but applies modifier cues / scoring penalty. */
  cautionPatterns: MovementPattern[];
  /** Per-pattern cue strings. Attached when a cautioned exercise is prescribed. */
  modifiers: Partial<Record<MovementPattern, string>>;
  /** Cycle-phase aware volume dampening. Multiplicative across conditions when stacked. */
  volumeMultiplier?: {
    default?: number;
    phases?: Partial<Record<CyclePhase, number>>;
  };
  /** 0-1 multiplier on prescribed working load. Defaults to 1.0 (no cap). Minimum wins when stacked. */
  workingLoadCap?: number;
  /** Minimum rep count on primary compounds. Omit for no floor. Maximum wins when stacked. */
  repRangeFloor?: number;
  /** Whether heavy top sets (3-6 rep range) are allowed. Defaults to true. Any `false` wins when stacked. */
  heavyTopSetsAllowed?: boolean;
}

export interface ConditionWarmupMods {
  /** Extra warmup/activation drills to inject. Union + dedupe by id when stacked. */
  addBlocks: WarmupBlockRef[];
  /** Warmup drill ids to omit (e.g. high-impact drills for pelvic floor). Union when stacked. */
  removeBlocks: string[];
  /** Short cues to surface on the warmup display. Union + dedupe when stacked. */
  cues: string[];
}

export interface ConditionRule {
  id: ConditionId;
  displayName: string;
  /** One-line description. Safe to show to users. */
  summary: string;
  /** Appended to the week-builder system prompt when the LLM-assist path runs. */
  globalFraming: string;
  /** User-facing plain-language note. Shown on the week card. */
  coachNote: string;
  exerciseRules: ConditionExerciseRules;
  warmupMods: ConditionWarmupMods;
  /** Tag ids matching the content personalization engine. */
  educationTags: string[];
  /** Symptom patterns that should surface "talk to your clinician" in session analysis. */
  redFlags: string[];
  /** Authoring rationale, citations, reviewer initials. Not shown to users. */
  sourceNotes?: string;
}

// ── Data ────────────────────────────────────────────────────────────

export const CONDITION_RULES: Record<ConditionId, ConditionRule> = {
  pcos: {
    id: "pcos",
    displayName: "PCOS",
    summary:
      "Programming emphasises compound strength work and insulin-sensitising volume.",
    globalFraming:
      "User has PCOS. Favour compound movements the user enjoys. Moderate-to-heavy strength work and some higher-intensity conditioning support insulin sensitivity. Avoid unnecessarily long, grinding sessions that spike cortisol without benefit.",
    coachNote:
      "We're leaning into strength work and keeping sessions punchy — both are great for PCOS. You'll see compound lifts prioritised.",
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
    educationTags: ["pcos", "insulin", "strength_benefits", "hormonal_health"],
    redFlags: [
      "sudden severe pelvic pain",
      "rapid unexplained weight change with fatigue",
      "new cycle irregularity beyond existing pattern",
    ],
    sourceNotes:
      "PCOS benefits from resistance training for insulin sensitivity; no hard restrictions warranted from condition alone. Individual symptoms may change this — relies on user flagging fatigue/pain separately.",
  },

  fibroids: {
    id: "fibroids",
    displayName: "Uterine fibroids",
    summary: "Reduces intra-abdominal pressure and high-impact loading.",
    globalFraming:
      "User has uterine fibroids. Prefer low-impact alternatives. Avoid exercises that spike intra-abdominal pressure (heavy valsalva, max-effort breath-holding). Heavy bilateral squats and deadlifts are allowed but default to moderate loads with exhale-on-effort cueing.",
    coachNote:
      "We'll skip high-impact work and keep you cueing strong breath on the heavy lifts — both help with fibroid comfort.",
    exerciseRules: {
      avoidPatterns: [],
      cautionPatterns: ["squat", "hinge", "core_flexion"],
      modifiers: {
        squat: "moderate loads, exhale on the way up, no breath-holding.",
        hinge: "brace gently, exhale on effort — avoid maximal valsalva.",
        core_flexion: "swap crunches/sit-ups for dead bugs or bird dogs.",
      },
      volumeMultiplier: {
        default: 0.95,
        // Real CyclePhase has only 4 values (menstrual, follicular,
        // ovulatory, luteal) — spec's luteal_early / luteal_late
        // distinction isn't in the type system yet. Applying the
        // menstrual dampener here; luteal stays at default.
        phases: { menstrual: 0.8 },
      },
      workingLoadCap: 0.9,
      heavyTopSetsAllowed: false,
    },
    warmupMods: {
      addBlocks: [
        {
          id: "diaphragm_breathing",
          reps: "6 breaths",
          note: "Slow exhale, feel ribs widen and drop.",
        },
      ],
      removeBlocks: ["high_knees", "pogo_hops"],
      cues: ["Warmup stays low-impact today."],
    },
    educationTags: [
      "fibroids",
      "valsalva",
      "intra_abdominal_pressure",
      "low_impact",
    ],
    redFlags: [
      "new heavy or prolonged bleeding",
      "sharp pelvic pain during exercise",
      "urinary retention or pressure symptoms",
    ],
    sourceNotes:
      "Conservative authoring — fibroid response to loading varies individually. Moderate working-load cap and avoidance of max valsalva errs on the safe side. Needs clinical review.",
  },

  endometriosis: {
    id: "endometriosis",
    displayName: "Endometriosis",
    summary: "Auto-scales volume on symptomatic days; leans anti-inflammatory.",
    globalFraming:
      "User has endometriosis. On symptomatic days (menstrual and late-luteal), prefer low-impact work and reduce total volume. High-impact is flagged for user review. Anti-inflammatory movement (walking, mobility, zone 2) is always welcome. Heavy lifting is allowed on asymptomatic days.",
    coachNote:
      "We're lighter on your tougher days and pick back up when you're feeling it. You can always override and train normally.",
    exerciseRules: {
      avoidPatterns: [],
      cautionPatterns: ["core_flexion"],
      modifiers: {
        core_flexion: "prefer anti-extension (dead bugs, plank).",
      },
      volumeMultiplier: {
        default: 1.0,
        // See note in fibroids: CyclePhase has only 4 values, so
        // luteal_late's dampening collapses into the menstrual phase
        // entry. Menstrual dampening is the most important anyway
        // (symptom peak).
        phases: { menstrual: 0.65 },
      },
      workingLoadCap: 0.95,
      heavyTopSetsAllowed: true,
    },
    warmupMods: {
      addBlocks: [
        {
          id: "cat_cow",
          reps: "8 reps",
          note: "Gentle spinal movement to ease tension.",
        },
      ],
      removeBlocks: [],
      cues: ["Listen in — if today's a flare day, swap to mobility."],
    },
    educationTags: [
      "endometriosis",
      "inflammation",
      "cycle_tracking",
      "pain_management",
    ],
    redFlags: [
      "pain that stops you training mid-session",
      "new referral pain patterns",
      "post-session bleeding changes",
    ],
    sourceNotes:
      "Auto-scaling driven by cycle phase logic, not self-reported flare state (v0.1). Future: add symptom log integration for day-level scaling. Jump/sprint patterns omitted from caution list — the indication pipeline has no plyometric tagging yet. Revisit when plyometric cataloguing lands.",
  },

  pelvic_floor: {
    id: "pelvic_floor",
    displayName: "Pelvic floor concerns",
    summary:
      "Prioritises breath cueing and avoids max-effort valsalva and high-impact.",
    globalFraming:
      "User has pelvic floor concerns (postpartum, prolapse, incontinence, or similar). No max-effort valsalva. Cue exhale-on-exertion on every compound lift. Default to pelvic-floor-friendly alternatives for high-impact work. Avoid double-unders, box jumps, and heavy unsupported overhead work until comfort is established.",
    coachNote:
      "Breath-led lifting — you'll see exhale cues on the big lifts and we're skipping high-impact work. Your pelvic floor will thank you.",
    exerciseRules: {
      avoidPatterns: [],
      cautionPatterns: ["squat", "hinge", "verticalPush", "carry", "core_flexion"],
      modifiers: {
        squat: "exhale on the way up. No breath-holding.",
        hinge: "exhale as you lift. Keep bracing gentle, not maximal.",
        verticalPush:
          "start seated or supported overhead until comfort builds.",
        carry:
          "moderate loads, upright posture, exhale on the way down each step.",
        core_flexion:
          "swap sit-ups and crunches for dead bugs, bird dogs, side plank.",
      },
      volumeMultiplier: {
        default: 0.9,
        phases: { menstrual: 0.8 },
      },
      workingLoadCap: 0.9,
      repRangeFloor: 8,
      heavyTopSetsAllowed: false,
    },
    warmupMods: {
      addBlocks: [
        {
          id: "360_breathing",
          reps: "5 breaths",
          note: "Inhale to the ribs, full slow exhale, feel pelvic floor lift gently.",
        },
        {
          id: "glute_bridge_breath",
          reps: "6 reps",
          note: "Exhale as you lift — connect breath to effort.",
        },
      ],
      removeBlocks: ["pogo_hops", "jumping_jacks", "high_knees"],
      cues: ["Breath leads the lift — exhale on effort, every rep."],
    },
    educationTags: [
      "pelvic_floor",
      "postpartum",
      "breath_bracing",
      "valsalva",
      "prolapse",
    ],
    redFlags: [
      "heaviness or bulging sensation during or after lifting",
      "leaking that worsens with training",
      "pain with lifting that wasn't there before",
    ],
    sourceNotes:
      "Conservative v0.1 authoring. Needs pelvic-floor PT review before shipping publicly. Modifiers are cueing-based, not exclusionary — goal is to make the user feel capable, not sidelined. Jump/sprint avoidance is handled via caution on carry/squat/hinge and via warmup removeBlocks; no plyometric tagging exists in the indication pipeline yet.",
  },

  hypermobility: {
    id: "hypermobility",
    displayName: "Hypermobility",
    summary: "Caps end-range work, prefers tempo and isometric loading.",
    globalFraming:
      "User is hypermobile. Cap joint range of motion at functional end-range, not extreme end-range. Prefer tempo and isometric work over plyometric. Reduce total volume by ~10-15%. Prioritise tendon and connective tissue adaptation over max stretch.",
    coachNote:
      "We're training for stability — you'll see tempo work and controlled ranges. Strength builds, stretching doesn't need to.",
    exerciseRules: {
      avoidPatterns: [],
      cautionPatterns: [
        "squat",
        "lunge",
        "verticalPull",
        "verticalPush",
        "hinge",
      ],
      modifiers: {
        squat:
          "cap depth at parallel. Tempo 3-1-1 (3s down, 1s pause, 1s up).",
        lunge: "front foot flat, knee tracks toes, don't chase depth.",
        verticalPull:
          "no hanging stretch at the bottom — active shoulder lock.",
        verticalPush:
          "avoid locking out elbows fully. Keep a soft end range.",
        hinge:
          "hamstrings work, back stays neutral — don't hunt hamstring stretch.",
      },
      volumeMultiplier: { default: 0.87 },
      workingLoadCap: 0.9,
      heavyTopSetsAllowed: false,
    },
    warmupMods: {
      addBlocks: [
        {
          id: "scapular_wall_slides",
          reps: "10 reps",
          note: "Active control, not passive range.",
        },
        {
          id: "glute_activation_iso",
          reps: "2x 20s",
          note: "Isometric hold — feel the contraction.",
        },
      ],
      removeBlocks: ["deep_squat_hold", "pigeon_stretch"],
      cues: ["Active range beats passive stretch today."],
    },
    educationTags: [
      "hypermobility",
      "stability",
      "tempo_training",
      "joint_health",
      "connective_tissue",
    ],
    redFlags: [
      "joint subluxation during training",
      "persistent joint pain post-session",
      "new clicking or instability",
    ],
    sourceNotes:
      "Based on standard hypermobility strength training guidance. ~13% volume reduction is a midpoint of the 10-15% range cited in original authoring.",
  },
};

/** Look up a condition rule by id. Returns undefined for unknown ids. */
export function getConditionRule(id: ConditionId): ConditionRule | undefined {
  return CONDITION_RULES[id];
}
