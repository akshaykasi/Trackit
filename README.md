# Trackit

**Trackit** is a student-only campus placement tracker: one private workspace per student for the
application pipeline, daily problem-solving, spaced revision, mock tests, resume versions and
offers — wrapped in a placement & coding dashboard.

Every account sees **only its own data** (enforced by Postgres Row Level Security, not the UI).

## Features

- **Dashboard** — KPIs (problems solved, streak + best, daily goal, pipeline counts), quick
  problem log, topic coverage bars, 15-week consistency heatmap, this-week bars, difficulty
  split, pipeline funnel + quick-add table, and a revision queue driven by the spaced-repetition
  ladder.
- **Pipeline** — companies from wishlist → applied → OA → interview → offer/rejected, with
  rounds, results, deadlines, notes and CTC. Kanban board + detail timeline.
- **Prep tracks** — problem log with difficulty, topic checklists (DSA / Java / SQL / Aptitude)
  and a revision ladder (+1 / +3 / +7 / +14 days).
- **Mock tests** — score log with a trend chart and improvement detection.
- **Calendar** — rounds, deadlines and revision dues composed into one sorted list, with a
  “due within 3 days” callout on the dashboard.
- **Resume vault** — private storage bucket (`{uid}/…`), multiple versions, delete with cleanup.
- **Offers** — offers sorted by CTC with totals.

## Stack

- React 18 + TypeScript + Vite, Tailwind CSS v4, React Router, Recharts (code-split)
- Supabase: Postgres + RLS, Auth, Storage
- Vitest (unit tests for the pure logic in `src/lib`), Oxlint

## Local setup

```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev               # http://localhost:5173
```

Quality gates (all green in this repo):

```bash
npm run lint
npm test
npm run build
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_student_only.sql` (in that order).
3. Copy Project Settings → API values into `.env` (local) and your host's env vars (deployed).
4. **Auth → URL configuration**: set the Site URL to your production domain and add it to the
   redirect allow-list (plus `http://localhost:5173/**` for local dev).
5. Recommended for production: enable **email confirmation** and add a forgot-password flow
   before onboarding real users.

## Deploy (Vercel)

1. Push this repo to GitHub (see below).
2. In Vercel: **Add New → Project → Import** the repo. Vite is auto-detected — no config needed.
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project →
   Settings → Environment Variables), then redeploy.
4. Add the resulting `*.vercel.app` domain (or custom domain) to Supabase Auth → URL
   configuration, and set it as the Site URL.
5. Smoke-test on the live URL: signup → login → pipeline move → resume upload.

### Pushing to GitHub

```bash
git init
git add .
git commit -m "Trackit — student placement tracker"
git branch -M main
git remote add origin https://github.com/<you>/trackit.git
git push -u origin main
```

`.env` is git-ignored — secrets live only in Supabase project settings and your host's env vars.

## Test data

The database used during development contains two demo accounts (`aditi.trackit.test@gmail.com`,
`rahul.trackit.test@gmail.com`). Delete them from Supabase Auth → Users (or keep as demo data)
before going live.
