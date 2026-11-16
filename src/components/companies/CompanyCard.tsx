import { useNavigate } from "react-router-dom";
import { formatCTC, formatDate, daysUntil } from "../../lib/format";
import { adjacentStatus, STATUS_LABELS } from "../../lib/companyStatus";
import type { Company } from "../../types";

interface CompanyCardProps {
  company: Company;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
}

/** Pipeline card: draggable, with keyboard-accessible move buttons. */
export function CompanyCard({ company, onMoveLeft, onMoveRight, onDelete }: CompanyCardProps) {
  const navigate = useNavigate();
  const { prev, next } = adjacentStatus(company.status);
  const dueIn = company.deadline ? daysUntil(company.deadline) : null;
  const dueSoon = dueIn !== null && dueIn >= 0 && dueIn <= 7;
  const overdue = dueIn !== null && dueIn < 0;

  const meta: string[] = [];
  if (company.location) meta.push(company.location);
  const ctc = formatCTC(company.ctc);
  if (ctc) meta.push(ctc);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", company.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-3xl bg-white p-4 shadow-[0_1px_3px_rgba(27,42,31,0.12)] transition-shadow hover:shadow-[0_6px_16px_rgba(27,42,31,0.16)]"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => void navigate(`/app/companies/${company.id}`)}
          className="min-w-0 flex-1 text-left"
          aria-label={`Open ${company.name}`}
        >
          <h3 className="truncate font-bold text-ink">{company.name}</h3>
          {company.role_title ? (
            <p className="truncate text-sm text-muted">{company.role_title}</p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${company.name}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-coral hover:text-ink"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>

      {meta.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {meta.map((m) => (
            <span
              key={m}
              className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-muted"
            >
              {m}
            </span>
          ))}
        </div>
      ) : null}

      {company.deadline ? (
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
              dueSoon || overdue ? "bg-coral text-ink" : "bg-cream text-muted"
            }`}
          >
            {overdue
              ? `Deadline passed · ${formatDate(company.deadline)}`
              : dueSoon
                ? `Due in ${dueIn}d · ${formatDate(company.deadline)}`
                : `Deadline · ${formatDate(company.deadline)}`}
          </span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!prev}
          aria-label={prev ? `Move ${company.name} to ${STATUS_LABELS[prev]}` : "Cannot move left"}
          className="grid h-8 w-8 place-items-center rounded-full bg-sage text-sm font-bold text-ink transition-colors hover:bg-sage-deep disabled:opacity-30 disabled:hover:bg-sage"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!next}
          aria-label={next ? `Move ${company.name} to ${STATUS_LABELS[next]}` : "Cannot move right"}
          className="grid h-8 w-8 place-items-center rounded-full bg-sage text-sm font-bold text-ink transition-colors hover:bg-sage-deep disabled:opacity-30 disabled:hover:bg-sage"
        >
          ›
        </button>
      </div>
    </div>
  );
}
