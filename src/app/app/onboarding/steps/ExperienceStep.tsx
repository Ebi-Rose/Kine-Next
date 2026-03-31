"use client";

import { useKineStore } from "@/store/useKineStore";
import type { Experience } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import { EXP_OPTIONS, EXP_DESCRIPTIONS } from "@/data/constants";
import { StepLabel } from "../helpers";

export default function ExperienceStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, exp, setExp } = useKineStore();
  const goalKey = goal || "general";

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Where are you right now?
      </h2>
      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {EXP_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={exp === opt.value}
            onClick={() => setExp(opt.value as Experience)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2 font-light leading-relaxed">
              {EXP_DESCRIPTIONS[goalKey]?.[opt.value] || ""}
            </div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!exp} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
