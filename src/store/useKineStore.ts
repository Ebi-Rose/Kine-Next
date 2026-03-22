import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export type Goal = "muscle" | "strength" | "general" | null;
export type Experience = "new" | "developing" | "intermediate" | null;
export type CycleType = "regular" | "irregular" | "hormonal" | "perimenopause" | "na" | null;
export type Duration = "short" | "medium" | "long" | "extended" | null;
export type EduMode = "full" | "feel" | "silent";
export type Units = "kg" | "lbs";

export interface PeriodLog {
  date: string;
  type: "start" | "end";
}

export interface SessionLog {
  [setIndex: number]: {
    reps?: number;
    weight?: number;
    completed?: boolean;
  };
}

export interface LiftEntry {
  date: string;
  weight: number;
  reps: number;
}

export interface SkippedSession {
  sessionTitle: string;
  weekNum: number;
  dayIdx: number;
  date: string;
  movedTo: number | null;
}

export interface WeekFeedback {
  weekNum: number;
  effort: number;
  soreness: number;
  notes?: string;
}

export interface PersonalProfile {
  name: string;
  dob: string;
  gender: string;
  height: string;
  weight: string;
  location: string;
  notes: string;
  trainingAge: string;
  currentLifts: Record<string, number>;
}

export interface FeedbackState {
  effort: number | null;
  soreness: number | null;
  tsDay: string | null;
  tsTime: string | null;
  sessionStartTime: string | null;
}

// ── State shape ──

interface KineState {
  // Onboarding / preferences
  goal: Goal;
  exp: Experience;
  equip: string[];
  days: string | null;
  trainingDays: number[];
  duration: Duration;
  injuries: string[];
  injuryNotes: string;
  cycleType: CycleType;
  cyclePhase: string | null;
  dayDurations: Record<number, number>;
  cycle: { periodLog: PeriodLog[]; avgLength: number | null };
  eduMode: EduMode;
  eduFlags: Record<string, boolean>;
  skillPreferences: Record<string, string>;
  units: Units;

  // AI week
  weekData: unknown | null;

  // Progress
  progressDB: {
    sessions: unknown[];
    lifts: Record<string, LiftEntry[]>;
    currentWeek: number;
    weekFeedbackHistory: WeekFeedback[];
    programStartDate: string | null;
    skippedSessions: SkippedSession[];
    phaseOffset: number;
  };

  // Profile
  personalProfile: PersonalProfile;

  // Session
  currentDayIdx: number | null;
  sessionLogs: Record<number, SessionLog>;
  feedbackState: FeedbackState;
  sessionTimeBudgets: Record<number, number>;

  // Actions
  setGoal: (goal: Goal) => void;
  setExp: (exp: Experience) => void;
  setEquip: (equip: string[]) => void;
  setDays: (days: string | null) => void;
  setTrainingDays: (days: number[]) => void;
  setDuration: (duration: Duration) => void;
  setInjuries: (injuries: string[]) => void;
  setInjuryNotes: (notes: string) => void;
  setCycleType: (cycleType: CycleType) => void;
  setCycle: (cycle: { periodLog: PeriodLog[]; avgLength: number | null }) => void;
  setDayDurations: (durations: Record<number, number>) => void;
  setProgressDB: (db: KineState["progressDB"]) => void;
  setEduMode: (mode: EduMode) => void;
  setUnits: (units: Units) => void;
  setWeekData: (data: unknown | null) => void;
  setCurrentDayIdx: (idx: number | null) => void;
  setSessionLogs: (logs: Record<number, SessionLog>) => void;
  setFeedbackState: (state: FeedbackState) => void;
  setPersonalProfile: (profile: PersonalProfile) => void;
  setSessionTimeBudgets: (budgets: Record<number, number>) => void;
  resetOnboarding: () => void;
}

// ── Default values ──

const initialOnboarding = {
  goal: null as Goal,
  exp: null as Experience,
  equip: [] as string[],
  days: null as string | null,
  trainingDays: [] as number[],
  duration: null as Duration,
  injuries: [] as string[],
  injuryNotes: "",
  cycleType: null as CycleType,
  cyclePhase: null as string | null,
  dayDurations: {} as Record<number, number>,
  cycle: { periodLog: [] as PeriodLog[], avgLength: null as number | null },
  eduMode: "full" as EduMode,
  eduFlags: {} as Record<string, boolean>,
  skillPreferences: {} as Record<string, string>,
  units: "kg" as Units,
};

// ── Store ──

export const useKineStore = create<KineState>()(
  persist(
    (set) => ({
      // Onboarding
      ...initialOnboarding,

      // AI week
      weekData: null,

      // Progress
      progressDB: {
        sessions: [],
        lifts: { squat: [], bench: [], deadlift: [] },
        currentWeek: 1,
        weekFeedbackHistory: [],
        programStartDate: null,
        skippedSessions: [],
        phaseOffset: 0,
      },

      // Profile
      personalProfile: {
        name: "",
        dob: "",
        gender: "female",
        height: "",
        weight: "",
        location: "",
        notes: "",
        trainingAge: "",
        currentLifts: {},
      },

      // Session
      currentDayIdx: null,
      sessionLogs: {},
      feedbackState: {
        effort: null,
        soreness: null,
        tsDay: null,
        tsTime: null,
        sessionStartTime: null,
      },
      sessionTimeBudgets: {},

      // Actions
      setGoal: (goal) => set({ goal }),
      setExp: (exp) => set({ exp }),
      setEquip: (equip) => set({ equip }),
      setDays: (days) => set({ days }),
      setTrainingDays: (days) => set({ trainingDays: days }),
      setDuration: (duration) => set({ duration }),
      setInjuries: (injuries) => set({ injuries }),
      setInjuryNotes: (notes) => set({ injuryNotes: notes }),
      setCycleType: (cycleType) => set({ cycleType }),
      setCycle: (cycle) => set({ cycle }),
      setDayDurations: (durations) => set({ dayDurations: durations }),
      setProgressDB: (db) => set({ progressDB: db }),
      setEduMode: (mode) => set({ eduMode: mode }),
      setUnits: (units) => set({ units }),
      setWeekData: (data) => set({ weekData: data }),
      setCurrentDayIdx: (idx) => set({ currentDayIdx: idx }),
      setSessionLogs: (logs) => set({ sessionLogs: logs }),
      setFeedbackState: (state) => set({ feedbackState: state }),
      setPersonalProfile: (profile) => set({ personalProfile: profile }),
      setSessionTimeBudgets: (budgets) => set({ sessionTimeBudgets: budgets }),
      resetOnboarding: () => set(initialOnboarding),
    }),
    {
      name: "kine_v2",
    }
  )
);
