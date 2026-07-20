import { z } from "zod";

export const generatedPlanSchema = z.object({
  phases: z.array(z.object({ title: z.string().min(1) })).min(1),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

type SupabaseClient = ReturnType<typeof import("@/lib/supabase/server").createClient>;

function extractJson(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function buildPrompt(input: {
  targetRole: string;
  gapSkills: string[];
  score: number | null;
  strict?: boolean;
}) {
  return [
    {
      role: "system",
      content: input.strict
        ? "You generate concise learning plans. Return only valid JSON matching the requested schema. Do not include markdown, comments, prose, or extra keys."
        : "You generate concise learning plans. Return strict JSON only.",
    },
    {
      role: "user",
      content: `Target role: ${input.targetRole}\nBaseline score: ${input.score ?? "not available"}\nGap skills: ${input.gapSkills.join(", ")}\n\nGenerate a practical 3-5 phase learning plan that addresses the gap skills and prepares the candidate for the target role. Each phase title should be specific and action-oriented.\n\nReturn JSON with exactly this shape: {"phases":[{"title": string}]}`,
    },
  ];
}

async function requestGeneratedPlan(input: {
  targetRole: string;
  gapSkills: string[];
  score: number | null;
  strict?: boolean;
}): Promise<GeneratedPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: buildPrompt(input),
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenAI response did not include message content");
  }

  return generatedPlanSchema.parse(JSON.parse(extractJson(content)));
}

async function generateWithRetry(input: { targetRole: string; gapSkills: string[]; score: number | null }) {
  try {
    return await requestGeneratedPlan(input);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return requestGeneratedPlan({ ...input, strict: true });
    }

    throw error;
  }
}

export async function generatePlanForCandidate(supabase: SupabaseClient, candidateId: string) {
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, target_role")
    .eq("id", candidateId)
    .single();

  if (candidateError) {
    throw candidateError;
  }

  const [{ data: skillGaps, error: skillGapsError }, { data: latestTest, error: testError }] = await Promise.all([
    supabase.from("skill_gaps").select("skill_name").eq("candidate_id", candidateId),
    supabase
      .from("tests")
      .select("score")
      .eq("candidate_id", candidateId)
      .not("score", "is", null)
      .order("phase_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (skillGapsError) {
    throw skillGapsError;
  }

  if (testError) {
    throw testError;
  }

  const gapSkills = (skillGaps ?? []).map((gap) => gap.skill_name).filter(Boolean);

  if (gapSkills.length === 0) {
    throw new Error("Candidate does not have skill gaps for a learning plan");
  }

  const generatedPlan = await generateWithRetry({
    targetRole: candidate.target_role,
    gapSkills,
    score: latestTest?.score ?? null,
  });

  const { error: deletePlanError } = await supabase.from("plans").delete().eq("candidate_id", candidateId);

  if (deletePlanError) {
    throw deletePlanError;
  }

  const { error: deleteProgressError } = await supabase.from("progress").delete().eq("candidate_id", candidateId);

  if (deleteProgressError) {
    throw deleteProgressError;
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({ candidate_id: candidateId, phases: generatedPlan.phases })
    .select("id, candidate_id, phases")
    .single();

  if (planError) {
    throw planError;
  }

  const progressRows = generatedPlan.phases.map((_phase, index) => ({
    candidate_id: candidateId,
    phase_number: index + 1,
    status: index === 0 ? "in_progress" : "not_started",
  }));

  const { data: progress, error: progressError } = await supabase
    .from("progress")
    .insert(progressRows)
    .select("id, candidate_id, phase_number, status");

  if (progressError) {
    throw progressError;
  }

  return { plan, progress };
}
