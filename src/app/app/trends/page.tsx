"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useKineStore, type SessionRecord, type LiftEntry } from "@/store/useKineStore";
import { calculateORM } from "@/lib/progression";
import type { CyclePhase } from "@/lib/cycle";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import { kgToDisplay, weightUnit } from "@/lib/format";

// ── Design tokens ──

const CYCLE_PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "#c49098",
  follicular: "#6a9a7a",
  ovulatory: "#c4a872",
  luteal: "#7b8fa8",
};

const CYCLE_PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

const PERIOD_COLORS: Record<string, string> = {
  Accumulation: "rgba(106, 154, 122, 0.12)",
  Intensification: "rgba(196, 144, 152, 0.12)",
  Peak: "rgba(196, 168, 114, 0.12)",
  Deload: "rgba(138, 122, 90, 0.08)",
};

type TrendTab = "orm" | "volume" | "cycle" | "effort";

export default function TrendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TrendTab>("orm");

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-[13px] text-muted hover:text-text transition-colors mb-2"
      >
        &larr; Back
      </button>
      <h1 className="font-display text-2xl tracking-wide text-accent">
        Trends
      </h1>
      <p className="mt-1 text-xs text-muted2 font-light">
        See where you&apos;re getting stronger and how your body responds.
      </p>

      {/* Tab bar */}
      <div className="mt-5 flex gap-1 rounded-xl bg-surface border border-border p-1">
        {(
          [
            { key: "orm", label: "1RM" },
            { key: "volume", label: "Volume" },
            { key: "cycle", label: "Cycle" },
            { key: "effort", label: "Effort" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition-all ${
              activeTab === key
                ? "bg-accent-dim text-accent border border-accent/20"
                : "text-muted2 hover:text-text border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="mt-5">
        {activeTab === "orm" && <ORMTrendPanel />}
        {activeTab === "volume" && <VolumeTrendPanel />}
        {activeTab === "cycle" && <CyclePerformancePanel />}
        {activeTab === "effort" && <EffortRecoveryPanel />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel 1: Estimated 1RM Progression Per Lift
// ─────────────────────────────────────────────

function ORMTrendPanel() {
  const { progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const { lifts } = progressDB;

  const liftNames = Object.keys(lifts).filter(
    (k) => Array.isArray(lifts[k]) && lifts[k].length >= 2
  );

  const [selected, setSelected] = useState<string>(liftNames[0] || "");

  if (liftNames.length === 0) {
    return <EmptyState message="Log a few sessions to see your 1RM trends here." />;
  }

  const entries = lifts[selected] || [];
  const ormData = entries.map((e) => ({
    date: e.date,
    orm: calculateORM(e.weight, e.reps),
    weight: e.weight,
    reps: e.reps,
  }));

  const currentORM = ormData.length > 0 ? ormData[ormData.length - 1].orm : 0;
  const startORM = ormData.length > 0 ? ormData[0].orm : 0;
  const ormDelta = startORM > 0 ? ((currentORM - startORM) / startORM) * 100 : 0;

  // Find all-time best
  const bestORM = Math.max(...ormData.map((d) => d.orm), 0);
  const bestEntry = ormData.find((d) => d.orm === bestORM);

  return (
    <div>
      {/* Lift selector pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {liftNames
          .sort((a, b) => {
            const aMax = lifts[a].reduce((m, e) => Math.max(m, e.weight), 0);
            const bMax = lifts[b].reduce((m, e) => Math.max(m, e.weight), 0);
            return bMax - aMax;
          })
          .map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                selected === name
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border text-muted2 hover:border-border-active"
              }`}
            >
              {name}
            </button>
          ))}
      </div>

      {/* Header stats */}
      <div className="rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium">
            Estimated 1RM
          </h3>
          <span
            className={`text-[11px] font-medium ${
              ormDelta > 0 ? "text-green-400" : ormDelta < 0 ? "text-accent" : "text-muted2"
            }`}
          >
            {ormDelta > 0 ? "+" : ""}
            {ormDelta.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-text">
            {kgToDisplay(currentORM, system)}
          </span>
          <span className="text-sm text-muted2">{unit}</span>
        </div>

        {bestEntry && bestORM > currentORM && (
          <p className="mt-1 text-[10px] text-muted2 font-light">
            Best: {kgToDisplay(bestORM, system)}{unit} on {bestEntry.date}
          </p>
        )}

        {/* SVG line chart */}
        <ORMChart data={ormData} system={system} />
      </div>

      {/* Milestone callout */}
      {ormData.length >= 4 && (
        <ORMMilestones data={ormData} system={system} unit={unit} />
      )}
    </div>
  );
}

function ORMChart({
  data,
  system,
}: {
  data: { date: string; orm: number; weight: number; reps: number }[];
  system: "metric" | "imperial";
}) {
  const unit = weightUnit(system);

  if (data.length < 2) return null;

  const W = 320;
  const H = 140;
  const PAD = { top: 12, right: 12, bottom: 24, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const orms = data.map((d) => d.orm);
  const minY = Math.min(...orms) * 0.92;
  const maxY = Math.max(...orms) * 1.05;
  const rangeY = maxY - minY || 1;

  const xScale = (i: number) =>
    PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) =>
    PAD.top + chartH - ((v - minY) / rangeY) * chartH;

  // Smooth curve using cardinal spline approximation
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.orm) }));
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [minY, (minY + maxY) / 2, maxY].map((v) => ({
    value: Math.round(kgToDisplay(v, system)),
    y: yScale(v),
  }));

  // X-axis labels (first, middle, last dates)
  const xLabels = [
    { label: shortDate(data[0].date), x: xScale(0) },
    ...(data.length > 4
      ? [{ label: shortDate(data[Math.floor(data.length / 2)].date), x: xScale(Math.floor(data.length / 2)) }]
      : []),
    { label: shortDate(data[data.length - 1].date), x: xScale(data.length - 1) },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full mt-3"
      style={{ height: "auto", maxHeight: "160px" }}
      role="img"
      aria-label="1RM progression chart"
    >
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={tick.y}
            y2={tick.y}
            stroke="var(--color-border)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
          <text
            x={PAD.left - 4}
            y={tick.y + 3}
            textAnchor="end"
            fill="var(--color-muted)"
            fontSize={7}
            fontFamily="var(--font-body)"
          >
            {tick.value}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="rgba(196, 144, 152, 0.06)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3.5 : 2}
          fill={
            i === points.length - 1
              ? "var(--color-accent)"
              : "var(--color-surface)"
          }
          stroke="var(--color-accent)"
          strokeWidth={1}
        />
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={H - 4}
          textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
          fill="var(--color-muted)"
          fontSize={7}
          fontFamily="var(--font-body)"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

function ORMMilestones({
  data,
  system,
  unit,
}: {
  data: { date: string; orm: number }[];
  system: "metric" | "imperial";
  unit: string;
}) {
  // Find significant jumps (>5% increase from previous entry)
  const milestones: { date: string; orm: number; delta: number }[] = [];
  for (let i = 1; i < data.length; i++) {
    const pct = ((data[i].orm - data[i - 1].orm) / data[i - 1].orm) * 100;
    if (pct >= 5) {
      milestones.push({ date: data[i].date, orm: data[i].orm, delta: pct });
    }
  }

  if (milestones.length === 0) return null;

  return (
    <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
      <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium mb-3">
        Notable jumps
      </h4>
      <div className="flex flex-col gap-2">
        {milestones.slice(-3).map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted2 font-light">{shortDate(m.date)}</span>
            <div className="flex items-center gap-2">
              <span className="text-text">
                {kgToDisplay(m.orm, system)}{unit}
              </span>
              <span className="text-green-400 text-[10px]">
                +{m.delta.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel 2: Weekly Volume Trending
// ─────────────────────────────────────────────

function VolumeTrendPanel() {
  const { progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const { sessions, lifts, phaseOffset } = progressDB;

  const weeklyVolume = useMemo(() => {
    const byWeek: Record<number, { totalVolume: number; sessionCount: number; phase: string }> = {};

    (sessions as SessionRecord[]).forEach((s) => {
      const wk = s.weekNum || 0;
      if (wk <= 0) return;
      if (!byWeek[wk]) {
        const phaseInfo = getCurrentPhaseInfo(wk, phaseOffset);
        byWeek[wk] = { totalVolume: 0, sessionCount: 0, phase: phaseInfo.phase.name };
      }
      byWeek[wk].sessionCount++;
    });

    // Calculate volume from lift entries per week
    // Approximate: distribute lift entries across weeks based on session count
    Object.entries(lifts).forEach(([, entries]) => {
      if (!Array.isArray(entries)) return;
      entries.forEach((entry: LiftEntry) => {
        // Find which week this entry belongs to
        (sessions as SessionRecord[]).forEach((s) => {
          if (s.date === entry.date && s.weekNum && byWeek[s.weekNum]) {
            byWeek[s.weekNum].totalVolume += entry.weight * entry.reps;
          }
        });
      });
    });

    return Object.entries(byWeek)
      .map(([wk, data]) => ({
        week: parseInt(wk),
        volume: data.totalVolume,
        sessions: data.sessionCount,
        phase: data.phase,
      }))
      .sort((a, b) => a.week - b.week)
      .filter((w) => w.volume > 0);
  }, [sessions, lifts, phaseOffset]);

  if (weeklyVolume.length < 2) {
    return <EmptyState message="Complete a couple of weeks to see volume trends." />;
  }

  const maxVol = Math.max(...weeklyVolume.map((w) => w.volume));
  const latest = weeklyVolume[weeklyVolume.length - 1];
  const prev = weeklyVolume[weeklyVolume.length - 2];
  const volDelta = prev.volume > 0
    ? ((latest.volume - prev.volume) / prev.volume) * 100
    : 0;

  return (
    <div>
      {/* Summary */}
      <div className="rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium">
            Weekly volume
          </h3>
          <span
            className={`text-[11px] font-medium ${
              volDelta > 0 ? "text-green-400" : volDelta < -10 ? "text-accent" : "text-muted2"
            }`}
          >
            {volDelta > 0 ? "+" : ""}
            {volDelta.toFixed(0)}% vs last week
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-text">
            {formatLargeNumber(kgToDisplay(latest.volume, system))}
          </span>
          <span className="text-sm text-muted2">{unit} total</span>
        </div>

        {/* Bar chart with phase coloring */}
        <div className="mt-4 flex items-end gap-[3px] h-28">
          {weeklyVolume.slice(-12).map((w, i) => {
            const h = maxVol > 0 ? (w.volume / maxVol) * 100 : 50;
            const isLatest = i === weeklyVolume.slice(-12).length - 1;
            const phaseColor = PERIOD_COLORS[w.phase] || "rgba(196, 144, 152, 0.40)";

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(h, 6)}%`,
                    background: isLatest ? "var(--color-accent)" : phaseColor,
                  }}
                />
                <span className="text-[7px] text-muted font-light">
                  W{w.week}
                </span>
              </div>
            );
          })}
        </div>

        {/* Phase key */}
        <div className="mt-3 flex items-center gap-3 text-[9px] text-muted2">
          <span>Height = total weight moved (sets x reps x load)</span>
        </div>
      </div>

      {/* Volume context */}
      <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
        <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium mb-3">
          Week by week
        </h4>
        <div className="flex flex-col gap-2">
          {weeklyVolume.slice(-6).reverse().map((w) => (
            <div key={w.week} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text font-medium">Week {w.week}</span>
                <span className="text-[10px] text-muted2 font-light">
                  {w.phase} &middot; {w.sessions} session{w.sessions !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-muted2">
                {formatLargeNumber(kgToDisplay(w.volume, system))}{unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel 3: Cycle Phase Performance Map
// ─────────────────────────────────────────────

function CyclePerformancePanel() {
  const { cycleType, cycle, progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const { sessions, lifts } = progressDB;

  if (!cycleType || cycleType === "na" || cycleType === "hormonal") {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted2 mb-1">
          {cycleType === "hormonal"
            ? "Cycle insights work differently with hormonal contraception."
            : "Cycle tracking isn't active."}
        </p>
        <p className="text-xs text-muted font-light">
          {cycleType === "hormonal"
            ? "Your programming is already adapted for consistent hormonal levels."
            : "Enable cycle tracking in your profile to see how your phases affect your training."}
        </p>
      </div>
    );
  }

  // Map sessions to cycle phases
  const phaseData = useMemo(() => {
    const phases: Record<CyclePhase, { efforts: number[]; volumes: number[]; prCount: number; sessionCount: number }> = {
      menstrual: { efforts: [], volumes: [], prCount: 0, sessionCount: 0 },
      follicular: { efforts: [], volumes: [], prCount: 0, sessionCount: 0 },
      ovulatory: { efforts: [], volumes: [], prCount: 0, sessionCount: 0 },
      luteal: { efforts: [], volumes: [], prCount: 0, sessionCount: 0 },
    };

    (sessions as SessionRecord[]).forEach((s) => {
      if (!s.date) return;

      // Calculate what cycle phase this session was in
      const sessionDate = new Date(s.date);
      const periodLog = cycle.periodLog || [];
      const avgLength = cycle.avgLength || 28;

      // Find most recent period start before this session
      const starts = periodLog
        .filter((p) => p.type === "start" && new Date(p.date) <= sessionDate)
        .map((p) => new Date(p.date))
        .sort((a, b) => b.getTime() - a.getTime());

      if (starts.length === 0) return;

      const lastStart = starts[0];
      const daysSince = Math.floor(
        (sessionDate.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const cycleDay = ((daysSince % avgLength) + avgLength) % avgLength + 1;

      let phase: CyclePhase;
      if (cycleDay <= 5) phase = "menstrual";
      else if (cycleDay <= 13) phase = "follicular";
      else if (cycleDay <= 16) phase = "ovulatory";
      else phase = "luteal";

      phases[phase].sessionCount++;
      if (s.effort) phases[phase].efforts.push(s.effort);
      if (s.prs) phases[phase].prCount += s.prs.length;

      // Estimate session volume from lifts logged on this date
      Object.values(lifts).forEach((entries) => {
        if (!Array.isArray(entries)) return;
        entries.forEach((entry: LiftEntry) => {
          if (entry.date === s.date) {
            phases[phase].volumes.push(entry.weight * entry.reps);
          }
        });
      });
    });

    return phases;
  }, [sessions, cycle, lifts]);

  const hasData = Object.values(phaseData).some((p) => p.sessionCount > 0);

  if (!hasData) {
    return <EmptyState message="Log a few sessions with cycle tracking active to see phase patterns." />;
  }

  // Calculate averages
  const phaseStats = (Object.entries(phaseData) as [CyclePhase, typeof phaseData.menstrual][]).map(
    ([phase, data]) => ({
      phase,
      sessionCount: data.sessionCount,
      avgEffort:
        data.efforts.length > 0
          ? data.efforts.reduce((a, b) => a + b, 0) / data.efforts.length
          : null,
      totalVolume: data.volumes.reduce((a, b) => a + b, 0),
      avgVolume:
        data.volumes.length > 0
          ? data.volumes.reduce((a, b) => a + b, 0) / data.volumes.length
          : null,
      prCount: data.prCount,
    })
  );

  const maxAvgVolume = Math.max(
    ...phaseStats.map((p) => p.avgVolume || 0),
    1
  );

  // Find best phase for PRs
  const bestPRPhase = phaseStats.reduce((best, p) =>
    p.prCount > (best?.prCount || 0) ? p : best
  );

  return (
    <div>
      {/* Phase cards */}
      <div className="grid grid-cols-2 gap-2">
        {phaseStats.map(({ phase, sessionCount, avgEffort, avgVolume, prCount }) => (
          <div
            key={phase}
            className="rounded-[10px] border border-border bg-surface p-4"
            style={{ borderLeftWidth: 3, borderLeftColor: CYCLE_PHASE_COLORS[phase] }}
          >
            <p
              className="text-[10px] tracking-[0.12em] uppercase font-medium mb-2"
              style={{ color: CYCLE_PHASE_COLORS[phase] }}
            >
              {CYCLE_PHASE_LABELS[phase]}
            </p>

            {sessionCount === 0 ? (
              <p className="text-[10px] text-muted font-light">No data yet</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div>
                  <p className="font-display text-xl text-text">
                    {sessionCount}
                  </p>
                  <p className="text-[9px] text-muted2">
                    session{sessionCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {avgEffort !== null && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(avgEffort / 4) * 100}%`,
                          backgroundColor: CYCLE_PHASE_COLORS[phase],
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted2 w-8 text-right">
                      {avgEffort.toFixed(1)}/4
                    </span>
                  </div>
                )}

                {/* Volume bar relative to best phase */}
                {avgVolume !== null && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/60"
                        style={{
                          width: `${(avgVolume / maxAvgVolume) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted2 w-8 text-right">
                      vol
                    </span>
                  </div>
                )}

                {prCount > 0 && (
                  <p className="text-[10px] text-accent font-medium mt-0.5">
                    {prCount} PR{prCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Insight callout */}
      {bestPRPhase && bestPRPhase.prCount > 0 && (
        <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
          <p className="text-xs text-text">
            Most of your PRs have landed in your{" "}
            <span style={{ color: CYCLE_PHASE_COLORS[bestPRPhase.phase] }} className="font-medium">
              {CYCLE_PHASE_LABELS[bestPRPhase.phase]}
            </span>{" "}
            phase.
          </p>
          <p className="text-[10px] text-muted2 font-light mt-1">
            {bestPRPhase.phase === "ovulatory"
              ? "This is typical \u2014 peak estrogen supports strength and coordination."
              : bestPRPhase.phase === "follicular"
                ? "Rising estrogen in this phase supports pushing intensity."
                : bestPRPhase.phase === "menstrual"
                  ? "Interesting \u2014 some women find they lift well once initial discomfort passes."
                  : "This varies person to person \u2014 your body has its own rhythm."}
          </p>
        </div>
      )}

      {/* Minimum data notice */}
      {Object.values(phaseData).some((p) => p.sessionCount < 3) && (
        <p className="mt-3 text-[10px] text-muted font-light text-center">
          Patterns become clearer after 3+ cycles of data.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel 4: Effort & Recovery Trends
// ─────────────────────────────────────────────

function EffortRecoveryPanel() {
  const { progressDB } = useKineStore();
  const { sessions, weekFeedbackHistory } = progressDB;

  const sessionData = useMemo(() => {
    return (sessions as SessionRecord[])
      .filter((s) => s.date && (s.effort || s.soreness))
      .slice(-20)
      .map((s) => ({
        date: s.date!,
        title: s.title || "Session",
        effort: s.effort || 0,
        soreness: s.soreness || 0,
        weekNum: s.weekNum || 0,
        hasPR: (s.prs?.length || 0) > 0,
      }));
  }, [sessions]);

  if (sessionData.length < 3) {
    return <EmptyState message="A few more sessions and you'll see effort and recovery patterns here." />;
  }

  // Dual-line chart: effort + soreness over time
  const W = 320;
  const H = 130;
  const PAD = { top: 12, right: 12, bottom: 24, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) =>
    PAD.left + (i / (sessionData.length - 1)) * chartW;
  const yScale = (v: number) =>
    PAD.top + chartH - ((v - 0.5) / 4) * chartH;

  const effortPoints = sessionData.map((d, i) => ({ x: xScale(i), y: yScale(d.effort) }));
  const sorenessPoints = sessionData.map((d, i) => ({ x: xScale(i), y: yScale(d.soreness) }));

  const effortPath = buildSmoothPath(effortPoints);
  const sorenessPath = buildSmoothPath(sorenessPoints);

  // Averages
  const avgEffort = sessionData.reduce((s, d) => s + d.effort, 0) / sessionData.length;
  const avgSoreness = sessionData.reduce((s, d) => s + d.soreness, 0) / sessionData.length;

  // Recent trend (last 5 vs previous 5)
  const recent5 = sessionData.slice(-5);
  const prev5 = sessionData.slice(-10, -5);
  const recentEffort = recent5.reduce((s, d) => s + d.effort, 0) / recent5.length;
  const prevEffort = prev5.length > 0 ? prev5.reduce((s, d) => s + d.effort, 0) / prev5.length : recentEffort;
  const effortTrend = recentEffort - prevEffort;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-[10px] border border-border bg-surface p-4 text-center">
          <p className="font-display text-2xl text-accent">{avgEffort.toFixed(1)}</p>
          <p className="text-[9px] text-muted2 tracking-wider uppercase mt-0.5">Avg effort</p>
          <p className="text-[10px] text-muted font-light mt-1">
            {avgEffort >= 3 ? "Pushing well" : avgEffort >= 2 ? "Steady" : "Low energy period"}
          </p>
        </div>
        <div className="rounded-[10px] border border-border bg-surface p-4 text-center">
          <p className="font-display text-2xl text-[#7b8fa8]">{avgSoreness.toFixed(1)}</p>
          <p className="text-[9px] text-muted2 tracking-wider uppercase mt-0.5">Avg soreness</p>
          <p className="text-[10px] text-muted font-light mt-1">
            {avgSoreness >= 3 ? "Heavy load" : avgSoreness >= 2 ? "Recovering well" : "Fresh"}
          </p>
        </div>
      </div>

      {/* Dual line chart */}
      <div className="rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium">
            Last {sessionData.length} sessions
          </h3>
          <div className="flex items-center gap-3 text-[9px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-accent" />
              Effort
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-[#7b8fa8]" />
              Soreness
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "auto", maxHeight: "150px" }}
          role="img"
          aria-label="Effort and soreness trend chart"
        >
          {/* Y-axis labels */}
          {[1, 2, 3, 4].map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="var(--color-border)"
                strokeWidth={0.5}
                strokeDasharray="2,3"
              />
              <text
                x={PAD.left - 4}
                y={yScale(v) + 3}
                textAnchor="end"
                fill="var(--color-muted)"
                fontSize={7}
                fontFamily="var(--font-body)"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Soreness line (behind) */}
          <path
            d={sorenessPath}
            fill="none"
            stroke="#7b8fa8"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />

          {/* Effort line (front) */}
          <path
            d={effortPath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* PR markers */}
          {sessionData.map((d, i) =>
            d.hasPR ? (
              <g key={`pr-${i}`}>
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.effort)}
                  r={4}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={1}
                  opacity={0.5}
                />
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.effort)}
                  r={2.5}
                  fill="var(--color-accent)"
                />
              </g>
            ) : null
          )}

          {/* Data points — effort */}
          {effortPoints.map((p, i) => (
            <circle
              key={`e-${i}`}
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill="var(--color-accent)"
            />
          ))}

          {/* Data points — soreness */}
          {sorenessPoints.map((p, i) => (
            <circle
              key={`s-${i}`}
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill="#7b8fa8"
            />
          ))}

          {/* X labels */}
          <text
            x={xScale(0)}
            y={H - 4}
            textAnchor="start"
            fill="var(--color-muted)"
            fontSize={7}
            fontFamily="var(--font-body)"
          >
            {shortDate(sessionData[0].date)}
          </text>
          <text
            x={xScale(sessionData.length - 1)}
            y={H - 4}
            textAnchor="end"
            fill="var(--color-muted)"
            fontSize={7}
            fontFamily="var(--font-body)"
          >
            {shortDate(sessionData[sessionData.length - 1].date)}
          </text>
        </svg>

        {/* Trend note */}
        {prev5.length >= 3 && (
          <p className="mt-3 text-[10px] text-muted2 font-light">
            {Math.abs(effortTrend) < 0.3
              ? "Effort has been consistent recently."
              : effortTrend > 0
                ? "Effort has been trending up \u2014 keep an eye on recovery."
                : "Effort has dipped slightly \u2014 that's fine if it's intentional."}
          </p>
        )}
      </div>

      {/* Weekly check-in history */}
      {weekFeedbackHistory.length > 0 && (
        <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
          <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium mb-3">
            Weekly check-ins
          </h4>
          <div className="flex flex-col gap-2">
            {weekFeedbackHistory.slice(-6).reverse().map((fb) => (
              <div key={fb.weekNum} className="flex items-center justify-between text-xs">
                <span className="text-text font-medium">Week {fb.weekNum}</span>
                <div className="flex items-center gap-3 text-[10px] text-muted2">
                  <span>Energy: {fb.effort}/4</span>
                  <span>Body: {fb.soreness}/4</span>
                  {fb.scheduleFeeling && (
                    <span className={
                      fb.scheduleFeeling === "about_right"
                        ? "text-green-400"
                        : fb.scheduleFeeling === "too_much"
                          ? "text-accent"
                          : "text-muted2"
                    }>
                      {fb.scheduleFeeling === "about_right"
                        ? "Right"
                        : fb.scheduleFeeling === "too_much"
                          ? "Heavy"
                          : "Light"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted2 font-light">{message}</p>
    </div>
  );
}

/** Build a smooth SVG path from points using monotone cubic interpolation. */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to cubic bezier
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/** Format "2026-04-02" as "2 Apr" */
function shortDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return iso;
  }
}

/** Format large numbers compactly: 12500 → "12.5k" */
function formatLargeNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toString();
}
