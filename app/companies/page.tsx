import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EXPECTED_SUPABASE_PROJECT_REF = "koarsdupbvravvygrqoa";
const COMPANIES_SELECT_COLUMNS = "id, name, target_roles";

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? null;

const getSupabaseProjectRef = (supabaseUrl: string | null) => {
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
};

const getCompaniesQueryLog = (supabaseUrl: string | null) => ({
  description: `from("companies").select("${COMPANIES_SELECT_COLUMNS}", { count: "exact" }).order("name", { ascending: true })`,
  table: "companies",
  select: COMPANIES_SELECT_COLUMNS,
  filters: [],
  joins: [],
  order: { column: "name", ascending: true },
  restUrl: supabaseUrl
    ? `${supabaseUrl}/rest/v1/companies?select=${encodeURIComponent(COMPANIES_SELECT_COLUMNS)}&order=name.asc`
    : null,
});

type Company = {
  id: string;
  name: string;
  target_roles: string[] | null;
};

export default async function CompaniesPage() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseProjectRef = getSupabaseProjectRef(supabaseUrl);
  const queryLog = getCompaniesQueryLog(supabaseUrl);

  console.info("Supabase companies page configuration", {
    supabaseUrl,
    supabaseProjectRef,
    expectedSupabaseProjectRef: EXPECTED_SUPABASE_PROJECT_REF,
    matchesExpectedProject: supabaseProjectRef === EXPECTED_SUPABASE_PROJECT_REF,
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  });

  if (supabaseProjectRef !== EXPECTED_SUPABASE_PROJECT_REF) {
    console.error("Companies page Supabase URL does not match the expected project", {
      supabaseUrl,
      supabaseProjectRef,
      expectedSupabaseProjectRef: EXPECTED_SUPABASE_PROJECT_REF,
    });
  }

  const supabase = createAdminClient();

  if (!supabase) {
    console.error("Failed to initialize Supabase admin client for companies page", {
      supabaseUrl,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    throw new Error("Failed to load companies");
  }

  let companies: Company[] = [];

  try {
    console.info("Running Supabase companies query", queryLog);

    const response = await supabase
      .from("companies")
      .select(COMPANIES_SELECT_COLUMNS, { count: "exact" })
      .order("name", { ascending: true });

    const { data, error, count, status, statusText } = response;

    console.info("Raw Supabase companies response", {
      query: queryLog,
      data,
      error,
      count,
      rowCount: data?.length ?? 0,
      status,
      statusText,
    });

    if (error) {
      console.error("Failed to fetch companies with Supabase admin client", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
        status,
        statusText,
      });
      throw new Error("Failed to load companies");
    }

    companies = data ?? [];
  } catch (error) {
    console.error("Supabase companies query threw an unexpected error", { query: queryLog, error });
    throw new Error("Failed to load companies");
  }

  if (companies.length === 0) {
    console.warn("Supabase admin client returned zero companies for companies page", {
      query: queryLog,
      supabaseUrl,
      supabaseProjectRef,
      expectedSupabaseProjectRef: EXPECTED_SUPABASE_PROJECT_REF,
      matchesExpectedProject: supabaseProjectRef === EXPECTED_SUPABASE_PROJECT_REF,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      rowCount: companies.length,
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-slate-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Corporate dashboard</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Companies</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Browse sponsor companies and review public candidates who are ready for role-aligned support.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.length ? companies.map((company) => (
            <article key={company.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">{company.name}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(company.target_roles ?? []).map((role) => (
                  <span key={role} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
                    {role}
                  </span>
                ))}
              </div>
              <Link href={`/companies/${company.id}`} className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                View candidates
              </Link>
            </article>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">No companies have been added yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
