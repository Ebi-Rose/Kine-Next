import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";

type AuditEvent =
  | "access_code_success"
  | "access_code_failure"
  | "access_code_rate_limited"
  | "auth_failure"
  | "csrf_rejected"
  | "subscription_verified"
  | "subscription_expired"
  | "checkout_created"
  | "portal_opened"
  | "webhook_received"
  | "webhook_signature_failed"
  | "webhook_processing"
  | "rate_limited"
  | "account_deleted"
  | "duplicate_subscription_cancelled";

interface AuditEntry {
  event: AuditEvent;
  user_id?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security-relevant event to the audit_log table.
 * Best-effort — never throws or blocks the request.
 */
export function logAudit(entry: AuditEntry): void {
  // Check for anomalous patterns before persisting
  checkAnomaly(entry);

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return;

  const supabase = createClient(url, key);

  // Run after the response is sent so the serverless function isn't frozen
  // before the insert lands.
  after(async () => {
    const { error } = await supabase.from("audit_log").insert({
      event: entry.event,
      user_id: entry.user_id || null,
      ip: entry.ip || null,
      metadata: entry.metadata || {},
      created_at: new Date().toISOString(),
    });
    if (error) console.error("[audit] insert failed:", error.message);
  });
}

// ── Anomaly detection ────────────────────────────────────────
// Lightweight in-memory counters that alert via Sentry when
// suspicious patterns are detected within a rolling window.
// Runs per-instance (serverless), so thresholds are per-isolate.

const ANOMALY_EVENTS: AuditEvent[] = [
  "auth_failure",
  "csrf_rejected",
  "rate_limited",
  "access_code_failure",
  "webhook_signature_failed",
];
const ANOMALY_WINDOW_MS = 60_000; // 1 minute
const ANOMALY_THRESHOLD = 10; // alerts after 10 events in window

const anomalyCounts = new Map<string, number[]>();

function checkAnomaly(entry: AuditEntry): void {
  if (!ANOMALY_EVENTS.includes(entry.event)) return;

  const key = `${entry.event}:${entry.ip ?? "no-ip"}`;
  const now = Date.now();

  let timestamps = anomalyCounts.get(key);
  if (!timestamps) {
    timestamps = [];
    anomalyCounts.set(key, timestamps);
  }

  // Evict old entries
  const cutoff = now - ANOMALY_WINDOW_MS;
  while (timestamps.length > 0 && timestamps[0] < cutoff) timestamps.shift();

  timestamps.push(now);

  if (timestamps.length === ANOMALY_THRESHOLD) {
    Sentry.captureMessage(
      `[anomaly] ${ANOMALY_THRESHOLD}x ${entry.event} from ${entry.ip ?? "unknown"} in ${ANOMALY_WINDOW_MS / 1000}s`,
      { level: "warning", extra: { event: entry.event, ip: entry.ip, user_id: entry.user_id } },
    );
  }
}

/**
 * Extract client IP from request headers.
 */
export function getRequestIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
