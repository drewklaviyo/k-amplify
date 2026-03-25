import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();

    // Get hours target from config
    const { data: targetConfig } = await supabase
      .from("config")
      .select("value")
      .eq("key", "hours_target")
      .single();

    const target = targetConfig?.value ? Number(targetConfig.value) : 501000;

    // Derive total hours from per-team hours_saved entries
    const { data: hoursRows, error } = await supabase
      .from("hours_saved")
      .select("org_slug, hours");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch hours" }, { status: 500 });
    }

    const currentHours = (hoursRows ?? []).reduce((sum, r) => sum + r.hours, 0);

    // Per-org breakdown
    const byOrg: Record<string, number> = {};
    for (const row of hoursRows ?? []) {
      byOrg[row.org_slug] = (byOrg[row.org_slug] ?? 0) + row.hours;
    }

    return NextResponse.json({
      currentHours,
      target,
      percentage: target > 0 ? Math.round((currentHours / target) * 100) : 0,
      byOrg,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
