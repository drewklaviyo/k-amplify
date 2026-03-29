import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();

    // Get the most recent voting period
    const { data: period, error } = await supabase
      .from("voting_periods")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !period) {
      return NextResponse.json({ period: null });
    }

    // Get awards for this period if announced
    let awards = null;
    if (period.status === "announced") {
      const { data: awardData } = await supabase
        .from("awards")
        .select("*, submissions(*)")
        .eq("voting_period_id", period.id);
      awards = awardData;
    }

    // Get previous period's awards (last week's winners)
    let previousAwards = null;
    const { data: prevPeriod } = await supabase
      .from("voting_periods")
      .select("*")
      .eq("status", "announced")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (prevPeriod && prevPeriod.id !== period.id) {
      const { data: prevAwardData } = await supabase
        .from("awards")
        .select("*, submissions(*)")
        .eq("voting_period_id", prevPeriod.id);
      previousAwards = prevAwardData;
    }

    return NextResponse.json({ period, awards, previousPeriod: prevPeriod?.id !== period.id ? prevPeriod : null, previousAwards });
  } catch (error) {
    console.error("Error fetching voting period:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
