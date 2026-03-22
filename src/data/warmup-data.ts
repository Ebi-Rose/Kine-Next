// ── Warmup & Cooldown Data ──

export interface WarmupExercise {
  name: string;
  duration: string;
  cue: string;
  category: "general" | "activation" | "mobility" | "dynamic";
}

export const WARMUP_EXERCISES: Record<string, WarmupExercise[]> = {
  legs: [
    { name: "Bodyweight Squat", duration: "10 reps", cue: "Full depth, controlled pace", category: "dynamic" },
    { name: "Leg Swings (Front/Back)", duration: "10 each side", cue: "Hold something for balance", category: "dynamic" },
    { name: "Lateral Band Walk", duration: "10 each side", cue: "Keep tension in the band throughout", category: "activation" },
    { name: "Glute Bridge", duration: "10 reps", cue: "Squeeze glutes hard at the top, 2-sec hold", category: "activation" },
    { name: "Ankle Circles", duration: "10 each side", cue: "Full range, both directions", category: "mobility" },
  ],
  hinge: [
    { name: "Cat-Cow", duration: "8 reps", cue: "Slow and controlled, feel each vertebra", category: "mobility" },
    { name: "Glute Bridge", duration: "10 reps", cue: "Squeeze glutes hard at the top", category: "activation" },
    { name: "Good Morning (Bodyweight)", duration: "10 reps", cue: "Hinge at hips, flat back", category: "dynamic" },
    { name: "Banded Clamshell", duration: "10 each side", cue: "Control the return, don't let it snap back", category: "activation" },
    { name: "Hip Circles", duration: "8 each side", cue: "Large circles, both directions", category: "mobility" },
  ],
  push: [
    { name: "Arm Circles", duration: "10 each direction", cue: "Gradually increase the range", category: "general" },
    { name: "Band Pull-Apart", duration: "15 reps", cue: "Squeeze shoulder blades at the end", category: "activation" },
    { name: "Incline Push-Up", duration: "8 reps", cue: "Slow and controlled, feel the stretch at the bottom", category: "dynamic" },
    { name: "Shoulder Dislocates (Band)", duration: "10 reps", cue: "Wide grip, slow rotation", category: "mobility" },
    { name: "Scapular Push-Up", duration: "8 reps", cue: "Only the shoulder blades move", category: "activation" },
  ],
  pull: [
    { name: "Band Pull-Apart", duration: "15 reps", cue: "Squeeze shoulder blades together", category: "activation" },
    { name: "Scapular Pull-Up", duration: "8 reps", cue: "Hang, then pull shoulder blades down", category: "activation" },
    { name: "Cat-Cow", duration: "8 reps", cue: "Focus on thoracic extension", category: "mobility" },
    { name: "Arm Circles", duration: "10 each direction", cue: "Wake up the shoulders", category: "general" },
    { name: "Dead Hang", duration: "20 sec", cue: "Relax into it, decompress the spine", category: "mobility" },
  ],
  core: [
    { name: "Dead Bug", duration: "8 each side", cue: "Lower back stays pressed into the floor", category: "activation" },
    { name: "Bird Dog", duration: "8 each side", cue: "Don't let your hips rotate", category: "activation" },
    { name: "Cat-Cow", duration: "8 reps", cue: "Mobilise the full spine", category: "mobility" },
  ],
};

export interface CooldownExercise {
  name: string;
  duration: string;
  cue: string;
  category: "stretch" | "breathing" | "foam_roll";
}

export const COOLDOWN_EXERCISES: CooldownExercise[] = [
  { name: "Deep Breathing", duration: "1 min", cue: "4 seconds in, 4 seconds hold, 6 seconds out", category: "breathing" },
  { name: "Child's Pose", duration: "30 sec", cue: "Reach forward, sink hips back", category: "stretch" },
  { name: "Hip Flexor Stretch", duration: "30 sec each side", cue: "Squeeze the glute on the kneeling side", category: "stretch" },
  { name: "Hamstring Stretch", duration: "30 sec each side", cue: "Straight leg, hinge from the hip", category: "stretch" },
  { name: "Chest Opener", duration: "30 sec", cue: "Arms wide, squeeze shoulder blades", category: "stretch" },
  { name: "Quad Stretch", duration: "30 sec each side", cue: "Pull heel to glute, keep knees together", category: "stretch" },
  { name: "Lat Stretch", duration: "30 sec each side", cue: "Reach overhead, lean away", category: "stretch" },
];

/**
 * Get warmup exercises based on the session's target muscles.
 */
export function getWarmupForSession(sessionTitle: string): WarmupExercise[] {
  const title = sessionTitle.toLowerCase();

  // General warm-up always included
  const general: WarmupExercise[] = [
    { name: "Light Cardio", duration: "3 min", cue: "Brisk walk, bike, or rowing — just get warm", category: "general" },
  ];

  let specific: WarmupExercise[] = [];

  if (title.includes("lower") || title.includes("leg") || title.includes("squat") || title.includes("glute")) {
    specific = [...(WARMUP_EXERCISES.legs || []), ...(WARMUP_EXERCISES.hinge || [])];
  } else if (title.includes("upper") || title.includes("push") || title.includes("chest") || title.includes("shoulder")) {
    specific = [...(WARMUP_EXERCISES.push || []), ...(WARMUP_EXERCISES.pull || [])];
  } else if (title.includes("pull") || title.includes("back")) {
    specific = WARMUP_EXERCISES.pull || [];
  } else if (title.includes("full body")) {
    specific = [
      ...(WARMUP_EXERCISES.legs?.slice(0, 2) || []),
      ...(WARMUP_EXERCISES.push?.slice(0, 2) || []),
      ...(WARMUP_EXERCISES.core?.slice(0, 1) || []),
    ];
  } else {
    specific = [
      ...(WARMUP_EXERCISES.legs?.slice(0, 2) || []),
      ...(WARMUP_EXERCISES.push?.slice(0, 1) || []),
    ];
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = specific.filter((ex) => {
    if (seen.has(ex.name)) return false;
    seen.add(ex.name);
    return true;
  });

  return [...general, ...deduped.slice(0, 4)];
}
