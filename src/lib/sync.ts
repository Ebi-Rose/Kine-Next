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
      weekHistory: store.weekHistory,
      progressDB: store.progressDB,
      personalProfile: store.personalProfile,
      currentDayIdx: store.currentDayIdx,
      sessionTimeBudgets: store.sessionTimeBudgets,
      sessionLogs: store.sessionLogs,
      feedbackState: store.feedbackState,
      _lastModifiedAt: store._lastModifiedAt,
    };

    // Check cloud timestamp before writing — don't overwrite newer data
    const { data: existing } = await supabase
      .from("training_data")
      .select("updated_at")
      .eq("user_id", user.id)
      .single();

    if (existing?.updated_at) {
      const cloudTime = new Date(existing.updated_at).getTime();
      const localTime = new Date(store._lastModifiedAt).getTime();
      if (cloudTime > localTime) {
        console.info("[sync] Cloud data is newer — skipping upload to avoid overwrite");
        return;
      }
    }

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
 * Only overwrites local data if cloud is newer.
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

    // Conflict resolution: only hydrate if cloud is newer than local
    const cloudModified = (cloud._lastModifiedAt as string) || data.updated_at;
    const localModified = store._lastModifiedAt;

    if (localModified && cloudModified) {
      const cloudTime = new Date(cloudModified).getTime();
      const localTime = new Date(localModified).getTime();
      if (localTime > cloudTime) {
        console.info("[sync] Local data is newer — skipping cloud restore");
        return false;
      }
    }

    // Cloud is newer or equal — hydrate store
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
    if (cloud.weekHistory !== undefined) store.setWeekHistory(cloud.weekHistory as unknown[]);
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

/**
 * Returns true if there is a pending debounced sync that hasn't flushed yet.
 */
export function hasPendingSync(): boolean {
  return syncTimer !== null;
}
