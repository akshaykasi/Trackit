-- ============================================================================
-- 0002 — Trackit becomes student-only
--
-- The placement-officer monitoring layer is removed from the product: no
-- officer UI, no invite codes, no drives. This strips the database side so
-- every student's rows are visible to their owner alone.
--
-- Run in the Supabase SQL editor. Safe to re-run (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop every officer cross-student read policy.
--    Policies go first, then the helper functions they reference.
-- ---------------------------------------------------------------------------
drop policy if exists companies_officer_read      on public.companies;
drop policy if exists rounds_officer_read         on public.rounds;
drop policy if exists prep_items_officer_read     on public.prep_items;
drop policy if exists topic_progress_officer_read on public.topic_progress;
drop policy if exists mock_tests_officer_read     on public.mock_tests;
drop policy if exists resumes_officer_read        on public.resumes;
drop policy if exists activity_officer_read       on public.activity;
drop policy if exists profiles_update_admin       on public.profiles;

-- profiles: readable by the owner only
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Signups are always students now — no invite-code check.
--    (Replaces the function while keeping the same on_auth_user_created
--    trigger from 0001.)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, approved, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'),
    new.email,
    'student',
    false,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- role/approved can no longer be raised: the trigger coerces them on every
-- update, and column grants stop the API from writing those columns at all.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.role := 'student';
  new.approved := false;
  return new;
end;
$$;

revoke update on public.profiles from authenticated;
grant update (name, branch, batch_year, cgpa, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage: the private `resumes` bucket is owner-only again.
-- ---------------------------------------------------------------------------
drop policy if exists resumes_read on storage.objects;
create policy resumes_read on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 4. Drives, drive applications, invite codes and officer helpers: gone.
--    (table policies → tables → enum types → functions, dependency order)
-- ---------------------------------------------------------------------------
drop policy if exists drives_read              on public.drives;
drop policy if exists drives_officer_write     on public.drives;
drop policy if exists drive_app_select         on public.drive_applications;
drop policy if exists drive_app_officer_write  on public.drive_applications;
drop policy if exists invite_codes_admin       on public.invite_codes;

drop table if exists public.drive_applications;
drop table if exists public.drives;
drop table if exists public.invite_codes;

drop type if exists public.drive_application_status;
drop type if exists public.drive_status;

drop function if exists public.is_officer();
drop function if exists public.is_admin();
