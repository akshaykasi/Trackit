/* ---------------------------------------------------------------------------
   Trackit domain types â€” mirror of the Postgres schema
   (supabase/migrations/0001_init.sql). Supabase returns `string` for
   date/timestamptz columns, so date fields are typed as strings on purpose.
--------------------------------------------------------------------------- */

/**
 * Trackit is student-only. The profiles.role column keeps its Postgres enum
 * type for history, but every account is (and stays) a student — enforced by
 * the protect_profile_role trigger in 0002_student_only.sql.
 */
export type Role = "student";

export type CompanyStatus =
  | "wishlist"
  | "applied"
  | "oa"
  | "interview"
  | "offer"
  | "rejected";

export const COMPANY_STATUSES: CompanyStatus[] = [
  "wishlist",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
];

export type PrepTrack = "dsa" | "java" | "sql" | "aptitude";

export type PrepItemStatus = "todo" | "done";

export type Difficulty = "easy" | "medium" | "hard";

export type RoundResult = "pending" | "cleared" | "failed";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  approved: boolean;
  branch: string | null;
  batch_year: number | null;
  cgpa: number | null;
  avatar_url: string | null;
  created_at: string;
}

export type Company = {
  id: string;
  student_id: string;
  name: string;
  role_title: string;
  ctc: number | null;
  location: string | null;
  status: CompanyStatus;
  applied_on: string | null;
  deadline: string | null;
  notes: string | null;
  created_at: string;
}

export type Round = {
  id: string;
  company_id: string;
  type: string;
  scheduled_at: string | null;
  result: RoundResult;
  notes: string | null;
  created_at: string;
}

export type PrepItem = {
  id: string;
  student_id: string;
  track: PrepTrack;
  topic: string;
  title: string;
  difficulty: Difficulty;
  status: PrepItemStatus;
  revise_due: string | null;
  n_revisions: number;
  solved_on: string | null;
  created_at: string;
}

export type TopicProgress = {
  student_id: string;
  track: PrepTrack;
  topic_index: number;
}

export type MockTest = {
  id: string;
  student_id: string;
  track: PrepTrack;
  score: number;
  max_score: number;
  taken_on: string;
  created_at: string;
}

export type Resume = {
  id: string;
  student_id: string;
  version_label: string;
  file_path: string;
  notes: string | null;
  created_at: string;
}

export type Activity = {
  id: string;
  student_id: string;
  kind: string;
  created_at: string;
}

