import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCompanies } from "../../hooks/useCompanies";
import { useRounds } from "../../hooks/useRounds";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { fieldLabel, inputClass } from "../../components/ui/form";
import { formatCTC, formatDateTime, datetimeLocalToIso, friendlyDayLabel } from "../../lib/format";
import { STATUS_LABELS, STATUS_ORDER } from "../../lib/companyStatus";
import type { Company, RoundResult } from "../../types";

const RESULT_LABELS: Record<RoundResult, string> = {
  pending: "Pending",
  cleared: "Cleared",
  failed: "Failed",
};

function resultChipClass(result: RoundResult): string {
  if (result === "cleared") return "bg-moss text-white";
  if (result === "failed") return "bg-coral text-ink";
  return "bg-cream text-muted";
}

const ROUND_TYPE_SUGGESTIONS = ["OA", "Technical interview", "HR interview", "Group discussion", "Tech + HR"];

/** One company: status, editable details + notes, and its rounds timeline. */
export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const uid = session?.user.id ?? "";
  const { companies, loading: companiesLoading, error: companiesError, retry, move, update, remove } = useCompanies();
  const {
    rounds,
    loading: roundsLoading,
    error: roundsError,
    retry: reloadRounds,
    add: addRound,
    setResult: setRoundResult,
  } = useRounds(id);

  const company = companies.find((c) => c.id === id) ?? null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);
  const [newRound, setNewRound] = useState({ type: "", scheduled_at: "", notes: "" });
  const [roundPending, setRoundPending] = useState(false);
  const [roundError, setRoundError] = useState<string | null>(null);

  interface Draft {
    role_title: string;
    location: string;
    ctc: string;
    deadline: string;
    notes: string;
  }

  function startEdit(c: Company) {
    setDraft({
      role_title: c.role_title,
      location: c.location ?? "",
      ctc: c.ctc?.toString() ?? "",
      deadline: c.deadline ?? "",
      notes: c.notes ?? "",
    });
    setEditing(true);
    setSaved(false);
  }

  async function handleSave() {
    if (!company || !draft) return;
    const ctc = draft.ctc.trim() ? Number(draft.ctc) : null;
    if (ctc !== null && (Number.isNaN(ctc) || ctc < 0)) return;

    update(company.id, {
      role_title: draft.role_title.trim(),
      location: draft.location.trim() || null,
      ctc,
      deadline: draft.deadline || null,
      notes: draft.notes.trim() || null,
    });
    setEditing(false);
    setSaved(true);
  }

  async function handleAddRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) return;
    if (!newRound.type.trim()) {
      setRoundError("Round name is required (e.g. OA, Technical, HR).");
      return;
    }
    setRoundPending(true);
    setRoundError(null);
    const result = await addRound(
      {
        type: newRound.type.trim(),
        scheduled_at: datetimeLocalToIso(newRound.scheduled_at),
        notes: newRound.notes.trim() || null,
      },
      uid,
    );
    setRoundPending(false);
    if (!result.ok) {
      setRoundError(result.error);
      return;
    }
    setNewRound({ type: "", scheduled_at: "", notes: "" });
  }

  if (companiesLoading) {
    return <div className="grid place-items-center py-24 text-sm font-semibold text-muted">Loading company…</div>;
  }

  if (companiesError) {
    return (
      <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 text-center">
        <h1 className="text-xl font-bold">Could not load this company</h1>
        <p role="alert" className="mt-2 text-sm text-muted">{companiesError}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => void retry()}>Try again</Button>
          <Button variant="primary" onClick={() => void navigate("/app/companies")}>Back to pipeline</Button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 text-center">
        <h1 className="text-xl font-bold">Company not found</h1>
        <p className="mt-2 text-sm text-muted">It may have been deleted.</p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => void navigate("/app/companies")}>
            Back to pipeline
          </Button>
        </div>
      </div>
    );
  }

  const meta = [company.location, formatCTC(company.ctc)].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4">
        <Link to="/app/companies" className="text-sm font-semibold text-moss underline">
          ← Companies
        </Link>
      </p>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl leading-none">{company.name}</h1>
          <p className="mt-2 text-sm text-muted">{company.role_title || "Role not set"}</p>
          {meta.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.map((m) => (
                <span key={m} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-muted">
                  {m}
                </span>
              ))}
            </div>
          ) : null}
          {company.deadline ? (
            <p className="mt-3 text-sm font-semibold text-muted">
              Deadline: {friendlyDayLabel(company.deadline)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="grid gap-1">
            <span className="sr-only">Pipeline stage</span>
            <select
              className={`${inputClass} min-w-36`}
              value={company.status}
              onChange={(e) => move(company.id, e.target.value as Company["status"])}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary" onClick={() => startEdit(company)}>
            Edit details
          </Button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex min-h-12 items-center rounded-full bg-coral px-5 text-sm font-semibold text-ink transition-colors hover:bg-coral-deep"
          >
            Delete
          </button>
        </div>
      </header>

      {saved ? (
        <p role="status" className="mb-4 rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-ink">
          Changes saved.
        </p>
      ) : null}

      {editing && draft ? (
        <Card className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="grid gap-1.5">
              <span className={fieldLabel}>Role</span>
              <input className={inputClass} value={draft.role_title} onChange={(e) => setDraft({ ...draft, role_title: e.target.value })} />
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabel}>Location</span>
              <input className={inputClass} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabel}>CTC (₹ / year)</span>
              <input className={inputClass} inputMode="numeric" value={draft.ctc} onChange={(e) => setDraft({ ...draft, ctc: e.target.value })} />
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabel}>Deadline</span>
              <input className={inputClass} type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className={fieldLabel}>Notes</span>
              <textarea className={`${inputClass} min-h-24`} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" variant="success">Save changes</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {company.notes && !editing ? (
        <Card className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{company.notes}</p>
        </Card>
      ) : null}

      <section aria-labelledby="rounds-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="rounds-title" className="font-serif text-2xl">
            Rounds
          </h2>
          {roundsError ? (
            <button type="button" onClick={() => void reloadRounds()} className="text-sm font-semibold text-moss underline">
              Reload rounds
            </button>
          ) : null}
        </div>

        {roundsError ? (
          <p role="alert" className="mb-4 rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink">
            {roundsError}
          </p>
        ) : null}

        {roundsLoading ? (
          <div className="grid place-items-center rounded-[28px] bg-white p-8 text-sm font-semibold text-muted">
            Loading rounds…
          </div>
        ) : rounds.length === 0 ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-sm text-muted">
            No rounds yet. Add the OA or interview below as soon as it's scheduled.
          </div>
        ) : (
          <ol className="mb-6 grid gap-3">
            {rounds.map((round) => (
              <li key={round.id} className="rounded-[28px] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{round.type}</h3>
                    {round.scheduled_at ? (
                      <p className="text-sm text-muted">{formatDateTime(round.scheduled_at)}</p>
                    ) : (
                      <p className="text-sm text-muted">No date set</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Result for ${round.type}`}>
                    {(Object.keys(RESULT_LABELS) as RoundResult[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoundResult(round.id, r)}
                        aria-pressed={round.result === r}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          round.result === r ? resultChipClass(r) : "bg-cream text-muted hover:bg-divider"
                        }`}
                      >
                        {RESULT_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                {round.notes ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{round.notes}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        <form
          onSubmit={(e) => void handleAddRound(e)}
          className="grid gap-3 rounded-[28px] bg-sage/60 p-5 sm:grid-cols-2"
          noValidate
        >
          <h3 className="text-sm font-bold text-ink sm:col-span-2">Add a round</h3>
          {roundError ? (
            <p role="alert" className="rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink sm:col-span-2">
              {roundError}
            </p>
          ) : null}
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Round name *</span>
            <input
              className={inputClass}
              value={newRound.type}
              onChange={(e) => setNewRound({ ...newRound, type: e.target.value })}
              list="round-types"
              placeholder="OA, Technical, HR…"
              required
            />
            <datalist id="round-types">
              {ROUND_TYPE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1.5">
            <span className={fieldLabel}>When</span>
            <input
              className={inputClass}
              type="datetime-local"
              value={newRound.scheduled_at}
              onChange={(e) => setNewRound({ ...newRound, scheduled_at: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className={fieldLabel}>Notes</span>
            <textarea
              className={`${inputClass} min-h-16`}
              value={newRound.notes}
              onChange={(e) => setNewRound({ ...newRound, notes: e.target.value })}
              placeholder="Format, topics, what to prepare…"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={roundPending}>
              {roundPending ? "Adding…" : "Add round"}
            </Button>
          </div>
        </form>
      </section>

      {confirmingDelete ? (
        <ConfirmDialog
          title="Delete company"
          message={`This permanently removes ${company.name}, its rounds and notes.`}
          onConfirm={() => {
            remove(company.id);
            setConfirmingDelete(false);
            void navigate("/app/companies");
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      ) : null}
    </div>
  );
}
