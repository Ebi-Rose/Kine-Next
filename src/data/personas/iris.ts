// Persona 17: Iris — "Hypermobility / EDS, Returning Lifter"
// Age 31 | Strength | Developing | Barbell + dumbbells + machines | 3 days | Shoulder injury history | Hypermobility
// Tests: hypermobility condition, stabilityRequired comfort flag, deep-ROM caps, tempo/isometric bias, ballistic exclusion

import { daysAgo, weeksAgo, makeSession, buildLifts, buildWeekHistory } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 3/3 — controlled tempo, mid-range
  sessions.push(
    makeSession({
      title: "Lower A", weekNum: 1, dayIdx: 0, date: daysAgo(27),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Box Squat", sets: [{ weight: 40, reps: 8 }, { weight: 40, reps: 8 }, { weight: 40, reps: 8 }] },
        { name: "Romanian Deadlift", sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 8 }] },
        { name: "Leg Press", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Upper", weekNum: 1, dayIdx: 2, date: daysAgo(25),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 8 }] },
        { name: "Seated Cable Row", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
        { name: "Face Pulls", sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 15 }, { weight: 12, reps: 12 }] },
      ],
    }),
    makeSession({
      title: "Lower B", weekNum: 1, dayIdx: 4, date: daysAgo(23),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Front Squat", sets: [{ weight: 35, reps: 8 }, { weight: 35, reps: 8 }, { weight: 35, reps: 8 }] },
        { name: "Hip Thrust", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
      ],
    }),
  );

  // Week 2: 3/3 — small bumps, no joint pain
  sessions.push(
    makeSession({
      title: "Lower A", weekNum: 2, dayIdx: 0, date: daysAgo(20),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Box Squat", sets: [{ weight: 42.5, reps: 8 }, { weight: 42.5, reps: 8 }, { weight: 42.5, reps: 8 }] },
        { name: "Romanian Deadlift", sets: [{ weight: 42.5, reps: 10 }, { weight: 42.5, reps: 10 }, { weight: 42.5, reps: 10 }] },
        { name: "Leg Press", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Upper", weekNum: 2, dayIdx: 2, date: daysAgo(18),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
        { name: "Seated Cable Row", sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 10 }, { weight: 32, reps: 10 }] },
      ],
    }),
    makeSession({
      title: "Lower B", weekNum: 2, dayIdx: 4, date: daysAgo(16),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Front Squat", sets: [{ weight: 37.5, reps: 8 }, { weight: 37.5, reps: 8 }, { weight: 37.5, reps: 8 }] },
        { name: "Hip Thrust", sets: [{ weight: 55, reps: 10 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }] },
      ],
    }),
  );

  // Week 3: 3/3 — strength building, controlled
  sessions.push(
    makeSession({
      title: "Lower A", weekNum: 3, dayIdx: 0, date: daysAgo(13),
      effort: 3, soreness: 2,
      exercises: [
        { name: "Box Squat", sets: [{ weight: 45, reps: 6 }, { weight: 45, reps: 6 }, { weight: 45, reps: 6 }] },
        { name: "Romanian Deadlift", sets: [{ weight: 45, reps: 8 }, { weight: 45, reps: 8 }, { weight: 45, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Upper", weekNum: 3, dayIdx: 2, date: daysAgo(11),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Dumbbell Bench Press", sets: [{ weight: 14, reps: 8 }, { weight: 14, reps: 8 }, { weight: 14, reps: 8 }] },
        { name: "Seated Cable Row", sets: [{ weight: 35, reps: 8 }, { weight: 35, reps: 8 }, { weight: 35, reps: 8 }] },
      ],
    }),
    makeSession({
      title: "Lower B", weekNum: 3, dayIdx: 4, date: daysAgo(9),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Front Squat", sets: [{ weight: 40, reps: 6 }, { weight: 40, reps: 6 }, { weight: 40, reps: 6 }] },
        { name: "Hip Thrust", sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
      ],
    }),
  );

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadIris(store: any) {
  store.setGoal("strength");
  store.setExp("developing");
  store.setEquip(["barbell", "dumbbells", "machines", "bodyweight"]);
  store.setDays("3");
  store.setTrainingDays([1, 3, 5]);
  store.setDuration("medium");
  store.setInjuries(["shoulder"]);
  store.setInjuryNotes("History of shoulder subluxations (hEDS-related). No overhead pressing without controlled tempo.");
  store.setConditions(["hypermobility"]);
  store.setCycleType("regular");
  store.setEduMode("full");
  store.setUnits("kg");
  store.setRestConfig({ compound: 180, isolation: 90 });

  store.setPersonalProfile({
    name: "Iris",
    height: "170",
    weight: "63",
    trainingAge: "returning after 2 years",
    currentLifts: {},
  });

  const trainingDays = [1, 3, 5];
  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 2, soreness: 2, notes: "tempo cues helped a lot — no joint pain" },
      { weekNum: 2, effort: 2, soreness: 1, notes: "felt strong, controlled" },
      { weekNum: 3, effort: 3, soreness: 2, notes: "first real strength session, stayed mid-range" },
    ],
    programStartDate: weeksAgo(4),
    skippedSessions: [],
    phaseOffset: 0,
  });
  store.setWeekHistory(buildWeekHistory(sessions, 4, trainingDays));
}
