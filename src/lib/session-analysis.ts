// ── Post-Session AI Analysis ──
// Generates coaching feedback after a completed session

import { apiFetchStreaming, apiErrorMessage } from "./api";
import { useKineStore } from "@/store/useKineStore";
import { DURATION_OPTIONS } from "@/data/constants";

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
}

const ANALYSIS_SYSTEM = `You are Kinē — a strength coach reviewing a completed session. Be direct, warm, specific. No jargon. No motivational poster language.

For each exercise, give a verdict:
- "strong": exceeded expectations, impressive work
- "solid": on track, good execution
- "building": progressing, needs consistency
- "adjust": form, load, or approach needs changing

Return ONLY valid JSON:
{"overallAssessment":"2-3 sentences","exerciseFeedback":[{"name":"Exercise","verdict":"solid","note":"1 sentence"}],"changes":[{"icon":"↗","title":"short","detail":"1 sentence"}],"nextSession":{"title":"string","coachNote":"1 sentence"}}`;

export async function analyseSession(
  sessionLogs: Record<string, unknown>,
  dayTitle: string,
  effort: number,
  soreness: number
): Promise<AnalysisResult | null> {
  const store = useKineStore.getState();
  const { goal, exp, duration, progressDB } = store;

  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

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
        .map((s) => `${s.reps} reps × ${s.weight || "BW"} kg`)
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
Week: ${progressDB.currentWeek}
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
        max_tokens: 2000,
        system: ANALYSIS_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      },
      { timeoutMs: 30000 }
    );

    const text = data.content.map((b) => b.text || "").join("").trim();
    const clean = text.replace(/^```[\w]*[\s]*/m, "").replace(/[\s]*```$/m, "").trim();
    const j = clean.indexOf("{");
    const k = clean.lastIndexOf("}");
    if (j < 0 || k < 0) return null;

    return JSON.parse(clean.slice(j, k + 1)) as AnalysisResult;
  } catch (err) {
    console.error("Session analysis failed:", apiErrorMessage(err));
    return null;
  }
}
