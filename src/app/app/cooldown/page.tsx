"use client";

import { useRouter } from "next/navigation";
import { COOLDOWN_EXERCISES } from "@/data/warmup-data";
import Button from "@/components/Button";

export default function CooldownPage() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Cool Down</h1>
      <p className="mt-1 text-xs text-muted2">Stretch, breathe, recover.</p>

      <div className="mt-6 flex flex-col gap-3">
        {COOLDOWN_EXERCISES.map((ex, i) => (
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
        <Button className="w-full" size="lg" onClick={() => router.push("/app")}>
          Done →
        </Button>
      </div>
    </div>
  );
}
