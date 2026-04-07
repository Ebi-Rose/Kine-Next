/**
 * Override panel tests.
 *
 * Locks in two pieces of behaviour that are easy to break:
 *   1. The tri-state toggle cycle (default → opposite of engine → other override → default)
 *   2. The hidden-reason explanation only shows for engine-hidden cards,
 *      not for cards the user manually hid
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProgressOverridePanel from "../ProgressOverridePanel";
import type { ProgressLayout } from "@/lib/progress-engine";

// ── Store mock ────────────────────────────────────────────────────────────
//
// We mock useKineStore at module load. The test re-binds the mock state
// inside each test using `mockState`, so we can simulate the user toggling
// preferences and re-rendering with updated state.

let mockOverrides: Record<string, "force_show" | "force_hide"> = {};
let mockTimeWindow: ProgressLayout["window"] | null = null;
const setProgressPreference = jest.fn();
const setProgressTimeWindow = jest.fn();
const resetProgressPreferences = jest.fn();

jest.mock("@/store/useKineStore", () => ({
  useKineStore: () => ({
    progressPreferences: {
      overrides: mockOverrides,
      timeWindowOverride: mockTimeWindow,
    },
    setProgressPreference,
    setProgressTimeWindow,
    resetProgressPreferences,
  }),
}));

// BottomSheet renders children unconditionally when open — no portal — so
// RTL can find content via screen queries.

beforeEach(() => {
  mockOverrides = {};
  mockTimeWindow = null;
  setProgressPreference.mockClear();
  setProgressTimeWindow.mockClear();
  resetProgressPreferences.mockClear();
});

// ── Layout fixtures ───────────────────────────────────────────────────────

function makeLayout(overrides: Partial<ProgressLayout> = {}): ProgressLayout {
  return {
    window: "6wk",
    headerLabel: "Strength · 6wk view",
    tabs: [
      { id: "strength", label: "Strength" },
      { id: "body", label: "Body" },
      { id: "history", label: "History" },
    ],
    hero: { id: "strength_trend", variant: "delta", reason: "goal:build_strength" },
    gridTiles: [],
    strengthCards: [
      { id: "top_lifts", variant: "load_delta", reason: "goal:build_strength" },
      { id: "pr_feed", variant: "load_pr", reason: "goal:build_strength" },
      { id: "pattern_balance", variant: "delta", reason: "goal:build_strength" },
    ],
    bodyCards: [
      { id: "photos", variant: "intro", reason: "body:base" },
      { id: "bodyweight", variant: "demoted", reason: "body:base" },
    ],
    hiddenCards: [],
    cycleLensOn: false,
    isEmptyState: false,
    derivedGoal: "build_strength",
    ...overrides,
  };
}

// ── Tri-state toggle ──────────────────────────────────────────────────────

describe("ProgressOverridePanel — tri-state toggle", () => {
  it("toggling a visible card sets force_hide on first tap", () => {
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    // top_lifts is visible by default in the layout fixture above
    fireEvent.click(screen.getByText("Top lifts").closest("button")!);

    expect(setProgressPreference).toHaveBeenCalledWith("top_lifts", "force_hide");
  });

  it("toggling a hidden card sets force_show on first tap", () => {
    const layout = makeLayout({
      strengthCards: [], // strip top_lifts so it's not in the default visible set
      hiddenCards: [{ id: "top_lifts", reason: "experience:beginner" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    fireEvent.click(screen.getByText("Top lifts").closest("button")!);

    expect(setProgressPreference).toHaveBeenCalledWith("top_lifts", "force_show");
  });

  it("a force_show card flips to force_hide on second tap", () => {
    mockOverrides = { top_lifts: "force_show" };
    const layout = makeLayout({
      strengthCards: [],
      hiddenCards: [{ id: "top_lifts", reason: "experience:beginner" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    fireEvent.click(screen.getByText("Top lifts").closest("button")!);

    expect(setProgressPreference).toHaveBeenCalledWith("top_lifts", "force_hide");
  });

  it("a force_hide card clears to default on third tap", () => {
    mockOverrides = { top_lifts: "force_hide" };

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    fireEvent.click(screen.getByText("Top lifts").closest("button")!);

    expect(setProgressPreference).toHaveBeenCalledWith("top_lifts", null);
  });
});

// ── Time window override ──────────────────────────────────────────────────

describe("ProgressOverridePanel — time window", () => {
  it("default option clears the override to null", () => {
    mockTimeWindow = "12wk";

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    fireEvent.click(screen.getByText("Use engine default"));
    expect(setProgressTimeWindow).toHaveBeenCalledWith(null);
  });

  it("selecting 12wk sets the override", () => {
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    fireEvent.click(screen.getByText("12 weeks"));
    expect(setProgressTimeWindow).toHaveBeenCalledWith("12wk");
  });

  it("shows the engine default when no override is set", () => {
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);
    expect(screen.getByText(/Engine default: 6wk/)).toBeInTheDocument();
  });
});

// ── Hidden reason explanations ────────────────────────────────────────────

describe("ProgressOverridePanel — hidden reasons", () => {
  it("shows a humanized reason for an engine-hidden card", () => {
    // Beginner override hides strength_trend AND swaps the hero out for
    // sessions_completed, so neither strengthCards nor hero references it.
    const layout = makeLayout({
      strengthCards: [],
      hero: { id: "sessions_completed", variant: "first_weeks", reason: "experience:beginner" },
      hiddenCards: [{ id: "strength_trend", reason: "experience:beginner" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    const row = screen.getByText("Strength trend").closest("button")!;
    expect(within(row).getByText(/Hidden because:/)).toBeInTheDocument();
    expect(within(row).getByText(/Beginner phase/)).toBeInTheDocument();
  });

  it("does not show a reason when the user manually hid the card", () => {
    mockOverrides = { top_lifts: "force_hide" };

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    const row = screen.getByText("Top lifts").closest("button")!;
    expect(within(row).queryByText(/Hidden because:/)).not.toBeInTheDocument();
  });

  it("does not show a reason when the card is currently visible", () => {
    // top_lifts is visible by default in the fixture
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);

    const row = screen.getByText("Top lifts").closest("button")!;
    expect(within(row).queryByText(/Hidden because:/)).not.toBeInTheDocument();
  });

  it("translates lifeStage:postpartum<16w to a recovery message", () => {
    const layout = makeLayout({
      strengthCards: [],
      hiddenCards: [{ id: "pr_feed", reason: "lifeStage:postpartum<16w" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    const row = screen.getByText("Recent PRs").closest("button")!;
    expect(within(row).getByText(/Post-partum recovery/)).toBeInTheDocument();
  });

  it("translates condition:hypermobility to a control framing message", () => {
    const layout = makeLayout({
      strengthCards: [],
      hiddenCards: [{ id: "pr_feed", reason: "condition:hypermobility" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    const row = screen.getByText("Recent PRs").closest("button")!;
    expect(within(row).getByText(/Hypermobility/)).toBeInTheDocument();
  });

  it("falls back to the raw reason when no humanization exists", () => {
    const layout = makeLayout({
      strengthCards: [],
      hiddenCards: [{ id: "pattern_balance", reason: "some_unknown_rule" }],
    });

    render(<ProgressOverridePanel open onClose={jest.fn()} layout={layout} />);

    const row = screen.getByText("Pattern balance").closest("button")!;
    expect(within(row).getByText(/some_unknown_rule/)).toBeInTheDocument();
  });
});

// ── Reset button ──────────────────────────────────────────────────────────

describe("ProgressOverridePanel — reset", () => {
  it("does not show reset button when no overrides are set", () => {
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);
    expect(screen.queryByText(/Reset to engine defaults/)).not.toBeInTheDocument();
  });

  it("shows reset button when card overrides exist", () => {
    mockOverrides = { top_lifts: "force_hide" };
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);
    expect(screen.getByText(/Reset to engine defaults/)).toBeInTheDocument();
  });

  it("shows reset button when timeWindow override exists", () => {
    mockTimeWindow = "4wk";
    render(<ProgressOverridePanel open onClose={jest.fn()} layout={makeLayout()} />);
    expect(screen.getByText(/Reset to engine defaults/)).toBeInTheDocument();
  });

  it("clicking reset calls resetProgressPreferences and closes the panel", () => {
    mockOverrides = { top_lifts: "force_hide" };
    const onClose = jest.fn();
    render(<ProgressOverridePanel open onClose={onClose} layout={makeLayout()} />);

    fireEvent.click(screen.getByText(/Reset to engine defaults/));

    expect(resetProgressPreferences).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
