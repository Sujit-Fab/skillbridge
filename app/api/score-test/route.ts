import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePlanForCandidate } from "@/lib/plan-generation";
import { createClient } from "@/lib/supabase/server";
import { generatedTestSchema } from "@/lib/test-schemas";

const requestSchema = z.object({
  test_id: z.string().uuid(),
  answers: z.record(z.string().trim().min(1)),
});

function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ").toLowerCase();
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

    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id, candidate_id, questions")
      .eq("id", payload.data.test_id)
      .single();

    if (testError) {
      throw testError;
    }

    const parsedTest = generatedTestSchema.parse({ questions: test.questions });
    const results = parsedTest.questions.map((question) => {
      const submittedAnswer = payload.data.answers[question.id] ?? "";
      const isCorrect = normalizeAnswer(submittedAnswer) === normalizeAnswer(question.correct_answer);

      return {
        question_id: question.id,
        submitted_answer: submittedAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
      };
    });

    const correctCount = results.filter((result) => result.is_correct).length;
    const score = Math.round((correctCount / parsedTest.questions.length) * 100);

    const { error: updateError } = await supabase
      .from("tests")
      .update({ score })
      .eq("id", payload.data.test_id);

    if (updateError) {
      throw updateError;
    }

    const generatedPlan = await generatePlanForCandidate(supabase, test.candidate_id);

    return NextResponse.json({
      test_id: payload.data.test_id,
      score,
      correct_count: correctCount,
      total_questions: parsedTest.questions.length,
      results,
      plan: generatedPlan.plan,
      progress: generatedPlan.progress,
    });
  } catch (error) {
    console.error("Test scoring failed", error);

    return NextResponse.json(
      { error: "Unable to score test" },
      { status: 500 },
    );
  }
}
