import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "../types";
import type { FriendlyAuthError } from "../lib/authErrors";

export type AuthActionResult = { ok: true } | ({ ok: false } & FriendlyAuthError);

export type SignUpResult =
  | { ok: true; needsConfirmation: boolean }
  | ({ ok: false } & FriendlyAuthError);

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** true while the initial session + profile load is in flight */
  loading: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
