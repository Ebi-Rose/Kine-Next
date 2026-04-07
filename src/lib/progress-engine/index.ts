// ── Progress Personalization Engine — barrel ──
//
// Single import surface for the page and tests.
//
//   import { computeProgressLayout, deriveEngineHistory, type ProgressLayout } from "@/lib/progress-engine";

export { deriveEngineHistory } from "./derive-history";
export {
  computeProgressLayout,
  deriveEngineGoal,
  defaultWindow,
} from "./compute-layout";
export type {
  CardId,
  CardVariant,
  EngineGoal,
  EngineHistory,
  EngineProfile,
  ExperienceLevel,
  HiddenCard,
  LayoutCard,
  LifeStage,
  PatternBalance,
  ProgressLayout,
  ProgressPreferences,
  RecentPR,
  TabConfig,
  TimeWindow,
  TopLiftEntry,
} from "./types";
