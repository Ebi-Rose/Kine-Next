"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { COOLDOWN_EXERCISES, type CooldownExercise } from "@/data/warmup-data";
import { findExercise } from "@/data/exercise-library";
import Button from "@/components/Button";

// Session-specific cooldown stretches based on muscles worked
const SESSION_COOLDOWN: Record<string, CooldownExercise[]> = {
  legs: [
    { name: "Standing Quad Stretch", duration: "30 sec each", cue: "Pull heel to glute, squeeze the other glute for balance", category: "stretch" },
    { name: "Pigeon Stretch", duration: "45 sec each", cue: "Sink into the hip, keep hips square", category: "stretch" },
    { name: "Calf Stretch (Wall)", duration: "30 sec each", cue: "Straight back leg, heel pressed down", category: "stretch" },
  ],
  hinge: [
    { name: "Seated Forward Fold", duration: "45 sec", cue: "Hinge from hips, reach for toes, relax the neck", category: "stretch" },
    { name: "Lying Glute Stretch", duration: "30 sec each", cue: "Figure four position, pull knee gently", category: "stretch" },
    { name: "Cat-Cow (Cooldown)", duration: "8 reps", cue: "Slow and gentle — release the lower back", category: "stretch" },
  ],
  push: [
    { name: "Doorway Chest Stretch", duration: "30 sec each", cue: "Arm at 90°, lean through gently", category: "stretch" },
    { name: "Tricep Stretch", duration: "20 sec each", cue: "Reach behind head, gently pull elbow", category: "stretch" },
    { name: "Cross-Body Shoulder Stretch", duration: "20 sec each", cue: "Pull arm across chest, relax the shoulder", category: "stretch" },
  ],
  pull: [
    { name: "Lat Hang", duration: "30 sec", cue: "Hang from a bar, relax into it, breathe", category: "stretch" },
    { name: "Thread the Needle", duration: "30 sec each", cue: "Reach under and rotate, feel the upper back open", category: "stretch" },
    { name: "Bicep Wall Stretch", duration: "20 sec each", cue: "Arm against wall, rotate body away gently", category: "stretch" },
  ],
  core: [
    { name: "Cobra Stretch", duration: "30 sec", cue: "Press up gently, hips on the floor, open the chest", category: "stretch" },
    { name: "Lying Twist", duration: "30 sec each", cue: "Knees to one side, opposite shoulder down", category: "stretch" },
  ],
};

function getSessionCooldown(sessionTitle: string): CooldownExercise[] {
  const title = sessionTitle.toLowerCase();
  const extras: CooldownExercise[] = [];
  const seen = new Set<string>();

  const addFrom = (key: string) => {
    const items = SESSION_COOLDOWN[key];
    if (items) {
      for (const ex of items) {
        if (!seen.has(ex.name)) {
          seen.add(ex.name);
          extras.push(ex);
        }
      }
    }
  };

  if (title.includes("lower") || title.includes("leg") || title.includes("squat") || title.includes("glute")) {
    addFrom("legs");
    addFrom("hinge");
  } else if (title.includes("upper") || title.includes("push") || title.includes("chest") || title.includes("shoulder")) {
    addFrom("push");
    addFrom("pull");
  } else if (title.includes("pull") || title.includes("back")) {
    addFrom("pull");
  } else if (title.includes("hinge") || title.includes("posterior") || title.includes("deadlift")) {
    addFrom("hinge");
  } else if (title.includes("full body")) {
    addFrom("legs");
    addFrom("push");
    addFrom("core");
  } else {
    addFrom("legs");
    addFrom("push");
  }

  return extras.slice(0, 4);
}

// Category icons
const CATEGORY_LABELS: Record<string, string> = {
  breathing: "Breathing",
  stretch: "Stretch",
  foam_roll: "Foam roll",
};

export default function CooldownPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);
  const { weekData } = useKineStore();

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];
  const sessionTitle = day?.sessionTitle || "";

  // Session-specific stretches
  const sessionStretches = sessionTitle ? getSessionCooldown(sessionTitle) : [];

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Cool Down</h1>
      <p className="mt-1 text-xs text-muted2">
        {sessionTitle ? `Recovery stretches for ${sessionTitle}` : "Stretch, breathe, recover."}
      </p>

      {/* Core cooldown */}
      <div className="mt-6 flex flex-col gap-3">
        {COOLDOWN_EXERCISES.map((ex, i) => (
          <div key={i} className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text">{ex.name}</p>
                  <span className="text-[9px] text-muted uppercase tracking-wider">
                    {CATEGORY_LABELS[ex.category] || ex.category}
                  </span>
                </div>
                <p className="text-xs text-muted2">{ex.cue}</p>
              </div>
              <span className="text-xs text-accent">{ex.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Session-specific stretches */}
      {sessionStretches.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] tracking-wider text-muted uppercase">
            For today&apos;s session
          </p>
          <div className="flex flex-col gap-2">
            {sessionStretches.map((ex, i) => (
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

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={() => router.push("/app")}>
          Done →
        </Button>
      </div>
    </div>
  );
}
