import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  candidateId: z.string().uuid(),
});

type LikeRouteContext = {
  params: {
    candidateId: string;
  };
};

export async function POST(_request: Request, context: LikeRouteContext) {
  const parsedParams = paramsSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid candidate id", issues: parsedParams.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient();

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("likes_count")
      .eq("id", parsedParams.data.candidateId)
      .single();

    if (candidateError) {
      throw candidateError;
    }

    const likesCount = (candidate.likes_count ?? 0) + 1;

    const { data: updatedCandidate, error: updateError } = await supabase
      .from("candidates")
      .update({ likes_count: likesCount })
      .eq("id", parsedParams.data.candidateId)
      .select("likes_count")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ likes_count: updatedCandidate.likes_count ?? likesCount });
  } catch (error) {
    console.error("Unable to like candidate", error);

    return NextResponse.json(
      { error: "Unable to like candidate" },
      { status: 500 },
    );
  }
}
