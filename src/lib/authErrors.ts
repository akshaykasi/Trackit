export type AuthErrorCode =
  | "email_not_confirmed"
  | "weak_password"
  | "rate_limited"
  | null;

export interface FriendlyAuthError {
  message: string;
  code: AuthErrorCode;
}

/** Map raw Supabase/Gotrue error messages to student-friendly copy. Pure — unit-testable. */
export function friendlyAuthError(raw: string): FriendlyAuthError {
  const m = raw.toLowerCase();
  if (m.includes("email not confirmed")) {
    return {
      message: "Confirm your email first — check your inbox for the Trackit link.",
      code: "email_not_confirmed",
    };
  }
  if (m.includes("invalid login credentials")) {
    return { message: "Wrong email or password. Try again.", code: null };
  }
  if (m.includes("already registered")) {
    return { message: "An account with this email already exists. Sign in instead.", code: null };
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("for security purposes")) {
    return { message: "Too many attempts. Wait a minute and try again.", code: "rate_limited" };
  }
  if (m.includes("password should be at least") || m.includes("at least 6 characters")) {
    return {
      message: raw.replace(/password should be at least/i, "Password must be at least"),
      code: "weak_password",
    };
  }
  if (m.includes("unable to validate email") || m.includes("invalid email") || (m.includes("email") && m.includes("is invalid"))) {
    return {
      message: "That email address looks invalid or isn't allowed. Try a real address such as Gmail.",
      code: null,
    };
  }
  if (m.includes("valid password")) {
    return { message: "Please enter a password of at least 8 characters.", code: "weak_password" };
  }
  return { message: raw, code: null };
}
