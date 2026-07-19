type CandidateProfilePageProps = {
  params: {
    id: string;
  };
};

export default function CandidateProfilePage({ params }: CandidateProfilePageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Public candidate profile</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Candidate {params.id}</h1>
      <p className="mt-4 text-slate-600">
        This placeholder will show the candidate bio, target role, skill gaps, test scores, learning plan phases, progress, and sponsorship status.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {["Skill gaps", "Learning plan", "Sponsorship"].map((title) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={title}>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">Placeholder content connected to Supabase data soon.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
