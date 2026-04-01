// Persona 2: Mia — "The Experienced Lifter, Short on Time"
// Age 31 | Strength | Intermediate | Full gym | Lower back injury | Hormonal contraception | Silent edu
// Tests: seeded lifts, injury-aware selection, silent edu, time budgets, PR tracking

import { daysAgo, weeksAgo, makeSession, buildLifts } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 4/5 sessions (skips day 5), heavy weights
  for (let day = 0; day < 4; day++) {
    const dayOffset = 27 - day * 2;
    sessions.push(
      makeSession({
        title: ["Upper Push", "Lower Squat", "Upper Pull", "Lower Hinge"][day],
        weekNum: 1, dayIdx: day, date: daysAgo(dayOffset),
        effort: day < 2 ? 3 : 4, soreness: 2,
        exercises: [
          [
            { name: "Barbell Bench Press", sets: Array(4).fill({ weight: 40, reps: 6 }) },
            { name: "Overhead Press", sets: Array(3).fill({ weight: 25, reps: 8 }) },
            { name: "Tricep Pushdown", sets: Array(3).fill({ weight: 15, reps: 12 }) },
          ],
          [
            { name: "Barbell Back Squat", sets: Array(4).fill({ weight: 70, reps: 5 }) },
            { name: "Leg Press", sets: Array(3).fill({ weight: 100, reps: 10 }) },
            { name: "Hip Thrust", sets: Array(3).fill({ weight: 60, reps: 10 }) },
          ],
          [
            { name: "Barbell Row", sets: Array(4).fill({ weight: 45, reps: 8 }) },
            { name: "Lat Pulldown", sets: Array(3).fill({ weight: 40, reps: 10 }) },
            { name: "Face Pulls", sets: Array(3).fill({ weight: 12, reps: 15 }) },
          ],
          [
            { name: "Romanian Deadlift", sets: Array(4).fill({ weight: 60, reps: 8 }) },
            { name: "Hip Thrust", sets: Array(3).fill({ weight: 65, reps: 10 }) },
            { name: "Leg Curl", sets: Array(3).fill({ weight: 30, reps: 12 }) },
          ],
        ][day],
      }),
    );
  }

  // Week 2: 5/5, Squat PR at 75kg
  for (let day = 0; day < 5; day++) {
    const dayOffset = 19 - day * 2;
    sessions.push(
      makeSession({
        title: ["Upper Push", "Lower Squat", "Upper Pull", "Lower Hinge", "Full Body"][day],
        weekNum: 2, dayIdx: day, date: daysAgo(dayOffset),
        effort: 4, soreness: 2,
        exercises: [
          [
            { name: "Barbell Bench Press", sets: Array(4).fill({ weight: 42.5, reps: 5 }) },
            { name: "Overhead Press", sets: Array(3).fill({ weight: 27.5, reps: 6 }) },
          ],
          [
            { name: "Barbell Back Squat", sets: [{ weight: 75, reps: 5 }, { weight: 75, reps: 5 }, { weight: 75, reps: 4 }, { weight: 75, reps: 4 }] },
            { name: "Leg Press", sets: Array(3).fill({ weight: 110, reps: 8 }) },
          ],
          [
            { name: "Seated Cable Row", sets: Array(4).fill({ weight: 45, reps: 10 }) },
            { name: "Lat Pulldown", sets: Array(3).fill({ weight: 42.5, reps: 10 }) },
          ],
          [
            { name: "Romanian Deadlift", sets: Array(3).fill({ weight: 65, reps: 8 }) },
            { name: "Hip Thrust", sets: Array(3).fill({ weight: 70, reps: 8 }) },
          ],
          [
            { name: "Barbell Back Squat", sets: Array(3).fill({ weight: 60, reps: 8 }) },
            { name: "Barbell Bench Press", sets: Array(3).fill({ weight: 35, reps: 10 }) },
          ],
        ][day],
      }),
    );
  }

  // Week 3: 3/5 (travel week)
  for (let day = 0; day < 3; day++) {
    const dayOffset = 12 - day * 2;
    sessions.push(
      makeSession({
        title: ["Upper Push", "Lower Squat", "Upper Pull"][day],
        weekNum: 3, dayIdx: day, date: daysAgo(dayOffset),
        effort: 3, soreness: 2,
        exercises: [
          [
            { name: "Barbell Bench Press", sets: Array(4).fill({ weight: 42.5, reps: 6 }) },
            { name: "Overhead Press", sets: Array(3).fill({ weight: 27.5, reps: 8 }) },
          ],
          [
            { name: "Barbell Back Squat", sets: Array(4).fill({ weight: 72.5, reps: 6 }) },
            { name: "Hip Thrust", sets: Array(3).fill({ weight: 70, reps: 10 }) },
          ],
          [
            { name: "Seated Cable Row", sets: Array(4).fill({ weight: 47.5, reps: 8 }) },
            { name: "Lat Pulldown", sets: Array(3).fill({ weight: 42.5, reps: 10 }) },
          ],
        ][day],
      }),
    );
  }

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadMia(store: any) {
  store.setGoal("strength");
  store.setExp("intermediate");
  store.setEquip(["barbell", "dumbbells", "machines"]);
  store.setDays("5");
  store.setTrainingDays([0, 1, 2, 3, 4]);
  store.setDuration("medium");
  store.setInjuries(["lower_back"]);
  store.setInjuryNotes("Mild ongoing lower back tightness — avoid heavy good mornings and conventional deadlifts from the floor.");
  store.setCycleType("hormonal");
  store.setEduMode("silent");
  store.setUnits("kg");

  store.setPersonalProfile({
    name: "Mia",
    height: "170",
    weight: "66",
    trainingAge: "4 years",
    currentLifts: {
      "Barbell Back Squat": 75,
      "Barbell Bench Press": 42.5,
      "Romanian Deadlift": 65,
      "Overhead Press": 27.5,
      "Hip Thrust": 70,
    },
  });

  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 4, soreness: 2 },
      { weekNum: 2, effort: 4, soreness: 2 },
      { weekNum: 3, effort: 3, soreness: 2 },
    ],
    programStartDate: weeksAgo(4),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
