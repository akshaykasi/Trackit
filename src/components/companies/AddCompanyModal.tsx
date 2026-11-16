import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { fieldLabel, inputClass } from "../../components/ui/form";
import { STATUS_LABELS, STATUS_ORDER } from "../../lib/companyStatus";
import type { CompanyStatus } from "../../types";
import type { NewCompanyInput } from "../../hooks/useCompanies";

interface AddCompanyModalProps {
  onClose: () => void;
  onCreate: (input: NewCompanyInput) => Promise<{ ok: true } | { ok: false; error: string }>;
}

interface FormState {
  name: string;
  role_title: string;
  location: string;
  ctc: string;
  status: CompanyStatus;
  deadline: string;
  notes: string;
}

const initialForm: FormState = {
  name: "",
  role_title: "",
  location: "",
  ctc: "",
  status: "wishlist",
  deadline: "",
  notes: "",
};

export function AddCompanyModal({ onClose, onCreate }: AddCompanyModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    const ctc = form.ctc.trim() ? Number(form.ctc) : null;
    if (ctc !== null && (Number.isNaN(ctc) || ctc < 0)) {
      setError("CTC must be a positive number (in ₹ per year).");
      return;
    }

    setPending(true);
    const result = await onCreate({
      name: form.name.trim(),
      role_title: form.role_title.trim(),
      location: form.location.trim() || null,
      ctc,
      status: form.status,
      deadline: form.deadline || null,
      notes: form.notes.trim() || null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <Modal title="Add company" onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3" noValidate>
        {error ? (
          <p role="alert" className="rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink">
            {error}
          </p>
        ) : null}

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Company name *</span>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Infosys"
            autoFocus
            required
          />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Role</span>
          <input
            className={inputClass}
            value={form.role_title}
            onChange={(e) => set("role_title", e.target.value)}
            placeholder="Systems Engineer"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Location</span>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Bengaluru"
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabel}>CTC (₹ / year)</span>
            <input
              className={inputClass}
              value={form.ctc}
              onChange={(e) => set("ctc", e.target.value)}
              inputMode="numeric"
              placeholder="450000"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Stage</span>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as CompanyStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabel}>Deadline</span>
            <input
              className={inputClass}
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Notes</span>
          <textarea
            className={`${inputClass} min-h-20`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Referral contact, OA date, preparation notes…"
          />
        </label>

        <Button type="submit" variant="success" className="mt-2 w-full" disabled={pending}>
          {pending ? "Adding…" : "Add company"}
        </Button>
      </form>
    </Modal>
  );
}
