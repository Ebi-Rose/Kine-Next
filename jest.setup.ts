import "@testing-library/jest-dom";

if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(val: T): T => JSON.parse(JSON.stringify(val));
}

// Mock store-encryption module — Web Crypto API not available in jsdom
jest.mock("@/lib/store-encryption", () => ({
  encrypt: (v: string) => Promise.resolve(v),
  decrypt: (v: string) => Promise.resolve(v),
}));
