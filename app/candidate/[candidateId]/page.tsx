import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateOverallProgress,
  getCurrentPhaseNumber,
  phasesSchema,
  progressStatusSchema,
  type PhaseProgress,
} from "@/lib/progress";
import { LikeButton } from "./LikeButton";

type CandidateProfilePageProps = {
  params: {
    candidateId: string;
  };
};

export const dynamic = "force-dynamic";

const statusStyles = {
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  in_progress: "bg-amber-100 text-amber-700 ring-amber-200",
  not_started: "bg-slate-100 text-slate-500 ring-slate-200",
};

const statusIcons = {
  completed: "✓",
  in_progress: "•",
  not_started: "○",
};

function buildPhaseProgress(phasesJson: unknown, progressRows: Array<{ phase_number: number; status: string }>) {
  const parsedPhases = phasesSchema.parse(phasesJson);
  const progressByPhase = new Map(
    progressRows.map((row) => [row.phase_number, progressStatusSchema.catch("not_started").parse(row.status)]),
  );

  return parsedPhases.map<PhaseProgress>((phase, index) => {
    const phaseNumber = index + 1;

    return {
      phaseNumber,
      title: phase.title,
      status: progressByPhase.get(phaseNumber) ?? "not_started",
    };
  });
}

export default async function CandidateProfilePage({ params }: CandidateProfilePageProps) {
  const supabase = createAdminClient();

  if (!supabase) {
    console.error("Failed to initialize Supabase admin client for public candidate profile", {
      candidateId: params.candidateId,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    throw new Error("Failed to load candidate profile");
  }

  let candidateResult;

  try {
    candidateResult = await supabase
      .from("candidates")
      .select("id, name, target_role, is_public, likes_count")
      .eq("id", params.candidateId)
      .maybeSingle();
  } catch (error) {
    console.error("Supabase candidate profile query threw an unexpected error", {
      candidateId: params.candidateId,
      error,
    });
    throw new Error("Failed to load candidate profile");
  }

  const { data: candidate, error: candidateError } = candidateResult;

  if (candidateError) {
    console.error("Supabase candidate profile query failed", {
      candidateId: params.candidateId,
      error: candidateError,
    });
    throw new Error("Failed to load candidate profile");
  }

  if (!candidate) {
    console.info("Public candidate profile not found", { candidateId: params.candidateId });
    notFound();
  }

  if (!candidate.is_public) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Skillbridge profile</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">This profile is private</h1>
          <p className="mt-3 text-slate-600">The candidate has not made this achievement page public yet.</p>
        </section>
      </main>
    );
  }

  let planResult;
  let progressResult;
  let sponsorshipResult;

  try {
    [planResult, progressResult, sponsorshipResult] = await Promise.all([
      supabase.from("plans").select("phases").eq("candidate_id", candidate.id).maybeSingle(),
      supabase.from("progress").select("phase_number, status").eq("candidate_id", candidate.id),
      supabase
     .from("sponsorships")
     .select("company_id")
     .eq("candidate_id", candidate.id)
     .eq("status", "active")
     .limit(1)
     .maybeSingle(),
    ]);
  } catch (error) {
    console.error("Supabase candidate profile detail queries threw an unexpected error", {
      candidateId: candidate.id,
      error,
    });
    throw new Error("Failed to load candidate profile");
  }

  if (planResult.error) {
    console.error("Failed to fetch public candidate plan", {
      candidateId: candidate.id,
      error: planResult.error,
    });
  }

  if (progressResult.error) {
    console.error("Failed to fetch public candidate progress", {
      candidateId: candidate.id,
      error: progressResult.error,
    });
  }

  if (sponsorshipResult.error) {
    console.error("Failed to fetch public candidate sponsorship", {
      candidateId: candidate.id,
      error: sponsorshipResult.error,
    });
  }

  const phases = buildPhaseProgress(planResult.data?.phases ?? [], progressResult.data ?? []);
  const overallProgress = calculateOverallProgress(phases);
  const currentPhaseNumber = getCurrentPhaseNumber(phases);
  let companyName: string | undefined;

  if (sponsorshipResult.data?.company_id) {
    const { data: companyRow } = await supabase
      .from("companies")
      .select("name")
      .eq("id", sponsorshipResult.data.company_id)
      .maybeSingle();

    companyName = companyRow?.name;
  }
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="bg-slate-950 px-6 py-8 text-white sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-200">Achievement page</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{candidate.name}</h1>
              <p className="mt-3 text-lg text-slate-200">Target role: {candidate.target_role}</p>
            </div>
            <LikeButton candidateId={candidate.id} initialLikesCount={candidate.likes_count ?? 0} />
          </div>
          {companyName ? (
            <div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-brand-100 ring-1 ring-white/20">
              Sponsored by {companyName}
            </div>
          ) : null}
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Overall progress</p>
                <p className="mt-1 text-4xl font-bold text-slate-950">{overallProgress}%</p>
              </div>
              <p className="text-sm font-medium text-slate-600">
                Phase {currentPhaseNumber} of {phases.length}
              </p>
            </div>
            <div className="mt-6">
              <div className="relative h-4 rounded-full bg-slate-200">
                <div className="h-4 rounded-full bg-brand-600" style={{ width: `${overallProgress}%` }} />
                {[25, 50, 75, 100].map((marker) => (
                  <span
                    key={marker}
                    className="absolute top-1/2 h-7 w-0.5 -translate-y-1/2 bg-white shadow-sm"
                    style={{ left: `${marker}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 text-xs font-semibold text-slate-500">
                {[25, 50, 75, 100].map((marker) => (
                  <span key={marker} className="text-right">{marker}%</span>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">Milestone checklist</h2>
            <div className="mt-4 grid gap-3">
              {phases.length > 0 ? phases.map((phase) => (
                <article key={phase.phaseNumber} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1 ${statusStyles[phase.status]}`}>
                    {statusIcons[phase.status]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Phase {phase.phaseNumber}</p>
                    <h3 className="font-semibold text-slate-950">{phase.title}</h3>
                  </div>
                </article>
              )) : (
                <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-slate-600">No milestones have been published yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
