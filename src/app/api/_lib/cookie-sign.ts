import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signs a cookie value with HMAC-SHA256.
 * Format: "value.signature"
 */
function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[security] COOKIE_SECRET must be set in production");
    }
    console.warn("[security] COOKIE_SECRET not set — using insecure dev key");
    return "dev-only-insecure-key";
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
