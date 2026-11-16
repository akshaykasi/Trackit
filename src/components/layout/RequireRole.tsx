import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ButtonLink } from "../ui/Button";
import { FullPageSpinner } from "../ui/Spinner";

/** Card shown when a session exists but the profile row is missing. */
function MissingProfile() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Profile not found</h1>
        <p className="mt-2 text-sm leading-normal text-muted">
          Your account has no Trackit profile yet. This can happen if the database trigger did not
          run. Sign out and sign in again; if it persists, ask your admin to check the
          <code className="mx-1 rounded bg-cream px-1">profiles</code>
          table.
        </p>
        <div className="mt-6">
          <ButtonLink to="/login" variant="primary">
            Back to sign in
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

/** Guard for /app/*: requires a signed-in account with a profile. */
export function RequireStudent() {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Checking your session…" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <MissingProfile />;
  return <Outlet />;
}
