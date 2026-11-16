import type { PrepTrack } from "../types";

/** Static curriculum per track. Index within the array = topic_index in topic_progress. */
export const TRACKS: { id: PrepTrack; label: string; blurb: string; topics: string[] }[] = [
  {
    id: "dsa",
    label: "DSA",
    blurb: "Patterns first, then volume. OA season runs on these.",
    topics: [
      "Arrays & Hashing",
      "Two Pointers",
      "Sliding Window",
      "Stack",
      "Binary Search",
      "Linked List",
      "Trees",
      "Graphs",
      "Dynamic Programming",
      "Greedy",
    ],
  },
  {
    id: "java",
    label: "Java",
    blurb: "Language round + interview favourites.",
    topics: [
      "OOP Basics",
      "Collections",
      "Exceptions & I/O",
      "Strings",
      "Generics",
      "Multithreading",
      "JVM & Memory",
    ],
  },
  {
    id: "sql",
    label: "SQL",
    blurb: "Every tech round has a query question. Practise writing, not reading.",
    topics: [
      "SELECT Basics",
      "Joins",
      "Aggregations",
      "Subqueries",
      "Window Functions",
      "Indexes & Performance",
      "Normalization",
    ],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    blurb: "Speed matters. 20 minutes a day beats a weekly binge.",
    topics: [
      "Percentages",
      "Profit & Loss",
      "Time & Work",
      "Speed & Distance",
      "Permutations & Combinations",
      "Probability",
      "Data Interpretation",
    ],
  },
];

export function trackLabel(track: PrepTrack): string {
  return TRACKS.find((t) => t.id === track)?.label ?? track;
}

/** Topics of a track by their stable index (topic_progress rows). */
export function topicsFor(track: PrepTrack): string[] {
  return TRACKS.find((t) => t.id === track)?.topics ?? [];
}
