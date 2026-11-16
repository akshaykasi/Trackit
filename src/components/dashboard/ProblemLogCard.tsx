import { useState } from "react";
import { TRACKS, topicsFor, trackLabel } from "../../lib/tracks";
import type { Difficulty, PrepItem, PrepTrack } from "../../types";

const DIFF_TEXT: Record<Difficulty, string> = {
  easy: "text-moss",
  medium: "text-[#8a6410]",
  hard: "text-[#c2482b]",
};

const INPUT =
  "min-h-[44px] rounded-[10px] border border-divider bg-cream px-2.5 text-sm text-ink";

interface Option {
  value: string;
  label: string;
}

/** "Log a problem" card from the design: quick-add form + recent log. */
export function ProblemLogCard({
  items,
  onAdd,
  error,
}: {
  items: PrepItem[];
  onAdd: (input: { track: PrepTrack; topic: string; title: string; difficulty: Difficulty }) => Promise<{ ok: boolean }>;
  error: string | null;
}) {
  const [title, setTitle] = useState("");
  const [topicValue, setTopicValue] = useState(`dsa#0`);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [busy, setBusy] = useState(false);

  const groups: { track: PrepTrack; options: Option[] }[] = TRACKS.map((t) => ({
    track: t.id,
    options: topicsFor(t.id).map((topic, i) => ({ value: `${t.id}#${i}`, label: topic })),
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean || busy) return;
    const sep = topicValue.indexOf("#");
    const track = topicValue.slice(0, sep) as PrepTrack;
    const topic = topicsFor(track)[Number(topicValue.slice(sep + 1))] ?? "";
    setBusy(true);
    const result = await onAdd({ track, topic, title: clean, difficulty });
    setBusy(false);
    if (result.ok) setTitle("");
  };

  return (
    <section aria-labelledby="log-title" className="rounded-2xl border border-divider bg-[#fffdf8] p-4">
      <h2 id="log-title" className="mb-3 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        Log a problem
        <small className="text-xs font-normal text-muted">keeps your streak alive</small>
      </h2>

      <form onSubmit={(e) => void submit(e)} className="mb-3 flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Problem name (e.g. Two Sum)"
          aria-label="Problem name"
          className={`${INPUT} min-w-0 flex-[1_1_100%] sm:flex-[2_1_180px]`}
        />
        <select
          value={topicValue}
          onChange={(e) => setTopicValue(e.target.value)}
          aria-label="Topic"
          className={INPUT}
        >
          {groups.map((g) => (
            <optgroup key={g.track} label={trackLabel(g.track)}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          aria-label="Difficulty"
          className={INPUT}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-[10px] bg-moss px-4 text-[15px] font-semibold text-white transition-colors hover:bg-moss-deep disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {error ? (
        <p role="alert" className="mb-2 text-[13px] font-semibold text-[#c2482b]">
          {error}
        </p>
      ) : null}

      <div className="log max-h-[190px] overflow-auto text-[13px]">
        {items.length === 0 ? (
          <p className="py-2 text-[13px] text-muted">Nothing logged yet. Add your first problem above.</p>
        ) : (
          items.slice(0, 40).map((i) => (
            <div
              key={i.id}
              className="flex items-baseline justify-between gap-2 border-t border-divider py-1.5 first:border-t-0"
            >
              <span className="min-w-0 truncate">
                {i.title}{" "}
                <small className="text-muted">
                  · {trackLabel(i.track)} · {i.topic}
                </small>
              </span>
              <span className="flex-none">
                <b className={`font-bold ${DIFF_TEXT[i.difficulty]}`}>{i.difficulty === "medium" ? "Medium" : i.difficulty === "easy" ? "Easy" : "Hard"}</b>{" "}
                <small className="text-muted">{(i.solved_on ?? i.created_at.slice(0, 10)).slice(5)}</small>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
