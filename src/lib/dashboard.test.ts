import { describe, expect, it } from "vitest";
import { dayDiff } from "./format";
import {
  DAILY_TARGET,
  HEAT_WEEKS,
  bestStreak,
  difficultyCounts,
  heatCellDates,
  heatLevels,
  longDate,
  weekBars,
  weekdayShort,
} from "./dashboard";

const TODAY = "2026-11-16"; // a Monday

describe("longDate", () => {
  it("formats the full local date", () => {
    const text = longDate("2026-11-16");
    expect(text).toContain("Monday");
    expect(text).toContain("November");
    expect(text).toContain("2026");
  });
  it("is empty for invalid input", () => {
    expect(longDate("")).toBe("");
  });
});

describe("weekdayShort", () => {
  it("abbreviates the weekday", () => {
    expect(weekdayShort("2026-11-16")).toBe("Mon");
    expect(weekdayShort("2026-11-22")).toBe("Sun");
  });
});

describe("bestStreak", () => {
  it("finds the longest consecutive run", () => {
    expect(bestStreak(["2026-11-14", "2026-11-15", "2026-11-16"])).toBe(3);
    expect(bestStreak(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-16"])).toBe(4);
  });
  it("restarts across gaps and ignores duplicates", () => {
    expect(bestStreak(["2026-11-14", "2026-11-16"])).toBe(1);
    expect(bestStreak(["2026-11-16", "2026-11-16", "2026-11-15"])).toBe(2);
    expect(bestStreak([])).toBe(0);
  });
});

describe("weekBars", () => {
  it("returns seven days oldest → today with counts", () => {
    const counts = { "2026-11-16": 2, "2026-11-12": 5 };
    const bars = weekBars(counts, TODAY);
    expect(bars).toHaveLength(7);
    expect(bars[0].iso).toBe("2026-11-10");
    expect(bars[6].iso).toBe("2026-11-16");
    expect(bars[0].label).toBe("Tue");
    expect(bars[6].label).toBe("Mon");
    expect(bars[6].count).toBe(2);
    expect(bars[2].count).toBe(5); // 2026-11-12
    expect(bars.reduce((n, b) => n + b.count, 0)).toBe(7);
  });
});

describe("DAILY_TARGET", () => {
  it("is the per-day solve goal", () => {
    expect(DAILY_TARGET).toBe(3);
  });
});

describe("heatLevels", () => {
  it("produces weeks × 7 levels in column-major order ending today", () => {
    const levels = heatLevels({}, TODAY);
    expect(levels).toHaveLength(HEAT_WEEKS * 7);
    const dates = heatCellDates(TODAY);
    expect(dates).toHaveLength(HEAT_WEEKS * 7);
    expect(dayDiff(dates[0], TODAY)).toBe(HEAT_WEEKS * 7 - 1);
    expect(dates[dates.length - 1]).toBe(TODAY);
    expect(dayDiff(dates[6], dates[7])).toBe(1);
  });
  it("maps counts to 0/1/2/3/4 bands", () => {
    const counts = { "2026-11-16": 1, "2026-11-15": 2, "2026-11-14": 3, "2026-11-13": 4, "2026-11-12": 6 };
    const levels = heatLevels(counts, TODAY);
    expect(levels[levels.length - 1]).toBe(1); // 16th: 1
    expect(levels[levels.length - 2]).toBe(2); // 15th: 2
    expect(levels[levels.length - 3]).toBe(2); // 14th: 3
    expect(levels[levels.length - 4]).toBe(3); // 13th: 4
    expect(levels[levels.length - 5]).toBe(4); // 12th: 6
    expect(levels[0]).toBe(0);
  });
});

describe("difficultyCounts", () => {
  it("counts solved problems per difficulty", () => {
    const items = [
      { status: "done", difficulty: "easy" },
      { status: "done", difficulty: "easy" },
      { status: "done", difficulty: "medium" },
      { status: "done", difficulty: "hard" },
      { status: "todo", difficulty: "hard" },
    ];
    expect(difficultyCounts(items)).toEqual({ easy: 2, medium: 1, hard: 1 });
  });
  it("is zeroed when nothing is solved", () => {
    expect(difficultyCounts([])).toEqual({ easy: 0, medium: 0, hard: 0 });
  });
});
