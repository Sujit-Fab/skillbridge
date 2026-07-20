"use client";

import { useRouter } from "next/navigation";

type CompanyOption = {
  id: string;
  name: string;
};

export function CompanySwitcher({ companies, currentCompanyId }: { companies: CompanyOption[]; currentCompanyId: string }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
      <label htmlFor="companyId" className="block text-sm font-semibold text-brand-100">Switch company</label>
      <select
        id="companyId"
        value={currentCompanyId}
        onChange={(event) => router.push(`/companies/${event.currentTarget.value}`)}
        className="mt-2 w-full rounded-xl border-0 px-3 py-2 text-slate-950"
      >
        {companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  );
}
