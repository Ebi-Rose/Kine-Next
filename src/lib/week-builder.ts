// ── AI Week Builder ──
// Generates a personalised training week via Claude API

import { apiFetchStreaming, apiErrorMessage } from "./api";
import { useKineStore } from "@/store/useKineStore";
import {
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
  PROGRAM_MAP,
  INJURY_OPTIONS,
  CONDITION_OPTIONS,
} from "@/data/constants";
import { getCycleContext } from "./cycle";
import { getPhaseContext } from "./periodisation";
import { getConditionContext } from "./condition-context";
import { validateWeek } from "./week-validation";
import { EXERCISE_LIBRARY } from "@/data/exercise-library";
import { INJURY_SWAPS, CONDITION_SWAPS, applyInjurySwaps, applyConditionSwaps } from "@/data/injury-swaps";
import { WEEKLY_SPLITS } from "@/data/weekly-splits";

// ── Types ──

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  load?: string;
}

export interface WeekDay {
  dayNumber: number;
  isRest: boolean;
  sessionTitle: string;
  sessionDuration: string;
  coachNote: string;
  sessionWhy?: string;
  sessionContext?: string;
  exercises: Exercise[];
}

export interface WeekData {
  programName: string;
  weekCoachNote: string;
  days: WeekDay[];
  _weekNum?: number;
  _isFallback?: boolean;
}

// ── System Prompt ──

const SYSTEM_PROMPT = `You are Kinē - an intelligent strength and conditioning coach. Generate structured training programs. Return only valid JSON. No markdown, no code fences, no explanation.

VOICE RULES: No jargon - never use stimulus, hypertrophy, CNS, eccentric, bilateral, progressive overload, or adaptation. weekCoachNote is 2 sentences max: what this week focuses on and what to expect. coachNote per session is 1 sentence leading with what matters most for her goal today. Sound like a coach talking to someone she knows - direct, specific, warm but honest. Never academic, never a motivational poster.

PROGRAMMING PHILOSOPHY: This app is female-first. Exercise selection must reflect this. Prioritise posterior chain development (glutes, hamstrings, upper back) - these are the primary training goals for most users and are chronically undertrained in generic programs. Hip thrust, Romanian deadlift, hip hinge variations, and single-leg work belong in lower body sessions as primary movements, not accessories. Avoid anterior chain bias: bench press and overhead pressing are secondary unless the user has a push-specific goal. Include face pulls, band pull-aparts, or rear delt work in every upper body session. Unilateral lower body movements (split squats, single-leg RDL, step-ups) should appear regularly. Avoid naming sessions "Chest Day", "Bro Split", or any male-coded framing. Session titles should be functional: "Lower Body Power", "Posterior Chain", "Upper Body Pull", "Full Body Strength".

TRANSPARENCY: In weekCoachNote, explain the training logic - why this split, why this volume, how sessions are sequenced for recovery.

LOAD RULES: All load suggestions must use real-world weight increments. Barbells go up in 2.5kg. Dumbbells go up in 2kg (6, 8, 10, 12, 14...). Kettlebells go up in 4kg (8, 12, 16, 20...). Machines go up in 2.5kg. Upper body exercises progress slower than lower body for women.

PRINCIPLES:
- BODY TRUST: Train her to trust her body, not doubt it.
- NO GUILT: Never shame missed sessions or imperfect adherence.
- RECOVERY IS TRAINING: Rest days are not wasted days.
- MINIMUM EFFECTIVE CHANGE: Don't change what's working.
- GUIDE, DON'T GATE: Observe, don't grade.`;

// ── Build User Prompt ──

function buildUserPrompt(): string {
  const store = useKineStore.getState();
  const {
    goal,
    exp,
    equip,
    trainingDays,
    duration,
    injuries,
    injuryNotes,
    conditions,
    cycleType,
    cycle,
    progressDB,
    personalProfile,
    dayDurations,
  } = store;

  const goalLabel =
    goal === "muscle"
      ? "physique"
      : goal === "strength"
        ? "strength"
        : "consistency";
  const equipStr = equip.map((e) => EQUIP_LABELS[e] || e).join(", ");
  const daysCount = trainingDays.length;
  const dayNames = trainingDays.map((d) => DAY_LABELS[d]).join(", ");
  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;
  const prog = PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom";

  const injuryStr =
    injuries.length > 0
      ? injuries
          .map((i) => INJURY_OPTIONS.find((o) => o.value === i)?.label || i)
          .join(", ") + (injuryNotes ? `. ${injuryNotes}` : "")
      : "None";

  const conditionCtx = getConditionContext(conditions);

  // Exercise count per session based on duration
  let exCount = 6;
  if (duration === "short") exCount = 4;
  else if (duration === "medium") exCount = 5;
  else if (duration === "long") exCount = 6;
  else if (duration === "extended") exCount = 7;

  const weekNum = progressDB.currentWeek || 1;

  // Cycle context
  const cycleCtx = getCycleContext(cycleType, cycle.periodLog, cycle.avgLength);

  // Phase context
  const phaseCtx = getPhaseContext(weekNum, progressDB.phaseOffset);

  // Weight/body context
  let bodyCtx = "";
  if (personalProfile.weight) bodyCtx += `\n- Bodyweight: ${personalProfile.weight}kg`;
  if (personalProfile.currentLifts && Object.keys(personalProfile.currentLifts).length > 0) {
    const liftsStr = Object.entries(personalProfile.currentLifts)
      .map(([name, w]) => `${name}: ${w}kg`)
      .join(", ");
    bodyCtx += `\n- Current lifts: ${liftsStr}`;
  }

  // Per-day duration context
  let dayDurCtx = "";
  if (Object.keys(dayDurations).length > 0) {
    const durParts = trainingDays.map((d) => {
      const mins = dayDurations[d];
      return mins ? `${DAY_LABELS[d]}: ${mins} min` : null;
    }).filter(Boolean);
    if (durParts.length > 0) dayDurCtx = `\n- Per-day durations: ${durParts.join(", ")}`;
  }

  // Recent session context (last 3 sessions for adaptation)
  let historyCtx = "";
  if (progressDB.sessions.length > 0) {
    const recent = (progressDB.sessions as { title?: string; effort?: number; soreness?: number; dayIdx?: number }[])
      .slice(-3);
    const histLines = recent.map((s) => {
      const day = s.dayIdx !== undefined ? DAY_LABELS[s.dayIdx] : "?";
      return `${day} — ${s.title || "Session"} (effort: ${s.effort || "?"}/4, soreness: ${s.soreness || "?"}/4)`;
    });
    historyCtx = `\n\nRecent sessions:\n${histLines.join("\n")}`;

    // Session-specific guidance for high soreness
    const highSoreness = recent.filter((s) => (s.soreness || 0) >= 3);
    if (highSoreness.length > 0) {
      const names = highSoreness.map((s) => {
        const day = s.dayIdx !== undefined ? DAY_LABELS[s.dayIdx] : "";
        return day ? `${s.title || "Session"} on ${day}` : (s.title || "Session");
      }).join(", ");
      historyCtx += `\nNote: High soreness reported after ${names}. Consider spacing similar muscle groups further apart or reducing volume for those muscle groups next week.`;
    }
  }

  // #11: Week check-in feedback for AI adaptation
  let weekFeedbackCtx = "";
  if (progressDB.weekFeedbackHistory.length > 0) {
    const energyLabels = ["", "Drained", "Low", "Normal", "High"];
    const motivationLabels = ["", "Struggling", "Flat", "Steady", "Fired up"];
    const recentFeedback = progressDB.weekFeedbackHistory.slice(-2);
    const feedbackLines = recentFeedback.map((f) =>
      `Week ${f.weekNum}: energy=${energyLabels[f.effort] || f.effort}/4, motivation=${motivationLabels[f.soreness] || f.soreness}/4${f.notes ? `, notes: "${f.notes}"` : ""}`
    );
    weekFeedbackCtx = `\n\nWeek check-in feedback (adjust volume/intensity accordingly):\n${feedbackLines.join("\n")}`;

    // If most recent feedback shows low energy or motivation, add explicit guidance
    const latest = recentFeedback[recentFeedback.length - 1];
    if (latest.effort <= 2 || latest.soreness <= 2) {
      weekFeedbackCtx += `\nNote: User reported low energy or motivation last week. Consider reducing volume or intensity slightly. Prioritise consistency over progression this week.`;
    }
    if (latest.effort >= 4 && latest.soreness >= 4) {
      weekFeedbackCtx += `\nNote: User feeling great — good window to maintain or slightly increase challenge.`;
    }
  }

  // Build available exercise pool (filtered by equipment + experience)
  const availableExercises = EXERCISE_LIBRARY.filter((ex) => {
    if (!ex.equip.some((e) => equip.includes(e))) return false;
    if (ex.minExp === "intermediate" && exp !== "intermediate") return false;
    if (ex.minExp === "developing" && exp === "new") return false;
    return true;
  });

  const poolByMuscle: Record<string, string[]> = {};
  for (const ex of availableExercises) {
    if (!poolByMuscle[ex.muscle]) poolByMuscle[ex.muscle] = [];
    poolByMuscle[ex.muscle].push(ex.name);
  }
  const poolStr = Object.entries(poolByMuscle)
    .map(([muscle, names]) => `${muscle}: ${names.join(", ")}`)
    .join("\n");

  // Build injury + condition avoidance list
  const avoidExercises = new Set<string>();
  for (const injury of injuries) {
    const swaps = INJURY_SWAPS[injury];
    if (swaps) {
      for (const ex of Object.keys(swaps)) avoidExercises.add(ex);
    }
  }
  for (const cond of conditions) {
    const swaps = CONDITION_SWAPS[cond];
    if (swaps) {
      for (const ex of Object.keys(swaps)) avoidExercises.add(ex);
    }
  }
  let injuryAvoidCtx = "";
  if (avoidExercises.size > 0) {
    injuryAvoidCtx = `\n\nDO NOT USE THESE EXERCISES (injury/condition contraindicated): ${[...avoidExercises].join(", ")}`;
  }

  return `Generate a Week ${weekNum} training program structure as compact JSON.

Trainee:
- Goal: ${goalLabel}
- Level: ${exp}
- Equipment: ${equipStr}
- Schedule: ${daysCount} days/week (${dayNames}), ${durationLabel}
- Injuries: ${injuryStr}${conditionCtx}
- Program: ${prog}
- Sex: Female. Posterior chain priority. Unilateral work. Higher volume tolerance — especially upper body (prescribe +1 set on upper body accessories vs lower body). Women recover faster between sets — rest periods can be shorter than male-derived defaults.${bodyCtx}${dayDurCtx}
${cycleCtx}
${phaseCtx}${historyCtx}${weekFeedbackCtx}${injuryAvoidCtx}

EXERCISE POOL — only use exercises from this list:
${poolStr}

PRESCRIPTION GUIDE (female-optimised — women recover faster between sets and tolerate higher volume at moderate loads):
- Strength: Primary compounds 4-5 sets, 3-6 reps, 2-3 min rest (up to 4 min on peak week only). Upper body accessories 4 sets, 8-12 reps, 60-90s rest. Lower body accessories 3 sets, 8-12 reps, 60-90s rest.
- Muscle: Primary movements 3-4 sets, 8-12 reps, 60-90s rest (up to 2 min for heavy compounds only). Upper body isolation 4 sets, 12-15 reps, 60s rest. Lower body isolation 3 sets, 12-15 reps, 60s rest. VOLUME PROGRESSION: prioritise adding sets across the block (week 1: 3 sets → week 3: 4 sets on primary movements) over adding load. Load increases are secondary — hypertrophy is driven by total weekly volume, not weight on the bar.
- General: All exercises 3 sets, 10-15 reps, 60-90s rest. Keep it simple and undaunting — consistency matters more than intensity.
- Bodyweight exercises: prescribe reps (not weight). Timed exercises: use reps for duration e.g. "30 sec". Cardio: sets "1", reps as duration.

Return ONLY valid JSON, no markdown:
{"programName":"string","weekCoachNote":"2 sentences","days":[{"dayNumber":1,"isRest":false,"sessionTitle":"string","sessionDuration":"string","coachNote":"1 sentence","exercises":[{"name":"Exercise Name","sets":"3","reps":"8-10","rest":"90 sec"}]}]}

Rules: exactly ${daysCount} training days + ${7 - daysCount} rest days across dayNumber 1-7. Each training day has exactly ${exCount} exercises. Rest days: isRest true, exercises []. Use EXACT exercise names from the pool above.`;
}

// ── Parse AI Response ──

function parseWeekJSON(text: string): WeekData {
  // Strip markdown code fences
  const clean = text
    .replace(/^```[\w]*[\s]*/m, "")
    .replace(/[\s]*```$/m, "")
    .trim();

  const j = clean.indexOf("{");
  const k = clean.lastIndexOf("}");
  if (j < 0 || k < 0) {
    throw new Error("No JSON in response: " + clean.slice(0, 100));
  }

  const rawWeek = JSON.parse(clean.slice(j, k + 1));

  // Validate structure
  if (!rawWeek.days || !Array.isArray(rawWeek.days)) {
    throw new Error("Invalid week structure: missing days array");
  }

  return rawWeek as WeekData;
}

// ── Fallback Week ──

function buildFallbackWeek(): WeekData {
  const store = useKineStore.getState();
  const { goal, exp, equip, injuries, conditions, trainingDays, duration } = store;

  const programName = PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom Program";
  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label || "45-60 min";

  const goalKey = goal || "general";
  const expKey = exp || "new";
  const split = WEEKLY_SPLITS[goalKey]?.[expKey];

  let exCount = 5;
  if (duration === "short") exCount = 4;
  else if (duration === "medium") exCount = 5;
  else if (duration === "long") exCount = 6;
  else if (duration === "extended") exCount = 7;

  const days: WeekDay[] = [];
  const trainingDaysSorted = [...trainingDays].sort((a, b) => a - b);

  for (let i = 0; i < 7; i++) {
    const isTraining = trainingDays.includes(i);

    if (isTraining && split) {
      const dayIdx = trainingDaysSorted.indexOf(i);
      const sessionIdx = dayIdx % split.sessions.length;
      const template = split.sessions[sessionIdx];

      const swappedNames = applyEquipmentSwaps(
        applyConditionSwaps(applyInjurySwaps(template.exercises, injuries), conditions),
        equip,
      );

      const exercises = swappedNames.slice(0, exCount).map((name) =>
        buildFallbackPrescription(name, goalKey),
      );

      days.push({
        dayNumber: i + 1,
        isRest: false,
        sessionTitle: template.title,
        sessionDuration: durationLabel,
        coachNote: template.coachNote,
        exercises,
      });
    } else if (isTraining) {
      days.push({
        dayNumber: i + 1,
        isRest: false,
        sessionTitle: "Full Body",
        sessionDuration: durationLabel,
        coachNote: "Your session is ready — tap to start when you are.",
        exercises: buildGenericFallback(equip, goalKey, exCount),
      });
    } else {
      days.push({
        dayNumber: i + 1,
        isRest: true,
        sessionTitle: "Rest & Recovery",
        sessionDuration: "",
        coachNote: "",
        exercises: [],
      });
    }
  }

  return {
    programName,
    weekCoachNote:
      "This is a standard programme based on your selections. It will be replaced with a personalised week when the AI is available.",
    days,
    _isFallback: true,
  };
}

/** Swap exercises that require equipment the user doesn't have */
function applyEquipmentSwaps(exercises: string[], userEquip: string[]): string[] {
  return exercises.map((name) => {
    const libEx = EXERCISE_LIBRARY.find((e) => e.name === name);
    if (!libEx) return name;
    if (libEx.equip.some((e) => userEquip.includes(e))) return name;

    const alt = EXERCISE_LIBRARY.find(
      (e) =>
        e.muscle === libEx.muscle &&
        e.name !== name &&
        e.equip.some((eq) => userEquip.includes(eq)),
    );
    return alt ? alt.name : name;
  });
}

/** Build prescription (sets/reps/rest) based on goal — female-optimised */
function buildFallbackPrescription(name: string, goal: string): Exercise {
  const libEx = EXERCISE_LIBRARY.find((e) => e.name === name);
  const isCompound = libEx?.tags.includes("Compound") ?? true;
  const isBodyweight = libEx?.logType === "bodyweight" || libEx?.logType === "bodyweight_unilateral";
  const isTimed = libEx?.logType === "timed";
  const isUpperBody = libEx?.muscle === "push" || libEx?.muscle === "pull";

  if (isTimed) {
    return { name, sets: "3", reps: "30 sec", rest: "60 sec" };
  }
  if (goal === "strength") {
    if (isCompound) {
      return { name, sets: isBodyweight ? "3" : "4", reps: isBodyweight ? "6-8" : "5-6", rest: "2-3 min" };
    }
    // +1 set for upper body accessories (women benefit from more upper body volume)
    const accSets = isUpperBody ? "4" : "3";
    return { name, sets: accSets, reps: "8-10", rest: "60-90 sec" };
  }
  if (goal === "muscle") {
    if (isCompound) {
      return { name, sets: isBodyweight ? "3" : "3-4", reps: "8-12", rest: "60-90 sec" };
    }
    // +1 set for upper body isolation
    const isoSets = isUpperBody ? "4" : "3";
    return { name, sets: isoSets, reps: "12-15", rest: "60 sec" };
  }
  // General/habit goal: 10-15 reps (wider range, less intimidating, plays to fatigue resistance)
  return { name, sets: "3", reps: isBodyweight ? "10-15" : "10-15", rest: "60-90 sec" };
}

/** Generic full-body fallback when no split template matches */
function buildGenericFallback(equip: string[], goal: string, exCount: number): Exercise[] {
  const hasBarbell = equip.includes("barbell");
  const hasDumbbells = equip.includes("dumbbells");
  const hasMachines = equip.includes("machines");
  const hasKettlebell = equip.includes("kettlebell");

  let names: string[];
  if (hasBarbell) {
    names = ["Barbell Back Squat", "Romanian Deadlift", "Barbell Bench Press", "Barbell Row", "Face Pulls", "Plank", "Lateral Raise"];
  } else if (hasDumbbells) {
    names = ["Goblet Squat", "Dumbbell Romanian Deadlift", "Dumbbell Bench Press", "Dumbbell Row", "Lateral Raise", "Glute Bridge", "Plank"];
  } else if (hasKettlebell) {
    names = ["Goblet Squat", "Kettlebell Swing", "Single-Leg Deadlift", "Push-Up", "Glute Bridge", "Plank", "Bird Dog"];
  } else if (hasMachines) {
    names = ["Leg Press", "Hip Thrust Machine", "Lat Pulldown", "Chest Press", "Seated Cable Row", "Leg Curl", "Face Pulls"];
  } else {
    names = ["Bodyweight Squat", "Push-Up", "Glute Bridge", "Bird Dog", "Plank", "Dead Bug", "Cossack Squat"];
  }

  return names.slice(0, exCount).map((name) => buildFallbackPrescription(name, goal));
}

// ── Main Build Function ──

export interface BuildResult {
  success: boolean;
  weekData: WeekData | null;
  error?: string;
}

export async function buildWeek(): Promise<BuildResult> {
  const store = useKineStore.getState();

  try {
    const userPrompt = buildUserPrompt();

    const data = await apiFetchStreaming(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeoutMs: 60000 }
    );

    const text = data.content.map((b) => b.text || "").join("").trim();
    const weekData = parseWeekJSON(text);
    weekData._weekNum = store.progressDB.currentWeek || 1;

    // Validate & repair AI output against library, equipment, injuries
    let exCount = 6;
    if (store.duration === "short") exCount = 4;
    else if (store.duration === "medium") exCount = 5;
    else if (store.duration === "long") exCount = 6;
    else if (store.duration === "extended") exCount = 7;

    const validation = validateWeek(
      weekData,
      store.equip,
      store.injuries,
      store.exp || "new",
      exCount,
    );

    if (validation.issues.length > 0) {
      console.warn(
        `[week-validation] ${validation.issues.length} issue(s) found and repaired:`,
        validation.issues,
      );
    }

    return { success: true, weekData: validation.weekData };
  } catch (err) {
    console.error("buildWeek failed:", err);
    const fallback = buildFallbackWeek();
    fallback._weekNum = store.progressDB.currentWeek || 1;

    return {
      success: false,
      weekData: fallback,
      error: apiErrorMessage(err),
    };
  }
}
