// ── Education Personalization Engine — compute-feed ──
//
// Pure function: (profile, history, library, preferences) -> EducationFeed.
// Mirrors the structure of compute-layout in progress-engine.
//
// Pipeline: hard filters -> topic overrides -> relevance scoring ->
// sort -> hide-seen -> diversity -> slice top N.
//
// Spec: docs/specs/education-personalization.md §5
//
// Aligned to the *real* schema from progress-engine: lifeStage uses
// "postpartum" (no underscore), experience is new/developing/intermediate,
// goal is derived via deriveEngineGoal().

import { deriveEngineGoal } from "@/lib/progress-engine";
import type {
  EducationArticle,
  EducationFeed,
  EducationPreferences,
  EngineHistory,
  EngineProfile,
  RankedArticle,
  Topic,
} from "./types";

const DEFAULT_LIMIT = 8;
const SMALL_LIBRARY_THRESHOLD = 10;

const EQUIPMENT_RANK: Record<string, number> = {
  bodyweight_only: 0,
  minimal: 1,
  home_equipped: 2,
  full_gym: 3,
};

/** Map the store's free-form equipment[] into a single tier the spec uses. */
function profileEquipmentTier(equipment: string[]): number {
  if (!equipment || equipment.length === 0) return 0; // bodyweight_only
  // Heuristic: presence of barbell/rack -> full_gym; dumbbell-only -> home_equipped;
  // bands/kettlebell only -> minimal. Avoids forcing onboarding to use the spec enum.
  const has = (k: string) => equipment.some((e) => e.toLowerCase().includes(k));
  if (has("barbell") || has("rack")) return EQUIPMENT_RANK.full_gym;
  if (has("dumbbell") || has("bench")) return EQUIPMENT_RANK.home_equipped;
  if (has("band") || has("kettlebell")) return EQUIPMENT_RANK.minimal;
  return EQUIPMENT_RANK.bodyweight_only;
}

function meetsEquipment(min: string | undefined, profileTier: number): boolean {
  if (!min) return true;
  const need = EQUIPMENT_RANK[min];
  if (need === undefined) return true;
  return profileTier >= need;
}

// ── Hard filters — return false to exclude from the personalized feed ────

function passesFilters(
  article: EducationArticle,
  profile: EngineProfile,
  derivedGoal: string,
  experience: "beginner" | "intermediate" | "advanced",
  equipmentTier: number
): { ok: boolean; reason?: string } {
  const aud = article.audience ?? {};

  if (aud.level && aud.level !== "any" && aud.level !== experience) {
    return { ok: false, reason: `level:${aud.level}` };
  }
  if (aud.life_stage && aud.life_stage !== "any" && aud.life_stage !== profile.lifeStage) {
    return { ok: false, reason: `life_stage:${aud.life_stage}` };
  }
  if (aud.goal && aud.goal !== "any" && aud.goal !== derivedGoal) {
    return { ok: false, reason: `goal:${aud.goal}` };
  }
  if (article.not_for_life_stage?.includes(profile.lifeStage)) {
    return { ok: false, reason: `not_for_life_stage:${profile.lifeStage}` };
  }
  if (article.not_for_conditions) {
    const blocked = profile.conditions.find((c) =>
      article.not_for_conditions!.includes(c)
    );
    if (blocked) return { ok: false, reason: `not_for_conditions:${blocked}` };
  }
  if (!meetsEquipment(aud.equipment_min, equipmentTier)) {
    return { ok: false, reason: `equipment_min:${aud.equipment_min}` };
  }
  return { ok: true };
}

// ── Relevance scoring — additive (spec §5.1) ─────────────────────────────

function relevance(
  article: EducationArticle,
  profile: EngineProfile,
  history: EngineHistory,
  derivedGoal: string,
  experience: "beginner" | "intermediate" | "advanced"
): { score: number; reasons: string[] } {
  const aud = article.audience ?? {};
  let score = 0;
  const reasons: string[] = [];

  if (aud.level && aud.level !== "any" && aud.level === experience) {
    score += 3;
    reasons.push("level+3");
  }
  if (aud.goal && aud.goal !== "any" && aud.goal === derivedGoal) {
    score += 3;
    reasons.push("goal+3");
  }
  if (aud.life_stage && aud.life_stage !== "any" && aud.life_stage === profile.lifeStage) {
    score += 5;
    reasons.push("life_stage+5");
  }

  // Condition overlap
  for (const c of aud.conditions ?? []) {
    if (profile.conditions.includes(c)) {
      score += 5;
      reasons.push(`condition:${c}+5`);
    }
  }

  // Injury overlap (profile.injuries is string[] in the real schema)
  for (const a of aud.injury_areas ?? []) {
    if (profile.injuries.some((i) => i.includes(a))) {
      score += 5;
      reasons.push(`injury:${a}+5`);
    }
  }

  // Surfaces_at
  const ctx = article.surfaces_at ?? [];
  if (history.currentPhaseName === "Deload" && ctx.includes("phase:deload")) {
    score += 4;
    reasons.push("phase:deload+4");
  }
  if (history.currentPhaseName === "Peak" && ctx.includes("phase:peak")) {
    score += 4;
    reasons.push("phase:peak+4");
  }
  if (ctx.includes("first_30_days") && history.weeksTraining < 5) {
    score += 4;
    reasons.push("first_30_days+4");
  }

  // Recency
  if (article.published) {
    const ageDays =
      (Date.now() - new Date(article.published).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 14) {
      score += 1;
      reasons.push("recent+1");
    }
  }

  // Symptom-day gentleness
  const symptomatic = (history.symptomDays ?? []).length > 0;
  if (symptomatic && article.gentle === true) {
    score += 2;
    reasons.push("gentle+2");
  }
  if (symptomatic && article.gentle === false) {
    score -= 3;
    reasons.push("not_gentle-3");
  }

  return { score, reasons };
}

// ── Diversity (spec §5.2) — never 3+ in a row from the same topic ────────

function enforceDiversity(sorted: RankedArticle[]): RankedArticle[] {
  const out: RankedArticle[] = [];
  const remaining = [...sorted];
  while (remaining.length) {
    let pickedIdx = 0;
    if (out.length >= 2) {
      const t1 = out[out.length - 1].topic;
      const t2 = out[out.length - 2].topic;
      if (t1 === t2) {
        const idx = remaining.findIndex((a) => a.topic !== t1);
        if (idx !== -1) pickedIdx = idx;
      }
    }
    out.push(remaining.splice(pickedIdx, 1)[0]);
  }
  return out;
}

// ── Header label (spec §7) — the one thin line above the feed ────────────

function headerLabelFor(profile: EngineProfile, derivedGoal: string): string {
  if (profile.lifeStage === "postpartum") return "For you · returning after a baby";
  if (profile.lifeStage === "pregnancy") return "For you · pregnancy";
  if (profile.lifeStage === "perimenopause") return "For you · perimenopause";
  if (profile.lifeStage === "post_menopause") return "For you · post-menopause";
  if (derivedGoal === "return_to_training") return "For you · returning to training";
  if (profile.experience === "new") return "For you · if you're new to lifting";
  return "For you";
}

// ── Experience derivation (mirrors progress-engine internal logic) ───────

function deriveExperienceLevel(
  profile: EngineProfile,
  history: EngineHistory
): "beginner" | "intermediate" | "advanced" {
  if (history.weeksTraining > 0 && history.weeksTraining < 26) return "beginner";
  if (profile.experience === "new" || profile.experience === null) return "beginner";
  if (profile.experience === "developing") return "intermediate";
  return "intermediate";
}

// ── Main entrypoint ──────────────────────────────────────────────────────

export interface ComputeFeedOptions {
  limit?: number;
}

export function computeEducationFeed(
  profile: EngineProfile,
  history: EngineHistory,
  library: EducationArticle[],
  preferences: EducationPreferences,
  opts: ComputeFeedOptions = {}
): EducationFeed {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const derivedGoal = deriveEngineGoal(profile);
  const experience = deriveExperienceLevel(profile, history);
  const equipmentTier = profileEquipmentTier(profile.equipment);
  const seen = new Set(preferences.seen);
  const headerLabel = headerLabelFor(profile, derivedGoal);

  // Escape hatch: show everything by recency.
  if (preferences.showAll) {
    const all = [...library].sort(byRecency);
    return { headerLabel, feed: all, isEmpty: all.length === 0 };
  }

  // Pipeline: filter -> topic override -> score -> sort -> hide seen ->
  // diversity (only when library is dense enough for it to matter) -> slice.
  const filtered = library.filter(
    (a) => passesFilters(a, profile, derivedGoal, experience, equipmentTier).ok
  );
  const afterTopic = filtered.filter((a) => !preferences.topicsOff.includes(a.topic));
  const scored: RankedArticle[] = afterTopic.map((a) => {
    const r = relevance(a, profile, history, derivedGoal, experience);
    return { ...a, _score: r.score, _reasons: r.reasons };
  });
  scored.sort((a, b) => {
    if ((b._score ?? 0) !== (a._score ?? 0)) return (b._score ?? 0) - (a._score ?? 0);
    return new Date(b.published).getTime() - new Date(a.published).getTime();
  });
  const deduped = preferences.hideSeen
    ? scored.filter((a) => !seen.has(a.id))
    : scored;
  // Diversity reordering needs density to be meaningful — skip below threshold.
  const ordered =
    library.length >= SMALL_LIBRARY_THRESHOLD ? enforceDiversity(deduped) : deduped;
  const feed = ordered.slice(0, limit);
  return { headerLabel, feed, isEmpty: feed.length === 0 };
}

function byRecency(a: EducationArticle, b: EducationArticle): number {
  return new Date(b.published).getTime() - new Date(a.published).getTime();
}

/** The default preferences a new user gets. */
export function defaultEducationPreferences(): EducationPreferences {
  return {
    topicsOff: [],
    seen: [],
    showAll: false,
    hideSeen: true,
  };
}

// Exported for tests
export const _internals = {
  passesFilters,
  relevance,
  enforceDiversity,
  headerLabelFor,
  deriveExperienceLevel,
  profileEquipmentTier,
};
