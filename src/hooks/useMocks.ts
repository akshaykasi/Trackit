import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import type { MockTest, PrepTrack } from "../types";

export interface NewMockInput {
  track: PrepTrack;
  score: number;
  max_score: number;
  taken_on: string;
}

export type WriteResult = { ok: true } | { ok: false; error: string };

/** Student's mock tests, newest first. */
export function useMocks() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMocks = useCallback(async () => {
    if (!uid) return null;
    const { data, error: err } = await requireSupabase()
      .from("mock_tests")
      .select("*")
      .eq("student_id", uid)
      .order("taken_on", { ascending: false })
      .order("created_at", { ascending: false });
    return { data: (data as MockTest[]) ?? [], message: err?.message ?? null };
  }, [uid]);

  const retry = useCallback(async () => {
    const result = await fetchMocks();
    if (!result) return;
    setError(result.message);
    setMocks(result.data);
    setLoading(false);
  }, [fetchMocks]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchMocks();
      if (cancelled || !result) return;
      setError(result.message);
      setMocks(result.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMocks]);

  const add = useCallback(
    async (input: NewMockInput): Promise<WriteResult> => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const { data, error: err } = await requireSupabase()
        .from("mock_tests")
        .insert({ student_id: uid, ...input })
        .select()
        .single();
      if (err || !data) {
        return { ok: false, error: err?.message ?? "Could not save the mock test." };
      }
      setMocks((prev) =>
        [data as MockTest, ...prev].sort(
          (a, b) => (a.taken_on < b.taken_on ? 1 : a.taken_on > b.taken_on ? -1 : 0),
        ),
      );
      void logActivity(uid, "mock_logged");
      return { ok: true };
    },
    [uid],
  );

  const remove = useCallback(
    (id: string): WriteResult => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const before = mocks;
      setMocks((prev) => prev.filter((m) => m.id !== id));

      void (async () => {
        const { error: err } = await requireSupabase().from("mock_tests").delete().eq("id", id);
        if (err) {
          setMocks(before);
          setError(err.message);
        }
      })();
      return { ok: true };
    },
    [mocks, uid],
  );

  return { mocks, loading, error, setError, retry, add, remove };
}
