import type {
  Activity,
  Company,
  Difficulty,
  MockTest,
  PrepItem,
  PrepItemStatus,
  PrepTrack,
  Profile,
  Resume,
  Role,
  Round,
  RoundResult,
  TopicProgress,
} from "./index";

/**
 * Hand-written mirror of the Postgres schema (supabase/migrations/, see
 * 0002_student_only.sql for the current student-only shape) in the shape
 * supabase-js expects, so every query is typed without codegen.
 * Keep in sync with the migration files.
 */

interface Relationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          name?: string;
          email: string;
          role?: Role;
          approved?: boolean;
          branch?: string | null;
          batch_year?: number | null;
          cgpa?: number | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: Role;
          approved?: boolean;
          branch?: string | null;
          batch_year?: number | null;
          cgpa?: number | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      companies: {
        Row: Company;
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          role_title?: string;
          ctc?: number | null;
          location?: string | null;
          status?: Company["status"];
          applied_on?: string | null;
          deadline?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          role_title?: string;
          ctc?: number | null;
          location?: string | null;
          status?: Company["status"];
          applied_on?: string | null;
          deadline?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rounds: {
        Row: Round;
        Insert: {
          id?: string;
          company_id: string;
          type: string;
          scheduled_at?: string | null;
          result?: RoundResult;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          type?: string;
          scheduled_at?: string | null;
          result?: RoundResult;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rounds_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      prep_items: {
        Row: PrepItem;
        Insert: {
          id?: string;
          student_id: string;
          track: PrepTrack;
          topic: string;
          title: string;
          difficulty?: Difficulty;
          status?: PrepItemStatus;
          revise_due?: string | null;
          n_revisions?: number;
          solved_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          track?: PrepTrack;
          topic?: string;
          title?: string;
          difficulty?: Difficulty;
          status?: PrepItemStatus;
          revise_due?: string | null;
          n_revisions?: number;
          solved_on?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prep_items_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_progress: {
        Row: TopicProgress;
        Insert: TopicProgress;
        Update: Partial<TopicProgress>;
        Relationships: [
          {
            foreignKeyName: "topic_progress_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_tests: {
        Row: MockTest;
        Insert: {
          id?: string;
          student_id: string;
          track: PrepTrack;
          score: number;
          max_score: number;
          taken_on: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          track?: PrepTrack;
          score?: number;
          max_score?: number;
          taken_on?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mock_tests_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      resumes: {
        Row: Resume;
        Insert: {
          id?: string;
          student_id: string;
          version_label: string;
          file_path: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          version_label?: string;
          file_path?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resumes_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity: {
        Row: Activity;
        Insert: {
          id?: string;
          student_id: string;
          kind: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          kind?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
