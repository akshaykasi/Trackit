/**
 * Readiness score: a 0–100 estimate of placement preparedness, composed from
 * three explainable signals. Pure — unit-testable.
 *
 *  - Topic coverage   0–40 pts   (topic checklist across all tracks)
 *  - Mock average     0–40 pts   (recent mock test percentages)
 *  - Revision habit   0–20 pts   (distinct revision days in the last 14,
 *                                ~every other day = full marks)
 */

export interface ReadinessInput {
  topicsDone: number;
  topicsTotal: number;
  /** Recent mock percentages, 0–100 each. */
  recentMockPcts: number[];
  /** Distinct local days with a "revised" activity in the last 14 days. */
  revisionDays14: number;
}

export interface ReadinessResult {
  score: number;
  breakdown: { topics: number; mocks: number; revisions: number };
}

const round = (n: number): number => Math.round(n * 10) / 10;

export function readinessScore(input: ReadinessInput): ReadinessResult {
  const topics =
    input.topicsTotal > 0 ? Math.min(1, input.topicsDone / input.topicsTotal) * 40 : 0;
  const avg = input.recentMockPcts.length
    ? input.recentMockPcts.reduce((a, b) => a + b, 0) / input.recentMockPcts.length
    : 0;
  const mocks = (Math.min(100, Math.max(0, avg)) / 100) * 40;
  const revisions = (Math.min(7, Math.max(0, input.revisionDays14)) / 7) * 20;

  const breakdown = { topics: round(topics), mocks: round(mocks), revisions: round(revisions) };
  const score = Math.round(topics + mocks + revisions);
  return { score, breakdown };
}

export type ReadinessGrade = "Getting started" | "On track" | "Strong" | "Exam ready";

export function readinessGrade(score: number): ReadinessGrade {
  if (score >= 90) return "Exam ready";
  if (score >= 70) return "Strong";
  if (score >= 40) return "On track";
  return "Getting started";
}
