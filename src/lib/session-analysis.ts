// ── Post-Session AI Analysis ──
// Generates coaching feedback after a completed session

import { apiFetchStreaming, apiErrorMessage } from "./api";
import { useKineStore } from "@/store/useKineStore";
import { DURATION_OPTIONS } from "@/data/constants";
import { weightUnit } from "./format";
import { sanitizeInput } from "./sanitize";
import { getConditionRedFlagKeywords } from "./condition-context";
import { scanForRedFlags, type SafetyAlert } from "./red-flag-scan";

export type { SafetyAlert } from "./red-flag-scan";

export interface ExerciseFeedback {
  name: string;
  verdict: "strong" | "solid" | "building" | "adjust";
  note: string;
}

export interface AnalysisResult {
  overallAssessment: string;
  exerciseFeedback: ExerciseFeedback[];
  changes: { icon: string; title: string; detail: string }[];
  nextSession?: {
    title: string;
    coachNote: string;
  };
  /**
   * Populated by a deterministic pre-LLM scan of exercise notes
   * against the user's condition red-flag keywords. Undefined when
   * no red flag matched. Never authored by the LLM.
   */
  safetyAlert?: SafetyAlert;
}


const ANALYSIS_SYSTEM = `You are Kinē — a strength coach reviewing a completed session. Be direct, warm, specific. No jargon. No motivational poster language.

You are a coach, not a doctor. Never diagnose, prescribe, or claim exercises will treat or cure any condition. If something sounds like it needs medical attention, say "consider checking with your physio/doctor" — never give the medical opinion yourself.

For each exercise, give a verdict:
- "strong": exceeded expectations, impressive work
- "solid": on track, good execution
- "building": progressing, needs consistency
- "adjust": form, load, or approach needs changing

Return ONLY valid JSON:
{"overallAssessment":"2-3 sentences","exerciseFeedback":[{"name":"Exercise","verdict":"solid","note":"1 sentence"}],"changes":[{"icon":"↗","title":"short","detail":"1 sentence"}],"nextSession":{"title":"string","coachNote":"1 sentence"}}`;

const VALID_VERDICTS = new Set(["strong", "solid", "building", "adjust"]);

function validateAnalysisResult(raw: unknown): AnalysisResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Analysis response is not a JSON object");
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.overallAssessment !== "string" || !r.overallAssessment.trim()) {
    throw new Error("Missing overallAssessment");
  }

  if (!Array.isArray(r.exerciseFeedback)) {
    throw new Error("Missing exerciseFeedback array");
  }

  const exerciseFeedback: ExerciseFeedback[] = r.exerciseFeedback.map(
    (fb: unknown, i: number) => {
      if (!fb || typeof fb !== "object") {
        throw new Error(`exerciseFeedback[${i}]: not an object`);
      }
      const f = fb as Record<string, unknown>;
      if (typeof f.name !== "string" || !f.name.trim()) {
        throw new Error(`exerciseFeedback[${i}]: missing name`);
      }
      const verdict = String(f.verdict ?? "solid");
      return {
        name: String(f.name),
        verdict: (VALID_VERDICTS.has(verdict) ? verdict : "solid") as ExerciseFeedback["verdict"],
        note: String(f.note ?? ""),
      };
    }
  );

  const changes = Array.isArray(r.changes)
    ? r.changes.map((c: unknown) => {
        const ch = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
        return {
          icon: String(ch.icon ?? "→"),
          title: String(ch.title ?? ""),
          detail: String(ch.detail ?? ""),
        };
      })
    : [];

  const nextSession =
    r.nextSession && typeof r.nextSession === "object"
      ? {
          title: String((r.nextSession as Record<string, unknown>).title ?? ""),
          coachNote: String((r.nextSession as Record<string, unknown>).coachNote ?? ""),
        }
      : undefined;

  return { overallAssessment: r.overallAssessment.trim(), exerciseFeedback, changes, nextSession };
}

export async function analyseSession(
  sessionLogs: Record<string, unknown>,
  dayTitle: string,
  effort: number,
  soreness: number
): Promise<AnalysisResult | null> {
  const store = useKineStore.getState();
  const { goal, exp, duration, progressDB, conditions } = store;

  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

  // ── Deterministic pre-LLM red-flag scan ──────────────────────────
  // Collect raw exercise notes and scan them against the user's
  // curated condition keywords BEFORE the LLM call. The model is
  // deliberately unaware of red-flag logic; safety surfacing is not
  // generated from model output.
  const notesByExercise: { name: string; note: string }[] = Object.values(
    sessionLogs,
  )
    .map((ex: unknown) => {
      const e = ex as { name?: string; note?: string };
      return { name: String(e.name ?? ""), note: String(e.note ?? "") };
    })
    .filter((n) => n.name && n.note);
  const safetyAlert = scanForRedFlags(
    notesByExercise,
    getConditionRedFlagKeywords(conditions),
  );

  // Build exercise summary
  const exerciseSummary = Object.values(sessionLogs)
    .filter((ex: unknown) => {
      const e = ex as { actual?: { reps?: string; weight?: string }[] };
      return e.actual?.some((s) => s.reps || s.weight);
    })
    .map((ex: unknown) => {
      const e = ex as {
        name: string;
        planned: { sets: string; reps: string };
        actual: { reps: string; weight: string }[];
        note: string;
      };
      const sets = e.actual
        .filter((s) => s.reps || s.weight)
        .map((s) => `${s.reps} reps × ${s.weight || "BW"} ${weightUnit(store.measurementSystem || "metric")}`)
        .join(", ");
      return `${e.name}: planned ${e.planned.sets}×${e.planned.reps}, actual [${sets}]${e.note ? ` — note: ${e.note}` : ""}`;
    })
    .join("\n");

  const effortLabels = ["", "Too easy", "Moderate", "Hard", "Max effort"];
  const sorenessLabels = ["", "Fresh", "A little sore", "Pretty sore", "Beat up"];

  const prompt = `Review this completed session:

Session: ${dayTitle}
Goal: ${goal}
Level: ${exp}
Duration: ${durationLabel}
Week: ${(progressDB.sessions as { weekNum?: number }[]).reduce((m, s) => Math.max(m, s.weekNum || 1), progressDB.currentWeek)}
Total sessions completed: ${progressDB.sessions.length}

Effort rating: ${effort}/4 (${effortLabels[effort]})
Body feel: ${soreness}/4 (${sorenessLabels[soreness]})

Exercises logged:
${exerciseSummary}

Return JSON analysis with overallAssessment, exerciseFeedback (per exercise), changes (2-3 actionable items), and nextSession suggestion.`;

  try {
    const data = await apiFetchStreaming(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: ANALYSIS_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      },
      { timeoutMs: 15000 }
    );

    const text = data.content.map((b) => b.text || "").join("").trim();
    const clean = text.replace(/^```[\w]*[\s]*/m, "").replace(/[\s]*```$/m, "").trim();
    const j = clean.indexOf("{");
    const k = clean.lastIndexOf("}");
    if (j < 0 || k < 0) return null;

    const raw = JSON.parse(clean.slice(j, k + 1));
    const validated = validateAnalysisResult(raw);

    // Sanitize AI free-text fields to prevent injection
    validated.overallAssessment = sanitizeInput(validated.overallAssessment, 2000);
    validated.exerciseFeedback = validated.exerciseFeedback.map((ef) => ({
      ...ef,
      name: sanitizeInput(ef.name, 200),
      note: sanitizeInput(ef.note, 1000),
    }));
    validated.changes = validated.changes.map((c) => ({
      ...c,
      icon: sanitizeInput(c.icon, 10),
      title: sanitizeInput(c.title, 200),
      detail: sanitizeInput(c.detail, 1000),
    }));
    if (validated.nextSession) {
      validated.nextSession.title = sanitizeInput(validated.nextSession.title, 200);
      validated.nextSession.coachNote = sanitizeInput(validated.nextSession.coachNote, 1000);
    }

    // Attach the deterministic safety alert (if any). Computed
    // before the LLM call — never derived from model output.
    if (safetyAlert) validated.safetyAlert = safetyAlert;

    return validated;
  } catch (err) {
    console.error("Session analysis failed:", apiErrorMessage(err));
    // Even if the LLM call fails, we still want a safety alert to
    // surface if one was detected. Return a minimal result shape.
    if (safetyAlert) {
      return {
        overallAssessment: "",
        exerciseFeedback: [],
        changes: [],
        safetyAlert,
      };
    }
    return null;
  }
}
