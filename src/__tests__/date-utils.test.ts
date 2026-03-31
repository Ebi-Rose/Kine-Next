import {
  todayISO,
  getMondayOfWeek,
  getCurrentWeekNum,
  getDaysSinceDate,
  formatRelativeDate,
  formatDateShort,
} from "@/lib/date-utils";

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getMondayOfWeek", () => {
  it("returns Monday for a Wednesday input", () => {
    // 2025-03-26 is a Wednesday
    const wed = new Date("2025-03-26T12:00:00");
    const monday = getMondayOfWeek(wed);
    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getDate()).toBe(24);
  });

  it("returns same day when given a Monday", () => {
    const mon = new Date("2025-03-24T12:00:00");
    const result = getMondayOfWeek(mon);
    expect(result.getDate()).toBe(24);
  });

  it("returns previous Monday for a Sunday", () => {
    // 2025-03-30 is a Sunday
    const sun = new Date("2025-03-30T12:00:00");
    const monday = getMondayOfWeek(sun);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(24);
  });

  it("zeroes out time component", () => {
    const result = getMondayOfWeek(new Date("2025-03-26T15:30:45"));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("handles month boundary (Sunday April 6 → Monday March 31)", () => {
    const sun = new Date("2025-04-06T12:00:00");
    const monday = getMondayOfWeek(sun);
    expect(monday.getMonth()).toBe(2); // March (0-indexed)
    expect(monday.getDate()).toBe(31);
  });
});

describe("getCurrentWeekNum", () => {
  it("returns 1 when programStartDate is null", () => {
    expect(getCurrentWeekNum(null)).toBe(1);
  });

  it("returns 1 on the start week", () => {
    const monday = getMondayOfWeek();
    const result = getCurrentWeekNum(monday.toISOString().split("T")[0]);
    expect(result).toBe(1);
  });

  it("returns 2 one week later", () => {
    const monday = getMondayOfWeek();
    monday.setDate(monday.getDate() - 7);
    const result = getCurrentWeekNum(monday.toISOString().split("T")[0]);
    expect(result).toBe(2);
  });

  it("never returns less than 1", () => {
    // Future date
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const result = getCurrentWeekNum(future.toISOString().split("T")[0]);
    expect(result).toBeGreaterThanOrEqual(1);
  });
});

describe("getDaysSinceDate", () => {
  it("returns 0 for today", () => {
    expect(getDaysSinceDate(todayISO())).toBe(0);
  });

  it("returns positive number for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(getDaysSinceDate(past.toISOString().split("T")[0])).toBeGreaterThanOrEqual(4);
    expect(getDaysSinceDate(past.toISOString().split("T")[0])).toBeLessThanOrEqual(6);
  });
});

describe("formatRelativeDate", () => {
  function daysAgoISO(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  it("returns 'today' for today", () => {
    expect(formatRelativeDate(daysAgoISO(0))).toBe("today");
  });

  it("returns 'yesterday' for 1 day ago", () => {
    expect(formatRelativeDate(daysAgoISO(1))).toBe("yesterday");
  });

  it("returns 'N days ago' for 2-6 days", () => {
    const result = formatRelativeDate(daysAgoISO(4));
    expect(result).toMatch(/\d+ days ago/);
  });

  it("returns 'last week' for 7-13 days", () => {
    expect(formatRelativeDate(daysAgoISO(10))).toBe("last week");
  });

  it("returns 'N weeks ago' for 14+ days", () => {
    const result = formatRelativeDate(daysAgoISO(21));
    expect(result).toMatch(/\d+ weeks ago/);
  });
});

describe("formatDateShort", () => {
  it("formats date as 'D Mon'", () => {
    const result = formatDateShort("2025-03-15");
    expect(result).toContain("15");
    expect(result).toContain("Mar");
  });
});
