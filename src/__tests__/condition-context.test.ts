import { getConditionContext } from "@/lib/condition-context";

describe("getConditionContext", () => {
  it("returns empty string for no conditions", () => {
    expect(getConditionContext([])).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(getConditionContext(null as unknown as string[])).toBe("");
    expect(getConditionContext(undefined as unknown as string[])).toBe("");
  });

  it("returns context for PCOS", () => {
    const result = getConditionContext(["pcos"]);
    expect(result).toContain("PCOS");
    expect(result).toContain("insulin sensitivity");
  });

  it("returns context for endometriosis", () => {
    const result = getConditionContext(["endometriosis"]);
    expect(result).toContain("Endometriosis");
    expect(result).toContain("low-impact");
  });

  it("returns context for fibroids", () => {
    const result = getConditionContext(["fibroids"]);
    expect(result).toContain("Fibroids");
  });

  it("returns context for pelvic floor", () => {
    const result = getConditionContext(["pelvic_floor"]);
    expect(result).toContain("Pelvic floor");
    expect(result).toContain("Valsalva");
  });

  it("combines multiple conditions with semicolons", () => {
    const result = getConditionContext(["pcos", "endometriosis"]);
    expect(result).toContain("PCOS");
    expect(result).toContain("Endometriosis");
    expect(result).toContain(";");
  });

  it("ignores unknown conditions", () => {
    const result = getConditionContext(["unknown_condition"]);
    expect(result).toBe("");
  });

  it("prefixes with 'Health conditions:'", () => {
    const result = getConditionContext(["pcos"]);
    expect(result).toMatch(/Health conditions:/);
  });
});
