// ── Weekly Split Templates — v2 (slot-based) ──────────────────────
//
// SPEC: docs/specs/week-builder-contract.md
//
// Replaces the hardcoded exercise lists in weekly-splits.ts with
// slot-based templates. A slot describes WHAT the session needs
// (role, movement pattern, loadability) without naming a specific
// exercise. The indication pipeline resolves each slot to the
// highest-scoring exercise for the user's context at build time.
//
// This file lives alongside weekly-splits.ts during migration — the
// legacy fallback still consumes the v1 shape until week-builder.ts
// is refactored to consume v2 per week-builder-contract.md.
//
// Keyed: goal → experience → daysPerWeek → Split
//
// Coverage target: full [goal][experience][daysPerWeek] matrix.
//   goal: strength | muscle | general
//   experience: new | developing | intermediate
//   daysPerWeek: 2 | 3 | 4 | 5 | 6
//
// That's 45 slots. Current status: strength.new.3days only
// (worked example for review).

import type {
  MovementPattern,
  SessionRole,
} from "./exercise-indications";

// ── Slot shape ─────────────────────────────────────────────────────

export interface TemplateSlot {
  /** Session role this slot fills — drives scoring in indication-pipeline. */
  role: SessionRole;
  /** Movement pattern the slot needs — drives muscle-group routing. */
  pattern: MovementPattern;
  /** Preferred loadability: heavy (compound), moderate, light. */
  loadability: "high" | "medium" | "low";
  /**
   * Optional authoring note. Not shown to the user — a hint for
   * template authors about why this slot exists in this session.
   */
  note?: string;
}

export interface SplitSessionV2 {
  title: string;
  /** 1-sentence session-level coach note, shown on the session card. */
  coachNote: string;
  slots: TemplateSlot[];
}

export interface SplitV2 {
  /**
   * Ordered list of sessions for this split. The week-builder picks
   * `daysPerWeek` sessions from this list in order, with wrap-around
   * only if `daysPerWeek > sessions.length` (which should never
   * happen once the matrix is fully authored).
   */
  sessions: SplitSessionV2[];
  /**
   * Optional weekly-level coach note. If present, week-builder uses
   * this as the `weekCoachNote` when the rules-first path resolves
   * without LLM assist. Keep to two sentences.
   */
  weekCoachNote?: string;
  /**
   * Optional guidance shown in the UI for users who want to add
   * cardio/conditioning work alongside their strength programme.
   * Does NOT modify the generated week — it's a user-facing note
   * rendered as opt-in content, not a slot the resolver picks.
   *
   * Purpose: for new lifters especially, the idea of "no cardio
   * at all" can be daunting. This field is the answer to
   * "can I still do cardio?" without entangling the template with
   * optional slot resolution.
   *
   * See docs/specs/programming-philosophy.html §Open questions Q5.
   */
  optionalCardioNote?: string;
}

/**
 * Goal × experience × daysPerWeek → Split.
 *
 * When a combination is missing, the week-builder falls back to
 * v1 WEEKLY_SPLITS + the legacy template-swap path. Incrementally
 * authoring this matrix is the Phase 2 work.
 */
export const WEEKLY_SPLITS_V2: Partial<
  Record<
    "strength" | "muscle" | "general",
    Partial<
      Record<
        "new" | "developing" | "intermediate",
        Partial<Record<2 | 3 | 4 | 5 | 6, SplitV2>>
      >
    >
  >
> = {
  // ── STRENGTH ───────────────────────────────────────────────────────
  strength: {
    new: {
      // 2-DAY NEW STRENGTH ─────────────────────────────────────────────
      // Two full-body sessions. Maximum coverage per day, squat+hinge
      // in every session. Short but not soft.
      2: {
        weekCoachNote:
          "Two full-body sessions this week. Each day hits squat, hinge, and a push/pull balance — nothing important gets missed.",
        sessions: [
          {
            title: "Full Body — Session A",
            coachNote:
              "Squat leads today. Hinge is right behind it — both patterns get loaded work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Bilateral squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "Loaded hinge — RDL or deadlift." },
              { role: "accessory", pattern: "horizontalPush", loadability: "medium", note: "Press variant." },
              { role: "accessory", pattern: "horizontalPull", loadability: "medium", note: "Row variant." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Full Body — Session B",
            coachNote:
              "Hinge leads today. Unilateral lower work gets its place — the strength that carries outside the gym.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Hip thrust or alternate hinge primary." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Unilateral lower — split squat or lunge." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Vertical pulling pattern." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press, moderate load." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation or carry." },
            ],
          },
        ],
      },

      // 3-DAY NEW STRENGTH ─────────────────────────────────────────────
      // Philosophy: posterior-chain-primary full-body rotation.
      // Every session has a squat OR hinge primary, a push, a pull,
      // and core. Unilateral work baked in by session 2. Pressing
      // is present in every upper slot but never dominates.
      3: {
        weekCoachNote:
          "Three full-body sessions built around posterior chain and compound strength. You'll see squat and hinge patterns rotate through the week, with push-pull balance on every day.",
        sessions: [
          {
            title: "Full Body — Squat Day",
            coachNote:
              "Squat leads the session. Everything else supports the pattern or adds balance.",
            slots: [
              {
                role: "primary",
                pattern: "squat",
                loadability: "high",
                note: "Bilateral squat primary — loaded pattern to build base.",
              },
              {
                role: "secondary",
                pattern: "hinge",
                loadability: "high",
                note: "RDL or similar — balances the squat, trains posterior chain.",
              },
              {
                role: "accessory",
                pattern: "horizontalPush",
                loadability: "medium",
                note: "Press variant — keep it submaximal on squat day.",
              },
              {
                role: "accessory",
                pattern: "horizontalPull",
                loadability: "medium",
                note: "Row variant — balances the press.",
              },
              {
                role: "accessory",
                pattern: "isolation",
                loadability: "low",
                note: "Core anti-extension (plank family) — non-negotiable on squat day.",
              },
            ],
          },
          {
            title: "Full Body — Hinge Day",
            coachNote:
              "Deadlift or hip hinge leads. Unilateral work today — single-leg is where real-world strength lives.",
            slots: [
              {
                role: "primary",
                pattern: "hinge",
                loadability: "high",
                note: "Loaded hinge primary — conventional or trap bar.",
              },
              {
                role: "secondary",
                pattern: "lunge",
                loadability: "medium",
                note: "Unilateral lower — split squat, step-up, or walking lunge.",
              },
              {
                role: "accessory",
                pattern: "verticalPull",
                loadability: "medium",
                note: "Pull-up or lat pulldown — vertical pulling pattern.",
              },
              {
                role: "accessory",
                pattern: "verticalPush",
                loadability: "medium",
                note: "Overhead press — light-to-moderate on hinge day.",
              },
              {
                role: "accessory",
                pattern: "isolation",
                loadability: "low",
                note: "Glute or hamstring isolation finisher.",
              },
            ],
          },
          {
            title: "Full Body — Mixed Compound",
            coachNote:
              "A lighter full-body day. No one lift is the star — the goal is quality reps across the whole body.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet or front squat — moderate load, emphasise position." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust — posterior chain primary pattern for female lifters." },
              { role: "accessory", pattern: "horizontalPush", loadability: "medium", note: "DB or incline press — submaximal, pattern work." },
              { role: "accessory", pattern: "horizontalPull", loadability: "medium", note: "Chest-supported row — strict form, upper back focus." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation — Pallof or dead bug family." },
            ],
          },
        ],
      },

      // 4-DAY NEW STRENGTH ─────────────────────────────────────────────
      // Lower / Upper / Lower / Upper. Lower gets the harder days.
      // Still posterior-chain-led; pressing always supporting.
      4: {
        weekCoachNote:
          "Four sessions split lower and upper. Your two lower days cover squat-led and hinge-led patterns; your two upper days balance push and pull evenly.",
        sessions: [
          {
            title: "Lower Body — Squat Focus",
            coachNote: "Squat leads. Unilateral work follows — today's about building a strong base.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Bilateral squat primary." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "hinge", loadability: "medium", note: "RDL moderate — balances the squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute or hamstring isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Push & Pull Balance",
            coachNote: "Equal push and pull. Pressing supports, pulling drives posterior chain.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Loaded row primary — upper back is the priority." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Horizontal pressing — bench or DB." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press — moderate." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Rear delt or face pull — non-negotiable." },
            ],
          },
          {
            title: "Lower Body — Hinge Focus",
            coachNote: "Hinge leads today. Deadlift or hip thrust primary — your call on the split.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Loaded hinge primary — deadlift OR hip thrust." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Squat accessory — moderate load." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral — can be step-up for new lifters." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation finisher." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter than day 2, more total reps. Quality of movement matters more than load.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Press variant — moderate load." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Row variant — volume work." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead or incline — can swap." },
              { role: "accessory", pattern: "verticalPull", loadability: "low", note: "Lat pulldown or assisted pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Bicep or tricep — user's preference." },
            ],
          },
        ],
      },

      // 5-DAY NEW STRENGTH ─────────────────────────────────────────────
      // 3 lower + 2 upper. Deliberately posterior-heavy.
      5: {
        weekCoachNote:
          "Five sessions — three lower, two upper. Posterior chain gets the extra day, which is where most of your strength comes from.",
        sessions: [
          {
            title: "Lower Body — Squat Focus",
            coachNote: "Squat leads. Full primary compound session.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Bilateral squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Quad or glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Pull Focus",
            coachNote: "Pulling leads today. Upper back is the priority.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Loaded row primary." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up or lat pulldown." },
              { role: "accessory", pattern: "horizontalPush", loadability: "medium", note: "Press accessory." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Rear delt or face pull." },
            ],
          },
          {
            title: "Lower Body — Hinge Focus",
            coachNote: "Hinge leads. Heavy day for the posterior chain.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust — user choice." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Squat accessory, moderate load." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Push Focus",
            coachNote: "Pressing leads — still balanced with pulling, but push gets the primary slot today.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench or DB press primary." },
              { role: "secondary", pattern: "horizontalPull", loadability: "high", note: "Row — equal volume to the press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press accessory." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or pulldown." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Arm isolation — bicep or tricep." },
            ],
          },
          {
            title: "Lower Body — Volume & Unilateral",
            coachNote: "Lighter lower day built around unilateral and accessory work.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Unilateral primary — split squat or walking lunge." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust or single-leg RDL." },
              { role: "accessory", pattern: "squat", loadability: "medium", note: "Goblet or front squat — moderate." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Calf or abductor." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-lateral flexion — suitcase carry or side plank." },
            ],
          },
        ],
      },

      // 6-DAY NEW STRENGTH ─────────────────────────────────────────────
      // Lower / Upper x3. Full 1:1 but each day has a clear emphasis.
      6: {
        weekCoachNote:
          "Six sessions — three lower, three upper. High frequency with clear daily emphasis. Recovery matters more than ever at this volume.",
        sessions: [
          {
            title: "Lower Body — Squat Focus",
            coachNote: "Squat leads — full loaded compound work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Bilateral squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Quad isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Pull Focus",
            coachNote: "Pulling leads. Upper back is the priority.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Row primary." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Press variant." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Rear delt or face pull." },
            ],
          },
          {
            title: "Lower Body — Hinge Focus",
            coachNote: "Hinge leads. Deadlift or hip thrust depending on your preference.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Loaded hinge primary." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Squat accessory." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Push Focus",
            coachNote: "Pressing leads. Still balanced against pulling.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench or DB press primary." },
              { role: "secondary", pattern: "horizontalPull", loadability: "high", note: "Row — balances the press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Vertical pull." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Bicep or tricep." },
            ],
          },
          {
            title: "Lower Body — Unilateral & Glutes",
            coachNote: "Lighter lower day. Unilateral primary, glute-focused secondary.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Unilateral primary — split squat or walking lunge." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "Hip thrust — glute primary." },
              { role: "accessory", pattern: "squat", loadability: "medium", note: "Goblet squat — moderate." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Calf or glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-lateral flexion." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter upper day — quality of reps matters more than load.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Press variant — moderate." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Row variant — moderate." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Lat pulldown or assisted pull-up." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Lateral raise or light overhead." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Arm isolation — user preference." },
            ],
          },
        ],
      },
    },

    // ── STRENGTH · DEVELOPING ──────────────────────────────────────────
    developing: {
      // 2-DAY — both full-body, both loaded primary, more volume per day
      2: {
        weekCoachNote:
          "Two full-body sessions. At developing level, each day carries real load on primary movements — treat them like the main events they are.",
        sessions: [
          {
            title: "Full Body — Squat Lead",
            coachNote: "Squat leads. Followed by loaded hinge — two heavy compounds in one session.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell back squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "Loaded hinge — RDL or deadlift." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Loaded press." },
              { role: "accessory", pattern: "horizontalPull", loadability: "medium", note: "Row variant." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Full Body — Hinge Lead",
            coachNote: "Hinge leads. Unilateral work takes the second slot — harder than it looks.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Loaded deadlift or hip thrust primary." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat or walking lunge, loaded." },
              { role: "secondary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up or lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
        ],
      },

      // 3-DAY — push/pull/legs flavour but with full-body primaries
      3: {
        weekCoachNote:
          "Three sessions — lower, upper, lower. Posterior chain gets the extra day. Every session has a clear primary.",
        sessions: [
          {
            title: "Lower Body — Strength",
            coachNote: "Squat leads. Heavy compound work is the point of this session.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Strength",
            coachNote: "Push and pull in equal measure. Add load on primaries if last week left you with reps in reserve.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Barbell row — matches the press." },
              { role: "secondary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or lat pulldown." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Face pull or rear delt." },
            ],
          },
          {
            title: "Lower Body — Volume & Hinge",
            coachNote: "Hinge leads. Lighter than day 1 but more total work — volume is the progression lever.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust — user choice." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat or walking lunge." },
              { role: "accessory", pattern: "squat", loadability: "medium", note: "Front squat or goblet — moderate." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
        ],
      },

      // 4-DAY — classic lower/upper rotation, each twice per week
      4: {
        weekCoachNote:
          "Four sessions — two lower, two upper. Each movement pattern gets worked twice: once heavy, once moderate.",
        sessions: [
          {
            title: "Lower Body — Strength (Squat)",
            coachNote: "Heavy squat day. Everything else is support work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Leg curl or hamstring work." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Strength",
            coachNote: "Heavy upper day. Press and pull carry equal weight.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Loaded row." },
              { role: "secondary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Rear delt or face pull." },
            ],
          },
          {
            title: "Lower Body — Strength (Hinge)",
            coachNote: "Heavy hinge day. Deadlift or hip thrust primary — your call.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift OR hip thrust primary." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Squat variation — moderate." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Bulgarian split squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Same muscles as day 2, lighter and longer. Quality over load today.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Incline press or DB." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Cable row or chest-supported row." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead accessory." },
              { role: "accessory", pattern: "verticalPull", loadability: "low", note: "Lat pulldown." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Arm isolation." },
            ],
          },
        ],
      },

      // 5-DAY — 3 lower + 2 upper, developing lifters earn it
      5: {
        weekCoachNote:
          "Five sessions — three lower, two upper. Lower body gets the extra frequency because that's where your strength gains live at this stage.",
        sessions: [
          {
            title: "Lower Body — Heavy Squat",
            coachNote: "Squat primary. Heavy and technical.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral lower." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Leg curl." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Heavy",
            coachNote: "Push and pull heavy. Most important upper day of the week.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Barbell row — matches the bench." },
              { role: "secondary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Weighted pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower Body — Heavy Hinge",
            coachNote: "Deadlift or hip thrust primary. Heavy posterior chain day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust primary." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat accessory." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute-ham raise or similar." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter upper day. Volume drives hypertrophy.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Incline or DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Cable or chest-supported row." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Seated DB press." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Arms — biceps or triceps." },
            ],
          },
          {
            title: "Lower Body — Unilateral & Glute",
            coachNote: "Lighter lower day, unilateral led. Single-leg strength carries everywhere.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat or walking lunge — loaded." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "Hip thrust — heavy." },
              { role: "accessory", pattern: "squat", loadability: "medium", note: "Goblet or front squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Abductor or calf." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-lateral flexion." },
            ],
          },
        ],
      },

      // 6-DAY — alternating lower/upper, six proper sessions
      6: {
        weekCoachNote:
          "Six sessions — three lower, three upper. High volume programming with clear daily emphasis and recovery built into the block structure.",
        sessions: [
          {
            title: "Lower Body — Heavy Squat",
            coachNote: "Squat primary. Highest intensity day.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "RDL loaded." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Heavy Push",
            coachNote: "Pressing leads today — still balanced with pulling.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Loaded row." },
              { role: "secondary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Tricep isolation." },
            ],
          },
          {
            title: "Lower Body — Heavy Hinge",
            coachNote: "Deadlift or hip thrust primary. Posterior chain day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Heavy Pull",
            coachNote: "Pulling primary today. Upper back and back thickness.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Weighted row — pendlay or barbell." },
              { role: "primary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up or loaded pulldown." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Bench or DB press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press accessory." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Bicep or rear delt." },
            ],
          },
          {
            title: "Lower Body — Unilateral",
            coachNote: "Lighter lower day. Unilateral and glute-focused.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat loaded." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "Hip thrust — heavy." },
              { role: "accessory", pattern: "squat", loadability: "medium", note: "Goblet squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Abductor or glute." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-lateral flexion." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter upper day. Accessories and hypertrophy work.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Incline or DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Cable row or chest-supported." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Lateral raise or light OHP." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Arms — user preference." },
            ],
          },
        ],
      },
    },

    // ── STRENGTH · INTERMEDIATE ────────────────────────────────────────
    intermediate: {
      // 2-DAY — both full-body, maximum density per session
      2: {
        weekCoachNote:
          "Two sessions isn't much for an intermediate lifter, so we make every minute count. Full-body, heavy, no fluff.",
        sessions: [
          {
            title: "Full Body — Squat & Push",
            coachNote: "Squat primary, heavy horizontal push secondary. Compact and loaded.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Barbell back squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Bench press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "high", note: "Row variant." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Full Body — Hinge & Pull",
            coachNote: "Hinge primary, vertical and horizontal pulling. Unilateral lower finishes the session.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust primary." },
              { role: "primary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat loaded." },
              { role: "secondary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
        ],
      },

      // 3-DAY — squat / upper / deadlift or hinge focus sessions
      3: {
        weekCoachNote:
          "Three focused sessions — a squat day, an upper day, and a hinge day. Each is a full workout around one primary lift.",
        sessions: [
          {
            title: "Squat Focus",
            coachNote: "Squat is the session. Two variations — both treated as real work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Back squat primary." },
              { role: "secondary", pattern: "squat", loadability: "high", note: "Front squat or pause squat — second squat variant." },
              { role: "accessory", pattern: "hinge", loadability: "medium", note: "RDL accessory." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Focus",
            coachNote: "Heavy press and heavy pull. Both primary — neither supports the other.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Barbell row primary." },
              { role: "primary", pattern: "verticalPush", loadability: "high", note: "Overhead press — third heavy lift." },
              { role: "secondary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Rear delt or face pull." },
            ],
          },
          {
            title: "Hinge Focus",
            coachNote: "Deadlift or hip thrust primary. Everything that follows supports the hinge.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust primary." },
              { role: "secondary", pattern: "hinge", loadability: "high", note: "Second hinge variant — RDL if primary was deadlift." },
              { role: "accessory", pattern: "horizontalPull", loadability: "high", note: "Row — supports the hinge pattern." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
        ],
      },

      // 4-DAY — upper/lower split, classic intermediate structure
      4: {
        weekCoachNote:
          "Four sessions — upper/lower split. Each pattern gets twice-weekly work with a heavy and volume day.",
        sessions: [
          {
            title: "Lower Body — Heavy Squat",
            coachNote: "Heavy squat. Two variations, real load on both.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Back squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "RDL — loaded." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring or quad isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Body — Heavy Push",
            coachNote: "Bench and overhead press primary. Pull balances both.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press primary." },
              { role: "primary", pattern: "verticalPush", loadability: "high", note: "Overhead press primary." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Row — matches press volume." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up accessory." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Tricep isolation." },
            ],
          },
          {
            title: "Lower Body — Heavy Hinge",
            coachNote: "Deadlift or hip thrust primary. Hinge-led session.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust primary." },
              { role: "primary", pattern: "squat", loadability: "high", note: "Front squat or pause squat." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Walking lunge loaded." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Body — Heavy Pull",
            coachNote: "Pulling leads — volume day for back thickness.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Weighted row primary." },
              { role: "primary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up or loaded pulldown." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "DB or incline press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead accessory." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Bicep or rear delt." },
            ],
          },
        ],
      },

      // 5-DAY — 3 lower + 2 upper, intermediate volume
      5: {
        weekCoachNote:
          "Five sessions — three lower, two upper. Intermediate volume. Every session has a clear heavy primary.",
        sessions: [
          {
            title: "Squat Heavy",
            coachNote: "Heavy squat day. Full compound work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Back squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "RDL loaded." },
              { role: "secondary", pattern: "lunge", loadability: "high", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Hamstring." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Push Heavy",
            coachNote: "Bench and overhead primary.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench press." },
              { role: "primary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Row — matches push." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Deadlift Heavy",
            coachNote: "Deadlift or hip thrust — heaviest hinge day of the week.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust primary." },
              { role: "primary", pattern: "squat", loadability: "high", note: "Front squat accessory." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Pull Heavy",
            coachNote: "Pulling leads. Vertical and horizontal both heavy.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Row primary." },
              { role: "primary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "DB or incline press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead accessory." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Bicep or rear delt." },
            ],
          },
          {
            title: "Lower Unilateral & Glute",
            coachNote: "Unilateral primary. Heavy glute secondary.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat loaded." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "Hip thrust heavy." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Goblet or front squat." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Abductor or calf." },
              { role: "accessory", pattern: "isolation", loadability: "low", note: "Core anti-lateral flexion." },
            ],
          },
        ],
      },

      // 6-DAY — full lower/upper alternation, intermediate volume
      6: {
        weekCoachNote:
          "Six sessions — three lower, three upper. Highest-frequency template. Recovery discipline matters more than load progression at this volume.",
        sessions: [
          {
            title: "Squat Heavy",
            coachNote: "Squat primary, heavy compound day.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "high", note: "Back squat primary." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "RDL loaded." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation_hamstring", loadability: "low", note: "Hamstring." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Core anti-extension." },
            ],
          },
          {
            title: "Upper Push Heavy",
            coachNote: "Heavy push day. Pull matches volume.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "high", note: "Bench primary." },
              { role: "primary", pattern: "verticalPush", loadability: "high", note: "Overhead press." },
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Row." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Deadlift Heavy",
            coachNote: "Heavy hinge day. Deadlift or hip thrust primary.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "high", note: "Deadlift or hip thrust." },
              { role: "primary", pattern: "squat", loadability: "high", note: "Front squat." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Core anti-rotation." },
            ],
          },
          {
            title: "Upper Pull Heavy",
            coachNote: "Pull primary. Volume for back width and thickness.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "high", note: "Barbell row." },
              { role: "primary", pattern: "verticalPull", loadability: "high", note: "Weighted pull-up." },
              { role: "secondary", pattern: "horizontalPush", loadability: "high", note: "Incline press." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead accessory." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep or rear delt." },
            ],
          },
          {
            title: "Lower Unilateral",
            coachNote: "Unilateral primary. Glute heavy secondary.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "high", note: "Bulgarian split squat loaded." },
              { role: "primary", pattern: "hinge", loadability: "high", note: "Hip thrust heavy." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Goblet or front squat." },
              { role: "accessory", pattern: "isolation_adductor_abductor", loadability: "low", note: "Abductor or calf." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Core anti-lateral flexion." },
            ],
          },
          {
            title: "Upper Volume",
            coachNote: "Lighter upper day. Volume work and accessories.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Incline or DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Cable or chest-supported row." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Lateral raise or light OHP." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Arms — user preference." },
            ],
          },
        ],
      },
    },

    // ── STRENGTH-GOAL ISOLATION SUB-TYPE NOTE ──────────────────────────
    // Where the strength templates above (.new / .developing / etc.)
    // use the generic `isolation` value, that's legacy from the initial
    // draft — the typechecker accepts it because `isolation` is
    // retained as @deprecated. The strength templates will be migrated
    // to specific sub-types in a follow-up pass. The general-goal
    // templates below use the sub-types directly from the start.
  },

  // ── GENERAL ─────────────────────────────────────────────────────────
  //
  // General-goal templates prioritise CONSISTENCY over intensity.
  //   - 4 slots per session (vs 5 for strength) — less daunting
  //   - More variety across sessions within a week
  //   - Lower loadability throughout — moderate and low dominate
  //   - Cardio/conditioning note populated for new users
  //   - Same pattern priority as strength (hinge > squat > pull > push)
  //     because the philosophy is "strength training is the product,"
  //     just at a more approachable intensity.
  //
  // NOTE: muscle-goal templates are intentionally NOT drafted yet —
  // see literature-review-brief-muscle-templates.md. Muscle waits on
  // Q1 evidence review before authoring.
  general: {
    new: {
      // 2-DAY GENERAL NEW ──────────────────────────────────────────────
      2: {
        weekCoachNote:
          "Two full-body sessions. Keep it simple and undaunting — consistency matters more than intensity at this stage.",
        optionalCardioNote:
          "Want to add cardio? A 20-30 minute walk, easy bike ride, or dance class on a non-training day is perfect. You don't need more — your lifts are already doing most of the work.",
        sessions: [
          {
            title: "Full Body — Session A",
            coachNote: "Two big compound movements and a couple of accessories. Leave feeling good, not crushed.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet or bodyweight squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Glute bridge, hip thrust, or RDL." },
              { role: "accessory", pattern: "horizontalPush", loadability: "low", note: "Push-up or DB press." },
              { role: "accessory", pattern: "horizontalPull", loadability: "low", note: "Row — DB or band." },
            ],
          },
          {
            title: "Full Body — Session B",
            coachNote: "Unilateral lower and a pull-focused upper body. Familiar shape, slightly different emphasis.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL primary." },
              { role: "secondary", pattern: "lunge", loadability: "low", note: "Step-up or walking lunge." },
              { role: "accessory", pattern: "verticalPull", loadability: "low", note: "Lat pulldown or assisted pull-up." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank family — dead bug or bird dog." },
            ],
          },
        ],
      },

      // 3-DAY GENERAL NEW ──────────────────────────────────────────────
      3: {
        weekCoachNote:
          "Three full-body sessions rotating through squat, hinge, and mixed-compound days. Building the habit comes first.",
        optionalCardioNote:
          "Three sessions a week is already plenty. If you want to add cardio, a walk or easy cycle on rest days is the simplest addition — nothing structured needed.",
        sessions: [
          {
            title: "Full Body — Squat Day",
            coachNote: "Squat leads. Simple shape, low pressure.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet or bodyweight squat." },
              { role: "secondary", pattern: "horizontalPush", loadability: "low", note: "DB press or push-up." },
              { role: "accessory", pattern: "horizontalPull", loadability: "low", note: "Row." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank family." },
            ],
          },
          {
            title: "Full Body — Hinge Day",
            coachNote: "Hinge leads. Hip thrust is the star — glute work that feels good.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL primary." },
              { role: "secondary", pattern: "lunge", loadability: "low", note: "Walking lunge or step-up." },
              { role: "accessory", pattern: "verticalPull", loadability: "low", note: "Lat pulldown." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Bird dog or Pallof press." },
            ],
          },
          {
            title: "Full Body — Mixed",
            coachNote: "A gentle full-body day. No single lift is the focus — the point is moving well across the whole body.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "low", note: "Bodyweight or goblet squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "accessory", pattern: "horizontalPush", loadability: "low", note: "DB or incline press." },
              { role: "accessory", pattern: "horizontalPull", loadability: "low", note: "Row variant." },
            ],
          },
        ],
      },

      // 4-DAY GENERAL NEW ──────────────────────────────────────────────
      4: {
        weekCoachNote:
          "Four sessions, split lower and upper. Each day hits its focus cleanly — no one day is brutal, no one day is wasted.",
        optionalCardioNote:
          "Four sessions is a full week for most people. Cardio is optional — if you want it, 15-20 minutes of easy work on a rest day is the sweet spot.",
        sessions: [
          {
            title: "Lower Body — Easy Compound",
            coachNote: "Squat and hinge, both moderate. Gentle introduction to compound work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet or bodyweight squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL." },
              { role: "accessory", pattern: "lunge", loadability: "low", note: "Step-up or walking lunge." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank family." },
            ],
          },
          {
            title: "Upper Body — Push & Pull",
            coachNote: "Balanced push and pull. Gentle shapes, strict form.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row variant." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "DB press or push-up." },
              { role: "accessory", pattern: "verticalPull", loadability: "low", note: "Lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Seated overhead press." },
            ],
          },
          {
            title: "Lower Body — Glute Focus",
            coachNote: "Hip thrust is the session. Follow-on work supports the glutes.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust primary." },
              { role: "secondary", pattern: "lunge", loadability: "low", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof or bird dog." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter upper day. More reps, less load — quality of movement is the point.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "low", note: "DB or incline press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "low", note: "Chest-supported row." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull or rear delt fly." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep curl — optional." },
            ],
          },
        ],
      },

      // 5-DAY GENERAL NEW ──────────────────────────────────────────────
      5: {
        weekCoachNote:
          "Five sessions is a lot at general level — make sure you want this frequency. Each day stays light on intent and short on duration.",
        optionalCardioNote:
          "At five sessions a week, skip structured cardio unless it's something you enjoy. Walking is always welcome.",
        sessions: [
          {
            title: "Lower Body — Squat Day",
            coachNote: "Squat-led lower day. Keep it gentle — five sessions is a lot.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet squat primary." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "low", note: "Step-up." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
            ],
          },
          {
            title: "Upper Body — Pull Day",
            coachNote: "Pulling leads. Upper back is the priority.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row variant." },
              { role: "secondary", pattern: "verticalPull", loadability: "low", note: "Lat pulldown." },
              { role: "accessory", pattern: "horizontalPush", loadability: "low", note: "DB press." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower Body — Hinge Day",
            coachNote: "Hinge leads. Glute-focused day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL." },
              { role: "secondary", pattern: "squat", loadability: "low", note: "Goblet squat." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof press." },
            ],
          },
          {
            title: "Upper Body — Push Day",
            coachNote: "Pressing primary — still balanced with pull.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Overhead press." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Full Body — Light & Mobility",
            coachNote: "A gentler full-body day to close the week. Mobility work welcome.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "low", note: "Walking lunge or step-up." },
              { role: "secondary", pattern: "hinge", loadability: "low", note: "Hip thrust light." },
              { role: "accessory", pattern: "horizontalPull", loadability: "low", note: "Row." },
              { role: "accessory", pattern: "mobility", loadability: "low", note: "Mobility flow or carry." },
            ],
          },
        ],
      },

      // 6-DAY GENERAL NEW ──────────────────────────────────────────────
      // Unusual combination — new lifter + 6 days is ambitious. Kept light
      // and varied, with a mobility day explicitly built in.
      6: {
        weekCoachNote:
          "Six sessions as a new lifter is very ambitious. Each day is short and light — if it's too much, drop a day, no guilt.",
        optionalCardioNote:
          "With six sessions a week, structured cardio is unnecessary. Rest days are more valuable.",
        sessions: [
          {
            title: "Lower Body — Squat",
            coachNote: "Gentle squat day.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet squat." },
              { role: "secondary", pattern: "hinge", loadability: "low", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "low", note: "Step-up." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
            ],
          },
          {
            title: "Upper Body — Pull",
            coachNote: "Pull-led upper day.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "secondary", pattern: "verticalPull", loadability: "low", note: "Lat pulldown." },
              { role: "accessory", pattern: "horizontalPush", loadability: "low", note: "DB press." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower Body — Hinge",
            coachNote: "Glute-focused hinge day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "secondary", pattern: "squat", loadability: "low", note: "Goblet." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper Body — Push",
            coachNote: "Pressing primary — light and balanced.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "low", note: "Row." },
              { role: "accessory", pattern: "verticalPush", loadability: "low", note: "Overhead." },
              { role: "accessory", pattern: "isolation_lateral_delt", loadability: "low", note: "Lateral raise." },
            ],
          },
          {
            title: "Lower Body — Unilateral",
            coachNote: "Single-leg focus. Lighter than the other lower days.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "secondary", pattern: "hinge", loadability: "low", note: "Single-leg hip thrust." },
              { role: "accessory", pattern: "isolation_calf", loadability: "low", note: "Calf." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Side plank." },
            ],
          },
          {
            title: "Mobility & Carry",
            coachNote: "A dedicated mobility day. Gentle movement, zero intent. Recovery is the point.",
            slots: [
              { role: "activation", pattern: "mobility", loadability: "low", note: "Mobility flow." },
              { role: "accessory", pattern: "carry", loadability: "low", note: "Farmer's carry — light." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
              { role: "accessory", pattern: "mobility", loadability: "low", note: "Second mobility block — hip or thoracic." },
            ],
          },
        ],
      },
    },

    developing: {
      // 2-DAY ──────────────────────────────────────────────────────────
      2: {
        weekCoachNote: "Two full-body sessions. At developing level, each day covers the whole body with moderate intent.",
        sessions: [
          {
            title: "Full Body — Squat Lead",
            coachNote: "Squat leads. Hinge follows. Push/pull balanced.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Goblet or back squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "horizontalPush", loadability: "medium", note: "DB or bench press." },
              { role: "accessory", pattern: "horizontalPull", loadability: "medium", note: "Row." },
            ],
          },
          {
            title: "Full Body — Hinge Lead",
            coachNote: "Hinge leads. Unilateral lower and pull-heavy upper.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Walking lunge or split squat." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or lat pulldown." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
            ],
          },
        ],
      },

      // 3-DAY ──────────────────────────────────────────────────────────
      3: {
        weekCoachNote: "Three sessions — lower, upper, lower. Developing lifters get more load and more variety per session.",
        sessions: [
          {
            title: "Lower Body — Squat Focus",
            coachNote: "Squat leads. Heavier than a new lifter's day, but still moderate intent.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat or goblet." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
            ],
          },
          {
            title: "Upper Body — Balance",
            coachNote: "Push and pull in equal measure.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "DB or bench press." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or pulldown." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower Body — Hinge Focus",
            coachNote: "Hinge leads. Glute-focused session.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
            ],
          },
        ],
      },

      // 4-DAY ──────────────────────────────────────────────────────────
      4: {
        weekCoachNote: "Four sessions — lower/upper split. Each pattern twice per week, moderate intent throughout.",
        sessions: [
          {
            title: "Lower Body — Squat",
            coachNote: "Squat day. Moderate load, full compound work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat or goblet." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
            ],
          },
          {
            title: "Upper Body — Push & Pull",
            coachNote: "Push and pull balanced.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "DB or bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up or pulldown." },
            ],
          },
          {
            title: "Lower Body — Hinge",
            coachNote: "Hinge-led day. Glute and hamstring focus.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust primary." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front or goblet squat." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper Body — Volume",
            coachNote: "Lighter upper day. Accessories and carries.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Chest-supported row." },
              { role: "secondary", pattern: "horizontalPush", loadability: "low", note: "Incline or DB press." },
              { role: "accessory", pattern: "isolation_lateral_delt", loadability: "low", note: "Lateral raise." },
              { role: "accessory", pattern: "carry", loadability: "low", note: "Farmer's carry." },
            ],
          },
        ],
      },

      // 5-DAY ──────────────────────────────────────────────────────────
      5: {
        weekCoachNote: "Five sessions — 3 lower, 2 upper. Moderate-intent lower body gets the extra frequency.",
        sessions: [
          {
            title: "Lower — Squat",
            coachNote: "Squat-led.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat or goblet." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_quad", loadability: "low", note: "Quad isolation." },
            ],
          },
          {
            title: "Upper — Pull",
            coachNote: "Pull-led upper.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "horizontalPush", loadability: "medium", note: "DB press." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower — Hinge",
            coachNote: "Hinge day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or RDL." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Goblet." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper — Push",
            coachNote: "Push-led upper.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Bench or DB press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Lower — Unilateral",
            coachNote: "Unilateral-led lighter lower day.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "medium", note: "Bulgarian split squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "accessory", pattern: "isolation_calf", loadability: "low", note: "Calf." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Side plank." },
            ],
          },
        ],
      },

      // 6-DAY ──────────────────────────────────────────────────────────
      6: {
        weekCoachNote: "Six sessions — 3 lower, 3 upper. Recovery discipline matters more than load at this frequency.",
        sessions: [
          {
            title: "Lower — Squat",
            coachNote: "Squat-led.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "core_anti_extension", loadability: "low", note: "Plank." },
            ],
          },
          {
            title: "Upper — Push",
            coachNote: "Push-led upper.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "DB or bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row — balance." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Lower — Hinge",
            coachNote: "Hinge-led.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Goblet." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper — Pull",
            coachNote: "Pull-led upper.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "primary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "horizontalPush", loadability: "low", note: "DB press." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep." },
            ],
          },
          {
            title: "Lower — Unilateral",
            coachNote: "Unilateral day.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "medium", note: "Split squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "accessory", pattern: "isolation_adductor_abductor", loadability: "low", note: "Abductor." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Side plank." },
            ],
          },
          {
            title: "Upper — Volume",
            coachNote: "Lighter upper day.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "low", note: "Incline press." },
              { role: "secondary", pattern: "horizontalPull", loadability: "low", note: "Cable row." },
              { role: "accessory", pattern: "isolation_lateral_delt", loadability: "low", note: "Lateral raise." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Rear delt." },
            ],
          },
        ],
      },
    },

    intermediate: {
      // 2-DAY ──────────────────────────────────────────────────────────
      // Unusual combination — intermediate lifter on 2 days. Full-body
      // with real compound work.
      2: {
        weekCoachNote: "Two sessions for an intermediate lifter means we go full-body and we actually lift. No junk work.",
        sessions: [
          {
            title: "Full Body A",
            coachNote: "Squat and hinge both heavy-ish. Full compound work.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "primary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "Bench or DB." },
              { role: "accessory", pattern: "horizontalPull", loadability: "medium", note: "Row." },
            ],
          },
          {
            title: "Full Body B",
            coachNote: "Hinge leads. Unilateral secondary. Pull primary upper.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or deadlift." },
              { role: "secondary", pattern: "lunge", loadability: "medium", note: "Bulgarian split squat." },
              { role: "secondary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "accessory", pattern: "verticalPush", loadability: "medium", note: "Overhead press." },
            ],
          },
        ],
      },

      // 3-DAY ──────────────────────────────────────────────────────────
      3: {
        weekCoachNote: "Three focused sessions. Each has a clear primary.",
        sessions: [
          {
            title: "Squat Focus",
            coachNote: "Squat leads. Two variations.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front or goblet." },
              { role: "accessory", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
            ],
          },
          {
            title: "Upper Focus",
            coachNote: "Upper body primaries.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "secondary", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
            ],
          },
          {
            title: "Hinge Focus",
            coachNote: "Hinge-led session.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or deadlift." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Second hinge variant." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Unilateral." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
            ],
          },
        ],
      },

      // 4-DAY ──────────────────────────────────────────────────────────
      4: {
        weekCoachNote: "Upper/lower x2. Classic intermediate general-goal split.",
        sessions: [
          {
            title: "Lower — Squat",
            coachNote: "Squat day.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_quad", loadability: "low", note: "Quad isolation." },
            ],
          },
          {
            title: "Upper — Balance",
            coachNote: "Push and pull equal.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "secondary", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Face pull." },
            ],
          },
          {
            title: "Lower — Hinge",
            coachNote: "Hinge day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or deadlift." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Split squat." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper — Volume",
            coachNote: "Lighter upper day.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Chest-supported row." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "Incline press." },
              { role: "accessory", pattern: "isolation_lateral_delt", loadability: "low", note: "Lateral raise." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep." },
            ],
          },
        ],
      },

      // 5-DAY ──────────────────────────────────────────────────────────
      5: {
        weekCoachNote: "Five sessions — 3 lower, 2 upper. Intermediate general-goal volume.",
        sessions: [
          {
            title: "Lower — Squat",
            coachNote: "Squat primary.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_hamstring", loadability: "low", note: "Hamstring." },
            ],
          },
          {
            title: "Upper — Push",
            coachNote: "Push-led.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row — balance." },
              { role: "secondary", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Lower — Hinge",
            coachNote: "Hinge primary.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or deadlift." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute isolation." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper — Pull",
            coachNote: "Pull-led.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "primary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "DB press." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep." },
            ],
          },
          {
            title: "Lower — Unilateral",
            coachNote: "Unilateral day.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "medium", note: "Bulgarian split squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Hip thrust." },
              { role: "accessory", pattern: "isolation_calf", loadability: "low", note: "Calf." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Side plank." },
            ],
          },
        ],
      },

      // 6-DAY ──────────────────────────────────────────────────────────
      6: {
        weekCoachNote: "Six sessions — full alternation. Intermediate volume with clear daily emphasis.",
        sessions: [
          {
            title: "Lower — Squat",
            coachNote: "Squat day.",
            slots: [
              { role: "primary", pattern: "squat", loadability: "medium", note: "Back squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "RDL." },
              { role: "accessory", pattern: "lunge", loadability: "medium", note: "Walking lunge." },
              { role: "accessory", pattern: "isolation_quad", loadability: "low", note: "Quad." },
            ],
          },
          {
            title: "Upper — Push",
            coachNote: "Push day.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "medium", note: "Bench." },
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "secondary", pattern: "verticalPush", loadability: "medium", note: "Overhead." },
              { role: "accessory", pattern: "isolation_tricep", loadability: "low", note: "Tricep." },
            ],
          },
          {
            title: "Lower — Hinge",
            coachNote: "Hinge day.",
            slots: [
              { role: "primary", pattern: "hinge", loadability: "medium", note: "Hip thrust or deadlift." },
              { role: "secondary", pattern: "squat", loadability: "medium", note: "Front squat." },
              { role: "accessory", pattern: "isolation_glute", loadability: "low", note: "Glute." },
              { role: "accessory", pattern: "core_anti_rotation", loadability: "low", note: "Pallof." },
            ],
          },
          {
            title: "Upper — Pull",
            coachNote: "Pull day.",
            slots: [
              { role: "primary", pattern: "horizontalPull", loadability: "medium", note: "Row." },
              { role: "primary", pattern: "verticalPull", loadability: "medium", note: "Pull-up." },
              { role: "secondary", pattern: "horizontalPush", loadability: "medium", note: "DB press." },
              { role: "accessory", pattern: "isolation_bicep", loadability: "low", note: "Bicep." },
            ],
          },
          {
            title: "Lower — Unilateral",
            coachNote: "Unilateral day.",
            slots: [
              { role: "primary", pattern: "lunge", loadability: "medium", note: "Split squat." },
              { role: "secondary", pattern: "hinge", loadability: "medium", note: "Single-leg hip thrust." },
              { role: "accessory", pattern: "isolation_adductor_abductor", loadability: "low", note: "Abductor." },
              { role: "accessory", pattern: "core_anti_lateral_flexion", loadability: "low", note: "Side plank." },
            ],
          },
          {
            title: "Upper — Volume",
            coachNote: "Lighter upper day.",
            slots: [
              { role: "primary", pattern: "horizontalPush", loadability: "low", note: "Incline." },
              { role: "secondary", pattern: "horizontalPull", loadability: "low", note: "Cable row." },
              { role: "accessory", pattern: "isolation_lateral_delt", loadability: "low", note: "Lateral raise." },
              { role: "accessory", pattern: "isolation_rear_delt", loadability: "low", note: "Rear delt." },
            ],
          },
        ],
      },
    },
  },
};
