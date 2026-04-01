// Persona 5: Emma — "The Cautious Returner"
// Age 35 | General fitness | New (was active years ago) | Bodyweight only | 2 days | Hip + lower back | No cycle tracking
// Tests: multiple injuries, bodyweight-only programming, minimal frequency, N/A cycle, short sessions

import { daysAgo, weeksAgo, makeSession, buildLifts } from "./helpers";

function buildSessions() {
  const sessions = [];

  // Week 1: 1/2 sessions — careful first session
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 1, dayIdx: 0, date: daysAgo(20),
      effort: 2, soreness: 2,
      exercises: [
        { name: "Bodyweight Squat", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { name: "Wall Push-Up", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        { name: "Bird Dog", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      ],
    }),
  );

  // Week 2: 2/2 — first complete week
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 2, dayIdx: 0, date: daysAgo(13),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Bodyweight Squat", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }] },
        { name: "Wall Push-Up", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 12 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 2, dayIdx: 3, date: daysAgo(10),
      effort: 2, soreness: 1,
      exercises: [
        { name: "Chair Step-Up", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
        { name: "Dead Bug", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { name: "Calf Raise", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      ],
    }),
  );

  // Week 3: 2/2 — consistent, slightly more confident
  sessions.push(
    makeSession({
      title: "Full Body A", weekNum: 3, dayIdx: 0, date: daysAgo(6),
      effort: 3, soreness: 1,
      exercises: [
        { name: "Bodyweight Squat", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        { name: "Push-Up", sets: [{ weight: 0, reps: 5 }, { weight: 0, reps: 4 }, { weight: 0, reps: 4 }] },
        { name: "Glute Bridge", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      ],
    }),
    makeSession({
      title: "Full Body B", weekNum: 3, dayIdx: 3, date: daysAgo(3),
      effort: 3, soreness: 1,
      exercises: [
        { name: "Chair Step-Up", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { name: "Bird Dog", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
        { name: "Calf Raise", sets: [{ weight: 0, reps: 20 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      ],
    }),
  );

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadEmma(store: any) {
  store.setGoal("general");
  store.setExp("new");
  store.setEquip(["bodyweight"]);
  store.setDays("2");
  store.setTrainingDays([1, 4]);
  store.setDuration("short");
  store.setInjuries(["hip", "lower_back"]);
  store.setInjuryNotes("Hip replacement 2 years ago — cleared for exercise but cautious. Lower back stiffness, especially mornings.");
  store.setCycleType("na");
  store.setEduMode("full");
  store.setUnits("kg");

  store.setPersonalProfile({
    name: "Emma",
    height: "175",
    weight: "72",
    trainingAge: "0",
    currentLifts: {},
  });

  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 4,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 2, soreness: 2 },
      { weekNum: 2, effort: 2, soreness: 1, notes: "no pain, felt manageable" },
      { weekNum: 3, effort: 3, soreness: 1, notes: "feeling more confident" },
    ],
    programStartDate: weeksAgo(3),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
