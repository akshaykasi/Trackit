import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { dayDiff, dayKey } from "../lib/format";

interface ActivityRow {
  kind: string;
  created_at: string;
}

export interface ActivitySummary {
  /** Local day keys (YYYY-MM-DD) with any activity. */
  days: string[];
  /** Local day key → number of actions that day (heatmap). */
  counts: Record<string, number>;
  /** Activity kind → number of actions in the window (time split). */
  kindCounts: Record<string, number>;
  /** Distinct days with a "revised" activity within the last 14 days. */
  revisedDays14: number;
  todayISO: string;
}

type LoadResult =
  | { error: string }
  | { rows: ActivityRow[] }
  | null; // signed out

/** 105 days: the fifteen-week heatmap plus the week bars, streaks and splits. */
const WINDOW_DAYS = 105;

/** Activity feed summary powering streaks, the heatmap and the time split. */
export function useActivity(): ActivitySummary & {
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
} {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [summary, setSummary] = useState<ActivitySummary>({
    days: [],
    counts: {},
    kindCounts: {},
    revisedDays14: 0,
    todayISO: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settle = useCallback((rows: ActivityRow[]) => {
    const now = new Date();
    const today = dayKey(now.toISOString());
    const days: string[] = [];
    const counts: Record<string, number> = {};
    const kindCounts: Record<string, number> = {};
    for (const r of rows) {
      const key = dayKey(r.created_at);
      if (!(key in counts)) {
        counts[key] = 0;
        days.push(key);
      }
      counts[key] += 1;
      kindCounts[r.kind] = (kindCounts[r.kind] ?? 0) + 1;
    }
    const revisedDays14 = new Set(
      rows
        .filter(
          (r) =>
            r.kind === "revised" &&
            dayDiff(today, dayKey(r.created_at)) >= 0 &&
            dayDiff(today, dayKey(r.created_at)) <= 13,
        )
        .map((r) => dayKey(r.created_at)),
    ).size;
    setSummary({ days, counts, kindCounts, revisedDays14, todayISO: today });
    setLoading(false);
  }, []);

  const fetchActivity = useCallback(async (): Promise<LoadResult> => {
    if (!uid) return null;
    const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
    const { data, error: err } = await requireSupabase()
      .from("activity")
      .select("kind, created_at")
      .eq("student_id", uid)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (err) return { error: err.message as string };
    return { rows: (data as ActivityRow[]) ?? [] };
  }, [uid]);

  const retry = useCallback(async () => {
    const result = await fetchActivity();
    if (!result) return;
    if ("error" in result) {
      setError(result.error ?? "Failed to load activity.");
      setSummary((s) => ({ ...s, days: [], counts: {}, kindCounts: {}, revisedDays14: 0 }));
      setLoading(false);
      return;
    }
    setError(null);
    settle(result.rows);
  }, [fetchActivity, settle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchActivity();
      if (cancelled || !result) return;
      if ("error" in result) {
        setError(result.error ?? "Failed to load activity.");
        setLoading(false);
        return;
      }
      settle(result.rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchActivity, settle]);

  return { ...summary, loading, error, retry };
}
