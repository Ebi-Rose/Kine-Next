// ── API utilities for Claude AI calls ──

import { getSession } from "./auth";

interface ApiRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
}

interface ApiResponse {
  content: { type: string; text: string }[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Streaming fetch to /api/chat. Buffers full response before returning.
 */
export async function apiFetchStreaming(
  body: ApiRequest,
  opts: { timeoutMs?: number } = {}
): Promise<ApiResponse> {
  const timeoutMs = opts.timeoutMs || 60000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await authHeaders();
    const res = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, stream: true }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error(
        (typeof err?.error === "string" ? err.error : err?.error?.message) || `API error: ${res.status}`
      ) as Error & { status: number };
      error.status = res.status;
      throw error;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

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
          if (evt.type === "content_block_delta" && evt.delta?.text) {
            fullText += evt.delta.text;
          }
        } catch {
          // Skip malformed SSE
        }
      }
    }

    return { content: [{ type: "text", text: fullText }] };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Non-streaming fetch to /api/chat.
 */
export async function apiFetch(body: ApiRequest): Promise<ApiResponse> {
  const headers = await authHeaders();
  const res = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, stream: false }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(
      (typeof err?.error === "string" ? err.error : err?.error?.message) || `API error: ${res.status}`
    ) as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * User-friendly error messages from API errors.
 */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const e = err as Error & { status?: number };
    if (e.status === 401) return "Authentication error.";
    if (e.status === 403) return "Access denied.";
    if (e.status === 408) return "Request timed out — try again.";
    if (e.status === 429) return "Rate limit hit — wait a moment.";
    if (e.message?.includes("aborted"))
      return "Request timed out — try again.";
    if (e.message?.includes("Failed to fetch"))
      return "Network error — check your connection.";
  }
  return "AI unavailable — using standard programme.";
}
