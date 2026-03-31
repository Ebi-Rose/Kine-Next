import { getCurrentPhase, getCycleContext, type CyclePhase } from "@/lib/cycle";
import type { PeriodLog } from "@/store/useKineStore";

// Helper: create a period start log N days ago
function startDaysAgo(days: number): PeriodLog {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return { date: d.toISOString().split("T")[0], type: "start" };
}

describe("getCurrentPhase", () => {
  it("returns null for empty period log", () => {
    expect(getCurrentPhase([], null)).toBeNull();
  });

  it("returns null when log has no start entries", () => {
    const log: PeriodLog[] = [{ date: "2025-01-15", type: "end" }];
    expect(getCurrentPhase(log, null)).toBeNull();
  });

  it("returns menstrual phase on day 1-5", () => {
    const result = getCurrentPhase([startDaysAgo(2)], 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("menstrual");
    expect(result!.day).toBeLessThanOrEqual(5);
  });

  it("returns follicular phase on days 6-13", () => {
    const result = getCurrentPhase([startDaysAgo(8)], 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("follicular");
  });

  it("returns ovulatory phase on days 14-16", () => {
    const result = getCurrentPhase([startDaysAgo(14)], 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("ovulatory");
  });

  it("returns luteal phase on days 17-28", () => {
    const result = getCurrentPhase([startDaysAgo(20)], 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("luteal");
  });

  it("wraps around past cycle length", () => {
    // 30 days ago with 28-day cycle → day 3 of new cycle → menstrual
    const result = getCurrentPhase([startDaysAgo(30)], 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("menstrual");
    expect(result!.day).toBeLessThanOrEqual(5);
  });

  it("uses most recent start entry", () => {
    const log: PeriodLog[] = [
      startDaysAgo(60), // older
      startDaysAgo(3),  // most recent
    ];
    const result = getCurrentPhase(log, 28);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("menstrual");
  });

  it("defaults to 28-day cycle when avgLength is null", () => {
    // 30 days ago, null avg → defaults to 28 → wraps to day 3
    const result = getCurrentPhase([startDaysAgo(30)], null);
    expect(result).not.toBeNull();
    expect(result!.day).toBeLessThanOrEqual(5);
  });

  it("handles custom cycle length", () => {
    // 35-day cycle, day 18 → luteal
    const result = getCurrentPhase([startDaysAgo(18)], 35);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("luteal");
  });

  it("includes label and trainingNote", () => {
    const result = getCurrentPhase([startDaysAgo(1)], 28);
    expect(result).not.toBeNull();
    expect(result!.label).toBeTruthy();
    expect(result!.trainingNote).toBeTruthy();
  });
});

describe("getCycleContext", () => {
  it("returns empty string for 'na' cycle type", () => {
    expect(getCycleContext("na", [], null)).toBe("");
  });

  it("returns empty string for null cycle type", () => {
    expect(getCycleContext(null, [], null)).toBe("");
  });

  it("returns hormonal contraception message", () => {
    const result = getCycleContext("hormonal", [], null);
    expect(result).toContain("hormonal contraception");
  });

  it("returns irregular message", () => {
    const result = getCycleContext("irregular", [], null);
    expect(result).toContain("irregular");
  });

  it("returns perimenopause message", () => {
    const result = getCycleContext("perimenopause", [], null);
    expect(result).toContain("perimenopause");
  });

  it("returns phase info for regular cycle with tracking data", () => {
    const result = getCycleContext("regular", [startDaysAgo(3)], 28);
    expect(result).toContain("Menstrual");
    expect(result).toContain("day");
  });

  it("returns 'no tracking data' for regular cycle without log", () => {
    const result = getCycleContext("regular", [], 28);
    expect(result).toContain("no tracking data");
  });
});
