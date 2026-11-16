import { describe, expect, it } from "vitest";
import { readinessGrade, readinessScore } from "./readiness";

describe("readinessScore", () => {
  it("is 0 with no signals", () => {
    expect(readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [], revisionDays14: 0 })).toEqual({
      score: 0,
      breakdown: { topics: 0, mocks: 0, revisions: 0 },
    });
  });

  it("awards 40 pts for full topic coverage", () => {
    const r = readinessScore({ topicsDone: 17, topicsTotal: 34, recentMockPcts: [], revisionDays14: 0 });
    expect(r.breakdown.topics).toBe(20);
    expect(r.score).toBe(20);
  });

  it("awards 40 pts at a 100% mock average", () => {
    const r = readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [100, 100], revisionDays14: 0 });
    expect(r.breakdown.mocks).toBe(40);
    expect(r.score).toBe(40);
  });

  it("caps mock average above 100 defensively", () => {
    const r = readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [140], revisionDays14: 0 });
    expect(r.breakdown.mocks).toBe(40);
  });

  it("awards full 20 pts for revising on 7 of the last 14 days", () => {
    const r = readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [], revisionDays14: 7 });
    expect(r.breakdown.revisions).toBe(20);
  });

  it("is capped at 7 revision days (extra days add nothing)", () => {
    const a = readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [], revisionDays14: 7 });
    const b = readinessScore({ topicsDone: 0, topicsTotal: 10, recentMockPcts: [], revisionDays14: 12 });
    expect(a.breakdown.revisions).toBe(b.breakdown.revisions);
  });

  it("sums all three signals", () => {
    const r = readinessScore({
      topicsDone: 34,
      topicsTotal: 34,
      recentMockPcts: [80, 90],
      revisionDays14: 7,
    });
    // topics 40 + mocks (85% avg → 34) + revisions 20
    expect(r.score).toBe(94);
    expect(r.breakdown).toEqual({ topics: 40, mocks: 34, revisions: 20 });
  });
});

describe("readinessGrade", () => {
  it("maps score bands to grades", () => {
    expect(readinessGrade(0)).toBe("Getting started");
    expect(readinessGrade(39)).toBe("Getting started");
    expect(readinessGrade(40)).toBe("On track");
    expect(readinessGrade(69)).toBe("On track");
    expect(readinessGrade(70)).toBe("Strong");
    expect(readinessGrade(89)).toBe("Strong");
    expect(readinessGrade(90)).toBe("Exam ready");
  });
});
