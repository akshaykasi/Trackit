-- ============================================================================
-- Trackit — schema, indexes, RLS, auth triggers
-- Run this whole file in the Supabase SQL editor (Database → SQL) or with
-- `supabase db push`. Safe to re-run: uses if-not-exists / or-replace patterns
-- for functions and drops+recreates policies.
--
-- Security model
--   • Students read/write ONLY their own rows.
--   • Officers get read-only access to all student data (and must be approved).
--   • Officers/admins get full access to drives + drive_applications.
--   • role/approved on profiles can only be changed by an admin (DB trigger),
--     so a hacked client cannot promote itself.
--   • New signups become students; an officer invite code (checked server-side
--     in the auth trigger) is the only automatic path to officer.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student','officer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.company_status as enum ('wishlist','applied','oa','interview','offer','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prep_track as enum ('dsa','java','sql','aptitude');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prep_item_status as enum ('todo','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.difficulty as enum ('easy','medium','hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.round_result as enum ('pending','cleared','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.drive_status as enum ('open','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.drive_application_status as enum ('eligible','shortlisted','selected','rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  email      text not null unique,
  role       public.user_role not null default 'student',
  approved   boolean not null default false,
  branch     text,
  batch_year int,
  cgpa       numeric(4,2),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  role_title text not null default '',
  ctc        numeric(12,2),
  location   text,
  status     public.company_status not null default 'wishlist',
  applied_on date,
  deadline   date,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.rounds (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  type         text not null,
  scheduled_at timestamptz,
  result       public.round_result not null default 'pending',
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.prep_items (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  track       public.prep_track not null,
  topic       text not null,
  title       text not null,
  difficulty  public.difficulty not null default 'medium',
  status      public.prep_item_status not null default 'done',
  revise_due  date,
  n_revisions int not null default 0,
  solved_on   date,
  created_at  timestamptz not null default now()
);

create table if not exists public.topic_progress (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  track       public.prep_track not null,
  topic_index int not null,
  primary key (student_id, track, topic_index)
);

create table if not exists public.mock_tests (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  track      public.prep_track not null,
  score      int not null,
  max_score  int not null,
  taken_on   date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  version_label text not null,
  file_path     text not null,
  notes         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.drives (
  id              uuid primary key default gen_random_uuid(),
  officer_id      uuid not null references public.profiles(id),
  company_name    text not null,
  role_title      text not null default '',
  ctc             numeric(12,2),
  drive_date      date not null,
  eligibility_cgpa numeric(4,2),
  status          public.drive_status not null default 'open',
  created_at      timestamptz not null default now()
);

create table if not exists public.drive_applications (
  id         uuid primary key default gen_random_uuid(),
  drive_id   uuid not null references public.drives(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status     public.drive_application_status not null default 'eligible',
  created_at timestamptz not null default now(),
  unique (drive_id, student_id)
);

create table if not exists public.activity (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  code       text primary key,
  active     boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists companies_student_idx        on public.companies(student_id);
create index if not exists companies_student_status_idx on public.companies(student_id, status);
create index if not exists rounds_company_idx           on public.rounds(company_id);
create index if not exists prep_items_student_idx       on public.prep_items(student_id, track);
create index if not exists prep_items_revise_idx        on public.prep_items(student_id, revise_due) where revise_due is not null;
create index if not exists mock_tests_student_idx       on public.mock_tests(student_id, taken_on desc);
create index if not exists resumes_student_idx          on public.resumes(student_id);
create index if not exists drives_date_idx              on public.drives(drive_date);
create index if not exists drive_app_drive_idx          on public.drive_applications(drive_id);
create index if not exists drive_app_student_idx        on public.drive_applications(student_id);
create index if not exists activity_student_idx         on public.activity(student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so RLS cannot recurse)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_officer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or (role = 'officer' and approved))
  );
$$;

-- ---------------------------------------------------------------------------
-- Auth trigger: every new signup gets a profile.
--   • default role = student
--   • signup metadata { invite_code: "<code>" } matching an ACTIVE row in
--     invite_codes makes the user an approved officer — checked on the server,
--     never trusted from the client.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  v_code := new.raw_user_meta_data->>'invite_code';

  if v_code is not null and exists (
    select 1 from public.invite_codes where code = v_code and active
  ) then
    insert into public.profiles (id, name, email, role, approved, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      new.email,
      'officer',
      true,
      new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, name, email, role, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      new.email,
      'student',
      new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: only admins may change role or approved on profiles.
-- This is what makes "never trust a role sent from the client" hold.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role or new.approved is distinct from old.approved then
    if not public.is_admin() then
      raise exception 'Only admins can change role or approval status'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- RLS — enabled on EVERY table
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.companies          enable row level security;
alter table public.rounds             enable row level security;
alter table public.prep_items         enable row level security;
alter table public.topic_progress     enable row level security;
alter table public.mock_tests         enable row level security;
alter table public.resumes            enable row level security;
alter table public.drives             enable row level security;
alter table public.drive_applications enable row level security;
alter table public.activity           enable row level security;
alter table public.invite_codes       enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_officer());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'student');  -- backstop; trigger owns creation

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());  -- role/approved changes blocked by trigger

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Helper pattern for student-owned tables:
--   write  = own rows only
--   read   = own rows + approved officers (read-only)
drop policy if exists companies_all_own on public.companies;
create policy companies_all_own on public.companies for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists companies_officer_read on public.companies;
create policy companies_officer_read on public.companies for select to authenticated
  using (public.is_officer());

drop policy if exists rounds_all_own on public.rounds;
create policy rounds_all_own on public.rounds for all to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = company_id and c.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id = company_id and c.student_id = auth.uid()
  ));

drop policy if exists rounds_officer_read on public.rounds;
create policy rounds_officer_read on public.rounds for select to authenticated
  using (public.is_officer());

drop policy if exists prep_items_all_own on public.prep_items;
create policy prep_items_all_own on public.prep_items for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists prep_items_officer_read on public.prep_items;
create policy prep_items_officer_read on public.prep_items for select to authenticated
  using (public.is_officer());

drop policy if exists topic_progress_all_own on public.topic_progress;
create policy topic_progress_all_own on public.topic_progress for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists topic_progress_officer_read on public.topic_progress;
create policy topic_progress_officer_read on public.topic_progress for select to authenticated
  using (public.is_officer());

drop policy if exists mock_tests_all_own on public.mock_tests;
create policy mock_tests_all_own on public.mock_tests for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists mock_tests_officer_read on public.mock_tests;
create policy mock_tests_officer_read on public.mock_tests for select to authenticated
  using (public.is_officer());

drop policy if exists resumes_all_own on public.resumes;
create policy resumes_all_own on public.resumes for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists resumes_officer_read on public.resumes;
create policy resumes_officer_read on public.resumes for select to authenticated
  using (public.is_officer());

drop policy if exists activity_all_own on public.activity;
create policy activity_all_own on public.activity for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists activity_officer_read on public.activity;
create policy activity_officer_read on public.activity for select to authenticated
  using (public.is_officer());

-- drives: students may browse; officers/admins manage
drop policy if exists drives_read on public.drives;
create policy drives_read on public.drives for select to authenticated
  using (true);

drop policy if exists drives_officer_write on public.drives;
create policy drives_officer_write on public.drives for all to authenticated
  using (public.is_officer()) with check (public.is_officer());

-- drive_applications: students see their own; officers manage all
drop policy if exists drive_app_select on public.drive_applications;
create policy drive_app_select on public.drive_applications for select to authenticated
  using (student_id = auth.uid() or public.is_officer());

drop policy if exists drive_app_officer_write on public.drive_applications;
create policy drive_app_officer_write on public.drive_applications for all to authenticated
  using (public.is_officer()) with check (public.is_officer());

-- invite_codes: admins only
drop policy if exists invite_codes_admin on public.invite_codes;
create policy invite_codes_admin on public.invite_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: private `resumes` bucket, one folder per student (`{uid}/…`),
-- officers get read-only access to every folder.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists resumes_read on storage.objects;
create policy resumes_read on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_officer())
  );

drop policy if exists resumes_insert on storage.objects;
create policy resumes_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists resumes_delete on storage.objects;
create policy resumes_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
