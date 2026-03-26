import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../_lib/auth";

export const maxDuration = 60;

// Rate limiting per user (in-memory, per serverless instance).
// For production-grade distributed limiting, replace with @upstash/ratelimit.
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;
const MAX_BODY_SIZE = 50000;
const ALLOWED_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001",
];
const MAX_TOKENS_CAP = 4096;

const userRequests = new Map<string, { start: number; count: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = userRequests.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    userRequests.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json(
      { error: { type: "auth_error", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  if (isRateLimited(user.id)) {
    return Response.json(
      { error: { type: "rate_limit", message: "Too many requests. Please wait a minute." } },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { type: "config_error", message: "API key not configured" } },
      { status: 500 }
    );
  }

  const body = await request.json();
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: { type: "validation_error", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > MAX_BODY_SIZE) {
    return Response.json(
      { error: { type: "validation_error", message: "Request too large" } },
      { status: 413 }
    );
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return Response.json(
      { error: { type: "validation_error", message: "Invalid model" } },
      { status: 400 }
    );
  }

  if (body.max_tokens && body.max_tokens > MAX_TOKENS_CAP) {
    body.max_tokens = MAX_TOKENS_CAP;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: { type: "validation_error", message: "Messages required" } },
      { status: 400 }
    );
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
      return Response.json(
        { error: { type: "api_error", message: "AI service error" } },
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
          } catch {
            // Skip malformed SSE events
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
  } catch {
    return Response.json(
      { error: { type: "proxy_error", message: "Service unavailable" } },
      { status: 502 }
    );
  }
}
