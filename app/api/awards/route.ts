import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { isAdminEmail, normalizeEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const periodId = request.nextUrl.searchParams.get("periodId");

    let query = supabase
      .from("awards")
      .select("*, submissions(*)")
      .order("created_at", { ascending: false });

    if (periodId) {
      query = query.eq("voting_period_id", periodId);
    }

    const { data: awards, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
    }

    return NextResponse.json({ awards: awards ?? [] });
  } catch (error) {
    console.error("Error fetching awards:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminEmail, awards: awardEntries } = body;

    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServerSupabase();

    const results = [];
    for (const entry of awardEntries) {
      const { submissionId, votingPeriodId, category, voteCount, winnerName, goatName } = entry;

      const { data, error } = await supabase
        .from("awards")
        .upsert(
          {
            submission_id: submissionId,
            voting_period_id: votingPeriodId,
            category,
            vote_count: voteCount,
            winner_name: winnerName,
            goat_name: goatName ?? null,
          },
          { onConflict: "voting_period_id,category" },
        )
        .select()
        .single();

      if (error) {
        console.error("Award upsert error:", error);
      } else {
        results.push(data);
      }
    }

    // Mark the voting period as announced
    if (awardEntries.length > 0) {
      await supabase
        .from("voting_periods")
        .update({ status: "announced" })
        .eq("id", awardEntries[0].votingPeriodId);
    }

    return NextResponse.json({ ok: true, awards: results });
  } catch (error) {
    console.error("Award creation error:", error);
    return NextResponse.json({ error: "Failed to create awards" }, { status: 500 });
  }
}
