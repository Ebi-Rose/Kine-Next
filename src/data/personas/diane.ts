// Persona 6: Diane — "The Older Athlete Rebuilding"
// Age 52 | General fitness | Developing (returning) | All equipment | 3 days | 3 injuries | N/A cycle | Conditions
// Tests: heavy injury constraints, conditions (pelvic floor + endo), comfort flags, conservative progression

import { daysAgo, weeksAgo, makeSession, buildLifts } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 2/3 sessions — careful, low weights
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 1, dayIdx: 0, date: daysAgo(27),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 8 }] },
        { name: "Dumbbell Bench Press", sets: [{ weight: 8, reps: 10 }, { weight: 8, reps: 10 }, { weight: 8, reps: 8 }] },
        { name: "Seated Cable Row", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 8 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 12 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 1, dayIdx: 4, date: daysAgo(23),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 }] },
        { name: "Lat Pulldown", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 8 }] },
        { name: "Machine Chest Press", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
      ],
    }),
  );

  // Week 2: 3/3 — first complete week, conservative weights
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 2, dayIdx: 0, date: daysAgo(20),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 10 }] },
        { name: "Dumbbell Bench Press", sets: [{ weight: 10, reps: 10 }, { weight: 10, reps: 8 }, { weight: 10, reps: 8 }] },
        { name: "Seated Cable Row", sets: [{ weight: 27, reps: 10 }, { weight: 27, reps: 10 }, { weight: 27, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 2, dayIdx: 2, date: daysAgo(18),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Hip Thrust", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 10 }] },
        { name: "Lat Pulldown", sets: [{ weight: 27, reps: 10 }, { weight: 27, reps: 10 }, { weight: 27, reps: 10 }] },
        { name: "Dumbbell Row", sets: [{ weight: 10, reps: 10 }, { weight: 10, reps: 10 }, { weight: 10, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Full Body C", weekNum: 2, dayIdx: 4, date: daysAgo(16),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 10 }, { weight: 45, reps: 10 }] },
        { name: "Machine Chest Press", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }, { weight: 22, reps: 8 }] },
        { name: "Face Pulls", sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 15 }, { weight: 10, reps: 12 }] },
      ],
    }),
  );

  // Week 3: 3/3 — small weight bumps, knee sore on one session
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 3, dayIdx: 0, date: daysAgo(13),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 8 }] },
        { name: "Dumbbell Bench Press", sets: [{ weight: 10, reps: 10 }, { weight: 10, reps: 10 }, { weight: 10, reps: 10 }] },
        { name: "Seated Cable Row", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 3, dayIdx: 2, date: daysAgo(11),
      effort: 3, soreness: 3,
      exercises: [
        { name: "Hip Thrust", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
        { name: "Lat Pulldown", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 8 }, { weight: 30, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body C", weekNum: 3, dayIdx: 4, date: daysAgo(9),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
        { name: "Machine Chest Press", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 8 }, { weight: 25, reps: 8 }] },
        { name: "Face Pulls", sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 12 }, { weight: 12, reps: 12 }] },
      ],
    }),
  );

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadDiane(store: any) {
  store.setGoal("general");
  store.setExp("developing");
  store.setEquip(["barbell", "dumbbells", "kettlebell", "machines", "bands", "bodyweight"]);
  store.setDays("3");
  store.setTrainingDays([1, 3, 5]);
  store.setDuration("medium");
  store.setInjuries(["knees", "shoulder", "hip"]);
  store.setInjuryNotes("Knee replacement (right) 18 months ago. Shoulder impingement left side — no overhead pressing. Hip arthritis — limited deep flexion.");
  store.setConditions(["endometriosis", "pelvic_floor"]);
  store.setCycleType("na");
  store.setEduMode("full");
  store.setUnits("kg");
  store.setRestConfig({ compound: 150, isolation: 90 });

  store.setPersonalProfile({
    name: "Diane",
    height: "166",
    weight: "74",
    trainingAge: "returning after 15 years",
    currentLifts: {},
  });

  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 2, soreness: 2 },
      { weekNum: 2, effort: 2, soreness: 1, notes: "no joint pain this week" },
      { weekNum: 3, effort: 2, soreness: 2, notes: "left knee sore on step-ups, stopping those" },
    ],
    programStartDate: weeksAgo(4),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
