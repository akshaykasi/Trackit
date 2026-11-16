import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";

const inputClass =
  "w-full rounded-2xl border border-divider bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-moss";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email + password sign-in / sign-up.
 */
export function LoginPage() {
  const { session, profile, loading, configured, signIn, signUp, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null); // awaiting email confirmation

  useEffect(() => {
    if (!loading && session && profile) {
      navigate(from && from.startsWith("/") ? from : "/app", { replace: true });
    }
  }, [loading, session, profile, from, navigate]);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setSentTo(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSentTo(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Enter your full name.");
      return;
    }

    setPending(true);
    if (mode === "signin") {
      const result = await signIn(email.trim(), password);
      setPending(false);
      if (!result.ok) setError(result.message);
      return;
    }

    const result = await signUp({
      email: email.trim(),
      password,
      name: name.trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsConfirmation) {
      setSentTo(email.trim());
    }
    // Otherwise the session arrives via AuthContext and the effect routes us.
  }

  async function handleResend() {
    if (!sentTo) return;
    setResending(true);
    const result = await resendConfirmation(sentTo);
    setResending(false);
    setError(result.ok ? null : result.message);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-8">
        <p className="text-center font-serif text-[30px] leading-none text-ink">Trackit</p>

        {!configured ? (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-coral px-4 py-3 text-sm font-medium leading-snug text-ink"
          >
            Supabase is not configured yet. Copy .env.example to .env and add
            VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.
          </p>
        ) : sentTo ? (
          <div className="mt-5 text-center">
            <span className="mx-auto block h-11 w-11 rounded-[14px] bg-sage" aria-hidden="true" />
            <h1 className="mt-4 text-lg font-bold text-ink">Check your inbox</h1>
            <p className="mt-2 text-sm leading-normal text-muted">
              We sent a confirmation link to <strong>{sentTo}</strong>. Confirm your email, then
              come back and sign in.
            </p>
            <div className="mt-5 grid gap-2">
              <Button variant="secondary" onClick={() => void handleResend()} disabled={resending}>
                {resending ? "Sending…" : "Resend email"}
              </Button>
              <Button variant="primary" onClick={() => switchMode("signin")}>
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-3 text-center text-lg font-bold text-ink">
              {mode === "signin" ? "Sign in" : "Create your account"}
            </h1>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-2xl bg-coral px-4 py-3 text-sm font-medium leading-snug text-ink"
              >
                {error}
              </p>
            ) : null}

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-3" noValidate>
              {mode === "signup" ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Full name</span>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Aditi Sharma"
                    required
                  />
                </label>
              ) : null}

              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Email</span>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@gmail.com"
                  required
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Password</span>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  required
                />
              </label>

              <Button
                type="submit"
                variant={mode === "signin" ? "success" : "primary"}
                className="mt-1 w-full"
                disabled={pending || !configured}
              >
                {pending ? <Spinner className="border-cream/40 border-t-cream" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted">
              {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-moss underline"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </>
        )}

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Privacy: your applications, prep and resumes are visible only inside your own account.
        </p>

        <p className="mt-4 text-center">
          <a href="/" className="text-sm font-semibold text-moss underline">
            Back to home
          </a>
        </p>
      </div>
    </main>
  );
}
