// ── Condition Context for AI Prompts ──
// Returns condition-specific constraints for all AI calls.
// Conditions are context, not identity — the programme adapts silently.

const CONDITION_CONTEXT: Record<string, string> = {
  pcos: "PCOS — prioritise compound movements for insulin sensitivity. Metabolic conditioning beneficial. Higher metabolic demand programming.",
  fibroids: "Fibroids — low-impact alternatives preferred. Avoid excessive intra-abdominal pressure during heavy loading. Flag high-impact exercises for swap.",
  endometriosis: "Endometriosis — low-impact alternatives on symptomatic days. Anti-inflammatory movement beneficial. Flag high-impact exercises. Late-luteal may need auto-scaling.",
  pelvic_floor: "Pelvic floor — no max-effort Valsalva loading. Exhale-on-exertion, not breath-holding. Pelvic floor-friendly alternatives for high-impact movements.",
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
