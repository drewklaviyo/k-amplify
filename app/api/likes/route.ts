import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Get like counts for submissions + whether current user liked them
export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get("email");
  const supabase = createServerSupabase();

  // Get all like counts grouped by submission
  const { data: counts } = await supabase
    .from("likes")
    .select("submission_id");

  const likeCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    likeCounts[row.submission_id] = (likeCounts[row.submission_id] ?? 0) + 1;
  }

  // Get user's likes if email provided
  let userLikes: string[] = [];
  if (userEmail) {
    const { data: ul } = await supabase
      .from("likes")
      .select("submission_id")
      .eq("user_email", userEmail);
    userLikes = (ul ?? []).map((r) => r.submission_id);
  }

  return NextResponse.json({ likeCounts, userLikes });
}

// Toggle a like
export async function POST(request: NextRequest) {
  try {
    const { submissionId, userEmail } = await request.json();
    if (!submissionId || !userEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Check if already liked
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("user_email", userEmail)
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      // Unlike
      await supabase.from("likes").delete().eq("id", existing.id);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from("likes").insert({ user_email: userEmail, submission_id: submissionId });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
