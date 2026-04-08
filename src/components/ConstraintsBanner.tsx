"use client";

import { useState } from "react";
import { INJURY_OPTIONS, CONDITION_OPTIONS } from "@/data/constants";
import type { Exercise } from "@/lib/week-builder";

const REASON_LABELS: Record<string, string> = {
  ...Object.fromEntries(INJURY_OPTIONS.map((o) => [o.value, o.label])),
  ...Object.fromEntries(CONDITION_OPTIONS.map((o) => [o.value, o.label])),
  equipment: "Available equipment",
};

function reasonLabel(key: string | undefined): string {
  if (!key) return "Adapted";
  return REASON_LABELS[key] ?? key;
}

interface ConstraintsBannerProps {
  exercises: Exercise[];
  injuries: string[];
  conditions: string[];
  /** Called with the index of the exercise to toggle between adapted/original. */
  onToggleRevert: (exerciseIndex: number) => void;
}

export default function ConstraintsBanner({
  exercises,
  injuries,
  conditions,
  onToggleRevert,
}: ConstraintsBannerProps) {
  const [open, setOpen] = useState(false);

  const swappedIndexes = exercises
    .map((ex, i) => ({ ex, i }))
    .filter(({ ex }) => ex.swappedFrom);

  const hasActiveConstraints = injuries.length > 0 || conditions.length > 0;

  // No constraints at all — nothing to show
  if (!hasActiveConstraints) return null;

  const chips = [
    ...injuries.map((v) => reasonLabel(v)),
    ...conditions.map((v) => reasonLabel(v)),
  ];
  const noSwaps = swappedIndexes.length === 0;

  return (
    <div className="mb-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] tracking-[0.18em] uppercase text-muted">
          {noSwaps ? "Your context" : "Adapted for you"}
        </span>
        {!noSwaps && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-[11px] text-accent hover:underline"
            aria-expanded={open}
          >
            {open ? "hide details ↑" : "show details ↓"}
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((label, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c4909833] bg-[#c490980d] px-2.5 py-1 text-[10px] text-muted2"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c49098]" />
            {label}
          </span>
        ))}
      </div>

      <p className="mt-2.5 text-[10px] text-muted leading-relaxed">
        {noSwaps ? (
          <>Today&apos;s exercises are already suitable — no adaptations needed.</>
        ) : (
          <>
            <span className="text-accent font-medium">{swappedIndexes.length}</span>
            {swappedIndexes.length === 1 ? " exercise was" : " exercises were"} adapted for this session.
          </>
        )}
      </p>

      {open && !noSwaps && (
        <div className="mt-3.5 pt-3.5 border-t border-border flex flex-col gap-2.5">
          {swappedIndexes.map(({ ex, i }) => {
            const reverted = ex.useOriginal === true;
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2.5 rounded-[10px] bg-surface2/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[11px] leading-snug text-text">
                    <span className={reverted ? "text-text font-medium" : "text-muted line-through"}>
                      {ex.swappedFrom}
                    </span>
                    <span className="text-muted mx-1">→</span>
                    <span className={reverted ? "text-muted line-through" : "text-text font-medium"}>
                      {ex.name}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted">
                    {reasonLabel(ex.swappedReason)}
                  </div>
                </div>
                <button
                  onClick={() => onToggleRevert(i)}
                  className="shrink-0 rounded-full border border-border-active px-2.5 py-1 text-[10px] text-accent hover:bg-accent-dim transition-colors"
                >
                  {reverted ? "Use adapted" : "Use original"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
