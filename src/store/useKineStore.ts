import { create } from "zustand";
import { persist, type StateStorage } from "zustand/middleware";
import { encrypt, decrypt } from "@/lib/store-encryption";
import { appNow } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";
import type { CardId, TimeWindow } from "@/lib/progress-engine";

export type Goal = "muscle" | "strength" | "general" | null;
export type Experience = "new" | "developing" | "intermediate" | null;
export type LifeStage =
  | "general"
  | "pregnancy"
  | "postpartum"
  | "perimenopause"
  | "post_menopause"
  | null;
export type CycleType = "regular" | "irregular" | "hormonal" | "perimenopause" | "na" | null;
export type OutsideActivity = "running" | "swimming" | "cycling" | "team_sport" | "climbing" | "martial_arts" | "yoga_pilates";

/**
 * User overrides for the Progress page personalization engine.
 * Principle #20 — engine personalizes; user has final say.
 */
export interface ProgressPreferences {
  overrides: Partial<Record<CardId, "force_show" | "force_hide">>;
  timeWindowOverride: TimeWindow | null;
}
export type Duration = "short" | "medium" | "long" | "extended" | null;
export type EduMode = "full" | "feel" | "silent";
export type TrackingMode = "lifts" | "photos" | "measurements" | "bodyweight" | "feeling";
export type SessionMode = "timed" | "stopwatch" | "off";
export type CheckInField = "photos" | "weight" | "mood" | "notes";
export type Units = "kg" | "lbs";
export type MeasurementSystem = "metric" | "imperial";
export type SupportedCurrency = "GBP" | "USD";

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
  effort: number;   // energy level: 1=Drained, 2=Low, 3=Normal, 4=High
  soreness: number; // body feel: 1=Fresh, 2=Mild aches, 3=Sore, 4=Beat up
  scheduleFeeling?: "too_easy" | "about_right" | "too_much";
  notes?: string;
}

export interface PersonalProfile {
  name: string;
  height: string;
  weight: string;
  trainingAge: string;
  currentLifts: Record<string, number>;
  /** Optional life stage — drives Progress page personalization. Undefined = treat as "general". */
  lifeStage?: LifeStage;
  /** Optional age — drives default time-window heuristics in the engine. */
  age?: number;
}

export interface ConsentRecord {
  type: "health_data" | "terms" | "privacy";
  granted: boolean;
  timestamp: string; // ISO 8601
}

export interface FeedbackState {
  effort: number | null;
  soreness: number | null;
  tsDay: string | null;
  tsTime: string | null;
  sessionStartTime: string | null;
}

export interface SessionRecord {
  date?: string;
  title?: string;
  effort?: number;
  soreness?: number;
  weekNum?: number;
  dayIdx?: number;
  logs?: Record<string, unknown>;
  prs?: { name: string; weight: number; reps: number }[];
  changes?: { icon: string; title: string; detail: string }[];
}

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
  outsideActivities: OutsideActivity[];
  outsideActivityNotes: string;
  outsideActivityFocus: OutsideActivity | null;
  comfortFlags: string[];  // derived: 'impactSensitive' | 'proneSensitive'
  cycleType: CycleType;
  cyclePhase: string | null;
  cycleLocalOnly: boolean;
  dayDurations: Record<number, number>;
  cycle: { periodLog: PeriodLog[]; avgLength: number | null };
  eduMode: EduMode;
  sessionMode: SessionMode;
  restConfig: RestConfig;
  eduFlags: Record<string, boolean>;
  skillPreferences: Record<string, string>;
  trackingModes: TrackingMode[];
  checkinFields: CheckInField[];
  units: Units;
  measurementSystem: MeasurementSystem;
  currency: SupportedCurrency;

  // AI week
  weekData: WeekData | null;
  weekHistory: WeekData[];

  // Progress
  progressDB: {
    sessions: SessionRecord[];
    lifts: Record<string, LiftEntry[]>;
    currentWeek: number;
    weekFeedbackHistory: WeekFeedback[];
    programStartDate: string | null;
    skippedSessions: SkippedSession[];
    phaseOffset: number;
    pendingProfileChange?: boolean;
  };

  // Profile
  personalProfile: PersonalProfile;

  // Progress page personalization overrides (principle #20)
  progressPreferences: ProgressPreferences;

  // Session
  currentDayIdx: number | null;
  sessionLogs: Record<number, SessionLog>;
  feedbackState: FeedbackState;
  sessionTimeBudgets: Record<number, number>;

  // Consents
  consents: ConsentRecord[];

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
  setOutsideActivities: (activities: OutsideActivity[]) => void;
  setOutsideActivityNotes: (notes: string) => void;
  setOutsideActivityFocus: (focus: OutsideActivity | null) => void;
  setConditions: (conditions: string[]) => void;
  setCycleType: (cycleType: CycleType) => void;
  setCyclePhase: (phase: string | null) => void;
  setCycleLocalOnly: (val: boolean) => void;
  setCycle: (cycle: { periodLog: PeriodLog[]; avgLength: number | null }) => void;
  setDayDurations: (durations: Record<number, number>) => void;
  setProgressDB: (db: KineState["progressDB"]) => void;
  setEduMode: (mode: EduMode) => void;
  setUnits: (units: Units) => void;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setWeekData: (data: WeekData | null) => void;
  setWeekHistory: (history: WeekData[]) => void;
  setCurrentDayIdx: (idx: number | null) => void;
  setSessionLogs: (logs: Record<number, SessionLog>) => void;
  setFeedbackState: (state: FeedbackState) => void;
  setPersonalProfile: (profile: PersonalProfile) => void;
  setLifeStage: (lifeStage: LifeStage) => void;
  setAge: (age: number | undefined) => void;
  setProgressPreference: (id: CardId, action: "force_show" | "force_hide" | null) => void;
  setProgressTimeWindow: (window: TimeWindow | null) => void;
  resetProgressPreferences: () => void;
  setSessionTimeBudgets: (budgets: Record<number, number>) => void;
  setSessionMode: (mode: SessionMode) => void;
  setRestConfig: (config: RestConfig) => void;
  setEduFlags: (flags: Record<string, boolean>) => void;
  setSkillPreferences: (prefs: Record<string, string>) => void;
  setTrackingModes: (modes: TrackingMode[]) => void;
  setCheckinFields: (fields: CheckInField[]) => void;
  setConsents: (consents: ConsentRecord[]) => void;
  recordConsent: (type: ConsentRecord["type"], granted: boolean) => void;
  resetOnboarding: () => void;
}

const initialOnboarding = {
  goal: null as Goal,
  exp: null as Experience,
  equip: [] as string[],
  days: null as string | null,
  trainingDays: [] as number[],
  duration: null as Duration,
  injuries: [] as string[],
  injuryNotes: "",
  outsideActivities: [] as OutsideActivity[],
  outsideActivityNotes: "",
  outsideActivityFocus: null as OutsideActivity | null,
  conditions: [] as string[],
  comfortFlags: [] as string[],
  cycleType: null as CycleType,
  cyclePhase: null as string | null,
  cycleLocalOnly: false,
  dayDurations: {} as Record<number, number>,
  cycle: { periodLog: [] as PeriodLog[], avgLength: null as number | null },
  eduMode: "full" as EduMode,
  sessionMode: "off" as SessionMode,
  restConfig: { compound: 150, isolation: 75 } as RestConfig,
  eduFlags: {} as Record<string, boolean>,
  skillPreferences: {} as Record<string, string>,
  trackingModes: ["lifts", "feeling"] as TrackingMode[],
  checkinFields: ["photos", "weight", "mood", "notes"] as CheckInField[],
  units: "kg" as Units,
  measurementSystem: "metric" as MeasurementSystem,
  currency: "GBP" as SupportedCurrency,
};

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
        height: "",
        weight: "",
        trainingAge: "",
        currentLifts: {},
      },

      // Progress page personalization overrides
      progressPreferences: {
        overrides: {},
        timeWindowOverride: null,
      },

      // Consents
      consents: [] as ConsentRecord[],

      // Sync metadata
      _lastModifiedAt: appNow().toISOString(),

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
      setGoal: (goal) => set({ goal, _lastModifiedAt: appNow().toISOString() }),
      setExp: (exp) => set({ exp, _lastModifiedAt: appNow().toISOString() }),
      setEquip: (equip) => set({ equip, _lastModifiedAt: appNow().toISOString() }),
      setDays: (days) => set({ days, _lastModifiedAt: appNow().toISOString() }),
      setTrainingDays: (days) => set({ trainingDays: days, _lastModifiedAt: appNow().toISOString() }),
      setDuration: (duration) => set({ duration, _lastModifiedAt: appNow().toISOString() }),
      setInjuries: (injuries) => set({ injuries, _lastModifiedAt: appNow().toISOString() }),
      setInjuryNotes: (notes) => set({ injuryNotes: notes, _lastModifiedAt: appNow().toISOString() }),
      setOutsideActivities: (activities) => set({ outsideActivities: activities, _lastModifiedAt: appNow().toISOString() }),
      setOutsideActivityNotes: (notes) => set({ outsideActivityNotes: notes, _lastModifiedAt: appNow().toISOString() }),
      setOutsideActivityFocus: (focus) => set({ outsideActivityFocus: focus, _lastModifiedAt: appNow().toISOString() }),
      setConditions: (conditions) => {
        // Derive comfortFlags from conditions
        const comfortFlags: string[] = [];
        if (conditions.includes("fibroids") || conditions.includes("endometriosis"))
          comfortFlags.push("impactSensitive");
        if (conditions.includes("pelvic_floor"))
          comfortFlags.push("proneSensitive");
        if (conditions.includes("hypermobility"))
          comfortFlags.push("stabilityRequired");
        set({ conditions, comfortFlags, _lastModifiedAt: appNow().toISOString() });
      },
      setCycleType: (cycleType) => set({ cycleType, _lastModifiedAt: appNow().toISOString() }),
      setCyclePhase: (phase) => set({ cyclePhase: phase, _lastModifiedAt: appNow().toISOString() }),
      setCycleLocalOnly: (val) => set({ cycleLocalOnly: val, _lastModifiedAt: appNow().toISOString() }),
      setCycle: (cycle) => set({ cycle, _lastModifiedAt: appNow().toISOString() }),
      setDayDurations: (durations) => set({ dayDurations: durations, _lastModifiedAt: appNow().toISOString() }),
      setProgressDB: (db) => set({ progressDB: db, _lastModifiedAt: appNow().toISOString() }),
      setEduMode: (mode) => set({ eduMode: mode, _lastModifiedAt: appNow().toISOString() }),
      setUnits: (units) => set({ units, _lastModifiedAt: appNow().toISOString() }),
      setMeasurementSystem: (system) => set({
        measurementSystem: system,
        units: system === "imperial" ? "lbs" : "kg",
        _lastModifiedAt: appNow().toISOString(),
      }),
      setCurrency: (currency) => set({ currency, _lastModifiedAt: appNow().toISOString() }),
      setWeekData: (data) => set((state) => {
        // Archive current week only when replaced by a *different* week (new week built).
        // In-session updates (logging sets, rearranging) reuse the same _weekNum and
        // should not trigger archival, otherwise an early/partial snapshot gets stuck
        // in history and never updated.
        const history = [...state.weekHistory];
        const isWeekChange =
          state.weekData &&
          data !== null &&
          data._weekNum !== state.weekData._weekNum;
        if (isWeekChange) {
          const alreadyArchived = history.some(
            (h) => h._weekNum === state.weekData?._weekNum
          );
          if (!alreadyArchived) {
            history.push(state.weekData!);
          }
        }
        // Cap at 26 weeks (6 months) to prevent localStorage bloat
        const trimmed = history.length > 26 ? history.slice(-26) : history;
        return { weekData: data, weekHistory: trimmed, _lastModifiedAt: appNow().toISOString() };
      }),
      setWeekHistory: (history) => set({ weekHistory: history }),
      setCurrentDayIdx: (idx) => set({ currentDayIdx: idx }),
      setSessionLogs: (logs) => set({ sessionLogs: logs }),
      setFeedbackState: (state) => set({ feedbackState: state }),
      setPersonalProfile: (profile) => set({ personalProfile: profile, _lastModifiedAt: appNow().toISOString() }),
      setLifeStage: (lifeStage) => set((state) => ({
        personalProfile: { ...state.personalProfile, lifeStage: lifeStage ?? undefined },
        _lastModifiedAt: appNow().toISOString(),
      })),
      setAge: (age) => set((state) => ({
        personalProfile: { ...state.personalProfile, age },
        _lastModifiedAt: appNow().toISOString(),
      })),
      setProgressPreference: (id, action) => set((state) => {
        const next = { ...state.progressPreferences.overrides };
        if (action === null) delete next[id];
        else next[id] = action;
        return {
          progressPreferences: { ...state.progressPreferences, overrides: next },
          _lastModifiedAt: appNow().toISOString(),
        };
      }),
      setProgressTimeWindow: (window) => set((state) => ({
        progressPreferences: { ...state.progressPreferences, timeWindowOverride: window },
        _lastModifiedAt: appNow().toISOString(),
      })),
      resetProgressPreferences: () => set({
        progressPreferences: { overrides: {}, timeWindowOverride: null },
        _lastModifiedAt: appNow().toISOString(),
      }),
      setSessionTimeBudgets: (budgets) => set({ sessionTimeBudgets: budgets }),
      setSessionMode: (mode) => set({ sessionMode: mode, _lastModifiedAt: appNow().toISOString() }),
      setRestConfig: (config) => set({ restConfig: config, _lastModifiedAt: appNow().toISOString() }),
      setEduFlags: (flags) => set({ eduFlags: flags, _lastModifiedAt: appNow().toISOString() }),
      setSkillPreferences: (prefs) => set({ skillPreferences: prefs, _lastModifiedAt: appNow().toISOString() }),
      setTrackingModes: (modes) => set({ trackingModes: modes, _lastModifiedAt: appNow().toISOString() }),
      setCheckinFields: (fields) => set({ checkinFields: fields, _lastModifiedAt: appNow().toISOString() }),
      setConsents: (consents) => set({ consents, _lastModifiedAt: appNow().toISOString() }),
      recordConsent: (type, granted) => set((state) => {
        const now = appNow().toISOString();
        const filtered = state.consents.filter((c) => c.type !== type);
        return {
          consents: [...filtered, { type, granted, timestamp: now }],
          _lastModifiedAt: now,
        };
      }),
      resetOnboarding: () => set(initialOnboarding),
    }),
    {
      name: "kine_v2",
      version: 5,
      storage: {
        getItem: async (name: string) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          // Support unencrypted legacy data (contains "{")
          if (raw.startsWith("{")) return JSON.parse(raw);
          const decrypted = await decrypt(raw);
          return decrypted ? JSON.parse(decrypted) : null;
        },
        setItem: async (name: string, value: unknown) => {
          const json = JSON.stringify(value);
          const encrypted = await encrypt(json);
          try {
            localStorage.setItem(name, encrypted);
          } catch {
            // Quota exceeded — clear old caches and retry once
            try {
              Object.keys(localStorage).filter((k) => k.startsWith("kine_session_draft_")).forEach((k) => localStorage.removeItem(k));
              localStorage.setItem(name, encrypted);
            } catch {
              console.error("[Kinē] localStorage quota exceeded — data not persisted");
            }
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      } satisfies StateStorage,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        // v0 → v1: add fields introduced after initial release
        if (version === 0 || version === 1) {
          state.conditions ??= [];
          state.comfortFlags ??= [];
          state.skillPreferences ??= {};
          state.weekHistory ??= [];
          state.sessionTimeBudgets ??= {};
          state.sessionMode ??= "off";
          state.restConfig ??= { compound: 150, isolation: 75 };
          state.eduFlags ??= {};
          state.units ??= "kg";
        }
        // v1 → v2: add measurementSystem and currency
        if (version < 2) {
          state.measurementSystem ??= (state.units === "lbs" ? "imperial" : "metric");
          state.currency ??= "GBP";
          state.consents ??= [];
        }
        // v2 → v3: data minimization + cycleLocalOnly
        if (version < 3) {
          state.cycleLocalOnly ??= false;
          // Strip unused profile fields
          const profile = state.personalProfile as Record<string, unknown> | undefined;
          if (profile) {
            const { name, height, weight, trainingAge, currentLifts } = profile as PersonalProfile & Record<string, unknown>;
            state.personalProfile = { name: name ?? "", height: height ?? "", weight: weight ?? "", trainingAge: trainingAge ?? "", currentLifts: currentLifts ?? {} };
          }
        }
        // Backfill checkinFields for all versions
        state.checkinFields ??= ["photos", "weight", "mood", "notes"];
        // v3 → v4: drop empty archived weeks left over from the old setWeekData
        // archive bug (snapshots were taken before exercises were populated)
        if (version < 4) {
          const history = state.weekHistory as Array<{ days?: Array<{ exercises?: unknown[] }> }> | undefined;
          if (Array.isArray(history)) {
            state.weekHistory = history.filter((w) =>
              w?.days?.some((d) => Array.isArray(d.exercises) && d.exercises.length > 0)
            );
          }
        }
        // v4 → v5: progress page personalization preferences slice
        if (version < 5) {
          state.progressPreferences ??= { overrides: {}, timeWindowOverride: null };
        }
        return state as unknown as KineState;
      },
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
