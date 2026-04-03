// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

import { NextResponse } from "next/server";
import { computeDailyAnalytics } from "@/lib/analytics/compute-daily";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await computeDailyAnalytics();

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[compute-analytics] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
