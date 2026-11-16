/**
 * Activity/mocking statistics. Pure — unit-testable.
 * Dates are local calendar days (YYYY-MM-DD strings).
 */

function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/**
 * Current activity streak: consecutive days ending today, or yesterday if
 * nothing was logged today yet (a streak does not die before its day does).
 */
export function streakDays(activityDays: string[], todayISO: string): number {
  const unique = new Set(activityDays);
  const start = unique.has(todayISO)
    ? todayISO
    : unique.has(addDays(todayISO, -1))
      ? addDays(todayISO, -1)
      : null;
  if (!start) return 0;

  let count = 0;
  let cursor = start;
  while (unique.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Mean of percentages, rounded to the nearest integer. */
export function averagePct(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

export type MockTrend = "not-enough" | "improving" | "flat" | "declining";

/**
 * Trend over a series of mock percentages (oldest first): compares the mean of
 * the latest half against the mean of the earlier half. ±2 pts counts as flat.
 */
export function mockTrend(pcts: number[]): MockTrend {
  if (pcts.length < 2) return "not-enough";
  const split = Math.max(1, Math.floor(pcts.length / 2));
  const earlier = pcts.slice(0, split);
  const recent = pcts.slice(split);
  const diff = averagePct(recent) - averagePct(earlier);
  if (diff >= 2) return "improving";
  if (diff <= -2) return "declining";
  return "flat";
}
