// Persona 4: Aisha — "The Power User"
// Age 28 | Strength | Intermediate | All equipment | 5 days | Shoulder (recovered) | Regular cycle
// Tests: high-frequency, precise weights, custom rest, PR tracking, peak phase, no edu engagement

import { daysAgo, weeksAgo, makeSession, buildLifts } from "./helpers";

function buildSessions() {
  const sessions = [];

  // 4 weeks x 5 sessions, progressive overload, precise 2.5kg increments
  const templates = [
    { title: "Squat & Quads", exercises: (w: number) => [
      { name: "Barbell Back Squat", sets: Array(5).fill({ weight: 85 + w * 2.5, reps: 5 }) },
      { name: "Leg Press", sets: Array(3).fill({ weight: 120 + w * 5, reps: 8 }) },
      { name: "Bulgarian Split Squat", sets: Array(3).fill({ weight: 16 + w * 2, reps: 10 }) },
    ]},
    { title: "Bench & Press", exercises: (w: number) => [
      { name: "Barbell Bench Press", sets: Array(5).fill({ weight: 47.5 + w * 1.25, reps: 5 }) },
      { name: "Dumbbell Incline Press", sets: Array(3).fill({ weight: 18 + w * 1, reps: 8 }) },
      { name: "Lateral Raise", sets: Array(3).fill({ weight: 8 + w * 0.5, reps: 15 }) },
    ]},
    { title: "Deadlift & Posterior", exercises: (w: number) => [
      { name: "Barbell Deadlift", sets: Array(4).fill({ weight: 95 + w * 2.5, reps: 5 }) },
      { name: "Romanian Deadlift", sets: Array(3).fill({ weight: 70 + w * 2.5, reps: 8 }) },
      { name: "Hip Thrust", sets: Array(3).fill({ weight: 80 + w * 2.5, reps: 8 }) },
    ]},
    { title: "Upper Pull", exercises: (w: number) => [
      { name: "Barbell Row", sets: Array(4).fill({ weight: 55 + w * 2.5, reps: 6 }) },
      { name: "Lat Pulldown", sets: Array(3).fill({ weight: 50 + w * 2.5, reps: 8 }) },
      { name: "Face Pulls", sets: Array(3).fill({ weight: 15 + w * 1, reps: 15 }) },
    ]},
    { title: "Full Body Volume", exercises: (w: number) => [
      { name: "Barbell Back Squat", sets: Array(3).fill({ weight: 70 + w * 2.5, reps: 8 }) },
      { name: "Overhead Press", sets: Array(3).fill({ weight: 30 + w * 1.25, reps: 8 }) },
      { name: "Barbell Row", sets: Array(3).fill({ weight: 45 + w * 2.5, reps: 10 }) },
    ]},
  ];

  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 5; day++) {
      // Skip 1 session in week 4 (deload, intentional rest)
      if (week === 3 && day === 4) continue;
      const dayOffset = (4 - week) * 7 - day;
      sessions.push(
        makeSession({
          title: templates[day].title,
          weekNum: week + 1,
          dayIdx: day,
          date: daysAgo(dayOffset),
          effort: week < 3 ? 4 : 2,
          soreness: week < 3 ? 2 : 1,
          exercises: templates[day].exercises(week),
        }),
      );
    }
  }

  return sessions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadAisha(store: any) {
  store.setGoal("strength");
  store.setExp("intermediate");
  store.setEquip(["barbell", "dumbbells", "kettlebell", "machines", "bands", "bodyweight"]);
  store.setDays("5");
  store.setTrainingDays([0, 1, 2, 3, 4]);
  store.setDuration("extended");
  store.setInjuries(["shoulder"]);
  store.setInjuryNotes("Right shoulder — recovered from impingement, cautious with overhead pressing behind the neck.");
  store.setCycleType("regular");
  store.setEduMode("silent");
  store.setUnits("kg");
  store.setRestConfig({ compound: 180, isolation: 90 });
  store.setCycle({
    periodLog: [
      { date: daysAgo(10), type: "start" },
      { date: daysAgo(6), type: "end" },
    ],
    avgLength: 30,
  });

  store.setPersonalProfile({
    name: "Aisha",
    height: "172",
    weight: "70",
    trainingAge: "5 years",
    currentLifts: {
      "Barbell Back Squat": 92.5,
      "Barbell Bench Press": 52.5,
      "Barbell Deadlift": 105,
      "Overhead Press": 35,
      "Romanian Deadlift": 77.5,
    },
  });

  const sessions = buildSessions();
  store.setProgressDB({
    sessions,
    lifts: buildLifts(sessions),
    currentWeek: 5,
    weekFeedbackHistory: [
      { weekNum: 1, effort: 4, soreness: 2 },
      { weekNum: 2, effort: 4, soreness: 2 },
      { weekNum: 3, effort: 4, soreness: 3, notes: "felt strong all week" },
      { weekNum: 4, effort: 2, soreness: 1, notes: "recovery week, feeling fresh" },
    ],
    programStartDate: weeksAgo(5),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
