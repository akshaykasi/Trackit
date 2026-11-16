import { StatTile } from "../ui/StatTile";

const ACTIVITY = [
  { day: "Mon", pct: 40 },
  { day: "Tue", pct: 65 },
  { day: "Wed", pct: 50 },
  { day: "Thu", pct: 85 },
  { day: "Fri", pct: 70 },
  { day: "Sat", pct: 100 },
  { day: "Sun", pct: 30 },
];

const cardShadow = "shadow-[0_30px_40px_-20px_rgba(27,42,31,0.5)]";

/**
 * Dashboard preview in a dark green panel with a CSS-only 3D effect:
 * the panel is tilted (rotateX 14°, rotateZ −2°) inside a 1400px perspective
 * container and flattens smoothly on hover. Three floating cards bob in front
 * of it. Tilt + floating cards are hidden below 760px and animations are
 * disabled for prefers-reduced-motion (see index.css).
 */
export function DashboardPreview() {
  const peak = Math.max(...ACTIVITY.map((d) => d.pct));
  return (
    <div className="scene relative mx-auto mb-24 max-w-[1040px]">
      <section
        id="preview"
        className="tilt rounded-[36px] bg-ink p-8 text-cream shadow-[0_60px_80px_-40px_rgba(27,42,31,0.55)]"
        aria-label="Trackit dashboard preview"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-serif text-[32px] leading-none">Today</span>
          <span className="rounded-full bg-coral px-4 py-2 text-[15px] font-bold text-ink">
            12 day streak
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatTile
            variant="dark"
            size="lg"
            label="Tasks done"
            value="8/11"
            className="flex-1 basis-[200px]"
          />
          <StatTile
            variant="light"
            size="lg"
            label="DSA solved this week"
            value="14"
            className="flex-1 basis-[200px]"
          />
          <StatTile
            variant="white"
            size="lg"
            label="Focus time"
            value="3h 20m"
            className="flex-1 basis-[200px]"
          />
        </div>

        <div className="mt-4 rounded-3xl bg-panel p-6">
          <div className="mb-4 text-[15px]">Weekly activity</div>
          <div
            role="img"
            aria-label="Bar chart of the last 7 days of activity, peaking on Saturday"
            className="flex h-[140px] items-end gap-3"
          >
            {ACTIVITY.map((d) => (
              <div
                key={d.day}
                className="flex-1 rounded-[10px]"
                style={{ height: `${d.pct}%`, background: d.pct === peak ? "#F2765A" : "#CFE3D2" }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-center text-sm">
            {ACTIVITY.map((d) => (
              <span key={d.day} className="flex-1">
                {d.day}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Floating cards (decorative) */}
      <div
        aria-hidden="true"
        className={`fl right-[-24px] top-[-28px] flex items-center gap-3 rounded-3xl bg-white p-4 pr-5 text-ink ${cardShadow}`}
      >
        <span className="block h-11 w-11 shrink-0 rounded-full border-6 border-coral border-t-sage" />
        <span className="text-xl font-bold leading-tight">
          25:00
          <br />
          <span className="text-[13px] font-medium text-muted">Focus session</span>
        </span>
      </div>

      <div
        aria-hidden="true"
        className={`fl bottom-[-32px] left-[-20px] flex items-center gap-3 rounded-3xl bg-white p-4 pr-5 text-ink [animation-delay:-2s] ${cardShadow}`}
      >
        <span className="block h-7 w-7 shrink-0 rounded-full bg-moss" />
        <span className="text-lg font-bold leading-tight">
          Revise graphs
          <br />
          <span className="text-[13px] font-medium text-muted">Due today</span>
        </span>
      </div>

      <div
        aria-hidden="true"
        className={`fl left-[-36px] top-10 grid h-[84px] w-[84px] place-items-center rounded-full border-6 border-sun bg-coral text-[32px] font-bold text-ink [animation-delay:-3.5s] ${cardShadow}`}
      >
        7
      </div>
    </div>
  );
}
