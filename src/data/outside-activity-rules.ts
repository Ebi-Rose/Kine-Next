// ── Outside Activity Rules ──
//
// Authored library of programming rules for outside activities.
// Spec: docs/specs/outside-activity-rules.md
//
// Critical: content is hand-authored training methodology.
// LLMs may *read* at runtime but never *write*.

import type { MovementPattern } from "./exercise-indications";

export type OutsideActivityId =
  | "running"
  | "swimming"
  | "cycling"
  | "team_sport"
  | "climbing"
  | "martial_arts"
  | "yoga_pilates";

export type ActivityIntent = "focus" | "constraint";

export interface OutsideActivityRule {
  id: OutsideActivityId;
  displayName: string;
  summary: string;

  focusRules: {
    boostPatterns: MovementPattern[];
    boostScore: number;
    boostRationale: string;
    deemphasizePatterns: MovementPattern[];
    deemphasizeScore: number;
    deemphasizeRationale: string;
  };

  constraintRules: {
    fatiguePatterns: MovementPattern[];
    fatiguePenalty: number;
    fatigueRationale: string;
    volumeMultiplier?: number;
  };

  globalFraming: {
    focus: string;
    constraint: string;
  };
  coachNote: {
    focus: string;
    constraint: string;
  };
  educationTags: string[];
  sourceNotes: string;
}

export const OUTSIDE_ACTIVITY_RULES: Record<OutsideActivityId, OutsideActivityRule> = {
  running: {
    id: "running",
    displayName: "Running",
    summary: "Boosts posterior chain and hip stability; manages lower-body fatigue overlap.",
    focusRules: {
      boostPatterns: ["hinge", "isolation_glute", "isolation_hamstring", "isolation_calf", "lunge", "core_anti_rotation"],
      boostScore: 8,
      boostRationale: "supports your running — hip stability and posterior chain",
      deemphasizePatterns: ["squat", "isolation_quad"],
      deemphasizeScore: 5,
      deemphasizeRationale: "less quad-dominant volume to protect your running legs",
    },
    constraintRules: {
      fatiguePatterns: ["squat", "lunge", "isolation_quad", "isolation_calf"],
      fatiguePenalty: 8,
      fatigueRationale: "overlaps with your running — managing total leg fatigue",
      volumeMultiplier: 0.9,
    },
    globalFraming: {
      focus:
        "User is training for a running goal. Prioritise posterior chain, hip stability, and single-leg strength. Manage quad fatigue — heavy bilateral squats should be programmed thoughtfully.",
      constraint:
        "User runs regularly. Reduce total lower-body volume by ~10% and avoid stacking high-fatigue quad work. The user's legs are already accumulating load from running.",
    },
    coachNote: {
      focus: "We're building around your running — more posterior chain and hip work, with quad volume managed so your legs aren't fighting two programmes.",
      constraint: "We're accounting for your running — leg volume is dialled back so your gym and run training don't compete.",
    },
    educationTags: ["running", "posterior_chain", "hip_stability", "single_leg", "endurance"],
    sourceNotes:
      "Running primarily loads quads, calves, and hip flexors concentrically. Gym should complement with eccentric posterior chain, hip stability, and calf strength.",
  },

  swimming: {
    id: "swimming",
    displayName: "Swimming",
    summary: "Boosts shoulder stability and thoracic mobility; manages upper-body fatigue.",
    focusRules: {
      boostPatterns: ["horizontalPull", "isolation_rear_delt", "core_anti_rotation", "core_anti_extension", "rotation"],
      boostScore: 8,
      boostRationale: "supports your swimming — shoulder balance and core stability",
      deemphasizePatterns: ["verticalPush", "horizontalPush", "isolation_lateral_delt"],
      deemphasizeScore: 5,
      deemphasizeRationale: "less pressing volume to protect your swimming shoulders",
    },
    constraintRules: {
      fatiguePatterns: ["verticalPush", "horizontalPush", "verticalPull", "isolation_lateral_delt"],
      fatiguePenalty: 8,
      fatigueRationale: "overlaps with your swimming — managing shoulder fatigue",
      volumeMultiplier: 0.9,
    },
    globalFraming: {
      focus:
        "User is training for a swimming goal. Prioritise pulling, rear delt, rotator cuff stability, and core anti-rotation. Shoulder internal rotation is overloaded in swimming — balance with external rotation and posterior shoulder.",
      constraint:
        "User swims regularly. Reduce upper-body pressing volume by ~10%. Shoulder fatigue from swimming stacks with gym pressing.",
    },
    coachNote: {
      focus: "We're balancing your swim shoulders — pulling and rear delt work to offset all that internal rotation, with pressing volume managed.",
      constraint: "We're accounting for your swimming — pressing volume is managed so your shoulders get proper recovery.",
    },
    educationTags: ["swimming", "shoulder_health", "rotator_cuff", "thoracic_mobility", "core"],
    sourceNotes:
      "Swimming overloads internal rotation and anterior shoulder. Gym should counter with external rotation, horizontal pulls, rear delts, and scapular stability.",
  },

  cycling: {
    id: "cycling",
    displayName: "Cycling",
    summary: "Boosts hip extension and upper back; manages quad and hip flexor fatigue.",
    focusRules: {
      boostPatterns: ["hinge", "isolation_glute", "isolation_hamstring", "horizontalPull", "verticalPull", "core_anti_extension"],
      boostScore: 8,
      boostRationale: "supports your cycling — hip extension and upper back posture",
      deemphasizePatterns: ["squat", "isolation_quad"],
      deemphasizeScore: 5,
      deemphasizeRationale: "less quad-dominant volume to complement your cycling",
    },
    constraintRules: {
      fatiguePatterns: ["squat", "lunge", "isolation_quad"],
      fatiguePenalty: 8,
      fatigueRationale: "overlaps with your cycling — managing quad fatigue",
      volumeMultiplier: 0.9,
    },
    globalFraming: {
      focus:
        "User is training for a cycling goal. Prioritise hip extension (glute/hamstring), upper back strength (counters flexed cycling posture), and core anti-extension. Cycling shortens hip flexors and overloads quads — gym should counter.",
      constraint:
        "User cycles regularly. Reduce quad-dominant volume. Cycling already provides significant lower-body training load.",
    },
    coachNote: {
      focus: "We're offsetting the bike position — more hip extension, upper back, and core work, with quad volume managed.",
      constraint: "We're accounting for your cycling — quad volume is managed so gym and bike training complement each other.",
    },
    educationTags: ["cycling", "hip_extension", "posture", "upper_back", "hip_flexor"],
    sourceNotes:
      "Cycling loads quads concentrically in a shortened hip-flexor position. Gym should counter with hip extension, thoracic extension, and hip flexor mobility.",
  },

  team_sport: {
    id: "team_sport",
    displayName: "Team sport",
    summary: "Boosts lateral stability and power; manages total-body fatigue.",
    focusRules: {
      boostPatterns: ["lunge", "isolation_adductor_abductor", "core_anti_rotation", "core_anti_lateral_flexion", "rotation"],
      boostScore: 8,
      boostRationale: "supports your sport — lateral stability and change of direction",
      deemphasizePatterns: [],
      deemphasizeScore: 0,
      deemphasizeRationale: "",
    },
    constraintRules: {
      fatiguePatterns: ["squat", "lunge", "hinge"],
      fatiguePenalty: 6,
      fatigueRationale: "managing total-body fatigue from your sport",
      volumeMultiplier: 0.9,
    },
    globalFraming: {
      focus:
        "User plays a team sport as their main training goal. Prioritise lateral movement prep — adductor/abductor strength, anti-rotation core, lunges, and change-of-direction readiness.",
      constraint:
        "User plays a team sport regularly. Reduce total lower-body volume. Team sports add unpredictable fatigue (sprints, jumps, collisions) that the gym programme must account for.",
    },
    coachNote: {
      focus: "We're building sport-ready strength — lateral stability, change of direction, and core control.",
      constraint: "We're accounting for your sport — volume is managed around your match days.",
    },
    educationTags: ["team_sport", "lateral_stability", "change_of_direction", "power", "agility"],
    sourceNotes:
      "Team sports demand multi-planar movement. Gym should build frontal-plane stability, rotational power, and deceleration capacity.",
  },

  climbing: {
    id: "climbing",
    displayName: "Climbing",
    summary: "Boosts grip, pulling, and antagonist pressing; manages forearm and lat fatigue.",
    focusRules: {
      boostPatterns: ["horizontalPush", "verticalPush", "isolation_tricep", "core_anti_extension", "core_anti_rotation"],
      boostScore: 8,
      boostRationale: "supports your climbing — antagonist balance and core",
      deemphasizePatterns: ["verticalPull", "horizontalPull", "isolation_bicep"],
      deemphasizeScore: 5,
      deemphasizeRationale: "less pulling volume — climbing already trains this heavily",
    },
    constraintRules: {
      fatiguePatterns: ["verticalPull", "horizontalPull", "isolation_bicep", "carry"],
      fatiguePenalty: 8,
      fatigueRationale: "overlaps with your climbing — managing grip and lat fatigue",
      volumeMultiplier: 0.9,
    },
    globalFraming: {
      focus:
        "User climbs as their main training goal. Prioritise antagonist work — pressing, triceps, shoulder external rotation — to balance climbing's pulling dominance. Do NOT add more pulling — climbing provides that.",
      constraint:
        "User climbs regularly. Reduce pulling and grip-intensive volume. Climbing already heavily taxes lats, biceps, and forearm flexors.",
    },
    coachNote: {
      focus: "Climbing trains pulling hard — we're balancing with pressing and core, and keeping grip-intensive gym work light.",
      constraint: "We're accounting for your climbing — pulling volume is managed so your grip and lats recover properly.",
    },
    educationTags: ["climbing", "antagonist_training", "grip_strength", "shoulder_balance", "core"],
    sourceNotes:
      "Climbing overloads finger flexors, biceps, lats, and internal rotation. Gym should provide antagonist pressing, external rotation, and finger extensor work.",
  },

  martial_arts: {
    id: "martial_arts",
    displayName: "Martial arts",
    summary: "Boosts rotational power and hip mobility; manages total-body fatigue.",
    focusRules: {
      boostPatterns: ["rotation", "core_anti_rotation", "hinge", "lunge", "isolation_adductor_abductor"],
      boostScore: 8,
      boostRationale: "supports your martial arts — rotational power and hip mobility",
      deemphasizePatterns: [],
      deemphasizeScore: 0,
      deemphasizeRationale: "",
    },
    constraintRules: {
      fatiguePatterns: ["squat", "hinge", "lunge", "verticalPush"],
      fatiguePenalty: 6,
      fatigueRationale: "managing total-body fatigue from your martial arts training",
      volumeMultiplier: 0.85,
    },
    globalFraming: {
      focus:
        "User trains martial arts as their main goal. Prioritise rotational power, hip mobility and strength through range, and anti-rotation core. Martial arts demand explosive hip extension and rotational capacity.",
      constraint:
        "User trains martial arts regularly. Martial arts training is high-volume and unpredictable. Reduce gym volume more aggressively (~15%) to avoid overtraining. Prioritise quality over quantity.",
    },
    coachNote: {
      focus: "We're building the power and mobility your martial arts demands — rotational work, hip strength, and core stability.",
      constraint: "We're accounting for your martial arts — gym volume is dialled back so you're not running on empty.",
    },
    educationTags: ["martial_arts", "rotational_power", "hip_mobility", "core_stability", "power"],
    sourceNotes:
      "Martial arts demand rotational power, hip mobility, and total-body conditioning. Volume multiplier is lower (0.85) because martial arts training is high-frequency and systemically fatiguing.",
  },

  yoga_pilates: {
    id: "yoga_pilates",
    displayName: "Yoga / Pilates",
    summary: "Complements with strength loading; minimal fatigue overlap.",
    focusRules: {
      boostPatterns: ["squat", "hinge", "horizontalPush", "verticalPush", "carry"],
      boostScore: 6,
      boostRationale: "adds the loading your yoga/Pilates practice doesn't provide",
      deemphasizePatterns: ["mobility", "activation"],
      deemphasizeScore: 3,
      deemphasizeRationale: "you're already getting this from your practice",
    },
    constraintRules: {
      fatiguePatterns: [],
      fatiguePenalty: 0,
      fatigueRationale: "",
      volumeMultiplier: 1.0,
    },
    globalFraming: {
      focus:
        "User practises yoga or Pilates as a complementary goal. The gym provides what yoga/Pilates doesn't — progressive external loading. Prioritise compound strength work and loaded carries. The user already has excellent mobility and stability foundations.",
      constraint:
        "User practises yoga or Pilates regularly. Minimal fatigue overlap with strength training — no volume reduction needed. The two complement each other.",
    },
    coachNote: {
      focus: "Your practice gives you an amazing movement foundation — we're adding the loading on top.",
      constraint: "Your yoga/Pilates and gym training complement each other — no adjustments needed.",
    },
    educationTags: ["yoga", "pilates", "mobility", "strength", "complementary_training"],
    sourceNotes:
      "Yoga/Pilates provides mobility, stability, and body awareness but minimal progressive loading. Volume multiplier is 1.0 because fatigue overlap is negligible.",
  },
};
