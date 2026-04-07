/**
 * Card component tests.
 *
 * Focuses on the variants where engine output crosses into render logic —
 * the spots where a regression would silently change what users see.
 *
 * Coverage:
 *   - ProgressHero: each variant renders the right verdict
 *   - StatGrid: tile ids resolve to the right content
 *   - TopLiftsCard: variant + injury-hidden filtering
 *   - PatternBalanceCard: delta vs. coverage variants
 *   - RecentPRsStrip: empty state + load_pr/rep_pr variants
 *   - ProgressTabs: adaptive labels (Strength → Training/Rehab)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import ProgressHero from "../ProgressHero";
import ProgressTabs from "../ProgressTabs";
import StatGrid from "../StatGrid";
import TopLiftsCard from "../TopLiftsCard";
import RecentPRsStrip from "../RecentPRsStrip";
import PatternBalanceCard from "../PatternBalanceCard";
import type { EngineHistory, TopLiftEntry } from "@/lib/progress-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeHistory(overrides: Partial<EngineHistory> = {}): EngineHistory {
  return {
    sessionCountTotal: 24,
    sessionsThisWeek: 3,
    targetThisWeek: 4,
    weeksTraining: 8,
    weeksSinceReturn: null,
    currentPhaseLabel: "Phase 2 · Intensification · wk 2",
    currentPhaseShort: "P2 · wk 2/3",
    currentPhaseName: "Intensification",
    recentPRCount: 4,
    recentPRs: [],
    topLifts: [],
    patternBalance: null,
    combinedStrengthDeltaPct: 8,
    avgEffort: 3,
    symptomDays: [],
    injuryHiddenLifts: [],
    reintroducedLifts: [],
    rehabSetsThisBlock: 0,
    mobilitySessionsThisBlock: 0,
    ...overrides,
  };
}

function makeLift(name: string, latestWeight: number, delta = 0): TopLiftEntry {
  return {
    name,
    latestWeight,
    latestReps: 5,
    baselineWeight: latestWeight - delta,
    delta,
    isBodyweight: latestWeight === 0,
  };
}

// ── ProgressHero ──────────────────────────────────────────────────────────

describe("ProgressHero", () => {
  it("delta variant: shows positive verdict when delta is positive", () => {
    render(<ProgressHero variant="delta" combinedDeltaPct={8} sparklinePoints={[]} />);
    expect(screen.getByText(/Stronger by 8%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. your baseline/)).toBeInTheDocument();
  });

  it("delta variant: shows neutral verdict when delta is null", () => {
    render(<ProgressHero variant="delta" combinedDeltaPct={null} />);
    expect(screen.getByText(/Building your baseline/)).toBeInTheDocument();
  });

  it("delta variant: shows lower verdict when delta is negative", () => {
    render(<ProgressHero variant="delta" combinedDeltaPct={-3} />);
    expect(screen.getByText(/Lower by 3%/)).toBeInTheDocument();
  });

  it("first_weeks variant: shows beginner-friendly count", () => {
    render(<ProgressHero variant="first_weeks" totalSessions={12} weeks={4} />);
    expect(screen.getByText(/12 sessions in 4 weeks/)).toBeInTheDocument();
    expect(screen.getByText(/strong start/)).toBeInTheDocument();
  });

  it("since_return variant: shows recovery-friendly count", () => {
    render(<ProgressHero variant="since_return" totalSessions={12} weeks={10} />);
    expect(screen.getByText(/12 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Since you came back/)).toBeInTheDocument();
  });

  it("welcome variant: shows empty-state message", () => {
    render(<ProgressHero variant="welcome" totalSessions={2} />);
    expect(screen.getByText(/2 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/come back once you/)).toBeInTheDocument();
  });

  it("phase_position variant: shows phase short label", () => {
    render(<ProgressHero variant="phase_position" phaseShort="Peak · wk 2/3" daysToEvent={12} />);
    expect(screen.getByText(/Peak · wk 2\/3/)).toBeInTheDocument();
    expect(screen.getByText(/12 days/)).toBeInTheDocument();
  });

  it("holding_steady variant: says holding when delta is small", () => {
    render(<ProgressHero variant="holding_steady" combinedDeltaPct={1} />);
    expect(screen.getByText(/Holding steady/)).toBeInTheDocument();
  });

  it("neutral_count variant: shows pregnancy-safe count", () => {
    render(<ProgressHero variant="neutral_count" totalSessions={6} />);
    expect(screen.getByText(/6 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Showing up is the work/)).toBeInTheDocument();
  });
});

// ── ProgressTabs ──────────────────────────────────────────────────────────

describe("ProgressTabs", () => {
  it("renders the three engine-provided labels", () => {
    const tabs = [
      { id: "strength" as const, label: "Strength" },
      { id: "body" as const, label: "Body" },
      { id: "history" as const, label: "History" },
    ];
    render(<ProgressTabs tabs={tabs} active="strength" onChange={jest.fn()} />);
    expect(screen.getByRole("tab", { name: "Strength" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Body" })).toBeInTheDocument();
  });

  it("respects adapted labels (Body → Rehab when injured)", () => {
    const tabs = [
      { id: "strength" as const, label: "Training" },
      { id: "body" as const, label: "Rehab" },
      { id: "history" as const, label: "History" },
    ];
    render(<ProgressTabs tabs={tabs} active="strength" onChange={jest.fn()} />);
    expect(screen.getByRole("tab", { name: "Training" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rehab" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Body" })).not.toBeInTheDocument();
  });

  it("calls onChange with the new tab id when clicked", () => {
    const onChange = jest.fn();
    const tabs = [
      { id: "strength" as const, label: "Strength" },
      { id: "body" as const, label: "Body" },
      { id: "history" as const, label: "History" },
    ];
    render(<ProgressTabs tabs={tabs} active="strength" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Body" }));
    expect(onChange).toHaveBeenCalledWith("body");
  });

  it("marks the active tab with aria-selected", () => {
    const tabs = [
      { id: "strength" as const, label: "Strength" },
      { id: "body" as const, label: "Body" },
      { id: "history" as const, label: "History" },
    ];
    render(<ProgressTabs tabs={tabs} active="body" onChange={jest.fn()} />);
    expect(screen.getByRole("tab", { name: "Body" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Strength" })).toHaveAttribute("aria-selected", "false");
  });
});

// ── StatGrid ──────────────────────────────────────────────────────────────

describe("StatGrid", () => {
  it("this_week tile shows sessions / target with correct numbers", () => {
    const history = makeHistory({ sessionsThisWeek: 3, targetThisWeek: 4 });
    render(<StatGrid tiles={["this_week"]} history={history} />);
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 4")).toBeInTheDocument();
  });

  it("recent_prs tile shows the count", () => {
    render(<StatGrid tiles={["recent_prs"]} history={makeHistory({ recentPRCount: 7 })} />);
    expect(screen.getByText("Recent PRs")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("phase tile shows the engine's phase short label", () => {
    render(<StatGrid tiles={["phase"]} history={makeHistory({ currentPhaseShort: "P2 · wk 2/3" })} />);
    expect(screen.getByText("P2 · wk 2/3")).toBeInTheDocument();
  });

  it("effort tile shows '—' when avgEffort is null", () => {
    render(<StatGrid tiles={["effort"]} history={makeHistory({ avgEffort: null })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("effort tile shows the average otherwise", () => {
    render(<StatGrid tiles={["effort"]} history={makeHistory({ avgEffort: 3.6 })} />);
    expect(screen.getByText("3.6")).toBeInTheDocument();
  });

  it("rehab_sets tile shows the block count", () => {
    render(<StatGrid tiles={["rehab_sets"]} history={makeHistory({ rehabSetsThisBlock: 42 })} />);
    expect(screen.getByText("Rehab sets")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders all 4 tiles in a 2x2 grid", () => {
    render(
      <StatGrid
        tiles={["this_week", "recent_prs", "phase", "effort"]}
        history={makeHistory()}
      />
    );
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("Recent PRs")).toBeInTheDocument();
    expect(screen.getByText("Phase")).toBeInTheDocument();
    expect(screen.getByText("Effort")).toBeInTheDocument();
  });
});

// ── TopLiftsCard ──────────────────────────────────────────────────────────

describe("TopLiftsCard", () => {
  it("load_delta variant: shows ↑ delta with kg unit", () => {
    const lifts = [makeLift("Back Squat", 70, 5)];
    render(<TopLiftsCard variant="load_delta" lifts={lifts} system="metric" />);
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText(/↑ 5kg/)).toBeInTheDocument();
  });

  it("absolute variant: shows current weight, no delta", () => {
    const lifts = [makeLift("Squat", 40)];
    render(<TopLiftsCard variant="absolute" lifts={lifts} system="metric" />);
    expect(screen.getByText(/40 kg/)).toBeInTheDocument();
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
  });

  it("controlled variant: shows tempo+load eyebrow", () => {
    const lifts = [makeLift("Goblet Squat", 24)];
    render(<TopLiftsCard variant="controlled" lifts={lifts} system="metric" />);
    expect(screen.getByText("Top controlled lifts")).toBeInTheDocument();
  });

  it("filters out injury-hidden lifts silently", () => {
    const lifts = [
      makeLift("Back Squat", 70, 5),
      makeLift("Overhead Press", 30, 0),
    ];
    render(
      <TopLiftsCard
        variant="load_delta"
        lifts={lifts}
        hiddenLifts={["Overhead Press"]}
        system="metric"
      />
    );
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.queryByText("Overhead Press")).not.toBeInTheDocument();
  });

  it("returns null when no lifts remain after filtering", () => {
    const { container } = render(
      <TopLiftsCard
        variant="load_delta"
        lifts={[makeLift("Overhead Press", 30)]}
        hiddenLifts={["Overhead Press"]}
        system="metric"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("annotates substituted lifts with the original name", () => {
    const lift: TopLiftEntry = {
      ...makeLift("Goblet Squat", 24),
      substituted: true,
      substitutedFrom: "Back Squat",
    };
    render(<TopLiftsCard variant="absolute" lifts={[lift]} system="metric" />);
    expect(screen.getByText(/swapped from Back Squat/)).toBeInTheDocument();
  });
});

// ── RecentPRsStrip ────────────────────────────────────────────────────────

describe("RecentPRsStrip", () => {
  it("empty variant returns null", () => {
    const { container } = render(
      <RecentPRsStrip variant="empty" prs={[]} system="metric" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when prs array is empty even with load_pr variant", () => {
    const { container } = render(
      <RecentPRsStrip variant="load_pr" prs={[]} system="metric" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("load_pr variant shows weight × reps chips", () => {
    render(
      <RecentPRsStrip
        variant="load_pr"
        prs={[{ liftName: "Squat", weight: 70, reps: 5, date: "2026-04-01" }]}
        system="metric"
      />
    );
    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getByText(/70/)).toBeInTheDocument();
    expect(screen.getByText(/× 5/)).toBeInTheDocument();
  });

  it("rep_pr variant shows reps only", () => {
    render(
      <RecentPRsStrip
        variant="rep_pr"
        prs={[{ liftName: "Pushup", weight: 0, reps: 12, date: "2026-04-01" }]}
        system="metric"
      />
    );
    expect(screen.getByText(/12 reps/)).toBeInTheDocument();
  });

  it("first_prs variant uses first-time framing", () => {
    render(
      <RecentPRsStrip
        variant="first_prs"
        prs={[{ liftName: "Squat", weight: 30, reps: 5, date: "2026-04-01" }]}
        system="metric"
      />
    );
    expect(screen.getByText("First PRs")).toBeInTheDocument();
  });
});

// ── PatternBalanceCard ────────────────────────────────────────────────────

describe("PatternBalanceCard", () => {
  it("returns null when balance is null", () => {
    const { container } = render(
      <PatternBalanceCard variant="delta" balance={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when all volumes are zero", () => {
    const { container } = render(
      <PatternBalanceCard
        variant="delta"
        balance={{
          push: { volume: 0, deltaPct: 0 },
          pull: { volume: 0, deltaPct: 0 },
          legs: { volume: 0, deltaPct: 0 },
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("delta variant shows up/down percentage", () => {
    render(
      <PatternBalanceCard
        variant="delta"
        balance={{
          push: { volume: 5, deltaPct: 4 },
          pull: { volume: 4, deltaPct: 6 },
          legs: { volume: 8, deltaPct: 12 },
        }}
      />
    );
    expect(screen.getByText("↑4%")).toBeInTheDocument();
    expect(screen.getByText("↑6%")).toBeInTheDocument();
    expect(screen.getByText("↑12%")).toBeInTheDocument();
  });

  it("delta variant shows 'even' when delta is zero", () => {
    render(
      <PatternBalanceCard
        variant="delta"
        balance={{
          push: { volume: 5, deltaPct: 0 },
          pull: { volume: 5, deltaPct: 0 },
          legs: { volume: 5, deltaPct: 0 },
        }}
      />
    );
    const evens = screen.getAllByText("even");
    expect(evens.length).toBe(3);
  });

  it("coverage variant shows raw volume numbers", () => {
    render(
      <PatternBalanceCard
        variant="coverage"
        balance={{
          push: { volume: 5, deltaPct: 0 },
          pull: { volume: 4, deltaPct: 0 },
          legs: { volume: 8, deltaPct: 0 },
        }}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders Push / Pull / Legs labels", () => {
    render(
      <PatternBalanceCard
        variant="delta"
        balance={{
          push: { volume: 1, deltaPct: 0 },
          pull: { volume: 1, deltaPct: 0 },
          legs: { volume: 1, deltaPct: 0 },
        }}
      />
    );
    expect(screen.getByText("Push")).toBeInTheDocument();
    expect(screen.getByText("Pull")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
  });
});
