import { Link } from "react-router-dom";
import { ButtonLink } from "../ui/Button";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#preview", label: "Dashboard" },
  { href: "#tracks", label: "Prep tracks" },
];

/** Floating glass navbar: pill-shaped, centred, max 960px on the landing page. */
export function GlassNav() {
  return (
    <nav className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-4 rounded-full border border-ink/10 bg-white/65 py-3 pl-7 pr-4 backdrop-blur-md">
      <Link to="/" className="font-serif text-[30px] leading-none text-ink">
        Trackit
      </Link>
      <div className="flex flex-wrap gap-7 text-base font-medium">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="text-ink transition-opacity hover:opacity-70">
            {link.label}
          </a>
        ))}
      </div>
      <ButtonLink to="/login" variant="primary">
        Sign in
      </ButtonLink>
    </nav>
  );
}
