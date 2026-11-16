import { Card } from "../ui/Card";

const features = [
  {
    dot: "bg-sage",
    title: "Task board",
    body: "Plan the day, tag work by project and tick it off.",
  },
  {
    dot: "bg-coral",
    title: "Company pipeline",
    body: "Follow every application from wishlist to offer, with rounds and deadlines.",
  },
  {
    dot: "bg-moss",
    title: "Readiness score",
    body: "One honest number with its full breakdown, so you know what to fix next.",
  },
  {
    dot: "bg-sun",
    title: "Spaced revision",
    body: "Solved problems come back on a 1 / 3 / 7 / 14-day ladder, exactly when memory fades.",
  },
];

/** Four feature cards: white, 28px radius, coloured dot. */
export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto mb-24 max-w-[1040px]">
      <h2 className="mb-8 text-center font-serif font-normal text-[36px] leading-tight md:text-[56px]">
        Built for the way you prepare
      </h2>
      <div className="flex flex-wrap gap-4">
        {features.map((f) => (
          <Card key={f.title} className="flex-1 basis-[240px]">
            <span className={`dot block h-11 w-11 rounded-[14px] ${f.dot}`} aria-hidden="true" />
            <h3 className="mb-2 mt-4 text-[22px] font-bold">{f.title}</h3>
            <p className="text-base leading-normal text-muted">{f.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
