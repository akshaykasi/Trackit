import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import type { Company, CompanyStatus } from "../types";

export interface NewCompanyInput {
  name: string;
  role_title: string;
  ctc: number | null;
  location: string | null;
  status: CompanyStatus;
  deadline: string | null;
  notes: string | null;
}

export type WriteResult = { ok: true } | { ok: false; error: string };

const POST_APPLY_STATUSES: CompanyStatus[] = ["applied", "oa", "interview", "offer"];

function today(): string {
  // local calendar date (en-CA → YYYY-MM-DD), not UTC — a student in IST
  // who applies at 1am should not see "yesterday"
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Student's company applications. Moves and deletes are optimistic — the UI
 * updates immediately and reverts with an error banner if Supabase rejects.
 */
export function useCompanies() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    if (!uid) return null;
    const { data, error: err } = await requireSupabase()
      .from("companies")
      .select("*")
      .eq("student_id", uid)
      .order("created_at", { ascending: false });
    return { data: (data as Company[]) ?? [], message: err?.message ?? null };
  }, [uid]);

  const retry = useCallback(async () => {
    const result = await fetchCompanies();
    if (!result) return;
    setError(result.message);
    setCompanies(result.data);
    setLoading(false);
  }, [fetchCompanies]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchCompanies();
      if (cancelled || !result) return;
      setError(result.message);
      setCompanies(result.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchCompanies]);

  const create = useCallback(
    async (input: NewCompanyInput): Promise<WriteResult> => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const { data, error: err } = await requireSupabase()
        .from("companies")
        .insert({
          ...input,
          student_id: uid,
          applied_on: POST_APPLY_STATUSES.includes(input.status) ? today() : null,
        })
        .select()
        .single();
      if (err || !data) {
        return { ok: false, error: err?.message ?? "Could not add the company." };
      }
      setCompanies((prev) => [data as Company, ...prev]);
      void logActivity(uid, "application_added");
      return { ok: true };
    },
    [uid],
  );

  const move = useCallback(
    (id: string, status: CompanyStatus): WriteResult => {
      const before = companies.find((c) => c.id === id);
      if (!before || before.status === status) return { ok: true };
      if (!uid) return { ok: false, error: "You are not signed in." };

      // Optimistic: flip status, stamp applied_on the first time it moves past wishlist.
      const patch: Partial<Company> = { status };
      if (status !== "wishlist" && !before.applied_on) patch.applied_on = today();
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

      void (async () => {
        const { error: err } = await requireSupabase()
          .from("companies")
          .update(patch)
          .eq("id", id);
        if (err) {
          setCompanies((prev) => prev.map((c) => (c.id === id ? before : c)));
          setError(err.message);
        } else {
          void logActivity(uid, "application_moved");
        }
      })();
      return { ok: true };
    },
    [companies, uid],
  );

  const update = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<Company, "role_title" | "location" | "ctc" | "deadline" | "notes" | "status" | "applied_on">
      >,
    ): WriteResult => {
      const before = companies.find((c) => c.id === id);
      if (!before) return { ok: false, error: "Company not found." };
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

      void (async () => {
        const { error: err } = await requireSupabase()
          .from("companies")
          .update(patch)
          .eq("id", id);
        if (err) {
          setCompanies((prev) => prev.map((c) => (c.id === id ? before : c)));
          setError(err.message);
        }
      })();
      return { ok: true };
    },
    [companies],
  );

  const remove = useCallback(
    (id: string): WriteResult => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const before = companies;
      setCompanies((prev) => prev.filter((c) => c.id !== id));

      void (async () => {
        const { error: err } = await requireSupabase().from("companies").delete().eq("id", id);
        if (err) {
          setCompanies(before);
          setError(err.message);
        }
      })();
      return { ok: true };
    },
    [companies, uid],
  );

  return { companies, loading, error, setError, retry, create, move, update, remove };
}
