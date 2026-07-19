import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { generatedTestSchema, type GeneratedTest } from "@/lib/test-schemas";

const requestSchema = z.object({
  candidate_id: z.string().uuid(),
});

function extractJson(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function buildPrompt(targetRole: string, gapSkills: string[], strict = false) {
  return [
    {
      role: "system",
      content: strict
        ? "You generate adaptive hiring baseline tests. Return only valid JSON matching the requested schema. Do not include markdown, comments, prose, or extra keys."
        : "You generate adaptive hiring baseline tests. Return strict JSON only.",
    },
    {
      role: "user",
      content: `Target role: ${targetRole}\nGap skills: ${gapSkills.join(", ")}\n\nGenerate 5-8 role-specific baseline test questions calibrated to the listed gap skills. Mix multiple_choice and short_answer questions when useful. Multiple choice questions must have 3-5 plausible options and a correct_answer exactly matching one option. Short answer questions must use options: null. Use stable string ids like q1.\n\nReturn JSON with exactly this shape: {"questions":[{"id": string, "question": string, "type": "multiple_choice" | "short_answer", "options": string[] | null, "correct_answer": string}]}`,
    },
  ];
}

async function requestGeneratedTest(targetRole: string, gapSkills: string[], strict = false): Promise<GeneratedTest> {
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
      messages: buildPrompt(targetRole, gapSkills, strict),
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

  return generatedTestSchema.parse(JSON.parse(extractJson(content)));
}

async function generateWithRetry(targetRole: string, gapSkills: string[]) {
  try {
    return await requestGeneratedTest(targetRole, gapSkills);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return requestGeneratedTest(targetRole, gapSkills, true);
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid request payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient();

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, target_role")
      .eq("id", payload.data.candidate_id)
      .single();

    if (candidateError) {
      throw candidateError;
    }

    const { data: skillGaps, error: skillGapsError } = await supabase
      .from("skill_gaps")
      .select("skill_name")
      .eq("candidate_id", payload.data.candidate_id);

    if (skillGapsError) {
      throw skillGapsError;
    }

    const gapSkills = skillGaps.map((gap) => gap.skill_name).filter(Boolean);

    if (gapSkills.length === 0) {
      return NextResponse.json(
        { error: "Candidate does not have skill gaps to test" },
        { status: 400 },
      );
    }

    const generatedTest = await generateWithRetry(candidate.target_role, gapSkills);

    const { data: test, error: testError } = await supabase
      .from("tests")
      .insert({
        candidate_id: payload.data.candidate_id,
        phase_number: 1,
        questions: generatedTest.questions,
      })
      .select("id, candidate_id, phase_number, questions, score")
      .single();

    if (testError) {
      throw testError;
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Test generation failed", error);

    return NextResponse.json(
      { error: "Unable to generate adaptive test" },
      { status: 500 },
    );
  }
}
