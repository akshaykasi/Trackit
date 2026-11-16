import type { CompanyStatus } from "../types";

export const STATUS_ORDER: CompanyStatus[] = [
  "wishlist",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
];

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  oa: "OA",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

/** Colour dot per pipeline stage (fills only — coral never appears as text on cream). */
export const STATUS_DOT: Record<CompanyStatus, string> = {
  wishlist: "bg-sage",
  applied: "bg-moss",
  oa: "bg-sun",
  interview: "bg-coral",
  offer: "bg-ink",
  rejected: "bg-divider",
};

export function adjacentStatus(status: CompanyStatus): {
  prev: CompanyStatus | null;
  next: CompanyStatus | null;
} {
  const i = STATUS_ORDER.indexOf(status);
  return {
    prev: i > 0 ? STATUS_ORDER[i - 1] : null,
    next: i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null,
  };
}
