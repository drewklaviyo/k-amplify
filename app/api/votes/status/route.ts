import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ votes: [] });
    }

    const normalized = normalizeEmail(email);
    const supabase = createServerSupabase();

    // Get the current/latest open voting period
    const { data: period } = await supabase
      .from("voting_periods")
      .select("id")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!period) {
      return NextResponse.json({ votes: [] });
    }

    // Get user's votes for this period
    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("user_email", normalized)
      .eq("voting_period_id", period.id);

    return NextResponse.json({ votes: votes ?? [], periodId: period.id });
  } catch (error) {
    console.error("Error fetching vote status:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
