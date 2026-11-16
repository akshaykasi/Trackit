import { pillClass } from "../ui/pill";

/** Centered hero: eyebrow, 88px serif headline, subtext, two pills. */
export function Hero() {
  return (
    <header className="mx-auto mb-[72px] mt-24 max-w-[960px] text-center">
      <p className="mb-5 text-base font-semibold uppercase tracking-[0.08em] text-moss">
        Developer productivity dashboard
      </p>
      <h1 className="font-serif font-normal leading-[1.02] tracking-[-0.02em] text-[44px] sm:text-[64px] md:text-[88px]">
        Track the work.
        <br />
        Keep the streak.
      </h1>
      <p className="mx-auto mt-7 mb-10 max-w-[600px] text-xl leading-normal text-muted">
        Tasks, DSA practice, focus sessions and analytics in one calm place. Everything stays in
        your browser.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a href="/login" className={pillClass("accent")}>
          Get started
        </a>
        <a href="#preview" className={pillClass("secondary")}>
          See the dashboard
        </a>
      </div>
    </header>
  );
}
