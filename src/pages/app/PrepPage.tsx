import { useState, type FormEvent } from "react";
import { usePrep } from "../../hooks/usePrep";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { fieldLabel, inputClass } from "../../components/ui/form";
import { trackLabel, TRACKS, topicsFor } from "../../lib/tracks";
import { reviseUrgency, REVISE_INTERVALS_DAYS, sortPrepItems } from "../../lib/spacedRep";
import { formatDate } from "../../lib/format";
import type { Difficulty, PrepItem, PrepItemStatus, PrepTrack } from "../../types";

const DIFFICULTY_CHIP: Record<Difficulty, string> = {
  easy: "bg-sage text-ink",
  medium: "bg-sun text-ink",
  hard: "bg-coral text-ink",
};

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function reviseChipClass(due: string): string {
  const urgency = reviseUrgency(due, todayISO());
  if (urgency === "overdue" || urgency === "today") return "bg-coral text-ink";
  if (urgency === "soon") return "bg-sun text-ink";
  return "bg-cream text-muted";
}

function reviseChipLabel(item: PrepItem): string {
  if (!item.revise_due) return "";
  const urgency = reviseUrgency(item.revise_due, todayISO());
  const date = formatDate(item.revise_due);
  if (urgency === "overdue") return `Revision overdue · ${date}`;
  if (urgency === "today") return "Revise today";
  return `Revise on ${date}`;
}

interface ProblemRowProps {
  item: PrepItem;
  onStatus: (status: PrepItemStatus) => void;
  onRevised: () => void;
  onDelete: () => void;
}

function ProblemRow({ item, onStatus, onRevised, onDelete }: ProblemRowProps) {
  const solved = item.status === "done";
  return (
    <li className="rounded-3xl bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">{item.title}</h3>
          <p className="mt-0.5 text-sm text-muted">{item.topic}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.title}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-coral hover:text-ink"
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_CHIP[item.difficulty]}`}>
          {item.difficulty}
        </span>
        {item.revise_due ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviseChipClass(item.revise_due)}`}>
            {reviseChipLabel(item)}
          </span>
        ) : null}
        {solved && !item.revise_due ? (
          <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-semibold text-white">
            Exam-ready · {item.n_revisions} revisions
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onStatus(solved ? "todo" : "done")}
          aria-pressed={solved}
          className={`inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold transition-colors ${
            solved ? "bg-moss text-white hover:bg-moss-deep" : "bg-cream text-ink hover:bg-divider"
          }`}
        >
          {solved ? "✓ Solved" : "Mark solved"}
        </button>
        {item.revise_due ? (
          <button
            type="button"
            onClick={onRevised}
            className="inline-flex min-h-9 items-center rounded-full bg-moss px-4 text-xs font-semibold text-white transition-colors hover:bg-moss-deep"
          >
            Revised
          </button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Prep tracks: topic checklists + a problem log with spaced revision
 * (1/3/7/14 days) driven by the "Revised" action.
 */
export function PrepPage() {
  const {
    items,
    progress,
    loading,
    error,
    setError,
    addItem,
    setStatus,
    markRevised,
    removeItem,
    toggleTopic,
  } = usePrep();

  const [track, setTrack] = useState<PrepTrack>("dsa");
  const [form, setForm] = useState({ topic: "", title: "", difficulty: "medium" as Difficulty });
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const topics = topicsFor(track);
  const trackItems = items.filter((i) => i.track === track);
  const doneTopics = progress.filter((p) => p.track === track).length;
  const pct = topics.length ? Math.round((doneTopics / topics.length) * 100) : 0;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("Give the problem a short title (e.g. “Two Sum”).");
      return;
    }
    setAdding(true);
    const result = await addItem({
      track,
      topic: form.topic || topics[0],
      title: form.title.trim(),
      difficulty: form.difficulty,
    });
    setAdding(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setForm({ topic: "", title: "", difficulty: "medium" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-none">Prep tracks</h1>
        <p className="mt-2 text-sm text-muted">
          Tick topics as you cover them; log problems and revise them on the 1/3/7/14 day ladder.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Prep track">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={track === t.id}
            onClick={() => setTrack(t.id)}
            className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
              track === t.id ? "bg-ink text-cream" : "bg-white text-ink hover:bg-divider"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-coral px-6 py-4"
        >
          <p className="text-sm font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid place-items-center py-24 text-sm font-semibold text-muted">
          Loading your prep…
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl">{trackLabel(track)}</h2>
                <p className="mt-1 text-sm text-muted">
                  {TRACKS.find((t) => t.id === track)?.blurb}
                </p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-bold text-ink">
                {pct}%
              </span>
            </div>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-cream"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${trackLabel(track)} topics completed`}
            >
              <div
                className="h-full rounded-full bg-moss transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ul className="mt-4 grid gap-1">
              {topics.map((topic, index) => {
                const done = progress.some((p) => p.track === track && p.topic_index === index);
                return (
                  <li key={topic}>
                    <button
                      type="button"
                      onClick={() => toggleTopic(track, index)}
                      aria-pressed={done}
                      className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-2 text-left transition-colors hover:bg-cream"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 text-xs font-bold ${
                          done ? "border-moss bg-moss text-white" : "border-divider bg-white"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className={`text-sm ${done ? "font-semibold text-ink" : "text-muted"}`}>
                        {topic}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <section aria-labelledby="log-title">
            <h2 id="log-title" className="mb-3 font-serif text-2xl">
              Problem log
            </h2>

            <form
              onSubmit={(e) => void handleAdd(e)}
              className="mb-4 grid gap-3 rounded-[28px] bg-sage/60 p-5 sm:grid-cols-[1fr_1fr_auto]"
              noValidate
            >
              {formError ? (
                <p role="alert" className="rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink sm:col-span-3">
                  {formError}
                </p>
              ) : null}
              <label className="grid gap-1.5">
                <span className={fieldLabel}>Topic</span>
                <select
                  className={inputClass}
                  value={form.topic || topics[0]}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                >
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className={fieldLabel}>Problem *</span>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Two Sum"
                  required
                />
              </label>
              <div className="grid content-end">
                <Button type="submit" variant="primary" disabled={adding}>
                  {adding ? "Logging…" : "Log problem"}
                </Button>
              </div>
              <fieldset className="grid gap-1.5 sm:col-span-3">
                <legend className={fieldLabel}>Difficulty</legend>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, difficulty: d })}
                      aria-pressed={form.difficulty === d}
                      className={`min-h-9 rounded-full px-4 text-xs font-semibold capitalize transition-colors ${
                        form.difficulty === d ? "bg-ink text-cream" : "bg-white text-ink hover:bg-divider"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </fieldset>
            </form>

            {trackItems.length === 0 ? (
              <div className="grid place-items-center rounded-[28px] bg-white p-10 text-center">
                <span className="block h-11 w-11 rounded-[14px] bg-sage" aria-hidden="true" />
                <p className="mt-3 max-w-xs text-sm leading-normal text-muted">
                  No problems logged for {trackLabel(track)} yet. Log one after your next practice
                  session — Trackit will schedule the revisions.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {sortPrepItems(trackItems, todayISO()).map((item) => (
                  <ProblemRow
                    key={item.id}
                    item={item}
                    onStatus={(status) => setStatus(item.id, status)}
                    onRevised={() => markRevised(item.id)}
                    onDelete={() => setDeletingId(item.id)}
                  />
                ))}
              </ul>
            )}

            <p className="mt-4 text-center text-xs text-muted">
              Revision ladder: {REVISE_INTERVALS_DAYS.join(" → ")} days after solving, then the
              problem is exam-ready.
            </p>
          </section>
        </>
      )}

      {deletingId ? (
        <ConfirmDialog
          title="Delete problem"
          message="This removes the problem and its revision schedule. This cannot be undone."
          onConfirm={() => {
            if (deletingId) removeItem(deletingId);
            setDeletingId(null);
          }}
          onClose={() => setDeletingId(null)}
        />
      ) : null}
    </div>
  );
}
