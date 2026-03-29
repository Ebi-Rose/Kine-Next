// ── Warmup & Cooldown Engine ──
// Ported from kine/src/features/warmup/warmup-engine.js

import { SESSION_MUSCLE_FOCUS } from "@/data/session-muscle-focus";
import { findExercise } from "@/data/exercise-library";
import {
  WARMUP_GENERAL,
  WARMUP_ACTIVATION,
  WARMUP_STABILISER_EXTRAS,
  WARMUP_INJURY_MODS,
  WARMUP_CONDITION_MODS,
  COOLDOWN_BREATH,
  COOLDOWN_RESET,
  COOLDOWN_EXERCISE_RELEASE,
  type WarmupItem,
} from "@/data/warmup-data";

export interface RampSet {
  label: string;
  spec: string;
}

interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  load?: string;
}

export interface WarmupResult {
  general: WarmupItem[];
  activation: WarmupItem[];
  stabiliserExtra: WarmupItem | null;
  injuryItems: WarmupItem[];
  conditionItems: WarmupItem[];
  rampSets: RampSet[];
  totalMin: number;
  firstExName: string | null;
}

export interface CooldownResult {
  breath: WarmupItem[];
  reset: WarmupItem[];
  exerciseRelease: WarmupItem | null;
  totalMin: number;
}

/** Build ramp-up sets for the first compound exercise */
export function buildRampSets(firstEx: Exercise | null, expLevel: string): RampSet[] {
  if (!firstEx) return [];
  const name = firstEx.name || "";

  // Only ramp barbell / compound movements
  const isCompound = /squat|deadlift|bench|press|row|pull|hinge|lunge|dip/i.test(name);
  if (!isCompound) return [];

  // Skip ramp for bodyweight exercises
  const lib = findExercise(name);
  const isBW = lib?.logType === "bodyweight" || lib?.logType === "bodyweight_unilateral" || lib?.logType === "timed";
  if (isBW) return [];

  if (expLevel === "new") {
    return [
      { label: "Empty bar", spec: "\u00d710 - focus on movement pattern" },
      { label: "50%", spec: "\u00d75 - add a little weight, same form" },
    ];
  } else if (expLevel === "developing") {
    return [
      { label: "Empty bar", spec: "\u00d78" },
      { label: "40%", spec: "\u00d75" },
      { label: "65%", spec: "\u00d73" },
    ];
  } else {
    return [
      { label: "Empty bar", spec: "\u00d75" },
      { label: "40%", spec: "\u00d75" },
      { label: "60%", spec: "\u00d73" },
      { label: "80%", spec: "\u00d71 - then into work sets" },
    ];
  }
}

/** Swap a flagged item for its first safe alt, or remove it */
function applyComfortFilter(items: WarmupItem[], comfortFlags: string[]): WarmupItem[] {
  if (comfortFlags.length === 0) return items;
  const isImpact = comfortFlags.includes("impactSensitive");
  const isProne = comfortFlags.includes("proneSensitive");

  return items.reduce<WarmupItem[]>((out, item) => {
    if ((isImpact && item._highImpact) || (isProne && item._prone)) {
      // Try to find a safe alt
      const safeAlt = item.alts?.find(
        (a) => !(isImpact && a._highImpact) && !(isProne && a._prone),
      );
      if (safeAlt) out.push({ ...safeAlt, alts: item.alts });
      // else: drop the item entirely
    } else {
      // Also filter flagged items out of alts
      if (item.alts?.length) {
        const safeAlts = item.alts.filter(
          (a) => !(isImpact && a._highImpact) && !(isProne && a._prone),
        );
        out.push({ ...item, alts: safeAlts.length ? safeAlts : undefined });
      } else {
        out.push(item);
      }
    }
    return out;
  }, []);
}

/** Build warmup for a session */
export function buildWarmup(
  sessionTitle: string,
  exercises: Exercise[],
  injuries: string[],
  expLevel: string,
  conditions: string[] = [],
  comfortFlags: string[] = [],
): WarmupResult {
  const focus = SESSION_MUSCLE_FOCUS[sessionTitle] || ["push", "pull", "legs", "hinge"];
  const allFocus = [...new Set(focus)];
  const firstEx = exercises[0] || null;

  // General prep - 2 items from primary focus
  const primaryFocus = allFocus[0] || "push";
  const general = (WARMUP_GENERAL[primaryFocus] || WARMUP_GENERAL.push || []).slice(0, 2);

  // Activation - 1 item per focus group, cap at 3
  const activation: WarmupItem[] = [];
  const seenActivation = new Set<string>();
  for (const g of allFocus) {
    const items = WARMUP_ACTIVATION[g] || [];
    for (const item of items) {
      if (activation.length >= 3) break;
      if (!seenActivation.has(item.name)) {
        activation.push(item);
        seenActivation.add(item.name);
        break; // one per group
      }
    }
  }

  // Stabiliser extras - exercise-specific, first compound
  let stabiliserExtra: WarmupItem | null = null;
  for (const ex of exercises) {
    if (WARMUP_STABILISER_EXTRAS[ex.name]) {
      stabiliserExtra = WARMUP_STABILISER_EXTRAS[ex.name];
      break;
    }
  }
  // Don't duplicate if already in activation
  if (stabiliserExtra && activation.find((a) => a.name === stabiliserExtra!.name)) {
    stabiliserExtra = null;
  }

  // Injury mods - cap at 2
  let injuryItems: WarmupItem[] = [];
  for (const inj of injuries || []) {
    for (const item of WARMUP_INJURY_MODS[inj] || []) {
      if (!injuryItems.find((i) => i.name === item.name)) {
        injuryItems.push(item);
      }
    }
  }
  injuryItems = injuryItems.slice(0, 2);

  // Condition mods - cap at 2, deduped against injury items
  let conditionItems: WarmupItem[] = [];
  for (const cond of conditions || []) {
    for (const item of WARMUP_CONDITION_MODS[cond] || []) {
      if (!conditionItems.find((i) => i.name === item.name) && !injuryItems.find((i) => i.name === item.name)) {
        conditionItems.push(item);
      }
    }
  }
  conditionItems = conditionItems.slice(0, 2);

  // Ramp-up sets
  const rampSets = buildRampSets(firstEx, expLevel);

  // Apply comfort filters (impactSensitive / proneSensitive)
  const filteredGeneral = applyComfortFilter(general, comfortFlags);
  const filteredActivation = applyComfortFilter(activation, comfortFlags);
  const filteredInjury = applyComfortFilter(injuryItems, comfortFlags);
  const filteredCondition = applyComfortFilter(conditionItems, comfortFlags);

  // Filter stabiliser extra too
  if (stabiliserExtra && comfortFlags.length > 0) {
    const isImpact = comfortFlags.includes("impactSensitive");
    const isProne = comfortFlags.includes("proneSensitive");
    if ((isImpact && stabiliserExtra._highImpact) || (isProne && stabiliserExtra._prone)) {
      stabiliserExtra = null;
    }
  }

  // Total time
  const allItems = [...filteredGeneral, ...filteredActivation, ...(stabiliserExtra ? [stabiliserExtra] : []), ...filteredInjury, ...filteredCondition];
  let totalSec = allItems.reduce((acc, item) => acc + (parseInt(item.duration) || 45), 0);
  if (rampSets.length) totalSec += rampSets.length * 90;
  const totalMin = Math.ceil(totalSec / 60);

  return { general: filteredGeneral, activation: filteredActivation, stabiliserExtra, injuryItems: filteredInjury, conditionItems: filteredCondition, rampSets, totalMin, firstExName: firstEx?.name || null };
}

/** Build cooldown for a session */
export function buildCooldown(
  sessionTitle: string,
  exercises: Exercise[],
): CooldownResult {
  const focus = SESSION_MUSCLE_FOCUS[sessionTitle] || ["push", "pull", "legs", "hinge"];
  const allFocus = [...new Set(focus)];
  const primaryFocus = allFocus[0] || "push";

  // Breathwork - always 1 item
  const breath = COOLDOWN_BREATH.slice(0, 1);

  // Movement reset - 2 items from primary focus
  const reset = (COOLDOWN_RESET[primaryFocus] || COOLDOWN_RESET.push || []).slice(0, 2);

  // Exercise-specific release - first compound
  let exerciseRelease: WarmupItem | null = null;
  for (const ex of exercises) {
    if (COOLDOWN_EXERCISE_RELEASE[ex.name]) {
      exerciseRelease = COOLDOWN_EXERCISE_RELEASE[ex.name];
      break;
    }
  }

  // Total time
  const allItems = [...breath, ...reset, ...(exerciseRelease ? [exerciseRelease] : [])];
  const totalSec = allItems.reduce((acc, item) => acc + (parseInt(item.duration) || 60), 0);
  const totalMin = Math.ceil(totalSec / 60);

  return { breath, reset, exerciseRelease, totalMin };
}
