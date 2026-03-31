"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { CycleType } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import { CYCLE_OPTIONS } from "@/data/constants";

export default function CycleStep({ onNext }: { onNext: () => void }) {
  const { cycleType, setCycleType, setCycle } = useKineStore();
  const [periodDate, setPeriodDate] = useState("");

  function handleContinue() {
    if (cycleType === "regular" && periodDate) {
      setCycle({
        periodLog: [{ date: periodDate, type: "start" }],
        avgLength: null,
      });
    }
    onNext();
  }

  function skip() {
    setCycleType("na");
    onNext();
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Your cycle
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        How does your body work across the month?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Hormones affect how you recover, how strong you feel, and when to push
        hard. Kinē uses this quietly — it shapes your program, not your identity.
      </p>

      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {CYCLE_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={cycleType === opt.value}
            onClick={() => setCycleType(opt.value as CycleType)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2">{opt.description}</div>
          </Tile>
        ))}
      </div>

      {cycleType === "regular" && (
        <div className="mt-4">
          <label htmlFor="period-date" className="text-xs text-muted2">
            When did your last period start?
          </label>
          <input
            id="period-date"
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <p className="mt-1 text-[10px] text-muted">
            Approximate is fine — you can update it any time.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={handleContinue} disabled={!cycleType} className="w-full">
          Continue
        </Button>
        <button
          onClick={skip}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
