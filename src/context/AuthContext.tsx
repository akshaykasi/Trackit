import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AuthContext,
  type AuthActionResult,
  type AuthContextValue,
  type SignUpInput,
  type SignUpResult,
} from "./auth";
import { friendlyAuthError } from "../lib/authErrors";
import { hasSupabaseEnv, requireSupabase, supabase } from "../lib/supabase";
import type { Profile } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error: profileError } = await requireSupabase()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) {
      setError(profileError.message);
      return null;
    }
    return (data as Profile | null) ?? null;
  }, []);

  useEffect(() => {
    if (!supabase) return; // loading is already false via useState(hasSupabaseEnv)
    let cancelled = false;

    async function applySession(next: Session | null) {
      setSession(next);
      if (next?.user) {
        const p = await fetchProfile(next.user.id);
        if (cancelled) return;
        setProfile(p);
      } else if (!cancelled) {
        setProfile(null);
      }
      if (!cancelled) {
        setLoading(false);
        setError(null);
      }
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    const { error: authError } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (authError) return { ok: false, ...friendlyAuthError(authError.message) };
    return { ok: true };
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<SignUpResult> => {
    const { data, error: authError } = await requireSupabase().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { name: input.name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (authError) return { ok: false, ...friendlyAuthError(authError.message) };
    // needsConfirmation is false when the session comes back right away
    // (email confirmation disabled in the Supabase project).
    return { ok: true, needsConfirmation: !data.session };
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthActionResult> => {
    const { error: authError } = await requireSupabase().auth.resend({ type: "signup", email });
    if (authError) return { ok: false, ...friendlyAuthError(authError.message) };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await requireSupabase().auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id));
  }, [session, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      error,
      configured: hasSupabaseEnv,
      signIn,
      signUp,
      resendConfirmation,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, error, signIn, signUp, resendConfirmation, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
