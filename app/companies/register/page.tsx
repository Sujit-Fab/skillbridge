import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RegisterCompanyPageProps = {
  searchParams?: { submitted?: string };
};

async function registerCompany(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const targetRoles = String(formData.get("target_roles") ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const scoreThreshold = Number(formData.get("score_threshold") ?? 0);

  if (!name || !contactEmail || !Number.isFinite(scoreThreshold)) {
    throw new Error("Company name, contact email, and score threshold are required.");
  }

  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Failed to submit company registration.");
  }

  const { error } = await supabase.from("companies").insert({
    name,
    contact_email: contactEmail,
    target_roles: targetRoles,
    score_threshold: scoreThreshold,
    status: "pending",
  });

  if (error) {
    console.error("Failed to register company", { error });
    throw new Error("Failed to submit company registration.");
  }

  redirect("/companies/register?submitted=1");
}

export default function RegisterCompanyPage({ searchParams }: RegisterCompanyPageProps) {
  const isSubmitted = searchParams?.submitted === "1";

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-slate-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-brand-700 hover:text-brand-800" href="/companies">
          ← Back to companies
        </Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Company registration</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Register your company</h1>
          <p className="mt-3 text-slate-600">
            Tell us who you are looking to sponsor. We will keep this MVP flow simple and review new companies before they appear publicly.
          </p>

          {isSubmitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-800" role="status">
              Thanks — your application is under review.
            </div>
          ) : null}

          <form action={registerCompany} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Company name</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" name="name" placeholder="Acme Talent Partners" required type="text" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Contact email</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" name="contact_email" placeholder="talent@example.com" required type="email" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Target roles</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" name="target_roles" placeholder="Junior Backend Developer, Data Analyst" type="text" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Score threshold</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" min="0" name="score_threshold" placeholder="70" required step="1" type="number" />
            </label>
            <button className="rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-800" type="submit">
              Submit for review
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
