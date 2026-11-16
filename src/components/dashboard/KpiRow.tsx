import { DAILY_TARGET } from "../../lib/dashboard";

const KPI_CARD =
  "rounded-2xl border border-divider bg-[#fffdf8] p-4";
const KPI_NUM = "block text-[28px] font-bold leading-tight tracking-[-1px]";
const KPI_LABEL = "block text-xs uppercase tracking-[0.6px] text-muted";

/** Six headline numbers across the top, mirroring the design's KPI row. */
export function KpiRow({
  solved,
  streak,
  best,
  solvedToday,
  companies,
  active,
  offers,
}: {
  solved: number;
  streak: number;
  best: number;
  solvedToday: number;
  companies: number;
  active: number;
  offers: number;
}) {
  const kpis = [
    {
      key: "solved",
      num: `${solved}`,
      label: "Problems solved",
      tone: `${KPI_CARD} bg-moss text-white`,
      numClass: KPI_NUM,
      labelClass: `${KPI_LABEL} text-[#d9eadf]`,
    },
    {
      key: "streak",
      num: `${streak} 🔥`,
      label: `Day streak · best ${best}`,
      tone: KPI_CARD,
      numClass: KPI_NUM,
      labelClass: KPI_LABEL,
    },
    {
      key: "today",
      num: `${solvedToday}/${DAILY_TARGET}`,
      label: "Solved today",
      tone: KPI_CARD,
      numClass: KPI_NUM,
      labelClass: KPI_LABEL,
    },
    {
      key: "companies",
      num: `${companies}`,
      label: "Companies tracked",
      tone: KPI_CARD,
      numClass: KPI_NUM,
      labelClass: KPI_LABEL,
    },
    {
      key: "active",
      num: `${active}`,
      label: "Active in process",
      tone: KPI_CARD,
      numClass: `${KPI_NUM} text-coral`,
      labelClass: KPI_LABEL,
    },
    {
      key: "offers",
      num: `${offers}`,
      label: "Offers",
      tone: KPI_CARD,
      numClass: KPI_NUM,
      labelClass: KPI_LABEL,
    },
  ];

  return (
    <div
      className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]"
      role="list"
      aria-label="Dashboard summary"
    >
      {kpis.map((k) => (
        <div key={k.key} role="listitem" className={k.tone}>
          <b className={k.numClass} aria-hidden="true">
            {k.num}
          </b>
          <span className={k.labelClass}>{k.label}</span>
        </div>
      ))}
    </div>
  );
}
