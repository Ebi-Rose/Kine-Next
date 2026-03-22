// ── Session Muscle Focus Map ──
// Maps session titles to their target muscle groups

export const SESSION_MUSCLE_FOCUS: Record<string, string[]> = {
  "Full Body A": ["legs", "hinge", "push", "pull", "core"],
  "Full Body B": ["legs", "hinge", "push", "pull", "core"],
  "Full Body C": ["legs", "hinge", "push", "pull", "core"],
  "Full Body - Conditioning": ["legs", "hinge", "push", "pull", "core"],
  "Full Body - Athletic": ["legs", "hinge", "push", "pull", "core"],
  "Full Body Strength": ["legs", "hinge", "push", "pull", "core"],
  "Full Body": ["legs", "hinge", "push", "pull", "core"],
  "Lower Body - Strength": ["legs", "hinge", "core"],
  "Lower Body - Volume": ["legs", "hinge", "core"],
  "Lower - Strength": ["legs", "hinge", "core"],
  "Lower - Volume": ["legs", "hinge", "core"],
  "Lower Body": ["legs", "hinge", "core"],
  "Lower Body Power": ["legs", "hinge"],
  "Upper Body - Strength": ["push", "pull", "core"],
  "Upper Body - Volume": ["push", "pull", "core"],
  "Upper - Strength": ["push", "pull", "core"],
  "Upper - Volume": ["push", "pull", "core"],
  "Upper Body": ["push", "pull", "core"],
  "Upper Body B": ["push", "pull", "core"],
  "Upper Body Pull": ["pull"],
  "Push - Chest & Shoulders": ["push"],
  "Pull - Back & Biceps": ["pull"],
  "Legs - Quads & Glutes": ["legs"],
  "Legs - Quad Focus": ["legs"],
  "Legs B - Glutes & Hamstrings": ["legs", "hinge"],
  "Legs C - Full Lower Body": ["legs", "hinge"],
  "Push & Pull - Upper": ["push", "pull"],
  "Posterior Chain": ["hinge"],
  "Glutes & Posterior Chain": ["hinge", "legs"],
  "Glutes & Hamstrings B": ["hinge", "legs"],
  "Squat Focus": ["legs", "hinge"],
  "Press Focus": ["push"],
  "Deadlift Focus": ["hinge", "pull"],
  "Upper Accessory": ["push", "pull"],
  "Lower Accessory": ["legs", "hinge"],
  "Shoulders & Upper Back": ["push", "pull"],
};

export function getSessionMuscles(sessionTitle: string): string[] {
  return SESSION_MUSCLE_FOCUS[sessionTitle] || ["legs", "push", "pull", "core"];
}
