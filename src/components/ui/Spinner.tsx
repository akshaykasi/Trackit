/** Small inline spinner (CSS-only, respects colour tokens). */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-sage border-t-moss ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

interface FullPageSpinnerProps {
  label?: string;
}

/** Centred full-screen loading state. */
export function FullPageSpinner({ label = "Loading…" }: FullPageSpinnerProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="flex items-center gap-3 text-muted">
        <Spinner />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}
