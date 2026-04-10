// ── Deterministic Adaptation Computation ──
//
// Computes structured AdaptationItem[] from check-in ratings plus
// the user's current periodisation, cycle, condition, and activity
// state. These are the same adaptation triggers that week-builder.ts
// uses in the prompt — surfaced here as human-readable items the
// user can review and toggle before generation.

import { getEffectiveNextPhase, getBlockNumber, getBlockWeek } from "./periodisation";
import { getCurrentPhase } from "./cycle";
import { getConditionCoachNote } from "./condition-context";
import { getActivityCoachNote } from "./outside-activity-context";
import { useKineStore, type AdaptationItem, type SessionRecord } from "@/store/useKineStore";

export function computeAdaptations(
  energy: number,
  soreness: number,
  scheduleFeeling: "too_easy" | "about_right" | "too_much",
): AdaptationItem[] {
  const store = useKineStore.getState();
  const { progressDB, cycleType, cycle, conditions, outsideActivities, outsideActivityFocus, days } = store;

  const weekNum = progressDB.currentWeek;
  const plannedDays = parseInt(days || "3");
  const items: AdaptationItem[] = [];
  let counter = 0;
  const id = (prefix: string) => `${prefix}-${counter++}`;

  // ── Rating-based adaptations (mirrors week-builder lines 344-357) ──

  if (energy <= 2 || soreness >= 3) {
    items.push({
      id: id("rating"),
      label: energy <= 2
        ? "Reduce volume — energy was low this week"
        : "Reduce intensity — body soreness was high",
      source: "rating",
      enabled: true,
    });
  }

  if (energy >= 4 && soreness <= 2) {
    items.push({
      id: id("rating"),
      label: "Slightly increase challenge — feeling fresh and energised",
      source: "rating",
      enabled: true,
    });
  }

  if (scheduleFeeling === "too_easy") {
    items.push({
      id: id("rating"),
      label: "Add sets or an extra exercise — volume felt too easy",
      source: "rating",
      enabled: true,
    });
  } else if (scheduleFeeling === "too_much") {
    items.push({
      id: id("rating"),
      label: "Reduce sets or drop an accessory — volume was too much",
      source: "rating",
      enabled: true,
    });
  }

  // ── Periodisation phase ──

  const sessions = progressDB.sessions as SessionRecord[];
  const { phase, held, deloading } = getEffectiveNextPhase(
    weekNum,
    progressDB.phaseOffset,
    plannedDays,
    sessions,
    progressDB.skippedSessions,
    0, // lastDeloadWeek not tracked in store; defaults to 0
    { effort: energy, soreness },
  );

  if (deloading) {
    items.push({
      id: id("period"),
      label: "Deload triggered — lighter loads, reduced volume for recovery",
      source: "periodisation",
      enabled: true,
    });
  } else {
    const nextWeekNum = weekNum + 1;
    const blockNum = getBlockNumber(nextWeekNum, progressDB.phaseOffset);
    const blockWeek = getBlockWeek(nextWeekNum, progressDB.phaseOffset);
    const desc = phase.description.split(".")[0];
    items.push({
      id: id("period"),
      label: held
        ? `Holding at ${phase.label} — not enough sessions to advance`
        : `Block ${blockNum}, Week ${blockWeek}/3 — ${phase.label}: ${desc}`,
      source: "periodisation",
      enabled: true,
    });
  }

  // ── Cycle phase ──

  if (cycleType === "regular") {
    const cyclePhase = getCurrentPhase(cycle.periodLog, cycle.avgLength);
    if (cyclePhase) {
      const note = cyclePhase.trainingNote.split(".")[0];
      items.push({
        id: id("cycle"),
        label: `${cyclePhase.label} phase (day ${cyclePhase.day}) — ${note}`,
        source: "cycle",
        enabled: true,
      });
    }
  } else if (cycleType === "perimenopause") {
    items.push({
      id: id("cycle"),
      label: "Perimenopause — prioritising recovery and joint care",
      source: "cycle",
      enabled: true,
    });
  }

  // ── Conditions ──

  const condNote = getConditionCoachNote(conditions);
  if (condNote) {
    items.push({
      id: id("cond"),
      label: condNote,
      source: "condition",
      enabled: true,
    });
  }

  // ── Outside activities ──

  const actNote = getActivityCoachNote(outsideActivities, outsideActivityFocus);
  if (actNote) {
    items.push({
      id: id("activity"),
      label: actNote,
      source: "activity",
      enabled: true,
    });
  }

  return items;
}
