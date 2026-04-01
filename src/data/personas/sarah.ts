// Persona 1: Sarah — "The Beginner Who Sticks With It"
// Age 26 | General fitness | New | Dumbbells + bodyweight | 3 days | Regular cycle | Short sessions
// Tests: beginner onboarding, 0kg logging, edu mode full, period logging, deload

import { daysAgo, weeksAgo, makeSession, buildLifts } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 2/3 sessions, low/zero weights
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 1, dayIdx: 0, date: daysAgo(33),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Goblet Squat", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { name: "Dumbbell Floor Press", sets: [{ weight: 5, reps: 10 }, { weight: 5, reps: 8 }, { weight: 5, reps: 8 }] },
        { name: "Bodyweight Row", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 1, dayIdx: 4, date: daysAgo(29),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Bodyweight Squat", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }] },
        { name: "Push-Up", sets: [{ weight: 0, reps: 6 }, { weight: 0, reps: 5 }, { weight: 0, reps: 5 }] },
        { name: "Dumbbell Row", sets: [{ weight: 5, reps: 10 }, { weight: 5, reps: 10 }, { weight: 5, reps: 8 }] },
      ],
    }),
  );

  // Week 2: 3/3 sessions, starting to use weights
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 2, dayIdx: 0, date: daysAgo(26),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Goblet Squat", sets: [{ weight: 6, reps: 10 }, { weight: 6, reps: 10 }, { weight: 6, reps: 8 }] },
        { name: "Dumbbell Floor Press", sets: [{ weight: 6, reps: 10 }, { weight: 6, reps: 10 }, { weight: 6, reps: 8 }] },
        { name: "Bodyweight Row", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 2, dayIdx: 2, date: daysAgo(24),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Goblet Squat", sets: [{ weight: 6, reps: 10 }, { weight: 6, reps: 10 }, { weight: 6, reps: 10 }] },
        { name: "Push-Up", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] },
        { name: "Dumbbell Row", sets: [{ weight: 6, reps: 10 }, { weight: 6, reps: 10 }, { weight: 6, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body C", weekNum: 2, dayIdx: 4, date: daysAgo(22),
      effort: 3, soreness: 1,
      exercises: [
        { name: "Reverse Lunge", sets: [{ weight: 5, reps: 10 }, { weight: 5, reps: 10 }, { weight: 5, reps: 8 }] },
        { name: "Dumbbell Shoulder Press", sets: [{ weight: 4, reps: 10 }, { weight: 4, reps: 8 }, { weight: 4, reps: 8 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 12 }] },
      ],
    }),
  );

  // Week 3: 2/3 sessions, period logged mid-week
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 3, dayIdx: 0, date: daysAgo(19),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Goblet Squat", sets: [{ weight: 8, reps: 10 }, { weight: 8, reps: 10 }, { weight: 8, reps: 8 }] },
        { name: "Dumbbell Floor Press", sets: [{ weight: 8, reps: 8 }, { weight: 8, reps: 8 }, { weight: 8, reps: 7 }] },
        { name: "Dumbbell Row", sets: [{ weight: 8, reps: 10 }, { weight: 8, reps: 10 }, { weight: 8, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 3, dayIdx: 4, date: daysAgo(15),
      effort: 2, soreness: 3,
      exercises: [
        { name: "Bodyweight Squat", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 12 }] },
        { name: "Push-Up", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      ],
    }),
  );

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadSarah(store: any) {
  store.setGoal("general");
  store.setExp("new");
  store.setEquip(["dumbbells", "bodyweight"]);
  store.setDays("3");
  store.setTrainingDays([1, 3, 5]);
  store.setDuration("short");
  store.setInjuries([]);
  store.setInjuryNotes("");
  store.setCycleType("regular");
  store.setEduMode("full");
  store.setUnits("kg");
  store.setCycle({
    periodLog: [
      { date: daysAgo(17), type: "start" },
      { date: daysAgo(13), type: "end" },
    ],
    avgLength: 28,
  });

  store.setPersonalProfile({
    name: "Sarah",
    height: "164",
    weight: "58",
    trainingAge: "0",
    currentLifts: {},
  });

  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 2, soreness: 1 },
      { weekNum: 2, effort: 3, soreness: 2 },
      { weekNum: 3, effort: 3, soreness: 2 },
    ],
    programStartDate: weeksAgo(5),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
