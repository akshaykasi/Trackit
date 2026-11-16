import type { Company } from "../types";

/** Pure — offers sorted by CTC (highest first), null-CTC last, newest-first tiebreak. */
export function sortOffers(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    if ((a.ctc ?? 0) !== (b.ctc ?? 0)) return (b.ctc ?? 0) - (a.ctc ?? 0);
    return a.created_at < b.created_at ? 1 : -1;
  });
}
