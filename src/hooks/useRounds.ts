import { useCallback, useEffect, useState } from "react";
import { requireSupabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import type { Round, RoundResult } from "../types";

export interface NewRoundInput {
  type: string;
  scheduled_at: string | null;
  notes: string | null;
}

export type WriteResult = { ok: true } | { ok: false; error: string };

/** Rounds for one company, ascending by scheduled time. */
export function useRounds(companyId: string | undefined) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State writes happen after the await — nothing synchronous inside effects.
  const fetchRounds = useCallback(async () => {
    if (!companyId) return null;
    const { data, error: err } = await requireSupabase()
      .from("rounds")
      .select("*")
      .eq("company_id", companyId)
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    return { data: (data as Round[]) ?? [], message: err?.message ?? null };
  }, [companyId]);

  const apply = useCallback(async () => {
    const result = await fetchRounds();
    if (!result) return;
    setError(result.message);
    setRounds(result.data);
    setLoading(false);
  }, [fetchRounds]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchRounds();
      if (cancelled || !result) return;
      setError(result.message);
      setRounds(result.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRounds]);

  const add = useCallback(
    async (input: NewRoundInput, studentId: string): Promise<WriteResult> => {
      if (!companyId) return { ok: false, error: "No company selected." };
      const { data, error: err } = await requireSupabase()
        .from("rounds")
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (err || !data) {
        return { ok: false, error: err?.message ?? "Could not add the round." };
      }
      setRounds((prev) =>
        [...prev, data as Round].sort((a, b) => {
          if (a.scheduled_at === b.scheduled_at) return 0;
          if (!a.scheduled_at) return 1;
          if (!b.scheduled_at) return -1;
          return a.scheduled_at < b.scheduled_at ? -1 : 1;
        }),
      );
      void logActivity(studentId, "round_added");
      return { ok: true };
    },
    [companyId],
  );

  const setResult = useCallback(
    (roundId: string, result: RoundResult): WriteResult => {
      const before = rounds.find((r) => r.id === roundId);
      if (!before || before.result === result) return { ok: true };
      setRounds((prev) => prev.map((r) => (r.id === roundId ? { ...r, result } : r)));

      void (async () => {
        const { error: err } = await requireSupabase()
          .from("rounds")
          .update({ result })
          .eq("id", roundId);
        if (err) {
          setRounds((prev) => prev.map((r) => (r.id === roundId ? before : r)));
          setError(err.message);
        }
      })();
      return { ok: true };
    },
    [rounds],
  );

  return { rounds, loading, error, setError, retry: apply, add, setResult };
}
