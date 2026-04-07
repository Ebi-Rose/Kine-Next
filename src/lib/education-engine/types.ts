// ── Education Personalization Engine — Types ──
//
// Pure data shapes used by computeEducationFeed(). The engine reuses
// EngineProfile + EngineHistory from the Progress engine deliberately —
// one schema, two surfaces. Adding a profile key in progress-engine flows
// here automatically.
//
// Spec: docs/specs/education-personalization.md

import type { EngineProfile, EngineHistory } from "@/lib/progress-engine";

export type Topic =
  | "form"
  | "programming"
  | "recovery"
  | "nutrition"
  | "cycle"
  | "life_stage"
  | "injury_rehab"
  | "mindset"
  | "equipment"
  | "glossary";

export type ArticleLength = "short" | "medium" | "long";

export type SurfaceContext =
  | "onboarding"
  | "first_30_days"
  | "phase:deload"
  | "phase:peak"
  | "post_session"
  | "anytime";

/**
 * Audience filter — every key optional. An article with no audience keys
 * is universal. Keys reuse the Progress engine vocabulary verbatim so a
 * single schema drives both surfaces.
 */
export interface ArticleAudience {
  level?: "beginner" | "intermediate" | "advanced" | "any";
  life_stage?:
    | "general"
    | "pregnancy"
    | "postpartum"
    | "perimenopause"
    | "post_menopause"
    | "any";
  goal?:
    | "build_strength"
    | "build_muscle"
    | "recomp"
    | "return_to_training"
    | "maintain"
    | "perform_for_sport"
    | "any";
  /** Article requires at least this much equipment. */
  equipment_min?: "bodyweight_only" | "minimal" | "home_equipped" | "full_gym";
  /** Conditions the article is *for*. Empty/absent = applies to anyone. */
  conditions?: string[];
  /** Active injury areas the article is *for*. */
  injury_areas?: string[];
}

export interface EducationArticle {
  id: string;
  title: string;
  description: string;
  body: string;
  published: string;
  updated?: string;
  length: ArticleLength;
  topic: Topic;
  audience?: ArticleAudience;
  surfaces_at?: SurfaceContext[];
  /** Safe for symptomatic / fragile contexts. Defaults to true if absent. */
  gentle?: boolean;
  /** Hard exclusions — see spec §3.4. */
  not_for_life_stage?: string[];
  not_for_conditions?: string[];
}

/**
 * User overrides — principle #20. Lives in the store under
 * `educationPreferences`. Engine applies them last so they always win.
 */
export interface EducationPreferences {
  /** Topics the user has toggled off. */
  topicsOff: Topic[];
  /** Article ids the user has read (engine hides them by default). */
  seen: string[];
  /** Show all articles, no matching. Escape hatch. */
  showAll: boolean;
  /** Hide already-read articles (default: true). */
  hideSeen: boolean;
}

/**
 * Optional debug fields the engine may attach to a returned article so
 * tests + the override panel can explain *why* it ranked where it did.
 * Strip before sending to UI components if you care about bundle size.
 */
export interface RankedArticle extends EducationArticle {
  _score?: number;
  _reasons?: string[];
}

export interface EducationFeed {
  /** One-line label shown above the feed. The only explicit personalization tell. */
  headerLabel: string;
  /** Articles in display order, already filtered, scored, deduped, diversified. */
  feed: RankedArticle[];
  /** True if the engine produced an empty feed after filtering. */
  isEmpty: boolean;
}

// Re-export the profile/history types so callers can import everything
// from one place.
export type { EngineProfile, EngineHistory };
