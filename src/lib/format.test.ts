import { describe, expect, it } from "vitest";
import { dayDiff, dayKey, daysUntil, formatCTC, datetimeLocalToIso } from "./format";

describe("formatCTC", () => {
  it("formats lakh-range CTCs in LPA", () => {
    expect(formatCTC(450000)).toBe("₹4.5 LPA");
    expect(formatCTC(100000)).toBe("₹1 LPA");
    expect(formatCTC(1250000)).toBe("₹12.5 LPA");
  });
  it("formats sub-lakh values with Indian grouping", () => {
    expect(formatCTC(45000)).toBe("₹45,000");
  });
  it("returns empty for null or NaN", () => {
    expect(formatCTC(null)).toBe("");
    expect(formatCTC(Number.NaN)).toBe("");
  });
});

describe("daysUntil", () => {
  it("counts to end of day for date-only strings", () => {
    expect(daysUntil("2026-11-18", new Date("2026-11-16T10:00:00"))).toBe(3);
    expect(daysUntil("2026-11-16", new Date("2026-11-16T22:00:00"))).toBe(1);
  });
  it("is 0 only when the day has passed", () => {
    expect(daysUntil("2026-11-15", new Date("2026-11-16T10:00:00"))).toBe(0);
    expect(daysUntil("2026-11-14", new Date("2026-11-16T10:00:00"))).toBe(-1);
  });
});

describe("dayKey", () => {
  it("gives a stable local YYYY-MM-DD key", () => {
    expect(dayKey("2026-11-17T10:00:00+05:30")).toBe("2026-11-17");
    expect(dayKey("2026-11-17")).toBe("2026-11-17");
  });
});

describe("dayDiff", () => {
  it("counts whole calendar days between dates", () => {
    expect(dayDiff("2026-11-16", "2026-11-19")).toBe(3);
    expect(dayDiff("2026-11-19", "2026-11-16")).toBe(-3);
    expect(dayDiff("2026-11-16", "2026-11-16")).toBe(0);
  });
  it("returns NaN for invalid input", () => {
    expect(dayDiff("", "2026-11-16")).toBeNaN();
  });
});

describe("datetimeLocalToIso", () => {
  it("converts datetime-local values to ISO", () => {
    const iso = datetimeLocalToIso("2026-11-17T15:30");
    expect(iso).not.toBeNull();
    expect(new Date(iso as string).getHours()).toBe(15);
  });
  it("returns null for empty or invalid input", () => {
    expect(datetimeLocalToIso("")).toBeNull();
    expect(datetimeLocalToIso("not-a-date")).toBeNull();
  });
});
