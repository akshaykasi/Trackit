import { useRef, useState, type FormEvent } from "react";
import { useResumes, fileError } from "../../hooks/useResumes";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { fieldLabel, inputClass } from "../../components/ui/form";
import { formatDate } from "../../lib/format";
import type { Resume } from "../../types";

interface ResumeRowProps {
  resume: Resume;
  onView: () => void;
  onDelete: () => void;
}

function ResumeRow({ resume, onView, onDelete }: ResumeRowProps) {
  return (
    <li className="rounded-[28px] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">{resume.version_label}</h3>
          <p className="mt-0.5 text-xs text-muted">Uploaded {formatDate(resume.created_at)}</p>
          {resume.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {resume.notes}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex min-h-9 items-center rounded-full bg-cream px-4 text-xs font-semibold text-ink transition-colors hover:bg-divider"
          >
            View
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${resume.version_label}`}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-coral hover:text-ink"
          >
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/** Resume vault: versioned uploads in the private `resumes` storage bucket. */
export function ResumePage() {
  const { resumes, loading, error, setError, upload, remove, view } = useResumes();
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!file) {
      setFormError("Choose a file to upload (PDF, DOC or DOCX).");
      return;
    }
    const validation = fileError(file);
    if (validation) {
      setFormError(validation);
      return;
    }
    if (!label.trim()) {
      setFormError("Give this version a label (e.g. “Tech-heavy v2”).");
      return;
    }

    setUploading(true);
    const result = await upload(file, label, notes);
    setUploading(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setLabel("");
    setNotes("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleView(resume: Resume) {
    const result = await view(resume.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-none">Resume vault</h1>
        <p className="mt-2 text-sm text-muted">
          Keep every version — each upload is private to your account, and only you can open it.
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

        <label className="grid gap-1.5 sm:col-span-2">
          <span className={fieldLabel}>Version label *</span>
          <input
            className={inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Tech-heavy v2"
          />
        </label>

        <label className="grid gap-1.5 sm:col-span-2">
          <span className={fieldLabel}>File (PDF, DOC, DOCX · max 5 MB) *</span>
          <input
            ref={fileInputRef}
            className={`${inputClass} py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-cream`}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <span className="text-xs text-muted">
              {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
            </span>
          ) : null}
        </label>

        <label className="grid gap-1.5 sm:col-span-2">
          <span className={fieldLabel}>Notes</span>
          <textarea
            className={`${inputClass} min-h-16`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What changed in this version, who reviewed it…"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex min-h-12 items-center rounded-full bg-moss px-7 text-base font-semibold text-white transition-colors hover:bg-moss-deep disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload resume"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid place-items-center py-24 text-sm font-semibold text-muted">
          Loading your resumes…
        </div>
      ) : resumes.length === 0 ? (
        <div className="grid place-items-center rounded-[28px] bg-white p-12 text-center">
          <span className="block h-11 w-11 rounded-[14px] bg-sage" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No resumes yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-normal text-muted">
            Upload your first version above. Every placement season tweak deserves its own entry —
            you'll thank yourself during interviews.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {resumes.map((r) => (
            <ResumeRow
              key={r.id}
              resume={r}
              onView={() => void handleView(r)}
              onDelete={() => setDeletingId(r.id)}
            />
          ))}
        </ul>
      )}

      {deletingId ? (
        <ConfirmDialog
          title="Delete resume"
          message="This removes the version and its file. This cannot be undone."
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
