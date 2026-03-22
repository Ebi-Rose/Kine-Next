// ── Skill Paths — Exercise Progression Chains ──

export interface SkillPath {
  id: string;
  muscle: string;
  pattern: string;
  weighted?: boolean;
  chain: (string | string[])[]; // string = single exercise, string[] = same-tier alternatives
}

export const SKILL_PATHS: SkillPath[] = [
  // PUSH
  { id: "push-up-chain", muscle: "push", pattern: "horizontal-push",
    chain: ["Knee Push-Up", "Incline Push-Up", "Push-Up", "Diamond Push-Up", "Weighted Push-Up"] },
  { id: "dip-chain", muscle: "push", pattern: "dip",
    chain: [["Band-Assisted Dip", "Assisted Dip"], "Dips", "Weighted Dips"] },

  // PULL
  { id: "pullup-chain", muscle: "pull", pattern: "vertical-pull",
    chain: [["Band-Assisted Chin-Up", "Band-Assisted Neutral-Grip Pull-Up", "Assisted Pull-Up"],
            "Band-Assisted Pull-Up", "Chin-Up", "Neutral-Grip Pull-Up", "Pull-Up",
            ["Weighted Chin-Up", "Weighted Neutral-Grip Pull-Up"], "Weighted Pull-Up"] },
  { id: "hang-chain", muscle: "pull", pattern: "hang",
    chain: ["Dead Hang", "Scapular Pull-Up"] },

  // CORE
  { id: "core-hold", muscle: "core", pattern: "core-hold",
    chain: ["Plank", "Hollow Body Hold", "L-Sit", "Hanging L-Sit"] },
  { id: "core-raise", muscle: "core", pattern: "core-raise",
    chain: ["Lying Leg Raise", "Hanging Knee Raise", "Hanging Leg Raise", "Toes-to-Bar"] },
  { id: "core-floor", muscle: "core", pattern: "core-floor",
    chain: ["Crunch", "Bicycle Crunch", "V-Up"] },

  // LEGS
  { id: "squat-bw", muscle: "legs", pattern: "squat-bw",
    chain: ["Bodyweight Squat", "Cossack Squat"] },
  { id: "squat-weighted", muscle: "legs", pattern: "squat-weighted", weighted: true,
    chain: ["Goblet Squat", "Barbell Back Squat"] },
  { id: "squat-front", muscle: "legs", pattern: "squat-front", weighted: true,
    chain: ["Goblet Squat", "Front Squat"] },

  // HINGE
  { id: "hinge-bw", muscle: "hinge", pattern: "hip-hinge",
    chain: ["Bodyweight Glute Bridge", "Banded Hip Thrust", "Single-Leg Hip Thrust"] },
  { id: "nordic", muscle: "hinge", pattern: "hamstring",
    chain: ["Bodyweight Back Extension", "Back Extension", "Nordic Curl"] },
];

export const SKILL_HINTS: Record<string, string> = {
  "Knee Push-Up": "Build the pushing pattern with less load",
  "Incline Push-Up": "Reduce the angle as you get stronger",
  "Push-Up": "The standard — full bodyweight horizontal push",
  "Diamond Push-Up": "Narrow hand position emphasises triceps",
  "Weighted Push-Up": "Add load — plate or vest on your back",
  "Band-Assisted Dip": "Band helps at the bottom where it's hardest",
  "Assisted Dip": "Machine counterweight — reduce it over time",
  "Dips": "Full bodyweight dip — chest forward, elbows tight",
  "Weighted Dips": "Belt + plates for additional load",
  "Band-Assisted Chin-Up": "Supinated grip, band for assistance",
  "Band-Assisted Pull-Up": "Pronated grip, band for assistance",
  "Assisted Pull-Up": "Machine — reduce counterweight progressively",
  "Chin-Up": "Supinated grip — biceps help more",
  "Neutral-Grip Pull-Up": "Palms facing — easiest grip for most",
  "Pull-Up": "Pronated grip — pure lat and upper back",
  "Weighted Pull-Up": "Belt + plates — the goal for many",
  "Dead Hang": "Grip strength and shoulder decompression",
  "Scapular Pull-Up": "Pull shoulder blades down without bending arms",
  "Plank": "Anti-extension — hold position, don't sag",
  "Hollow Body Hold": "Gymnastics foundation — lower back pressed down",
  "L-Sit": "Hip flexor and core strength combined",
  "Lying Leg Raise": "Keep lower back pressed into the floor",
  "Hanging Knee Raise": "Control the swing — abs initiate",
  "Hanging Leg Raise": "Straight legs — much harder than knees",
  "Bodyweight Squat": "Master depth and balance first",
  "Cossack Squat": "Lateral mobility and single-leg strength",
  "Goblet Squat": "Counterbalance helps depth — great teaching tool",
  "Barbell Back Squat": "The standard for lower body strength",
  "Front Squat": "Upright torso — quad emphasis",
  "Bodyweight Glute Bridge": "Learn the hip extension pattern",
  "Banded Hip Thrust": "Band adds resistance at lockout",
  "Single-Leg Hip Thrust": "Unilateral — exposes side differences",
  "Bodyweight Back Extension": "Lower back endurance foundation",
  "Back Extension": "Add load once bodyweight is easy",
  "Nordic Curl": "Advanced — eccentric hamstring strength",
};

/**
 * Find progression options for an exercise.
 * Returns easier and harder alternatives in the same chain.
 */
export function getSkillPath(
  exerciseName: string,
  userEquip: string[]
): { easier: string[]; harder: string[]; hint: string | null } | null {
  for (const path of SKILL_PATHS) {
    const flatChain: string[] = [];
    const tiers: string[][] = [];

    for (const tier of path.chain) {
      const names = Array.isArray(tier) ? tier : [tier];
      tiers.push(names);
      flatChain.push(...names);
    }

    if (!flatChain.includes(exerciseName)) continue;

    // Find which tier the exercise is in
    const currentTierIdx = tiers.findIndex((t) => t.includes(exerciseName));
    if (currentTierIdx < 0) continue;

    const easier = tiers.slice(0, currentTierIdx).flat();
    const harder = tiers.slice(currentTierIdx + 1).flat();

    return {
      easier,
      harder,
      hint: SKILL_HINTS[exerciseName] || null,
    };
  }

  return null;
}

/**
 * Check if an exercise has a skill path.
 */
export function hasSkillPath(exerciseName: string): boolean {
  return SKILL_PATHS.some((path) => {
    const flat = path.chain.flatMap((t) => (Array.isArray(t) ? t : [t]));
    return flat.includes(exerciseName);
  });
}
