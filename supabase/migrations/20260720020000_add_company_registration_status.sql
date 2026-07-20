alter table public.companies
  add column if not exists contact_email text;

update public.companies
set contact_email = lower(replace(name, ' ', '-')) || '@example.com'
where contact_email is null;

alter table public.companies
  alter column contact_email set not null;

alter table public.companies
  add column if not exists status text not null default 'pending';

update public.companies
set status = 'approved'
where status = 'pending';
