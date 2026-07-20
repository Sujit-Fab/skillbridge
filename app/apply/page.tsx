"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AnalysisResult = {
  candidate_id: string;
  current_skills: string[];
  gap_skills: string[];
  experience_level: "entry" | "junior" | "mid" | "senior";
};

export default function ApplyPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          target_role: formData.get("target_role"),
          bio_text: formData.get("bio_text"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to analyze candidate profile");
      }

      setResult(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to analyze candidate profile",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartSkillTest() {
    if (!result) {
      return;
    }

    setError(null);
    setIsGeneratingTest(true);

    try {
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: result.candidate_id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate baseline test");
      }

      router.push(`/test/${result.candidate_id}`);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate baseline test",
      );
      setIsGeneratingTest(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Candidate intake</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Tell us where you want to grow.</h1>
      <p className="mt-4 text-slate-600">
        Share your background and target role. Skillbridge will analyze your profile, identify your current skills, and surface the gaps to close next.
      </p>
      <form className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" name="name" placeholder="Ada Lovelace" type="text" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Target role</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" name="target_role" placeholder="Frontend Engineer" required type="text" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Bio</span>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2" name="bio_text" placeholder="Briefly describe your experience and goals." required />
        </label>
        <button className="rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isLoading || isGeneratingTest} type="submit">
          {isLoading ? "Analyzing profile..." : "Analyze skill gaps"}
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Skill gap summary</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {result.experience_level.charAt(0).toUpperCase() + result.experience_level.slice(1)} level candidate
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-slate-900">Current skills</h3>
              <ul className="mt-3 space-y-2 text-slate-700">
                {result.current_skills.map((skill) => (
                  <li className="rounded-lg bg-white px-3 py-2" key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Skills to build</h3>
              <ul className="mt-3 space-y-2 text-slate-700">
                {result.gap_skills.map((skill) => (
                  <li className="rounded-lg bg-white px-3 py-2" key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            className="mt-6 inline-flex rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isGeneratingTest}
            onClick={handleStartSkillTest}
            type="button"
          >
            {isGeneratingTest ? "Generating skill test..." : "Start skill test"}
          </button>
        </section>
      ) : null}
    </main>
  );
}
