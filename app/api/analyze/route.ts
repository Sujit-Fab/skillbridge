import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const analysisSchema = z.object({
  current_skills: z.array(z.string().min(1)).default([]),
  gap_skills: z.array(z.string().min(1)).default([]),
  experience_level: z.enum(["entry", "junior", "mid", "senior"]),
}).strict();

const requestSchema = z.object({
  name: z.string().trim().min(1).optional(),
  bio_text: z.string().trim().min(20),
  target_role: z.string().trim().min(2),
});

type AnalysisResult = z.infer<typeof analysisSchema>;

function buildPrompt(bioText: string, targetRole: string, strict = false) {
  return [
    {
      role: "system",
      content: strict
        ? "You are a career skill-gap analyzer. Return only valid JSON matching the requested schema. Do not include markdown, comments, prose, or extra keys."
        : "You are a career skill-gap analyzer. Analyze the candidate bio against the target role and return strict JSON only.",
    },
    {
      role: "user",
      content: `Target role: ${targetRole}\n\nCandidate bio:\n${bioText}\n\nReturn JSON with exactly this shape: {"current_skills": string[], "gap_skills": string[], "experience_level": "entry" | "junior" | "mid" | "senior"}. Use concise skill names.`,
    },
  ];
}

function extractJson(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

async function requestAnalysis(bioText: string, targetRole: string, strict = false): Promise<AnalysisResult> {
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
      messages: buildPrompt(bioText, targetRole, strict),
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

  return analysisSchema.parse(JSON.parse(extractJson(content)));
}

async function analyzeWithRetry(bioText: string, targetRole: string) {
  try {
    return await requestAnalysis(bioText, targetRole);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return requestAnalysis(bioText, targetRole, true);
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

  const { name, bio_text: bioText, target_role: targetRole } = payload.data;

  try {
    const analysis = await analyzeWithRetry(bioText, targetRole);
    const supabase = createClient();

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        name: name ?? "Anonymous Candidate",
        bio_text: bioText,
        target_role: targetRole,
      })
      .select("id")
      .single();

    if (candidateError) {
      throw candidateError;
    }

    if (analysis.gap_skills.length > 0) {
      const { error: skillGapError } = await supabase.from("skill_gaps").insert(
        analysis.gap_skills.map((skillName) => ({
          candidate_id: candidate.id,
          skill_name: skillName,
          gap_level: {
            target_role: targetRole,
            experience_level: analysis.experience_level,
          },
        })),
      );

      if (skillGapError) {
        throw skillGapError;
      }
    }

    return NextResponse.json({
      candidate_id: candidate.id,
      ...analysis,
    });
  } catch (error) {
    console.error("Candidate analysis failed", error);

    return NextResponse.json(
      { error: "Unable to analyze candidate profile" },
      { status: 500 },
    );
  }
}
