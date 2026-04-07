import { computeEducationFeed, defaultEducationPreferences } from "../compute-feed";
import type { EducationArticle, EducationPreferences } from "../types";
import type { EngineHistory, EngineProfile } from "@/lib/progress-engine";
import { educationLibrary } from "@/data/education-library";

// Same mocks as the progress-engine tests so this file is self-contained.
jest.mock("@/data/exercise-library", () => ({
  findExercise: () => null,
}));
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
    ...overrides,
  };
}

const prefs = (overrides: Partial<EducationPreferences> = {}): EducationPreferences => ({
  ...defaultEducationPreferences(),
  ...overrides,
});

// ── Archetype tests (mirrors spec §11) ───────────────────────────────────

describe("Education engine — archetypes", () => {
  test("Beginner build_strength: header + universal article surfaces, no life-stage leak", () => {
    const result = computeEducationFeed(
      profile({ experience: "new", rawGoal: "strength" }),
      history({ weeksTraining: 2, sessionCountTotal: 6 }),
      educationLibrary,
      prefs()
    );
    expect(result.headerLabel).toBe("For you · if you're new to lifting");
    expect(result.feed.find((a) => a.id === "why-glutes-are-the-priority")).toBeTruthy();
    expect(result.feed.find((a) => a.id === "perimenopause-recovery-window")).toBeFalsy();
    expect(result.feed.find((a) => a.id === "returning-after-baby-first-twelve-weeks")).toBeFalsy();
  });

  test("Perimenopause: header + perimenopause article appears, no postpartum leak", () => {
    const result = computeEducationFeed(
      profile({
        rawGoal: "general",
        lifeStage: "perimenopause",
        conditions: ["pcos"],
        injuries: ["knee"],
      }),
      history(),
      educationLibrary,
      prefs()
    );
    expect(result.headerLabel).toBe("For you · perimenopause");
    expect(result.feed.find((a) => a.id === "perimenopause-recovery-window")).toBeTruthy();
    expect(result.feed.find((a) => a.id === "returning-after-baby-first-twelve-weeks")).toBeFalsy();
  });

  test("Postpartum: header + postpartum article appears as top result", () => {
    const result = computeEducationFeed(
      profile({
        rawGoal: "general",
        lifeStage: "postpartum",
      }),
      history({ weeksSinceReturn: 10 }),
      educationLibrary,
      prefs()
    );
    expect(result.headerLabel).toBe("For you · returning after a baby");
    expect(result.feed[0].id).toBe("returning-after-baby-first-twelve-weeks");
    expect(result.feed.find((a) => a.id === "perimenopause-recovery-window")).toBeFalsy();
  });
});

describe("Education engine — overrides", () => {
  test("topicsOff filters out topics", () => {
    const result = computeEducationFeed(
      profile(),
      history(),
      educationLibrary,
      prefs({ topicsOff: ["programming"] })
    );
    expect(result.feed.find((a) => a.topic === "programming")).toBeFalsy();
  });

  test("seen + hideSeen hides already-read articles", () => {
    const result = computeEducationFeed(
      profile(),
      history(),
      educationLibrary,
      prefs({ seen: ["why-glutes-are-the-priority"] })
    );
    expect(result.feed.find((a) => a.id === "why-glutes-are-the-priority")).toBeFalsy();
  });

  test("showAll bypasses matching", () => {
    const result = computeEducationFeed(
      profile({ lifeStage: "general" }),
      history(),
      educationLibrary,
      prefs({ showAll: true })
    );
    // showAll returns the full library by recency, including life-stage-targeted articles
    expect(result.feed.length).toBe(educationLibrary.length);
  });
});

describe("Education engine — purity", () => {
  test("same inputs produce identical output", () => {
    const a = computeEducationFeed(profile(), history(), educationLibrary, prefs());
    const b = computeEducationFeed(profile(), history(), educationLibrary, prefs());
    expect(a.feed.map((x) => x.id)).toEqual(b.feed.map((x) => x.id));
  });
});

describe("Education engine — empty state", () => {
  test("returns isEmpty when no library", () => {
    const result = computeEducationFeed(profile(), history(), [], prefs());
    expect(result.isEmpty).toBe(true);
    expect(result.feed).toEqual([]);
  });

  test("hard-filtered to nothing returns isEmpty", () => {
    const onlyPostpartum: EducationArticle[] = educationLibrary.filter(
      (a) => a.audience?.life_stage === "postpartum"
    );
    const result = computeEducationFeed(
      profile({ lifeStage: "general" }),
      history(),
      onlyPostpartum,
      prefs()
    );
    expect(result.isEmpty).toBe(true);
  });
});
