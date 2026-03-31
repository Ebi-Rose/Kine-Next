jest.mock("@/store/useKineStore", () => ({
  useKineStore: {
    getState: jest.fn(),
  },
}));

import { useKineStore } from "@/store/useKineStore";
import { detectPRs } from "@/app/app/session/detect-prs";
import type { ExerciseLog } from "@/app/app/session/types";

const mockGetState = useKineStore.getState as jest.Mock;

function mockStore(lifts: Record<string, { date: string; weight: number; reps: number }[]>) {
  mockGetState.mockReturnValue({
    progressDB: { lifts },
  });
}

function makeLog(
  name: string,
  actual: { weight: string; reps: string }[],
  saved = true
): ExerciseLog {
  return {
    name,
    planned: { sets: "3", reps: "10" },
    actual: actual.map((a) => ({ ...a })),
    note: "",
    saved,
  };
}

beforeEach(() => jest.clearAllMocks());

describe("detectPRs", () => {
  it("detects a weight PR", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 80, reps: 8 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [
        { weight: "90", reps: "8" },
      ]),
    };
    const prs = detectPRs(logs);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toEqual({ name: "Hip Thrust", weight: 90, reps: 8 });
  });

  it("detects a reps PR at same weight", () => {
    mockStore({
      "Barbell Back Squat": [{ date: "2025-03-01", weight: 60, reps: 6 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Barbell Back Squat", [
        { weight: "60", reps: "10" },
      ]),
    };
    const prs = detectPRs(logs);
    expect(prs).toHaveLength(1);
    expect(prs[0].reps).toBe(10);
  });

  it("does not flag PR when no history exists", () => {
    mockStore({});
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [{ weight: "60", reps: "8" }]),
    };
    const prs = detectPRs(logs);
    expect(prs).toHaveLength(0);
  });

  it("does not flag PR when not exceeding previous best", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 100, reps: 10 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [{ weight: "80", reps: "8" }]),
    };
    expect(detectPRs(logs)).toHaveLength(0);
  });

  it("ignores unsaved exercises", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 50, reps: 8 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [{ weight: "100", reps: "10" }], false),
    };
    expect(detectPRs(logs)).toHaveLength(0);
  });

  it("ignores exercises with no actual sets", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 50, reps: 8 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", []),
    };
    expect(detectPRs(logs)).toHaveLength(0);
  });

  it("ignores zero-weight sets", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 50, reps: 8 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [{ weight: "0", reps: "10" }]),
    };
    expect(detectPRs(logs)).toHaveLength(0);
  });

  it("picks the best set from multiple sets", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 60, reps: 8 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [
        { weight: "50", reps: "10" },
        { weight: "70", reps: "6" },
        { weight: "65", reps: "8" },
      ]),
    };
    const prs = detectPRs(logs);
    expect(prs).toHaveLength(1);
    expect(prs[0].weight).toBe(70);
  });

  it("detects PRs across multiple exercises", () => {
    mockStore({
      "Hip Thrust": [{ date: "2025-03-01", weight: 60, reps: 8 }],
      "Barbell Back Squat": [{ date: "2025-03-01", weight: 50, reps: 5 }],
    });
    const logs: Record<number, ExerciseLog> = {
      0: makeLog("Hip Thrust", [{ weight: "70", reps: "8" }]),
      1: makeLog("Barbell Back Squat", [{ weight: "55", reps: "5" }]),
    };
    expect(detectPRs(logs)).toHaveLength(2);
  });
});
