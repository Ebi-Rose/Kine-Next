// ── Progress Personalization Engine — Types ──
//
// Pure data shapes used by computeProgressLayout(). The engine is intentionally
// decoupled from the Zustand store: callers project the store into an
// EngineProfile + EngineHistory and pass them in. This keeps the engine
// testable, snapshot-stable, and easy to reason about.
//
// Spec: docs/specs/progress-personalization-engine.md

export type EngineGoal =
  | "build_strength"
  | "build_muscle"
  | "recomp"
  | "return_to_training"
  | "maintain"
  | "perform_for_sport";

export type LifeStage =
  | "general"
  | "pregnancy"
  | "postpartum"
  | "perimenopause"
  | "post_menopause";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type TimeWindow = "4wk" | "6wk" | "12wk" | "hidden";

export type CardId =
  | "strength_trend"
  | "top_lifts"
  | "pr_feed"
  | "pattern_balance"
  | "sessions_completed"
  | "exercises_learned"
  | "effort_observation"
  | "effort_control"
  | "mobility_log"
  | "rehab_work"
  | "symptom_context"
  | "photos"
  | "bodyweight"
  | "phase_position"
  | "cycle_lens"
  | "history"
  | "calendar_link"
  | "empty_state"
  | "measurements_optin";

/** Per-card variants. Engine picks one; the component renders accordingly. */
export type CardVariant = string; // narrowed via per-card unions in the components

/** Tab labels. Adapt to user state — e.g. Strength→Training when injured. */
export interface TabConfig {
  id: "strength" | "body" | "history";
  label: string;
}

/**
 * Narrow projection of the user's profile that the engine reads.
 * Built via `selectEngineProfile(state)` in the page; the engine never
 * touches the store directly.
 */
export interface EngineProfile {
  /** Raw store goal (3-value) — engine derives 6-value EngineGoal from this + life stage + injuries */
  rawGoal: "muscle" | "strength" | "general" | null;
  experience: "new" | "developing" | "intermediate" | null;
  lifeStage: LifeStage;
  age: number | null;
  conditions: string[];
  injuries: string[];
  /**
   * Active injuries with derived metadata. Built in derive-history because
   * we don't yet store onset dates per injury. For now: severity is
   * inferred from condition + injury notes; weeks_since flagged via
   * postpartum tag or session-history heuristics.
   */
  cycleTrackingEnabled: boolean;
  cycleType: "regular" | "irregular" | "hormonal" | "perimenopause" | "na" | null;
  equipment: string[];
  /** Which sections the user wants visible on the Progress screen. */
  trackingModes: Array<"lifts" | "photos" | "measurements" | "bodyweight" | "feeling">;
}

/** Top lift entry produced by derive-history. */
export interface TopLiftEntry {
  name: string;
  /** Latest top weight in kg (0 if bodyweight). */
  latestWeight: number;
  /** 6-week rolling average top weight in kg. */
  baselineWeight: number;
  /** Delta vs. baseline in kg (latestWeight - baselineWeight). */
  delta: number;
  /** Latest top reps (used for bodyweight exercises). */
  latestReps: number;
  /** True if this is bodyweight (no load progression). */
  isBodyweight: boolean;
  /** True if this lift was substituted from another (engine annotation). */
  substituted?: boolean;
  /** Original lift name if substituted. */
  substitutedFrom?: string;
}

/** Recent PR for the PR feed. */
export interface RecentPR {
  liftName: string;
  weight: number;
  reps: number;
  date: string;
}

/** Push/pull/legs balance with deltas vs. baseline. */
export interface PatternBalance {
  push: { volume: number; deltaPct: number };
  pull: { volume: number; deltaPct: number };
  legs: { volume: number; deltaPct: number };
}

/**
 * Derived view over progressDB. Pure computation, no store reads.
 * Built once per render via `useMemo`.
 */
export interface EngineHistory {
  sessionCountTotal: number;
  sessionsThisWeek: number;
  targetThisWeek: number;
  weeksTraining: number;
  weeksSinceReturn: number | null; // null if not in a return-to-training period
  currentPhaseLabel: string; // e.g. "Phase 2 · Intensification · wk 6"
  currentPhaseShort: string; // e.g. "P2 · wk 6/8"
  currentPhaseName: "Accumulation" | "Intensification" | "Peak" | "Deload" | null;
  recentPRCount: number;
  recentPRs: RecentPR[];
  topLifts: TopLiftEntry[]; // sorted, most-changed first
  patternBalance: PatternBalance | null;
  /** Combined-strength delta (% change vs. own baseline). */
  combinedStrengthDeltaPct: number | null;
  /** Avg effort 0–4 across recent sessions, or null if no data. */
  avgEffort: number | null;
  /** Symptom days flagged in recent history. */
  symptomDays: string[];
  /** Lifts hidden by injury substitution (so the engine can drop them silently). */
  injuryHiddenLifts: string[];
  /** Lifts that were reintroduced this week (post-injury / post-partum). */
  reintroducedLifts: string[];
  /** Total rehab sets logged in the current block. */
  rehabSetsThisBlock: number;
  /** Mobility sessions count this block. */
  mobilitySessionsThisBlock: number;
}

/**
 * Card with its chosen variant and the rule that placed it.
 * `reason` is a machine-readable code; the override panel translates it
 * to a human-readable label when explaining why a card is currently hidden.
 */
export interface LayoutCard {
  id: CardId;
  variant: CardVariant;
  reason: string;
}

/**
 * A card the engine deliberately removed from the default layout, with the
 * rule that did the removing. Surfaced in the override panel so the user
 * can see *why* a card is hidden before they choose to force-show it.
 */
export interface HiddenCard {
  id: CardId;
  reason: string;
}

/** The engine's output. The page maps `cards` to React components by id. */
export interface ProgressLayout {
  /** Time window used everywhere on the page. */
  window: TimeWindow;
  /** Single line under "Progress" — the only explicit personalization tell. */
  headerLabel: string;
  /** Tabs to render — labels adapt (e.g. Training/Rehab/History when injured). */
  tabs: TabConfig[];
  /** Hero card config (id of the card to use as hero + its variant). */
  hero: { id: CardId; variant: CardVariant; reason: string };
  /** Stat-grid tile ids (4 of them) — engine picks which 4. */
  gridTiles: Array<{ id: string; reason: string }>;
  /** Strength-tab body cards in order. */
  strengthCards: LayoutCard[];
  /** Body-tab cards in order. */
  bodyCards: LayoutCard[];
  /**
   * Cards the engine deliberately removed from the default layout. Each
   * carries the rule that removed it so the override panel can explain
   * "Hidden because: postpartum < 16 weeks". Empty for users where the
   * default layout is the full set.
   */
  hiddenCards: HiddenCard[];
  /** True if cycle phase annotations are on for the strength chart. */
  cycleLensOn: boolean;
  /** True if engine produced an empty-state layout (less-than-3 sessions). */
  isEmptyState: boolean;
  /** Engine goal that was derived (for debugging). */
  derivedGoal: EngineGoal;
}

/**
 * User overrides — principle #20. Live in the store under
 * `progressPreferences`. Engine applies them last so they always win.
 */
export interface ProgressPreferences {
  overrides: Partial<Record<CardId, "force_show" | "force_hide">>;
  timeWindowOverride: TimeWindow | null;
}
