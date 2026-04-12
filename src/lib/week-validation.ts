import { EXERCISE_LIBRARY, type Exercise as LibExercise } from "@/data/exercise-library";
import { EXERCISE_INDICATIONS } from "@/data/exercise-indications";
import { INJURY_SWAPS } from "@/data/injury-swaps";
import type { WeekData, WeekDay, Exercise } from "./week-builder";

export interface ValidationIssue {
  type: "unknown_exercise" | "equipment_mismatch" | "injury_conflict" | "experience_mismatch" | "exercise_count" | "structural" | "duplicate_exercise";
  dayNumber: number;
  exercise?: string;
  detail: string;
  repaired: boolean;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  weekData: WeekData; // repaired version
}

const exerciseByName = new Map<string, LibExercise>();
const exerciseNamesLower = new Map<string, string>();
for (const ex of EXERCISE_LIBRARY) {
  exerciseByName.set(ex.name, ex);
  exerciseNamesLower.set(ex.name.toLowerCase(), ex.name);
}

/** Validate an AI-generated week and auto-repair what we can. */
export function validateWeek(
  weekData: WeekData,
  userEquip: string[],
  userInjuries: string[],
  userExp: string,
  expectedExCount: number,
  latestFeedback?: { effort: number; soreness: number } | null,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const repaired = structuredClone(weekData);

  for (const day of repaired.days) {
    if (day.isRest) continue;

    validateExerciseNames(day, issues);
    validateEquipment(day, userEquip, userExp, issues);
    validateExperience(day, userExp, userEquip, issues);
    validateInjuries(day, userInjuries, userEquip, userExp, issues);
    validateDuplicates(day, issues);
    validateExerciseCount(day, expectedExCount, issues);
  }

  validateCrossDayDuplicates(repaired, issues);
  validateVolumeThresholds(repaired, latestFeedback ?? null, issues);
  validateStructure(repaired, issues);

  return {
    valid: issues.length === 0,
    issues,
    weekData: repaired,
  };
}

function validateExerciseNames(day: WeekDay, issues: ValidationIssue[]): void {
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const ex = day.exercises[i];
    if (exerciseByName.has(ex.name)) continue;

    const canonical = exerciseNamesLower.get(ex.name.toLowerCase());
    if (canonical) {
      ex.name = canonical;
      continue;
    }

    const fuzzy = fuzzyMatchExercise(ex.name);
    if (fuzzy) {
      issues.push({
        type: "unknown_exercise",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" not in library — matched to "${fuzzy}"`,
        repaired: true,
      });
      ex.name = fuzzy;
      continue;
    }

    issues.push({
      type: "unknown_exercise",
      dayNumber: day.dayNumber,
      exercise: ex.name,
      detail: `"${ex.name}" not in library — removed`,
      repaired: true,
    });
    day.exercises.splice(i, 1);
  }
}

function fuzzyMatchExercise(aiName: string): string | null {
  const normalised = aiName.toLowerCase().replace(/[^a-z\s]/g, "").trim();

  const ALIASES: Record<string, string> = {
    "barbell squat": "Barbell Back Squat",
    "back squat": "Barbell Back Squat",
    "squat": "Barbell Back Squat",
    "bench press": "Barbell Bench Press",
    "flat bench press": "Barbell Bench Press",
    "flat bench": "Barbell Bench Press",
    "deadlift": "Conventional Deadlift",
    "rdl": "Romanian Deadlift",
    "barbell rdl": "Romanian Deadlift",
    "dumbbell rdl": "Dumbbell Romanian Deadlift",
    "db rdl": "Dumbbell Romanian Deadlift",
    "ohp": "Overhead Press",
    "military press": "Overhead Press",
    "pullup": "Pull-Up",
    "pull up": "Pull-Up",
    "chin up": "Chin-Up",
    "chinup": "Chin-Up",
    "cable row": "Seated Cable Row",
    "chest supported row": "Chest-Supported Row",
    "face pull": "Face Pulls",
    "face pulls": "Face Pulls",
    "dumbbell curl": "Dumbbell Curl",
    "barbell curl": "Barbell Curl",
    "bicep curl": "Dumbbell Curl",
    "db bench press": "Dumbbell Bench Press",
    "dumbbell flat bench press": "Dumbbell Bench Press",
    "db shoulder press": "Dumbbell Shoulder Press",
    "db row": "Dumbbell Row",
    "incline bench press": "Incline Barbell Press",
    "incline bench": "Incline Barbell Press",
    "incline db press": "Incline Dumbbell Press",
    "incline dumbbell bench press": "Incline Dumbbell Press",
    "lat pull down": "Lat Pulldown",
    "lat pull-down": "Lat Pulldown",
    "hip thrust": "Hip Thrust",
    "barbell hip thrust": "Hip Thrust",
    "glute bridge": "Glute Bridge",
    "step ups": "Step-Ups",
    "step up": "Step-Ups",
    "box jump": "Box Jumps",
    "box jumps": "Box Jumps",
    "calf raise": "Calf Raises",
    "calf raises": "Calf Raises",
    "farmers walk": "Farmers Carry",
    "farmer carry": "Farmers Carry",
    "farmers carry": "Farmers Carry",
    "skull crusher": "Skull Crushers",
    "skull crushers": "Skull Crushers",
    "tricep extension": "Overhead Tricep Extension",
    "cable lateral raise": "Cable Lateral Raise",
    "rear delt fly": "Rear Delt Fly Machine",
    "reverse fly": "Rear Delt Fly Machine",
    "leg curl": "Leg Curl",
    "hamstring curl": "Leg Curl",
    "leg extension": "Leg Extension",
    "quad extension": "Leg Extension",
    "hip abduction": "Hip Abduction Machine",
    "hip adduction": "Hip Adduction Machine",
    "kettlebell swing": "Kettlebell Swing",
    "kb swing": "Kettlebell Swing",
    "plank": "Plank",
    "dead bug": "Dead Bug",
    "bird dog": "Bird Dog",
  };

  if (ALIASES[normalised]) return ALIASES[normalised];

  for (const [, libEx] of exerciseByName) {
    const libLower = libEx.name.toLowerCase();
    if (normalised.includes(libLower) || libLower.includes(normalised)) {
      return libEx.name;
    }
  }

  return null;
}

function validateEquipment(
  day: WeekDay,
  userEquip: string[],
  userExp: string,
  issues: ValidationIssue[],
): void {
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const ex = day.exercises[i];
    const libEx = exerciseByName.get(ex.name);
    if (!libEx) continue;

    const hasEquip = libEx.equip.some((e) => userEquip.includes(e));
    if (hasEquip) continue;

    const replacement = findEquipmentAlternative(libEx, userEquip, userExp, day.exercises);
    if (replacement) {
      issues.push({
        type: "equipment_mismatch",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" requires ${libEx.equip.join("/")} — swapped to "${replacement.name}"`,
        repaired: true,
      });
      ex.name = replacement.name;
    } else {
      issues.push({
        type: "equipment_mismatch",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" requires ${libEx.equip.join("/")} — no alternative found, removed`,
        repaired: true,
      });
      day.exercises.splice(i, 1);
    }
  }
}

function findEquipmentAlternative(
  original: LibExercise,
  userEquip: string[],
  userExp: string,
  currentExercises: Exercise[],
): LibExercise | null {
  const currentNames = new Set(currentExercises.map((e) => e.name));
  const userRank = EXPERIENCE_RANK[userExp] ?? 0;

  const candidates = EXERCISE_LIBRARY.filter((e) => {
    if (e.muscle !== original.muscle || e.name === original.name) return false;
    if (currentNames.has(e.name)) return false;
    if (!e.equip.some((eq) => userEquip.includes(eq))) return false;
    const ind = EXERCISE_INDICATIONS[e.name];
    if (ind?.experience?.min && (EXPERIENCE_RANK[ind.experience.min] ?? 0) > userRank) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const sameTag = candidates.find((c) =>
    c.tags.some((t) => original.tags.includes(t)),
  );
  return sameTag || candidates[0];
}

const EXPERIENCE_RANK: Record<string, number> = { new: 0, developing: 1, intermediate: 2 };

function validateExperience(
  day: WeekDay,
  userExp: string,
  userEquip: string[],
  issues: ValidationIssue[],
): void {
  const userRank = EXPERIENCE_RANK[userExp] ?? 0;
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const ex = day.exercises[i];
    const ind = EXERCISE_INDICATIONS[ex.name];
    if (!ind || !ind.experience?.min) continue;
    const minRank = EXPERIENCE_RANK[ind.experience.min] ?? 0;
    if (userRank >= minRank) continue;

    const libEx = exerciseByName.get(ex.name);
    if (!libEx) continue;

    const replacement = findExperienceAlternative(libEx, userExp, userEquip, day.exercises);
    if (replacement) {
      issues.push({
        type: "experience_mismatch",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" requires ${ind.experience.min} — swapped to "${replacement.name}"`,
        repaired: true,
      });
      ex.name = replacement.name;
    } else {
      issues.push({
        type: "experience_mismatch",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" requires ${ind.experience.min} — no alternative found, removed`,
        repaired: true,
      });
      day.exercises.splice(i, 1);
    }
  }
}

function findExperienceAlternative(
  original: LibExercise,
  userExp: string,
  userEquip: string[],
  currentExercises: Exercise[],
): LibExercise | null {
  const userRank = EXPERIENCE_RANK[userExp] ?? 0;
  const currentNames = new Set(currentExercises.map((e) => e.name));

  const candidates = EXERCISE_LIBRARY.filter((e) => {
    if (e.muscle !== original.muscle || e.name === original.name) return false;
    if (currentNames.has(e.name)) return false;
    if (!e.equip.some((eq) => userEquip.includes(eq))) return false;
    const ind = EXERCISE_INDICATIONS[e.name];
    if (!ind) return true; // no indication = no restriction
    if (ind.experience?.min && (EXPERIENCE_RANK[ind.experience.min] ?? 0) > userRank) return false;
    return true;
  });

  if (candidates.length === 0) return null;
  const sameTag = candidates.find((c) => c.tags.some((t) => original.tags.includes(t)));
  return sameTag || candidates[0];
}

function validateInjuries(
  day: WeekDay,
  injuries: string[],
  userEquip: string[],
  userExp: string,
  issues: ValidationIssue[],
): void {
  if (injuries.length === 0) return;

  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const ex = day.exercises[i];

    for (const injury of injuries) {
      const swaps = INJURY_SWAPS[injury];
      if (!swaps || !swaps[ex.name]) continue;

      const swapTarget = swaps[ex.name];

      const swapLib = exerciseByName.get(swapTarget);
      if (swapLib && swapLib.equip.some((e) => userEquip.includes(e))) {
        const alreadyInSession = day.exercises.some(
          (e, idx) => idx !== i && e.name === swapTarget,
        );
        if (!alreadyInSession) {
          issues.push({
            type: "injury_conflict",
            dayNumber: day.dayNumber,
            exercise: ex.name,
            detail: `"${ex.name}" conflicts with ${injury} injury — swapped to "${swapTarget}"`,
            repaired: true,
          });
          ex.name = swapTarget;
          break;
        }
      }

      const libEx = exerciseByName.get(ex.name);
      if (libEx) {
        const alt = findEquipmentAlternative(libEx, userEquip, userExp, day.exercises);
        if (alt) {
          let altConflicts = false;
          for (const inj of injuries) {
            if (INJURY_SWAPS[inj]?.[alt.name]) {
              altConflicts = true;
              break;
            }
          }
          if (!altConflicts) {
            issues.push({
              type: "injury_conflict",
              dayNumber: day.dayNumber,
              exercise: ex.name,
              detail: `"${ex.name}" conflicts with ${injury} — swap target "${swapTarget}" incompatible with equipment — using "${alt.name}"`,
              repaired: true,
            });
            ex.name = alt.name;
            break;
          }
        }
      }

      issues.push({
        type: "injury_conflict",
        dayNumber: day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" conflicts with ${injury} — no viable alternative, removed`,
        repaired: true,
      });
      day.exercises.splice(i, 1);
      break;
    }
  }
}

/**
 * Canonical movement key — strips variant modifiers so that near-duplicates
 * ("Leg Curl" vs "Seated Leg Curl", "Barbell Row" vs "Bent-Over Barbell Row")
 * collapse to the same signature. Used by validateDuplicates to prevent
 * programming two versions of the same movement in one session.
 */
function movementKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(seated|standing|lying|prone|supine|incline|decline|flat|kneeling|half[- ]?kneeling|single[- ]?leg|single[- ]?arm|unilateral|bilateral|close[- ]?grip|wide[- ]?grip|neutral[- ]?grip|reverse[- ]?grip|bent[- ]?over|cable|machine|barbell|dumbbell|kettlebell|smith[- ]?machine|trap[- ]?bar|ez[- ]?bar|landmine|banded|weighted|bodyweight)\b/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateDuplicates(day: WeekDay, issues: ValidationIssue[]): void {
  const seenExact = new Set<string>();
  const seenKey = new Map<string, string>(); // movement key -> kept name

  // Reverse pass for exact duplicates (removal) — keeps the first
  // occurrence and strips later ones which are LLM generation errors.
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const name = day.exercises[i].name;
    if (seenExact.has(name)) {
      issues.push({
        type: "duplicate_exercise",
        dayNumber: day.dayNumber,
        exercise: name,
        detail: `"${name}" appears more than once in session — duplicate removed`,
        repaired: true,
      });
      day.exercises.splice(i, 1);
    } else {
      seenExact.add(name);
    }
  }

  // Forward pass for near-duplicates (same movement pattern, different
  // equipment variant) — these are real exercises so we flag as droppable
  // rather than removing, letting the user decide.
  for (let i = 0; i < day.exercises.length; i++) {
    const name = day.exercises[i].name;
    const key = movementKey(name);
    if (!key) continue;

    if (seenKey.has(key) && seenKey.get(key) !== name) {
      day.exercises[i].droppable = true;
      day.exercises[i].droppableReason = `Overlaps with ${seenKey.get(key)} — same movement, different variant`;
      issues.push({
        type: "duplicate_exercise",
        dayNumber: day.dayNumber,
        exercise: name,
        detail: `"${name}" overlaps with "${seenKey.get(key)}" (same movement) — marked as droppable`,
        repaired: true,
      });
    } else if (!seenKey.has(key)) {
      seenKey.set(key, name);
    }
  }
}

/**
 * Cross-day duplicate detection: when the exact same exercise appears on
 * multiple training days as an accessory, the later occurrence is flagged
 * as droppable. Equipment variations (Barbell Row vs Dumbbell Row) are
 * fine — only exact name matches are caught.
 *
 * Primary compounds (first exercise of each session) are exempt — it's
 * normal and intentional to squat or bench on multiple days.
 */
function validateCrossDayDuplicates(weekData: WeekData, issues: ValidationIssue[]): void {
  // Map: exact exercise name → { dayNumber } of the first occurrence.
  const seen = new Map<string, number>();

  for (const day of weekData.days) {
    if (day.isRest || day.exercises.length === 0) continue;

    for (let i = 0; i < day.exercises.length; i++) {
      const ex = day.exercises[i];
      if (ex.droppable) continue; // already flagged within-session
      const name = ex.name;

      // Exempt the primary compound (first exercise) — repeating squats
      // or deadlifts across days is expected programming.
      if (i === 0) {
        if (!seen.has(name)) seen.set(name, day.dayNumber);
        continue;
      }

      const firstDay = seen.get(name);
      if (firstDay !== undefined && firstDay !== day.dayNumber) {
        ex.droppable = true;
        ex.droppableReason = `Already in your day ${firstDay} session`;
        issues.push({
          type: "duplicate_exercise",
          dayNumber: day.dayNumber,
          exercise: name,
          detail: `"${name}" already appears on day ${firstDay} — marked as droppable`,
          repaired: true,
        });
      } else if (firstDay === undefined) {
        seen.set(name, day.dayNumber);
      }
    }
  }
}

// ── Volume-aware droppable flagging ──────────────────────────────────────

type RecoveryTier = "poor" | "reduced" | "normal" | "good";

function deriveRecoveryTier(
  feedback: { effort: number; soreness: number } | null,
): RecoveryTier {
  if (!feedback) return "normal";
  if (feedback.effort <= 1 || feedback.soreness >= 4) return "poor";
  if (feedback.effort <= 2 || feedback.soreness >= 3) return "reduced";
  if (feedback.effort >= 4 && feedback.soreness <= 1) return "good";
  return "normal";
}

const BUDGET_MULTIPLIER: Record<RecoveryTier, number> = {
  poor: 0.70,
  reduced: 0.85,
  normal: 1.00,
  good: 1.10,
};

/** Base FWS (fatigue-weighted sets) budget per movement key per week. */
const BASE_FWS_BUDGET = 30;

/**
 * Volume-aware droppable flagging. Accumulates fatigue-weighted sets (FWS)
 * per movement key across the entire week. When a key exceeds its budget
 * (adjusted by recovery tier), later accessory exercises are flagged
 * droppable with a user-facing reason.
 *
 * An exercise's FWS = parseInt(sets) × fatigueCost. A f5 deadlift at 3
 * sets = 15 FWS; a f2 curl at 3 sets = 6. This naturally makes heavy
 * compounds consume budget faster.
 */
function validateVolumeThresholds(
  weekData: WeekData,
  feedback: { effort: number; soreness: number } | null,
  issues: ValidationIssue[],
): void {
  const tier = deriveRecoveryTier(feedback);
  const budget = Math.round(BASE_FWS_BUDGET * BUDGET_MULTIPLIER[tier]);

  // Pass 1: accumulate FWS per movementKey, track exercise refs in order.
  type ExRef = { day: WeekDay; idx: number; key: string; fws: number; isPrimary: boolean };
  const keyVolume = new Map<string, number>();
  const exRefs: ExRef[] = [];

  for (const day of weekData.days) {
    if (day.isRest) continue;
    for (let i = 0; i < day.exercises.length; i++) {
      const ex = day.exercises[i];
      const key = movementKey(ex.name);
      if (!key) continue;

      const fc = EXERCISE_INDICATIONS[ex.name]?.fatigueCost ?? 3;
      const sets = parseInt(ex.sets) || 3;
      const fws = sets * fc;

      keyVolume.set(key, (keyVolume.get(key) || 0) + fws);
      exRefs.push({ day, idx: i, key, fws, isPrimary: i === 0 });
    }
  }

  // Pass 2: flag excess exercises for each over-budget key.
  // Order: last-in first, accessories before primaries, protect at least one.
  for (const [key, totalFws] of keyVolume) {
    if (totalFws <= budget) continue;

    const refs = exRefs.filter((r) => r.key === key);
    let running = totalFws;

    // First pass: non-primary exercises, reverse order
    for (let j = refs.length - 1; j >= 0; j--) {
      if (running <= budget) break;
      const ref = refs[j];
      const ex = ref.day.exercises[ref.idx];
      if (ref.isPrimary || ex.droppable) continue;

      ex.droppable = true;
      ex.droppableReason =
        tier === "poor" || tier === "reduced"
          ? `Recovery is low — reducing ${key} volume this week`
          : `Plenty of ${key} work this week — skip if short on time`;
      running -= ref.fws;

      issues.push({
        type: "duplicate_exercise",
        dayNumber: ref.day.dayNumber,
        exercise: ex.name,
        detail: `"${ex.name}" pushes ${key} to ${totalFws} FWS (budget ${budget}) — droppable`,
        repaired: true,
      });
    }

    // Second pass: if still over, flag primary positions (protect the first one)
    if (running > budget) {
      let protectedFirst = false;
      for (let j = refs.length - 1; j >= 0; j--) {
        if (running <= budget) break;
        const ref = refs[j];
        const ex = ref.day.exercises[ref.idx];
        if (!ref.isPrimary || ex.droppable) continue;

        if (!protectedFirst) { protectedFirst = true; continue; }

        ex.droppable = true;
        ex.droppableReason =
          tier === "poor"
            ? `Your body needs more recovery — consider skipping this`
            : `${key} volume is high this week`;
        running -= ref.fws;

        issues.push({
          type: "duplicate_exercise",
          dayNumber: ref.day.dayNumber,
          exercise: ex.name,
          detail: `"${ex.name}" (primary) pushes ${key} to ${totalFws} FWS (budget ${budget}) — droppable`,
          repaired: true,
        });
      }
    }
  }
}

function validateExerciseCount(
  day: WeekDay,
  expected: number,
  issues: ValidationIssue[],
): void {
  const actual = day.exercises.length;
  if (actual === expected) return;

  if (Math.abs(actual - expected) <= 1) return;

  issues.push({
    type: "exercise_count",
    dayNumber: day.dayNumber,
    detail: `Expected ~${expected} exercises, got ${actual}`,
    repaired: false,
  });
}

function validateStructure(
  weekData: WeekData,
  issues: ValidationIssue[],
): void {
  if (weekData.days.length !== 7) {
    issues.push({
      type: "structural",
      dayNumber: 0,
      detail: `Expected 7 days, got ${weekData.days.length}`,
      repaired: false,
    });
  }

  const dayNums = weekData.days.map((d) => d.dayNumber).sort();
  const expected = [1, 2, 3, 4, 5, 6, 7];
  if (JSON.stringify(dayNums) !== JSON.stringify(expected)) {
    issues.push({
      type: "structural",
      dayNumber: 0,
      detail: `Day numbers should be 1-7, got ${dayNums.join(",")}`,
      repaired: false,
    });
  }

  for (const day of weekData.days) {
    if (!day.isRest && day.exercises.length === 0) {
      issues.push({
        type: "structural",
        dayNumber: day.dayNumber,
        detail: "Training day has no exercises",
        repaired: false,
      });
    }
  }

  for (const day of weekData.days) {
    if (day.isRest && day.exercises.length > 0) {
      issues.push({
        type: "structural",
        dayNumber: day.dayNumber,
        detail: "Rest day has exercises — clearing them",
        repaired: true,
      });
      day.exercises = [];
    }
  }

  if (!weekData.programName) {
    issues.push({
      type: "structural",
      dayNumber: 0,
      detail: "Missing programName",
      repaired: false,
    });
  }
}
