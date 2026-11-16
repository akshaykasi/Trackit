import { describe, expect, it } from "vitest";
import { composeEvents, groupByDay, type RawCalendarData } from "./calendar";

const NOW = new Date("2026-11-16T10:00:00");

describe("groupByDay", () => {
  it("groups events by calendar day, preserving order", () => {
    const groups = groupByDay([
      { id: "a", kind: "round", label: "OA", detail: null, date: "2026-11-17T09:00:00", companyId: null, href: "/" },
      { id: "b", kind: "deadline", label: "Deadline", detail: null, date: "2026-11-17", companyId: null, href: "/" },
      { id: "c", kind: "revision", label: "Revise", detail: null, date: "2026-11-18", companyId: null, href: "/" },
    ]);
    expect(groups.map((g) => g.key)).toEqual(["2026-11-17", "2026-11-18"]);
    expect(groups[0].events.map((e) => e.id)).toEqual(["a", "b"]);
  });
  it("returns [] for empty input", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("composeEvents", () => {
  const raw: RawCalendarData = {
    companies: [
      {
        id: "c1",
        student_id: "s1",
        name: "Infosys",
        role_title: "",
        ctc: null,
        location: null,
        status: "applied",
        applied_on: null,
        deadline: "2026-11-18",
        notes: null,
        created_at: "2026-11-01T00:00:00",
      },
    ],
    rounds: [
      { id: "r1", company_id: "c1", type: "Technical interview", scheduled_at: "2026-11-17T10:00:00", result: "pending" },
    ],
    prepItems: [
      {
        id: "p1",
        track: "dsa",
        topic: "Graphs",
        title: "BFS template",
        revise_due: "2026-11-30",
      },
    ],
  };

  it("composes deadlines, rounds and revisions sorted by date", () => {
    const events = composeEvents(raw, NOW);
    expect(events.map((e) => e.kind)).toEqual(["round", "deadline", "revision"]);
    expect(events.map((e) => e.date)).toEqual([
      "2026-11-17T10:00:00",
      "2026-11-18",
      "2026-11-30",
    ]);
    expect(events[1].detail).toBe("Infosys");
  });

  it("drops events beyond the 60-day horizon", () => {
    const far: RawCalendarData = {
      ...raw,
      prepItems: [{ ...raw.prepItems[0], revise_due: "2027-06-01" }],
    };
    expect(composeEvents(far, NOW)).toHaveLength(2);
  });
});
