"use client";

import { useKineStore } from "@/store/useKineStore";
import type { Goal } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import { GOAL_OPTIONS } from "@/data/constants";
import { StepLabel } from "../helpers";

export default function GoalStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, setGoal } = useKineStore();

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        What do you want training to give you?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        No wrong answer — all three build strength and change your body. This shapes the emphasis.
      </p>
      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {GOAL_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={goal === opt.value}
            onClick={() => setGoal(opt.value as Goal)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2 font-light leading-relaxed">{opt.description}</div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!goal} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
