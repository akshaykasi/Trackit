import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_ORDER } from "../../lib/companyStatus";
import { formatDate } from "../../lib/format";
import type { Company, CompanyStatus } from "../../types";

const FUNNEL_LABELS: Record<CompanyStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  oa: "Online test",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const PILL: Record<CompanyStatus, string> = {
  wishlist: "bg-cream text-muted",
  applied: "bg-[#dbe8f5] text-[#24476b]",
  oa: "bg-[#fbefcf] text-[#7a5a10]",
  interview: "bg-[#e5dcf4] text-[#4b2f7f]",
  offer: "bg-[#dcebe1] text-moss",
  rejected: "bg-[#fde3dc] text-[#b04327]",
};

const INPUT =
  "min-h-[44px] rounded-[10px] border border-divider bg-cream px-2.5 text-sm text-ink";

/** "Placement pipeline" card from the design: funnel, quick add, status table. */
export function PipelineCard({
  companies,
  onCreate,
  onRemove,
  error,
}: {
  companies: Company[];
  onCreate: (input: {
    name: string;
    role_title: string;
    ctc: null;
    location: null;
    status: CompanyStatus;
    deadline: string | null;
    notes: null;
  }) => Promise<{ ok: boolean }>;
  onRemove: (id: string) => void;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || busy) return;
    setBusy(true);
    const result = await onCreate({
      name: clean,
      role_title: role.trim(),
      ctc: null,
      location: null,
      status: "wishlist",
      deadline: deadline || null,
      notes: null,
    });
    setBusy(false);
    if (result.ok) {
      setName("");
      setRole("");
      setDeadline("");
    }
  };

  return (
    <section aria-labelledby="pipeline-title" className="rounded-2xl border border-divider bg-[#fffdf8] p-4">
      <h2 id="pipeline-title" className="mb-3 flex items-baseline justify-between gap-2 text-[15px] font-bold">
        Placement pipeline
        <small className="text-xs font-normal text-muted">{companies.length} tracked</small>
      </h2>

      <div className="mb-3.5 grid grid-cols-3 gap-1.5 min-[520px]:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="rounded-[10px] border border-divider bg-cream px-1 py-2 text-center">
            <b className="block text-[19px] font-bold">{companies.filter((c) => c.status === s).length}</b>
            <span className="block text-[10.5px] leading-tight text-muted">{FUNNEL_LABELS[s]}</span>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => void submit(e)} className="mb-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company"
          aria-label="Company name"
          required
          className={`${INPUT} min-w-0 flex-[1_1_110px]`}
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
          aria-label="Role"
          className={`${INPUT} min-w-0 flex-[1_1_90px]`}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          aria-label="Deadline"
          className={INPUT}
        />
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] border-collapse text-[13px]">
          <thead>
            <tr>
              {["Company", "Role", "Date", "Status", ""].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-1.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-1.5 py-2 text-[13px] text-muted">
                  No companies yet. Add one above.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-1.5 py-2 font-bold">
                    <Link to={`/app/companies/${c.id}`} className="underline-offset-2 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-1.5 py-2">{c.role_title || "—"}</td>
                  <td className="px-1.5 py-2">{c.deadline ? formatDate(c.deadline) : "—"}</td>
                  <td className="px-1.5 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[c.status]}`}>
                      {FUNNEL_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-1.5 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      aria-label={`Remove ${c.name}`}
                      className="bg-transparent px-1 text-base text-muted transition-colors hover:text-[#c2482b]"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted">
        Status moves, rounds and notes live on{" "}
        <Link to="/app/companies" className="font-semibold text-moss underline">
          the full pipeline
        </Link>
        .
      </p>
    </section>
  );
}
