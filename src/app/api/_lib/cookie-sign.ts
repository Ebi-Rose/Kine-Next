import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signs a cookie value with HMAC-SHA256.
 * Format: "value.signature"
 */
function getSecret(): string {
  const secret = process.env.COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    console.warn("[security] COOKIE_SECRET not set — cookie signing is ineffective");
    return "";
  }
  return secret;
}

export function signValue(value: string): string {
  const sig = createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function verifyValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);

  const expected = createHmac("sha256", getSecret()).update(value).digest("hex");

  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return value;
}
