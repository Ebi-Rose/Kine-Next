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
    chain: ["Knee Push-Up", "Incline Push-Up", "Push-Up", "Diamond Push-Up",
            "Weighted Push-Up", "Archer Push-Up"] },
  { id: "pike-to-hspu", muscle: "push", pattern: "vertical-push-bw",
    chain: ["Pike Push-Up", "Pseudo Planche Push-Up", "Handstand Push-Up"] },
  { id: "dip-chain", muscle: "push", pattern: "dip",
    chain: [["Band-Assisted Dip", "Assisted Dip"], "Dips", "Ring Dips", "Weighted Dips"] },

  // PULL
  { id: "pullup-chain", muscle: "pull", pattern: "vertical-pull",
    chain: [["Band-Assisted Chin-Up", "Band-Assisted Neutral-Grip Pull-Up", "Assisted Pull-Up"],
            "Band-Assisted Pull-Up", "Chin-Up", "Neutral-Grip Pull-Up", "Pull-Up",
            ["Weighted Chin-Up", "Weighted Pull-Up"],
            "Archer Pull-Up", "Typewriter Pull-Up", "Muscle-Up"] },
  { id: "hang-chain", muscle: "pull", pattern: "hang",
    chain: ["Dead Hang", "Scapular Pull-Up"] },
  { id: "lever-chain", muscle: "calisthenics", pattern: "lever",
    chain: ["Scapular Pull-Up", "Back Lever", "Front Lever"] },

  // CORE
  { id: "core-hold", muscle: "core", pattern: "core-hold",
    chain: ["Plank", "Hollow Body Hold", "L-Sit", "Hanging L-Sit", "Dragon Flag"] },
  { id: "core-raise", muscle: "core", pattern: "core-raise",
    chain: ["Lying Leg Raise", "Hanging Knee Raise", "Hanging Leg Raise",
            ["Toes-to-Bar", "Weighted Hanging Leg Raise"]] },
  { id: "core-floor", muscle: "core", pattern: "core-floor",
    chain: ["Crunch", "Bicycle Crunch", "V-Up"] },
  { id: "core-lateral", muscle: "core", pattern: "core-lateral",
    chain: ["Side Plank", "Human Flag"] },

  // LEGS
  { id: "squat-bw", muscle: "legs", pattern: "squat-bw",
    chain: ["Bodyweight Squat", "Cossack Squat", ["Pistol Squat", "Shrimp Squat"]] },
  { id: "squat-weighted", muscle: "legs", pattern: "squat-weighted", weighted: true,
    chain: ["Goblet Squat", "Barbell Back Squat"] },
  { id: "squat-front", muscle: "legs", pattern: "squat-front", weighted: true,
    chain: ["Goblet Squat", "Front Squat"] },

  // HINGE
  { id: "hinge-bw", muscle: "hinge", pattern: "hip-hinge",
    chain: ["Bodyweight Glute Bridge", "Banded Hip Thrust", "Single-Leg Hip Thrust",
            "Weighted Single-Leg Hip Thrust"] },
  { id: "nordic", muscle: "hinge", pattern: "hamstring",
    chain: ["Bodyweight Back Extension", "Back Extension", "Nordic Curl", "Weighted Nordic Curl"] },
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
  "Weighted Nordic Curl": "Added load on the eccentric — elite hamstring work",
  "Weighted Single-Leg Hip Thrust": "Unilateral hip extension with load",
  "Weighted Hanging Leg Raise": "Hold a dumbbell between feet for extra resistance",
  "Weighted Chin-Up": "Supinated grip with belt + plates",
  "Archer Pull-Up": "One arm does most of the work — unilateral strength",
  "Archer Push-Up": "Wide push-up, shift weight to one arm at a time",
  "Typewriter Pull-Up": "Traverse side to side at the top — extreme control",
  "Muscle-Up": "Pull-up into a dip — the ultimate bar skill",
  "Front Lever": "Horizontal hold face-up — full body tension",
  "Back Lever": "Horizontal hold face-down — shoulder and core demand",
  "Dragon Flag": "Lower your body as a plank from a bench — brutal core",
  "Human Flag": "Lateral hold on a pole — full body isometric",
  "Ring Dips": "Unstable rings demand stabiliser recruitment",
  "Pike Push-Up": "Hips high, vertical push — HSPU prep",
  "Pseudo Planche Push-Up": "Hands turned back, lean forward — shoulder intensive",
  "Handstand Push-Up": "Full inverted press — wall-assisted at first",
  "Pistol Squat": "Single-leg squat to full depth — balance and strength",
  "Shrimp Squat": "Rear foot held behind — quad dominant single-leg",
  "Toes-to-Bar": "Straight legs to the bar — full range core",
  "Hanging L-Sit": "Hold legs at 90° from a bar — hip flexor and core",
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
