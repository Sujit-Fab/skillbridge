import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePlanForCandidate } from "@/lib/plan-generation";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  candidate_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid request payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await generatePlanForCandidate(createClient(), payload.data.candidate_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Plan generation failed", error);

    return NextResponse.json(
      { error: "Unable to generate learning plan" },
      { status: 500 },
    );
  }
}
