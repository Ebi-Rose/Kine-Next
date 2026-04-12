/**
 * Output Quality Test Suite — Persona-Level
 *
 * Validates the deterministic guardrails that wrap the LLM:
 * indication pipeline hard filters, fallback builder structure,
 * condition merging, and exercise pool composition.
 *
 * Does NOT test LLM output (that requires manual review).
 */

import { TEST_PERSONAS, type TestPersona } from "@/data/test-personas";
import { EXERCISE_LIBRARY } from "@/data/exercise-library";
import {
  EXERCISE_INDICATIONS,
  type InjuryId,
  type ConditionId,
} from "@/data/exercise-indications";
import {
  filterPool,
  pickGenericFullBody,
  passesHardFilters,
  type UserContext,
} from "@/lib/indication-pipeline";
import { mergeConditionRules } from "@/lib/condition-context";
import { WEEKLY_SPLITS } from "@/data/weekly-splits";

// ── Helpers ──

function personaToCtx(p: TestPersona): UserContext {
  return {
    goal: (p.goal || "general") as UserContext["goal"],
    experience: (p.exp || "new") as UserContext["experience"],
    equipment: p.equip,
    injuries: p.injuries,
    conditions: p.conditions,
  };
}

function exCount(duration: string | null): number {
  if (duration === "short") return 4;
  if (duration === "medium") return 5;
  if (duration === "long") return 6;
  if (duration === "extended") return 7;
  return 5;
}

// ── Edge-case profiles ──

const EDGE_PROFILES: TestPersona[] = [
  {
    id: "edge-bw-only",
    name: "Bodyweight Only",
    tagline: "Bodyweight only, 2 days",
    tests: "Minimal equipment edge case",
    goal: "general",
    exp: "new",
    equip: ["bodyweight"],
    days: "2",
    duration: "short",
    injuries: [],
    injuryNotes: "",
    conditions: [],
    cycleType: "na",
    profile: { name: "BW", height: "165", weight: "60", trainingAge: "0" },
  },
  {
    id: "edge-6day-strength",
    name: "6-Day Intermediate",
    tagline: "All equipment, 6 days, strength",
    tests: "Max frequency, full equipment, advanced",
    goal: "strength",
    exp: "intermediate",
    equip: ["barbell", "dumbbells", "kettlebell", "machines", "bands", "bodyweight"],
    days: "6",
    duration: "long",
    injuries: [],
    injuryNotes: "",
    conditions: [],
    cycleType: "regular",
    profile: { name: "Max", height: "170", weight: "75", trainingAge: "5" },
  },
  {
    id: "edge-stacked-conditions",
    name: "Stacked Conditions",
    tagline: "PCOS + endometriosis",
    tests: "Multiple condition interaction",
    goal: "general",
    exp: "developing",
    equip: ["dumbbells", "machines", "bodyweight"],
    days: "3",
    duration: "medium",
    injuries: [],
    injuryNotes: "",
    conditions: ["pcos", "endometriosis"],
    cycleType: "irregular",
    profile: { name: "Stacked", height: "163", weight: "70", trainingAge: "1" },
  },
  {
    id: "edge-perimenopause",
    name: "Perimenopause",
    tagline: "Life stage = perimenopause, 3 days",
    tests: "Life stage scoring, recovery emphasis",
    goal: "general",
    exp: "developing",
    equip: ["barbell", "dumbbells", "machines", "bodyweight"],
    days: "3",
    duration: "medium",
    injuries: [],
    injuryNotes: "",
    conditions: [],
    cycleType: "perimenopause",
    profile: { name: "Peri", height: "168", weight: "72", trainingAge: "3" },
  },
];

const ALL_PROFILES = [...TEST_PERSONAS, ...EDGE_PROFILES];

// ── 1. Hard filter compliance ──

describe("Hard filter compliance — every persona", () => {
  it.each(ALL_PROFILES.map((p) => [p.name, p] as const))(
    "%s: pool contains no contraindicated exercises",
    (_name, persona) => {
      const ctx = personaToCtx(persona);
      const pool = filterPool(ctx);

      for (const candidate of pool) {
        const ind = EXERCISE_INDICATIONS[candidate.exercise.name];

        // Equipment
        const hasKit = candidate.exercise.equip.some((e) =>
          ctx.equipment.includes(e),
        );
        expect(hasKit).toBe(true);

        // Injuries
        for (const injury of ctx.injuries) {
          expect(ind.injuryAvoid).not.toContain(injury);
        }

        // Conditions
        for (const cond of ctx.conditions) {
          expect(ind.conditionAvoid).not.toContain(cond);
        }
      }
    },
  );
});

// ── 2. Experience gate ──

describe("Experience gate — every persona", () => {
  const EXP_RANK: Record<string, number> = { new: 0, developing: 1, intermediate: 2 };

  it.each(ALL_PROFILES.map((p) => [p.name, p] as const))(
    "%s: no exercise above experience level",
    (_name, persona) => {
      const ctx = personaToCtx(persona);
      const pool = filterPool(ctx);
      const userRank = EXP_RANK[ctx.experience] ?? 0;

      for (const candidate of pool) {
        const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
        const minRank = EXP_RANK[ind.experience.min] ?? 0;
        expect(minRank).toBeLessThanOrEqual(userRank);
      }
    },
  );
});

// ── 3. Non-empty pool ──

describe("Pool viability — every persona", () => {
  it.each(ALL_PROFILES.map((p) => [p.name, p] as const))(
    "%s: pool has enough exercises for a session",
    (_name, persona) => {
      const ctx = personaToCtx(persona);
      const pool = filterPool(ctx);
      const needed = exCount(persona.duration);
      expect(pool.length).toBeGreaterThanOrEqual(needed);
    },
  );
});

// ── 4. Generic full-body picker ──

describe("Generic full-body picker — structure", () => {
  it.each(ALL_PROFILES.map((p) => [p.name, p] as const))(
    "%s: produces correct exercise count with no duplicates",
    (_name, persona) => {
      const ctx = personaToCtx(persona);
      const count = exCount(persona.duration);
      const picks = pickGenericFullBody(ctx, count);

      expect(picks.length).toBe(count);

      // No duplicates
      const names = picks.map((p) => p.exercise.name);
      expect(new Set(names).size).toBe(names.length);
    },
  );

  it.each(ALL_PROFILES.map((p) => [p.name, p] as const))(
    "%s: includes at least one hinge or glute-dominant movement",
    (_name, persona) => {
      const ctx = personaToCtx(persona);
      const picks = pickGenericFullBody(ctx, exCount(persona.duration));
      const hasHinge = picks.some(
        (p) => p.exercise.muscle === "hinge" || p.exercise.muscle === "legs",
      );
      expect(hasHinge).toBe(true);
    },
  );
});

// ── 5. Split structure — lower ≥ upper ──

describe("Split structure — lower body priority", () => {
  const splitPersonas = ALL_PROFILES.filter((p) => {
    const goal = p.goal || "general";
    const exp = p.exp || "new";
    return WEEKLY_SPLITS[goal]?.[exp] != null;
  });

  it.each(splitPersonas.map((p) => [p.name, p] as const))(
    "%s: lower body sessions ≥ upper body sessions (or equal for balanced splits)",
    (_name, persona) => {
      const goal = persona.goal || "general";
      const exp = persona.exp || "new";
      const split = WEEKLY_SPLITS[goal]![exp]!;

      let lowerCount = 0;
      let upperCount = 0;

      for (const session of split.sessions) {
        const title = session.title.toLowerCase();
        if (title.includes("lower") || title.includes("leg") || title.includes("squat") || title.includes("deadlift") || title.includes("posterior")) {
          lowerCount++;
        } else if (title.includes("upper") || title.includes("push") || title.includes("pull") || title.includes("press") || title.includes("accessory")) {
          upperCount++;
        }
        // Full body counts as neither
      }

      // Rule: never 2 upper with only 1 lower
      if (upperCount >= 2) {
        expect(lowerCount).toBeGreaterThanOrEqual(upperCount);
      }
    },
  );
});

// ── 6. Condition-specific tests ──

describe("Condition-specific — PCOS (Fatima)", () => {
  const fatima = TEST_PERSONAS.find((p) => p.id === "fatima")!;
  const ctx = personaToCtx(fatima);

  it("pool excludes condition-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.conditionAvoid).not.toContain("pcos");
    }
  });

  it("merged condition rules have valid multipliers", () => {
    const merged = mergeConditionRules(fatima.conditions as ConditionId[]);
    expect(merged.exerciseRules.workingLoadCap).toBeGreaterThan(0);
    expect(merged.exerciseRules.workingLoadCap).toBeLessThanOrEqual(1);
    expect(merged.exerciseRules.volumeMultiplier.default).toBeGreaterThan(0);
    expect(merged.exerciseRules.volumeMultiplier.default).toBeLessThanOrEqual(1);
  });
});

describe("Condition-specific — Fibroids (Nkechi)", () => {
  const nkechi = TEST_PERSONAS.find((p) => p.id === "nkechi")!;
  const ctx = personaToCtx(nkechi);

  it("pool excludes condition-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.conditionAvoid).not.toContain("fibroids");
    }
  });
});

describe("Condition-specific — Endometriosis (Leila)", () => {
  const leila = TEST_PERSONAS.find((p) => p.id === "leila")!;
  const ctx = personaToCtx(leila);

  it("pool excludes condition-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.conditionAvoid).not.toContain("endometriosis");
    }
  });
});

describe("Condition-specific — Pelvic floor (Grace)", () => {
  const grace = TEST_PERSONAS.find((p) => p.id === "grace")!;
  const ctx = personaToCtx(grace);

  it("pool excludes condition-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.conditionAvoid).not.toContain("pelvic_floor");
    }
  });

  it("no exercise exceeds beginner technical demand", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      // "new" users should only see technicalDemand ≤ 3 (hard filter is experience-based)
      expect(ind.experience.min).toBe("new");
    }
  });
});

describe("Stacked conditions — PCOS + endometriosis", () => {
  const stacked = EDGE_PROFILES.find((p) => p.id === "edge-stacked-conditions")!;
  const ctx = personaToCtx(stacked);

  it("merged rules use tightest load cap", () => {
    const merged = mergeConditionRules(stacked.conditions as ConditionId[]);
    const pcosRules = mergeConditionRules(["pcos"] as ConditionId[]);
    const endoRules = mergeConditionRules(["endometriosis"] as ConditionId[]);

    // Stacked cap should be ≤ either individual cap
    expect(merged.exerciseRules.workingLoadCap).toBeLessThanOrEqual(
      pcosRules.exerciseRules.workingLoadCap ?? 1,
    );
    expect(merged.exerciseRules.workingLoadCap).toBeLessThanOrEqual(
      endoRules.exerciseRules.workingLoadCap ?? 1,
    );
  });

  it("avoidances are the union of both conditions", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.conditionAvoid).not.toContain("pcos");
      expect(ind.conditionAvoid).not.toContain("endometriosis");
    }
  });

  it("volume multiplier is multiplicative (≤ either individual)", () => {
    const merged = mergeConditionRules(stacked.conditions as ConditionId[]);
    const pcosRules = mergeConditionRules(["pcos"] as ConditionId[]);
    const endoRules = mergeConditionRules(["endometriosis"] as ConditionId[]);

    expect(merged.exerciseRules.volumeMultiplier.default).toBeLessThanOrEqual(
      pcosRules.exerciseRules.volumeMultiplier.default,
    );
    expect(merged.exerciseRules.volumeMultiplier.default).toBeLessThanOrEqual(
      endoRules.exerciseRules.volumeMultiplier.default,
    );
  });
});

// ── 7. Injury-specific tests ──

describe("Injury-specific — Wrist (Toni)", () => {
  const toni = TEST_PERSONAS.find((p) => p.id === "toni")!;
  const ctx = personaToCtx(toni);

  it("pool contains zero wrist-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.injuryAvoid).not.toContain("wrist");
    }
  });

  it("pool has no barbell exercises (machines only)", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      // Exercise must be doable on machines
      expect(candidate.exercise.equip).toContain("machines");
    }
  });
});

describe("Injury-specific — Lower back (Emma)", () => {
  const emma = TEST_PERSONAS.find((p) => p.id === "emma")!;
  const ctx = personaToCtx(emma);

  it("pool excludes lower-back-avoided exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      const ind = EXERCISE_INDICATIONS[candidate.exercise.name];
      expect(ind.injuryAvoid).not.toContain("lower_back");
    }
  });

  it("pool still includes hinge alternatives", () => {
    const pool = filterPool(ctx);
    const hingeExercises = pool.filter((c) => c.exercise.muscle === "hinge");
    // Should have at least some safe hinge options
    expect(hingeExercises.length).toBeGreaterThan(0);
  });
});

// ── 8. Equipment edge cases ──

describe("Equipment — bodyweight only", () => {
  const bw = EDGE_PROFILES.find((p) => p.id === "edge-bw-only")!;
  const ctx = personaToCtx(bw);

  it("pool contains only bodyweight exercises", () => {
    const pool = filterPool(ctx);
    for (const candidate of pool) {
      expect(candidate.exercise.equip).toContain("bodyweight");
    }
  });

  it("can build a full session (4 exercises for short duration)", () => {
    const picks = pickGenericFullBody(ctx, 4);
    expect(picks.length).toBe(4);
  });
});

describe("Equipment — full gym (6-day intermediate)", () => {
  const max = EDGE_PROFILES.find((p) => p.id === "edge-6day-strength")!;
  const ctx = personaToCtx(max);

  it("pool is the largest of all profiles", () => {
    const pool = filterPool(ctx);
    // Full equipment + intermediate = widest pool
    const otherPools = ALL_PROFILES.filter((p) => p.id !== "edge-6day-strength").map(
      (p) => filterPool(personaToCtx(p)).length,
    );
    expect(pool.length).toBeGreaterThanOrEqual(Math.max(...otherPools));
  });
});

// ── 9. Template swap safety ──

describe("Template swap — all split exercises exist in library", () => {
  for (const [goalKey, expMap] of Object.entries(WEEKLY_SPLITS)) {
    for (const [expKey, split] of Object.entries(expMap)) {
      it(`${goalKey}/${expKey}: all template exercises are in the library`, () => {
        for (const session of split.sessions) {
          for (const exName of session.exercises) {
            const found = EXERCISE_LIBRARY.find((e) => e.name === exName);
            expect(found).toBeDefined();
          }
        }
      });
    }
  }
});
