import { difficultyCounts, heatCellDates, heatLevels, weekBars, HEAT_WEEKS } from "../../lib/dashboard";
import type { PrepItem } from "../../types";

const LEVEL_BG = ["bg-[#dcebe1]", "bg-[#a9d1b9]", "bg-[#6fb08a]", "bg-moss", "bg-[#1d4a34]"];

const SPLIT = [
  { key: "easy", label: "Easy", bar: "bg-moss" },
  { key: "medium", label: "Medium", bar: "bg-[#e9b44c]" },
  { key: "hard", label: "Hard", bar: "bg-coral" },
] as const;

/** "Consistency" card from the design: 15-week heatmap, week bars, difficulty split. */
export function ConsistencyCard({
  counts,
  todayISO,
  items,
}: {
  counts: Record<string, number>;
  todayISO: string;
  items: PrepItem[];
}) {
  const levels = heatLevels(counts, todayISO, HEAT_WEEKS);
  const dates = heatCellDates(todayISO, HEAT_WEEKS);
  const activeDays = levels.filter((l) => l > 0).length;
  const bars = weekBars(counts, todayISO);
  const weekTotal = bars.reduce((n, b) => n + b.count, 0);
  const max = Math.max(3, ...bars.map((b) => b.count));
  const diff = difficultyCounts(items);
  const diffTotal = Math.max(1, diff.easy + diff.medium + diff.hard);

  return (
    <section aria-labelledby="consistency-title" className="rounded-2xl border border-divider bg-[#fffdf8] p-4">
      <h2 id="consistency-title" className="mb-3 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        Consistency
        <small className="text-xs font-normal text-muted">last 15 weeks</small>
      </h2>

      <div
        role="img"
        aria-label={`Activity heatmap for the last 15 weeks: ${activeDays} of ${HEAT_WEEKS * 7} days active.`}
        className="grid grid-flow-col grid-rows-[repeat(7,14px)] gap-[3px] overflow-x-auto pb-1"
      >
        {levels.map((level, i) => (
          <span
            key={i}
            aria-hidden="true"
            title={`${dates[i]} · ${counts[dates[i]] ?? 0} action${(counts[dates[i]] ?? 0) === 1 ? "" : "s"}`}
            className={`h-3.5 w-3.5 rounded ${LEVEL_BG[level]}`}
          />
        ))}
      </div>

      <h3 className="mb-1 mt-4 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        This week
        <small className="text-xs font-normal text-muted">{weekTotal} actions in 7 days</small>
      </h3>
      <div className="mt-1 flex h-[110px] items-end gap-2" aria-hidden="true">
        {bars.map((b) => (
          <div key={b.iso} className="flex flex-1 flex-col items-center justify-end self-stretch text-[11px] text-muted">
            {b.count > 0 ? <span>{b.count}</span> : null}
            <i
              className="block w-full max-w-[34px] rounded-t-md bg-coral"
              style={{ height: `${(b.count / max) * 80}%`, minHeight: b.count > 0 ? 3 : 0 }}
            />
            <span className="mt-1">{b.label}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-1 mt-4 text-[15px] font-bold">Difficulty split</h3>
      <div className="my-1.5 flex h-3 overflow-hidden rounded-full bg-[#dcebe1]" aria-hidden="true">
        {SPLIT.map((s) =>
          diff[s.key] > 0 ? (
            <i
              key={s.key}
              className={s.bar}
              style={{ width: `${(diff[s.key] / diffTotal) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-3.5 text-xs text-muted">
        {SPLIT.map((s) => (
          <span key={s.key}>
            <b aria-hidden="true" className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-sm ${s.bar}`} />
            {s.label} {diff[s.key]}
          </span>
        ))}
      </div>
    </section>
  );
}
