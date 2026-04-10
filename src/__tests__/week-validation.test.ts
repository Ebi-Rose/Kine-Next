import { validateWeek } from "@/lib/week-validation";
import type { WeekData } from "@/lib/week-builder";

function makeWeek(overrides?: Partial<WeekData>): WeekData {
  return {
    programName: "Test Programme",
    weekCoachNote: "Test note",
    days: [
      { dayNumber: 1, isRest: false, sessionTitle: "Lower", sessionDuration: "45min", coachNote: "", exercises: [
        { name: "Barbell Back Squat", sets: "3", reps: "8", rest: "90s" },
        { name: "Romanian Deadlift", sets: "3", reps: "10", rest: "90s" },
        { name: "Leg Press", sets: "3", reps: "12", rest: "60s" },
        { name: "Leg Curl", sets: "3", reps: "12", rest: "60s" },
      ]},
      { dayNumber: 2, isRest: true, sessionTitle: "Rest", sessionDuration: "", coachNote: "", exercises: [] },
      { dayNumber: 3, isRest: false, sessionTitle: "Upper", sessionDuration: "45min", coachNote: "", exercises: [
        { name: "Barbell Bench Press", sets: "3", reps: "8", rest: "90s" },
        { name: "Barbell Row", sets: "3", reps: "10", rest: "90s" },
        { name: "Overhead Press", sets: "3", reps: "10", rest: "60s" },
        { name: "Face Pulls", sets: "3", reps: "15", rest: "60s" },
      ]},
      { dayNumber: 4, isRest: true, sessionTitle: "Rest", sessionDuration: "", coachNote: "", exercises: [] },
      { dayNumber: 5, isRest: false, sessionTitle: "Full Body", sessionDuration: "45min", coachNote: "", exercises: [
        { name: "Hip Thrust", sets: "3", reps: "10", rest: "90s" },
        { name: "Dumbbell Row", sets: "3", reps: "10", rest: "60s" },
        { name: "Goblet Squat", sets: "3", reps: "12", rest: "60s" },
        { name: "Lat Pulldown", sets: "3", reps: "12", rest: "60s" },
      ]},
      { dayNumber: 6, isRest: true, sessionTitle: "Rest", sessionDuration: "", coachNote: "", exercises: [] },
      { dayNumber: 7, isRest: true, sessionTitle: "Rest", sessionDuration: "", coachNote: "", exercises: [] },
    ],
    ...overrides,
  };
}

describe("validateWeek", () => {
  const fullEquip = ["barbell", "dumbbells", "machines", "bodyweight", "cables"];

  describe("valid week", () => {
    it("passes cleanly with no issues", () => {
      const result = validateWeek(makeWeek(), fullEquip, [], "developing", 4);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("exercise name validation", () => {
    it("fixes case-insensitive mismatches silently", () => {
      const week = makeWeek();
      week.days[0].exercises[0].name = "barbell back squat";
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.weekData.days[0].exercises[0].name).toBe("Barbell Back Squat");
      expect(result.issues.filter(i => i.exercise === "barbell back squat")).toHaveLength(0);
    });

    it("fuzzy-matches common AI aliases", () => {
      const week = makeWeek();
      week.days[0].exercises[0].name = "back squat";
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.weekData.days[0].exercises[0].name).toBe("Barbell Back Squat");
      expect(result.issues.some(i => i.type === "unknown_exercise" && i.repaired)).toBe(true);
    });

    it("fuzzy-matches abbreviations like RDL", () => {
      const week = makeWeek();
      week.days[0].exercises[1].name = "rdl";
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.weekData.days[0].exercises[1].name).toBe("Romanian Deadlift");
    });

    it("removes completely unknown exercises", () => {
      const week = makeWeek();
      week.days[0].exercises.push({ name: "Quantum Flux Curl", sets: "3", reps: "10", rest: "60s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.weekData.days[0].exercises.map(e => e.name)).not.toContain("Quantum Flux Curl");
      expect(result.issues.some(i => i.type === "unknown_exercise" && i.exercise === "Quantum Flux Curl")).toBe(true);
    });
  });

  describe("equipment validation", () => {
    it("swaps barbell exercises when user only has dumbbells", () => {
      const result = validateWeek(makeWeek(), ["dumbbells", "bodyweight"], [], "developing", 4);
      const day1Names = result.weekData.days[0].exercises.map(e => e.name);
      expect(day1Names).not.toContain("Barbell Back Squat");
      expect(result.issues.some(i => i.type === "equipment_mismatch")).toBe(true);
    });

    it("removes exercise if no compatible alternative exists", () => {
      const week = makeWeek();
      week.days[0].exercises = [{ name: "Hip Abduction Machine", sets: "3", reps: "15", rest: "60s" }];
      const result = validateWeek(week, ["barbell"], [], "developing", 1);
      expect(result.issues.filter(i => i.type === "equipment_mismatch").length).toBeGreaterThan(0);
    });
  });

  describe("injury validation", () => {
    it("swaps knee-conflicting exercises", () => {
      const result = validateWeek(makeWeek(), fullEquip, ["knees"], "developing", 4);
      const day1Names = result.weekData.days[0].exercises.map(e => e.name);
      expect(day1Names).not.toContain("Barbell Back Squat");
      expect(result.issues.some(i => i.type === "injury_conflict")).toBe(true);
    });

    it("skips when no injuries", () => {
      const result = validateWeek(makeWeek(), fullEquip, [], "developing", 4);
      expect(result.issues.filter(i => i.type === "injury_conflict")).toHaveLength(0);
    });
  });

  describe("duplicate detection", () => {
    it("removes exact duplicate exercises within a session", () => {
      const week = makeWeek();
      week.days[0].exercises.push({ name: "Barbell Back Squat", sets: "3", reps: "5", rest: "120s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      const squatCount = result.weekData.days[0].exercises.filter(e => e.name === "Barbell Back Squat").length;
      expect(squatCount).toBe(1);
      expect(result.issues.some(i => i.type === "duplicate_exercise")).toBe(true);
    });

    it("flags near-duplicate exercises as droppable", () => {
      const week = makeWeek();
      // Add a near-duplicate of "Leg Curl" (same movement key)
      week.days[0].exercises.push({ name: "Seated Leg Curl", sets: "3", reps: "12", rest: "60s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      const seated = result.weekData.days[0].exercises.find(e => e.name === "Seated Leg Curl");
      expect(seated).toBeDefined();
      expect(seated!.droppable).toBe(true);
      // Original "Leg Curl" should not be droppable
      const original = result.weekData.days[0].exercises.find(e => e.name === "Leg Curl");
      expect(original!.droppable).toBeUndefined();
    });
  });

  describe("exercise count", () => {
    it("tolerates +-1 difference", () => {
      const result = validateWeek(makeWeek(), fullEquip, [], "developing", 5);
      expect(result.issues.filter(i => i.type === "exercise_count")).toHaveLength(0);
    });

    it("flags when off by more than 1", () => {
      const result = validateWeek(makeWeek(), fullEquip, [], "developing", 8);
      expect(result.issues.some(i => i.type === "exercise_count")).toBe(true);
    });
  });

  describe("structural validation", () => {
    it("flags wrong number of days", () => {
      const week = makeWeek();
      week.days = week.days.slice(0, 5);
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.issues.some(i => i.type === "structural" && i.detail.includes("Expected 7 days"))).toBe(true);
    });

    it("flags bad day numbers", () => {
      const week = makeWeek();
      week.days[6].dayNumber = 9;
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.issues.some(i => i.type === "structural" && i.detail.includes("Day numbers"))).toBe(true);
    });

    it("flags training day with no exercises", () => {
      const week = makeWeek();
      week.days[0].exercises = [];
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.issues.some(i => i.detail === "Training day has no exercises")).toBe(true);
    });

    it("clears exercises from rest days", () => {
      const week = makeWeek();
      week.days[1].exercises = [{ name: "Barbell Back Squat", sets: "3", reps: "8", rest: "90s" }];
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      expect(result.weekData.days[1].exercises).toHaveLength(0);
      expect(result.issues.some(i => i.detail.includes("Rest day has exercises"))).toBe(true);
    });

    it("flags missing programName", () => {
      const result = validateWeek(makeWeek({ programName: "" }), fullEquip, [], "developing", 4);
      expect(result.issues.some(i => i.detail === "Missing programName")).toBe(true);
    });
  });

  describe("volume-aware droppable flagging", () => {
    it("does not flag exercises under the FWS budget", () => {
      // Default makeWeek has each movement key only once — well under budget
      const result = validateWeek(makeWeek(), fullEquip, [], "developing", 4);
      const droppable = result.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable));
      expect(droppable).toHaveLength(0);
    });

    it("flags excess volume when a movement key exceeds budget", () => {
      const week = makeWeek();
      // Add heavy leg curls across all 3 training days to push "leg curl" key over budget
      // Leg Curl already on day 1. Add more on day 3 and day 5 with high sets.
      week.days[2].exercises.push({ name: "Lying Leg Curl", sets: "4", reps: "12", rest: "60s" });
      week.days[4].exercises.push({ name: "Seated Leg Curl", sets: "4", reps: "12", rest: "60s" });
      week.days[4].exercises.push({ name: "Nordic Curl", sets: "4", reps: "8", rest: "90s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      // At least one of the later leg curl variants should be droppable
      const droppableCurls = result.weekData.days.flatMap(d =>
        d.exercises.filter(e => e.droppable && e.name.toLowerCase().includes("curl"))
      );
      expect(droppableCurls.length).toBeGreaterThan(0);
      expect(droppableCurls[0].droppableReason).toBeDefined();
    });

    it("tightens thresholds under poor recovery", () => {
      const week = makeWeek();
      // Add moderate volume that would be fine at normal but not at poor
      week.days[2].exercises.push({ name: "Lying Leg Curl", sets: "4", reps: "12", rest: "60s" });
      week.days[4].exercises.push({ name: "Seated Leg Curl", sets: "4", reps: "12", rest: "60s" });

      const normalResult = validateWeek(week, fullEquip, [], "developing", 4, null);
      const poorResult = validateWeek(week, fullEquip, [], "developing", 4, { effort: 1, soreness: 4 });

      const normalDroppable = normalResult.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable));
      const poorDroppable = poorResult.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable));

      // Poor recovery should flag at least as many (likely more) as normal
      expect(poorDroppable.length).toBeGreaterThanOrEqual(normalDroppable.length);
    });

    it("uses recovery-aware copy in droppableReason", () => {
      const week = makeWeek();
      week.days[2].exercises.push({ name: "Lying Leg Curl", sets: "4", reps: "12", rest: "60s" });
      week.days[4].exercises.push({ name: "Seated Leg Curl", sets: "4", reps: "12", rest: "60s" });
      week.days[4].exercises.push({ name: "Nordic Curl", sets: "4", reps: "8", rest: "90s" });

      const result = validateWeek(week, fullEquip, [], "developing", 4, { effort: 1, soreness: 4 });
      const droppable = result.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable && e.droppableReason));
      const volumeDroppable = droppable.filter(e => e.droppableReason!.includes("Recovery is low"));
      expect(volumeDroppable.length).toBeGreaterThan(0);
    });

    it("protects first exercise of session from volume flagging", () => {
      const week = makeWeek();
      // Add lots of hinge volume across days as accessories (not first position).
      // Romanian Deadlift is already exercise[1] on day 1.
      week.days[2].exercises.push({ name: "Stiff Leg Deadlift", sets: "4", reps: "10", rest: "90s" });
      week.days[4].exercises.push({ name: "Good Morning", sets: "4", reps: "10", rest: "90s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4, { effort: 1, soreness: 4 });
      // Day 1's Romanian Deadlift is at position [1] (not primary) so it might be flagged,
      // but the first exercise on each day should never be flagged by volume thresholds.
      for (const day of result.weekData.days) {
        if (day.isRest || day.exercises.length === 0) continue;
        // Volume threshold doesn't flag position 0 (primary compound)
        const firstEx = day.exercises[0];
        const volumeFlagged = firstEx.droppable && firstEx.droppableReason?.includes("volume");
        expect(volumeFlagged).toBeFalsy();
      }
    });

    it("treats no feedback as normal tier", () => {
      const week = makeWeek();
      const resultNull = validateWeek(week, fullEquip, [], "developing", 4, null);
      const resultUndefined = validateWeek(week, fullEquip, [], "developing", 4);
      // Both should produce the same droppable count
      const nullDroppable = resultNull.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable));
      const undefDroppable = resultUndefined.weekData.days.flatMap(d => d.exercises.filter(e => e.droppable));
      expect(nullDroppable.length).toBe(undefDroppable.length);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input week", () => {
      const week = makeWeek();
      week.days[0].exercises.push({ name: "Quantum Flux Curl", sets: "3", reps: "10", rest: "60s" });
      const originalCount = week.days[0].exercises.length;
      validateWeek(week, fullEquip, [], "developing", 4);
      expect(week.days[0].exercises.length).toBe(originalCount);
    });
  });
});
