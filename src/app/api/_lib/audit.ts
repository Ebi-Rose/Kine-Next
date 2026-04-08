import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";

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
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return;

  const supabase = createClient(url, key);

  // Run after the response is sent so the serverless function isn't frozen
  // before the insert lands.
  after(
    supabase
      .from("audit_log")
      .insert({
        event: entry.event,
        user_id: entry.user_id || null,
        ip: entry.ip || null,
        metadata: entry.metadata || {},
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error("[audit] insert failed:", error.message);
      })
  );
}

/**
 * Extract client IP from request headers.
 */
export function getRequestIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
