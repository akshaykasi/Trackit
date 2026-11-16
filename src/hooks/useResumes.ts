import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requireSupabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import type { Resume } from "../types";

export type WriteResult = { ok: true } | { ok: false; error: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx"];

export function fileError(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return "Only PDF, DOC or DOCX files are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "File is larger than 5 MB.";
  }
  return null;
}

/** Safe storage path: {uid}/{timestamp}-{cleaned filename}. */
function storagePath(uid: string, filename: string): string {
  const clean = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${uid}/${Date.now()}-${clean || "resume.pdf"}`;
}

/**
 * Resume vault: files live in the private `resumes` bucket under the
 * student's own folder (RLS-enforced); metadata rows in `resumes`.
 */
export function useResumes() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    if (!uid) return null;
    const { data, error: err } = await requireSupabase()
      .from("resumes")
      .select("*")
      .eq("student_id", uid)
      .order("created_at", { ascending: false });
    return { data: (data as Resume[]) ?? [], message: err?.message ?? null };
  }, [uid]);

  const retry = useCallback(async () => {
    const result = await fetchResumes();
    if (!result) return;
    setError(result.message);
    setResumes(result.data);
    setLoading(false);
  }, [fetchResumes]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchResumes();
      if (cancelled || !result) return;
      setError(result.message);
      setResumes(result.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchResumes]);

  /** Upload the file, then insert the metadata row. */
  const upload = useCallback(
    async (file: File, versionLabel: string, notes: string): Promise<WriteResult> => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const validation = fileError(file);
      if (validation) return { ok: false, error: validation };

      const path = storagePath(uid, file.name);
      const { error: upErr } = await requireSupabase()
        .storage.from("resumes")
        .upload(path, file, { upsert: false });
      if (upErr) {
        return { ok: false, error: upErr.message };
      }

      const { data, error: err } = await requireSupabase()
        .from("resumes")
        .insert({
          student_id: uid,
          version_label: versionLabel.trim() || file.name,
          file_path: path,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (err || !data) {
        // orphaned file cleanup is best-effort; the DB is the source of truth
        void requireSupabase().storage.from("resumes").remove([path]);
        return { ok: false, error: err?.message ?? "Could not save the resume." };
      }
      setResumes((prev) => [data as Resume, ...prev]);
      void logActivity(uid, "resume_uploaded");
      return { ok: true };
    },
    [uid],
  );

  /** Optimistic delete: DB row first, then the storage object. */
  const remove = useCallback(
    (id: string): WriteResult => {
      if (!uid) return { ok: false, error: "You are not signed in." };
      const before = resumes;
      const target = resumes.find((r) => r.id === id);
      setResumes((prev) => prev.filter((r) => r.id !== id));

      void (async () => {
        const { error: err } = await requireSupabase().from("resumes").delete().eq("id", id);
        if (err) {
          setResumes(before);
          setError(err.message);
          return;
        }
        if (target) {
          const { error: rmErr } = await requireSupabase()
            .storage.from("resumes")
            .remove([target.file_path]);
          if (rmErr) console.warn("storage remove failed:", rmErr.message);
        }
      })();
      return { ok: true };
    },
    [resumes, uid],
  );

  /** Short-lived signed URL for viewing/downloading a private file. */
  const view = useCallback(
    async (id: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
      const target = resumes.find((r) => r.id === id);
      if (!target) return { ok: false, error: "Resume not found." };
      const { data, error } = await requireSupabase()
        .storage.from("resumes")
        .createSignedUrl(target.file_path, 300);
      if (error || !data) {
        return { ok: false, error: error?.message ?? "Could not open the file." };
      }
      return { ok: true, url: data.signedUrl };
    },
    [resumes],
  );

  return { resumes, loading, error, setError, retry, upload, remove, view };
}
