"use client";

import { useKineStore } from "@/store/useKineStore";
import type { OutsideActivity } from "@/store/useKineStore";
import Button from "@/components/Button";
import { OUTSIDE_ACTIVITY_OPTIONS } from "@/data/constants";
import { StepLabel } from "../helpers";

export default function OutsideActivityStep({ onNext, numberedStep }: { onNext: () => void; numberedStep: number }) {
  const {
    outsideActivities,
    setOutsideActivities,
    outsideActivityNotes,
    setOutsideActivityNotes,
    outsideActivityFocus,
    setOutsideActivityFocus,
  } = useKineStore();

  function toggleActivity(val: string) {
    const activity = val as OutsideActivity;
    if (outsideActivities.includes(activity)) {
      const next = outsideActivities.filter((a) => a !== activity);
      setOutsideActivities(next);
      // Clear focus if the focused activity was deselected
      if (outsideActivityFocus === activity) {
        setOutsideActivityFocus(null);
      }
    } else {
      setOutsideActivities([...outsideActivities, activity]);
    }
  }

  function selectFocus(val: OutsideActivity | null) {
    setOutsideActivityFocus(val);
  }

  const hasActivities = outsideActivities.length > 0;

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2
        className="font-display tracking-wide text-text"
        style={{ fontSize: "clamp(20px, 6vw, 28px)", lineHeight: 1.1 }}
      >
        Training for anything else?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Kinē adjusts load and adds muscle work that supports what you do outside the gym.
      </p>

      {/* Activity pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {OUTSIDE_ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleActivity(opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-all ${
              outsideActivities.includes(opt.value as OutsideActivity)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Focus question — appears when activities are selected */}
      {hasActivities && (
        <div className="mt-7 pt-5 border-t border-border animate-fade-up">
          <p className="text-xs text-muted2 mb-3 font-light">
            Is one of these your main training goal?
          </p>
          {outsideActivities.map((activity) => {
            const label = OUTSIDE_ACTIVITY_OPTIONS.find((o) => o.value === activity)?.label ?? activity;
            return (
              <button
                key={activity}
                onClick={() => selectFocus(activity)}
                className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-[var(--radius-default)] border mb-2 text-[13px] transition-all ${
                  outsideActivityFocus === activity
                    ? "border-accent bg-accent-dim text-text"
                    : "border-border bg-surface text-muted2 hover:border-border-active"
                }`}
              >
                <span
                  className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all ${
                    outsideActivityFocus === activity ? "border-accent" : "border-border"
                  }`}
                >
                  {outsideActivityFocus === activity && (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </span>
                {label} is my main goal
              </button>
            );
          })}
          <button
            onClick={() => selectFocus(null)}
            className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-[var(--radius-default)] border mb-2 text-[13px] transition-all ${
              outsideActivityFocus === null
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all ${
                outsideActivityFocus === null ? "border-accent" : "border-border"
              }`}
            >
              {outsideActivityFocus === null && (
                <span className="w-2 h-2 rounded-full bg-accent" />
              )}
            </span>
            No — gym is my main focus
          </button>
        </div>
      )}

      {/* Notes textarea — appears when activities are selected */}
      {hasActivities && (
        <div className="mt-4 animate-fade-up">
          <textarea
            value={outsideActivityNotes}
            onChange={(e) => setOutsideActivityNotes(e.target.value)}
            aria-label="Outside activity notes"
            placeholder="Anything specific? E.g. 'half marathon in September', 'football twice a week'…"
            rows={3}
            className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
          />
          <p className="mt-2 text-[11px] text-muted font-light">
            You can set specific activity days in settings later.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
