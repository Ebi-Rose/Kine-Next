// ── Recent PRs strip ──
//
// Horizontal scroll of PR chips. Variants:
//   load_pr  — weight × reps (default)
//   rep_pr   — reps only (bodyweight users)
//   first_prs — beginner framing ("first time")
//   empty    — no-data state, returns null

import { Eyebrow } from "./shared";
import type { RecentPR } from "@/lib/progress-engine";
import { kgToDisplay, weightUnit, type MeasurementSystem } from "@/lib/format";

export type RecentPRsVariant = "load_pr" | "rep_pr" | "first_prs" | "empty";

export default function RecentPRsStrip({
  variant,
  prs,
  system,
}: {
  variant: RecentPRsVariant;
  prs: RecentPR[];
  system: MeasurementSystem;
}) {
  if (variant === "empty" || prs.length === 0) return null;
  const unit = weightUnit(system);
  return (
    <>
      <Eyebrow>{variant === "first_prs" ? "First PRs" : "Recent PRs"}</Eyebrow>
      <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
        {prs.slice(0, 6).map((pr, i) => (
          <div
            key={`${pr.liftName}-${pr.date}-${i}`}
            className="flex-shrink-0 min-w-[100px] rounded-xl border border-[rgba(196,144,152,0.25)] bg-[rgba(196,144,152,0.08)] px-3 py-2"
          >
            <div className="text-[9px] tracking-[1.2px] uppercase text-muted">{pr.liftName}</div>
            <div className="font-display italic text-base text-accent">
              {variant === "rep_pr" || pr.weight === 0
                ? `${pr.reps} reps`
                : `${kgToDisplay(pr.weight, system)}${unit} × ${pr.reps}`}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
