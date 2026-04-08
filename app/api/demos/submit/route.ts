import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { loomUrl, title, submitterName } = await request.json();

    if (!loomUrl || !title) {
      return NextResponse.json({ error: "loomUrl and title required" }, { status: 400 });
    }

    // Validate it's a Loom URL
    if (!/https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/.test(loomUrl)) {
      return NextResponse.json({ error: "Invalid Loom URL" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Get current voting period
    const { data: period } = await supabase
      .from("voting_periods")
      .select("id, opens_at, closes_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const isThisWeek = period && now >= new Date(period.opens_at) && now <= new Date(period.closes_at);

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        loom_url: loomUrl,
        title: title || "Untitled demo",
        submitter_name: submitterName || "Unknown",
        org_slug: "rnd",
        source_type: "project_update",
        source_id: `manual-${Date.now()}`,
        source_project_name: null,
        source_url: null,
        description: null,
        voting_period_id: isThisWeek ? period?.id : null,
        posted_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Manual submit error:", error);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, submission: data });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
