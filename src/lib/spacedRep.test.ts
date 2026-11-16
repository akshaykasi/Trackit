import { describe, expect, it } from "vitest";
import { nextReviseDue, reviseUrgency, sortPrepItems } from "./spacedRep";

describe("nextReviseDue", () => {
  it("follows the 1/3/7/14 day ladder", () => {
    expect(nextReviseDue(0, "2026-11-16")).toBe("2026-11-17");
    expect(nextReviseDue(1, "2026-11-16")).toBe("2026-11-19");
    expect(nextReviseDue(2, "2026-11-16")).toBe("2026-11-23");
    expect(nextReviseDue(3, "2026-11-16")).toBe("2026-11-30");
  });
  it("returns null once the ladder is finished", () => {
    expect(nextReviseDue(4, "2026-11-16")).toBeNull();
    expect(nextReviseDue(99, "2026-11-16")).toBeNull();
  });
  it("rolls over month ends correctly", () => {
    expect(nextReviseDue(0, "2026-11-30")).toBe("2026-12-01");
  });
});

describe("reviseUrgency", () => {
  it("classifies overdue, today, soon and later", () => {
    expect(reviseUrgency("2026-11-14", "2026-11-16")).toBe("overdue");
    expect(reviseUrgency("2026-11-16", "2026-11-16")).toBe("today");
    expect(reviseUrgency("2026-11-18", "2026-11-16")).toBe("soon");
    expect(reviseUrgency("2026-11-25", "2026-11-16")).toBe("later");
  });
});

describe("sortPrepItems", () => {
  const mk = (id: string, status: string, revise_due: string | null, created_at: string) => ({
    id,
    status,
    revise_due,
    created_at,
  });

  it("puts due revisions first (earliest due), then unsolved, then done", () => {
    const sorted = sortPrepItems(
      [
        mk("done-old", "done", null, "2026-11-10"),
        mk("unsolved", "todo", null, "2026-11-11"),
        mk("due-later", "done", "2026-11-25", "2026-11-12"),
        mk("due-now", "done", "2026-11-16", "2026-11-13"),
        mk("overdue", "done", "2026-11-14", "2026-11-14"),
      ],
      "2026-11-16",
    );
    expect(sorted.map((i) => i.id)).toEqual(["overdue", "due-now", "unsolved", "due-later", "done-old"]);
  });
});
