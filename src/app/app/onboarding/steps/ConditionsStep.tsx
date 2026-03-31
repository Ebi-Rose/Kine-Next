"use client";

import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import { CONDITION_OPTIONS } from "@/data/constants";

export default function ConditionsStep({ onNext }: { onNext: () => void }) {
  const { conditions, setConditions } = useKineStore();

  function toggleCondition(val: string) {
    if (conditions.includes(val)) {
      setConditions(conditions.filter((c) => c !== val));
    } else {
      setConditions([...conditions, val]);
    }
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Your body
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Anything we should know about?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Some conditions change how your body responds to training. Select
        anything relevant — Kinē adapts around it, not through it.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {CONDITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleCondition(opt.value)}
            className={`text-left rounded-[var(--radius-default)] border px-4 py-3 transition-all ${
              conditions.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span className="block text-xs font-light mt-0.5 opacity-70">{opt.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Nothing here — skip
        </button>
      </div>
    </div>
  );
}
