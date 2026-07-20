alter table public.candidates
  add column if not exists fit_summary text;

create unique index if not exists sponsorships_candidate_company_unique
  on public.sponsorships(candidate_id, company_id);

do $$
begin
  if not exists (select 1 from public.companies) then
    insert into public.companies (name, target_roles) values
      ('TechNova Solutions', array['Junior Backend Developer', 'Junior Data Analyst']),
      ('BrightPath Analytics', array['Junior Data Analyst']),
      ('CloudForge Systems', array['Junior Backend Developer']);
  end if;
end $$;
