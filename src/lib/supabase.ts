import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(url && anonKey);

function createSupabaseClient() {
  if (!url || !anonKey) return null;
  return createClient<Database>(url, anonKey);
}

export type TypedSupabaseClient = NonNullable<ReturnType<typeof createSupabaseClient>>;

/**
 * The Supabase client, or null when .env is not configured yet.
 * Use `requireSupabase()` where a missing config should fail loudly,
 * and `supabase` (null-checked) where a graceful fallback is nicer.
 */
export const supabase: TypedSupabaseClient | null = createSupabaseClient();

export function requireSupabase(): TypedSupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}
