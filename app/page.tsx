import Link from "next/link";

const steps = [
  "Share your background and target role.",
  "Complete adaptive skill-gap tests.",
  "Follow a phased learning plan and publish progress.",
  "Match with sponsors when your score clears their threshold.",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <nav className="flex items-center justify-between">
        <span className="text-xl font-bold text-brand-700">Skillbridge</span>
        <Link className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-950" href="/apply">
          Apply now
        </Link>
      </nav>

      <section className="grid flex-1 items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
            Candidate growth, sponsor-ready proof
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Bridge skill gaps with measurable plans.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Skillbridge helps candidates identify gaps, complete role-specific tests, and share public progress profiles with companies ready to sponsor emerging talent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-950" href="/apply">
              Start candidate intake
            </Link>
            <Link className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700" href="/candidate/demo">
              View profile placeholder
            </Link>
            <Link className="px-4 py-3 font-semibold text-slate-600 hover:text-brand-700" href="/companies">
              For Companies
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <li className="flex gap-4" key={step}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {index + 1}
                </span>
                <span className="pt-1 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
