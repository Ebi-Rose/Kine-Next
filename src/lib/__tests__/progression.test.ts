import { calculateORM } from "../progression";
import { calculatePlatesForSystem } from "../format";

describe("calculateORM", () => {
  it("returns 0 for invalid inputs", () => {
    expect(calculateORM(0, 5)).toBe(0);
    expect(calculateORM(60, 0)).toBe(0);
    expect(calculateORM(-10, 5)).toBe(0);
  });

  it("returns the weight itself for 1 rep", () => {
    expect(calculateORM(100, 1)).toBe(100);
  });

  it("calculates Brzycki 1RM correctly", () => {
    // 60kg × 10 reps → 60 * 36 / (37 - 10) = 60 * 36 / 27 = 80
    expect(calculateORM(60, 10)).toBe(80);
  });

  it("handles 5 reps", () => {
    // 80kg × 5 reps → 80 * 36 / (37 - 5) = 80 * 36 / 32 = 90
    expect(calculateORM(80, 5)).toBe(90);
  });
});

describe("calculatePlatesForSystem (metric)", () => {
  it("returns empty for bar weight or less", () => {
    expect(calculatePlatesForSystem(20, "metric")).toEqual([]);
    expect(calculatePlatesForSystem(15, "metric")).toEqual([]);
  });

  it("calculates plates for 60kg (20kg bar)", () => {
    // (60 - 20) / 2 = 20kg per side → 1 × 20kg plate each side
    const plates = calculatePlatesForSystem(60, "metric");
    expect(plates).toEqual([{ plate: 20, count: 1 }]);
  });

  it("calculates plates for 100kg", () => {
    // (100 - 20) / 2 = 40kg per side → 2 × 20kg
    const plates = calculatePlatesForSystem(100, "metric");
    expect(plates).toEqual([{ plate: 20, count: 2 }]);
  });

  it("calculates mixed plates for 67.5kg", () => {
    // (67.5 - 20) / 2 = 23.75kg per side → 20 + 2.5 + 1.25
    const plates = calculatePlatesForSystem(67.5, "metric");
    expect(plates).toEqual([
      { plate: 20, count: 1 },
      { plate: 2.5, count: 1 },
      { plate: 1.25, count: 1 },
    ]);
  });
});

describe("calculatePlatesForSystem (imperial)", () => {
  it("returns empty for bar weight or less", () => {
    expect(calculatePlatesForSystem(45, "imperial")).toEqual([]);
    expect(calculatePlatesForSystem(30, "imperial")).toEqual([]);
  });

  it("calculates plates for 135lbs (45lb bar)", () => {
    // (135 - 45) / 2 = 45lbs per side → 1 × 45lb plate
    const plates = calculatePlatesForSystem(135, "imperial");
    expect(plates).toEqual([{ plate: 45, count: 1 }]);
  });
});
