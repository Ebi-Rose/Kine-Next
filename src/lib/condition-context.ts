// ── Condition Context for AI Prompts ──
//
// Returns condition-specific GLOBAL constraints for all AI calls.
// These are programme-wide framing guidelines for the LLM — NOT
// per-exercise swap rules.
//
// Per-exercise behaviour (avoid / modify) now lives in
// `exercise-indications.ts` and is enforced by the indication
// pipeline at filter time. This file is intentionally narrow:
// it tells the model what the condition MEANS for the user's
// programme as a whole. See docs/specs/exercise-indications.md §6.
//
// Conditions are context, not identity — the programme adapts silently.

const CONDITION_CONTEXT: Record<string, string> = {
  pcos: "PCOS — frame programming around compound movement patterns the user enjoys. Steady, sustainable progression. Avoid medical/treatment language.",
  fibroids: "Fibroids — low-impact alternatives preferred. Avoid excessive intra-abdominal pressure during heavy loading. Flag high-impact exercises for swap.",
  endometriosis: "Endometriosis — low-impact alternatives on symptomatic days. Anti-inflammatory movement beneficial. Flag high-impact exercises. Late-luteal may need auto-scaling.",
  pelvic_floor: "Pelvic floor — no max-effort Valsalva loading. Exhale-on-exertion, not breath-holding. Pelvic floor-friendly alternatives for high-impact movements.",
  hypermobility: "Hypermobility / EDS — cap deep range of motion (no end-range loading, no locked-out joints). Prefer tempo (3–4s eccentric) and isometric holds. Strictly avoid ballistic and plyometric movements (no jumps, no bounding, no bouncing reps). Dampen weekly volume by ~10–15%. Prioritise joint stability and control over mobility and depth. Longer rest between sets.",
};

/**
 * Build condition context string for AI prompts.
 * Returns empty string if no conditions, otherwise a newline-prefixed section.
 */
export function getConditionContext(conditions: string[]): string {
  if (!conditions || conditions.length === 0) return "";

  const parts = conditions
    .map((c) => CONDITION_CONTEXT[c])
    .filter(Boolean);

  if (parts.length === 0) return "";

  return "\n- Health conditions: " + parts.join("; ");
}
