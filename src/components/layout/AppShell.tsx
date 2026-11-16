import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FullPageSpinner } from "../ui/Spinner";

const navLinks = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/companies", label: "Companies" },
  { to: "/app/prep", label: "Prep" },
  { to: "/app/mocks", label: "Mocks" },
  { to: "/app/resume", label: "Resume" },
  { to: "/app/calendar", label: "Calendar" },
  { to: "/app/offers", label: "Offers" },
];

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt="" className="h-8 w-8 rounded-full border border-ink/10 object-cover" />;
  }
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-moss text-sm font-bold text-cream">
      {name.trim().charAt(0).toUpperCase() || "T"}
    </span>
  );
}

/** Glass app navbar (max 1240px) + content outlet for the signed-in area. */
export function AppShell() {
  const { profile, signOut } = useAuth();
  const firstName = (profile?.name ?? "").split(" ")[0] || "You";

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <nav className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 rounded-full border border-ink/10 bg-white/65 py-2.5 pl-6 pr-3 backdrop-blur-md sm:pl-7">
          <Link to="/app" className="font-serif text-[26px] leading-none text-ink">
            Trackit
          </Link>

          <div className="flex flex-wrap items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive ? "bg-ink text-cream" : "text-muted hover:bg-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app/profile"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white"
            >
              <Avatar url={profile?.avatar_url ?? null} name={firstName} />
              <span className="hidden text-sm font-semibold sm:inline">{firstName}</span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sage-deep"
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
        {/* Code-split route chunks resolve inside the shell so the nav stays put. */}
        <Suspense fallback={<FullPageSpinner label="Loading…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
