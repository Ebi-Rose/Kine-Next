"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { getWarmupForSession } from "@/data/warmup-data";
import Button from "@/components/Button";

export default function WarmupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);
  const { weekData } = useKineStore();

  const week = weekData as WeekData | null;
  const day = week?.days?.[dayIdx];

  if (!day || day.isRest) {
    router.replace("/app");
    return null;
  }

  const warmupExercises = getWarmupForSession(day.sessionTitle);

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Warm Up</h1>
      <p className="mt-1 text-xs text-muted2">Prepare your body for {day.sessionTitle}</p>

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

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={() => router.push(`/app/session?day=${dayIdx}`)}>
          Start session →
        </Button>
      </div>
    </div>
  );
}
