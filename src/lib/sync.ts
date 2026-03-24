import { supabase } from "./supabase";
import { getUser, isDevBypass } from "./auth";
import { useKineStore } from "@/store/useKineStore";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000;

function shouldSkipSync(): boolean {
  return isDevBypass();
}

/**
 * Debounced sync of Zustand state to Supabase training_data table.
 */
export function syncToSupabase() {
  if (shouldSkipSync()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(doSync, SYNC_DEBOUNCE_MS);
}

async function doSync() {
  syncTimer = null;
  const user = await getUser();
  if (!user) return;

  const store = useKineStore.getState();

  try {
    const payload = {
      state: {
        goal: store.goal,
        exp: store.exp,
        equip: store.equip,
        days: store.days,
        trainingDays: store.trainingDays,
        duration: store.duration,
        injuries: store.injuries,
        injuryNotes: store.injuryNotes,
        cycleType: store.cycleType,
        cyclePhase: store.cyclePhase,
        dayDurations: store.dayDurations,
        cycle: store.cycle,
        eduMode: store.eduMode,
        eduFlags: store.eduFlags,
        skillPreferences: store.skillPreferences,
        units: store.units,
      },
      weekData: store.weekData,
      progressDB: store.progressDB,
      personalProfile: store.personalProfile,
      currentDayIdx: store.currentDayIdx,
      sessionTimeBudgets: store.sessionTimeBudgets,
      sessionLogs: store.sessionLogs,
      feedbackState: store.feedbackState,
    };

    const { error } = await supabase.from("training_data").upsert(
      {
        user_id: user.id,
        data: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("Cloud sync failed:", error.message);
    }
  } catch (e) {
    console.warn("Cloud sync error:", e);
  }
}

/**
 * Fetch training data from Supabase and hydrate Zustand store.
 */
export async function syncFromSupabase(): Promise<boolean> {
  if (shouldSkipSync()) return false;
  const user = await getUser();
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from("training_data")
      .select("data, updated_at")
      .eq("user_id", user.id)
      .single();

    if (error || !data?.data) return false;

    const cloud = data.data as Record<string, unknown>;
    const store = useKineStore.getState();

    // Hydrate store from cloud data
    if (cloud.state && typeof cloud.state === "object") {
      const s = cloud.state as Record<string, unknown>;
      if (s.goal !== undefined) store.setGoal(s.goal as typeof store.goal);
      if (s.exp !== undefined) store.setExp(s.exp as typeof store.exp);
      if (s.equip !== undefined) store.setEquip(s.equip as string[]);
      if (s.days !== undefined) store.setDays(s.days as string | null);
      if (s.trainingDays !== undefined) store.setTrainingDays(s.trainingDays as number[]);
      if (s.duration !== undefined) store.setDuration(s.duration as typeof store.duration);
      if (s.injuries !== undefined) store.setInjuries(s.injuries as string[]);
      if (s.cycleType !== undefined) store.setCycleType(s.cycleType as typeof store.cycleType);
      if (s.eduMode !== undefined) store.setEduMode(s.eduMode as typeof store.eduMode);
      if (s.units !== undefined) store.setUnits(s.units as typeof store.units);
    }

    if (cloud.weekData !== undefined) store.setWeekData(cloud.weekData);
    if (cloud.personalProfile) store.setPersonalProfile(cloud.personalProfile as typeof store.personalProfile);
    if (cloud.sessionLogs) store.setSessionLogs(cloud.sessionLogs as typeof store.sessionLogs);
    if (cloud.feedbackState) store.setFeedbackState(cloud.feedbackState as typeof store.feedbackState);
    if (cloud.sessionTimeBudgets) store.setSessionTimeBudgets(cloud.sessionTimeBudgets as typeof store.sessionTimeBudgets);

    return true;
  } catch (e) {
    console.warn("Cloud restore error:", e);
    return false;
  }
}

/**
 * Immediate (non-debounced) sync for critical saves.
 */
export async function syncNow() {
  if (shouldSkipSync()) return;
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  await doSync();
}
