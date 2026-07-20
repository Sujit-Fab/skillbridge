import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { generatedTestSchema } from "@/lib/test-schemas";

import TestForm from "./TestForm";

type CandidateTestPageProps = {
  params: {
    candidateId: string;
  };
};

export default async function CandidateTestPage({ params }: CandidateTestPageProps) {
  const supabase = createClient();

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, target_role")
    .eq("id", params.candidateId)
    .single();

  if (candidateError || !candidate) {
    notFound();
  }

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, phase_number, questions, score")
    .eq("candidate_id", params.candidateId)
    .eq("phase_number", 1)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (testError) {
    throw testError;
  }

  const parsedTest = test ? generatedTestSchema.safeParse({ questions: test.questions }) : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Adaptive baseline test</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{candidate.name}&apos;s {candidate.target_role} test</h1>
      <p className="mt-4 text-slate-600">
        Answer each generated question. Your score will update the baseline test record for phase 1.
      </p>

      {!test ? (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No baseline test has been generated for this candidate yet. Create one with <code>POST /api/generate-test</code>.
        </section>
      ) : null}

      {test && !parsedTest?.success ? (
        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          This test record has invalid question data and cannot be rendered.
        </section>
      ) : null}

      {test && parsedTest?.success ? (
        <>
          {typeof test.score === "number" ? (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-950">
              Current saved score: {test.score}%
            </div>
          ) : null}
          <TestForm candidateId={params.candidateId} questions={parsedTest.data.questions} testId={test.id} />
        </>
      ) : null}
    </main>
  );
}
