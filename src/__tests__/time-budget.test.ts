import {
  estimateSessionTime,
  trimSessionToTime,
  estimateSessionTimeWithRest,
  formatTimeEstimate,
  type Exercise,
} from "@/lib/time-budget";

// Mock exercise library — return known values for test exercises
jest.mock("@/data/exercise-library", () => ({
  findExercise: (name: string) => {
    const lib: Record<string, { tags: string[]; logType: string }> = {
      "Barbell Back Squat": { tags: ["Compound"], logType: "weighted" },
      "Hip Thrust": { tags: ["Compound"], logType: "weighted" },
      "Romanian Deadlift": { tags: ["Compound"], logType: "weighted" },
      "Leg Extension": { tags: ["Isolation"], logType: "weighted" },
      "Leg Curl": { tags: ["Isolation"], logType: "weighted" },
      "Calf Raises": { tags: ["Isolation"], logType: "weighted" },
      "Wall Sit": { tags: ["Isometric"], logType: "timed" },
      "Plank": { tags: ["Isometric"], logType: "timed" },
    };
    return lib[name] || null;
  },
}));

function ex(name: string, sets = "3", reps = "10", rest = "90s"): Exercise {
  return { name, sets, reps, rest };
}

describe("estimateSessionTime", () => {
  it("returns 0 for empty session", () => {
    expect(estimateSessionTime([])).toBe(0);
  });

  it("estimates compound exercises with rack/brace overhead", () => {
    const time = estimateSessionTime([ex("Barbell Back Squat", "4", "8")]);
    // 4 sets × (8×5+8 + 150) + 90 = 4×(198) + 90 = 882s → 15min
    expect(time).toBeGreaterThan(10);
    expect(time).toBeLessThan(20);
  });

  it("estimates isolation exercises faster than compounds", () => {
    const compoundTime = estimateSessionTime([ex("Barbell Back Squat", "3", "10")]);
    const isolationTime = estimateSessionTime([ex("Leg Extension", "3", "10")]);
    expect(isolationTime).toBeLessThan(compoundTime);
  });

  it("sums multiple exercises", () => {
    const single = estimateSessionTime([ex("Barbell Back Squat")]);
    const double = estimateSessionTime([
      ex("Barbell Back Squat"),
      ex("Hip Thrust"),
    ]);
    expect(double).toBeGreaterThan(single);
  });
});

describe("trimSessionToTime", () => {
  const fullSession: Exercise[] = [
    ex("Barbell Back Squat", "4", "8"),
    ex("Hip Thrust", "4", "10"),
    ex("Romanian Deadlift", "3", "10"),
    ex("Leg Extension", "3", "12"),
    ex("Leg Curl", "3", "12"),
    ex("Calf Raises", "3", "15"),
  ];

  it("returns untrimmed if under budget", () => {
    const result = trimSessionToTime(fullSession, 999);
    expect(result.trimmed).toBe(false);
    expect(result.exercises.length).toBe(6);
    expect(result.removedNames).toHaveLength(0);
  });

  it("removes isolations first", () => {
    const result = trimSessionToTime(fullSession, 40);
    const removedIsolations = result.removedNames.filter((r) => r.isIsolation);
    const removedCompounds = result.removedNames.filter((r) => !r.isIsolation);
    // Isolations should be removed before any compounds
    if (removedCompounds.length > 0) {
      // All isolations should already be removed
      expect(removedIsolations.length).toBe(3);
    } else {
      expect(removedIsolations.length).toBeGreaterThan(0);
    }
  });

  it("removes isolations from the end first", () => {
    const result = trimSessionToTime(fullSession, 50);
    if (result.removedNames.length > 0) {
      // First removed should be last isolation
      expect(result.removedNames[0].name).toBe("Calf Raises");
    }
  });

  it("preserves at least one exercise", () => {
    const result = trimSessionToTime(fullSession, 1);
    expect(result.exercises.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty exercises", () => {
    const result = trimSessionToTime([], 30);
    expect(result.trimmed).toBe(false);
    expect(result.exercises).toHaveLength(0);
  });

  it("handles zero budget", () => {
    const result = trimSessionToTime(fullSession, 0);
    expect(result.trimmed).toBe(false);
  });

  it("reduces sets as last resort", () => {
    // Single compound exercise with large sets, tiny budget
    const bigExercise = [ex("Barbell Back Squat", "5", "10")];
    const estimate = estimateSessionTime(bigExercise);
    const result = trimSessionToTime(bigExercise, Math.floor(estimate * 0.6));
    if (result.trimmed) {
      const newSets = parseInt(result.exercises[0].sets);
      expect(newSets).toBeLessThan(5);
      expect(newSets).toBeGreaterThanOrEqual(2);
    }
  });

  it("does not mutate the original array", () => {
    const original = [...fullSession];
    trimSessionToTime(fullSession, 30);
    expect(fullSession).toEqual(original);
  });
});

describe("estimateSessionTimeWithRest", () => {
  it("produces different times with different rest periods", () => {
    const exercises = [ex("Barbell Back Squat", "3", "8")];
    const short = estimateSessionTimeWithRest(exercises, 60, 45);
    const long = estimateSessionTimeWithRest(exercises, 180, 120);
    expect(long).toBeGreaterThan(short);
  });
});

describe("formatTimeEstimate", () => {
  it("returns 'Under 45 min' for short sessions", () => {
    expect(formatTimeEstimate([ex("Leg Extension", "2", "10")])).toBe("Under 45 min");
  });

  it("returns '90+ min' for very long sessions", () => {
    const longSession = Array.from({ length: 10 }, (_, i) =>
      ex("Barbell Back Squat", "5", "10")
    );
    expect(formatTimeEstimate(longSession)).toBe("90+ min");
  });
});
