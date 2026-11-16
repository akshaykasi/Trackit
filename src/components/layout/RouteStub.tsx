import { ButtonLink } from "../ui/Button";

interface RouteStubProps {
  title: string;
  /** Build phase in which this screen is scheduled to be implemented. */
  phase?: number;
}

/**
 * Temporary placeholder for routes that are built in later phases.
 * Used inside the app shells, so it renders as a simple centred card.
 */
export function RouteStub({ title, phase }: RouteStubProps) {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center">
        <span className="mx-auto block h-11 w-11 rounded-[14px] bg-sage" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-normal text-muted">
          {phase
            ? `This screen is built in phase ${phase} of the plan.`
            : "There is nothing at this address."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" variant="secondary">
            Back to home
          </ButtonLink>
          <ButtonLink to={phase ? "/app" : "/login"} variant="primary">
            {phase ? "Dashboard" : "Sign in"}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
