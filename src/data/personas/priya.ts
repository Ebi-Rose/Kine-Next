// Persona 3: Priya — "The On-and-Off User"
// Age 23 | Muscle building | Developing | Dumbbells + machines | 4 days | Knee injury | Irregular cycle
// Tests: incomplete weeks, gaps, mid-session skipping, irregular cycle, plateau detection

import { daysAgo, weeksAgo, makeSession, buildLifts, buildWeekHistory } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 1/4 sessions (ghosted after day 1)
  sessions.push(
    makeSession({
      title: "Upper Body", weekNum: 1, dayIdx: 0, date: daysAgo(34),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 8 }] },
        { name: "Lat Pulldown", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 8 }] },
        { name: "Dumbbell Shoulder Press", sets: [{ weight: 8, reps: 10 }, { weight: 8, reps: 8 }, { weight: 8, reps: 8 }] },
        { name: "Cable Curl", sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }, { weight: 10, reps: 10 }] },
      ],
    }),
  );

  // Week 1 continued (returned): 2 more sessions
  sessions.push(
    makeSession({
      title: "Lower Body", weekNum: 1, dayIdx: 1, date: daysAgo(28),
      effort: 3, soreness: 3,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
        { name: "Leg Curl", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
        { name: "Hip Thrust", sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Upper Body B", weekNum: 1, dayIdx: 2, date: daysAgo(26),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Dumbbell Row", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 8 }] },
        { name: "Machine Chest Press", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 8 }] },
        { name: "Lateral Raise", sets: [{ weight: 4, reps: 15 }, { weight: 4, reps: 12 }, { weight: 4, reps: 12 }] },
      ],
    }),
  );

  // Week 2: 2/4 sessions, knee flares up
  sessions.push(
    makeSession({
      title: "Upper Body", weekNum: 2, dayIdx: 0, date: daysAgo(19),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
        { name: "Lat Pulldown", sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 8 }, { weight: 32, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Lower Body", weekNum: 2, dayIdx: 1, date: daysAgo(17),
      effort: 3, soreness: 3,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
        { name: "Hip Thrust", sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 10 }] },
      ],
    }),
  );

  // Week 3 (after gap): 3/4 sessions, same weights (plateau)
  sessions.push(
    makeSession({
      title: "Upper Body", weekNum: 3, dayIdx: 0, date: daysAgo(7),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
        { name: "Lat Pulldown", sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 10 }, { weight: 32, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Lower Body", weekNum: 3, dayIdx: 1, date: daysAgo(5),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Leg Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 10 }] },
        { name: "Hip Thrust", sets: [{ weight: 42, reps: 12 }, { weight: 42, reps: 10 }, { weight: 42, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Upper Body B", weekNum: 3, dayIdx: 2, date: daysAgo(3),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Dumbbell Row", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
        { name: "Machine Chest Press", sets: [{ weight: 27, reps: 10 }, { weight: 27, reps: 8 }, { weight: 27, reps: 8 }] },
      ],
    }),
  );

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadPriya(store: any) {
  store.setGoal("muscle");
  store.setExp("developing");
  store.setEquip(["dumbbells", "machines"]);
  store.setDays("4");
  store.setTrainingDays([0, 1, 3, 4]);
  store.setDuration("long");
  store.setInjuries(["knees"]);
  store.setInjuryNotes("Intermittent knee pain — worse with lunges and deep squats.");
  store.setCycleType("irregular");
  store.setEduMode("full");
  store.setUnits("kg");
  store.setCycle({
    periodLog: [
      { date: daysAgo(25), type: "start" },
      { date: daysAgo(21), type: "end" },
    ],
    avgLength: null,
  });

  store.setPersonalProfile({
    name: "Priya",
    height: "160",
    weight: "55",
    trainingAge: "6 months",
    currentLifts: {},
  });

  const trainingDays = [0, 1, 3, 4];
  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 3, soreness: 2 },
      { weekNum: 2, effort: 3, soreness: 3, notes: "knee pain during lunges" },
      { weekNum: 3, effort: 3, soreness: 2 },
    ],
    programStartDate: weeksAgo(5),
    skippedSessions: [],
    phaseOffset: 0,
  });
  store.setWeekHistory(buildWeekHistory(sessions, 4, trainingDays));
}
