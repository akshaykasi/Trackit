import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { nextReviseDue } from "../lib/spacedRep";
import type { Difficulty, PrepItem, PrepItemStatus, PrepTrack, TopicProgress } from "../types";

export interface NewPrepItemInput {
  track: PrepTrack;
  topic: string;
  title: string;
  difficulty: Difficulty;
}

export type WriteResult = { ok: true } | { ok: false; error: string };

function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Prep items (problem log) + topic checklist progress for the student.
 * Revision ladder: solving sets revise_due = today+1; each "Revised" action
 * reschedules to +3/+7/+14; after the 4th pass the item is exam-ready.
 */
export function usePrep() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [items, setItems] = useState<PrepItem[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!uid) return null;
    const client = requireSupabase();
    const [itemsRes, progressRes] = await Promise.all([
      client.from("prep_items").select("*").eq("student_id", uid).order("created_at", { ascending: false }),
      client.from("topic_progress").select("*").eq("student_id", uid),
    ]);
    const firstError = itemsRes.error ?? progressRes.error;
    if (firstError) return { error: firstError.message as string };
    return {
      items: (itemsRes.data as PrepItem[]) ?? [],
      progress: (progressRes.data as TopicProgress[]) ?? [],
    };
  }, [uid]);

  const settle = useCallback(
    (result: { error: string } | { items: PrepItem[]; progress: TopicProgress[] }) => {
      if ("error" in result) {
        setError(result.error);
        setItems([]);
        setProgress([]);
      } else {
        setError(null);
        setItems(result.items);
        setProgress(result.progress);
      }
      setLoading(false);
    },
    [],
  );

  const retry = useCallback(async () => {
    const result = await fetchAll();
    if (result) settle(result);
  }, [fetchAll, settle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchAll();
      if (cancelled || !result) return;
      settle(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll, settle]);

  const addItem = useCallback(
    async (input: NewPrepItemInput): Promise<WriteResult> => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const { data, error: err } = await requireSupabase()
        .from("prep_items")
        .insert({
          student_id: uid,
          track: input.track,
          topic: input.topic,
          title: input.title,
          difficulty: input.difficulty,
          status: "todo",
          revise_due: null,
          n_revisions: 0,
          solved_on: null,
        })
        .select()
        .single();
      if (err || !data) {
        return { ok: false, error: err?.message ?? "Could not log the problem." };
      }
      setItems((prev) => [data as PrepItem, ...prev]);
      void logActivity(uid, "problem_added");
      return { ok: true };
    },
    [uid],
  );

  /** todo ↔ done. Solving starts the revision ladder (+1 day). */
  const setStatus = useCallback(
    (id: string, status: PrepItemStatus): WriteResult => {
      const before = items.find((i) => i.id === id);
      if (!before) return { ok: false, error: "Problem not found." };
      const patch: Partial<PrepItem> =
        status === "done"
          ? { status, solved_on: today(), revise_due: nextReviseDue(before.n_revisions, today()) }
          : { status, solved_on: null, revise_due: null };
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

      void (async () => {
        const { error: err } = await requireSupabase().from("prep_items").update(patch).eq("id", id);
        if (err) {
          setItems((prev) => prev.map((i) => (i.id === id ? before : i)));
          setError(err.message);
        } else if (uid) {
          void logActivity(uid, status === "done" ? "problem_solved" : "problem_reopened");
        }
      })();
      return { ok: true };
    },
    [items, uid],
  );

  /** "Revised" action: advance the ladder, reschedule or finish it. */
  const markRevised = useCallback(
    (id: string): WriteResult => {
      const before = items.find((i) => i.id === id);
      if (!before) return { ok: false, error: "Problem not found." };
      const n = before.n_revisions + 1;
      const patch: Partial<PrepItem> = { n_revisions: n, revise_due: nextReviseDue(n, today()) };
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

      void (async () => {
        const { error: err } = await requireSupabase().from("prep_items").update(patch).eq("id", id);
        if (err) {
          setItems((prev) => prev.map((i) => (i.id === id ? before : i)));
          setError(err.message);
        } else if (uid) {
          void logActivity(uid, "revised");
        }
      })();
      return { ok: true };
    },
    [items, uid],
  );

  const removeItem = useCallback(
    (id: string): WriteResult => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const before = items;
      setItems((prev) => prev.filter((i) => i.id !== id));

      void (async () => {
        const { error: err } = await requireSupabase().from("prep_items").delete().eq("id", id);
        if (err) {
          setItems(before);
          setError(err.message);
        }
      })();
      return { ok: true };
    },
    [items, uid],
  );

  /** Toggle a topic checkbox: insert or delete the topic_progress row. */
  const toggleTopic = useCallback(
    (track: PrepTrack, topicIndex: number): WriteResult => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const existing = progress.some(
        (p) => p.track === track && p.topic_index === topicIndex,
      );
      if (existing) {
        const before = progress;
        setProgress((prev) => prev.filter((p) => !(p.track === track && p.topic_index === topicIndex)));
        void (async () => {
          const { error: err } = await requireSupabase()
            .from("topic_progress")
            .delete()
            .eq("student_id", uid)
            .eq("track", track)
            .eq("topic_index", topicIndex);
          if (err) {
            setProgress(before);
            setError(err.message);
          }
        })();
      } else {
        const row: TopicProgress = { student_id: uid, track, topic_index: topicIndex };
        setProgress((prev) => [...prev, row]);
        void (async () => {
          const { error: err } = await requireSupabase()
            .from("topic_progress")
            .insert(row)
            .select()
            .single();
          if (err) {
            setProgress((prev) => prev.filter((p) => p !== row));
            setError(err.message);
          } else if (uid) {
            void logActivity(uid, "topic_done");
          }
        })();
      }
      return { ok: true };
    },
    [progress, uid],
  );

  return { items, progress, loading, error, setError, retry, addItem, setStatus, markRevised, removeItem, toggleTopic };
}
