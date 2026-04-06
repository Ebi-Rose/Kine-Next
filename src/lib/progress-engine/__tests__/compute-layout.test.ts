import {
  computeProgressLayout,
  deriveEngineGoal,
} from "../compute-layout";
import type { EngineHistory, EngineProfile } from "../types";

// Mock the exercise library so derive-history (used in some test fixtures) doesn't need real data.
jest.mock("@/data/exercise-library", () => ({
  findExercise: () => null,
}));

// Mock periodisation — derive-history is not called here, but compute-layout is pure.
jest.mock("@/lib/periodisation", () => ({
  getCurrentPhaseInfo: () => ({
    phase: { name: "Intensification", label: "STRENGTH WEEK", description: "" },
    blockNum: 2,
    blockWeek: 2,
    label: "STRENGTH WEEK",
    description: "",
  }),
}));

// ── Fixture builders ─────────────────────────────────────────────────────

function profile(overrides: Partial<EngineProfile> = {}): EngineProfile {
  return {
    rawGoal: "strength",
    experience: "developing",
    lifeStage: "general",
    age: 32,
    conditions: [],
    injuries: [],
    cycleTrackingEnabled: true,
    cycleType: "regular",
    equipment: ["barbell", "dumbbells"],
    ...overrides,
  };
}

function history(overrides: Partial<EngineHistory> = {}): EngineHistory {
  return {
    sessionCountTotal: 24,
    sessionsThisWeek: 3,
    targetThisWeek: 4,
    weeksTraining: 32,
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
    tempoAdherence: null,
    ...overrides,
  };
}

// ── Goal derivation ──────────────────────────────────────────────────────

describe("deriveEngineGoal", () => {
  it("returns return_to_training when postpartum is in injuries", () => {
    expect(
      deriveEngineGoal(profile({ injuries: ["postpartum"] }))
    ).toBe("return_to_training");
  });

  it("returns return_to_training when lifeStage is postpartum", () => {
    expect(
      deriveEngineGoal(profile({ lifeStage: "postpartum" }))
    ).toBe("return_to_training");
  });

  it("returns maintain when perimenopause + general", () => {
    expect(
      deriveEngineGoal(profile({ rawGoal: "general", lifeStage: "perimenopause" }))
    ).toBe("maintain");
  });

  it("returns build_strength for strength goal", () => {
    expect(deriveEngineGoal(profile({ rawGoal: "strength" }))).toBe("build_strength");
  });

  it("returns build_muscle for muscle goal", () => {
    expect(deriveEngineGoal(profile({ rawGoal: "muscle" }))).toBe("build_muscle");
  });

  it("falls through to maintain for general", () => {
    expect(deriveEngineGoal(profile({ rawGoal: "general" }))).toBe("maintain");
  });
});

// ── 8 archetypes (mirrors progress-page-ab-archetypes.html) ──────────────

describe("8 archetypes", () => {
  it("Archetype 01 — Sarah, intermediate strength", () => {
    const layout = computeProgressLayout(profile(), history());
    expect(layout.derivedGoal).toBe("build_strength");
    expect(layout.window).toBe("6wk");
    expect(layout.cycleLensOn).toBe(true);
    expect(layout.tabs.map((t) => t.label)).toEqual(["Strength", "Body", "History"]);
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")?.variant).toBe("load_delta");
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeTruthy();
    expect(layout.headerLabel).toBe("Strength · 6wk view");
  });

  it("Archetype 02 — Mia, beginner recomp", () => {
    const layout = computeProgressLayout(
      profile({ rawGoal: "muscle", experience: "new" }),
      history({ sessionCountTotal: 12, weeksTraining: 4, recentPRCount: 6, currentPhaseShort: "" })
    );
    // Beginner override hides strength_trend; promotes exercises_learned
    expect(layout.strengthCards.find((c) => c.id === "strength_trend")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "exercises_learned")).toBeTruthy();
    expect(layout.window).toBe("hidden");
    expect(layout.hero.id).toBe("sessions_completed");
    expect(layout.hero.variant).toBe("first_weeks");
    // Top lifts should be absolute, not delta-framed
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")?.variant).toBe("absolute");
  });

  it("Archetype 03 — Alex, post-partum week 10", () => {
    const layout = computeProgressLayout(
      profile({ lifeStage: "postpartum", injuries: ["postpartum"] }),
      history({ weeksSinceReturn: 10, sessionCountTotal: 12 })
    );
    expect(layout.derivedGoal).toBe("return_to_training");
    // Forbidden cards
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "strength_trend")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")).toBeFalsy();
    // Required cards
    expect(layout.strengthCards.find((c) => c.id === "rehab_work")).toBeTruthy();
    expect(layout.strengthCards.find((c) => c.id === "exercises_learned")).toBeTruthy();
    // Tabs adapt
    expect(layout.tabs.find((t) => t.id === "body")?.label).toBe("Rehab");
    // Body weight is hidden from Body tab
    expect(layout.bodyCards.find((c) => c.id === "bodyweight")).toBeFalsy();
    // Photos are prompt-only, not hidden entirely
    expect(layout.bodyCards.find((c) => c.id === "photos")?.variant).toBe("prompt_only");
  });

  it("Archetype 04 — Rachel, perimenopause + PCOS + knee", () => {
    const layout = computeProgressLayout(
      profile({
        rawGoal: "general",
        lifeStage: "perimenopause",
        conditions: ["pcos"],
        injuries: ["knees"],
      }),
      history()
    );
    expect(layout.derivedGoal).toBe("maintain");
    expect(layout.window).toBe("12wk");
    // PCOS: bodyweight hidden from Body tab
    const bodyweightCard = layout.bodyCards.find((c) => c.id === "bodyweight");
    expect(bodyweightCard?.variant).toBe("hidden");
    // Active injury: tab labels adapt
    expect(layout.tabs.find((t) => t.id === "body")?.label).toBe("Rehab");
    // Maintain layout: pattern balance is core
    expect(layout.strengthCards.find((c) => c.id === "pattern_balance")).toBeTruthy();
    expect(layout.strengthCards.find((c) => c.id === "mobility_log")).toBeTruthy();
  });

  it("Archetype 05 — Nina, advanced peak phase", () => {
    const layout = computeProgressLayout(
      profile({ rawGoal: "strength", experience: "intermediate" }),
      history({ currentPhaseName: "Peak", currentPhaseShort: "P3 · wk 1/3" })
    );
    expect(layout.derivedGoal).toBe("build_strength");
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")).toBeTruthy();
    // Cycle lens on for cycle-tracking user
    expect(layout.cycleLensOn).toBe(true);
  });

  it("Archetype 06 — Kira, hypermobile strength", () => {
    const layout = computeProgressLayout(
      profile({ conditions: ["hypermobility"] }),
      history()
    );
    // Hypermobility override: pr_feed removed, effort_control added, top_lifts → controlled
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "effort_control")).toBeTruthy();
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")?.variant).toBe(
      "controlled"
    );
  });

  it("Archetype 07 — Jess, first two sessions", () => {
    const layout = computeProgressLayout(
      profile({ rawGoal: "muscle", experience: "new" }),
      history({
        sessionCountTotal: 2,
        weeksTraining: 1,
        recentPRCount: 0,
        currentPhaseShort: "",
        currentPhaseName: null,
      })
    );
    expect(layout.isEmptyState).toBe(true);
    expect(layout.strengthCards.length).toBe(0);
    expect(layout.hero.id).toBe("empty_state");
    expect(layout.hero.variant).toBe("welcome");
    // Body tab still has the photos invitation
    expect(layout.bodyCards.find((c) => c.id === "photos")?.variant).toBe("intro_optional");
  });

  it("Archetype 08 — Dani, 4 weeks post shoulder injury", () => {
    const layout = computeProgressLayout(
      profile({ injuries: ["shoulder"] }),
      history()
    );
    // Active injury: tabs adapt and rehab card is added
    expect(layout.tabs.find((t) => t.id === "body")?.label).toBe("Rehab");
    expect(layout.strengthCards.find((c) => c.id === "rehab_work")).toBeTruthy();
    // strength_trend still in hero — only the contraindicated lifts are filtered
    // out at the component level (engine flags via injuries, not by removing the card).
  });
});

// ── Targeted spec assertions ─────────────────────────────────────────────

describe("Spec invariants", () => {
  it("post_partum < 16w never includes pr_feed", () => {
    const layout = computeProgressLayout(
      profile({ lifeStage: "postpartum", injuries: ["postpartum"] }),
      history({ weeksSinceReturn: 4 })
    );
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeFalsy();
  });

  it("perimenopause forces 12wk window", () => {
    const layout = computeProgressLayout(
      profile({ lifeStage: "perimenopause" }),
      history()
    );
    expect(layout.window).toBe("12wk");
  });

  it("PCOS demotes bodyweight card", () => {
    const layout = computeProgressLayout(profile({ conditions: ["pcos"] }), history());
    const bw = layout.bodyCards.find((c) => c.id === "bodyweight");
    expect(bw?.variant).toBe("hidden");
  });

  it("empty state hides all delta cards", () => {
    const layout = computeProgressLayout(profile(), history({ sessionCountTotal: 1 }));
    expect(layout.isEmptyState).toBe(true);
    expect(layout.strengthCards.find((c) => c.id === "strength_trend")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "top_lifts")).toBeFalsy();
  });

  it("hypermobility removes pr_feed and adds effort_control", () => {
    const layout = computeProgressLayout(
      profile({ conditions: ["hypermobility"] }),
      history()
    );
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeFalsy();
    expect(layout.strengthCards.find((c) => c.id === "effort_control")).toBeTruthy();
  });

  it("user overrides force a hidden card to show", () => {
    const layout = computeProgressLayout(
      profile({ lifeStage: "postpartum", injuries: ["postpartum"] }),
      history({ weeksSinceReturn: 8 }),
      { overrides: { pr_feed: "force_show" }, timeWindowOverride: null }
    );
    expect(layout.strengthCards.find((c) => c.id === "pr_feed")).toBeTruthy();
  });

  it("user override timeWindow wins over engine default", () => {
    const layout = computeProgressLayout(
      profile({ lifeStage: "perimenopause" }),
      history(),
      { overrides: {}, timeWindowOverride: "4wk" }
    );
    expect(layout.window).toBe("4wk");
  });

  it("bodyweight-only equipment swaps load PR variants for rep variants", () => {
    const layout = computeProgressLayout(
      profile({ equipment: ["bodyweight"] }),
      history()
    );
    const topLifts = layout.strengthCards.find((c) => c.id === "top_lifts");
    expect(topLifts?.variant).toBe("reps_tempo");
  });
});
