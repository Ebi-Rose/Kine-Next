// ── Progress Personalization Engine — compute-layout ──
//
// Pure rule chain that turns (profile, history, prefs) into a ProgressLayout.
// Spec: docs/specs/progress-personalization-engine.md §4
//
// Rules apply in order: base goal → life stage → conditions → injuries →
// experience → cycle lens → empty state → user overrides. Later rules can
// add, remove, reorder, or rewrite cards from earlier rules.

import type {
  CardId,
  EngineGoal,
  EngineHistory,
  EngineProfile,
  ExperienceLevel,
  HiddenCard,
  LayoutCard,
  LifeStage,
  ProgressLayout,
  ProgressPreferences,
  TabConfig,
  TimeWindow,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────

function withReason(id: CardId, variant: string, reason: string): LayoutCard {
  return { id, variant, reason };
}

/** Map the store's 3-value goal + life stage + injuries to the engine's 6-goal space. */
export function deriveEngineGoal(profile: EngineProfile): EngineGoal {
  const { rawGoal, lifeStage, injuries } = profile;

  if (lifeStage === "postpartum" || injuries.includes("postpartum")) {
    return "return_to_training";
  }
  if (
    (lifeStage === "perimenopause" || lifeStage === "post_menopause") &&
    rawGoal === "general"
  ) {
    return "maintain";
  }
  if (rawGoal === "strength") return "build_strength";
  if (rawGoal === "muscle") return "build_muscle";
  // general / null fall through to maintain
  return "maintain";
}

/** Map raw experience to the engine's 3-level enum. */
function deriveExperience(profile: EngineProfile, history: EngineHistory): ExperienceLevel {
  // Beginner: < 6 months training (~26 weeks) regardless of stated experience.
  if (history.weeksTraining > 0 && history.weeksTraining < 26) return "beginner";
  if (profile.experience === "new" || profile.experience === null) return "beginner";
  if (profile.experience === "developing") return "intermediate";
  return "intermediate"; // No "advanced" signal in onboarding yet — treat as intermediate.
}

/** Default time window per spec §3. */
export function defaultWindow(profile: EngineProfile, experience: ExperienceLevel, history: EngineHistory): TimeWindow {
  if (profile.lifeStage === "perimenopause" || profile.lifeStage === "post_menopause") return "12wk";
  if (profile.lifeStage === "pregnancy" || profile.lifeStage === "postpartum") return "hidden";
  if (experience === "beginner") return "hidden";
  if (
    profile.conditions.includes("chronic_fatigue") ||
    profile.conditions.includes("thyroid") ||
    profile.conditions.includes("hashimotos")
  ) {
    return "12wk";
  }
  // Honest fallback for users with very little history — show what we have.
  if (history.weeksTraining < 4) return "4wk";
  return "6wk";
}

// ── Mutable layout draft ──────────────────────────────────────────────────

interface Draft {
  cards: LayoutCard[];
  hero: { id: CardId; variant: string; reason: string };
  tabs: TabConfig[];
  gridTiles: Array<{ id: string; reason: string }>;
  bodyCards: LayoutCard[];
  /**
   * Cards the rule chain has removed from the default layout. Each entry
   * carries the rule that removed it. Later rules can re-add a card; if
   * they do, the matching hidden entry is dropped (the card is no longer
   * "hidden because…" since something else put it back).
   */
  hidden: HiddenCard[];
  cycleLensOn: boolean;
  isEmptyState: boolean;
  derivedGoal: EngineGoal;
}

/**
 * Remove cards from the draft and record *why*. The reason is the rule
 * id (e.g. "lifeStage:postpartum<16w") so the override panel can render
 * a human-readable label later.
 *
 * We always record the hidden entry — even if the card wasn't currently
 * in the visible list — because the rule's *intent* was to suppress it.
 * This matters for cards that live in the hero (strength_trend) or that
 * a different base layout would show. The override panel uses the
 * hidden entry to explain "this is hidden because…" regardless of which
 * base layout the engine chose.
 */
function removeCards(draft: Draft, ids: CardId[], reason: string): void {
  for (const id of ids) {
    draft.cards = draft.cards.filter((c) => c.id !== id);
    // Replace any earlier hidden entry for this card with the latest reason
    // (later rules win — that's the rule chain semantics).
    draft.hidden = draft.hidden.filter((h) => h.id !== id);
    draft.hidden.push({ id, reason });
  }
}

function ensureCard(draft: Draft, card: LayoutCard, position: "start" | "end" = "end"): void {
  if (draft.cards.some((c) => c.id === card.id)) return;
  if (position === "start") draft.cards.unshift(card);
  else draft.cards.push(card);
  // A later rule has put this card back — drop any earlier "hidden because"
  // entry; the user will see it as visible by default.
  draft.hidden = draft.hidden.filter((h) => h.id !== card.id);
}

function setHero(draft: Draft, id: CardId, variant: string, reason: string): void {
  draft.hero = { id, variant, reason };
}

// ── Base layouts per derived goal ─────────────────────────────────────────

function baseLayout(goal: EngineGoal, profile: EngineProfile): Draft {
  const draft: Draft = {
    cards: [],
    hero: { id: "strength_trend", variant: "delta", reason: "base" },
    tabs: [
      { id: "strength", label: "Strength" },
      { id: "body", label: "Body" },
      { id: "history", label: "History" },
    ],
    gridTiles: [],
    bodyCards: [],
    hidden: [],
    cycleLensOn: false,
    isEmptyState: false,
    derivedGoal: goal,
  };

  // Body tab cards are the same for almost everyone — variants change later.
  draft.bodyCards = [
    withReason("photos", "intro", "body:base"),
    withReason("bodyweight", "demoted", "body:base"),
    withReason("measurements_optin", "stub", "body:base"),
  ];

  switch (goal) {
    case "build_strength":
      setHero(draft, "strength_trend", "delta", "goal:build_strength");
      draft.gridTiles = [
        { id: "this_week", reason: "goal:build_strength" },
        { id: "recent_prs", reason: "goal:build_strength" },
        { id: "phase", reason: "goal:build_strength" },
        { id: "effort", reason: "goal:build_strength" },
      ];
      draft.cards = [
        withReason("top_lifts", "load_delta", "goal:build_strength"),
        withReason("pr_feed", "load_pr", "goal:build_strength"),
        withReason("pattern_balance", "delta", "goal:build_strength"),
      ];
      break;

    case "build_muscle":
      setHero(draft, "strength_trend", "delta", "goal:build_muscle");
      draft.gridTiles = [
        { id: "this_week", reason: "goal:build_muscle" },
        { id: "recent_prs", reason: "goal:build_muscle" },
        { id: "phase", reason: "goal:build_muscle" },
        { id: "effort", reason: "goal:build_muscle" },
      ];
      draft.cards = [
        withReason("pattern_balance", "coverage", "goal:build_muscle"),
        withReason("top_lifts", "load_delta", "goal:build_muscle"),
        withReason("pr_feed", "load_pr", "goal:build_muscle"),
      ];
      break;

    case "return_to_training":
      setHero(draft, "sessions_completed", "since_return", "goal:return_to_training");
      draft.tabs = [
        { id: "strength", label: "Training" },
        { id: "body", label: "Rehab" },
        { id: "history", label: "History" },
      ];
      draft.gridTiles = [
        { id: "this_week", reason: "goal:return_to_training" },
        { id: "reintroduced_count", reason: "goal:return_to_training" },
        { id: "rehab_sets", reason: "goal:return_to_training" },
        { id: "effort", reason: "goal:return_to_training" },
      ];
      draft.cards = [
        withReason("rehab_work", "shown", "goal:return_to_training"),
        withReason("effort_observation", "shown", "goal:return_to_training"),
        withReason("exercises_learned", "reintroduced", "goal:return_to_training"),
      ];
      break;

    case "maintain":
      setHero(draft, "sessions_completed", "holding_steady", "goal:maintain");
      draft.gridTiles = [
        { id: "this_week", reason: "goal:maintain" },
        { id: "mobility_count", reason: "goal:maintain" },
        { id: "phase", reason: "goal:maintain" },
        { id: "effort", reason: "goal:maintain" },
      ];
      draft.cards = [
        withReason("pattern_balance", "coverage", "goal:maintain"),
        withReason("mobility_log", "shown", "goal:maintain"),
        withReason("top_lifts", "load_delta", "goal:maintain"),
      ];
      break;

    case "perform_for_sport":
      setHero(draft, "phase_position", "shown", "goal:perform_for_sport");
      draft.gridTiles = [
        { id: "phase", reason: "goal:perform_for_sport" },
        { id: "this_week", reason: "goal:perform_for_sport" },
        { id: "recent_prs", reason: "goal:perform_for_sport" },
        { id: "effort", reason: "goal:perform_for_sport" },
      ];
      draft.cards = [
        withReason("top_lifts", "load_delta", "goal:perform_for_sport"),
        withReason("effort_control", "shown", "goal:perform_for_sport"),
        withReason("pattern_balance", "delta", "goal:perform_for_sport"),
      ];
      break;

    case "recomp":
      setHero(draft, "strength_trend", "delta", "goal:recomp");
      draft.gridTiles = [
        { id: "this_week", reason: "goal:recomp" },
        { id: "recent_prs", reason: "goal:recomp" },
        { id: "phase", reason: "goal:recomp" },
        { id: "effort", reason: "goal:recomp" },
      ];
      draft.cards = [
        withReason("pattern_balance", "coverage", "goal:recomp"),
        withReason("top_lifts", "load_delta", "goal:recomp"),
        withReason("pr_feed", "load_pr", "goal:recomp"),
      ];
      break;
  }

  // Bodyweight-only / minimal equipment swap.
  if (
    profile.equipment.includes("bodyweight") &&
    !profile.equipment.includes("barbell") &&
    !profile.equipment.includes("dumbbells")
  ) {
    draft.cards = draft.cards.map((c) =>
      c.id === "top_lifts"
        ? { ...c, variant: "reps_tempo", reason: c.reason + "→bodyweight" }
        : c.id === "pr_feed"
          ? { ...c, variant: "rep_pr", reason: c.reason + "→bodyweight" }
          : c
    );
  }

  return draft;
}

// ── Life-stage overrides ──────────────────────────────────────────────────

function applyLifeStage(draft: Draft, lifeStage: LifeStage, history: EngineHistory): void {
  if (lifeStage === "pregnancy") {
    removeCards(
      draft,
      ["strength_trend", "pr_feed", "top_lifts", "photos", "bodyweight"],
      "lifeStage:pregnancy"
    );
    draft.bodyCards = draft.bodyCards.filter(
      (c) => c.id !== "photos" && c.id !== "bodyweight"
    );
    setHero(draft, "sessions_completed", "neutral_count", "lifeStage:pregnancy");
    ensureCard(
      draft,
      withReason("rehab_work", "shown", "lifeStage:pregnancy"),
      "start"
    );
    ensureCard(
      draft,
      withReason("mobility_log", "shown", "lifeStage:pregnancy"),
      "end"
    );
    ensureCard(
      draft,
      withReason("effort_observation", "shown", "lifeStage:pregnancy"),
      "end"
    );
  }

  if (
    lifeStage === "postpartum" &&
    history.weeksSinceReturn !== null &&
    history.weeksSinceReturn < 16
  ) {
    removeCards(
      draft,
      ["pr_feed", "top_lifts", "strength_trend"],
      "lifeStage:postpartum<16w"
    );
    draft.bodyCards = draft.bodyCards.filter((c) => c.id !== "bodyweight");
    // Photos: opt-in prompt only — never auto-shown.
    draft.bodyCards = draft.bodyCards.map((c) =>
      c.id === "photos"
        ? { ...c, variant: "prompt_only", reason: c.reason + "→postpartum<16w" }
        : c
    );
    setHero(draft, "sessions_completed", "since_return", "lifeStage:postpartum<16w");
    ensureCard(
      draft,
      withReason("rehab_work", "shown", "lifeStage:postpartum"),
      "start"
    );
    ensureCard(
      draft,
      withReason("exercises_learned", "reintroduced", "lifeStage:postpartum"),
      "end"
    );
    ensureCard(
      draft,
      withReason("effort_observation", "shown", "lifeStage:postpartum"),
      "end"
    );
  }

  if (lifeStage === "perimenopause") {
    // 12-week window already set in defaultWindow. Cycle lens stays on
    // implicitly via the cycle rule below if cycle tracking is on.
    // No structural card changes here — voice changes are in framing.
  }

  if (lifeStage === "post_menopause") {
    // Promote pattern balance + mobility for bone-loading framing.
    ensureCard(
      draft,
      withReason("mobility_log", "shown", "lifeStage:post_menopause"),
      "end"
    );
    // Demote pr_feed (move it later in the list rather than removing).
    draft.cards = [
      ...draft.cards.filter((c) => c.id !== "pr_feed"),
      ...draft.cards.filter((c) => c.id === "pr_feed"),
    ];
  }
}

// ── Condition overrides ───────────────────────────────────────────────────

function applyConditions(draft: Draft, conditions: string[]): void {
  if (conditions.includes("pcos")) {
    draft.bodyCards = draft.bodyCards.map((c) =>
      c.id === "bodyweight"
        ? { ...c, variant: "hidden", reason: c.reason + "→pcos" }
        : c
    );
    ensureCard(
      draft,
      withReason("effort_observation", "shown", "condition:pcos"),
      "end"
    );
  }

  if (conditions.includes("endometriosis") || conditions.includes("pmdd")) {
    ensureCard(
      draft,
      withReason("symptom_context", "shown", "condition:endometriosis"),
      "end"
    );
  }

  if (conditions.includes("hypermobility")) {
    // Promote effort_control over pr_feed.
    removeCards(draft, ["pr_feed"], "condition:hypermobility");
    ensureCard(
      draft,
      withReason("effort_control", "shown", "condition:hypermobility"),
      "start"
    );
    // Top lifts swap to "controlled" framing variant.
    draft.cards = draft.cards.map((c) =>
      c.id === "top_lifts"
        ? { ...c, variant: "controlled", reason: c.reason + "→hypermobility" }
        : c
    );
  }

  if (
    conditions.includes("chronic_fatigue") ||
    conditions.includes("thyroid") ||
    conditions.includes("hashimotos")
  ) {
    ensureCard(
      draft,
      withReason("effort_observation", "shown", "condition:fatigue"),
      "start"
    );
  }

  if (conditions.includes("pelvic_floor") || conditions.includes("diastasis")) {
    draft.bodyCards = draft.bodyCards.map((c) =>
      c.id === "photos"
        ? { ...c, variant: "prompt_only", reason: c.reason + "→pelvic_floor" }
        : c
    );
  }
}

// ── Injury overrides ──────────────────────────────────────────────────────

function applyInjuries(draft: Draft, injuries: string[]): void {
  const hasActiveInjury = injuries.some(
    (i) => i !== "postpartum" && i !== "limited_mobility" && i !== "chronic_pain"
  );
  if (!hasActiveInjury) return;

  // Adapt tab labels — Strength becomes the only "training" surface.
  draft.tabs = draft.tabs.map((t) =>
    t.id === "body" ? { ...t, label: "Rehab" } : t
  );

  ensureCard(
    draft,
    withReason("rehab_work", "shown", "injury:active"),
    "end"
  );
}

// ── Experience overrides ──────────────────────────────────────────────────

function applyExperience(draft: Draft, experience: ExperienceLevel, history: EngineHistory): void {
  if (experience === "beginner") {
    removeCards(draft, ["strength_trend"], "experience:beginner");
    setHero(draft, "sessions_completed", "first_weeks", "experience:beginner");
    // Replace top_lifts(load_delta) with top_lifts(absolute) — beginners
    // see their actual current weights, not deltas.
    draft.cards = draft.cards.map((c) =>
      c.id === "top_lifts"
        ? { ...c, variant: "absolute", reason: c.reason + "→beginner" }
        : c.id === "pr_feed"
          ? { ...c, variant: "first_prs", reason: c.reason + "→beginner" }
          : c
    );
    // Only show exercises_learned if top_lifts isn't already visible —
    // top_lifts(absolute) already lists the same exercises with weights.
    if (!draft.cards.some((c) => c.id === "top_lifts")) {
      ensureCard(
        draft,
        withReason("exercises_learned", "first_weeks", "experience:beginner"),
        "start"
      );
    }
  }

  if (experience === "advanced") {
    ensureCard(
      draft,
      withReason("phase_position", "shown", "experience:advanced"),
      "start"
    );
    ensureCard(
      draft,
      withReason("effort_control", "shown", "experience:advanced"),
      "end"
    );
    removeCards(draft, ["exercises_learned"], "experience:advanced");
  }

  // Pure-history side: if there's no recent PR or trend data, demote them.
  if (history.recentPRCount === 0) {
    draft.cards = draft.cards.map((c) =>
      c.id === "pr_feed" ? { ...c, variant: "empty", reason: c.reason + "→no_prs" } : c
    );
  }
}

// ── Cycle lens ────────────────────────────────────────────────────────────

function applyCycleLens(draft: Draft, profile: EngineProfile): void {
  if (
    profile.cycleTrackingEnabled &&
    (profile.cycleType === "regular" || profile.cycleType === "irregular")
  ) {
    draft.cycleLensOn = true;
  }
  if (profile.lifeStage === "perimenopause") {
    draft.cycleLensOn = true; // hormonal-variation framing
  }
}

// ── Empty-state rule ──────────────────────────────────────────────────────

function applyEmptyState(draft: Draft, history: EngineHistory): void {
  if (history.sessionCountTotal >= 3) return;
  // Wipe everything down to a welcome — but record what we wiped so the
  // override panel can explain "Hidden because: not enough sessions yet".
  for (const card of draft.cards) {
    if (!draft.hidden.some((h) => h.id === card.id)) {
      draft.hidden.push({ id: card.id, reason: "empty_state" });
    }
  }
  draft.cards = [];
  draft.bodyCards = draft.bodyCards.filter((c) => c.id === "photos");
  draft.bodyCards = draft.bodyCards.map((c) =>
    c.id === "photos"
      ? { ...c, variant: "intro_optional", reason: "empty_state" }
      : c
  );
  setHero(draft, "empty_state", "welcome", "empty_state");
  draft.gridTiles = [
    { id: "this_week", reason: "empty_state" },
    { id: "effort", reason: "empty_state" },
  ];
  draft.isEmptyState = true;
}

// ── User overrides (principle #20) ────────────────────────────────────────

function applyUserOverrides(draft: Draft, prefs?: ProgressPreferences): void {
  if (!prefs) return;
  for (const [id, action] of Object.entries(prefs.overrides)) {
    if (action === "force_hide") {
      removeCards(draft, [id as CardId], "user_override");
    } else if (action === "force_show") {
      ensureCard(
        draft,
        withReason(id as CardId, "default", "user_override"),
        "end"
      );
    }
  }
}

// ── Tracking-mode filter ─────────────────────────────────────────────────

function applyTrackingModes(draft: Draft, modes: EngineProfile["trackingModes"]): void {
  if (!modes || modes.length === 0) return;

  // Body-tab cards gated by tracking preferences.
  if (!modes.includes("photos")) {
    draft.bodyCards = draft.bodyCards.filter((c) => c.id !== "photos");
    draft.hidden = draft.hidden.filter((h) => h.id !== "photos");
    draft.hidden.push({ id: "photos", reason: "tracking_mode:off" });
  }
  if (!modes.includes("bodyweight")) {
    draft.bodyCards = draft.bodyCards.filter((c) => c.id !== "bodyweight");
    draft.hidden = draft.hidden.filter((h) => h.id !== "bodyweight");
    draft.hidden.push({ id: "bodyweight", reason: "tracking_mode:off" });
  }
  if (!modes.includes("measurements")) {
    draft.bodyCards = draft.bodyCards.filter((c) => c.id !== "measurements_optin");
    draft.hidden = draft.hidden.filter((h) => h.id !== "measurements_optin");
    draft.hidden.push({ id: "measurements_optin", reason: "tracking_mode:off" });
  }

  // Strength-tab: hide lift-specific cards when lifts tracking is off.
  if (!modes.includes("lifts")) {
    removeCards(draft, ["top_lifts", "pr_feed", "pattern_balance"], "tracking_mode:off");
  }

  // Feeling: hide effort / symptom cards when feeling tracking is off.
  if (!modes.includes("feeling")) {
    removeCards(draft, ["effort_observation", "effort_control", "symptom_context"], "tracking_mode:off");
  }
}

// ── Header label ──────────────────────────────────────────────────────────

function buildHeaderLabel(
  draft: Draft,
  profile: EngineProfile,
  history: EngineHistory,
  window: TimeWindow
): string {
  if (draft.isEmptyState) return "Just getting started";
  if (draft.derivedGoal === "return_to_training") {
    if (history.weeksSinceReturn !== null) {
      return `Returning to training · week ${history.weeksSinceReturn}`;
    }
    return "Returning to training";
  }
  if (draft.derivedGoal === "perform_for_sport" && history.currentPhaseShort) {
    return `${history.currentPhaseShort}`;
  }
  if (draft.derivedGoal === "maintain") {
    return window === "12wk" ? "Maintain · 12-week view" : "Maintain";
  }
  if (profile.lifeStage === "perimenopause" || profile.lifeStage === "post_menopause") {
    return `Strength · 12-week view`;
  }
  if (profile.experience === "new" || history.weeksTraining < 26) {
    return `Getting started · week ${history.weeksTraining || 1}`;
  }
  return `Strength · ${window} view`;
}

// ── Main entry ────────────────────────────────────────────────────────────

export function computeProgressLayout(
  profile: EngineProfile,
  history: EngineHistory,
  prefs?: ProgressPreferences
): ProgressLayout {
  const goal = deriveEngineGoal(profile);
  const experience = deriveExperience(profile, history);
  const draft = baseLayout(goal, profile);
  draft.derivedGoal = goal;

  applyLifeStage(draft, profile.lifeStage, history);
  applyConditions(draft, profile.conditions);
  applyInjuries(draft, profile.injuries);
  applyExperience(draft, experience, history);
  applyCycleLens(draft, profile);
  applyEmptyState(draft, history);
  applyTrackingModes(draft, profile.trackingModes);
  applyUserOverrides(draft, prefs);

  const window = prefs?.timeWindowOverride ?? defaultWindow(profile, experience, history);
  const headerLabel = buildHeaderLabel(draft, profile, history, window);

  return {
    window,
    headerLabel,
    tabs: draft.tabs,
    hero: draft.hero,
    gridTiles: draft.gridTiles,
    strengthCards: draft.cards,
    bodyCards: draft.bodyCards,
    hiddenCards: draft.hidden,
    cycleLensOn: draft.cycleLensOn,
    isEmptyState: draft.isEmptyState,
    derivedGoal: goal,
  };
}
