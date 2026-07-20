"use client";

import { useState, useTransition } from "react";

type SponsorButtonProps = {
  candidateId: string;
  companyId: string;
  alreadySponsoring: boolean;
};

export function SponsorButton({ candidateId, companyId, alreadySponsoring }: SponsorButtonProps) {
  const [status, setStatus] = useState(alreadySponsoring ? "already" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status === "already") {
    return <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Already sponsoring</span>;
  }

  if (status === "sponsored") {
    return <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Sponsored ✓</span>;
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const response = await fetch("/api/sponsorships", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidate_id: candidateId, company_id: companyId }),
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
              setErrorMessage(payload.error ?? "Unable to sponsor right now");
              return;
            }

            setErrorMessage(null);
            setStatus(payload.alreadyExists ? "already" : "sponsored");
          });
        }}
        className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sponsoring..." : "Sponsor this candidate"}
      </button>
      {errorMessage ? <span className="text-sm font-medium text-red-600">{errorMessage}</span> : null}
    </div>
  );
}
