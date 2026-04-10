import { supabase } from "./supabase";
import { getUser, isDevBypass } from "./auth";
import { useKineStore } from "@/store/useKineStore";
import { appNow } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncPending = false;
let syncQueuedWhileOffline = false;
const SYNC_DEBOUNCE_MS = 2000;

function shouldSkipSync(): boolean {
  return isDevBypass();
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

// Listen for connectivity changes and flush queued syncs
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (syncQueuedWhileOffline) {
      syncQueuedWhileOffline = false;
      syncToSupabase();
    }
  });
}

/**
 * Debounced sync of Zustand state to Supabase training_data table.
 * If offline, queues the sync for when connectivity returns.
 */
export function syncToSupabase() {
  if (shouldSkipSync()) return;

  if (isOffline()) {
    syncQueuedWhileOffline = true;
    return;
  }

  syncPending = true;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(doSync, SYNC_DEBOUNCE_MS);
}

/**
 * Flush any pending sync immediately (used on page unload).
 */
export function flushSync() {
  if (syncPending && syncTimer) {
    clearTimeout(syncTimer);
    doSync();
  }
}

async function doSync(retryCount = 0) {
  syncTimer = null;
  syncPending = false;
  const user = await getUser();
  if (!user) return;

  const store = useKineStore.getState();

  // ── Refuse to upload an unhydrated or empty store ─────────────────────
  // The bug this guards against:
  //   1. User logs in on a fresh device.
  //   2. localStorage is empty, store starts at defaults (goal=null,
  //      progressDB.programStartDate=null, no _lastModifiedAt).
  //   3. SyncProvider's subscriber fires on the first store change,
  //      doSync() runs, the empty default state gets written to
  //      training_data — overwriting the user's real cloud row.
  // Three checks:
  //   - hydration must have happened (or be n/a — server-side hydration
  //     finishes synchronously before any subscriber fires)
  //   - the store must contain at least one onboarding-completion signal
  //   - we must have a real local timestamp; otherwise we have no basis
  //     to claim our copy is "newer" than anyone else's
  const hydrated = (store as { _hasHydrated?: boolean })._hasHydrated;
  if (hydrated === false) {
    console.info("[sync] Skipping upload — store has not finished hydrating");
    return;
  }
  const hasOnboardingSignal =
    store.goal !== null || store.progressDB?.programStartDate;
  if (!hasOnboardingSignal) {
    console.info("[sync] Skipping upload — local store is empty (no goal / programStartDate)");
    return;
  }
  if (!store._lastModifiedAt) {
    console.info("[sync] Skipping upload — no _lastModifiedAt on local store");
    return;
  }

  try {
    // Check health data consent — strip sensitive fields if not granted
    const healthConsent = store.consents?.find((c: { type: string; granted: boolean }) => c.type === "health_data");
    const healthGranted = healthConsent?.granted === true;
    const cycleToCloud = healthGranted && !store.cycleLocalOnly;

    const payload = {
      state: {
        goal: store.goal,
        exp: store.exp,
        equip: store.equip,
        days: store.days,
        trainingDays: store.trainingDays,
        duration: store.duration,
        injuries: healthGranted ? store.injuries : [],
        injuryNotes: healthGranted ? store.injuryNotes : "",
        outsideActivities: store.outsideActivities,
        outsideActivityNotes: store.outsideActivityNotes,
        outsideActivityFocus: store.outsideActivityFocus,
        conditions: healthGranted ? store.conditions : [],
        comfortFlags: healthGranted ? store.comfortFlags : {},
        cycleType: cycleToCloud ? store.cycleType : "none",
        cyclePhase: cycleToCloud ? store.cyclePhase : null,
        dayDurations: store.dayDurations,
        cycle: cycleToCloud ? store.cycle : { periodLog: [], cycleLength: 28, periodLength: 5 },
        eduMode: store.eduMode,
        sessionMode: store.sessionMode,
        restConfig: store.restConfig,
        eduFlags: store.eduFlags,
        skillPreferences: store.skillPreferences,
        units: store.units,
        measurementSystem: store.measurementSystem,
      },
      weekData: store.weekData,
      weekHistory: store.weekHistory,
      progressDB: store.progressDB,
      personalProfile: store.personalProfile,
      currentDayIdx: store.currentDayIdx,
      sessionTimeBudgets: store.sessionTimeBudgets,
      sessionLogs: store.sessionLogs,
      feedbackState: store.feedbackState,
      consents: store.consents,
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
      // NaN-safe: if local time is invalid, treat as definitely-older and
      // skip. The previous check ("cloudTime > localTime") returned false
      // for NaN, which let an empty fresh-device store overwrite cloud.
      if (!Number.isFinite(localTime) || cloudTime > localTime) {
        console.info("[sync] Cloud data is newer or local is unstamped — skipping upload");
        return;
      }
    }

    const { error } = await supabase.from("training_data").upsert(
      {
        user_id: user.id,
        data: payload,
        updated_at: appNow().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("Cloud sync failed:", error.message);
      if (retryCount < 2) {
        setTimeout(() => doSync(retryCount + 1), 2000 * (retryCount + 1));
      }
      return;
    }

    // Mirror name to profiles.name for greetings, analytics, RLS-friendly reads.
    // Best-effort: a failure here must not block the training_data sync above.
    const personalName = (store.personalProfile as { name?: string } | undefined)?.name?.trim();
    if (personalName) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: personalName, updated_at: appNow().toISOString() })
        .eq("id", user.id);
      if (profileError) {
        console.warn("[sync] profiles.name update failed:", profileError.message);
      }
    }
  } catch (e) {
    console.warn("Cloud sync error:", e);
    if (retryCount < 2) {
      setTimeout(() => doSync(retryCount + 1), 2000 * (retryCount + 1));
    }
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

    // Conflict resolution: only hydrate if cloud is newer than local.
    // BUT: the "newer local" guard must only trigger when local actually
    // contains onboarding data. Otherwise a fresh browser with a stamped
    // default store blocks cloud restore forever and the user is stuck
    // on "Loading your programme…".
    const localHasOnboardingData = !!store.goal || !!store.progressDB?.programStartDate;
    const cloudModified = (cloud._lastModifiedAt as string) || data.updated_at;
    const localModified = store._lastModifiedAt;

    if (localHasOnboardingData && localModified && cloudModified) {
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
      if (s.injuryNotes !== undefined) store.setInjuryNotes(s.injuryNotes as string);
      if (s.conditions !== undefined) store.setConditions(s.conditions as string[]);
      if (s.cycleType !== undefined) store.setCycleType(s.cycleType as typeof store.cycleType);
      if (s.cyclePhase !== undefined) store.setCyclePhase(s.cyclePhase as string | null);
      if (s.dayDurations !== undefined) store.setDayDurations(s.dayDurations as Record<number, number>);
      if (s.cycle !== undefined) store.setCycle(s.cycle as typeof store.cycle);
      if (s.eduMode !== undefined) store.setEduMode(s.eduMode as typeof store.eduMode);
      if (s.sessionMode !== undefined) store.setSessionMode(s.sessionMode as typeof store.sessionMode);
      if (s.restConfig !== undefined) store.setRestConfig(s.restConfig as typeof store.restConfig);
      if (s.eduFlags !== undefined) store.setEduFlags(s.eduFlags as Record<string, boolean>);
      if (s.skillPreferences !== undefined) store.setSkillPreferences(s.skillPreferences as Record<string, string>);
      if (s.units !== undefined) store.setUnits(s.units as typeof store.units);
      if (s.measurementSystem !== undefined) store.setMeasurementSystem(s.measurementSystem as typeof store.measurementSystem);
    }

    if (cloud.weekData !== undefined) store.setWeekData(cloud.weekData as WeekData | null);
    if (cloud.weekHistory !== undefined) store.setWeekHistory(cloud.weekHistory as WeekData[]);
    if (cloud.progressDB) store.setProgressDB(cloud.progressDB as typeof store.progressDB);
    if (cloud.personalProfile) {
      const p = cloud.personalProfile as Record<string, unknown>;
      store.setPersonalProfile({
        name: (p.name as string) ?? "",
        height: (p.height as string) ?? "",
        weight: (p.weight as string) ?? "",
        trainingAge: (p.trainingAge as string) ?? "",
        currentLifts: (p.currentLifts as Record<string, number>) ?? {},
      });
    }
    if (cloud.currentDayIdx !== undefined) store.setCurrentDayIdx(cloud.currentDayIdx as number | null);
    if (cloud.sessionLogs) store.setSessionLogs(cloud.sessionLogs as typeof store.sessionLogs);
    if (cloud.feedbackState) store.setFeedbackState(cloud.feedbackState as typeof store.feedbackState);
    if (cloud.sessionTimeBudgets) store.setSessionTimeBudgets(cloud.sessionTimeBudgets as typeof store.sessionTimeBudgets);
    if (cloud.consents) store.setConsents(cloud.consents as typeof store.consents);

    return true;
  } catch (e) {
    console.warn("Cloud restore error:", e);
    return false;
  }
}

/**
 * Immediate (non-debounced) sync for critical saves (e.g. consent changes).
 */
export async function syncNow() {
  if (shouldSkipSync()) return;
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  syncPending = false;
  await doSync();
}
