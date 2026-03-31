import { EXERCISE_LIBRARY, type Exercise as LibExercise } from "@/data/exercise-library";
import { INJURY_SWAPS } from "@/data/injury-swaps";
import type { WeekData, WeekDay, Exercise } from "./week-builder";

export interface ValidationIssue {
  type: "unknown_exercise" | "equipment_mismatch" | "injury_conflict" | "exercise_count" | "structural" | "duplicate_exercise";
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
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const repaired = structuredClone(weekData);

  for (const day of repaired.days) {
    if (day.isRest) continue;

    validateExerciseNames(day, issues);
    validateEquipment(day, userEquip, issues);
    validateInjuries(day, userInjuries, userEquip, issues);
    validateDuplicates(day, issues);
    validateExerciseCount(day, expectedExCount, issues);
  }

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
  issues: ValidationIssue[],
): void {
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const ex = day.exercises[i];
    const libEx = exerciseByName.get(ex.name);
    if (!libEx) continue;

    const hasEquip = libEx.equip.some((e) => userEquip.includes(e));
    if (hasEquip) continue;

    const replacement = findEquipmentAlternative(libEx, userEquip, day.exercises);
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
  currentExercises: Exercise[],
): LibExercise | null {
  const currentNames = new Set(currentExercises.map((e) => e.name));

  const candidates = EXERCISE_LIBRARY.filter(
    (e) =>
      e.muscle === original.muscle &&
      e.name !== original.name &&
      !currentNames.has(e.name) &&
      e.equip.some((eq) => userEquip.includes(eq)),
  );

  if (candidates.length === 0) return null;

  const sameTag = candidates.find((c) =>
    c.tags.some((t) => original.tags.includes(t)),
  );
  return sameTag || candidates[0];
}

function validateInjuries(
  day: WeekDay,
  injuries: string[],
  userEquip: string[],
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
        const alt = findEquipmentAlternative(libEx, userEquip, day.exercises);
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

function validateDuplicates(day: WeekDay, issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  for (let i = day.exercises.length - 1; i >= 0; i--) {
    const name = day.exercises[i].name;
    if (seen.has(name)) {
      issues.push({
        type: "duplicate_exercise",
        dayNumber: day.dayNumber,
        exercise: name,
        detail: `"${name}" appears more than once in session — duplicate removed`,
        repaired: true,
      });
      day.exercises.splice(i, 1);
    } else {
      seen.add(name);
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
