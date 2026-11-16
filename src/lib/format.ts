/** Formatting + date helpers. Pure — unit-testable. */

export function formatCTC(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "";
  if (value >= 100000) {
    const lpa = Math.round((value / 100000) * 10) / 10;
    return `₹${lpa} LPA`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Days from `now` until `iso` (negative = overdue). Dates count to end-of-day. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso.length <= 10 ? `${iso}T23:59:59` : iso);
  // `+ 0` normalises Math.ceil's -0 to 0
  return Math.ceil((target.getTime() - now.getTime()) / 86400000) + 0;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Local calendar-day key (YYYY-MM-DD) for grouping. */
export function dayKey(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-CA");
}

/** Pure — whole calendar days from date `aISO` to date `bISO` (ignores time of day). */
export function dayDiff(aISO: string, bISO: string): number {
  const a = Date.parse(`${aISO.slice(0, 10)}T12:00:00`);
  const b = Date.parse(`${bISO.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.round((b - a) / 86400000);
}

export function friendlyDayLabel(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso.length <= 10 ? `${iso}T23:59:59` : iso, now);
  const base = formatDate(iso);
  if (days === 0) return `${base} · Today`;
  if (days === 1) return `${base} · Tomorrow`;
  return base;
}

/** datetime-local input value → ISO timestamp with local offset, or null. */
export function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
