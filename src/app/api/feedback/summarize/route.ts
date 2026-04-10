import { NextRequest, NextResponse } from "next/server";
import { verifyCsrf } from "../../_lib/csrf";
import { createRatelimit } from "../../_lib/rate-limit";
import { getAuthenticatedUser } from "../../_lib/auth";

// Cleans up a raw voice-note transcript into a tight, readable feedback message.
// Uses Claude Haiku for cost. Returns plain text.

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5-20251001";

const ratelimit = createRatelimit("feedback-summarize", 10, "60 s");

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: "summarizer not configured" }, { status: 500 });
  }

  let body: { transcript?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  if (!transcript) {
    return NextResponse.json({ error: "empty transcript" }, { status: 400 });
  }
  if (transcript.length > 5000) {
    return NextResponse.json({ error: "transcript too long" }, { status: 400 });
  }

  const category = body.category ?? "general";

  const system = `You clean up voice-note feedback from beta users of a strength training app called Kine.

Take the raw transcript (which may have filler words, false starts, ums, repeated phrases) and rewrite it as a tight, clear feedback message — first person, the user's voice, no editorialising. Keep specifics (screens, exercises, exact wording the user used). Strip filler. Don't add anything that isn't in the transcript.

The category of feedback is: ${category}.

If the transcript is a bug report, structure as:
- What I was doing
- What I expected
- What happened

Otherwise just write 1–4 short sentences.

Return only the cleaned-up message. No preamble, no markdown headers, no quotes around it.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: `Transcript:\n${transcript}` }],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("[summarize] anthropic error", res.status, txt.slice(0, 300));
      return NextResponse.json({ error: "summarizer failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = (data?.content?.[0]?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "empty summary" }, { status: 502 });
    }
    return NextResponse.json({ summary: text });
  } catch (e) {
    console.error("[summarize] failed", e);
    return NextResponse.json({ error: "summarizer failed" }, { status: 500 });
  }
}
