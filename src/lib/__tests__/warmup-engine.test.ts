import { buildRampSets } from "../warmup-engine";

// Mock dependencies
jest.mock("@/data/exercise-library", () => ({
  findExercise: (name: string) => {
    if (name === "Push-Up") return { logType: "bodyweight", tags: ["Compound"] };
    if (name === "Plank") return { logType: "timed", tags: ["Isolation"] };
    return { logType: "weighted", tags: ["Compound"] };
  },
}));

jest.mock("@/data/session-muscle-focus", () => ({
  SESSION_MUSCLE_FOCUS: {
    "Lower Body A": ["legs", "hinge"],
    "Upper Body A": ["push", "pull"],
  },
}));

jest.mock("@/data/warmup-data", () => ({
  WARMUP_GENERAL: {
    push: [
      { name: "Arm Circles", duration: "30", _highImpact: false, _prone: false },
      { name: "Band Pull-Apart", duration: "30", _highImpact: false, _prone: false },
    ],
    legs: [
      { name: "Leg Swings", duration: "30", _highImpact: false, _prone: false },
      { name: "Bodyweight Squat", duration: "30", _highImpact: false, _prone: false },
    ],
  },
  WARMUP_ACTIVATION: {
    push: [{ name: "Scap Push-Up", duration: "30", _highImpact: false, _prone: true }],
    legs: [{ name: "Glute Bridge", duration: "30", _highImpact: false, _prone: false }],
  },
  WARMUP_STABILISER_EXTRAS: {},
  WARMUP_INJURY_MODS: {},
  WARMUP_CONDITION_MODS: {},
  COOLDOWN_BREATH: [{ name: "Box Breathing", duration: "60", _highImpact: false, _prone: false }],
  COOLDOWN_RESET: {
    push: [{ name: "Chest Stretch", duration: "45", _highImpact: false, _prone: false }],
  },
  COOLDOWN_EXERCISE_RELEASE: {},
}));

describe("buildRampSets", () => {
  it("returns empty for null exercise", () => {
    expect(buildRampSets(null, "new")).toEqual([]);
  });

  it("returns empty for non-compound exercise", () => {
    expect(buildRampSets({ name: "Bicep Curl" }, "new")).toEqual([]);
  });

  it("returns empty for bodyweight compound", () => {
    expect(buildRampSets({ name: "Push-Up" }, "new")).toEqual([]);
  });

  it("returns 2 ramp sets for new lifters", () => {
    const sets = buildRampSets({ name: "Barbell Back Squat" }, "new");
    expect(sets).toHaveLength(2);
    expect(sets[0].label).toBe("Empty bar");
  });

  it("returns 3 ramp sets for developing lifters", () => {
    const sets = buildRampSets({ name: "Barbell Back Squat" }, "developing");
    expect(sets).toHaveLength(3);
  });

  it("returns 4 ramp sets for intermediate+ lifters", () => {
    const sets = buildRampSets({ name: "Barbell Back Squat" }, "intermediate");
    expect(sets).toHaveLength(4);
    expect(sets[sets.length - 1].label).toBe("80%");
  });
});
