// ── Store Encryption ──
// Encrypts/decrypts localStorage values for the Zustand persist layer.
// TODO: Replace with a proper encryption implementation (e.g. Web Crypto API).
// Currently passes through unencrypted as a placeholder.

export function encrypt(value: string): string {
  return value;
}

export function decrypt(value: string): string {
  return value;
}
