import { z } from "zod";

import {
  calculateOverallProgress,
  phasesSchema,
  progressStatusSchema,
  type PhaseProgress,
} from "@/lib/progress";

export function buildPhaseProgress(phasesJson: unknown, progressRows: Array<{ phase_number: number; status: string }>) {
  const parsedPhases = phasesSchema.parse(phasesJson);
  const progressByPhase = new Map(
    progressRows.map((row) => [row.phase_number, progressStatusSchema.catch("not_started").parse(row.status)]),
  );

  return parsedPhases.map<PhaseProgress>((phase, index) => {
    const phaseNumber = index + 1;

    return {
      phaseNumber,
      title: phase.title,
      status: progressByPhase.get(phaseNumber) ?? "not_started",
    };
  });
}

const fitSummarySchema = z.object({
  summary: z.string().trim().min(1).max(180),
});

function extractJson(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

async function requestFitSummary(input: { targetRole: string; gapSkills: string[]; score: number }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `Strong ${input.targetRole} candidate with a ${input.score}% test score and clear growth areas to sponsor.`;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Write concise candidate fit summaries. Return JSON only.",
        },
        {
          role: "user",
          content: `Target role: ${input.targetRole}\nLatest score: ${input.score}\nSkill gaps: ${input.gapSkills.join(", ") || "None listed"}\n\nWrite one short line explaining why this candidate is a good sponsorship fit. Return {"summary": string}.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI fit summary request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenAI response did not include message content");
  }

  return fitSummarySchema.parse(JSON.parse(extractJson(content))).summary;
}

export async function getOrCreateFitSummary(input: {
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;
  candidateId: string;
  existingSummary: string | null;
  targetRole: string;
  gapSkills: string[];
  score: number;
}) {
  if (input.existingSummary?.trim()) {
    return input.existingSummary;
  }

  const summary = await requestFitSummary({
    targetRole: input.targetRole,
    gapSkills: input.gapSkills,
    score: input.score,
  });

  await input.supabase?.from("candidates").update({ fit_summary: summary }).eq("id", input.candidateId);

  return summary;
}

export function calculateCandidateProgress(phasesJson: unknown, progressRows: Array<{ phase_number: number; status: string }>) {
  return calculateOverallProgress(buildPhaseProgress(phasesJson, progressRows));
}
