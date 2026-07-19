export default function ApplyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Candidate intake</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Tell us where you want to grow.</h1>
      <p className="mt-4 text-slate-600">
        This placeholder will collect candidate profile details, target roles, and consent to create a public progress profile.
      </p>
      <form className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ada Lovelace" type="text" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Target role</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Frontend Engineer" type="text" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Bio</span>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Briefly describe your experience and goals." />
        </label>
        <button className="rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white" type="button">
          Save draft (placeholder)
        </button>
      </form>
    </main>
  );
}
