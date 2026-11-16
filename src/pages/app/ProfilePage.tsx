import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { requireSupabase } from "../../lib/supabase";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { fieldLabel, inputClass } from "../../components/ui/form";

function parseOptionalInt(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isInteger(n) ? n : NaN;
}

function parseOptionalCgpa(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/**
 * Student profile: editable fields (name, branch, batch year, CGPA).
 * role/approved are server-controlled and never editable here.
 */
export function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [branch, setBranch] = useState(profile?.branch ?? "");
  const [batchYear, setBatchYear] = useState(profile?.batch_year?.toString() ?? "");
  const [cgpa, setCgpa] = useState(profile?.cgpa?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    const year = parseOptionalInt(batchYear);
    if (Number.isNaN(year) || (year !== null && (year < 2000 || year > 2100))) {
      setError("Batch year must be a whole number between 2000 and 2100.");
      return;
    }
    const cgpaValue = parseOptionalCgpa(cgpa);
    if (Number.isNaN(cgpaValue) || (cgpaValue !== null && (cgpaValue < 0 || cgpaValue > 10))) {
      setError("CGPA must be a number between 0 and 10.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await requireSupabase()
      .from("profiles")
      .update({
        name: name.trim(),
        branch: branch.trim() || null,
        batch_year: year,
        cgpa: cgpaValue,
      })
      .eq("id", profile!.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-serif text-4xl leading-none">Profile</h1>
        <p className="mt-2 text-sm text-muted">Your details personalize readiness, streaks and deadlines.</p>
      </header>

      <Card>
        <form onSubmit={(e) => void handleSave(e)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className={fieldLabel}>Full name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabel}>Branch</span>
            <input
              className={inputClass}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Computer Science"
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabel}>Batch year</span>
            <input
              className={inputClass}
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              inputMode="numeric"
              placeholder="2027"
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabel}>CGPA</span>
            <input
              className={inputClass}
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              inputMode="decimal"
              placeholder="8.4"
            />
          </label>

          <div className="grid content-end gap-1.5">
            <span className={fieldLabel}>Email</span>
            <p className="truncate rounded-2xl bg-cream px-4 py-3 text-base text-muted">
              {profile?.email}
            </p>
          </div>

          {error ? (
            <p role="alert" className="sm:col-span-2 rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-ink">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p role="status" className="sm:col-span-2 rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-ink">
              Profile saved.
            </p>
          ) : null}

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="secondary" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <ButtonLink to="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
