/**
 * AES-GCM encryption for Zustand localStorage persistence.
 * Uses a static device key derived from Web Crypto — protects against
 * casual device access and XSS data exfiltration, not against a
 * sophisticated attacker with full device access.
 */

const STORAGE_KEY_NAME = "kine_dk";
const ALGO = "AES-GCM";

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEY_NAME);

  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", raw, ALGO, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(
    STORAGE_KEY_NAME,
    btoa(String.fromCharCode(...new Uint8Array(exported)))
  );
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );
  // Format: base64(iv) + "." + base64(ciphertext)
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivB64}.${ctB64}`;
}

export async function decrypt(data: string): Promise<string | null> {
  try {
    const key = await getOrCreateDeviceKey();
    const [ivB64, ctB64] = data.split(".");
    if (!ivB64 || !ctB64) return null;

    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
