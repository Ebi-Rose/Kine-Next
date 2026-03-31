"use client";

import { useKineStore } from "@/store/useKineStore";
import { kgToDisplay, weightUnit } from "@/lib/format";
import { getCurrentPhaseInfo } from "@/lib/periodisation";

/**
 * Strength trend — capability tracking with phase overlay.
 *
 * Shows composite strength progress across top lifts,
 * with periodisation phase bands so users understand
 * why load might intentionally dip during accumulation weeks.
 *
 * Principle: "No guilt metrics" — deloads are labelled, dips are contextualised.
 */

interface DataPoint {
  weekNum: number;
  totalWeight: number; // Sum of best weight per lift that week
  phase: string;
}

const PHASE_COLORS: Record<string, string> = {
  Accumulation: "rgba(106, 154, 122, 0.12)",
  Intensification: "rgba(196, 144, 152, 0.12)",
  Peak: "rgba(196, 168, 114, 0.12)",
  Deload: "rgba(138, 122, 90, 0.08)",
};

const PHASE_TEXT_COLORS: Record<string, string> = {
  Accumulation: "#6a9a7a",
  Intensification: "#c49098",
  Peak: "#c4a872",
  Deload: "#8a7a5a",
};

export default function StrengthTrend() {
  const { progressDB, measurementSystem } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const { lifts, currentWeek, sessions, phaseOffset } = progressDB;

  // Need at least 2 weeks of data
  if (currentWeek < 3) return null;

  // Build data points: for each completed week, sum the best weight per lift
  const liftNames = Object.keys(lifts).filter(
    (k) => Array.isArray(lifts[k]) && lifts[k].length > 0
  );
  if (liftNames.length === 0) return null;

  const dataPoints: DataPoint[] = [];

  for (let w = 1; w < currentWeek; w++) {
    // Check if this week had sessions
    const weekSessions = sessions.filter(
      (s: { weekNum?: number }) => s.weekNum === w
    );
    if (weekSessions.length === 0) continue;

    // Sum best weight per lift for this week
    // We approximate by looking at lift entries up to this week's sessions
    let totalWeight = 0;
    const sessionCount = sessions.filter(
      (s: { weekNum?: number }) => s.weekNum && s.weekNum <= w
    ).length;

    liftNames.forEach((name) => {
      const entries = lifts[name];
      // Take entries up to roughly this week's data
      const relevantEntries = entries.slice(
        0,
        Math.min(entries.length, Math.ceil((w / currentWeek) * entries.length))
      );
      if (relevantEntries.length > 0) {
        const best = relevantEntries.reduce(
          (b, e) => (e.weight > b.weight ? e : b),
          relevantEntries[0]
        );
        totalWeight += best.weight;
      }
    });

    if (totalWeight > 0) {
      const phaseInfo = getCurrentPhaseInfo(w, phaseOffset);
      dataPoints.push({
        weekNum: w,
        totalWeight,
        phase: phaseInfo.phase.name,
      });
    }
  }

  if (dataPoints.length < 2) return null;

  // Chart dimensions
  const W = 320;
  const H = 100;
  const PAD = { top: 8, right: 8, bottom: 20, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minY = Math.min(...dataPoints.map((d) => d.totalWeight)) * 0.95;
  const maxY = Math.max(...dataPoints.map((d) => d.totalWeight)) * 1.05;
  const rangeY = maxY - minY || 1;

  const xScale = (i: number) =>
    PAD.left + (i / (dataPoints.length - 1)) * chartW;
  const yScale = (v: number) =>
    PAD.top + chartH - ((v - minY) / rangeY) * chartH;

  // Build SVG line path
  const linePath = dataPoints
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.totalWeight)}`)
    .join(" ");

  // Build area path (fill under line)
  const areaPath = `${linePath} L ${xScale(dataPoints.length - 1)} ${PAD.top + chartH} L ${xScale(0)} ${PAD.top + chartH} Z`;

  // Phase background bands
  const phaseBands: { x1: number; x2: number; phase: string }[] = [];
  let bandStart = 0;
  let currentPhase = dataPoints[0].phase;
  dataPoints.forEach((d, i) => {
    if (d.phase !== currentPhase || i === dataPoints.length - 1) {
      phaseBands.push({
        x1: xScale(bandStart),
        x2: xScale(i === dataPoints.length - 1 ? i : i - 1),
        phase: currentPhase,
      });
      bandStart = i;
      currentPhase = d.phase;
    }
  });
  // Push last band if needed
  if (bandStart < dataPoints.length - 1) {
    phaseBands.push({
      x1: xScale(bandStart),
      x2: xScale(dataPoints.length - 1),
      phase: currentPhase,
    });
  }

  // Overall trend
  const first = dataPoints[0].totalWeight;
  const last = dataPoints[dataPoints.length - 1].totalWeight;
  const trendPct = ((last - first) / first) * 100;
  const trendUp = trendPct > 0;

  return (
    <div className="mt-6 rounded-[10px] border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] tracking-[0.15em] uppercase text-muted font-medium">
          Strength trend
        </h2>
        <span
          className={`text-[10px] font-medium ${
            trendUp ? "text-green-400" : "text-muted2"
          }`}
        >
          {trendUp ? "+" : ""}
          {trendPct.toFixed(1)}%
        </span>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto", maxHeight: "120px" }}
      >
        {/* Phase background bands */}
        {phaseBands.map((band, i) => (
          <g key={i}>
            <rect
              x={band.x1}
              y={PAD.top}
              width={band.x2 - band.x1}
              height={chartH}
              fill={PHASE_COLORS[band.phase] || "transparent"}
              rx={3}
            />
            <text
              x={(band.x1 + band.x2) / 2}
              y={H - 4}
              textAnchor="middle"
              fill={PHASE_TEXT_COLORS[band.phase] || "#666"}
              fontSize={7}
              fontFamily="inherit"
            >
              {band.phase.slice(0, 3)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="rgba(196, 144, 152, 0.08)" />

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
        {dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.totalWeight)}
            r={i === dataPoints.length - 1 ? 3 : 2}
            fill={
              i === dataPoints.length - 1
                ? "var(--color-accent)"
                : "var(--color-surface)"
            }
            stroke="var(--color-accent)"
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Current value */}
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-muted2 font-light">
          Combined top weights across {liftNames.length} lift
          {liftNames.length > 1 ? "s" : ""}
        </span>
        <span className="text-text font-medium">
          {kgToDisplay(last, system)}
          {unit}
        </span>
      </div>
    </div>
  );
}
