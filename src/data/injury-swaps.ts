// ── Injury-based exercise swaps ──
// When a user has an injury, these exercises get swapped out

export const INJURY_SWAPS: Record<string, Record<string, string>> = {
  knees: {
    "Barbell Back Squat": "Hip Thrust",
    "Front Squat": "Goblet Squat",
    "Bulgarian Split Squat": "Single-Leg Hip Thrust",
    "Walking Lunges": "Glute Bridge",
    "Jump Squat": "Banded Hip Thrust",
    "Leg Extension": "Leg Curl",
    "Leg Press": "Hip Thrust Machine",
    "Box Squat": "Hip Thrust",
    "Pistol Squat": "Single-Leg Deadlift",
  },
  lower_back: {
    "Conventional Deadlift": "Hip Thrust",
    "Sumo Deadlift": "Hip Thrust Machine",
    "Good Morning": "Cable Pull-Through",
    "Barbell Row": "Chest-Supported Row",
    "T-Bar Row": "Seated Cable Row",
    "Romanian Deadlift": "Dumbbell Romanian Deadlift",
    "Back Extension": "Glute Bridge",
  },
  shoulder: {
    "Overhead Press": "Landmine Press",
    "Dumbbell Shoulder Press": "Lateral Raise",
    "Arnold Press": "Lateral Raise",
    "Barbell Bench Press": "Dumbbell Bench Press",
    "Incline Barbell Press": "Incline Dumbbell Press",
    "Dips": "Tricep Pushdown",
    "Pike Push-Up": "Push-Up",
    "Handstand Push-Up": "Landmine Press",
  },
  wrist: {
    "Barbell Bench Press": "Machine Chest Press",
    "Front Squat": "Goblet Squat",
    "Push-Up": "Machine Chest Press",
    "Barbell Row": "Machine Row",
    "Overhead Press": "Machine Shoulder Press",
    "Plank": "Dead Bug",
  },
  hip: {
    "Barbell Back Squat": "Leg Press",
    "Bulgarian Split Squat": "Leg Extension",
    "Walking Lunges": "Leg Press (Single Leg)",
    "Hip Thrust": "Glute Kickback Machine",
    "Barbell Sumo Squat": "Goblet Squat",
    "Dumbbell Sumo Squat": "Goblet Squat",
    "Conventional Deadlift": "Trap Bar Deadlift",
  },
  neck: {
    "Barbell Back Squat": "Goblet Squat",
    "Overhead Press": "Lateral Raise",
    "Shrugs": "Face Pulls",
  },
  ankle: {
    "Barbell Back Squat": "Leg Press",
    "Walking Lunges": "Leg Press (Single Leg)",
    "Calf Raises": "Seated Calf Raises",
    "Jump Squat": "Leg Press",
    "Box Jumps": "Leg Extension",
  },
  postpartum: {
    "Barbell Back Squat": "Goblet Squat",
    "Conventional Deadlift": "Dumbbell Romanian Deadlift",
    "Crunch": "Dead Bug",
    "Ab Wheel Rollout": "Bird Dog",
    "Hanging Leg Raise": "Dead Bug",
    "V-Up": "Bird Dog",
    "Russian Twist": "Pallof Press",
    "Jump Squat": "Bodyweight Squat",
    "Burpees": "Bodyweight Squat",
    "Box Jumps": "Step-Ups",
  },
  chronic_pain: {
    "Conventional Deadlift": "Trap Bar Deadlift",
    "Barbell Back Squat": "Goblet Squat",
    "Overhead Press": "Landmine Press",
    "Barbell Row": "Chest-Supported Row",
  },
  limited_mobility: {
    "Barbell Back Squat": "Goblet Squat",
    "Front Squat": "Goblet Squat",
    "Overhead Press": "Landmine Press",
    "Conventional Deadlift": "Trap Bar Deadlift",
    "Pull-Up": "Lat Pulldown",
    "Dips": "Tricep Pushdown",
    "Pistol Squat": "Leg Press (Single Leg)",
  },
};

// ── Condition-based exercise swaps ──
// Health conditions (PCOS, fibroids, endometriosis, pelvic floor) that affect exercise selection.
// Conditions are context, not identity — the programme adapts silently.

export const CONDITION_SWAPS: Record<string, Record<string, string>> = {
  fibroids: {
    "Box Jumps": "Step-Ups",
    "Jump Squat": "Bodyweight Squat",
    "Burpees": "Squat to Press",
    "Jump Rope": "Incline Walk",
    "Mountain Climbers": "Dead Bug",
    "Crunch": "Pallof Press",
    "V-Up": "Dead Bug",
  },
  endometriosis: {
    "Box Jumps": "Step-Ups",
    "Jump Squat": "Bodyweight Squat",
    "Burpees": "Squat to Press",
    "Jump Rope": "Incline Walk",
    "Mountain Climbers": "Dead Bug",
    "Crunch": "Pallof Press",
    "V-Up": "Dead Bug",
  },
  pelvic_floor: {
    "Box Jumps": "Step-Ups",
    "Jump Squat": "Goblet Squat",
    "Jump Rope": "Incline Walk",
    "Burpees": "Squat to Press",
    "Crunch": "Dead Bug",
    "V-Up": "Dead Bug",
    "Ab Wheel Rollout": "Bird Dog",
    "Hanging Leg Raise": "Dead Bug",
  },
  pcos: {}, // No swaps — PCOS uses compound-priority via AI context
  hypermobility: {
    "Box Jumps": "Step-Ups",
    "Jump Squat": "Goblet Squat (3s tempo)",
    "Burpees": "Squat to Press (controlled)",
    "Jump Rope": "Incline Walk",
    "Mountain Climbers": "Dead Bug",
    "Plyo Push-Up": "Push-Up (3s tempo)",
    "Kettlebell Swing": "Romanian Deadlift (tempo)",
    "Snatch": "Romanian Deadlift",
    "Power Clean": "Trap Bar Deadlift",
    "Overhead Squat": "Front Squat",
    "Deep Squat": "Box Squat",
    "Jefferson Curl": "Romanian Deadlift",
    "Ab Wheel Rollout": "Bird Dog",
    "V-Up": "Dead Bug",
  },
};

/**
 * Result of applying swaps. Each exercise can carry the original name and
 * the reason it was swapped, so the UI can display "adapted from X" and
 * offer a one-tap revert.
 */
export interface SwappedExercise {
  name: string;
  swappedFrom?: string;
  swappedReason?: string; // raw key, e.g. "knees" / "pregnancy"
}

/** Apply injury swaps to a list of exercise names. */
export function applyInjurySwaps(
  exercises: string[],
  injuries: string[]
): SwappedExercise[] {
  if (injuries.length === 0) return exercises.map((name) => ({ name }));

  return exercises.map((name) => {
    for (const injury of injuries) {
      const swaps = INJURY_SWAPS[injury];
      if (swaps && swaps[name]) {
        return { name: swaps[name], swappedFrom: name, swappedReason: injury };
      }
    }
    return { name };
  });
}

/** Apply condition swaps on top of an already-swapped list. */
export function applyConditionSwaps(
  exercises: SwappedExercise[],
  conditions: string[]
): SwappedExercise[] {
  if (conditions.length === 0) return exercises;

  return exercises.map((ex) => {
    for (const condition of conditions) {
      const swaps = CONDITION_SWAPS[condition];
      if (swaps && swaps[ex.name]) {
        // Preserve the earliest original (injury swap wins as the source of truth).
        return {
          name: swaps[ex.name],
          swappedFrom: ex.swappedFrom ?? ex.name,
          swappedReason: ex.swappedReason ?? condition,
        };
      }
    }
    return ex;
  });
}
