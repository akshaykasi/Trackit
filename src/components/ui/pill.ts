/**
 * Pill button classes shared by Button, ButtonLink and plain anchors.
 * 48px minimum height (spec floor is 44px), fully rounded, ≥4.5:1 text
 * contrast in every variant.
 *  primary   — green ink background, cream text
 *  accent    — coral background, dark text (coral is a fill, never text on cream)
 *  secondary — light green background, dark text
 *  success   — mid green background, white text
 */
export type ButtonVariant = "primary" | "accent" | "secondary" | "success";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-panel active:bg-panel",
  accent: "bg-coral text-ink hover:bg-coral-deep active:bg-coral-deep",
  secondary: "bg-sage text-ink hover:bg-sage-deep active:bg-sage-deep",
  success: "bg-moss text-white hover:bg-moss-deep active:bg-moss-deep",
};

export function pillClass(variant: ButtonVariant = "primary"): string {
  return [
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7",
    "text-base font-semibold transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClass[variant],
  ].join(" ");
}
