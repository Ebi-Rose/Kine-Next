"use client";

import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import { INJURY_OPTIONS } from "@/data/constants";

export default function InjuriesStep({ onNext }: { onNext: () => void }) {
  const { injuries, setInjuries, injuryNotes, setInjuryNotes } = useKineStore();

  function toggleInjury(val: string) {
    if (injuries.includes(val)) {
      setInjuries(injuries.filter((i) => i !== val));
    } else {
      setInjuries([...injuries, val]);
    }
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Limitations
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Anything to work around?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Kinē programs around limitations, not through them. Select anything
        relevant — or skip if you&apos;re good to go.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {INJURY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleInjury(opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-all ${
              injuries.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={injuryNotes}
          onChange={(e) => setInjuryNotes(e.target.value)}
          aria-label="Additional injury notes"
          placeholder="Anything else? E.g. 'recovering from surgery', 'can't do overhead pressing'…"
          rows={3}
          className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={onNext} className="w-full">
          Build my program →
        </Button>
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          No limitations — build my program
        </button>
      </div>
    </div>
  );
}
