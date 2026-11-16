-- ============================================================================
-- Trackit — student-only demo seed (OPTIONAL, fresh test accounts only)
--
-- HOW TO USE
--   1. Edit the two emails below to your test accounts.
--   2. Sign in once with each account (the signup trigger creates profiles).
--   3. Run this file in the Supabase SQL editor.
--
-- ⚠ Running this on accounts that already have data (e.g. after a previous
--   run) inserts DUPLICATE demo rows. Fresh accounts only.
--
-- Result: a few companies + rounds, prep items, mock tests and activity days
-- per student — enough to light up the pipeline, readiness score and streak.
-- ============================================================================

with student_emails as (
  select unnest(array[
    'aditi.trackit.test@gmail.com',
    'rahul.trackit.test@gmail.com'
  ]::text[]) as email
)

-- ---------------------------------------------------------------------------
-- Companies (2–3 per student, across pipeline stages)
-- ---------------------------------------------------------------------------
insert into public.companies (student_id, name, role_title, ctc, location, status, applied_on, deadline, notes)
select p.id, v.name, v.role_title, v.ctc, v.location, v.status::public.company_status,
       v.applied_on::date, v.deadline::date, v.notes
from student_emails s
join public.profiles p on p.email = s.email
cross join (values
  ('Infosys',  'Systems Engineer',           450000, 'Bengaluru', 'applied',   '2026-10-02', '2026-11-20', 'Referral used; OA link expected by mail'),
  ('Zoho',     'Member Technical Staff',     620000, 'Chennai',   'offer',     '2026-09-28', '2026-11-05', 'Offer received 30 Oct — 15 days to accept'),
  ('TCS',      'Assistant System Engineer',  350000, 'Remote',    'wishlist',  null,         null,         null)
) as v(name, role_title, ctc, location, status, applied_on, deadline, notes);

-- Rounds for the interview-stage company of the first student
insert into public.rounds (company_id, type, scheduled_at, result, notes)
select c.id, v.type, v.scheduled_at::timestamptz, v.result::public.round_result, v.notes
from public.profiles p
join public.companies c on c.student_id = p.id and c.name = 'Zoho'
join (values
  ('Online assessment', '2026-10-05 10:00+05:30', 'cleared', '3 questions, all pass'),
  ('Technical interview', '2026-10-18 11:30+05:30', 'cleared', 'DS + project discussion'),
  ('HR interview', '2026-10-30 16:00+05:30', 'cleared', 'Offer confirmed in mail')
) as v(type, scheduled_at, result, notes) on true
where p.email = (select email from student_emails limit 1);

-- ---------------------------------------------------------------------------
-- Prep items (a few per student; some due for revision today for the first)
-- ---------------------------------------------------------------------------
insert into public.prep_items (student_id, track, topic, title, difficulty, status, revise_due, n_revisions, solved_on)
select p.id, v.track::public.prep_track, v.topic, v.title, v.difficulty::public.difficulty,
       v.status::public.prep_item_status, v.revise_due::date, v.n_revisions, v.solved_on::date
from student_emails s
join public.profiles p on p.email = s.email
cross join (values
  ('dsa', 'Arrays',  'Two Sum',                      'easy',   'done', current_date, 1, current_date - 7),
  ('dsa', 'Graphs',  'Course Schedule',              'medium', 'done', current_date, 0, current_date - 4),
  ('dsa', 'DP',      'Climbing Stairs',              'easy',   'done', current_date + 3, 2, current_date - 10),
  ('java', 'OOP',    'Interface vs abstract class',  'easy',   'done', null, 0, current_date - 2),
  ('java', 'Collections', 'HashMap internals',        'medium', 'done', null, 0, current_date - 1),
  ('sql', 'Joins',   'Find duplicate rows',          'easy',   'done', null, 0, current_date - 3),
  ('sql', 'Window functions', 'Running total query', 'medium','done', null, 0, current_date - 5),
  ('aptitude', 'Quantitative', 'Time and work set 1', 'easy',  'done', null, 0, current_date - 6),
  ('aptitude', 'Logical',    'Blood relations set 2','easy',   'done', null, 0, current_date - 2)
) as v(track, topic, title, difficulty, status, revise_due, n_revisions, solved_on);

-- Topic progress: first three topics done in DSA for each student
insert into public.topic_progress (student_id, track, topic_index)
select p.id, 'dsa'::public.prep_track, g.i
from student_emails s
join public.profiles p on p.email = s.email
cross join generate_series(0, 2) as g(i);

-- ---------------------------------------------------------------------------
-- Mock tests (last 3 per student feed the readiness score)
-- ---------------------------------------------------------------------------
insert into public.mock_tests (student_id, track, score, max_score, taken_on)
select p.id, v.track::public.prep_track, v.score, v.max_score, v.taken_on::date
from student_emails s
join public.profiles p on p.email = s.email
cross join (values
  ('dsa',      7, 10, current_date - 2),
  ('sql',      8, 10, current_date - 5),
  ('aptitude', 6, 10, current_date - 9)
) as v(track, score, max_score, taken_on);

-- ---------------------------------------------------------------------------
-- Activity: 10 active days in the last 14 (streak + consistency)
-- ---------------------------------------------------------------------------
insert into public.activity (student_id, kind, created_at)
select p.id, 'prep_solved'::text, (current_date - g.d)::timestamptz + interval '10 hours'
from student_emails s
join public.profiles p on p.email = s.email
cross join unnest(array[0,1,2,3,4,5,6,8,9,12]) as g(d);
