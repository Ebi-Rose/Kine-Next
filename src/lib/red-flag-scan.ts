// ── Red-flag scanner ───────────────────────────────────────────────
//
// Deterministic, dependency-free pre-LLM scan of exercise notes
// against curated condition keywords. Lives in its own file so the
// session-analysis module (which drags in the supabase client via
// the api helper) doesn't need to be imported in tests.
//
// NEVER call the LLM from here. NEVER read LLM output from here.
// Safety surfacing is authored data + regex, not model text.

export interface SafetyAlert {
  /** Matched red-flag phrases, for UI display. */
  triggered: string[];
  /** Exercise names whose notes triggered a match. */
  sources: string[];
  /** Fixed, deterministic call-to-action. Never LLM-authored. */
  cta: string;
  /** Single severity level (v0.1). */
  severity: "warn";
}

export const SAFETY_ALERT_CTA =
  "Consider checking in with your physio or doctor about this.";

/**
 * Scan exercise notes against a red-flag keyword index.
 *
 * Matching is case-insensitive and word-boundary aware on the left
 * edge only — "leak" will match "leaking" but NOT "bleaker". Keyword
 * regex metacharacters are escaped so authored keywords like
 * "C.R.P.S." match literally.
 *
 * Returns undefined when the scan index is empty, no notes are
 * provided, or nothing matched. Otherwise returns a SafetyAlert
 * carrying deduped triggered phrases and source exercise names.
 */
export function scanForRedFlags(
  notesByExercise: { name: string; note: string }[],
  scanIndex: { phrase: string; keywords: string[] }[],
): SafetyAlert | undefined {
  if (scanIndex.length === 0) return undefined;
  const triggered = new Set<string>();
  const sources = new Set<string>();

  for (const { name, note } of notesByExercise) {
    if (!note) continue;
    for (const entry of scanIndex) {
      for (const kw of entry.keywords) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp("\\b" + escaped + "\\w*", "i");
        if (re.test(note)) {
          triggered.add(entry.phrase);
          sources.add(name);
          break;
        }
      }
    }
  }

  if (triggered.size === 0) return undefined;
  return {
    triggered: Array.from(triggered),
    sources: Array.from(sources),
    cta: SAFETY_ALERT_CTA,
    severity: "warn",
  };
}
