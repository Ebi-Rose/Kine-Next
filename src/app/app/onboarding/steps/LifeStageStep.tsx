"use client";

// ── Onboarding · Life stage step ──
//
// Optional self-identification that drives the Progress page personalization
// engine. Spec: docs/specs/progress-personalization-engine.md §4.2.
//
// Skippable per principle #20 — defaults to undefined ("general") if the
// user taps "Prefer not to say". Tapping any option saves immediately and
// advances. Positioned after Injuries because it's sensitive — users
// should already feel they've answered the "limitations" question before
// being asked about life stage, not the other way around.

import { useKineStore } from "@/store/useKineStore";
import type { LifeStage } from "@/store/useKineStore";
import { LIFE_STAGE_OPTIONS } from "@/data/constants";

export default function LifeStageStep({ onNext }: { onNext: () => void }) {
  const { personalProfile, setLifeStage } = useKineStore();
  const current = personalProfile?.lifeStage;

  function selectStage(value: NonNullable<LifeStage>) {
    setLifeStage(value);
    onNext();
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Where you are
      </p>
      <h2
        className="font-display tracking-wide text-text"
        style={{ fontSize: "clamp(20px, 6vw, 28px)", lineHeight: 1.1 }}
      >
        Anything we should know about your life stage?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Optional. This shapes how Kinē shows your progress — never how it talks to you. You can change this anytime in your profile.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {LIFE_STAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => selectStage(opt.value)}
            aria-pressed={current === opt.value}
            className={`rounded-[var(--radius-default)] border px-4 py-3 text-left transition-all ${
              current === opt.value
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            <div className="text-sm">{opt.label}</div>
            <div className="text-[11px] text-muted font-light mt-0.5 leading-snug">
              {opt.description}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Prefer not to say — continue
        </button>
      </div>
    </div>
  );
}
