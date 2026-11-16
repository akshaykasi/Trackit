import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
}

/** White card, 28px radius, 32px padding — the standard Trackit surface. */
export function Card({ className = "", children }: CardProps) {
  return <div className={`rounded-[28px] bg-white p-8 ${className}`}>{children}</div>;
}
