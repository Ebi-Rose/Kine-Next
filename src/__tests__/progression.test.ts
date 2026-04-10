import { calculateORM, calculatePlates } from "@/lib/progression";

jest.mock("@/store/useKineStore", () => ({
  useKineStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/data/exercise-library", () => ({
  findExercise: (name: string) => {
    const lib: Record<string, { equip: string[]; tags: string[]; logType: string }> = {
      "Barbell Back Squat": { equip: ["barbell"], tags: ["Compound"], logType: "weighted" },
      "Dumbbell Row": { equip: ["dumbbells"], tags: ["Compound"], logType: "weighted" },
      "Goblet Squat": { equip: ["dumbbells"], tags: ["Compound"], logType: "weighted" },
      "Kettlebell Swing": { equip: ["dumbbells"], tags: ["Compound"], logType: "weighted" },
      "Leg Press": { equip: ["machines"], tags: ["Compound"], logType: "weighted" },
      "Hip Thrust": { equip: ["barbell", "dumbbells", "machines"], tags: ["Compound"], logType: "weighted" },
    };
    return lib[name] || null;
  },
}));

import { useKineStore } from "@/store/useKineStore";
import { suggestNextWeight, getProgressionSuggestion, getLastSessionData, isDetrained } from "@/lib/progression";

const mockGetState = useKineStore.getState as jest.Mock;

/** ISO date string N days ago from today. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function mockStore(overrides: Record<string, unknown> = {}) {
  mockGetState.mockReturnValue({
    goal: "general",
    equip: ["barbell", "dumbbells"],
    units: "kg",
    measurementSystem: "metric",
    progressDB: {
      lifts: {},
      sessions: [],
      currentWeek: 1,
      weekFeedbackHistory: [],
      programStartDate: null,
      skippedSessions: [],
      phaseOffset: 0,
    },
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("calculateORM", () => {
  it("returns weight at 1 rep", () => {
    expect(calculateORM(100, 1)).toBe(100);
  });

  it("calculates Brzycki formula correctly", () => {
    expect(calculateORM(100, 5)).toBe(113);
  });

  it("returns 0 for invalid inputs", () => {
    expect(calculateORM(0, 5)).toBe(0);
    expect(calculateORM(100, 0)).toBe(0);
    expect(calculateORM(-10, 5)).toBe(0);
    expect(calculateORM(100, -3)).toBe(0);
  });
});

describe("calculatePlates", () => {
  beforeEach(() => mockStore());

  it("returns empty for bar weight only", () => {
    expect(calculatePlates(20)).toEqual([]);
  });

  it("returns empty for less than bar weight", () => {
    expect(calculatePlates(15)).toEqual([]);
  });

  it("calculates plates for 60kg (20kg per side)", () => {
    expect(calculatePlates(60)).toEqual([{ plate: 20, count: 1 }]);
  });

  it("calculates plates for 100kg (40kg per side)", () => {
    expect(calculatePlates(100)).toEqual([{ plate: 20, count: 2 }]);
  });

  it("handles mixed plate sizes", () => {
    expect(calculatePlates(70)).toEqual([
      { plate: 20, count: 1 },
      { plate: 5, count: 1 },
    ]);
  });

  it("handles fractional plates", () => {
    expect(calculatePlates(22.5)).toEqual([{ plate: 1.25, count: 1 }]);
  });

  it("uses custom bar weight", () => {
    expect(calculatePlates(30, 15)).toEqual([
      { plate: 5, count: 1 },
      { plate: 2.5, count: 1 },
    ]);
  });
});

// ── Progression Suggestion (new structured API) ──

describe("getProgressionSuggestion", () => {
  it("returns null when no history", () => {
    mockStore();
    expect(getProgressionSuggestion("Barbell Back Squat")).toBeNull();
  });

  it("returns null when latest has no weight", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: "2026-01-01", weight: 0, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    expect(getProgressionSuggestion("Barbell Back Squat")).toBeNull();
  });

  it("returns 'hold' with reason when building at current weight", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: daysAgoISO(2), weight: 60, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("hold");
    expect(result.suggestedWeight).toBe(60);
    expect(result.reason).toContain("target 12 reps before increasing");
  });

  it("returns 'hold' after hitting top of range once (needs confirmation)", () => {
    // Week 1 = Accumulation = 10-12 reps. Top of range = 12.
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: daysAgoISO(2), weight: 60, reps: 12 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("hold");
    expect(result.reason).toContain("one more to confirm");
  });

  it("returns 'ready' after hitting top of range twice at same weight", () => {
    // Week 1 = Accumulation = 10-12 reps. Hit 12 twice at 60kg.
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: daysAgoISO(5), weight: 60, reps: 12 },
          { date: daysAgoISO(2), weight: 60, reps: 12 },
        ]},
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("ready");
    expect(result.suggestedWeight).toBe(62.5); // barbell increment
    expect(result.currentWeight).toBe(60);
    expect(result.reason).toContain("two sessions straight");
  });

  it("adapts to phase rep range — Intensification uses 6-8", () => {
    // Week 2 = Intensification = 6-8 reps. Top of range = 8.
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: daysAgoISO(5), weight: 70, reps: 8 },
          { date: daysAgoISO(2), weight: 70, reps: 8 },
        ]},
        sessions: [], currentWeek: 2, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("ready");
    expect(result.suggestedWeight).toBe(72.5);
  });

  it("adapts to phase rep range — Peak uses 4-6", () => {
    // Week 3 = Peak = 4-6 reps. Top of range = 6.
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: daysAgoISO(5), weight: 80, reps: 6 },
          { date: daysAgoISO(2), weight: 80, reps: 6 },
        ]},
        sessions: [], currentWeek: 3, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("ready");
    expect(result.suggestedWeight).toBe(82.5);
  });

  it("does not suggest increase when weight differs between sessions", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: daysAgoISO(5), weight: 55, reps: 12 },
          { date: daysAgoISO(2), weight: 60, reps: 12 },
        ]},
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    // Different weights → can't confirm consistency → hold
    expect(result.confidence).toBe("hold");
  });

  it("returns 'deload' when detrained (>14 days gap)", () => {
    const old = new Date();
    old.setDate(old.getDate() - 20);
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: old.toISOString().split("T")[0], weight: 60, reps: 10 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.confidence).toBe("deload");
    expect(result.suggestedWeight).toBeLessThan(60);
    expect(result.reason).toContain("starting lighter to rebuild");
  });

  it("includes volume tracking", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: daysAgoISO(5), weight: 60, reps: 8 },
          { date: daysAgoISO(2), weight: 60, reps: 10 },
        ]},
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.volume.current).toBe(600);  // 60 × 10
    expect(result.volume.previous).toBe(480); // 60 × 8
  });

  it("respects user units preference", () => {
    mockStore({
      units: "lbs",
      measurementSystem: "imperial",
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: daysAgoISO(2), weight: 60, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = getProgressionSuggestion("Barbell Back Squat")!;
    expect(result.unit).toBe("lbs");
  });

  describe("equipment-based increments", () => {
    it("uses 2kg increment for dumbbell exercises", () => {
      mockStore({
        progressDB: {
          lifts: { "Dumbbell Row": [
            { date: daysAgoISO(5), weight: 20, reps: 12 },
            { date: daysAgoISO(2), weight: 20, reps: 12 },
          ]},
          sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
        },
      });
      const result = getProgressionSuggestion("Dumbbell Row")!;
      expect(result.increment).toBe(2);
      expect(result.suggestedWeight).toBe(22);
    });

    it("uses 2.5kg increment for machine exercises", () => {
      mockStore({
        progressDB: {
          lifts: { "Leg Press": [
            { date: daysAgoISO(5), weight: 100, reps: 12 },
            { date: daysAgoISO(2), weight: 100, reps: 12 },
          ]},
          sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
        },
      });
      const result = getProgressionSuggestion("Leg Press")!;
      expect(result.increment).toBe(2.5);
      expect(result.suggestedWeight).toBe(102.5);
    });
  });
});

// ── Backwards compatibility ──

describe("suggestNextWeight (backwards compat)", () => {
  it("returns null when no history", () => {
    mockStore();
    expect(suggestNextWeight("Barbell Back Squat")).toBeNull();
  });

  it("returns a weight string with units", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: daysAgoISO(2), weight: 60, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    const result = suggestNextWeight("Barbell Back Squat");
    expect(result).toMatch(/^\d+(\.\d+)?kg$/);
  });
});

describe("getLastSessionData", () => {
  it("returns null when no history", () => {
    mockStore();
    expect(getLastSessionData("Barbell Back Squat")).toBeNull();
  });

  it("returns the most recent entry", () => {
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [
          { date: "2026-01-01", weight: 60, reps: 8 },
          { date: "2026-01-04", weight: 62.5, reps: 7 },
        ]},
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    expect(getLastSessionData("Barbell Back Squat")).toEqual({
      date: "2026-01-04", weight: 62.5, reps: 7,
    });
  });
});

describe("isDetrained", () => {
  it("returns false when no history", () => {
    mockStore();
    expect(isDetrained("Barbell Back Squat")).toBe(false);
  });

  it("returns true when last session > 14 days ago", () => {
    const old = new Date();
    old.setDate(old.getDate() - 20);
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: old.toISOString(), weight: 60, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    expect(isDetrained("Barbell Back Squat")).toBe(true);
  });

  it("returns false when last session is recent", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    mockStore({
      progressDB: {
        lifts: { "Barbell Back Squat": [{ date: recent.toISOString(), weight: 60, reps: 8 }] },
        sessions: [], currentWeek: 1, weekFeedbackHistory: [], programStartDate: null, skippedSessions: [], phaseOffset: 0,
      },
    });
    expect(isDetrained("Barbell Back Squat")).toBe(false);
  });
});
