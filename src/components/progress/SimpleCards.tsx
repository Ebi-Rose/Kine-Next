// ── Simple progress cards ──
//
// One file for the small text-only cards: rehab work, effort observation,
// effort control, mobility log, exercises learned, symptom context,
// phase position, empty state. Each is a small component the page maps to
// by card id from the engine output.

import Link from "next/link";
import { Card, GhostCard, Eyebrow, Tiny, LiftRow } from "./shared";
import type { EngineHistory } from "@/lib/progress-engine";

export function RehabWorkCard({ history }: { history: EngineHistory }) {
  if (history.rehabSetsThisBlock === 0 && history.reintroducedLifts.length === 0) {
    return null;
  }
  return (
    <>
      <Eyebrow>Rehab work</Eyebrow>
      <Card>
        {history.reintroducedLifts.length > 0 && (
          <p className="text-xs text-muted2">
            <span className="text-accent">{history.reintroducedLifts.length}</span> exercises reintroduced this week
          </p>
        )}
        {history.rehabSetsThisBlock > 0 && (
          <p className="text-xs text-muted2 mt-1">
            <span className="text-text">{history.rehabSetsThisBlock}</span> rehab sets logged this block
          </p>
        )}
      </Card>
    </>
  );
}

export function EffortObservationCard({ history }: { history: EngineHistory }) {
  if (history.avgEffort === null) return null;
  return (
    <>
      <Eyebrow>Effort</Eyebrow>
      <Card>
        <p className="text-xs text-muted2">
          Averaging <span className="font-display italic text-base text-text">{history.avgEffort.toFixed(1)} of 4</span> across the block — observation only
        </p>
      </Card>
    </>
  );
}

export function EffortControlCard({ history }: { history: EngineHistory }) {
  // Promoted for hypermobility / advanced. Surfaces effort observation only —
  // never grades, never targets. Principle #14 (No Scores, No Streaks) means
  // we don't display "% of reps where you held tempo" or any similar metric
  // that turns self-report into a pass/fail.
  if (history.avgEffort === null) return null;
  return (
    <>
      <Eyebrow>Control this block</Eyebrow>
      <Card>
        <p className="text-xs text-muted2">
          Effort steady — <span className="text-text">{history.avgEffort.toFixed(1)} of 4</span>, no spikes
        </p>
      </Card>
    </>
  );
}

export function MobilityLogCard({ history }: { history: EngineHistory }) {
  if (history.mobilitySessionsThisBlock === 0) return null;
  return (
    <>
      <Eyebrow>Mobility</Eyebrow>
      <Card>
        <p className="text-xs text-muted2">
          <span className="font-display italic text-base text-text">{history.mobilitySessionsThisBlock}</span> mobility sessions logged this block
        </p>
      </Card>
    </>
  );
}

export function ExercisesLearnedCard({ history, variant }: { history: EngineHistory; variant: string }) {
  if (variant === "reintroduced" && history.reintroducedLifts.length === 0) return null;
  if (history.topLifts.length === 0) return null;
  const items = variant === "reintroduced" ? history.reintroducedLifts : history.topLifts.map((l) => l.name).slice(0, 6);
  return (
    <>
      <Eyebrow>{variant === "reintroduced" ? "Reintroduced this week" : "Exercises practiced"}</Eyebrow>
      <Card className="px-4 py-1">
        {items.map((name, i) => (
          <LiftRow
            key={name}
            isLast={i === items.length - 1}
            name={name}
            value={variant === "reintroduced" ? "new" : ""}
            valueTone="accent"
          />
        ))}
      </Card>
    </>
  );
}

export function SymptomContextCard({ history }: { history: EngineHistory }) {
  if (history.symptomDays.length === 0) return null;
  return (
    <>
      <Eyebrow>Symptom days this block</Eyebrow>
      <Card>
        <Tiny>
          {history.symptomDays.length} day{history.symptomDays.length === 1 ? "" : "s"} flagged — dips on these days are expected and not regression.
        </Tiny>
      </Card>
    </>
  );
}

export function PhasePositionCard({ history }: { history: EngineHistory }) {
  if (!history.currentPhaseLabel) return null;
  return (
    <>
      <Eyebrow>Phase position</Eyebrow>
      <Card>
        <p className="font-display italic text-base text-text">{history.currentPhaseLabel}</p>
        <Tiny className="mt-1">{history.currentPhaseName?.toLowerCase() ?? ""}</Tiny>
      </Card>
    </>
  );
}

export function EmptyStateCard() {
  return (
    <GhostCard>
      <p className="text-xs text-muted2 leading-relaxed">
        Once you&apos;ve logged a few sessions, this page fills out with your strength trends, top lifts, and PRs.
      </p>
      <div className="mt-3">
        <Link href="/app/today" className="text-[11px] text-accent hover:underline">
          Start today&apos;s session →
        </Link>
      </div>
    </GhostCard>
  );
}
