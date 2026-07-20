"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import type { TestQuestion } from "@/lib/test-schemas";

type TestFormProps = {
  candidateId: string;
  testId: string;
  questions: TestQuestion[];
};

type ScoreResult = {
  score: number;
  correct_count: number;
  total_questions: number;
};

export default function TestForm({ candidateId, testId, questions }: TestFormProps) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const answers = Object.fromEntries(
      questions.map((question) => [question.id, String(formData.get(question.id) ?? "")]),
    );

    try {
      const response = await fetch("/api/score-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId, answers }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to score test");
      }

      setResult(data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to score test");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {questions.map((question, index) => (
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={question.id}>
          <legend className="text-lg font-semibold text-slate-950">
            {index + 1}. {question.question}
          </legend>
          {question.type === "multiple_choice" && question.options ? (
            <div className="mt-4 space-y-3">
              {question.options.map((option) => (
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2" key={option}>
                  <input name={question.id} required type="radio" value={option} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-4 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              name={question.id}
              placeholder="Type your answer"
              required
            />
          )}
        </fieldset>
      ))}

      <button className="rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Scoring test..." : "Submit answers"}
      </button>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div> : null}
      {result ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-950">
          <p>
            Score: {result.score}% ({result.correct_count}/{result.total_questions} correct)
          </p>
          <Link
            className="mt-4 inline-flex rounded-full bg-brand-700 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-800"
            href={`/plan/${candidateId}`}
          >
            View your plan
          </Link>
        </div>
      ) : null}
    </form>
  );
}
