import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { dayDiff, dayKey } from "../lib/format";
import { composeEvents, type CalendarEvent, type RawCalendarData } from "../lib/calendar";
import type { Company, PrepItem, Round } from "../types";

type FetchResult =
  | { ok: true; data: RawCalendarData }
  | { ok: false; error: string }
  | null; // null = signed out

/** Rounds, deadlines and revision dues composed into one sorted event list. */
export function useCalendar() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<CalendarEvent[]>([]);
  const [todayKey, setTodayKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (): Promise<FetchResult> => {
    if (!uid) return null;
    const client = requireSupabase();
    const [companiesRes, roundsRes, prepRes] = await Promise.all([
      client.from("companies").select("*").eq("student_id", uid),
      client
        .from("rounds")
        .select("id, company_id, type, scheduled_at, result")
        .not("scheduled_at", "is", null),
      client
        .from("prep_items")
        .select("id, student_id, track, topic, title, status, revise_due")
        .eq("student_id", uid)
        .not("revise_due", "is", null),
    ]);

    const firstError = companiesRes.error ?? roundsRes.error ?? prepRes.error;
    if (firstError) {
      return { ok: false, error: firstError.message };
    }
    return {
      ok: true,
      data: {
        companies: (companiesRes.data as Company[]) ?? [],
        rounds:
          (roundsRes.data as Pick<Round, "id" | "company_id" | "type" | "scheduled_at" | "result">[]) ??
          [],
        prepItems:
          (prepRes.data as Pick<PrepItem, "id" | "track" | "topic" | "title" | "revise_due">[]) ?? [],
      },
    };
  }, [uid]);

  const settle = useCallback(
    (result: NonNullable<FetchResult>, now: Date) => {
      if (result.ok) {
        setError(null);
        const composed = composeEvents(result.data, now);
        const tk = dayKey(now.toISOString());
        // calendar-day comparison so a "+3 days" ladder due counts as within 3 days
        setReminders(composed.filter((e) => {
          const d = dayDiff(tk, e.date);
          return d >= 0 && d <= 3;
        }));
        setEvents(composed);
      } else {
        setError(result.error);
        setEvents([]);
        setReminders([]);
      }
      setTodayKey(dayKey(now.toISOString()));
      setLoading(false);
    },
    [],
  );

  const retry = useCallback(async () => {
    const result = await fetchCalendar();
    if (result) settle(result, new Date());
  }, [fetchCalendar, settle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchCalendar();
      if (cancelled || !result) return;
      settle(result, new Date());
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchCalendar, settle]);

  return { events, todayKey, reminders, loading, error, retry };
}
