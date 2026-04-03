import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) { return handleClose(request); }
export async function POST(request: NextRequest) { return handleClose(request); }
async function handleClose(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Close any open voting periods whose closes_at has passed
    const now = new Date().toISOString();
    const { data: closedPeriods, error } = await supabase
      .from("voting_periods")
      .update({ status: "closed" })
      .eq("status", "open")
      .lte("closes_at", now)
      .select("id, week_label");

    if (error) {
      console.error("Error closing periods:", error);
      return NextResponse.json({ error: "Failed to close" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      closed: closedPeriods?.length ?? 0,
      periods: closedPeriods,
    });
  } catch (error) {
    console.error("Voting period close error:", error);
    return NextResponse.json({ error: "Close failed" }, { status: 500 });
  }
}
