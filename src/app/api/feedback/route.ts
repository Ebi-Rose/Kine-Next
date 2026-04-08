import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Forwards in-app feedback to the Kine Tools Supabase project
// (where the admin /inbox lives). Separate project from kine-next's
// own user DB, so we use a dedicated client here.
//
// Accepts multipart/form-data with optional `screenshot` (image) and
// `audio` (voice note) files in addition to JSON-encoded fields.

const TOOLS_URL = process.env.KINE_TOOLS_SUPABASE_URL;
const TOOLS_KEY = process.env.KINE_TOOLS_SUPABASE_SERVICE_KEY ?? process.env.KINE_TOOLS_SUPABASE_ANON_KEY;

const ALLOWED_CATEGORIES = ["bug", "idea", "confusion", "love", "ux", "onboarding", "general"];
const ALLOWED_SEVERITIES = ["low", "medium", "high", "critical"];

export const maxDuration = 30;

function parseContext(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Cap size at 32KB to avoid runaway payloads
    if (JSON.stringify(parsed).length > 32_000) return { _truncated: true };
    return parsed;
  } catch {
    return null;
  }
}

async function uploadToBucket(
  client: SupabaseClient,
  file: File,
  prefix: string,
): Promise<{ path: string; publicUrl: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${prefix}/${filename}`;

  const { error: uploadError } = await client.storage
    .from("tester-screenshots")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

  const { data } = client.storage.from("tester-screenshots").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function POST(req: NextRequest) {
  if (!TOOLS_URL || !TOOLS_KEY) {
    return NextResponse.json({ error: "feedback destination not configured" }, { status: 500 });
  }

  const tools = createClient(TOOLS_URL, TOOLS_KEY);

  // Support both JSON (legacy text-only) and multipart FormData
  const contentType = req.headers.get("content-type") ?? "";
  let fields: Record<string, string> = {};
  let screenshot: File | null = null;
  let audio: File | null = null;
  let audioDurationMs: number | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        if (key === "screenshot") screenshot = value;
        if (key === "audio") audio = value;
      } else {
        fields[key] = String(value);
      }
    }
    if (fields.audio_duration_ms) audioDurationMs = parseInt(fields.audio_duration_ms, 10) || null;
  } else {
    try {
      fields = await req.json();
    } catch {
      return NextResponse.json({ error: "invalid request body" }, { status: 400 });
    }
  }

  const content = (fields.content ?? "").trim();
  const email = (fields.email ?? "").trim().toLowerCase();
  if (!content || !email) {
    return NextResponse.json({ error: "missing content or email" }, { status: 400 });
  }

  const category = ALLOWED_CATEGORIES.includes(fields.category) ? fields.category : "general";
  const severity = ALLOWED_SEVERITIES.includes(fields.severity) ? fields.severity : null;
  const sentiment =
    category === "love" ? "positive" :
    category === "bug" || category === "confusion" ? "negative" :
    "neutral";

  // Best-effort tester lookup
  let testerId: string | null = null;
  try {
    const { data } = await tools.from("testers").select("id").ilike("email", email).maybeSingle();
    testerId = (data?.id as string) ?? null;
  } catch { /* ignore */ }

  // Upload attachments (best-effort: failure on one doesn't block the row)
  let screenshotId: string | null = null;
  let audioUrl: string | null = null;
  let audioPath: string | null = null;

  try {
    if (screenshot && screenshot.size > 0) {
      const { path, publicUrl } = await uploadToBucket(tools, screenshot, "screenshots");
      const { data: shot, error: shotErr } = await tools
        .from("tester_screenshots")
        .insert({
          tester_id: testerId,
          email,
          storage_path: path,
          public_url: publicUrl,
          filename: screenshot.name || path.split("/").pop()!,
          description: content,
        })
        .select("id")
        .single();
      if (shotErr) throw new Error(shotErr.message);
      screenshotId = shot.id as string;
    }
  } catch (e) {
    console.error("[feedback] screenshot upload failed:", e);
  }

  try {
    if (audio && audio.size > 0) {
      const { path, publicUrl } = await uploadToBucket(tools, audio, "audio");
      audioUrl = publicUrl;
      audioPath = path;
    }
  } catch (e) {
    console.error("[feedback] audio upload failed:", e);
  }

  const { error } = await tools.from("tester_feedback").insert({
    tester_id: testerId,
    category,
    sentiment,
    content,
    source: "in_app",
    status: "new",
    severity: category === "bug" ? severity : null,
    email,
    name: fields.name || null,
    screen: fields.screen || null,
    device: fields.device || null,
    app_version: fields.app_version || null,
    screenshot_id: screenshotId,
    audio_url: audioUrl,
    audio_path: audioPath,
    audio_duration_ms: audioDurationMs,
    context: parseContext(fields.context),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, screenshotId, audioUrl });
}
