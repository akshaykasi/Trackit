import type { ReactNode } from "react";

export type StatTileVariant = "dark" | "light" | "white" | "coral";

const tileClass: Record<StatTileVariant, string> = {
  dark: "bg-moss text-cream",
  light: "bg-sage text-ink",
  white: "bg-white text-ink",
  coral: "bg-coral text-ink",
};

interface StatTileProps {
  variant?: StatTileVariant;
  label: ReactNode;
  value: ReactNode;
  /** md = 44px number (app stat tiles) · lg = 48px (landing preview) */
  size?: "md" | "lg";
  className?: string;
}

/** Stat tile: 24px radius, four colour variants, big bold number. */
export function StatTile({
  variant = "light",
  label,
  value,
  size = "md",
  className = "",
}: StatTileProps) {
  const numberSize = size === "lg" ? "text-[48px]" : "text-[44px]";
  return (
    <div className={`rounded-3xl p-6 ${tileClass[variant]} ${className}`}>
      <div className="text-[15px] leading-snug">{label}</div>
      <div className={`mt-1 ${numberSize} font-bold leading-tight`}>{value}</div>
    </div>
  );
}
