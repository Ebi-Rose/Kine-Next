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
    it("removes duplicate exercises within a session", () => {
      const week = makeWeek();
      week.days[0].exercises.push({ name: "Barbell Back Squat", sets: "3", reps: "5", rest: "120s" });
      const result = validateWeek(week, fullEquip, [], "developing", 4);
      const squatCount = result.weekData.days[0].exercises.filter(e => e.name === "Barbell Back Squat").length;
      expect(squatCount).toBe(1);
      expect(result.issues.some(i => i.type === "duplicate_exercise")).toBe(true);
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
