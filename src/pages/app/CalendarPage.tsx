import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCalendar } from "../../hooks/useCalendar";
import { groupByDay, type CalendarEvent, type CalendarEventKind } from "../../lib/calendar";
import { ButtonLink } from "../../components/ui/Button";
import { dayDiff, dayKey, formatDate, formatDateTime, friendlyDayLabel } from "../../lib/format";

const KIND_LABELS: Record<CalendarEventKind, string> = {
  round: "Round",
  deadline: "Deadline",
  revision: "Revision",
};

function kindChipClass(kind: CalendarEventKind): string {
  if (kind === "deadline") return "bg-coral text-ink";
  if (kind === "revision") return "bg-sun text-ink";
  return "bg-sage text-ink";
}

function EventRow({ event, dayIsPast }: { event: CalendarEvent; dayIsPast: boolean }) {
  return (
    <li>
      <Link
        to={event.href}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[28px] bg-white p-4 transition-colors hover:bg-cream"
      >
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kindChipClass(event.kind)}`}
        >
          {KIND_LABELS[event.kind]}
        </span>
        <span className="font-bold text-ink">{event.label}</span>
        {event.detail ? <span className="truncate text-sm text-muted">{event.detail}</span> : null}
        <span className="ml-auto text-sm text-muted">
          {dayIsPast ? formatDate(event.date) : formatDateTime(event.date)}
        </span>
      </Link>
    </li>
  );
}

/**
 * Unified calendar: company deadlines, scheduled rounds and spaced-repetition
 * revision dues. Upcoming events first (grouped by day), then anything missed.
 */
export function CalendarPage() {
  const { events, todayKey, reminders, loading, error, retry } = useCalendar();

  const { upcoming, past } = useMemo(() => {
    const isPast = (e: CalendarEvent) => dayKey(e.date) < todayKey;
    return {
      upcoming: groupByDay(events.filter((e) => !isPast(e))),
      past: groupByDay(events.filter(isPast)).reverse(),
    };
  }, [events, todayKey]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-none">Calendar</h1>
        <p className="mt-2 text-sm text-muted">
          Deadlines, scheduled rounds and revision dues in one place.
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

      {reminders.length > 0 ? (
        <div
          role="status"
          className="mb-6 rounded-3xl bg-coral px-6 py-4"
          aria-label={`${reminders.length} events due within 3 days`}
        >
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            Due within 3 days
          </h2>
          <ul className="mt-2 space-y-1.5">
            {reminders.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-2 text-sm text-ink">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ink" />
                <span className="font-semibold">{r.label}</span>
                {r.detail ? <span className="text-muted">{r.detail}</span> : null}
                <span className="font-semibold">
                  · {friendlyDayLabel(r.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <div className="grid place-items-center py-24 text-sm font-semibold text-muted">
          Loading your calendar…
        </div>
      ) : events.length === 0 ? (
        <div className="grid place-items-center rounded-[28px] bg-white p-12 text-center">
          <span className="block h-11 w-11 rounded-[14px] bg-sun" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">Nothing scheduled yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-normal text-muted">
            Add a company with a deadline or a scheduled round, and it will show up here alongside
            your revision dues.
          </p>
          <ButtonLink to="/app/companies" variant="accent" className="mt-6">
            Go to pipeline
          </ButtonLink>
        </div>
      ) : (
        <>
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="mb-3 font-serif text-2xl">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-[28px] bg-white p-6 text-sm text-muted">
                No upcoming events in the next 60 days.
              </p>
            ) : (
              <div className="grid gap-4">
                {upcoming.map((group) => {
                  const d = dayDiff(todayKey, group.key);
                  return (
                    <div key={group.key}>
                      <h3 className="mb-2 flex items-baseline gap-2 px-1 text-sm font-bold text-ink">
                        {friendlyDayLabel(group.events[0].date)}
                        {d <= 3 ? (
                          <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-semibold text-ink">
                            {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`}
                          </span>
                        ) : null}
                      </h3>
                      <ul className="grid gap-2">
                        {group.events.map((event) => (
                          <EventRow key={event.id} event={event} dayIsPast={false} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {past.length > 0 ? (
            <section aria-labelledby="past-title" className="mt-10">
              <h2 id="past-title" className="mb-3 font-serif text-2xl">
                Earlier
              </h2>
              <div className="grid gap-4">
                {past.map((group) => (
                  <div key={group.key}>
                    <h3 className="mb-2 px-1 text-sm font-bold text-muted">
                      {formatDate(group.events[0].date)}
                    </h3>
                    <ul className="grid gap-2 opacity-80">
                      {group.events.map((event) => (
                        <EventRow key={event.id} event={event} dayIsPast />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
