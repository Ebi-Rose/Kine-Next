import {
  getConditionContext,
  getConditionCoachNote,
  getConditionRedFlags,
  getConditionRedFlagKeywords,
  getConditionRule,
  mergeConditionRules,
} from "@/lib/condition-context";

// ── Back-compat: getConditionContext (LLM prompt framing) ──────────
//
// The week-builder still calls this with a list of condition id
// strings. The function must continue to return an empty string for
// no conditions and a newline-prefixed "- Health conditions: ..."
// block when any known condition is supplied.

describe("getConditionContext", () => {
  it("returns empty string for no conditions", () => {
    expect(getConditionContext([])).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(getConditionContext(null)).toBe("");
    expect(getConditionContext(undefined)).toBe("");
  });

  it("ignores unknown conditions", () => {
    expect(getConditionContext(["unknown_condition"])).toBe("");
  });

  it("prefixes with '- Health conditions: '", () => {
    const result = getConditionContext(["pcos"]);
    expect(result).toMatch(/^\n- Health conditions: /);
  });

  it("includes the PCOS display name and insulin-sensitivity framing", () => {
    const result = getConditionContext(["pcos"]);
    expect(result).toContain("PCOS");
    expect(result.toLowerCase()).toContain("insulin sensitivity");
  });

  it("includes fibroid valsalva framing", () => {
    const result = getConditionContext(["fibroids"]);
    expect(result).toContain("fibroids");
    expect(result.toLowerCase()).toContain("valsalva");
  });

  it("includes endometriosis low-impact framing", () => {
    const result = getConditionContext(["endometriosis"]);
    expect(result).toContain("Endometriosis");
    expect(result.toLowerCase()).toContain("low-impact");
  });

  it("includes pelvic-floor exhale cueing", () => {
    const result = getConditionContext(["pelvic_floor"]);
    expect(result.toLowerCase()).toContain("pelvic floor");
    expect(result.toLowerCase()).toContain("exhale-on-exertion");
  });

  it("includes hypermobility tempo / isometric cueing", () => {
    const result = getConditionContext(["hypermobility"]);
    expect(result).toContain("Hypermobility");
    expect(result.toLowerCase()).toContain("tempo");
    expect(result.toLowerCase()).toContain("isometric");
  });

  it("joins multiple conditions with a separator", () => {
    const result = getConditionContext(["pcos", "endometriosis"]);
    expect(result).toContain("PCOS");
    expect(result).toContain("Endometriosis");
    expect(result).toContain(";");
  });
});

// ── getConditionCoachNote (user-facing) ────────────────────────────

describe("getConditionCoachNote", () => {
  it("returns empty string for no conditions", () => {
    expect(getConditionCoachNote([])).toBe("");
    expect(getConditionCoachNote(null)).toBe("");
    expect(getConditionCoachNote(undefined)).toBe("");
  });

  it("returns a warm user-facing note for a single condition", () => {
    const note = getConditionCoachNote(["pcos"]);
    expect(note.length).toBeGreaterThan(0);
    // Coach notes are first-person plural, plain-language.
    expect(note.toLowerCase()).toContain("we");
  });

  it("concatenates notes when multiple conditions apply", () => {
    const single = getConditionCoachNote(["pcos"]);
    const both = getConditionCoachNote(["pcos", "pelvic_floor"]);
    expect(both.length).toBeGreaterThan(single.length);
  });

  it("ignores unknown ids", () => {
    expect(getConditionCoachNote(["unknown_condition"])).toBe("");
  });
});

// ── getConditionRedFlags ───────────────────────────────────────────

describe("getConditionRedFlags", () => {
  it("returns empty array for no conditions", () => {
    expect(getConditionRedFlags([])).toEqual([]);
    expect(getConditionRedFlags(null)).toEqual([]);
  });

  it("returns flags for a single condition", () => {
    const flags = getConditionRedFlags(["fibroids"]);
    expect(flags.length).toBeGreaterThan(0);
  });

  it("unions flags across multiple conditions", () => {
    const single = getConditionRedFlags(["fibroids"]);
    const both = getConditionRedFlags(["fibroids", "hypermobility"]);
    expect(both.length).toBeGreaterThan(single.length);
  });

  it("dedupes identical flags", () => {
    const flags = getConditionRedFlags(["pcos", "pcos"]);
    const unique = Array.from(new Set(flags));
    expect(flags).toEqual(unique);
  });
});

// ── getConditionRedFlagKeywords ────────────────────────────────────

describe("getConditionRedFlagKeywords", () => {
  it("returns empty array for no conditions", () => {
    expect(getConditionRedFlagKeywords([])).toEqual([]);
    expect(getConditionRedFlagKeywords(null)).toEqual([]);
    expect(getConditionRedFlagKeywords(undefined)).toEqual([]);
  });

  it("returns keyword entries for a single condition", () => {
    const entries = getConditionRedFlagKeywords(["pelvic_floor"]);
    expect(entries.length).toBeGreaterThan(0);
    // Each entry should carry a phrase and non-empty keyword list.
    for (const e of entries) {
      expect(typeof e.phrase).toBe("string");
      expect(e.phrase.length).toBeGreaterThan(0);
      expect(Array.isArray(e.keywords)).toBe(true);
      expect(e.keywords.length).toBeGreaterThan(0);
    }
  });

  it("unions entries across multiple conditions", () => {
    const single = getConditionRedFlagKeywords(["pelvic_floor"]);
    const both = getConditionRedFlagKeywords(["pelvic_floor", "hypermobility"]);
    expect(both.length).toBeGreaterThan(single.length);
  });

  it("dedupes entries by phrase", () => {
    const entries = getConditionRedFlagKeywords(["pelvic_floor", "pelvic_floor"]);
    const phrases = entries.map((e) => e.phrase);
    expect(phrases.length).toBe(new Set(phrases).size);
  });

  it("ignores unknown condition ids", () => {
    expect(getConditionRedFlagKeywords(["not_a_condition"])).toEqual([]);
  });

  it("every condition has at least one authored entry", () => {
    // Catches the failure mode where a new condition is added to
    // condition-rules.ts with an empty redFlagKeywords field.
    for (const id of [
      "pcos",
      "fibroids",
      "endometriosis",
      "pelvic_floor",
      "hypermobility",
    ]) {
      const entries = getConditionRedFlagKeywords([id]);
      expect(entries.length).toBeGreaterThan(0);
    }
  });
});

// ── getConditionRule ───────────────────────────────────────────────

describe("getConditionRule", () => {
  it("returns the rule for each known id", () => {
    for (const id of [
      "pcos",
      "fibroids",
      "endometriosis",
      "pelvic_floor",
      "hypermobility",
    ] as const) {
      expect(getConditionRule(id)).toBeDefined();
      expect(getConditionRule(id)?.id).toBe(id);
    }
  });

  it("returns undefined for unknown ids", () => {
    // @ts-expect-error — deliberately passing an invalid id
    expect(getConditionRule("not_a_real_condition")).toBeUndefined();
  });
});

// ── mergeConditionRules: core stacking primitive ───────────────────

describe("mergeConditionRules", () => {
  it("returns the identity rule for empty input", () => {
    const empty = mergeConditionRules([]);
    expect(empty.globalFraming).toBe("");
    expect(empty.coachNote).toBe("");
    expect(empty.exerciseRules.avoidPatterns).toEqual([]);
    expect(empty.exerciseRules.workingLoadCap).toBe(1.0);
    expect(empty.exerciseRules.heavyTopSetsAllowed).toBe(true);
    expect(empty.redFlags).toEqual([]);
  });

  it("returns the identity rule when all ids are unknown", () => {
    const empty = mergeConditionRules(["not_real"] as never);
    expect(empty.globalFraming).toBe("");
  });

  it("passes through a single condition", () => {
    const single = mergeConditionRules(["pelvic_floor"]);
    expect(single.id).toBe("pelvic_floor");
    expect(single.exerciseRules.repRangeFloor).toBe(8);
    expect(single.exerciseRules.heavyTopSetsAllowed).toBe(false);
  });

  it("applies multiplicative default volume multiplier across conditions", () => {
    // pelvic_floor 0.9 × hypermobility 0.87 = 0.783
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    const expected = 0.9 * 0.87;
    expect(merged.exerciseRules.volumeMultiplier?.default).toBeCloseTo(
      expected,
      5,
    );
  });

  it("takes the minimum working-load cap across conditions", () => {
    // pelvic_floor 0.9, endometriosis 0.95 → 0.9
    const merged = mergeConditionRules(["pelvic_floor", "endometriosis"]);
    expect(merged.exerciseRules.workingLoadCap).toBe(0.9);
  });

  it("takes the maximum rep-range floor across conditions", () => {
    // pelvic_floor 8, others undefined → 8
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    expect(merged.exerciseRules.repRangeFloor).toBe(8);
  });

  it("ANDs heavyTopSetsAllowed across conditions", () => {
    // pelvic_floor false, pcos true → false
    const merged = mergeConditionRules(["pelvic_floor", "pcos"]);
    expect(merged.exerciseRules.heavyTopSetsAllowed).toBe(false);
  });

  it("unions cautionPatterns", () => {
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    // pelvic_floor cautions: squat, hinge, verticalPush, carry, core_flexion
    // hypermobility cautions: squat, lunge, verticalPull, verticalPush, hinge
    // union includes all unique values
    const caut = merged.exerciseRules.cautionPatterns;
    expect(caut).toContain("squat");
    expect(caut).toContain("hinge");
    expect(caut).toContain("lunge");
    expect(caut).toContain("carry");
    expect(caut).toContain("verticalPush");
    expect(caut).toContain("verticalPull");
    expect(caut).toContain("core_flexion");
    // No duplicates
    expect(caut.length).toBe(new Set(caut).size);
  });

  it("concatenates per-pattern modifiers with substring dedupe", () => {
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    const squatMod = merged.exerciseRules.modifiers.squat;
    expect(squatMod).toBeDefined();
    // Both conditions cue the squat pattern differently; the merged
    // string should contain content from both.
    expect(squatMod).toContain("exhale");
    expect(squatMod).toContain("parallel");
  });

  it("unions warmupMods.addBlocks deduped by id", () => {
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    const ids = merged.warmupMods.addBlocks.map((b) => b.id);
    expect(ids).toContain("360_breathing");
    expect(ids).toContain("scapular_wall_slides");
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("unions redFlags", () => {
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    expect(merged.redFlags.length).toBeGreaterThan(3);
    expect(merged.redFlags).toContain(
      "heaviness or bulging sensation during or after lifting",
    );
    expect(merged.redFlags).toContain("joint subluxation during training");
  });

  it("unions redFlagKeywords deduped by phrase", () => {
    const merged = mergeConditionRules(["pelvic_floor", "hypermobility"]);
    const phrases = merged.redFlagKeywords.map((e) => e.phrase);
    // Both conditions contribute entries.
    expect(phrases.some((p) => p.toLowerCase().includes("pelvic"))).toBe(true);
    expect(phrases.some((p) => p.toLowerCase().includes("joint"))).toBe(true);
    // No duplicate phrases after merging.
    expect(phrases.length).toBe(new Set(phrases).size);
  });

  it("empty rule carries an empty redFlagKeywords array", () => {
    const empty = mergeConditionRules([]);
    expect(empty.redFlagKeywords).toEqual([]);
  });

  it("joins globalFraming with double-newline separator", () => {
    const merged = mergeConditionRules(["pcos", "fibroids"]);
    expect(merged.globalFraming).toContain("PCOS");
    expect(merged.globalFraming).toContain("fibroids");
    expect(merged.globalFraming).toContain("\n\n");
  });

  it("combines phase multipliers multiplicatively per phase", () => {
    // fibroids sets menstrual: 0.8
    // pelvic_floor sets menstrual: 0.8
    // merged menstrual should be 0.8 * 0.8 = 0.64
    const merged = mergeConditionRules(["fibroids", "pelvic_floor"]);
    const menstrual = merged.exerciseRules.volumeMultiplier?.phases?.menstrual;
    expect(menstrual).toBeCloseTo(0.64, 5);
  });
});
