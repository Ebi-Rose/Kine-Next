import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getAuthenticatedUser } from "../_lib/auth";
import { createRatelimit } from "../_lib/rate-limit";
import { verifyCsrf } from "../_lib/csrf";
import { logAudit, getRequestIp } from "../_lib/audit";

export const maxDuration = 60;

const MAX_BODY_SIZE = 50000;
const ALLOWED_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001",
];
const MAX_TOKENS_CAP = 4096;

const ratelimit = createRatelimit("chat", 10, "60 s");

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request.headers);

  if (!verifyCsrf(request)) {
    logAudit({ event: "csrf_rejected", ip, metadata: { route: "/api/chat" } });
    return Response.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    logAudit({ event: "auth_failure", ip, metadata: { route: "/api/chat" } });
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      logAudit({ event: "rate_limited", user_id: user.id, ip, metadata: { route: "/api/chat" } });
      return Response.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > MAX_BODY_SIZE) {
    return Response.json(
      { error: "Request too large" },
      { status: 413 }
    );
  }

  if (!ALLOWED_MODELS.includes(body.model as string)) {
    return Response.json(
      { error: "Invalid model" },
      { status: 400 }
    );
  }

  if (body.max_tokens && (body.max_tokens as number) > MAX_TOKENS_CAP) {
    body.max_tokens = MAX_TOKENS_CAP;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: "Messages required" },
      { status: 400 }
    );
  }

  // Validate individual message content length
  for (const msg of body.messages as { content?: unknown }[]) {
    if (typeof msg.content === "string" && msg.content.length > 30000) {
      return Response.json(
        { error: "Message too long" },
        { status: 400 }
      );
    }
  }

  const wantsStream = body.stream === true;

  try {
    const anthropicBody = { ...body, stream: true };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("Anthropic API error:", response.status, errData.slice(0, 500));
      Sentry.captureMessage("Anthropic API non-OK response", { level: "error", tags: { status: String(response.status) }, extra: { body: errData.slice(0, 500) } });
      return Response.json(
        { error: "AI service error" },
        { status: response.status }
      );
    }

    if (wantsStream) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Buffer streaming response into a single JSON response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let model = body.model;
      let msgId = "";
      let stopReason: string | null = null;
      let usage: unknown = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === "message_start" && evt.message) {
              msgId = evt.message.id || "";
              model = evt.message.model || model;
            }
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              fullText += evt.delta.text;
            }
            if (evt.type === "message_delta") {
              stopReason = evt.delta?.stop_reason || stopReason;
              usage = evt.usage || usage;
            }
          } catch (sseErr) {
            Sentry.addBreadcrumb({ category: "anthropic.sse", level: "warning", message: "malformed SSE event", data: { error: String(sseErr) } });
          }
        }
      }

      return Response.json({
        id: msgId,
        type: "message",
        role: "assistant",
        model,
        content: [{ type: "text", text: fullText }],
        stop_reason: stopReason,
        usage,
      });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/chat" } });
    return Response.json(
      { error: { type: "proxy_error", message: "Service unavailable" } },
      { status: 502 }
    );
  }
}
