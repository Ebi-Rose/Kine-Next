"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { getWarmupForSession, type WarmupExercise } from "@/data/warmup-data";
import { findExercise } from "@/data/exercise-library";
import Button from "@/components/Button";

// #7: Injury-specific warmup modifications
const INJURY_WARMUP_MODS: Record<string, WarmupExercise[]> = {
  knees: [
    { name: "Quad Foam Roll", duration: "60 sec each", cue: "Roll slowly, pause on tender spots", category: "mobility" },
    { name: "Terminal Knee Extension (Band)", duration: "10 each", cue: "Lock out gently, don't force", category: "activation" },
  ],
  lower_back: [
    { name: "Cat-Cow (Extra)", duration: "10 reps", cue: "Slow, controlled — mobilise each vertebra", category: "mobility" },
    { name: "Dead Bug (Warmup)", duration: "8 each side", cue: "Press lower back into the floor", category: "activation" },
  ],
  shoulder: [
    { name: "Shoulder CARS", duration: "5 each direction", cue: "Slow controlled circles, full range", category: "mobility" },
    { name: "External Rotation (Band)", duration: "10 each", cue: "Elbow pinned to side, rotate out", category: "activation" },
  ],
  hip: [
    { name: "90/90 Hip Stretch", duration: "30 sec each", cue: "Sit tall, don't force depth", category: "mobility" },
    { name: "Hip Circles (Standing)", duration: "8 each direction", cue: "Large circles, controlled", category: "mobility" },
  ],
  wrist: [
    { name: "Wrist Circles", duration: "10 each direction", cue: "Full range, both directions", category: "mobility" },
    { name: "Wrist Flexor Stretch", duration: "20 sec each", cue: "Arm straight, gently pull fingers back", category: "mobility" },
  ],
  postpartum: [
    { name: "Diaphragmatic Breathing", duration: "1 min", cue: "Hand on belly, breathe into your hand", category: "general" },
    { name: "Pelvic Floor Connection", duration: "8 reps", cue: "Gentle lift and release with breath", category: "activation" },
  ],
};

// #8: Ramp set generator for compound exercises
function getRampSets(exercises: { name: string; sets: string; reps: string }[]): { name: string; sets: { reps: string; load: string }[] }[] {
  const ramps: { name: string; sets: { reps: string; load: string }[] }[] = [];

  for (const ex of exercises) {
    const lib = findExercise(ex.name);
    if (!lib || !lib.tags.includes("Compound")) continue;
    if (lib.logType === "bodyweight" || lib.logType === "timed") continue;

    ramps.push({
      name: ex.name,
      sets: [
        { reps: "8-10", load: "empty bar / light" },
        { reps: "5", load: "~50% working weight" },
        { reps: "3", load: "~75% working weight" },
      ],
    });
  }

  return ramps;
}

export default function WarmupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);
  const { weekData, injuries } = useKineStore();

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  if (!day || day.isRest) {
    router.replace("/app");
    return null;
  }

  const warmupExercises = getWarmupForSession(day.sessionTitle);

  // #7: Add injury-specific warmup exercises
  const injuryWarmups: WarmupExercise[] = [];
  for (const injury of injuries) {
    const mods = INJURY_WARMUP_MODS[injury];
    if (mods) {
      for (const mod of mods) {
        if (!injuryWarmups.some(w => w.name === mod.name)) {
          injuryWarmups.push(mod);
        }
      }
    }
  }

  // #8: Ramp sets for compound exercises in this session
  const rampSets = getRampSets(day.exercises);

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Warm Up</h1>
      <p className="mt-1 text-xs text-muted2">Prepare your body for {day.sessionTitle}</p>

      {/* General + session-specific warmup */}
      <div className="mt-6 flex flex-col gap-3">
        {warmupExercises.map((ex, i) => (
          <div key={i} className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">{ex.name}</p>
                <p className="text-xs text-muted2">{ex.cue}</p>
              </div>
              <span className="text-xs text-accent">{ex.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* #7: Injury-specific warmup */}
      {injuryWarmups.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] tracking-wider text-muted uppercase">For your {injuries.join(" & ")}</p>
          <div className="flex flex-col gap-2">
            {injuryWarmups.map((ex, i) => (
              <div key={i} className="rounded-[var(--radius-default)] border border-accent/20 bg-accent-dim/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{ex.name}</p>
                    <p className="text-xs text-muted2">{ex.cue}</p>
                  </div>
                  <span className="text-xs text-accent">{ex.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* #8: Ramp sets for compounds */}
      {rampSets.length > 0 && (
        <div className="mt-6">
          <p className="mb-1 text-[10px] tracking-wider text-muted uppercase">Ramp-up sets</p>
          <p className="mb-3 text-[10px] text-muted font-light">Build up to your working weight gradually.</p>
          <div className="flex flex-col gap-3">
            {rampSets.map((ramp, i) => (
              <div key={i} className="rounded-[var(--radius-default)] border border-border bg-surface p-3">
                <p className="text-xs font-medium text-text mb-2">{ramp.name}</p>
                <div className="flex flex-col gap-1">
                  {ramp.sets.map((s, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-muted2">Ramp {j + 1}: {s.reps} reps</span>
                      <span className="text-muted font-light">{s.load}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={() => router.push(`/app/session?day=${dayIdx}`)}>
          Start session →
        </Button>
      </div>
    </div>
  );
}
