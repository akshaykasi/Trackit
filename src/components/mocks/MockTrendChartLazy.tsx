import { Suspense, lazy } from "react";
import type { MockTest } from "../../types";

const MockTrendChart = lazy(() =>
  import("./MockTrendChart").then((m) => ({ default: m.MockTrendChart })),
);

/**
 * Lazily loaded trend chart — keeps recharts (~350 kB) out of the main
 * bundle so first paint stays fast. Renders a quiet placeholder while the
 * chunk streams in.
 */
export function MockTrendChartLazy({
  mocks,
  height = 220,
}: {
  mocks: MockTest[];
  height?: number;
}) {
  return (
    <Suspense
      fallback={
        <div
          style={{ height }}
          className="grid place-items-center text-xs font-semibold text-muted"
        >
          Loading chart…
        </div>
      }
    >
      <MockTrendChart mocks={mocks} height={height} />
    </Suspense>
  );
}
