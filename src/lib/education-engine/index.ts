// ── Education Personalization Engine — barrel ──
//
// Single import surface for pages, components, and tests.
//
//   import {
//     computeEducationFeed,
//     defaultEducationPreferences,
//     type EducationFeed,
//   } from "@/lib/education-engine";
//
// Spec: docs/specs/education-personalization.md

export {
  computeEducationFeed,
  defaultEducationPreferences,
} from "./compute-feed";

export type {
  ArticleAudience,
  ArticleLength,
  EducationArticle,
  EducationFeed,
  EducationPreferences,
  EngineHistory,
  EngineProfile,
  RankedArticle,
  SurfaceContext,
  Topic,
} from "./types";
