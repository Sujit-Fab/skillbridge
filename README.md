# Skillbridge

Skillbridge is a Next.js 14 application for candidate skill-gap assessment, phased learning plans, public progress profiles, and company sponsorship matching.

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- OpenAI API integration ready through environment configuration

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

3. Create a Supabase project and apply the migration in `supabase/migrations/20260719000000_create_skillbridge_schema.sql` using the Supabase CLI or SQL editor.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

The migration creates tables for candidates, skill gaps, tests, plans, progress, companies, and sponsorships. Supabase client helpers are available in `lib/supabase/client.ts` for browser components and `lib/supabase/server.ts` for server-side usage with auth cookies.

## Routes

- `/` — home page
- `/apply` — placeholder candidate intake form
- `/candidate/[candidateId]` — public candidate profile
