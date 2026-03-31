import { NextRequest } from "next/server";

/**
 * Check request body size before reading. Returns a 413 Response if over
 * the limit, or null if the request is within bounds.
 *
 * Uses Content-Length header as a fast pre-check. This is not tamper-proof
 * (a malicious client can lie), but it catches accidental large payloads
 * and raises the bar for deliberate abuse. Serverless function memory
 * limits provide the hard backstop.
 */
export function checkBodySize(request: NextRequest, maxBytes: number): Response | null {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return Response.json(
      { error: "Request too large" },
      { status: 413 }
    );
  }
  return null;
}
