import {
  EXERCISE_INDICATIONS,
  validateIndications,
} from "@/data/exercise-indications";
import { EXERCISE_LIBRARY } from "@/data/exercise-library";
import {
  filterPool,
  pickForSlot,
  pickGenericFullBody,
  swapTemplateExercises,
  getCycleEnvelope,
  modulateSetCount,
  type UserContext,
} from "@/lib/indication-pipeline";

// ── Library coverage ────────────────────────────────────────────────

describe("EXERCISE_INDICATIONS coverage", () => {
  it("has an entry for every library exercise", () => {
    for (const ex of EXERCISE_LIBRARY) {
      expect(EXERCISE_INDICATIONS[ex.name]).toBeDefined();
    }
  });

  it("passes self-validation (cycle phases, multipliers, RPE caps)", () => {
    expect(validateIndications()).toEqual([]);
  });

  it("never produces a profile with an empty whyForYou", () => {
    for (const ex of EXERCISE_LIBRARY) {
      const ind = EXERCISE_INDICATIONS[ex.name];
      expect(ind.whyForYou.length).toBeGreaterThan(0);
    }
  });
});

// ── Hard filters ────────────────────────────────────────────────────

describe("filterPool — hard filters", () => {
  const baseCtx: UserContext = {
    goal: "muscle",
    experience: "developing",
    equipment: ["barbell", "dumbbells", "machines", "bodyweight"],
    injuries: [],
    conditions: [],
  };

  it("returns a non-empty pool for a normal user", () => {
    const pool = filterPool(baseCtx);
    expect(pool.length).toBeGreaterThan(50);
  });

  it("drops barbell-only lifts when the user has no barbell", () => {
    const noBb = filterPool({ ...baseCtx, equipment: ["dumbbells", "bodyweight"] });
    expect(noBb.find((c) => c.exercise.name === "Barbell Back Squat")).toBeUndefined();
    // Goblet Squat should still be available
    expect(noBb.find((c) => c.exercise.name === "Goblet Squat")).toBeDefined();
  });

  it("drops knee-contraindicated lifts when user reports knee injury", () => {
    const kneeUser = filterPool({ ...baseCtx, injuries: ["knees"] });
    // Some heavy squat / lunge variants should be filtered out
    expect(kneeUser.find((c) => c.exercise.name === "Barbell Back Squat")).toBeUndefined();
  });

  it("drops intermediate-only lifts for new lifters", () => {
    const newbie = filterPool({ ...baseCtx, experience: "new" });
    expect(newbie.find((c) => c.exercise.name === "Nordic Curl")).toBeUndefined();
    expect(newbie.find((c) => c.exercise.name === "Handstand Push-Up")).toBeUndefined();
  });
});

// ── Slot picking ────────────────────────────────────────────────────

describe("pickForSlot", () => {
  const ctx: UserContext = {
    goal: "strength",
    experience: "developing",
    equipment: ["barbell", "machines", "bodyweight"],
    injuries: [],
    conditions: [],
  };

  it("picks a real exercise for a primary squat slot", () => {
    const winner = pickForSlot(
      { muscles: ["legs"], role: "primary", pattern: "squat" },
      ctx,
    );
    expect(winner).not.toBeNull();
    expect(winner!.exercise.muscle).toBe("legs");
    expect(winner!.score).toBeGreaterThan(0);
  });

  it("returns null when no candidate passes filters", () => {
    const lockedOut: UserContext = {
      ...ctx,
      equipment: [],
    };
    expect(pickForSlot({ muscles: ["legs"], role: "primary" }, lockedOut)).toBeNull();
  });

  it("is deterministic for the same context", () => {
    const a = pickForSlot({ muscles: ["hinge"], role: "primary" }, ctx);
    const b = pickForSlot({ muscles: ["hinge"], role: "primary" }, ctx);
    expect(a?.exercise.name).toBe(b?.exercise.name);
  });
});

// ── Template swapping ───────────────────────────────────────────────

describe("swapTemplateExercises", () => {
  const ctx: UserContext = {
    goal: "muscle",
    experience: "developing",
    equipment: ["dumbbells", "bodyweight"],
    injuries: [],
    conditions: [],
  };

  it("keeps exercises that pass filters", () => {
    const out = swapTemplateExercises(["Goblet Squat", "Push-Up"], ctx);
    expect(out[0].name).toBe("Goblet Squat");
    expect(out[0].swappedFrom).toBeUndefined();
    expect(out[1].name).toBe("Push-Up");
  });

  it("swaps barbell lifts for a dumbbell-only user", () => {
    const out = swapTemplateExercises(["Barbell Back Squat"], ctx);
    expect(out[0].name).not.toBe("Barbell Back Squat");
    expect(out[0].swappedFrom).toBe("Barbell Back Squat");
    // Reason should mention equipment
    expect(out[0].swappedReason).toMatch(/equip|barbell/i);
  });
});

// ── Generic full-body picker ────────────────────────────────────────

describe("pickGenericFullBody", () => {
  const ctx: UserContext = {
    goal: "general",
    experience: "new",
    equipment: ["dumbbells", "bodyweight"],
    injuries: [],
    conditions: [],
  };

  it("picks the requested number of exercises", () => {
    const picks = pickGenericFullBody(ctx, 5);
    expect(picks.length).toBe(5);
  });

  it("never picks the same exercise twice", () => {
    const picks = pickGenericFullBody(ctx, 7);
    const names = picks.map((p) => p.exercise.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("hits multiple muscle groups (not all legs)", () => {
    const picks = pickGenericFullBody(ctx, 5);
    const muscles = new Set(picks.map((p) => p.exercise.muscle));
    expect(muscles.size).toBeGreaterThanOrEqual(3);
  });
});

// ── Cycle envelope ──────────────────────────────────────────────────

describe("getCycleEnvelope", () => {
  it("returns neutral envelope when no phase given", () => {
    const env = getCycleEnvelope("Barbell Back Squat", null);
    expect(env.setMultiplier).toBe(1.0);
    expect(env.intensityCap).toBe(9);
    expect(env.rmAttempts).toBe(true);
    expect(env.effortFraming).toBeNull();
  });

  it("returns neutral envelope for a non-modulated exercise", () => {
    // Mobility / isolation exercises don't carry modulation
    const env = getCycleEnvelope("Plank", "menstrual");
    expect(env.setMultiplier).toBe(1.0);
  });

  it("modulates a heavy compound during menstrual phase", () => {
    const env = getCycleEnvelope("Barbell Back Squat", "menstrual");
    expect(env.setMultiplier).toBeLessThan(1.0);
    expect(env.intensityCap).toBeLessThanOrEqual(8);
    expect(env.rmAttempts).toBe(false);
    expect(env.effortFraming).not.toBeNull();
  });

  it("respects follicular phase as a peak window", () => {
    const env = getCycleEnvelope("Barbell Back Squat", "follicular");
    expect(env.setMultiplier).toBe(1.0);
    expect(env.rmAttempts).toBe(true);
  });
});

// ── Set modulation arithmetic ───────────────────────────────────────

describe("modulateSetCount", () => {
  it("scales an integer set count", () => {
    expect(modulateSetCount("4", 0.8)).toBe("3");
    expect(modulateSetCount("5", 0.6)).toBe("3");
  });

  it("scales a range and preserves the range shape", () => {
    expect(modulateSetCount("3-4", 0.8)).toBe("2-3");
  });

  it("returns the original string at multiplier 1.0", () => {
    expect(modulateSetCount("3-4", 1.0)).toBe("3-4");
  });

  it("leaves non-numeric values untouched", () => {
    expect(modulateSetCount("30 sec", 0.8)).toBe("30 sec");
  });

  it("never scales below 1 set", () => {
    expect(modulateSetCount("1", 0.5)).toBe("1");
  });
});

// ── End-to-end sanity check ─────────────────────────────────────────

describe("end-to-end sanity (persona-style contexts)", () => {
  const personas: Array<{ name: string; ctx: UserContext; minPool: number }> = [
    {
      name: "Mia (new, dumbbells, no injuries)",
      ctx: {
        goal: "general",
        experience: "new",
        equipment: ["dumbbells", "bodyweight"],
        injuries: [],
        conditions: [],
      },
      minPool: 30,
    },
    {
      name: "Priya (developing, full gym, knee history)",
      ctx: {
        goal: "muscle",
        experience: "developing",
        equipment: ["barbell", "dumbbells", "machines", "bodyweight"],
        injuries: ["knees"],
        conditions: [],
      },
      minPool: 60,
    },
    {
      name: "Aisha (intermediate, full gym, hypermobility)",
      ctx: {
        goal: "strength",
        experience: "intermediate",
        equipment: ["barbell", "dumbbells", "machines", "bodyweight"],
        injuries: [],
        conditions: ["hypermobility"],
      },
      minPool: 60,
    },
  ];

  for (const { name, ctx, minPool } of personas) {
    describe(name, () => {
      it("produces a non-trivial pool", () => {
        const pool = filterPool(ctx);
        expect(pool.length).toBeGreaterThanOrEqual(minPool);
      });

      it("can fill a primary slot for every muscle group it has", () => {
        for (const muscle of ["legs", "hinge", "push", "pull", "core"] as const) {
          const winner = pickForSlot({ muscles: [muscle], role: "primary" }, ctx);
          expect(winner).not.toBeNull();
        }
      });

      it("can build a 5-exercise generic full-body session", () => {
        const picks = pickGenericFullBody(ctx, 5);
        expect(picks.length).toBe(5);
      });
    });
  }
});
