// ── Outside Activity Context ──
//
// Consumer module for outside-activity-rules.ts.
// Follows the same pattern as condition-context.ts.
// Spec: docs/specs/outside-activity-rules.md

import {
  OUTSIDE_ACTIVITY_RULES,
  type OutsideActivityId,
  type ActivityIntent,
  type OutsideActivityRule,
} from "@/data/outside-activity-rules";

/**
 * Resolve each activity's intent: the focus activity gets "focus",
 * everything else gets "constraint".
 */
function resolveIntents(
  activities: OutsideActivityId[],
  focus: OutsideActivityId | null,
): Array<{ rule: OutsideActivityRule; intent: ActivityIntent }> {
  return activities
    .filter((id) => id in OUTSIDE_ACTIVITY_RULES)
    .map((id) => ({
      rule: OUTSIDE_ACTIVITY_RULES[id],
      intent: id === focus ? "focus" as const : "constraint" as const,
    }));
}

/**
 * Build the globalFraming string for the week-builder system prompt.
 * Concatenates intent-aware framing for each activity.
 */
export function getActivityContext(
  activities: OutsideActivityId[],
  focus: OutsideActivityId | null,
): string {
  const resolved = resolveIntents(activities, focus);
  if (resolved.length === 0) return "";

  return resolved
    .map(({ rule, intent }) => rule.globalFraming[intent])
    .join("\n");
}

/**
 * Build the user-facing coach note for outside activities.
 */
export function getActivityCoachNote(
  activities: OutsideActivityId[],
  focus: OutsideActivityId | null,
): string {
  const resolved = resolveIntents(activities, focus);
  if (resolved.length === 0) return "";

  return resolved
    .map(({ rule, intent }) => rule.coachNote[intent])
    .join(" ");
}

/**
 * Compute the stacked volume multiplier across all constraint activities.
 * Focus activities do not reduce volume — they shape exercise selection.
 */
export function getActivityVolumeMultiplier(
  activities: OutsideActivityId[],
  focus: OutsideActivityId | null,
): number {
  const resolved = resolveIntents(activities, focus);
  return resolved.reduce((mult, { rule, intent }) => {
    if (intent === "constraint" && rule.constraintRules.volumeMultiplier != null) {
      return mult * rule.constraintRules.volumeMultiplier;
    }
    return mult;
  }, 1.0);
}
