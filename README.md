# Skillbridge

Skillbridge is an AI-guided platform that turns unemployment into a funded, structured path to a job. A candidate describes their experience and target role; AI analyzes the skill gap, administers an adaptive test, and generates a phased learning plan. Progress is tracked publicly, and partner companies can browse ready candidates and sponsor their journey — closing the loop between AI coaching and real hiring.

Built for the OpenAI Build Week Challenge.

**Live demo:** https://skillbridge-delta-three.vercel.app
**Repo:** https://github.com/Sujit-Fab/skillbridge

## How it works

1. **Candidate intake** — a job seeker describes their experience, skills, and target role in their own words at `/apply`.
2. **AI skill-gap analysis** — GPT-5.6 parses the free-text profile into structured current skills and gap skills against the target role.
3. **Adaptive test** — GPT-5.6 generates 5–8 role-specific questions calibrated to the candidate's gaps; answers are scored automatically.
4. **Learning plan** — GPT-5.6 generates a 3–5 phase roadmap (skill focus, resources, checkpoint task) based on the gaps and test score.
5. **Progress tracking** — candidates mark phases complete as they go; overall progress is calculated and shown on a milestone bar (25/50/75/100%).
6. **Public achievement page** — a shareable, public profile showing progress, milestones, and a cheer/like counter.
7. **Browse companies** — candidates and the public can see participating sponsor companies at `/companies`.
8. **View matched candidates** — companies see public candidates whose test scores and target role match their needs, along with an AI-generated one-line fit summary.
9. **Sponsor** — a company can sponsor a candidate directly from the dashboard.
10. **Badge appears on candidate profile** — the sponsorship is reflected publicly on the candidate's achievement page, closing the loop.

## Built with Codex + GPT-5.6

Skillbridge was scaffolded and built almost entirely through ChatGPT Codex, which generated the Next.js project structure, Supabase schema migrations, API routes, and UI components across roughly 15 sequential tasks — from initial scaffolding through the candidate flow, progress tracking, the public achievement page, and the corporate dashboard.

GPT-5.6 is called at runtime in three places:
- `app/api/analyze/route.ts` — parses a candidate's free-text bio into structured skill gaps against their target role
- `app/api/generate-test/route.ts` — generates 5–8 role-specific adaptive test questions calibrated to those gaps
- `app/api/score-test/route.ts` — scores submitted answers and triggers `app/api/generate-plan/route.ts`, which builds a phased learning roadmap from the results

GPT-5.6 also generates the one-line "fit summary" shown to companies on the corporate dashboard, via `lib/company-dashboard.ts`.

**Codex session reference:** [ADD SESSION ID]

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Backend / Auth / DB:** Supabase (Postgres + Auth)
- **AI:** OpenAI API (GPT-5.6) for skill-gap analysis, adaptive testing, plan generation, and fit summaries
- **Build tool:** ChatGPT Codex
- **Hosting:** Vercel

## Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/apply` | Candidate intake form + AI skill-gap analysis |
| `/test/[candidateId]` | Adaptive test |
| `/plan/[candidateId]` | Learning plan + progress tracking |
| `/candidate/[candidateId]` | Public candidate achievement profile |
| `/companies` | Corporate dashboard — browse sponsor companies |
| `/companies/[companyId]` | Matched candidates + sponsor action |

## Getting started locally

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Sujit-Fab/skillbridge.git
   cd skillbridge
   npm install
   ```

2. Copy the environment template and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   You'll need:
   - Supabase project URL, anon key, and service role key
   - OpenAI API key

3. Set up the database — create a Supabase project, then apply **all** SQL files in `supabase/migrations/` in chronological order (oldest filename first), using the Supabase CLI or the SQL editor in the Supabase dashboard. The migrations create the schema and seed initial data; running them out of order or skipping any will cause missing-column errors.

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Database schema

The migrations create tables for `candidates`, `skill_gaps`, `tests`, `plans`, `progress`, `companies`, and `sponsorships`. Supabase client helpers live in `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` / `lib/supabase/admin.ts` (server-side, service-role access used for public read paths).

## What's working / known limitations

Full candidate journey (intake → AI skill-gap analysis → adaptive test → scoring → learning plan → progress tracking → public achievement page) and the full corporate flow (browse companies → view matched candidates → sponsor → badge reflected on candidate profile) are live and tested end-to-end in production.

Known limitations, scoped out deliberately for the hackathon timeline:
- No company authentication — anyone can browse `/companies` and act as any company for demo purposes.
- Sponsorship amount is a fixed placeholder ($500) rather than a configurable or real payment flow.
- Row Level Security is not yet configured on Supabase tables; access currently relies on server-side service-role queries rather than RLS policies. Would need proper policies before any production use.

## Team

[ADD name(s) / handles]

## License

[ADD license, e.g. MIT — or omit if not decided]
