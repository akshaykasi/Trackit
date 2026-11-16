import { useState, type FormEvent } from "react";
import { useMocks } from "../../hooks/useMocks";
import { MockTrendChartLazy } from "../../components/mocks/MockTrendChartLazy";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { fieldLabel, inputClass } from "../../components/ui/form";
import { trackLabel, TRACKS } from "../../lib/tracks";
import { averagePct, mockTrend } from "../../lib/stats";
import { formatDate } from "../../lib/format";
import type { PrepTrack } from "../../types";

const TREND_LABELS: Record<string, string> = {
  "not-enough": "Log 2+ mocks to see a trend",
  improving: "Trending up ↑",
  flat: "Steady →",
  declining: "Slipping ↓",
};

interface FormState {
  track: PrepTrack;
  score: string;
  max: string;
  taken_on: string;
}

const initialForm: FormState = { track: "dsa", score: "", max: "", taken_on: "" };

function pctChipClass(pct: number): string {
  if (pct >= 70) return "bg-moss text-white";
  if (pct >= 40) return "bg-sun text-ink";
  return "bg-coral text-ink";
}

/** Mock test log: add scores, see the trend, revisit history. */
export function MocksPage() {
  const { mocks, loading, error, setError, add, remove } = useMocks();
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const score = Number(form.score);
    const max = Number(form.max);
    if (!form.score.trim() || !Number.isInteger(score) || score < 0) {
      setFormError("Score must be a whole number ≥ 0.");
      return;
    }
    if (!form.max.trim() || !Number.isInteger(max) || max < 1) {
      setFormError("Max score must be a whole number ≥ 1.");
      return;
    }
    if (score > max) {
      setFormError("Score cannot exceed the max score.");
      return;
    }
    if (!form.taken_on) {
      setFormError("Pick the date you took the mock.");
      return;
    }

    setAdding(true);
    const result = await add({ track: form.track, score, max_score: max, taken_on: form.taken_on });
    setAdding(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setForm(initialForm);
  }

  // mockTrend expects oldest-first; the hook stores newest-first
  const pcts = [...mocks]
    .sort((a, b) => (a.taken_on < b.taken_on ? -1 : 1))
    .map((m) => Math.round((m.score / m.max_score) * 100));
  const avg = averagePct(pcts);
  const trend = mockTrend(pcts);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-none">Mock tests</h1>
        <p className="mt-2 text-sm text-muted">
          Log every mock — the trend line tells you more than any single score.
        </p>
      </header>

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
          Loading your mocks…
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mb-6 grid gap-3 rounded-[28px] bg-sage/60 p-5 sm:grid-cols-2"
            noValidate
          >
            {formError ? (
              <p role="alert" className="rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink sm:col-span-2">
                {formError}
              </p>
            ) : null}

            <label className="grid gap-1.5">
              <span className={fieldLabel}>Track</span>
              <select
                className={inputClass}
                value={form.track}
                onChange={(e) => setForm({ ...form, track: e.target.value as PrepTrack })}
              >
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabel}>Date</span>
              <input
                className={inputClass}
                type="date"
                value={form.taken_on}
                onChange={(e) => setForm({ ...form, taken_on: e.target.value })}
              />
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabel}>Score *</span>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                placeholder="34"
              />
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabel}>Max score *</span>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.max}
                onChange={(e) => setForm({ ...form, max: e.target.value })}
                placeholder="50"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex min-h-12 items-center rounded-full bg-moss px-7 text-base font-semibold text-white transition-colors hover:bg-moss-deep disabled:opacity-60"
              >
                {adding ? "Saving…" : "Log mock test"}
              </button>
            </div>
          </form>

          {mocks.length === 0 ? (
            <div className="grid place-items-center rounded-[28px] bg-white p-12 text-center">
              <span className="block h-11 w-11 rounded-[14px] bg-sun" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold">No mocks logged yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-normal text-muted">
                Add your first mock score above. Even rough at-home attempts count — the trend is
                what matters.
              </p>
            </div>
          ) : (
            <>
              <section aria-labelledby="trend-title" className="mb-6 rounded-[28px] bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="trend-title" className="font-serif text-2xl">
                    Score trend
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-ink">
                      Avg {avg}%
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                        trend === "improving"
                          ? "bg-moss text-white"
                          : trend === "declining"
                            ? "bg-coral text-ink"
                            : "bg-cream text-muted"
                      }`}
                    >
                      {TREND_LABELS[trend]}
                    </span>
                  </div>
                </div>
                <MockTrendChartLazy mocks={mocks} />
              </section>

              <section aria-labelledby="history-title">
                <h2 id="history-title" className="mb-3 font-serif text-2xl">
                  History
                </h2>
                <ul className="grid gap-2">
                  {mocks.map((m) => {
                    const pct = Math.round((m.score / m.max_score) * 100);
                    return (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[28px] bg-white p-4"
                      >
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctChipClass(pct)}`}
                        >
                          {pct}%
                        </span>
                        <span className="font-bold text-ink">
                          {m.score} / {m.max_score}
                        </span>
                        <span className="text-sm text-muted">{trackLabel(m.track)}</span>
                        <span className="ml-auto text-sm text-muted">{formatDate(m.taken_on)}</span>
                        <button
                          type="button"
                          onClick={() => setDeletingId(m.id)}
                          aria-label={`Delete mock from ${formatDate(m.taken_on)}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-coral hover:text-ink"
                        >
                          <span aria-hidden="true" className="text-lg leading-none">×</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </>
      )}

      {deletingId ? (
        <ConfirmDialog
          title="Delete mock"
          message="This removes the mock test from your history and trend. This cannot be undone."
          onConfirm={() => {
            if (deletingId) remove(deletingId);
            setDeletingId(null);
          }}
          onClose={() => setDeletingId(null)}
        />
      ) : null}
    </div>
  );
}
