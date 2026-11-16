import { ButtonLink } from "../ui/Button";

/** Final call-to-action band in light green. */
export function CtaBand() {
  return (
    <section id="start" className="mx-auto max-w-[1040px] rounded-[36px] bg-sage px-8 py-16 text-center">
      <h2 className="mb-4 font-serif font-normal text-[36px] leading-tight md:text-[56px]">
        Start tracking today
      </h2>
      <p className="mx-auto mb-8 max-w-[520px] text-lg leading-normal text-muted">
        Sign in and your dashboard is ready in seconds.
      </p>
      <ButtonLink to="/login" variant="primary">
        Sign in
      </ButtonLink>
    </section>
  );
}
