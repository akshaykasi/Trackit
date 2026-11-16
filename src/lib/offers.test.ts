import { describe, expect, it } from "vitest";
import { sortOffers } from "./offers";
import type { Company } from "../types";

const mk = (id: string, ctc: number | null, created_at: string): Company => ({
  id,
  student_id: "s1",
  name: id,
  role_title: "",
  ctc,
  location: null,
  status: "offer",
  applied_on: null,
  deadline: null,
  notes: null,
  created_at,
});

describe("sortOffers", () => {
  it("puts the highest CTC first and null-CTC last", () => {
    const sorted = sortOffers([
      mk("a", null, "2026-11-01"),
      mk("b", 500000, "2026-11-02"),
      mk("c", 1200000, "2026-11-03"),
    ]);
    expect(sorted.map((c) => c.id)).toEqual(["c", "b", "a"]);
  });
  it("breaks CTC ties by newest first", () => {
    const sorted = sortOffers([mk("old", 500000, "2026-11-01"), mk("new", 500000, "2026-11-05")]);
    expect(sorted.map((c) => c.id)).toEqual(["new", "old"]);
  });
  it("does not mutate the input", () => {
    const input = [mk("b", 500000, "2026-11-02"), mk("c", 1200000, "2026-11-03")];
    sortOffers(input);
    expect(input[0].id).toBe("b");
  });
});
