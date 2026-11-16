/** Calendar composition types + pure grouping helpers (unit-testable). */

import type { Company, PrepItem, Round } from "../types";

export type CalendarEventKind = "round" | "deadline" | "revision";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  /** Short label, e.g. "Technical interview" or "Application deadline". */
  label: string;
  /** Secondary line, e.g. the company name or "dsa · Graphs". */
  detail: string | null;
  /** ISO date or datetime. */
  date: string;
  companyId: string | null;
  href: string;
}

export interface DayGroup {
  key: string;
  events: CalendarEvent[];
}

/** Pure — group events by calendar day, keeping sort order within a day. */
export function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = event.date.slice(0, 10);
    const list = groups.get(key);
    if (list) list.push(event);
    else groups.set(key, [event]);
  }
  return [...groups.entries()].map(([key, list]) => ({ key, events: list }));
}

export interface RawCalendarData {
  companies: Company[];
  rounds: Pick<Round, "id" | "company_id" | "type" | "scheduled_at" | "result">[];
  prepItems: Pick<PrepItem, "id" | "track" | "topic" | "title" | "revise_due">[];
}

const LOOKAHEAD_DAYS = 60;

/** Pure — compose raw DB rows into a single event list sorted by date. */
export function composeEvents(raw: RawCalendarData, now: Date): CalendarEvent[] {
  const companyName = new Map(raw.companies.map((c) => [c.id, c.name]));
  const composed: CalendarEvent[] = [];

  for (const c of raw.companies) {
    if (c.deadline) {
      composed.push({
        id: `deadline-${c.id}`,
        kind: "deadline",
        label: "Application deadline",
        detail: c.name,
        date: c.deadline,
        companyId: c.id,
        href: `/app/companies/${c.id}`,
      });
    }
  }
  for (const r of raw.rounds) {
    if (r.scheduled_at) {
      composed.push({
        id: `round-${r.id}`,
        kind: "round",
        label: r.type,
        detail: companyName.get(r.company_id) ?? null,
        date: r.scheduled_at,
        companyId: r.company_id,
        href: `/app/companies/${r.company_id}`,
      });
    }
  }
  for (const p of raw.prepItems) {
    if (p.revise_due) {
      composed.push({
        id: `revision-${p.id}`,
        kind: "revision",
        label: `Revise: ${p.title}`,
        detail: `${p.track} · ${p.topic}`,
        date: p.revise_due,
        companyId: null,
        href: "/app/prep",
      });
    }
  }

  const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000).toISOString();
  return composed.filter((e) => e.date <= horizon).sort((a, b) => (a.date < b.date ? -1 : 1));
}
