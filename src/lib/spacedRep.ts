/**
 * Spaced repetition for the problem log: after logging a problem the student
 * revises it on day +1, +3, +7 and +14, then it is exam-ready (no more dues).
 * Pure — unit-testable. Dates are local calendar days (YYYY-MM-DD strings).
 */

/** Revision gaps in days, indexed by how many revisions are already done. */
export const REVISE_INTERVALS_DAYS = [1, 3, 7, 14] as const;

function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00`); // noon avoids DST edge cases
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/**
 * The revise_due after completing revision number `revisionsDone` (0-based:
 * before any revision pass). Returns a local YYYY-MM-DD date, or null when the
 * problem has finished the full ladder (4 passes → exam-ready).
 */
export function nextReviseDue(revisionsDone: number, fromISO: string): string | null {
  const interval = REVISE_INTERVALS_DAYS[revisionsDone];
  if (interval === undefined) return null;
  return addDays(fromISO, interval);
}

export type ReviseUrgency = "overdue" | "today" | "soon" | "later";

/** Pure — how urgent is a revise_due compared to today's date string. */
export function reviseUrgency(reviseDue: string, todayISO: string): ReviseUrgency {
  if (reviseDue < todayISO) return "overdue";
  if (reviseDue === todayISO) return "today";
  const d = new Date(`${reviseDue}T12:00:00`).getTime() - new Date(`${todayISO}T12:00:00`).getTime();
  if (d <= 2 * 86400000) return "soon";
  return "later";
}

/** Pure — problem-log ordering: due revisions first, then unsolved, then done. */
export function sortPrepItems<T extends { revise_due: string | null; status: string; created_at: string }>(
  items: T[],
  todayISO: string,
): T[] {
  const rank = (i: T): number => {
    if (i.revise_due) return reviseUrgency(i.revise_due, todayISO) === "later" ? 2 : 0;
    if (i.status === "todo") return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (a.revise_due && b.revise_due) return a.revise_due < b.revise_due ? -1 : 1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}
