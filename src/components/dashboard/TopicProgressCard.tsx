import { Link } from "react-router-dom";
import { TRACKS, topicsFor } from "../../lib/tracks";
import type { TopicProgress } from "../../types";

/** "Topic progress" card from the design: one coverage bar per track. */
export function TopicProgressCard({ progress }: { progress: TopicProgress[] }) {
  const rows = TRACKS.map((t) => {
    const total = topicsFor(t.id).length;
    const done = progress.filter((p) => p.track === t.id).length;
    return { track: t.id, label: t.label, done, total, pct: total ? (done / total) * 100 : 0 };
  });

  return (
    <section aria-labelledby="topics-title" className="rounded-2xl border border-divider bg-[#fffdf8] p-4">
      <h2 id="topics-title" className="mb-3 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        Topic progress
        <small className="text-xs font-normal text-muted">topics covered per track</small>
      </h2>
      <div>
        {rows.map((r) => (
          <div
            key={r.track}
            className="mb-1.5 grid grid-cols-[110px_1fr_64px_32px] items-center gap-2 text-[13px] last:mb-0"
          >
            <span className="truncate">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-[#dcebe1]">
              <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, r.pct)}%` }} />
            </div>
            <em className="text-right text-xs not-italic text-muted">
              {r.done}/{r.total}
            </em>
            <Link
              to="/app/prep"
              aria-label={`Open ${r.label} prep`}
              className="grid h-7 w-7 place-items-center rounded-lg border border-divider bg-[#fffdf8] font-bold text-moss transition-colors hover:bg-[#dcebe1]"
            >
              +
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
