import { describe, expect, it } from "vitest";
import { TRACKS, trackLabel, topicsFor } from "./tracks";
import { COMPANY_STATUSES } from "../types";

describe("TRACKS", () => {
  it("covers every prep_track enum value with non-empty topics", () => {
    const ids = new Set(TRACKS.map((t) => t.id));
    expect(ids).toEqual(new Set(["dsa", "java", "sql", "aptitude"]));
    for (const t of TRACKS) {
      expect(t.topics.length).toBeGreaterThan(0);
      expect(new Set(t.topics).size).toBe(t.topics.length); // no duplicates
    }
  });
});

describe("trackLabel / topicsFor", () => {
  it("resolves labels and topics by track id", () => {
    expect(trackLabel("dsa")).toBe("DSA");
    expect(topicsFor("sql")[0]).toBe("SELECT Basics");
  });
});

describe("COMPANY_STATUSES", () => {
  it("matches the pipeline order used by the kanban board", () => {
    expect(COMPANY_STATUSES).toEqual([
      "wishlist",
      "applied",
      "oa",
      "interview",
      "offer",
      "rejected",
    ]);
  });
});
