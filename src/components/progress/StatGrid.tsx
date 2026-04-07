// ── Progress page stat grid ──
//
// 2×2 grid of small stat tiles below the hero. The engine picks which 4
// tile ids to show; this component renders the matching content.

import { Eyebrow, StatNumber, Tiny } from "./shared";
import type { EngineHistory } from "@/lib/progress-engine";

export type StatTileId =
  | "this_week"
  | "recent_prs"
  | "phase"
  | "effort"
  | "mobility_count"
  | "rehab_sets"
  | "reintroduced_count"
  | "exercises_learned";

export default function StatGrid({
  tiles,
  history,
}: {
  tiles: StatTileId[];
  history: EngineHistory;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map((id) => (
        <Tile key={id} id={id} history={history} />
      ))}
    </div>
  );
}

function Tile({ id, history }: { id: StatTileId; history: EngineHistory }) {
  const wrap = "rounded-[var(--radius-default)] border border-border bg-surface p-3";
  switch (id) {
    case "this_week":
      return (
        <div className={wrap}>
          <Eyebrow>This week</Eyebrow>
          <StatNumber size="md">
            {history.sessionsThisWeek}
            <span className="text-muted2 text-sm font-light"> / {history.targetThisWeek}</span>
          </StatNumber>
          <Tiny>sessions</Tiny>
        </div>
      );
    case "recent_prs":
      return (
        <div className={wrap}>
          <Eyebrow>Recent PRs</Eyebrow>
          <StatNumber size="md" tone="accent">
            {history.recentPRCount}
          </StatNumber>
          <Tiny>this phase</Tiny>
        </div>
      );
    case "phase":
      return (
        <div className={wrap}>
          <Eyebrow>Phase</Eyebrow>
          <p className="font-display italic text-base">{history.currentPhaseShort || "—"}</p>
          <Tiny>{history.currentPhaseName?.toLowerCase() ?? ""}</Tiny>
        </div>
      );
    case "effort":
      return (
        <div className={wrap}>
          <Eyebrow>Effort</Eyebrow>
          <StatNumber size="md">
            {history.avgEffort !== null ? history.avgEffort.toFixed(1) : "—"}
            <span className="text-muted2 text-sm font-light"> / 4</span>
          </StatNumber>
          <Tiny>steady</Tiny>
        </div>
      );
    case "mobility_count":
      return (
        <div className={wrap}>
          <Eyebrow>Mobility</Eyebrow>
          <StatNumber size="md">{history.mobilitySessionsThisBlock}</StatNumber>
          <Tiny>sessions</Tiny>
        </div>
      );
    case "rehab_sets":
      return (
        <div className={wrap}>
          <Eyebrow>Rehab sets</Eyebrow>
          <StatNumber size="md" tone="accent">
            {history.rehabSetsThisBlock}
          </StatNumber>
          <Tiny>this block</Tiny>
        </div>
      );
    case "reintroduced_count":
      return (
        <div className={wrap}>
          <Eyebrow>Reintroduced</Eyebrow>
          <StatNumber size="md" tone="accent">
            {history.reintroducedLifts.length}
          </StatNumber>
          <Tiny>exercises</Tiny>
        </div>
      );
    case "exercises_learned":
      return (
        <div className={wrap}>
          <Eyebrow>Learned</Eyebrow>
          <StatNumber size="md">{history.topLifts.length}</StatNumber>
          <Tiny>new exercises</Tiny>
        </div>
      );
  }
}
