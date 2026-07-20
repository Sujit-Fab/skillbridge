import { revalidatePath } from "next/cache";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Company = {
  id: string;
  name: string;
  contact_email: string;
  target_roles: string[] | null;
  score_threshold: number;
  status: string;
};

async function approveCompany(formData: FormData) {
  "use server";

  const companyId = String(formData.get("company_id") ?? "").trim();

  if (!companyId) {
    throw new Error("Missing company id.");
  }

  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Failed to approve company.");
  }

  const { error } = await supabase
    .from("companies")
    .update({ status: "approved" })
    .eq("id", companyId);

  if (error) {
    console.error("Failed to approve company", { error, companyId });
    throw new Error("Failed to approve company.");
  }

  revalidatePath("/admin/companies");
  revalidatePath("/companies");
}

export default async function AdminCompaniesPage() {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Failed to load companies.");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, contact_email, target_roles, score_threshold, status")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load admin companies", { error });
    throw new Error("Failed to load companies.");
  }

  const companies = (data ?? []) as Company[];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Admin review</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Company applications</h1>
          {/* Hackathon MVP: this admin screen intentionally has no authentication or authorization. Do not use this pattern in production. */}
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Hackathon-scoped approval queue for company registrations. Pending companies can be approved to appear on the public companies page.
          </p>
          <Link className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800" href="/companies">
            View public companies
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Threshold</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-5 py-4 font-semibold text-slate-950">{company.name}</td>
                  <td className="px-5 py-4 text-slate-600">{company.contact_email}</td>
                  <td className="px-5 py-4 text-slate-600">{(company.target_roles ?? []).join(", ") || "Any role"}</td>
                  <td className="px-5 py-4 text-slate-600">{company.score_threshold}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{company.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {company.status === "pending" ? (
                      <form action={approveCompany}>
                        <input name="company_id" type="hidden" value={company.id} />
                        <button className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800" type="submit">
                          Approve
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-400">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 ? (
            <p className="p-6 text-slate-600">No company applications yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
