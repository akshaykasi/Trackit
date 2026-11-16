import { describe, expect, it } from "vitest";
import { averagePct, mockTrend, streakDays } from "./stats";

describe("streakDays", () => {
  it("counts consecutive days ending today", () => {
    expect(streakDays(["2026-11-14", "2026-11-15", "2026-11-16"], "2026-11-16")).toBe(3);
  });
  it("counts a streak ending yesterday when today has no entry yet", () => {
    expect(streakDays(["2026-11-14", "2026-11-15"], "2026-11-16")).toBe(2);
  });
  it("is 0 when the chain is broken or absent", () => {
    expect(streakDays(["2026-11-13"], "2026-11-16")).toBe(0);
    expect(streakDays([], "2026-11-16")).toBe(0);
  });
  it("ignores duplicate day entries", () => {
    expect(streakDays(["2026-11-16", "2026-11-16", "2026-11-15"], "2026-11-16")).toBe(2);
  });
});

describe("averagePct", () => {
  it("averages and rounds", () => {
    expect(averagePct([90, 80, 85])).toBe(85);
    expect(averagePct([100])).toBe(100);
    expect(averagePct([])).toBe(0);
  });
});

describe("mockTrend", () => {
  it("needs at least two scores", () => {
    expect(mockTrend([])).toBe("not-enough");
    expect(mockTrend([70])).toBe("not-enough");
  });
  it("detects improving, flat and declining", () => {
    expect(mockTrend([50, 52, 60, 66])).toBe("improving");
    expect(mockTrend([60, 61, 59, 60])).toBe("flat");
    expect(mockTrend([70, 72, 55, 52])).toBe("declining");
  });
});
