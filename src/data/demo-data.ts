// @ts-nocheck
// ── Demo Data Fixture — Week 8 Mid-Program User ──
// Loaded when ?demo=true or ?key=kine2026 is in the URL.
// Represents an intermediate-level woman 8 weeks into a strength program.

function weeksAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── State (onboarding selections) ──
export const demoState = {
  goal: 'strength',
  exp: 'developing',
  equip: ['barbell', 'dumbbell', 'cable', 'machine'],
  days: 3,
  trainingDays: [1, 3, 5], // Mon, Wed, Fri
  duration: 60,
  injuries: [],
  injuryNotes: '',
  cycleType: 'regular',
  cyclePhase: 'follicular',
  dayDurations: { 1: 60, 3: 55, 5: 60 },
  cycle: {
    periodLog: [
      { start: daysAgo(18), end: daysAgo(14) },
      { start: daysAgo(46), end: daysAgo(42) },
    ],
    avgLength: 28,
  },
  eduMode: 'full',
  eduFlags: {
    seen_set_notation: true,
    seen_neutral_spine: true,
    seen_warmup_intro: true,
    seen_cycle_intro: true,
    seen_progression_intro: true,
  },
  skillPreferences: {},
  units: 'kg',
};

// ── Personal Profile ──
export const demoProfile = {
  name: 'Demo User',
  dob: '1994-06-15',
  gender: 'female',
  height: '168',
  weight: '65',
  location: '',
  notes: '',
  trainingAge: '1 year',
  currentLifts: {
    'Barbell Back Squat': 70,
    'Barbell Bench Press': 47.5,
    'Barbell Row': 45,
    'Romanian Deadlift': 60,
    'Overhead Press': 30,
  },
};

// ── Session history helper ──
function makeSession(title, weekNum, date, dayIdx, exercises) {
  const logs = {};
  exercises.forEach((ex) => {
    logs[ex.name] = {
      name: ex.name,
      prescribed: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
      actual: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe || null })),
    };
  });

  return {
    sessionTitle: title,
    date,
    weekNum,
    dayIdx,
    effort: 3,
    soreness: 1,
    cyclePhase: null,
    logs,
    startTime: date + 'T09:00:00',
    endTime: date + 'T10:00:00',
    setsLogged: exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    totalVolume: exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
      0
    ),
  };
}

// ── Build 34 sessions across 8 weeks ──
function buildSessionHistory() {
  const sessions = [];
  const baseSessions = [
    {
      title: 'Upper Body — Push & Pull',
      dayIdx: 0,
      exercises: (w) => [
        { name: 'Barbell Bench Press', sets: Array(4).fill({ weight: 40 + w * 1.25, reps: 8 }) },
        { name: 'Barbell Row', sets: Array(4).fill({ weight: 35 + w * 1.25, reps: 8 }) },
        { name: 'Overhead Press', sets: Array(3).fill({ weight: 22.5 + w * 1, reps: 10 }) },
        { name: 'Lat Pulldown', sets: Array(3).fill({ weight: 35 + w * 1.25, reps: 10 }) },
      ],
    },
    {
      title: 'Lower Body — Squat & Hinge',
      dayIdx: 2,
      exercises: (w) => [
        { name: 'Barbell Back Squat', sets: Array(4).fill({ weight: 50 + w * 2.5, reps: 8 }) },
        { name: 'Romanian Deadlift', sets: Array(3).fill({ weight: 45 + w * 2, reps: 10 }) },
        { name: 'Leg Press', sets: Array(3).fill({ weight: 80 + w * 5, reps: 12 }) },
        { name: 'Hip Thrust', sets: Array(3).fill({ weight: 50 + w * 2.5, reps: 12 }) },
      ],
    },
    {
      title: 'Full Body — Compounds',
      dayIdx: 4,
      exercises: (w) => [
        { name: 'Barbell Back Squat', sets: Array(3).fill({ weight: 45 + w * 2.5, reps: 10 }) },
        { name: 'Barbell Bench Press', sets: Array(3).fill({ weight: 37.5 + w * 1.25, reps: 10 }) },
        { name: 'Barbell Row', sets: Array(3).fill({ weight: 32.5 + w * 1.25, reps: 10 }) },
        { name: 'Lateral Raise', sets: Array(3).fill({ weight: 6 + w * 0.5, reps: 15 }) },
      ],
    },
  ];

  for (let week = 1; week <= 7; week++) {
    const weekStart = weeksAgo(8 - week);
    baseSessions.forEach((s, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + s.dayIdx);
      // Skip 2 sessions across all weeks for realism (weeks 3 and 5)
      if ((week === 3 && i === 2) || (week === 5 && i === 1)) return;
      sessions.push(makeSession(s.title, week, date.toISOString().slice(0, 10), s.dayIdx, s.exercises(week)));
    });
  }

  return sessions;
}

// ── Build lift history from sessions ──
function buildLifts(sessions) {
  const lifts = {};
  sessions.forEach((s) => {
    Object.values(s.logs).forEach((log) => {
      if (!lifts[log.name]) lifts[log.name] = [];
      log.actual.forEach((set) => {
        lifts[log.name].push({ weight: set.weight, reps: set.reps, date: s.date });
      });
    });
  });
  return lifts;
}

// ── Progress DB ──
const _sessions = buildSessionHistory();

export const demoProgressDB = {
  sessions: _sessions,
  lifts: buildLifts(_sessions),
  currentWeek: 8,
  weekFeedbackHistory: [
    { weekNum: 1, adherence: 1.0, avgEffort: 3, avgSoreness: 1 },
    { weekNum: 2, adherence: 1.0, avgEffort: 3, avgSoreness: 1 },
    { weekNum: 3, adherence: 0.67, avgEffort: 3, avgSoreness: 2 },
    { weekNum: 4, adherence: 1.0, avgEffort: 3, avgSoreness: 1 },
    { weekNum: 5, adherence: 0.67, avgEffort: 2, avgSoreness: 2 },
    { weekNum: 6, adherence: 1.0, avgEffort: 3, avgSoreness: 1 },
    { weekNum: 7, adherence: 1.0, avgEffort: 3, avgSoreness: 1 },
  ],
  programStartDate: weeksAgo(8),
  skippedSessions: [],
  phaseOffset: 0,
};

// ── Current Week Data (Week 8) ──
/** Load all demo data into the Zustand store */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadDemoData(store: any) {
  // Onboarding state
  store.setGoal?.(demoState.goal);
  store.setExp?.(demoState.exp);
  store.setEquip?.(demoState.equip);
  store.setDays?.(String(demoState.days));
  store.setTrainingDays?.(demoState.trainingDays);
  store.setDuration?.(demoState.duration);
  store.setInjuries?.(demoState.injuries);
  store.setCycleType?.(demoState.cycleType);

  // Week data
  store.setWeekData?.(demoWeekData);

  // Progress
  store.setProgressDB?.(demoProgressDB);

  // Profile
  store.setProfile?.(demoProfile);
}

export const demoWeekData = {
  programName: 'Strength — Upper/Lower/Full',
  weekCoachNote:
    "Week 8 — you're in the groove now. Squat is trending up nicely. This week we push bench to 50kg for the first time. Trust the process.",
  days: [
    {
      dayNumber: 1,
      isRest: false,
      sessionTitle: 'Upper Body — Push & Pull',
      sessionDuration: '~60 min',
      coachNote: 'Bench moves to 50kg today — 4x6 instead of 4x8. Fewer reps, heavier load.',
      exercises: [
        {
          name: 'Barbell Bench Press', sets: '4', reps: '6', rest: '2–3 min',
          load: '50kg — new weight, focus on control',
          why: 'Heaviest compound first. Progressing from 47.5kg — the jump to 50 is a milestone.',
          feel: 'Bar should feel heavy but manageable. Every rep clean.',
          cues: ['Shoulder blades back', 'Bar to lower chest', 'Drive through feet'],
        },
        {
          name: 'Barbell Row', sets: '4', reps: '8', rest: '2 min',
          load: '47.5kg',
          why: 'Horizontal pull to balance the pressing volume.',
          feel: 'Pull to lower chest, squeeze the back.',
          cues: ['Hinge at 45°', 'Pull to chest', 'Control the return'],
        },
        {
          name: 'Overhead Press', sets: '3', reps: '10', rest: '90 sec',
          load: '30kg',
          why: 'Vertical pressing for shoulder development.',
          feel: 'Brace core, press straight overhead.',
          cues: ['Brace core', 'Bar over ears at top'],
        },
        {
          name: 'Lat Pulldown', sets: '3', reps: '10', rest: '90 sec',
          load: '45kg',
          why: 'Vertical pull for lat width.',
          feel: 'Lead with elbows, feel the stretch at the top.',
          cues: ['Lean back slightly', 'Pull to chin'],
        },
        {
          name: 'Tricep Pushdown', sets: '3', reps: '12', rest: '60 sec',
          load: '15kg',
          why: 'Isolation work for triceps after pressing.',
          feel: 'Elbows fixed, full extension.',
          cues: ['Keep elbows fixed', 'Full extension'],
        },
      ],
    },
    {
      dayNumber: 2, isRest: true,
      sessionTitle: 'Rest & Recovery', sessionDuration: '', coachNote: '', exercises: [],
    },
    {
      dayNumber: 3,
      isRest: false,
      sessionTitle: 'Lower Body — Squat & Hinge',
      sessionDuration: '~55 min',
      coachNote: 'Squat holds at 70kg this week — solidify the weight before pushing further.',
      exercises: [
        {
          name: 'Barbell Back Squat', sets: '4', reps: '8', rest: '2–3 min',
          load: '70kg — hold and own this weight',
          why: 'Main lower body compound. 70kg is solid — lets build confidence here.',
          feel: 'Drive from the floor, stay tight through the core.',
          cues: ['Chest up', 'Knees track toes', 'Below parallel'],
        },
        {
          name: 'Romanian Deadlift', sets: '3', reps: '10', rest: '90 sec',
          load: '62.5kg',
          why: 'Hamstring lengthening under load.',
          feel: 'Deep stretch behind the knees.',
          cues: ['Hinge at hip', 'Neutral spine', 'Feel hamstring stretch'],
        },
        {
          name: 'Leg Press', sets: '3', reps: '12', rest: '90 sec',
          load: '120kg',
          why: 'Additional quad volume without spinal load.',
          feel: 'Full range of motion, controlled.',
          cues: ['Full range', 'Feet shoulder-width'],
        },
        {
          name: 'Hip Thrust', sets: '3', reps: '12', rest: '90 sec',
          load: '70kg',
          why: 'Glute peak contraction.',
          feel: 'Squeeze hard at the top.',
          cues: ['Full hip extension', 'Squeeze at top'],
        },
      ],
    },
    {
      dayNumber: 4, isRest: true,
      sessionTitle: 'Rest & Recovery', sessionDuration: '', coachNote: '', exercises: [],
    },
    {
      dayNumber: 5,
      isRest: false,
      sessionTitle: 'Full Body — Compounds',
      sessionDuration: '~60 min',
      coachNote: 'Lighter squat day — volume work. Keep the tempo controlled.',
      exercises: [
        {
          name: 'Barbell Back Squat', sets: '3', reps: '10', rest: '2 min',
          load: '60kg — tempo work',
          why: 'Volume squat day at lighter load.',
          feel: 'Control the eccentric, pause at the bottom.',
          cues: ['3 second descent', 'Pause at bottom', 'Drive up'],
        },
        {
          name: 'Barbell Bench Press', sets: '3', reps: '10', rest: '90 sec',
          load: '42.5kg',
          why: 'Volume bench after the heavy session earlier in the week.',
          feel: 'Smooth reps, good rhythm.',
          cues: ['Shoulder blades pinched', 'Full range'],
        },
        {
          name: 'Barbell Row', sets: '3', reps: '10', rest: '90 sec',
          load: '42.5kg',
          why: 'Volume pulling work.',
          feel: 'Squeeze the back on every rep.',
          cues: ['Hinge at 45°', 'Pull to chest'],
        },
        {
          name: 'Lateral Raise', sets: '3', reps: '15', rest: '60 sec',
          load: '7kg each',
          why: 'Medial delt isolation.',
          feel: 'Lead with elbows, brief pause at top.',
          cues: ['Lead with elbows', 'Pause at top'],
        },
        {
          name: 'Face Pulls', sets: '3', reps: '15', rest: '60 sec',
          load: '12.5kg',
          why: 'Rear delt and rotator cuff health.',
          feel: 'External rotation at the end of each rep.',
          cues: ['Pull to forehead', 'External rotation at end'],
        },
      ],
    },
    {
      dayNumber: 6, isRest: true,
      sessionTitle: 'Rest & Recovery', sessionDuration: '', coachNote: '', exercises: [],
    },
    {
      dayNumber: 7, isRest: true,
      sessionTitle: 'Rest & Recovery', sessionDuration: '', coachNote: '', exercises: [],
    },
  ],
};
