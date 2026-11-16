/**
 * Dashboard presentation helpers. Pure — unit-testable.
 * Dates are local calendar days (YYYY-MM-DD strings).
 */

import { dayDiff } from "./format";

function shiftDay(dateISO: string, days: number): string {
  const d = new Date(`${dateISO.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/** Long localised date ("Monday, 16 November, 2026") for the header. */
export function longDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Short weekday ("Mon") for the this-week bars. */
export function weekdayShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { weekday: "short" });
}

/**
 * Longest run of consecutive active days inside the activity window
 * (complements the current streak with a "personal best").
 */
export function bestStreak(activityDays: string[]): number {
  const unique = [...new Set(activityDays)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of unique) {
    run = prev !== null && dayDiff(prev, d) === 1 ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  }
  return best;
}

export interface WeekBar {
  iso: string;
  label: string;
  count: number;
}

/** Last `days` days (oldest → today) with per-day action counts, for the bar chart. */
export function weekBars(
  counts: Record<string, number>,
  todayISO: string,
  days = 7,
): WeekBar[] {
  return Array.from({ length: days }, (_, i) => {
    const iso = shiftDay(todayISO, i - (days - 1));
    return { iso, label: weekdayShort(iso), count: counts[iso] ?? 0 };
  });
}

export const DAILY_TARGET = 3;

export const HEAT_WEEKS = 15;

/**
 * Heatmap levels, column-major (week columns × 7 rows), ending today:
 * 0 → 0 · 1 → 1 · 2–3 → 2 · 4–5 → 3 · ≥6 → 4.
 */
export function heatLevels(
  counts: Record<string, number>,
  todayISO: string,
  weeks = HEAT_WEEKS,
): number[] {
  const cells = weeks * 7;
  const startISO = shiftDay(todayISO, -(cells - 1));
  const out: number[] = [];
  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const iso = shiftDay(startISO, col * 7 + row);
      const n = counts[iso] ?? 0;
      out.push(n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
    }
  }
  return out;
}

/** Dates matching heatLevels' indexing (same start, same column-major order). */
export function heatCellDates(todayISO: string, weeks = HEAT_WEEKS): string[] {
  const cells = weeks * 7;
  const startISO = shiftDay(todayISO, -(cells - 1));
  return Array.from({ length: cells }, (_, i) => shiftDay(startISO, i));
}

export interface DifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
}

/** Solved-problem counts per difficulty (todo items excluded). */
export function difficultyCounts(
  items: { status: string; difficulty: string }[],
): DifficultyCounts {
  const out: DifficultyCounts = { easy: 0, medium: 0, hard: 0 };
  for (const i of items) {
    if (i.status !== "done") continue;
    if (i.difficulty === "easy") out.easy += 1;
    else if (i.difficulty === "medium") out.medium += 1;
    else if (i.difficulty === "hard") out.hard += 1;
  }
  return out;
}
