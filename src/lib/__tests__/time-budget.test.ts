import {
  estimateSessionTime,
  trimSessionToTime,
  formatTimeEstimate,
  type Exercise,
} from "../time-budget";

// Mock exercise library — findExercise is used to determine compound vs isolation
jest.mock("@/data/exercise-library", () => ({
  findExercise: (name: string) => {
    const lib: Record<string, { tags: string[]; logType: string }> = {
      "Barbell Back Squat": { tags: ["Compound"], logType: "weighted" },
      "Bench Press": { tags: ["Compound"], logType: "weighted" },
      "Deadlift": { tags: ["Compound"], logType: "weighted" },
      "Leg Extension": { tags: ["Isolation"], logType: "weighted" },
      "Bicep Curl": { tags: ["Isolation"], logType: "weighted" },
      "Tricep Pushdown": { tags: ["Isolation"], logType: "weighted" },
      "Lateral Raise": { tags: ["Isolation"], logType: "weighted" },
      "Plank": { tags: ["Isolation"], logType: "timed" },
    };
    return lib[name] || null;
  },
}));

const compound = (name: string): Exercise => ({
  name,
  sets: "4",
  reps: "8",
  rest: "150 sec",
});

const isolation = (name: string): Exercise => ({
  name,
  sets: "3",
  reps: "12",
  rest: "75 sec",
});

describe("estimateSessionTime", () => {
  it("returns 0 for empty exercises", () => {
    expect(estimateSessionTime([])).toBe(0);
  });

  it("returns a positive number for a single compound exercise", () => {
    const time = estimateSessionTime([compound("Barbell Back Squat")]);
    expect(time).toBeGreaterThan(0);
  });

  it("increases with more exercises", () => {
    const one = estimateSessionTime([compound("Barbell Back Squat")]);
    const two = estimateSessionTime([
      compound("Barbell Back Squat"),
      compound("Bench Press"),
    ]);
    expect(two).toBeGreaterThan(one);
  });

  it("compounds take more time than isolations (same sets/reps)", () => {
    const compoundTime = estimateSessionTime([
      { name: "Barbell Back Squat", sets: "3", reps: "8", rest: "90 sec" },
    ]);
    const isoTime = estimateSessionTime([
      { name: "Leg Extension", sets: "3", reps: "8", rest: "90 sec" },
    ]);
    expect(compoundTime).toBeGreaterThan(isoTime);
  });
});

describe("trimSessionToTime", () => {
  it("returns untrimmed if session is within budget", () => {
    const exercises = [compound("Barbell Back Squat")];
    const result = trimSessionToTime(exercises, 999);
    expect(result.trimmed).toBe(false);
    expect(result.exercises).toEqual(exercises);
    expect(result.removedNames).toEqual([]);
  });

  it("removes isolations first when over budget", () => {
    const exercises = [
      compound("Barbell Back Squat"),
      compound("Bench Press"),
      isolation("Leg Extension"),
      isolation("Bicep Curl"),
    ];
    const fullTime = estimateSessionTime(exercises);
    // Set a tight budget that forces trimming
    const result = trimSessionToTime(exercises, Math.floor(fullTime * 0.6));
    expect(result.trimmed).toBe(true);
    // Isolations should be removed before compounds
    const removedIso = result.removedNames.filter((r) => r.isIsolation);
    expect(removedIso.length).toBeGreaterThan(0);
  });

  it("handles empty exercises", () => {
    const result = trimSessionToTime([], 30);
    expect(result.trimmed).toBe(false);
    expect(result.exercises).toEqual([]);
  });

  it("handles zero budget", () => {
    const result = trimSessionToTime([compound("Barbell Back Squat")], 0);
    expect(result.trimmed).toBe(false);
  });

  it("keeps at least one exercise", () => {
    const exercises = [
      compound("Barbell Back Squat"),
      compound("Bench Press"),
      compound("Deadlift"),
    ];
    const result = trimSessionToTime(exercises, 1);
    expect(result.exercises.length).toBeGreaterThanOrEqual(1);
  });
});

describe("formatTimeEstimate", () => {
  it("returns 'Under 45 min' for short sessions", () => {
    // Single isolation exercise should be well under 45 min
    expect(formatTimeEstimate([isolation("Bicep Curl")])).toBe("Under 45 min");
  });

  it("returns a time range string", () => {
    const result = formatTimeEstimate([
      compound("Barbell Back Squat"),
      compound("Bench Press"),
      compound("Deadlift"),
      isolation("Leg Extension"),
      isolation("Bicep Curl"),
    ]);
    expect(result).toMatch(/min/);
  });
});
