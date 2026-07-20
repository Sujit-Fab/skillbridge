"use client";

import { useState } from "react";

type SponsorButtonProps = {
  candidateId: string;
  companyId: string;
  alreadySponsoring: boolean;
};

type SponsorStatus = "idle" | "already" | "sponsored";

export function SponsorButton({ candidateId, companyId, alreadySponsoring }: SponsorButtonProps) {
  const [status, setStatus] = useState<SponsorStatus>(alreadySponsoring ? "already" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sponsorCandidate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, company_id: companyId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.sponsorship?.id) {
        setErrorMessage(payload.error ?? "Unable to sponsor this candidate. Please try again.");
        return;
      }

      setStatus(payload.alreadyExists ? "already" : "sponsored");
    } catch (error) {
      console.error("Sponsor button request failed", { error, candidateId, companyId });
      setErrorMessage("Unable to sponsor this candidate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "already") {
    return (
      <div className="inline-flex flex-col gap-2" data-sponsor-state="already">
        <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Already sponsoring</span>
      </div>
    );
  }

  if (status === "sponsored") {
    return (
      <div className="inline-flex flex-col gap-2" data-sponsor-state="sponsored">
        <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Sponsored ✓</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-2" data-sponsor-state="idle">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={sponsorCandidate}
        className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sponsoring..." : "Sponsor this candidate"}
      </button>
      {errorMessage ? (
        <span role="alert" className="text-sm font-medium text-red-600">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
