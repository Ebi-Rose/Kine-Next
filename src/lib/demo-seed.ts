import type { LiftEntry, WeekFeedback } from "@/store/useKineStore";

/** Generate a date string N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Build 5 weeks of fake completed sessions with progressive overload */
function buildSessions() {
  const exercises = [
    { name: "Barbell Back Squat", startWeight: 40 },
    { name: "Romanian Deadlift", startWeight: 35 },
    { name: "Barbell Bench Press", startWeight: 25 },
    { name: "Barbell Row", startWeight: 30 },
    { name: "Hip Thrust", startWeight: 45 },
    { name: "Overhead Press", startWeight: 15 },
    { name: "Bulgarian Split Squat", startWeight: 10 },
    { name: "Face Pulls", startWeight: 8 },
    { name: "Lat Pulldown", startWeight: 30 },
    { name: "Leg Press", startWeight: 60 },
  ];

  const sessions: unknown[] = [];
  const lifts: Record<string, LiftEntry[]> = {};

  // 5 weeks × 3 sessions per week = 15 sessions
  for (let week = 1; week <= 5; week++) {
    for (let session = 0; session < 3; session++) {
      const dayOffset = (5 - week) * 7 + (session * 2 + 1);
      const date = daysAgo(dayOffset);

      // Pick 5 exercises per session
      const sessionExercises = exercises.slice(
        (session * 3) % exercises.length,
        ((session * 3) % exercises.length) + 5
      );

      const exerciseLogs: Record<string, { sets: { reps: number; weight: number }[] }> = {};

      for (const ex of sessionExercises) {
        // Progressive overload: +2.5kg per week
        const weight = ex.startWeight + (week - 1) * 2.5;
        const sets = [
          { reps: 10, weight },
          { reps: 9, weight },
          { reps: 8, weight },
        ];

        exerciseLogs[ex.name] = { sets };

        // Track in lifts history
        if (!lifts[ex.name]) lifts[ex.name] = [];
        lifts[ex.name].push({ date, weight, reps: 10 });
      }

      sessions.push({
        date,
        weekNum: week,
        dayIdx: session,
        exercises: exerciseLogs,
        effort: 3 + Math.floor(Math.random() * 2), // 3-4
        soreness: 2 + Math.floor(Math.random() * 2), // 2-3
        duration: 45 + Math.floor(Math.random() * 15), // 45-60 min
      });
    }
  }

  return { sessions, lifts };
}

function buildWeekFeedback(): WeekFeedback[] {
  return [1, 2, 3, 4, 5].map((weekNum) => ({
    weekNum,
    effort: 3 + Math.floor(Math.random() * 2),
    soreness: 2 + Math.floor(Math.random() * 2),
    notes: weekNum === 3 ? "Felt strong this week" : undefined,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function seedDemoStore(store: any) {
  const { sessions, lifts } = buildSessions();

  store.setGoal("muscle");
  store.setExp("developing");
  store.setEquip(["barbell", "dumbbells", "machines"]);
  store.setDays("3");
  store.setTrainingDays([0, 2, 4]); // Mon, Wed, Fri
  store.setDuration("medium");
  store.setCycleType("regular");
  store.setEduMode("full");

  store.setPersonalProfile({
    name: "Demo User",
    height: "165",
    weight: "62",
    trainingAge: "1-2 years",
    currentLifts: {
      "Barbell Back Squat": 50,
      "Romanian Deadlift": 47.5,
      "Barbell Bench Press": 35,
      "Barbell Row": 40,
      "Hip Thrust": 57.5,
    },
  });

  store.setProgressDB({
    sessions,
    lifts,
    currentWeek: 6,
    weekFeedbackHistory: buildWeekFeedback(),
    programStartDate: daysAgo(35),
    skippedSessions: [],
    phaseOffset: 0,
  });
}
