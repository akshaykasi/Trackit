import { supabase } from "./supabase";

/**
 * Append a row to the activity feed (streaks + consistency in phase 6).
 * Failures are non-fatal — never block the user's action on analytics.
 */
export async function logActivity(studentId: string, kind: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("activity").insert({ student_id: studentId, kind });
  if (error) console.warn("activity log failed:", error.message);
}
