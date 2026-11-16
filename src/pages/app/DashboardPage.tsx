import { Link } from "react-router-dom";
import { useCompanies } from "../../hooks/useCompanies";
import { usePrep } from "../../hooks/usePrep";
import { useCalendar } from "../../hooks/useCalendar";
import { useActivity } from "../../hooks/useActivity";
import { KpiRow } from "../../components/dashboard/KpiRow";
import { ProblemLogCard } from "../../components/dashboard/ProblemLogCard";
import { TopicProgressCard } from "../../components/dashboard/TopicProgressCard";
import { ConsistencyCard } from "../../components/dashboard/ConsistencyCard";
import { PipelineCard } from "../../components/dashboard/PipelineCard";
import { RevisionQueueCard } from "../../components/dashboard/RevisionQueueCard";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { streakDays } from "../../lib/stats";
import { bestStreak, longDate } from "../../lib/dashboard";
import { friendlyDayLabel } from "../../lib/format";

/** Student home — the placement & coding dashboard, wired to live data. */
export function DashboardPage() {
  const { companies, create, remove, error: companyError } = useCompanies();
  const {
    items,
    progress,
    addItem,
    markRevised,
    error: prepError,
  } = usePrep();
  const { reminders } = useCalendar();
  const activity = useActivity();

  if (activity.loading || !activity.todayISO) {
    return <FullPageSpinner label="Loading your dashboard…" />;
  }

  const todayISO = activity.todayISO;
  const solved = items.filter((i) => i.status === "done").length;
  const solvedToday = items.filter((i) => i.status === "done" && i.solved_on === todayISO).length;
  const active = companies.filter((c) => ["applied", "oa", "interview"].includes(c.status)).length;
  const offers = companies.filter((c) => c.status === "offer").length;
  const streak = streakDays(activity.days, todayISO);
  const best = bestStreak(activity.days);

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">
            Placement <span className="text-moss">&amp;</span> coding dashboard
          </h1>
          <p className="text-[13px] text-muted">{longDate(todayISO)}</p>
        </div>
        <Link
          to="/app/mocks"
          className="min-h-[44px] rounded-[10px] border border-divider bg-[#fffdf8] px-4 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:bg-[#dcebe1]"
        >
          Log a mock test
        </Link>
      </header>

      {reminders.length > 0 ? (
        <div
          role="status"
          aria-label={`${reminders.length} items due within 3 days`}
          className="mb-4 rounded-2xl bg-[#fde3dc] px-4 py-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-[0.5px] text-[#b04327]">
            Due within 3 days
          </h2>
          <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {reminders.slice(0, 4).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-2">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#c2482b]" />
                <Link to={r.href} className="font-semibold underline">
                  {r.label}
                </Link>
                <span className="text-muted">· {friendlyDayLabel(r.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <KpiRow
        solved={solved}
        streak={streak}
        best={best}
        solvedToday={solvedToday}
        companies={companies.length}
        active={active}
        offers={offers}
      />

      <div className="grid gap-4 min-[860px]:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <ProblemLogCard items={items} onAdd={addItem} error={prepError} />
          <TopicProgressCard progress={progress} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ConsistencyCard counts={activity.counts} todayISO={todayISO} items={items} />
          <PipelineCard
            companies={companies}
            onCreate={create}
            onRemove={remove}
            error={companyError}
          />
          <RevisionQueueCard items={items} onRevise={markRevised} error={prepError} />
        </div>
      </div>
    </div>
  );
}
