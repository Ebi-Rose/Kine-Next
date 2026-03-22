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
    "Sumo Squat": "Goblet Squat",
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

/** Apply injury swaps to a list of exercise names */
export function applyInjurySwaps(
  exercises: string[],
  injuries: string[]
): string[] {
  if (injuries.length === 0) return exercises;

  return exercises.map((name) => {
    for (const injury of injuries) {
      const swaps = INJURY_SWAPS[injury];
      if (swaps && swaps[name]) {
        return swaps[name];
      }
    }
    return name;
  });
}
