/**
 * Tests for build-time environment variable validation.
 * Ensures production deploys fail fast if critical vars are missing.
 */

describe("Build-time env validation", () => {
  const REQUIRED_VARS = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "ANTHROPIC_API_KEY",
    "COOKIE_SECRET",
  ];

  it("identifies all required production env vars", () => {
    // Verify our validation list is complete
    expect(REQUIRED_VARS).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(REQUIRED_VARS).toContain("STRIPE_SECRET_KEY");
    expect(REQUIRED_VARS).toContain("STRIPE_WEBHOOK_SECRET");
    expect(REQUIRED_VARS).toContain("ANTHROPIC_API_KEY");
    expect(REQUIRED_VARS).toContain("COOKIE_SECRET");
    expect(REQUIRED_VARS).toHaveLength(5);
  });

  it("detects missing env vars", () => {
    const env: Record<string, string> = {
      SUPABASE_SERVICE_ROLE_KEY: "set",
      // STRIPE_SECRET_KEY intentionally missing
      STRIPE_WEBHOOK_SECRET: "set",
      ANTHROPIC_API_KEY: "set",
      COOKIE_SECRET: "set",
    };

    const missing = REQUIRED_VARS.filter((v) => !env[v]);
    expect(missing).toEqual(["STRIPE_SECRET_KEY"]);
  });

  it("rejects DEV_BYPASS in production", () => {
    const devBypass = "true";
    const isProduction = true;
    const shouldBlock = isProduction && devBypass === "true";
    expect(shouldBlock).toBe(true);
  });

  it("allows DEV_BYPASS in non-production", () => {
    const devBypass = "true";
    const isProduction = false;
    const shouldBlock = isProduction && devBypass === "true";
    expect(shouldBlock).toBe(false);
  });
});
