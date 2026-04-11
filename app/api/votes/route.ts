import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getSessionEmail } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionEmail = await getSessionEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, category } = body;

    if (!submissionId || !category) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, category" },
        { status: 400 },
      );
    }

    if (!["builder", "learner"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'builder' or 'learner'" },
        { status: 400 },
      );
    }

    const email = sessionEmail.toLowerCase().trim();
    if (!email.endsWith("@klaviyo.com")) {
      return NextResponse.json(
        { error: "Must use a @klaviyo.com email" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    // Get the submission to find its voting period
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("id, voting_period_id")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (!submission.voting_period_id) {
      return NextResponse.json({ error: "Submission has no voting period" }, { status: 400 });
    }

    // Check that the voting period is open
    const { data: period } = await supabase
      .from("voting_periods")
      .select("id, status")
      .eq("id", submission.voting_period_id)
      .single();

    if (!period || period.status !== "open") {
      return NextResponse.json({ error: "Voting is closed for this period" }, { status: 400 });
    }

    // Upsert vote (unique constraint: user_email + category + voting_period_id)
    // This means casting a new vote in the same category replaces the old one
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .upsert(
        {
          user_email: email,
          user_name: email,
          submission_id: submissionId,
          category,
          voting_period_id: submission.voting_period_id,
        },
        { onConflict: "user_email,category,voting_period_id" },
      )
      .select()
      .single();

    if (voteError) {
      console.error("Vote error:", voteError);
      return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vote });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
