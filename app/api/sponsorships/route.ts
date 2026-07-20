import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  candidate_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid request payload", issues: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { candidate_id: candidateId, company_id: companyId } = payload.data;

  const { data: existing, error: existingError } = await supabase
    .from("sponsorships")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check sponsorship", { error: existingError, candidateId, companyId });
    return NextResponse.json({ error: "Unable to check sponsorship" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ sponsorship: existing, alreadyExists: true });
  }

  const { data: sponsorship, error: insertError } = await supabase
    .from("sponsorships")
    .insert({ candidate_id: candidateId, company_id: companyId, status: "active", amount_committed: 500 })
    .select("id, candidate_id, company_id, status, amount_committed")
    .single();

  if (insertError) {
    console.error("Failed to create sponsorship", { error: insertError, candidateId, companyId });
    return NextResponse.json({ error: "Unable to create sponsorship" }, { status: 500 });
  }

  return NextResponse.json({ sponsorship, alreadyExists: false });
}
