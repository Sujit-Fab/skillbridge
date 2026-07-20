import Link from "next/link";
import { notFound } from "next/navigation";

import {
  calculateOverallProgress,
  getCurrentPhaseNumber,
  phasesSchema,
  progressStatusSchema,
  type PhaseProgress,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

type CandidatePlanPageProps = {
  params: {
    candidateId: string;
  };
};

const statusStyles = {
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  in_progress: "bg-amber-100 text-amber-700 ring-amber-200",
  not_started: "bg-slate-100 text-slate-500 ring-slate-200",
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

export default async function CandidatePlanPage({ params }: CandidatePlanPageProps) {
  const supabase = createClient();

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, target_role")
    .eq("id", params.candidateId)
    .single();

  if (candidateError || !candidate) {
    notFound();
  }

  const [{ data: plan }, { data: progressRows }] = await Promise.all([
    supabase.from("plans").select("phases").eq("candidate_id", candidate.id).maybeSingle(),
    supabase.from("progress").select("phase_number, status").eq("candidate_id", candidate.id),
  ]);

  const phases = buildPhaseProgress(plan?.phases ?? [], progressRows ?? []);
  const overallProgress = calculateOverallProgress(phases);
  const currentPhaseNumber = getCurrentPhaseNumber(phases);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Learning plan</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{candidate.name}&apos;s {candidate.target_role} plan</h1>
      <p className="mt-4 text-slate-600">
        Review the phased milestones Skillbridge recommends based on your skill gap analysis and baseline test.
      </p>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">Overall progress</p>
            <p className="mt-1 text-4xl font-bold text-slate-950">{overallProgress}%</p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            Phase {currentPhaseNumber} of {phases.length}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-950">Milestones</h2>
        <div className="mt-4 grid gap-4">
          {phases.length > 0 ? phases.map((phase) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={phase.phaseNumber}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Phase {phase.phaseNumber}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{phase.title}</h3>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusStyles[phase.status]}`}>
                  {phase.status.replace("_", " ")}
                </span>
              </div>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              Your learning plan is not available yet. Please check back once your assessment has been reviewed.
            </div>
          )}
        </div>
      </section>

      <Link className="mt-8 inline-flex rounded-full border border-brand-200 px-5 py-2.5 font-semibold text-brand-700" href={`/candidate/${candidate.id}`}>
        View public profile
      </Link>
    </main>
  );
}
