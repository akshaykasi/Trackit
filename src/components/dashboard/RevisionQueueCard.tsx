import { formatDate } from "../../lib/format";
import { trackLabel } from "../../lib/tracks";
import type { PrepItem } from "../../types";

/**
 * Checklist card from the design, powered by the real revision ladder:
 * every row is a problem with a revision due date — checking it advances
 * the +3/+7/+14 ladder.
 */
export function RevisionQueueCard({
  items,
  onRevise,
  error,
}: {
  items: PrepItem[];
  onRevise: (id: string) => { ok: boolean };
  error: string | null;
}) {
  const due = items
    .filter((i) => i.revise_due)
    .sort((a, b) => (a.revise_due ?? "") < (b.revise_due ?? "") ? -1 : 1)
    .slice(0, 8);
  const nextDue = due[0]?.revise_due ?? null;

  return (
    <section aria-labelledby="queue-title" className="rounded-2xl border border-divider bg-[#fffdf8] p-4">
      <h2 id="queue-title" className="mb-2 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        Revision queue
        <small className="text-xs font-normal text-muted">
          {due.length > 0
            ? `${items.filter((i) => i.revise_due).length} due${nextDue ? ` · next ${formatDate(nextDue)}` : ""}`
            : "all clear"}
        </small>
      </h2>

      {error ? (
        <p role="alert" className="mb-2 text-[13px] font-semibold text-[#c2482b]">
          {error}
        </p>
      ) : null}

      {due.length === 0 ? (
        <p className="py-2 text-[13px] text-muted">
          Nothing due. Solve a problem and the revision ladder starts the next day.
        </p>
      ) : (
        <div>
          {due.map((i) => (
            <label
              key={i.id}
              className="flex items-center gap-2.5 border-t border-divider py-1.5 text-sm first:border-t-0"
            >
              <input
                type="checkbox"
                onChange={() => onRevise(i.id)}
                className="h-[17px] w-[17px] flex-none accent-moss"
              />
              <span className="min-w-0">
                <span className="block truncate">{i.title}</span>
                <small className="block text-xs text-muted">
                  {trackLabel(i.track)} · {i.topic} · due {formatDate(i.revise_due)}
                </small>
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
