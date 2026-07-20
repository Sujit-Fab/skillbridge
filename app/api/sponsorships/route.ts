import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  candidate_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

const sponsorshipInsertSelect = "id, candidate_id, company_id, status, amount_committed";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rawInput = await request.json().catch((error: unknown) => {
    console.error("Sponsorship API received unreadable JSON", { requestId, error });
    return null;
  });

  console.info("Sponsorship API invoked", { requestId, input: rawInput });

  const payload = requestSchema.safeParse(rawInput);

  if (!payload.success) {
    console.error("Sponsorship API rejected invalid input", { requestId, input: rawInput, issues: payload.error.flatten() });
    return NextResponse.json({ error: "Invalid request payload", issues: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (!supabase) {
    console.error("Sponsorship API missing Supabase admin configuration", {
      requestId,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { candidate_id: candidateId, company_id: companyId } = payload.data;

  const { data: existing, error: existingError } = await supabase
    .from("sponsorships")
    .select(sponsorshipInsertSelect)
    .eq("candidate_id", candidateId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingError) {
    console.error("Sponsorship API failed to check for an existing sponsorship", { requestId, error: existingError, candidateId, companyId });
    return NextResponse.json({ error: "Unable to check sponsorship", details: existingError }, { status: 500 });
  }

  if (existing) {
    console.info("Sponsorship API found existing sponsorship", { requestId, sponsorship: existing });
    return NextResponse.json({ sponsorship: existing, alreadyExists: true });
  }

  const insertInput = { candidate_id: candidateId, company_id: companyId, status: "active", amount_committed: 500 };
  console.info("Sponsorship API inserting sponsorship", { requestId, input: insertInput });

  const { data: sponsorship, error: insertError } = await supabase
    .from("sponsorships")
    .insert(insertInput)
    .select(sponsorshipInsertSelect)
    .single();

  if (insertError) {
    console.error("Sponsorship API failed to create sponsorship", { requestId, input: insertInput, error: insertError });
    return NextResponse.json({ error: "Unable to create sponsorship", details: insertError }, { status: 500 });
  }

  if (!sponsorship?.id) {
    console.error("Sponsorship API insert completed without returning a sponsorship row", { requestId, input: insertInput, sponsorship });
    return NextResponse.json({ error: "Sponsorship insert did not return a created row" }, { status: 500 });
  }

  console.info("Sponsorship API created sponsorship", { requestId, sponsorship });
  return NextResponse.json({ sponsorship, alreadyExists: false });
}
