create extension if not exists "pgcrypto";

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio_text text,
  target_role text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_roles text[] not null default '{}',
  score_threshold numeric not null default 0
);

create table public.skill_gaps (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  skill_name text not null,
  gap_level jsonb not null default '{}'::jsonb
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  phase_number integer not null,
  questions jsonb not null default '[]'::jsonb,
  score numeric
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  phases jsonb not null default '[]'::jsonb
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  phase_number integer not null,
  status text not null default 'not_started',
  completed_at timestamptz
);

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  amount_committed numeric not null default 0,
  status text not null default 'pending'
);
