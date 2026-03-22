// ── Education Layer — Breathing cues, muscle glossary, form tips ──

export const BREATHING_CUES: Record<string, string> = {
  // Compound movements
  "Barbell Back Squat": "Breathe in at the top, brace your core, hold through the rep. Exhale at the top.",
  "Front Squat": "Deep breath, brace hard. The breath keeps your torso upright.",
  "Conventional Deadlift": "Breathe in before you pull. Exhale only after lockout.",
  "Romanian Deadlift": "Inhale as you hinge down. Exhale as you drive back up.",
  "Hip Thrust": "Breathe in at the bottom. Exhale hard at the top as you squeeze.",
  "Barbell Bench Press": "Inhale as the bar descends. Exhale through the press.",
  "Overhead Press": "Big breath before you press. Exhale at lockout.",
  "Barbell Row": "Inhale at the stretch. Exhale as you pull to your chest.",
  "Pull-Up": "Inhale at the bottom. Exhale as you pull up.",
  // Isolation
  "Lateral Raise": "Controlled breathing. Exhale as you raise.",
  "Dumbbell Curl": "Exhale on the curl. Inhale on the lower.",
  // Core
  "Plank": "Breathe normally. Don't hold your breath.",
  "Dead Bug": "Exhale as you extend. Keep your lower back pressed down.",
};

export const MUSCLE_GLOSSARY: Record<string, { muscles: string[]; description: string }> = {
  push: {
    muscles: ["Chest (pectorals)", "Shoulders (deltoids)", "Triceps"],
    description: "Pushing movements develop the front of your upper body. Bench press and overhead press are the primary patterns.",
  },
  pull: {
    muscles: ["Back (lats, rhomboids, traps)", "Rear delts", "Biceps"],
    description: "Pulling builds the back of your upper body. Rows build thickness, pulldowns build width.",
  },
  legs: {
    muscles: ["Quads", "Glutes", "Calves"],
    description: "Squat and lunge patterns develop the front and sides of your lower body.",
  },
  hinge: {
    muscles: ["Hamstrings", "Glutes", "Lower back (erectors)"],
    description: "Hip hinge movements develop the entire back of your body. RDLs and hip thrusts are the foundation.",
  },
  core: {
    muscles: ["Rectus abdominis", "Obliques", "Transverse abdominis"],
    description: "Core work builds stability for every other movement. Anti-extension and anti-rotation matter more than crunches.",
  },
};

export const SET_NOTATION: Record<string, string> = {
  "3×8": "3 sets of 8 reps. Complete 8 reps, rest, repeat twice more.",
  "3×8-10": "3 sets of 8-10 reps. Start at 8. When you can do 10 for all 3 sets, add weight.",
  "4×5": "4 sets of 5 reps. Heavier weight, fewer reps. Rest longer between sets.",
  "3×12-15": "3 sets of 12-15 reps. Lighter weight, more reps. Focus on the squeeze.",
  "RPE": "Rate of Perceived Exertion. How hard a set felt on a 1-10 scale. RPE 8 = could have done 2 more reps.",
  "RIR": "Reps In Reserve. How many more reps you could have done. RIR 2 = 2 more reps left.",
};

/**
 * Get breathing cue for an exercise. Returns null if none available.
 */
export function getBreathingCue(exerciseName: string): string | null {
  return BREATHING_CUES[exerciseName] || null;
}

/**
 * Get muscle group info for a session type.
 */
export function getMuscleInfo(muscleGroup: string): { muscles: string[]; description: string } | null {
  return MUSCLE_GLOSSARY[muscleGroup] || null;
}
