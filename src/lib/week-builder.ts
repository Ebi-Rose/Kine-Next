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
} from "@/data/constants";

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

const SYSTEM_PROMPT = `You are Kine - an intelligent strength and conditioning coach. Generate structured training programs. Return only valid JSON. No markdown, no code fences, no explanation.

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
    cycleType,
    progressDB,
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

  // Exercise count per session based on duration
  let exCount = 6;
  if (duration === "short") exCount = 4;
  else if (duration === "medium") exCount = 5;
  else if (duration === "long") exCount = 6;
  else if (duration === "extended") exCount = 7;

  const weekNum = progressDB.currentWeek || 1;

  let cycleContext = "";
  if (cycleType && cycleType !== "na") {
    cycleContext = `\nCycle: ${cycleType}. Adapt intensity and recovery accordingly.`;
  }

  return `Generate a Week ${weekNum} training program structure as compact JSON.

Trainee:
- Goal: ${goalLabel}
- Level: ${exp}
- Equipment: ${equipStr}
- Schedule: ${daysCount} days/week (${dayNames}), ${durationLabel}
- Injuries: ${injuryStr}
- Program: ${prog}
- Sex: Female. Posterior chain priority. Unilateral work. Higher volume tolerance for upper body accessories.${cycleContext}

PRESCRIPTION GUIDE:
- Strength: Primary compounds 4-5 sets, 3-6 reps, 3-5 min rest. Accessories 3 sets, 8-12 reps, 90s rest.
- Muscle: Primary movements 3-4 sets, 8-12 reps, 90s-2 min rest. Isolation 3 sets, 12-15 reps, 60s rest.
- General: All exercises 3 sets, 8-12 reps, 60-90s rest.
- Bodyweight exercises: prescribe reps (not weight). Timed exercises: use reps for duration e.g. "30 sec". Cardio: sets "1", reps as duration.

Return ONLY valid JSON, no markdown:
{"programName":"string","weekCoachNote":"2 sentences","days":[{"dayNumber":1,"isRest":false,"sessionTitle":"string","sessionDuration":"string","coachNote":"1 sentence","exercises":[{"name":"Exercise Name","sets":"3","reps":"8-10","rest":"90 sec"}]}]}

Rules: exactly ${daysCount} training days + ${7 - daysCount} rest days across dayNumber 1-7. Each training day has exactly ${exCount} exercises. Rest days: isRest true, exercises []. Use standard exercise names.`;
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
  const { goal, exp, trainingDays, duration } = store;

  const programName = PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom Program";
  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label || "45-60 min";

  const days: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const isTraining = trainingDays.includes(i);

    if (isTraining) {
      days.push({
        dayNumber: i + 1,
        isRest: false,
        sessionTitle: trainingDays.length <= 3 ? "Full Body" : `Session ${trainingDays.indexOf(i) + 1}`,
        sessionDuration: durationLabel,
        coachNote: "Your session is ready — tap to start when you are.",
        exercises: buildFallbackExercises(store.equip, goal, duration),
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
      "AI was unavailable — this is a standard programme based on your selections. It will be replaced with a personalised week when the AI is available.",
    days,
    _isFallback: true,
  };
}

function buildFallbackExercises(
  equip: string[],
  goal: string | null,
  duration: string | null
): Exercise[] {
  const hasBarbell = equip.includes("barbell");
  const hasDumbbells = equip.includes("dumbbells");
  const hasMachines = equip.includes("machines");

  let exCount = 5;
  if (duration === "short") exCount = 4;
  else if (duration === "extended") exCount = 7;

  // Basic full body template
  const pool: Exercise[] = [];

  if (hasBarbell) {
    pool.push(
      { name: "Barbell Back Squat", sets: "3", reps: "8-10", rest: "2 min" },
      { name: "Romanian Deadlift", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Barbell Bench Press", sets: "3", reps: "8-10", rest: "2 min" },
      { name: "Barbell Row", sets: "3", reps: "8-10", rest: "90 sec" },
    );
  } else if (hasDumbbells) {
    pool.push(
      { name: "Goblet Squat", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Dumbbell Romanian Deadlift", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Dumbbell Bench Press", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Dumbbell Row", sets: "3", reps: "10-12", rest: "90 sec" },
    );
  } else if (hasMachines) {
    pool.push(
      { name: "Leg Press", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Chest Press", sets: "3", reps: "10-12", rest: "90 sec" },
      { name: "Seated Row", sets: "3", reps: "10-12", rest: "90 sec" },
    );
  } else {
    pool.push(
      { name: "Bodyweight Squat", sets: "3", reps: "15", rest: "60 sec" },
      { name: "Push-Up", sets: "3", reps: "8-12", rest: "60 sec" },
      { name: "Glute Bridge", sets: "3", reps: "15", rest: "60 sec" },
      { name: "Bird Dog", sets: "3", reps: "10 each side", rest: "60 sec" },
    );
  }

  // Add accessories
  pool.push(
    { name: "Face Pull", sets: "3", reps: "15", rest: "60 sec" },
    { name: "Plank", sets: "3", reps: "30 sec", rest: "60 sec" },
    { name: "Band Pull-Apart", sets: "3", reps: "15", rest: "45 sec" },
  );

  return pool.slice(0, exCount);
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

    return { success: true, weekData };
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
