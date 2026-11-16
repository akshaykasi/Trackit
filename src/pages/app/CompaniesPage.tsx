import { useState } from "react";
import { useCompanies } from "../../hooks/useCompanies";
import { CompanyCard } from "../../components/companies/CompanyCard";
import { AddCompanyModal } from "../../components/companies/AddCompanyModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Button } from "../../components/ui/Button";
import { adjacentStatus, STATUS_DOT, STATUS_LABELS, STATUS_ORDER } from "../../lib/companyStatus";
import type { CompanyStatus } from "../../types";

/**
 * Kanban pipeline: Wishlist → Applied → OA → Interview → Offer / Rejected.
 * Cards move via drag & drop or the ‹ › buttons (keyboard-accessible);
 * moves are optimistic and revert on failure.
 */
export function CompaniesPage() {
  const { companies, loading, error, setError, create, move, remove } = useCompanies();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<CompanyStatus | null>(null);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl leading-none">Companies</h1>
          <p className="mt-2 text-sm text-muted">Your placement pipeline, from wishlist to offer.</p>
        </div>
        <Button variant="accent" onClick={() => setAdding(true)}>
          + Add company
        </Button>
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
          Loading your pipeline…
        </div>
      ) : companies.length === 0 ? (
        <div className="grid place-items-center rounded-[28px] bg-white p-12 text-center">
          <span className="block h-11 w-11 rounded-[14px] bg-sage" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No applications yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-normal text-muted">
            Add your first company to start the pipeline — wishlist it today, move it along as
            rounds happen.
          </p>
          <Button variant="accent" className="mt-6" onClick={() => setAdding(true)}>
            + Add company
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const column = companies.filter((c) => c.status === status);
            return (
              <section
                key={status}
                aria-label={`${STATUS_LABELS[status]} column, ${column.length} companies`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOver(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  setDragOver(null);
                  if (id) move(id, status);
                }}
                className={`flex w-[280px] shrink-0 flex-col gap-3 rounded-[28px] bg-white/60 p-3 transition-colors ${
                  dragOver === status ? "bg-sage/70 ring-2 ring-moss" : ""
                }`}
              >
                <h2 className="flex items-center gap-2 px-2 pt-1 text-sm font-bold text-ink">
                  <span className={`h-3 w-3 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
                  {STATUS_LABELS[status]}
                  <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-muted">
                    {column.length}
                  </span>
                </h2>

                {column.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onMoveLeft={() => {
                      const { prev } = adjacentStatus(company.status);
                      if (prev) move(company.id, prev);
                    }}
                    onMoveRight={() => {
                      const { next } = adjacentStatus(company.status);
                      if (next) move(company.id, next);
                    }}
                    onDelete={() => setDeletingId(company.id)}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}

      {adding ? <AddCompanyModal onClose={() => setAdding(false)} onCreate={create} /> : null}

      {deletingId ? (
        <ConfirmDialog
          title="Delete company"
          message="This removes the company, its rounds and notes. This cannot be undone."
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
