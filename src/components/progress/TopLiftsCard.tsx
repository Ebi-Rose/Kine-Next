// ── Top Lifts card ──
//
// Variants:
//   load_delta — vs. user's own 6-week average (default for build_strength/maintain)
//   absolute   — current top weight only (beginners — no deltas to confuse)
//   controlled — tempo annotation, not load deltas (hypermobility)
//   reps_tempo — bodyweight users
//
// Engine flags injury-hidden lifts via history.injuryHiddenLifts; we drop them silently.

import { Card, Eyebrow, LiftRow } from "./shared";
import type { TopLiftEntry } from "@/lib/progress-engine";
import { kgToDisplay, weightUnit, type MeasurementSystem } from "@/lib/format";

export type TopLiftsVariant = "load_delta" | "absolute" | "controlled" | "reps_tempo";

export default function TopLiftsCard({
  variant,
  lifts,
  hiddenLifts = [],
  system,
}: {
  variant: TopLiftsVariant;
  lifts: TopLiftEntry[];
  hiddenLifts?: string[];
  system: MeasurementSystem;
}) {
  const visible = lifts.filter((l) => !hiddenLifts.includes(l.name)).slice(0, 4);
  if (visible.length === 0) return null;
  const unit = weightUnit(system);
  return (
    <>
      <Eyebrow>{labelFor(variant)}</Eyebrow>
      <Card className="px-4 py-1">
        {visible.map((lift, i) => (
          <LiftRow
            key={lift.name}
            isLast={i === visible.length - 1}
            name={
              <>
                {lift.name}
                {lift.substituted && (
                  <span className="ml-1.5 text-[9px] text-muted">
                    · swapped from {lift.substitutedFrom}
                  </span>
                )}
              </>
            }
            meta={metaFor(variant)}
            value={valueFor(variant, lift, system, unit)}
            valueTone={toneFor(variant, lift)}
          />
        ))}
      </Card>
    </>
  );
}

function labelFor(variant: TopLiftsVariant): string {
  switch (variant) {
    case "load_delta":
      return "Top lifts · vs. own avg";
    case "absolute":
      return "Current top weights";
    case "controlled":
      return "Top controlled lifts";
    case "reps_tempo":
      return "Top reps";
  }
}

function metaFor(variant: TopLiftsVariant): string | undefined {
  if (variant === "load_delta") return "vs. 6-wk avg";
  if (variant === "controlled") return "tempo + load";
  return undefined;
}

function valueFor(
  variant: TopLiftsVariant,
  lift: TopLiftEntry,
  system: MeasurementSystem,
  unit: string
): string {
  if (variant === "load_delta") {
    if (lift.isBodyweight) {
      const sign = lift.delta > 0 ? "↑ " : lift.delta < 0 ? "↓ " : "→ ";
      return `${sign}${Math.abs(Math.round(lift.delta))} reps`;
    }
    const sign = lift.delta > 0 ? "↑ " : lift.delta < 0 ? "↓ " : "→ ";
    return `${sign}${Math.abs(kgToDisplay(lift.delta, system))}${unit}`;
  }
  if (variant === "absolute") {
    if (lift.isBodyweight) return `${lift.latestReps} reps`;
    return `${kgToDisplay(lift.latestWeight, system)} ${unit}`;
  }
  if (variant === "controlled") {
    if (lift.isBodyweight) return `${lift.latestReps} reps`;
    return `${kgToDisplay(lift.latestWeight, system)} ${unit}`;
  }
  // reps_tempo
  return `${lift.latestReps} reps`;
}

function toneFor(variant: TopLiftsVariant, lift: TopLiftEntry): "default" | "up" {
  if (variant === "load_delta" && lift.delta > 0) return "up";
  return "default";
}
