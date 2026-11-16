import { Link } from "react-router-dom";
import { useCompanies } from "../../hooks/useCompanies";
import { formatCTC, formatDate, friendlyDayLabel } from "../../lib/format";
import { sortOffers } from "../../lib/offers";

/** Offers = pipeline companies sitting at the offer stage. */
export function OffersPage() {
  const { companies, loading, error, retry } = useCompanies();
  const offers = sortOffers(companies.filter((c) => c.status === "offer"));
  const withCtc = offers.filter((o) => o.ctc !== null);
  const best = withCtc[0];
  const average = withCtc.length
    ? formatCTC(Math.round(withCtc.reduce((n, o) => n + (o.ctc ?? 0), 0) / withCtc.length))
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-none">Offers</h1>
        <p className="mt-2 text-sm text-muted">
          Companies that reached the offer stage in your pipeline, side by side.
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
            onClick={() => void retry()}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid place-items-center py-24 text-sm font-semibold text-muted">
          Loading your offers…
        </div>
      ) : offers.length === 0 ? (
        <div className="grid place-items-center rounded-[28px] bg-white p-12 text-center">
          <span className="block h-11 w-11 rounded-[14px] bg-moss" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No offers yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-normal text-muted">
            When a company reaches the Offer stage in your pipeline, it shows up here for
            side-by-side comparison.
          </p>
          <Link
            to="/app/companies"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-sage px-6 text-sm font-semibold text-ink transition-colors hover:bg-sage-deep"
          >
            Open the pipeline
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white">
              {offers.length} offer{offers.length > 1 ? "s" : ""}
            </span>
            {best ? (
              <span className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink">
                Best: {best.name} · {formatCTC(best.ctc)}
              </span>
            ) : null}
            {average ? (
              <span className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink">
                Average: {average}
              </span>
            ) : null}
          </div>

          <ul className="grid gap-3">
            {offers.map((o, i) => (
              <li
                key={o.id}
                className={`rounded-[28px] bg-white p-5 ${i === 0 && o.ctc ? "ring-2 ring-moss" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">
                      <Link to={`/app/companies/${o.id}`} className="hover:underline">
                        {o.name}
                      </Link>
                      {i === 0 && o.ctc ? (
                        <span className="ml-2 rounded-full bg-moss px-2.5 py-0.5 text-xs font-semibold text-white">
                          Highest
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-sm text-muted">{o.role_title || "Role not set"}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${
                      o.ctc ? "bg-sun text-ink" : "bg-cream text-muted"
                    }`}
                  >
                    {o.ctc ? formatCTC(o.ctc) : "CTC not set"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  {o.location ? <span>📍 {o.location}</span> : null}
                  {o.applied_on ? <span>Applied {formatDate(o.applied_on)}</span> : null}
                  {o.deadline ? <span>Deadline was {friendlyDayLabel(o.deadline)}</span> : null}
                </div>
                {o.notes ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {o.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-xs text-muted">
            Decided? Move the company out of the Offer stage in the{" "}
            <Link to="/app/companies" className="font-semibold text-moss underline">
              pipeline
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
