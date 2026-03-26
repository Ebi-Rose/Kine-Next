import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export type Goal = "muscle" | "strength" | "general" | null;
export type Experience = "new" | "developing" | "intermediate" | null;
export type CycleType = "regular" | "irregular" | "hormonal" | "perimenopause" | "na" | null;
export type Duration = "short" | "medium" | "long" | "extended" | null;
export type EduMode = "full" | "feel" | "silent";
export type SessionMode = "timed" | "stopwatch" | "off";
export type Units = "kg" | "lbs";

export interface RestConfig {
  compound: number;
  isolation: number;
}

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
  conditions: string[];    // 'pcos' | 'fibroids' | 'endometriosis' | 'pelvic_floor'
  comfortFlags: string[];  // derived: 'impactSensitive' | 'proneSensitive'
  cycleType: CycleType;
  cyclePhase: string | null;
  dayDurations: Record<number, number>;
  cycle: { periodLog: PeriodLog[]; avgLength: number | null };
  eduMode: EduMode;
  sessionMode: SessionMode;
  restConfig: RestConfig;
  eduFlags: Record<string, boolean>;
  skillPreferences: Record<string, string>;
  units: Units;

  // AI week
  weekData: unknown | null;
  weekHistory: unknown[]; // archived previous weeks

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

  // Sync metadata
  _lastModifiedAt: string; // ISO timestamp of last local change

  // Actions
  setGoal: (goal: Goal) => void;
  setExp: (exp: Experience) => void;
  setEquip: (equip: string[]) => void;
  setDays: (days: string | null) => void;
  setTrainingDays: (days: number[]) => void;
  setDuration: (duration: Duration) => void;
  setInjuries: (injuries: string[]) => void;
  setInjuryNotes: (notes: string) => void;
  setConditions: (conditions: string[]) => void;
  setCycleType: (cycleType: CycleType) => void;
  setCycle: (cycle: { periodLog: PeriodLog[]; avgLength: number | null }) => void;
  setDayDurations: (durations: Record<number, number>) => void;
  setProgressDB: (db: KineState["progressDB"]) => void;
  setEduMode: (mode: EduMode) => void;
  setUnits: (units: Units) => void;
  setWeekData: (data: unknown | null) => void;
  setWeekHistory: (history: unknown[]) => void;
  setCurrentDayIdx: (idx: number | null) => void;
  setSessionLogs: (logs: Record<number, SessionLog>) => void;
  setFeedbackState: (state: FeedbackState) => void;
  setPersonalProfile: (profile: PersonalProfile) => void;
  setSessionTimeBudgets: (budgets: Record<number, number>) => void;
  setSessionMode: (mode: SessionMode) => void;
  setRestConfig: (config: RestConfig) => void;
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
  conditions: [] as string[],
  comfortFlags: [] as string[],
  cycleType: null as CycleType,
  cyclePhase: null as string | null,
  dayDurations: {} as Record<number, number>,
  cycle: { periodLog: [] as PeriodLog[], avgLength: null as number | null },
  eduMode: "full" as EduMode,
  sessionMode: "off" as SessionMode,
  restConfig: { compound: 150, isolation: 75 } as RestConfig,
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
      weekHistory: [],

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

      // Sync metadata
      _lastModifiedAt: new Date().toISOString(),

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

      // Actions (touch _lastModifiedAt on meaningful changes)
      setGoal: (goal) => set({ goal, _lastModifiedAt: new Date().toISOString() }),
      setExp: (exp) => set({ exp, _lastModifiedAt: new Date().toISOString() }),
      setEquip: (equip) => set({ equip, _lastModifiedAt: new Date().toISOString() }),
      setDays: (days) => set({ days, _lastModifiedAt: new Date().toISOString() }),
      setTrainingDays: (days) => set({ trainingDays: days, _lastModifiedAt: new Date().toISOString() }),
      setDuration: (duration) => set({ duration, _lastModifiedAt: new Date().toISOString() }),
      setInjuries: (injuries) => set({ injuries, _lastModifiedAt: new Date().toISOString() }),
      setInjuryNotes: (notes) => set({ injuryNotes: notes, _lastModifiedAt: new Date().toISOString() }),
      setConditions: (conditions) => {
        // Derive comfortFlags from conditions
        const comfortFlags: string[] = [];
        if (conditions.includes("fibroids") || conditions.includes("endometriosis"))
          comfortFlags.push("impactSensitive");
        if (conditions.includes("pelvic_floor"))
          comfortFlags.push("proneSensitive");
        set({ conditions, comfortFlags, _lastModifiedAt: new Date().toISOString() });
      },
      setCycleType: (cycleType) => set({ cycleType, _lastModifiedAt: new Date().toISOString() }),
      setCycle: (cycle) => set({ cycle, _lastModifiedAt: new Date().toISOString() }),
      setDayDurations: (durations) => set({ dayDurations: durations, _lastModifiedAt: new Date().toISOString() }),
      setProgressDB: (db) => set({ progressDB: db, _lastModifiedAt: new Date().toISOString() }),
      setEduMode: (mode) => set({ eduMode: mode, _lastModifiedAt: new Date().toISOString() }),
      setUnits: (units) => set({ units, _lastModifiedAt: new Date().toISOString() }),
      setWeekData: (data) => set((state) => {
        // Archive current week before replacing (if it has data)
        const history = [...state.weekHistory];
        if (state.weekData && data !== null) {
          // Don't duplicate if same week
          const existing = state.weekData as { _weekNum?: number };
          const alreadyArchived = history.some(
            (h) => (h as { _weekNum?: number })._weekNum === existing._weekNum
          );
          if (!alreadyArchived) {
            history.push(state.weekData);
          }
        }
        return { weekData: data, weekHistory: history };
      }),
      setWeekHistory: (history) => set({ weekHistory: history }),
      setCurrentDayIdx: (idx) => set({ currentDayIdx: idx }),
      setSessionLogs: (logs) => set({ sessionLogs: logs }),
      setFeedbackState: (state) => set({ feedbackState: state }),
      setPersonalProfile: (profile) => set({ personalProfile: profile }),
      setSessionTimeBudgets: (budgets) => set({ sessionTimeBudgets: budgets }),
      setSessionMode: (mode) => set({ sessionMode: mode }),
      setRestConfig: (config) => set({ restConfig: config }),
      resetOnboarding: () => set(initialOnboarding),
    }),
    {
      name: "kine_v2",
      onRehydrateStorage: () => () => {
        useKineStore.setState({ _hasHydrated: true } as Partial<KineState>);
      },
    }
  )
);

/** Returns true once Zustand has finished hydrating from localStorage */
export function useStoreHydrated(): boolean {
  return useKineStore((s) => (s as KineState & { _hasHydrated?: boolean })._hasHydrated ?? false);
}
