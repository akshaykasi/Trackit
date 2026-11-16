import { Card } from "../ui/Card";

const tracks = [
  {
    dot: "bg-coral",
    title: "Java",
    body: "Check off topics and log practice questions as you go.",
    chips: ["OOP", "Collections", "Streams", "Multithreading"],
  },
  {
    dot: "bg-sage",
    title: "SQL",
    body: "Log queries by concept and keep the tricky ones for revision.",
    chips: ["Joins", "Subqueries", "Window functions", "Indexing"],
  },
  {
    dot: "bg-sun",
    title: "Aptitude and reasoning",
    body: "Record timed practice sets and watch your accuracy improve.",
    chips: ["Quantitative", "Logical", "Verbal", "Puzzles"],
  },
];

/** Three prep-track cards with topic chips. */
export function PrepTracksSection() {
  return (
    <section id="tracks" className="mx-auto mb-24 max-w-[1040px]">
      <p className="mb-3 text-center text-base font-semibold uppercase tracking-[0.08em] text-moss">
        Prep tracks
      </p>
      <h2 className="mb-8 text-center font-serif font-normal text-[36px] leading-tight md:text-[56px]">
        More than DSA. Track it all.
      </h2>
      <div className="flex flex-wrap gap-4">
        {tracks.map((t) => (
          <Card key={t.title} className="flex-1 basis-[240px]">
            <span className={`dot block h-11 w-11 rounded-[14px] ${t.dot}`} aria-hidden="true" />
            <h3 className="mb-2 mt-4 text-[22px] font-bold">{t.title}</h3>
            <p className="text-base leading-normal text-muted">{t.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {t.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
