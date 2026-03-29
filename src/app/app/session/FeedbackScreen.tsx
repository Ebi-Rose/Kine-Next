"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";

export default function FeedbackScreen({ onSubmit }: { onSubmit: (effort: number, soreness: number) => void }) {
  const [effort, setEffort] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const { goal } = useKineStore();

  // Goal-aware labels
  const effortLabels = goal === "strength"
    ? ["Light", "Moderate", "Heavy", "Maximal"]
    : goal === "muscle"
      ? ["Easy", "Working", "Intense", "Failure"]
      : ["Too easy", "Moderate", "Hard", "Max effort"];

  const effortQuestion = goal === "strength"
    ? "How heavy did it feel?"
    : goal === "muscle"
      ? "How hard did you push?"
      : "How was the effort?";

  const sorenessLabels = ["Fresh", "A little sore", "Pretty sore", "Beat up"];

  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wide text-accent">Session complete</h2>
        <p className="mt-2 text-sm text-muted2">
          {goal === "strength" ? "How did the bar move?"
           : goal === "muscle" ? "Did you feel the muscles working?"
           : "How did it go?"}
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">{effortQuestion}</p>
        <div className="grid grid-cols-4 gap-2">
          {effortLabels.map((label, i) => (
            <button key={i} onClick={() => setEffort(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                effort === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">How does your body feel?</p>
        <div className="grid grid-cols-4 gap-2">
          {sorenessLabels.map((label, i) => (
            <button key={i} onClick={() => setSoreness(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                soreness === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={effort === null || soreness === null}
        onClick={() => onSubmit(effort!, soreness!)}>
        Save & get feedback
      </Button>
    </div>
  );
}
