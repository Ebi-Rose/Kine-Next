// ── Progress Hero card ──
//
// The single accent card at the top of the Progress page. Variants are
// driven entirely by the engine — different goals/life stages produce
// different headlines. This component never reads the store directly.

import { Card, Eyebrow, StatNumber, Tiny } from "./shared";

export type ProgressHeroVariant =
  | "delta" // strength_trend hero (default for build_strength/build_muscle)
  | "since_return" // sessions_completed for return_to_training
  | "neutral_count" // pregnancy
  | "first_weeks" // beginner
  | "holding_steady" // maintain
  | "phase_position" // perform_for_sport
  | "welcome"; // empty state

export interface ProgressHeroProps {
  variant: ProgressHeroVariant;
  /** Combined-strength delta % vs. baseline (delta variant). */
  combinedDeltaPct?: number | null;
  /** Sparkline points 0..1 normalized for the delta variant. */
  sparklinePoints?: number[];
  /** Total sessions count for since_return / first_weeks / welcome. */
  totalSessions?: number;
  /** Weeks count for first_weeks / since_return. */
  weeks?: number;
  /** Phase short label for phase_position variant. */
  phaseShort?: string;
  /** Days to next event (e.g. meet) for phase_position. */
  daysToEvent?: number;
}

export default function ProgressHero(props: ProgressHeroProps) {
  switch (props.variant) {
    case "delta":
      return <DeltaHero {...props} />;
    case "since_return":
      return <SinceReturnHero {...props} />;
    case "neutral_count":
      return <NeutralCountHero {...props} />;
    case "first_weeks":
      return <FirstWeeksHero {...props} />;
    case "holding_steady":
      return <HoldingSteadyHero {...props} />;
    case "phase_position":
      return <PhasePositionHero {...props} />;
    case "welcome":
      return <WelcomeHero {...props} />;
  }
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 110;
  const h = 34;
  const stepX = w / (points.length - 1);
  const path = points
    .map((y, i) => {
      const px = i * stepX;
      const py = h - 4 - y * (h - 8);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const lastY = h - 4 - last * (h - 8);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={w} cy={lastY} r="2.5" fill="var(--color-accent)" />
    </svg>
  );
}

function DeltaHero({ combinedDeltaPct, sparklinePoints }: ProgressHeroProps) {
  const delta = combinedDeltaPct ?? null;
  const verdict =
    delta === null
      ? "Building your baseline"
      : delta > 0
        ? `Stronger by ${delta}%`
        : delta < 0
          ? `Lower by ${Math.abs(delta)}%`
          : "Holding steady";
  const subtext = delta === null ? "more sessions and we'll show how you're changing" : "vs. your baseline";
  return (
    <Card accent>
      <Eyebrow>Combined top weights</Eyebrow>
      <div className="flex items-end justify-between gap-3">
        <div>
          <StatNumber size="lg" tone={delta && delta > 0 ? "up" : "default"}>
            {verdict}
          </StatNumber>
          <Tiny className="mt-1">{subtext}</Tiny>
        </div>
        {sparklinePoints && sparklinePoints.length >= 2 && <Sparkline points={sparklinePoints} />}
      </div>
    </Card>
  );
}

function SinceReturnHero({ totalSessions, weeks }: ProgressHeroProps) {
  return (
    <Card accent>
      <Eyebrow>Since you came back</Eyebrow>
      <StatNumber size="lg">{totalSessions ?? 0} sessions</StatNumber>
      {weeks && <Tiny className="mt-1">{weeks} weeks of returning · every one of them counts</Tiny>}
    </Card>
  );
}

function NeutralCountHero({ totalSessions }: ProgressHeroProps) {
  return (
    <Card accent>
      <Eyebrow>This pregnancy</Eyebrow>
      <StatNumber size="lg">{totalSessions ?? 0} sessions</StatNumber>
      <Tiny className="mt-1">Showing up is the work right now</Tiny>
    </Card>
  );
}

function FirstWeeksHero({ totalSessions, weeks }: ProgressHeroProps) {
  return (
    <Card accent>
      <Eyebrow>Your start</Eyebrow>
      <StatNumber size="lg" tone="accent">
        {totalSessions ?? 0} sessions in {weeks ?? 1} weeks
      </StatNumber>
      <Tiny className="mt-1">strong start — page fills out as you log more</Tiny>
    </Card>
  );
}

function HoldingSteadyHero({ combinedDeltaPct }: ProgressHeroProps) {
  const delta = combinedDeltaPct ?? null;
  const isHolding = delta === null || Math.abs(delta) <= 2;
  const verdict = isHolding
    ? "Holding steady"
    : delta! > 0
      ? `Stronger by ${delta}%`
      : "Maintaining";
  return (
    <Card accent>
      <Eyebrow>Last 12 weeks</Eyebrow>
      <StatNumber size="lg">{verdict}</StatNumber>
      <Tiny className="mt-1">consistency is the goal — and you&apos;re hitting it</Tiny>
    </Card>
  );
}

function PhasePositionHero({ phaseShort, daysToEvent }: ProgressHeroProps) {
  return (
    <Card accent>
      <Eyebrow>Phase position</Eyebrow>
      <StatNumber size="lg">{phaseShort ?? "—"}</StatNumber>
      {daysToEvent !== undefined && <Tiny className="mt-1">{daysToEvent} days to your next peak</Tiny>}
    </Card>
  );
}

function WelcomeHero({ totalSessions }: ProgressHeroProps) {
  return (
    <Card accent>
      <Eyebrow>So far</Eyebrow>
      <StatNumber size="lg">{totalSessions ?? 0} sessions</StatNumber>
      <Tiny className="mt-2">come back once you&apos;ve got a few more — this page fills out as you train</Tiny>
    </Card>
  );
}
