import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Forwards in-app feedback to the Kine Tools Supabase project
// (where the admin /inbox lives). Separate project from kine-next's
// own user DB, so we use a dedicated service client here.

const TOOLS_URL = process.env.KINE_TOOLS_SUPABASE_URL;
const TOOLS_KEY = process.env.KINE_TOOLS_SUPABASE_SERVICE_KEY ?? process.env.KINE_TOOLS_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  if (!TOOLS_URL || !TOOLS_KEY) {
    return NextResponse.json({ error: "feedback destination not configured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!content || !email) {
    return NextResponse.json({ error: "missing content or email" }, { status: 400 });
  }

  const tools = createClient(TOOLS_URL, TOOLS_KEY);

  // Best-effort tester lookup (may not exist on Tools project either)
  let testerId: string | null = null;
  try {
    const { data } = await tools.from("testers").select("id").ilike("email", email).maybeSingle();
    testerId = data?.id ?? null;
  } catch { /* ignore */ }

  const allowedCategories = ["bug", "idea", "confusion", "love", "ux", "onboarding", "general"];
  const allowedSeverities = ["low", "medium", "high", "critical"];
  const category = allowedCategories.includes(body.category as string) ? body.category : "general";
  const severity = allowedSeverities.includes(body.severity as string) ? body.severity : null;

  const sentiment =
    category === "love" ? "positive" :
    category === "bug" || category === "confusion" ? "negative" :
    "neutral";

  const { error } = await tools.from("tester_feedback").insert({
    tester_id: testerId,
    category,
    sentiment,
    content,
    source: "in_app",
    status: "new",
    severity: category === "bug" ? severity : null,
    email,
    name: typeof body.name === "string" ? body.name : null,
    screen: typeof body.screen === "string" ? body.screen : null,
    device: typeof body.device === "string" ? body.device : null,
    app_version: typeof body.app_version === "string" ? body.app_version : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
