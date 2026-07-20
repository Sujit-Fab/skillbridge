import { notFound } from "next/navigation";

import { calculateCandidateProgress, getOrCreateFitSummary } from "@/lib/company-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { CompanySwitcher } from "./CompanySwitcher";
import { SponsorButton } from "./SponsorButton";

export const dynamic = "force-dynamic";

type Company = { id: string; name: string; target_roles: string[] | null };
type Candidate = { id: string; name: string; target_role: string; fit_summary: string | null };

type CompanyCandidatesPageProps = {
  params: { companyId: string };
};

export default async function CompanyCandidatesPage({ params }: CompanyCandidatesPageProps) {
  const supabase = createAdminClient();

  if (!supabase) {
    console.error("Failed to initialize Supabase admin client for company candidates page", {
      companyId: params.companyId,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    throw new Error("Failed to load company dashboard");
  }

  const [{ data: companies, error: companiesError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from("companies").select("id, name, target_roles").eq("status", "approved").order("name", { ascending: true }),
    supabase.from("companies").select("id, name, target_roles").eq("id", params.companyId).eq("status", "approved").maybeSingle(),
  ]);

  if (companiesError || companyError) {
    console.error("Failed to fetch company dashboard data", { companiesError, companyError, companyId: params.companyId });
    throw new Error("Failed to load company dashboard");
  }

  if (!company) {
    notFound();
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, name, target_role, fit_summary")
    .eq("is_public", true);

  if (candidatesError) {
    console.error("Failed to fetch public candidates", { error: candidatesError });
    throw new Error("Failed to load candidates");
  }

  const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
  const [
    { data: tests },
    { data: progressRows },
    { data: plans },
    { data: gaps },
    { data: sponsorships, error: sponsorshipsError },
  ] = await Promise.all([
    candidateIds.length
      ? supabase.from("tests").select("candidate_id, phase_number, score").in("candidate_id", candidateIds).not("score", "is", null)
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase.from("progress").select("candidate_id, phase_number, status").in("candidate_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase.from("plans").select("candidate_id, phases").in("candidate_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase.from("skill_gaps").select("candidate_id, skill_name").in("candidate_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase
        .from("sponsorships")
        .select("candidate_id")
        .eq("company_id", params.companyId)
        .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sponsorshipsError) {
    console.error("Failed to fetch active sponsorships for company candidates page", {
      error: sponsorshipsError,
      companyId: params.companyId,
    });
    throw new Error("Failed to load sponsorship status");
  }

  const testsByCandidate = new Map<string, Array<{ phase_number: number; score: number }>>();
  (tests ?? []).forEach((test) => {
    const score = Number(test.score);
    if (Number.isFinite(score)) {
      testsByCandidate.set(test.candidate_id, [...(testsByCandidate.get(test.candidate_id) ?? []), { phase_number: test.phase_number, score }]);
    }
  });

  const progressByCandidate = new Map<string, Array<{ phase_number: number; status: string }>>();
  (progressRows ?? []).forEach((row) => {
    progressByCandidate.set(row.candidate_id, [...(progressByCandidate.get(row.candidate_id) ?? []), row]);
  });

  const plansByCandidate = new Map((plans ?? []).map((plan) => [plan.candidate_id, plan.phases]));
  const gapsByCandidate = new Map<string, string[]>();
  (gaps ?? []).forEach((gap) => {
    gapsByCandidate.set(gap.candidate_id, [...(gapsByCandidate.get(gap.candidate_id) ?? []), gap.skill_name]);
  });
  const sponsoredCandidateIds = new Set((sponsorships ?? []).map((sponsorship) => sponsorship.candidate_id));

  const candidateCards = await Promise.all(
    ((candidates ?? []) as Candidate[]).flatMap((candidate) => {
      const candidateTests = testsByCandidate.get(candidate.id) ?? [];
      if (candidateTests.length === 0) {
        return [];
      }

      const latestTest = [...candidateTests].sort((a, b) => b.phase_number - a.phase_number)[0];

      return [{
        ...candidate,
        latestScore: latestTest.score,
        progress: calculateCandidateProgress(plansByCandidate.get(candidate.id) ?? [], progressByCandidate.get(candidate.id) ?? []),
        gapSkills: gapsByCandidate.get(candidate.id) ?? [],
        alreadySponsoring: sponsoredCandidateIds.has(candidate.id),
      }];
    }).map(async (candidate) => ({
      ...candidate,
      fitSummary: await getOrCreateFitSummary({
        supabase,
        candidateId: candidate.id,
        existingSummary: candidate.fit_summary,
        targetRole: candidate.target_role,
        gapSkills: candidate.gapSkills,
        score: candidate.latestScore,
      }),
    })),
  );

  candidateCards.sort((a, b) => b.latestScore - a.latestScore);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-slate-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-200">Company candidate matches</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{company.name}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {((company as Company).target_roles ?? []).map((role) => (
                  <span key={role} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-brand-100 ring-1 ring-white/20">{role}</span>
                ))}
              </div>
            </div>
            <CompanySwitcher companies={((companies ?? []) as Company[]).map(({ id, name }) => ({ id, name }))} currentCompanyId={params.companyId} />
          </div>
        </div>

        <div className="grid gap-5">
          {candidateCards.length > 0 ? candidateCards.map((candidate) => (
            <article key={candidate.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{candidate.name}</h2>
                  <p className="mt-1 text-slate-600">Target role: {candidate.target_role}</p>
                  <p className="mt-3 text-slate-700">{candidate.fitSummary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-80">
                  <div className="rounded-2xl bg-brand-50 p-4 text-center">
                    <p className="text-sm font-semibold text-brand-700">Latest score</p>
                    <p className="mt-1 text-3xl font-bold text-slate-950">{candidate.latestScore}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-sm font-semibold text-slate-500">Phase progress</p>
                    <p className="mt-1 text-3xl font-bold text-slate-950">{candidate.progress}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <SponsorButton candidateId={candidate.id} companyId={params.companyId} alreadySponsoring={candidate.alreadySponsoring} />
              </div>
            </article>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">No public candidates have completed a scored test yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
