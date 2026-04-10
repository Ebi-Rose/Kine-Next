// ── Note Insight Extraction ──
//
// Lightweight Haiku call to extract structured training insights
// from the user's free-text weekly check-in note. Returns []
// gracefully on any failure — insights are additive, not blocking.

import { apiFetch } from "./api";
import type { NoteInsight } from "@/store/useKineStore";

const INSIGHT_SYSTEM = `You extract structured training insights from a user's free-text weekly note about their strength training. Return ONLY a JSON array. Each item: {"insight":"short actionable phrase","category":"preference"|"discomfort"|"positive"|"request","exerciseRef":"optional exercise name if mentioned"}. Max 5 items. If the note has no actionable training content, return [].`;

export async function extractInsights(note: string): Promise<NoteInsight[]> {
  if (!note || note.trim().length < 5) return [];

  try {
    const res = await apiFetch({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: INSIGHT_SYSTEM,
      messages: [{ role: "user", content: note.slice(0, 500) }],
    });

    const text = res.content?.[0]?.text || "[]";
    const openBracket = text.indexOf("[");
    const closeBracket = text.lastIndexOf("]");
    if (openBracket < 0 || closeBracket < 0) return [];

    const parsed = JSON.parse(text.slice(openBracket, closeBracket + 1));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (x: unknown): x is NoteInsight =>
          !!x &&
          typeof x === "object" &&
          typeof (x as NoteInsight).insight === "string" &&
          ["preference", "discomfort", "positive", "request"].includes(
            (x as NoteInsight).category,
          ),
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}
